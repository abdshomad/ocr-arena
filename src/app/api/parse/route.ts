import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { query, cleanupAndReindexItems } from "../../../db";
import { parseDOMetadata } from "../../../utils/parser";

async function saveToDocuments({
  filename,
  mtime,
  size,
  parsed,
  metadata,
  layoutResult,
  isSample,
  fileHash,
  engine,
  ocrStartTime,
  ocrEndTime,
  ocrElapsedMs
}: any) {
  return query(`
    INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (filename, engine) DO UPDATE
    SET upload_time = EXCLUDED.upload_time,
        size = EXCLUDED.size,
        parsed = EXCLUDED.parsed,
        metadata = EXCLUDED.metadata,
        layout_parsing_result = EXCLUDED.layout_parsing_result,
        is_sample = EXCLUDED.is_sample,
        file_hash = EXCLUDED.file_hash,
        ocr_start_time = EXCLUDED.ocr_start_time,
        ocr_end_time = EXCLUDED.ocr_end_time,
        ocr_elapsed_ms = EXCLUDED.ocr_elapsed_ms
    RETURNING id
  `, [
    filename,
    mtime || new Date(),
    size,
    parsed,
    metadata ? JSON.stringify(metadata) : null,
    layoutResult ? JSON.stringify(layoutResult) : null,
    isSample,
    fileHash,
    engine || "paddleocr",
    ocrStartTime,
    ocrEndTime,
    ocrElapsedMs
  ]);
}

