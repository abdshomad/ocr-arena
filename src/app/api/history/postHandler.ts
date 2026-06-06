import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../db";
import path from "path";

export async function handlePostHistory(req: NextRequest) {
  try {
    const body = await req.json();
    
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

        // Clean existing items
        await query("DELETE FROM ocr_items WHERE document_id = $1", [docId]);

        // Insert restored items
        const items = doc.items || doc.ocr_items || doc.ocrItems;
        if (items && Array.isArray(items)) {
          for (const item of items) {
            await query(`
              INSERT INTO ocr_items (
                document_id, row_index, 
                kode_barang_original, kode_barang, 
                nama_barang, 
                banyak_original, banyak, 
                jumlah_original, jumlah, 
                is_flagged, remark
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `, [
              docId,
              item.row_index !== undefined ? item.row_index : (item.rowIndex !== undefined ? item.rowIndex : 0),
              item.kode_barang_original || item.kodeBarangOriginal || null,
              item.kode_barang || item.kodeBarang || null,
              item.nama_barang || item.namaBarang || null,
              item.banyak_original || item.banyakOriginal || null,
              item.banyak,
              item.jumlah_original || item.jumlahOriginal || null,
              item.jumlah,
              item.is_flagged || item.isFlagged || false,
              item.remark || ""
            ]);
          }
        }
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
