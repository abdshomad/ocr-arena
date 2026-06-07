/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../db";

export async function handleGetArena(req: NextRequest) {
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