export async function POST(req: NextRequest) {
  try {
    const { filename, engine } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFile = path.basename(filename);

    let filePath = path.join(process.cwd(), "public", "arena", safeFile);
    let isUpload = false;
    let isSample = true;
    
    if (!fs.existsSync(filePath)) {
      filePath = path.join("/uploads", safeFile);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }
      isUpload = true;
      isSample = false;
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    const checkRes = await query(
      "SELECT id, layout_parsing_result, is_accurate, is_loved, rating_stars, ocr_remarks, is_fast FROM documents WHERE (filename = $1 OR file_hash = $2) AND engine = $3 AND parsed = true AND layout_parsing_result IS NOT NULL",
      [safeFile, fileHash, engine || "paddleocr"]
    );

    if (checkRes.rowCount && checkRes.rowCount > 0) {
      const doc = checkRes.rows[0];
      const docId = doc.id;
      const pipelineResult = doc.layout_parsing_result;

      await cleanupAndReindexItems(docId);

      const freshRes = await query("SELECT metadata FROM documents WHERE id = $1", [docId]);
      const metadata = freshRes.rows[0]?.metadata || {};

      const rawItems = metadata.items || [];
      const items = rawItems.map((item: any) => ({
        kodeBarang: item.kodeBarang || item.kode_barang || "",
        namaBarang: item.namaBarang || item.nama_barang || "",
        banyak: item.banyak || "",
        jumlah: item.jumlah || ""
      }));

      const flagged = metadata.flagged || {};
      const remarks = metadata.remarks || {};

      return NextResponse.json({
        errorCode: 0,
        errorMsg: "Success",
        result: pipelineResult,
        items,
        flagged,
        remarks,
        isAccurate: doc.is_accurate,
        isLoved: doc.is_loved,
        ratingStars: doc.rating_stars,
        ocrRemarks: doc.ocr_remarks,
        isFast: doc.is_fast
      });
    }

    const b64 = fileBuffer.toString("base64");
    const payload = {
      file: b64,
      matchHistoryJob: false,
      useLayoutDetection: true,
      fileType: 1,
      useDocUnwarping: false,
      useDocOrientationClassify: false
    };

    let pipelineUrl = process.env.PIPELINE_PADDLEOCR_URL || process.env.PIPELINE_URL || "http://ocr-pipeline-paddleocr:8090/layout-parsing";
    if (engine === "nemotron") {
      pipelineUrl = process.env.PIPELINE_NEMOTRON_URL || "http://ocr-pipeline-nemotron:8091/layout-parsing";
    } else if (engine === "llama3-vision") {
      pipelineUrl = process.env.PIPELINE_LLAMA3_VISION_URL || "http://ocr-pipeline-llama3-vision:8092/layout-parsing";
    } else if (engine === "deepseek-vl2") {
      pipelineUrl = process.env.PIPELINE_DEEPSEEK_VL2_URL || "http://ocr-pipeline-deepseek-vl2:8093/layout-parsing";
    } else if (engine === "deepseek-ocr-2") {
      pipelineUrl = process.env.PIPELINE_DEEPSEEK_OCR_2_URL || "http://ocr-deepseek-ocr-2:8122/layout-parsing";
    } else if (engine === "lighton-ocr-2-1b") {
      pipelineUrl = process.env.PIPELINE_LIGHTON_OCR_2_1B_URL || "http://ocr-lighton-ocr-2-1b:8123/layout-parsing";
    } else if (engine === "dots-ocr") {
      pipelineUrl = process.env.PIPELINE_DOTS_OCR_URL || "http://ocr-dots-ocr:8124/layout-parsing";
    } else if (engine === "glm-ocr") {
      pipelineUrl = process.env.PIPELINE_GLM_OCR_URL || "http://ocr-glm-ocr:8125/layout-parsing";
    }
    
    console.log(`Forwarding request to pipeline API (${engine || "default"}): ${pipelineUrl}`);
    const ocrStartTime = new Date();
    const startTimeMs = Date.now();

    let response;
    try {
      response = await fetch(pipelineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      const ocrEndTime = new Date();
      const ocrElapsedMs = Date.now() - startTimeMs;
      const stats = fs.statSync(filePath);
      try {
        await saveToDocuments({
          filename: safeFile,
          mtime: stats.mtime,
          size: stats.size,
          parsed: false,
          metadata: null,
          layoutResult: { error: err.message || "Failed to fetch pipeline" },
          isSample,
          fileHash,
          engine,
          ocrStartTime,
          ocrEndTime,
          ocrElapsedMs
        });
      } catch (dbErr) {
        console.error("Database save failed during parse OCR fetch failure:", dbErr);
      }
      return NextResponse.json({ error: `Pipeline API fetch error: ${err.message}` }, { status: 500 });
    }

    const ocrEndTime = new Date();
    const ocrElapsedMs = Date.now() - startTimeMs;

    if (!response.ok) {
      const errText = await response.text();
      const stats = fs.statSync(filePath);
      try {
        await saveToDocuments({
          filename: safeFile,
          mtime: stats.mtime,
          size: stats.size,
          parsed: false,
          metadata: null,
          layoutResult: { error: errText },
          isSample,
          fileHash,
          engine,
          ocrStartTime,
          ocrEndTime,
          ocrElapsedMs
        });
      } catch (dbErr) {
        console.error("Database save failed during parse OCR status failure:", dbErr);
      }
      return NextResponse.json({ error: `Pipeline API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();

    if (isUpload) {
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(data, null, 2));
    }

    try {
      const pipelineResult = data.result || data;
      const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
      const markdownText = page0?.markdown?.text || "";
      const docMetadata = parseDOMetadata(markdownText);
      const stats = fs.statSync(filePath);

      await saveToDocuments({
        filename: safeFile,
        mtime: stats.mtime,
        size: stats.size,
        parsed: true,
        metadata: docMetadata,
        layoutResult: pipelineResult,
        isSample,
        fileHash,
        engine,
        ocrStartTime,
        ocrEndTime,
        ocrElapsedMs
      });

      return NextResponse.json({
        errorCode: 0,
        errorMsg: "Success",
        result: pipelineResult,
        items: docMetadata.items,
        flagged: {},
        remarks: {}
      });
    } catch (dbErr) {
      console.error("Database save failed during parse (falling back):", dbErr);
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error("Error in parse API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
