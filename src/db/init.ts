import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { parseDOMetadata } from "../utils/parser";

const UPLOADS_DIR = "/uploads";

export async function initDb(pool: Pool) {
  console.log("Database connection: Initializing schema...");
  
  // 1. Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        upload_time TIMESTAMP NOT NULL DEFAULT NOW(),
        size INTEGER NOT NULL DEFAULT 0,
        parsed BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB,
        layout_parsing_result JSONB,
        is_sample BOOLEAN NOT NULL DEFAULT FALSE,
        file_hash VARCHAR(64)
    );
  `);

  // Ensure file_hash and engine exist on existing tables
  try {
    await pool.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);");
    await pool.query("ALTER TABLE documents ADD COLUMN IF NOT EXISTS engine VARCHAR(50) NOT NULL DEFAULT 'paddleocr';");
    await pool.query("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_filename_key;");
    await pool.query("ALTER TABLE documents ADD CONSTRAINT documents_filename_engine_key UNIQUE (filename, engine);");
  } catch (alterErr) {
    console.error("Failed to alter documents table for file_hash/engine:", alterErr);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS ocr_items (
        id SERIAL PRIMARY KEY,
        document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        row_index INTEGER NOT NULL,
        kode_barang_original VARCHAR(255),
        kode_barang VARCHAR(255),
        nama_barang VARCHAR(255),
        banyak_original VARCHAR(255),
        banyak VARCHAR(255),
        jumlah_original VARCHAR(255),
        jumlah VARCHAR(255),
        is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
        remark VARCHAR(1000),
        UNIQUE(document_id, row_index)
    );
  `);

  // Create vendors table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vendors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Seed vendor
  await pool.query(`
    INSERT INTO vendors (name)
    VALUES ('PT. CHAROEN POKPHAND INDONESIA Tbk KAWASAN INDUSTRI MODERN, BANTEN')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Create customers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Seed customer
  await pool.query(`
    INSERT INTO customers (name)
    VALUES ('PT.PRIMAFOOD INTERNATIONAL, JL. ANCOL BARAT VIII/1, ANCOL, PADEMANGAN, JAKARTA UTARA, 14430')
    ON CONFLICT (name) DO NOTHING;
  `);

  // Create sku_master table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sku_master (
        id SERIAL PRIMARY KEY,
        no_sku VARCHAR(255) UNIQUE NOT NULL,
        nama_item VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Create arena_runs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arena_runs (
        id SERIAL PRIMARY KEY,
        image_path TEXT NOT NULL,
        engine VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        ocr_result TEXT,
        time_elapsed_ms INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `);

  // Seed SKU entries from JSON
  try {
    const skuPath = path.join(process.cwd(), "src", "db", "sku_seed.json");
    if (fs.existsSync(skuPath)) {
      const skus = JSON.parse(fs.readFileSync(skuPath, "utf8"));
      for (const item of skus) {
        await pool.query(
          "INSERT INTO sku_master (no_sku, nama_item) VALUES ($1, $2) ON CONFLICT (no_sku) DO NOTHING",
          [item.no_sku, item.nama_item]
        );
      }
    }
  } catch (skuErr) {
    console.error("Failed to seed SKUs from JSON:", skuErr);
  }

  console.log("Database schema initialized successfully.");

  // 2. Sync existing filesystem uploads to DB
  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    const jsonFiles = files.filter(f => f.endsWith(".json"));

    for (const jsonFile of jsonFiles) {
      const baseFilename = jsonFile.slice(0, -5); // e.g. "1716912345-doc.jpg"
      const imagePath = path.join(UPLOADS_DIR, baseFilename);
      const jsonPath = path.join(UPLOADS_DIR, jsonFile);

      if (!fs.existsSync(imagePath)) {
        continue; // Image/PDF doesn't exist, skip
      }

      // Check if already synced in DB
      const checkRes = await pool.query("SELECT id FROM documents WHERE filename = $1", [baseFilename]);
      if (checkRes.rowCount && checkRes.rowCount > 0) {
        continue; // Already in DB, skip
      }

      console.log(`Syncing historical file ${baseFilename} to PostgreSQL...`);
      const stats = fs.statSync(imagePath);
      const jsonContent = fs.readFileSync(jsonPath, "utf-8");
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(jsonContent);
      } catch (err) {
        console.error(`Failed to parse JSON file ${jsonFile}:`, err);
        continue;
      }

      const pipelineResult = parsedResult.result || parsedResult;
      const page0 = pipelineResult?.layoutParsingResults?.[0] || {};
      const markdownText = page0?.markdown?.text || "";
      const docMetadata = parseDOMetadata(markdownText);

      // Insert document
      const insertDocRes = await pool.query(`
        INSERT INTO documents (filename, upload_time, size, parsed, metadata, layout_parsing_result, is_sample)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        baseFilename,
        stats.mtime,
        stats.size,
        true,
        JSON.stringify(docMetadata),
        JSON.stringify(pipelineResult),
        false
      ]);

      const docId = insertDocRes.rows[0].id;

      // Insert items
      for (let i = 0; i < docMetadata.items.length; i++) {
        const item = docMetadata.items[i];
        await pool.query(`
          INSERT INTO ocr_items (
            document_id, row_index, 
            kode_barang_original, kode_barang, 
            nama_barang, 
            banyak_original, banyak, 
            jumlah_original, jumlah, 
            is_flagged, remark
          )
          VALUES ($1, $2, $3, $3, $4, $5, $5, $6, $6, false, '')
          ON CONFLICT DO NOTHING
        `, [
          docId,
          i,
          item.kodeBarang,
          item.namaBarang,
          item.banyak,
          item.jumlah
        ]);
      }
    }
  } catch (err) {
    console.error("Failed to sync uploads to database:", err);
  }
}
