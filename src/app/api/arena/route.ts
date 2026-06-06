/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { query } from "../../../db";

export const maxDuration = 120; // Allow up to 120 seconds for slow model inference

async function logArenaRun(
  image: any,
  engine: string | undefined,
  status: string,
  ocrResult: string,
  elapsedMs: number
) {
  try {
    const loggedImagePath = (typeof image === "string" && image.startsWith("data:"))
      ? `[Base64 Upload: ${image.length} chars]`
      : image;
    await query(
      `INSERT INTO arena_runs (image_path, engine, status, ocr_result, time_elapsed_ms)
       VALUES ($1, $2, $3, $4, $5)`,
      [loggedImagePath || "unknown", engine || "unknown", status, ocrResult, elapsedMs]
    );
  } catch (dbErr) {
    console.error(`Failed to log ${status} to arena_runs:`, dbErr);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || "list";
    const runId = searchParams.get("runId");

    if (runId) {
      const runRes = await query(`
        SELECT 
          r.id, 
          r.image_path, 
          r.engine, 
          r.status, 
          r.ocr_result, 
          r.time_elapsed_ms, 
          r.created_at,
          COALESCE(
            (
              SELECT jsonb_array_length(d.layout_parsing_result->'layoutParsingResults')
              FROM documents d
              WHERE d.filename = r.image_path 
                 OR '/arena/' || d.filename = r.image_path 
                 OR '/uploads/' || d.filename = r.image_path
                 OR r.image_path = '/arena/' || d.filename
                 OR r.image_path = '/uploads/' || d.filename
              LIMIT 1
            ),
            1
          )::integer as page_count,
          (
            SELECT d.metadata
            FROM documents d
            WHERE d.filename = r.image_path 
               OR '/arena/' || d.filename = r.image_path 
               OR '/uploads/' || d.filename = r.image_path
               OR r.image_path = '/arena/' || d.filename
               OR r.image_path = '/uploads/' || d.filename
            LIMIT 1
          ) as doc_metadata
        FROM arena_runs r
        WHERE r.id = $1
      `, [parseInt(runId)]);
      
      if (runRes.rowCount === 0) {
        return NextResponse.json({ success: false, error: "Run not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, run: runRes.rows[0] });
    }

    if (action === "stats") {
      const statsRes = await query(`
        SELECT 
          engine,
          COUNT(*)::integer as total_runs,
          COUNT(CASE WHEN status = 'done' THEN 1 END)::integer as success_runs,
          COUNT(CASE WHEN status = 'failed' THEN 1 END)::integer as failed_runs,
          ROUND(AVG(CASE WHEN status = 'done' THEN time_elapsed_ms END))::integer as avg_time_ms,
          MIN(CASE WHEN status = 'done' THEN time_elapsed_ms END)::integer as min_time_ms,
          MAX(CASE WHEN status = 'done' THEN time_elapsed_ms END)::integer as max_time_ms,
          ROUND(percentile_cont(0.5) WITHIN GROUP (ORDER BY CASE WHEN status = 'done' THEN time_elapsed_ms END))::integer as p50_time_ms,
          ROUND(percentile_cont(0.9) WITHIN GROUP (ORDER BY CASE WHEN status = 'done' THEN time_elapsed_ms END))::integer as p90_time_ms,
          ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY CASE WHEN status = 'done' THEN time_elapsed_ms END))::integer as p99_time_ms
        FROM arena_runs
        GROUP BY engine
      `);
      return NextResponse.json({ success: true, stats: statsRes.rows });
    }

    const limit = parseInt(searchParams.get("limit") || "100");
    const runsRes = await query(`
      SELECT 
        r.id, 
        r.image_path, 
        r.engine, 
        r.status, 
        r.ocr_result, 
        r.time_elapsed_ms, 
        r.created_at,
        COALESCE(
          (
            SELECT jsonb_array_length(d.layout_parsing_result->'layoutParsingResults')
            FROM documents d
            WHERE d.filename = r.image_path 
               OR '/arena/' || d.filename = r.image_path 
               OR '/uploads/' || d.filename = r.image_path
               OR r.image_path = '/arena/' || d.filename
               OR r.image_path = '/uploads/' || d.filename
            LIMIT 1
          ),
          1
        )::integer as page_count,
        (
          SELECT d.size
          FROM documents d
          WHERE d.filename = r.image_path 
             OR '/arena/' || d.filename = r.image_path 
             OR '/uploads/' || d.filename = r.image_path
             OR r.image_path = '/arena/' || d.filename
             OR r.image_path = '/uploads/' || d.filename
          LIMIT 1
        )::integer as file_size,
        (
          SELECT d.metadata
          FROM documents d
          WHERE d.filename = r.image_path 
             OR '/arena/' || d.filename = r.image_path 
             OR '/uploads/' || d.filename = r.image_path
             OR r.image_path = '/arena/' || d.filename
             OR r.image_path = '/uploads/' || d.filename
          LIMIT 1
        ) as doc_metadata
      FROM arena_runs r
      ORDER BY r.created_at DESC
      LIMIT $1
    `, [limit]);

    return NextResponse.json({ success: true, runs: runsRes.rows });
  } catch (error: any) {
    console.error("Failed to fetch arena runs/stats:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let engine: string | undefined, image: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    engine = body.engine;
    image = body.image;

    if (!engine || !image) {
      return NextResponse.json({ error: "Missing engine or image" }, { status: 400 });
    }

    let imageBuffer: Buffer;
    let base64Image = "";

    if (typeof image === "string" && (image.startsWith("/arena/") || image.startsWith("arena/"))) {
      const cleanPath = image.startsWith("/") ? image.slice(1) : image;
      const filePath = path.join(process.cwd(), "public", cleanPath);
      
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `File not found on server: ${image}` }, { status: 404 });
      }
      imageBuffer = fs.readFileSync(filePath);
      base64Image = imageBuffer.toString("base64");
    } else if (typeof image === "string" && image.startsWith("data:")) {
      const base64Data = image.split(",")[1];
      imageBuffer = Buffer.from(base64Data, "base64");
      base64Image = base64Data;
    } else if (typeof image === "string") {
      base64Image = image;
      imageBuffer = Buffer.from(image, "base64");
    } else {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Select the corresponding pipeline backend URL
    let pipelineUrl = process.env.PIPELINE_PADDLEOCR_URL || "http://ocr-pipeline-paddleocr:8090/layout-parsing";
    if (engine === "nemotron") {
      pipelineUrl = process.env.PIPELINE_NEMOTRON_URL || "http://ocr-pipeline-nemotron:8091/layout-parsing";
    } else if (engine === "llama3-vision") {
      pipelineUrl = process.env.PIPELINE_LLAMA3_VISION_URL || "http://ocr-pipeline-llama3-vision:8092/layout-parsing";
    } else if (engine === "deepseek-vl2") {
      pipelineUrl = process.env.PIPELINE_DEEPSEEK_VL2_URL || "http://ocr-pipeline-deepseek-vl2:8093/layout-parsing";
    } else if (engine === "deepseek" || engine === "deepseek-ocr-2") {
      pipelineUrl = process.env.PIPELINE_DEEPSEEK_OCR_2_URL || "http://ocr-deepseek-ocr-2:8122/layout-parsing";
    } else if (engine === "lighton-ocr-2-1b" || engine === "lightonocr") {
      pipelineUrl = process.env.PIPELINE_LIGHTON_OCR_2_1B_URL || "http://ocr-lighton-ocr-2-1b:8123/layout-parsing";
    } else if (engine === "dots-ocr" || engine === "dots") {
      pipelineUrl = process.env.PIPELINE_DOTS_OCR_URL || "http://ocr-dots-ocr:8124/layout-parsing";
    } else if (engine === "glm-ocr" || engine === "glm") {
      pipelineUrl = process.env.PIPELINE_GLM_OCR_URL || "http://ocr-glm-ocr:8125/layout-parsing";
    }

    const payload = {
      file: base64Image,
      matchHistoryJob: false,
      useLayoutDetection: true,
      fileType: 1,
      useDocUnwarping: false,
      useDocOrientationClassify: false
    };

    console.log(`Arena posting to backend ${engine}: ${pipelineUrl}`);
    const response = await fetch(pipelineUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Backend pipeline error: ${errText}`);
    }

    const data = await response.json();
    const pipelineResult = data.result || data;
    const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
    const outputText = page0?.markdown?.text || "";

    const elapsedMs = Date.now() - startTime;
    await logArenaRun(image, engine, "done", outputText, elapsedMs);

    return NextResponse.json({
      success: true,
      text: outputText,
      elapsedMs,
      rawResult: pipelineResult
    });

  } catch (error: any) {
    console.error("OCR Arena proxy error:", error);
    const elapsedMs = Date.now() - startTime;
    await logArenaRun(image, engine, "failed", error.message || "Unknown error", elapsedMs);

    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process OCR request"
    }, { status: 500 });
  }
}
