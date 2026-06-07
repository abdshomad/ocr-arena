import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { query } from "../../../db";
import { parseDOMetadata } from "../../../utils/parser";

const UPLOADS_DIR = "/uploads";

export async function POST(req: NextRequest) {
  try {
    // Ensure uploads directory exists
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const originalName = file instanceof File ? file.name : "document.jpg";
    // Sanitize filename to avoid directory traversal
    const safeName = path.basename(originalName).replace(/\s+/g, "_");
    const filename = `${Date.now()}-${safeName}`;
    const filePath = path.join(UPLOADS_DIR, filename);

    // Save file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Compute hash to check for duplicate content
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    // Check if same content already exists in database
    const dupRes = await query(
      "SELECT filename, layout_parsing_result FROM documents WHERE file_hash = $1",
      [fileHash]
    );

    if (dupRes.rowCount && dupRes.rowCount > 0) {
      const existingDoc = dupRes.rows[0];
      console.log(`Uploaded file matches existing database record (file_hash: ${fileHash}). Reusing existing file: ${existingDoc.filename}`);
      return NextResponse.json({
        filename: existingDoc.filename,
        result: existingDoc.layout_parsing_result,
        alreadyExists: true
      });
    }

    fs.writeFileSync(filePath, buffer);

    // Convert to base64 for pipeline API
    const b64 = buffer.toString("base64");

    // Form payload
    const payload = {
      file: b64,
      matchHistoryJob: false,
      useLayoutDetection: true,
      fileType: 1,
      useDocUnwarping: false,
      useDocOrientationClassify: false
    };

    const pipelineUrl = process.env.PIPELINE_URL || "http://paddleocr-pipeline-api:8090/layout-parsing";
    console.log(`Forwarding uploaded file ${filename} to pipeline: ${pipelineUrl}`);

    const ocrStartTime = new Date();
    const startTimeMs = Date.now();

    let response;
    try {
      response = await fetch(pipelineUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (err: any) {
      const ocrEndTime = new Date();
      const ocrElapsedMs = Date.now() - startTimeMs;
      try {
        await query(`
          INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          filename,
          new Date(),
          buffer.length,
          false,
          null,
          JSON.stringify({ error: err.message || "Failed to fetch pipeline" }),
          false,
          fileHash,
          "paddleocr",
          ocrStartTime,
          ocrEndTime,
          ocrElapsedMs
        ]);
      } catch (dbErr) {
        console.error("Database save failed during upload OCR fetch failure:", dbErr);
      }
      return NextResponse.json({ error: `Pipeline API fetch error: ${err.message}` }, { status: 500 });
    }

    const ocrEndTime = new Date();
    const ocrElapsedMs = Date.now() - startTimeMs;

    if (!response.ok) {
      const errText = await response.text();
      try {
        await query(`
          INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        `, [
          filename,
          new Date(),
          buffer.length,
          false,
          null,
          JSON.stringify({ error: errText }),
          false,
          fileHash,
          "paddleocr",
          ocrStartTime,
          ocrEndTime,
          ocrElapsedMs
        ]);
      } catch (dbErr) {
        console.error("Database save failed during upload OCR status failure:", dbErr);
      }
      return NextResponse.json({ error: `Pipeline API error: ${errText}` }, { status: response.status });
    }

    const data = await response.json();

    // Save JSON extraction result
    const jsonPath = `${filePath}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));

    // Save to PostgreSQL database
    try {
      const pipelineResult = data.result || data;
      const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
      const markdownText = page0?.markdown?.text || "";
      const docMetadata = parseDOMetadata(markdownText);

      const insertDocRes = await query(`
        INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample, file_hash, engine, ocr_start_time, ocr_end_time, ocr_elapsed_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id
      `, [
        filename,
        new Date(),
        buffer.length,
        true,
        JSON.stringify(docMetadata),
        JSON.stringify(pipelineResult),
        false,
        fileHash,
        "paddleocr",
        ocrStartTime,
        ocrEndTime,
        ocrElapsedMs
      ]);

      const docId = insertDocRes.rows[0].id;
    } catch (dbErr) {
      console.error("Database save failed during upload (falling back to file):", dbErr);
    }

    return NextResponse.json({
      filename,
      result: data
    });
  } catch (error: unknown) {
    console.error("Error in upload API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
