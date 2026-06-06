import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { query, cleanupAndReindexItems } from "../../../db";
import { parseDOMetadata } from "../../../utils/parser";

export async function POST(req: NextRequest) {
  try {
    const { filename, engine } = await req.json();
    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFile = path.basename(filename);

    // 1. Resolve path to the public assets folder or fallback to /uploads
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

    // Read file and compute content hash
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 2. Check if document exists in database (by filename OR hash) and is already parsed for this engine
    const checkRes = await query(
      "SELECT id, layout_parsing_result FROM documents WHERE (filename = $1 OR file_hash = $2) AND engine = $3 AND parsed = true AND layout_parsing_result IS NOT NULL",
      [safeFile, fileHash, engine || "paddleocr"]
    );

    if (checkRes.rowCount && checkRes.rowCount > 0) {
      const doc = checkRes.rows[0];
      const docId = doc.id;
      const pipelineResult = doc.layout_parsing_result;

      // Clean up and re-index invalid items first
      await cleanupAndReindexItems(docId);

      // Fetch items
      const itemsRes = await query(
        `SELECT row_index, 
                kode_barang, nama_barang, banyak, jumlah, 
                is_flagged, remark 
         FROM ocr_items 
         WHERE document_id = $1 
         ORDER BY row_index`,
        [docId]
      );

      const items = itemsRes.rows.map(row => ({
        kodeBarang: row.kode_barang,
        namaBarang: row.nama_barang,
        banyak: row.banyak,
        jumlah: row.jumlah
      }));

      const flagged: Record<number, boolean> = {};
      const remarks: Record<number, string> = {};

      itemsRes.rows.forEach(row => {
        if (row.is_flagged) {
          flagged[row.row_index] = true;
        }
        if (row.remark && row.remark.trim()) {
          remarks[row.row_index] = row.remark;
        }
      });

      return NextResponse.json({
        errorCode: 0,
        errorMsg: "Success",
        result: pipelineResult,
        items,
        flagged,
        remarks
      });
    }

    const b64 = fileBuffer.toString("base64");

    // Form payload
    const payload = {
      file: b64,
      matchHistoryJob: false,
      useLayoutDetection: true,
      fileType: 1,
      useDocUnwarping: false,
      useDocOrientationClassify: false
    };

    // Post to the selected Pipeline API engine
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
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `Pipeline API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();

    // If it was parsed from /uploads, save the JSON result on disk for fallback/compatibility
    if (isUpload) {
      fs.writeFileSync(`${filePath}.json`, JSON.stringify(data, null, 2));
    }

    // 3. Save to database
    try {
      const pipelineResult = data.result || data;
      const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
      const markdownText = page0?.markdown?.text || "";
      const docMetadata = parseDOMetadata(markdownText);

      const stats = fs.statSync(filePath);

      const insertDocRes = await query(`
        INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (filename, engine) DO UPDATE
        SET upload_time = EXCLUDED.upload_time,
            size = EXCLUDED.size,
            parsed = EXCLUDED.parsed,
            metadata = EXCLUDED.metadata,
            layout_parsing_result = EXCLUDED.layout_parsing_result,
            is_sample = EXCLUDED.is_sample,
            file_hash = EXCLUDED.file_hash
        RETURNING id
      `, [
        safeFile,
        stats.mtime,
        stats.size,
        true,
        JSON.stringify(docMetadata),
        JSON.stringify(pipelineResult),
        isSample,
        fileHash,
        engine || "paddleocr"
      ]);

      const docId = insertDocRes.rows[0].id;

      // Delete existing items for this document to avoid unique constraints / stale data
      await query("DELETE FROM ocr_items WHERE document_id = $1", [docId]);

      for (let i = 0; i < docMetadata.items.length; i++) {
        const item = docMetadata.items[i];
        await query(`
          INSERT INTO ocr_items (
            document_id, row_index, 
            kode_barang_original, kode_barang, 
            nama_barang, 
            banyak_original, banyak, 
            jumlah_original, jumlah, 
            is_flagged, remark
          )
          VALUES ($1, $2, $3, $3, $4, $5, $5, $6, $6, false, '')
        `, [
          docId,
          i,
          item.kodeBarang,
          item.namaBarang,
          item.banyak,
          item.jumlah
        ]);
      }
      
      // Return wrapped success response with items, flagged, remarks
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
