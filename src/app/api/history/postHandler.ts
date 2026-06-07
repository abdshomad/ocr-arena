import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../db";
import path from "path";

export async function handlePostHistory(req: NextRequest) {
  try {
    const body = await req.json();

    // Check for feedback rating operation
    if (body.action === "feedback") {
      const { filename, engine, isAccurate, isLoved, ratingStars, ocrRemarks, isFast } = body;
      if (!filename || !engine) {
        return NextResponse.json({ error: "Filename and engine are required" }, { status: 400 });
      }
      const safeFile = path.basename(filename);
      const updateRes = await query(
        `UPDATE documents 
         SET is_accurate = $1, is_loved = $2, rating_stars = $3, ocr_remarks = $4, is_fast = $5
         WHERE filename = $6 AND engine = $7`,
        [
          isAccurate !== undefined ? isAccurate : null,
          isLoved !== undefined ? isLoved : null,
          ratingStars !== undefined ? ratingStars : null,
          ocrRemarks !== undefined ? ocrRemarks : null,
          isFast !== undefined ? isFast : null,
          safeFile,
          engine
        ]
      );
      if (updateRes.rowCount && updateRes.rowCount > 0) {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    
    // Check for restore operation
    if (body.action === "restore") {
      const backupData = body.backupData;
      if (!backupData || !Array.isArray(backupData)) {
        return NextResponse.json({ error: "Invalid backup data format" }, { status: 400 });
      }

      for (const doc of backupData) {
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
          doc.filename,
          new Date(doc.upload_time || doc.uploadTime || Date.now()),
          doc.size || 0,
          doc.parsed !== undefined ? doc.parsed : false,
          JSON.stringify(doc.metadata || {}),
          JSON.stringify(doc.layout_parsing_result || doc.layoutParsingResult || null),
          doc.is_sample !== undefined ? doc.is_sample : false,
          doc.file_hash || doc.fileHash || null,
          doc.engine || "paddleocr"
        ]);

        const docId = insertDocRes.rows[0].id;

        // Populate items, flagged, and remarks in the metadata object
        const itemsList = [];
        const flaggedObj: Record<number, boolean> = {};
        const remarksObj: Record<number, string> = {};

        const items = doc.items || doc.ocr_items || doc.ocrItems;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            const idx = item.row_index !== undefined ? item.row_index : (item.rowIndex !== undefined ? item.rowIndex : 0);
            itemsList.push({
              kodeBarang: item.kodeBarang || item.kode_barang || item.kodeBarangOriginal || item.kode_barang_original || null,
              namaBarang: item.namaBarang || item.nama_barang || null,
              banyak: item.banyak,
              jumlah: item.jumlah
            });
            if (item.is_flagged || item.isFlagged) {
              flaggedObj[idx] = true;
            }
            if (item.remark) {
              remarksObj[idx] = item.remark;
            }
          }
        }

        const metadata = doc.metadata || {};
        metadata.items = itemsList;
        metadata.flagged = flaggedObj;
        metadata.remarks = remarksObj;

        await query(
          "UPDATE documents SET metadata = $1 WHERE id = $2",
          [JSON.stringify(metadata), docId]
        );
      }
      return NextResponse.json({ success: true, count: backupData.length });
    }

    const { filename, filenames, remark, metadataUpdates } = body;
    
    // Check if bulk update
    if (filenames && Array.isArray(filenames) && metadataUpdates && typeof metadataUpdates === "object") {
      const updatesJson = JSON.stringify(metadataUpdates);
      let updatedCount = 0;
      for (const f of filenames) {
        const safeFile = path.basename(f);
        const updateRes = await query(
          `UPDATE documents 
           SET metadata = coalesce(metadata, '{}'::jsonb) || $1::jsonb 
           WHERE filename = $2`,
          [updatesJson, safeFile]
        );
        if (updateRes.rowCount && updateRes.rowCount > 0) {
          updatedCount++;
        }
      }
      return NextResponse.json({ success: true, updatedCount });
    }

    if (!filename) {
      return NextResponse.json({ error: "Filename is required" }, { status: 400 });
    }

    const safeFile = path.basename(filename);

    if (metadataUpdates && typeof metadataUpdates === "object") {
      const updatesJson = JSON.stringify(metadataUpdates);
      const updateRes = await query(
        `UPDATE documents 
         SET metadata = coalesce(metadata, '{}'::jsonb) || $1::jsonb 
         WHERE filename = $2`,
        [updatesJson, safeFile]
      );
      if (updateRes.rowCount && updateRes.rowCount > 0) {
        return NextResponse.json({ success: true });
      }
    } else {
      const valueJson = JSON.stringify(remark || "");
      const updateRes = await query(
        `UPDATE documents 
         SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{headerRemark}', $1::jsonb) 
         WHERE filename = $2`,
        [valueJson, safeFile]
      );

      if (updateRes.rowCount && updateRes.rowCount > 0) {
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  } catch (error: unknown) {
    console.error("Error in POST history API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
