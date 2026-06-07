/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { query } from "../../../db";
import { parseDOMetadata } from "../../../utils/parser";

async function logArenaRun(image: any, engine: string | undefined, status: string, ocrResult: string, startTime: Date, endTime: Date, elapsedMs: number) {
  try {
    const loggedImagePath = (typeof image === "string" && image.startsWith("data:")) ? `[Base64 Upload: ${image.length} chars]` : image;
    await query(
      `INSERT INTO arena_runs (image_path, engine, status, ocr_result, time_elapsed_ms, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [loggedImagePath || "unknown", engine || "unknown", status, ocrResult, elapsedMs, startTime, endTime]
    );
  } catch (dbErr) {
    console.error(`Failed to log ${status} to arena_runs:`, dbErr);
  }
}

async function saveToDocuments(params: any) {
  const { filename, size, parsed, metadata, layoutResult, isSample, fileHash, engine, ocrStartTime, ocrEndTime, elapsedMs } = params;
  await query(`
    INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (filename, engine) DO UPDATE
    SET upload_time = EXCLUDED.upload_time, size = EXCLUDED.size, parsed = EXCLUDED.parsed,
        metadata = EXCLUDED.metadata, layout_parsing_result = EXCLUDED.layout_parsing_result,
        is_sample = EXCLUDED.is_sample, file_hash = EXCLUDED.file_hash,
        ocr_start_time = EXCLUDED.ocr_start_time, ocr_end_time = EXCLUDED.ocr_end_time, ocr_elapsed_ms = EXCLUDED.ocr_elapsed_ms
  `, [filename, new Date(), size, parsed, metadata ? JSON.stringify(metadata) : null, layoutResult ? JSON.stringify(layoutResult) : null, isSample, fileHash, engine, ocrStartTime, ocrEndTime, elapsedMs]);
}

async function handleOcrError({ image, engine, filename, errorMsg, ocrStartTime, ocrEndTime, elapsedMs, imageBuffer, fileHash, status = 500 }: any) {
  await logArenaRun(image, engine, "failed", errorMsg, ocrStartTime, ocrEndTime, elapsedMs);
  try {
    const isSample = typeof image === "string" && (image.startsWith("/arena/") || image.startsWith("arena/"));
    const size = imageBuffer ? imageBuffer.length : (image && typeof image === "string" && image.startsWith("data:") ? image.length : 0);
    await saveToDocuments({ filename, size, parsed: false, metadata: null, layoutResult: { error: errorMsg }, isSample, fileHash, engine: engine || "paddleocr", ocrStartTime, ocrEndTime, elapsedMs });
  } catch (dbErr) {
    console.error("Failed to save failed arena run:", dbErr);
  }
  return NextResponse.json({ success: false, error: errorMsg, elapsedMs }, { status });
}

export async function handlePostArena(req: NextRequest) {
  const ocrStartTime = new Date();
  const startTimeMs = Date.now();
  let engine: string | undefined, image: string | undefined, filename: string | undefined;
  let imageBuffer: Buffer | undefined, fileHash: string | undefined;

  try {
    const body = await req.json().catch(() => ({}));
    engine = body.engine; image = body.image; filename = body.filename;

    if (!engine || !image) return NextResponse.json({ error: "Missing engine or image" }, { status: 400 });

    if (!filename) {
      filename = (typeof image === "string" && (image.startsWith("/arena/") || image.startsWith("arena/") || image.startsWith("/uploads/") || image.startsWith("uploads/")))
        ? path.basename(image) : `arena-upload-${Date.now()}.jpg`;
    }

    let base64Image = "";
    if (typeof image === "string" && (image.startsWith("/arena/") || image.startsWith("arena/"))) {
      const filePath = path.join(process.cwd(), "public", image.startsWith("/") ? image.slice(1) : image);
      if (!fs.existsSync(filePath)) return NextResponse.json({ error: `File not found on server: ${image}` }, { status: 404 });
      imageBuffer = fs.readFileSync(filePath);
      base64Image = imageBuffer.toString("base64");
    } else if (typeof image === "string" && image.startsWith("data:")) {
      const base64Data = image.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
      base64Image = base64Data;
    } else if (typeof image === "string") {
      base64Image = image; imageBuffer = Buffer.from(image, "base64");
    } else {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    fileHash = crypto.createHash("sha256").update(imageBuffer).digest("hex");

    const urls: Record<string, string> = {
      nemotron: process.env.PIPELINE_NEMOTRON_URL || "http://ocr-pipeline-nemotron:8091/layout-parsing",
      "llama3-vision": process.env.PIPELINE_LLAMA3_VISION_URL || "http://ocr-pipeline-llama3-vision:8092/layout-parsing",
      "deepseek-vl2": process.env.PIPELINE_DEEPSEEK_VL2_URL || "http://ocr-pipeline-deepseek-vl2:8093/layout-parsing",
      deepseek: process.env.PIPELINE_DEEPSEEK_OCR_2_URL || "http://ocr-deepseek-ocr-2:8122/layout-parsing",
      "deepseek-ocr-2": process.env.PIPELINE_DEEPSEEK_OCR_2_URL || "http://ocr-deepseek-ocr-2:8122/layout-parsing",
      "lighton-ocr-2-1b": process.env.PIPELINE_LIGHTON_OCR_2_1B_URL || "http://ocr-lighton-ocr-2-1b:8123/layout-parsing",
      lightonocr: process.env.PIPELINE_LIGHTON_OCR_2_1B_URL || "http://ocr-lighton-ocr-2-1b:8123/layout-parsing",
      "dots-ocr": process.env.PIPELINE_DOTS_OCR_URL || "http://ocr-dots-ocr:8124/layout-parsing",
      dots: process.env.PIPELINE_DOTS_OCR_URL || "http://ocr-dots-ocr:8124/layout-parsing",
      "glm-ocr": process.env.PIPELINE_GLM_OCR_URL || "http://ocr-glm-ocr:8125/layout-parsing",
      glm: process.env.PIPELINE_GLM_OCR_URL || "http://ocr-glm-ocr:8125/layout-parsing",
      chandra: process.env.PIPELINE_CHANDRA_URL || "http://ocr-chandra:8126/layout-parsing",
      gemma4: process.env.PIPELINE_GEMMA4_URL || "http://ocr-gemma4:8127/layout-parsing",
      qwen3vl: process.env.PIPELINE_QWEN3VL_URL || "http://ocr-qwen3vl:8128/layout-parsing",
      litparse: process.env.PIPELINE_LITPARSE_URL || "http://ocr-engine-litparse:8129/layout-parsing",
      "mineru-diffusion": process.env.PIPELINE_MINERU_URL || "http://ocr-mineru-diffusion:8130/layout-parsing",
    };
    const pipelineUrl = urls[engine] || process.env.PIPELINE_PADDLEOCR_URL || "http://ocr-pipeline-paddleocr:8090/layout-parsing";

    console.log(`Arena posting to backend ${engine}: ${pipelineUrl}`);
    let response;
    try {
      response = await fetch(pipelineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          file: base64Image, matchHistoryJob: false, useLayoutDetection: true, fileType: 1, useDocUnwarping: false, useDocOrientationClassify: false
        })
      });
    } catch (fetchErr: any) {
      const ocrEndTime = new Date();
      const elapsedMs = Date.now() - startTimeMs;
      return await handleOcrError({ image, engine, filename, errorMsg: fetchErr.message || "Failed to fetch pipeline", ocrStartTime, ocrEndTime, elapsedMs, imageBuffer, fileHash });
    }

    const ocrEndTime = new Date();
    const elapsedMs = Date.now() - startTimeMs;

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = errText;
      try {
        const errJson = JSON.parse(errText);
        errorMsg = errJson.errorMsg || errJson.error || errText;
      } catch {}
      return await handleOcrError({ image, engine, filename, errorMsg, ocrStartTime, ocrEndTime, elapsedMs, imageBuffer, fileHash, status: response.status });
    }

    const data = await response.json();
    const pipelineResult = data.result || data;
    const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
    const outputText = page0?.markdown?.text || "";

    await logArenaRun(image, engine, "done", outputText, ocrStartTime, ocrEndTime, elapsedMs);

    try {
      const isSample = typeof image === "string" && (image.startsWith("/arena/") || image.startsWith("arena/"));
      const docMetadata = parseDOMetadata(outputText);
      await saveToDocuments({ filename, size: imageBuffer.length, parsed: true, metadata: docMetadata, layoutResult: pipelineResult, isSample, fileHash, engine: engine || "paddleocr", ocrStartTime, ocrEndTime, elapsedMs });
    } catch (dbErr) {
      console.error("Failed to save successful arena run:", dbErr);
    }

    return NextResponse.json({ success: true, text: outputText, elapsedMs, rawResult: pipelineResult });

  } catch (error: any) {
    console.error("OCR Arena proxy error:", error);
    const ocrEndTime = new Date();
    const elapsedMs = Date.now() - startTimeMs;
    return await handleOcrError({ image, engine, filename, errorMsg: error.message || "Failed to process OCR request", ocrStartTime, ocrEndTime, elapsedMs, imageBuffer, fileHash });
  }
}
