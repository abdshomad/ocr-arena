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
        const itemsRes = await query(
          `SELECT row_index, kode_barang_original, kode_barang, nama_barang, banyak_original, banyak, jumlah_original, jumlah, is_flagged, remark
           FROM ocr_items 
           WHERE document_id = $1 
           ORDER BY row_index ASC`,
          [doc.id]
        );
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
          items: itemsRes.rows
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
        "SELECT id, layout_parsing_result, metadata FROM documents WHERE filename = $1 AND engine = $2",
        [safeFile, engineParam]
      );
      
      if (docRes.rowCount && docRes.rowCount > 0) {
        const doc = docRes.rows[0];
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
          remarks,
          headerRemark: (doc.metadata as any)?.headerRemark || ""
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
        `SELECT id, filename, upload_time, size, parsed, is_sample, metadata, engine, layout_parsing_result,
                (SELECT time_elapsed_ms FROM arena_runs r 
                 WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                   AND r.engine = engine
                 ORDER BY r.created_at DESC LIMIT 1) as latency_ms
         FROM documents 
         ORDER BY upload_time DESC`
      );
    } else {
      listRes = await query(
        `SELECT id, filename, upload_time, size, parsed, is_sample, metadata, engine, layout_parsing_result,
                (SELECT time_elapsed_ms FROM arena_runs r 
                 WHERE (r.image_path = '/arena/' || filename OR r.image_path = '/uploads/' || filename OR r.image_path = filename)
                   AND r.engine = engine
                 ORDER BY r.created_at DESC LIMIT 1) as latency_ms
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
        latency: row.latency_ms ? Number(row.latency_ms) : null
      };
    });

    return NextResponse.json({ history });
  } catch (error: unknown) {
    console.error("Error in history API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
