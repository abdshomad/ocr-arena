/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { query, cleanupAndReindexItems } from "../../../db";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = "/uploads";

export async function handleGetHistory(req: NextRequest) {
  try {
    const backupParam = req.nextUrl.searchParams.get("backup");
    if (backupParam === "true") {
      const docRes = await query(
        `SELECT id, filename, upload_time, size, parsed, is_sample, metadata, engine, layout_parsing_result, file_hash
         FROM documents 
         ORDER BY id ASC`
      );

      const exportData = [];
      for (const doc of docRes.rows) {
        const metadata = doc.metadata || {};
        const rawItems = metadata.items || [];
        const flagged = metadata.flagged || {};
        const remarks = metadata.remarks || {};

        const items = rawItems.map((item: any, idx: number) => ({
          row_index: idx,
          is_flagged: !!flagged[idx],
          remark: remarks[idx] || "",
          ...item
        }));

        exportData.push({
          filename: doc.filename,
          upload_time: doc.upload_time ? doc.upload_time.toISOString() : new Date().toISOString(),
          size: doc.size,
          parsed: doc.parsed,
          is_sample: doc.is_sample,
          metadata: doc.metadata,
          layout_parsing_result: doc.layout_parsing_result,
          file_hash: doc.file_hash,
          engine: doc.engine,
          items
        });
      }

      return new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="ocr_arena_backup_${new Date().toISOString().split("T")[0]}.json"`
        }
      });
    }

    const fileParam = req.nextUrl.searchParams.get("file");
    const engineParam = req.nextUrl.searchParams.get("engine") || "paddleocr";
    
    if (fileParam) {
      const safeFile = path.basename(fileParam);
      
      // 1. Try to load from database first
      const docRes = await query(
        "SELECT id, layout_parsing_result, metadata, is_accurate, is_loved, rating_stars, ocr_remarks, is_fast FROM documents WHERE filename = $1 AND engine = $2",
        [safeFile, engineParam]
      );
      
      if (docRes.rowCount && docRes.rowCount > 0) {
        const doc = docRes.rows[0];
        const docId = doc.id;
        const pipelineResult = doc.layout_parsing_result;

        // Clean up and re-index invalid items first
        await cleanupAndReindexItems(docId);

        // Fetch refreshed metadata
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
          headerRemark: (doc.metadata as any)?.headerRemark || "",
          isAccurate: doc.is_accurate,
          isLoved: doc.is_loved,
          ratingStars: doc.rating_stars,
          ocrRemarks: doc.ocr_remarks,
          isFast: doc.is_fast
        });
      }

      // 2. Fallback to filesystem
      const jsonPath = path.join(UPLOADS_DIR, `${safeFile}.json`);
      if (fs.existsSync(jsonPath)) {
        const jsonData = fs.readFileSync(jsonPath, "utf8");
        const data = JSON.parse(jsonData);
        return NextResponse.json({
          errorCode: 0,
          errorMsg: "Success",
          result: data.result || data
        });
      }

      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // List view: return history list from DB
    const showAll = req.nextUrl.searchParams.get("all") === "true";
    
    let listRes;
    if (showAll) {
      listRes = await query(
        `SELECT id, filename, upload_time, size, parsed, is_sample, metadata, engine, layout_parsing_result, is_accurate, is_loved, rating_stars, ocr_remarks, is_fast,
                COALESCE(ocr_start_time, (
                  SELECT start_time FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as ocr_start_time,
                COALESCE(ocr_end_time, (
                  SELECT end_time FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as ocr_end_time,
                COALESCE(ocr_elapsed_ms, (
                  SELECT time_elapsed_ms FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as latency_ms
         FROM documents 
         ORDER BY upload_time DESC`
      );
    } else {
      listRes = await query(
        `SELECT id, filename, upload_time, size, parsed, is_sample, metadata, engine, layout_parsing_result, is_accurate, is_loved, rating_stars, ocr_remarks, is_fast,
                COALESCE(ocr_start_time, (
                  SELECT start_time FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as ocr_start_time,
                COALESCE(ocr_end_time, (
                  SELECT end_time FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as ocr_end_time,
                COALESCE(ocr_elapsed_ms, (
                  SELECT time_elapsed_ms FROM arena_runs r 
                  WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                    AND r.engine = engine
                  ORDER BY r.created_at DESC LIMIT 1
                )) as latency_ms
         FROM documents 
         WHERE is_sample = FALSE 
         ORDER BY upload_time DESC`
      );
    }

    const history = listRes.rows.map(row => {
      let ocrText = "";
      try {
        if (row.layout_parsing_result) {
          const resultObj = typeof row.layout_parsing_result === "string"
            ? JSON.parse(row.layout_parsing_result)
            : row.layout_parsing_result;
          ocrText = resultObj?.layoutParsingResults?.[0]?.markdown?.text || "";
        }
      } catch (e) {
        console.error("Error parsing layout_parsing_result in list:", e);
      }

      return {
        id: row.id,
        filename: row.filename,
        uploadTime: row.upload_time.toISOString(),
        size: row.size,
        parsed: row.parsed,
        isSample: row.is_sample,
        metadata: row.metadata,
        engine: row.engine,
        ocrText: ocrText,
        latency: row.latency_ms ? Number(row.latency_ms) : null,
        ocrStartTime: row.ocr_start_time ? (row.ocr_start_time instanceof Date ? row.ocr_start_time.toISOString() : new Date(row.ocr_start_time).toISOString()) : null,
        ocrEndTime: row.ocr_end_time ? (row.ocr_end_time instanceof Date ? row.ocr_end_time.toISOString() : new Date(row.ocr_end_time).toISOString()) : null,
        isAccurate: row.is_accurate,
        isLoved: row.is_loved,
        ratingStars: row.rating_stars,
        ocrRemarks: row.ocr_remarks,
        isFast: row.is_fast
      };
    });

    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error("Error in history API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
