import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { parseDOMetadata } from "../utils/parser";
import { seedSampleData } from "./seed";

const UPLOADS_DIR = "/uploads";

export async function initDb(pool: Pool) {
  console.log("Database connection: Initializing schema...");
  
  // 1. Create tables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        upload_time TIMESTAMP NOT NULL DEFAULT NOW(),
        size INTEGER NOT NULL DEFAULT 0,
        parsed BOOLEAN NOT NULL DEFAULT FALSE,
        metadata JSONB,
        layout_parsing_result JSONB,
        is_sample BOOLEAN NOT NULL DEFAULT FALSE,
        file_hash VARCHAR(64),
        engine VARCHAR(50) NOT NULL,
        ocr_start_time TIMESTAMP,
        ocr_end_time TIMESTAMP,
        ocr_elapsed_ms INTEGER
    );
  `);

  // Ensure file_hash and engine exist on existing tables
  const runAlter = async (sql: string, errMsg: string) => {
    try {
      await pool.query(sql);
    } catch (err: any) {
      // Log as info/debug rather than critical error if it fails
      console.log(`Database alter details (${errMsg}):`, err.message || err);
    }
  };

  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);", "file_hash");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS engine VARCHAR(50) NOT NULL DEFAULT 'paddleocr';", "engine");
  await runAlter("ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_filename_key;", "drop documents_filename_key");
  await runAlter("ALTER TABLE documents ADD CONSTRAINT documents_filename_engine_key UNIQUE (filename, engine);", "add documents_filename_engine_key");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_start_time TIMESTAMP;", "ocr_start_time");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_end_time TIMESTAMP;", "ocr_end_time");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_elapsed_ms INTEGER;", "ocr_elapsed_ms");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_accurate BOOLEAN;", "is_accurate");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_loved BOOLEAN;", "is_loved");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS rating_stars INTEGER;", "rating_stars");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_remarks TEXT;", "ocr_remarks");
  await runAlter("ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_fast BOOLEAN;", "is_fast");

  // Create arena_runs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS arena_runs (
        id SERIAL PRIMARY KEY,
        image_path TEXT NOT NULL,
        engine VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        ocr_result TEXT,
        time_elapsed_ms INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        start_time TIMESTAMP,
        end_time TIMESTAMP
    );
  `);

  try {
    await pool.query("ALTER TABLE arena_runs ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;");
    await pool.query("ALTER TABLE arena_runs ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;");
  } catch (alterErr) {
    console.error("Failed to alter arena_runs table for start/end time:", alterErr);
  }

  console.log("Database schema initialized successfully.");

  // 2. Sync existing filesystem uploads to DB
  try {
    if (fs.existsSync(UPLOADS_DIR)) {
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

      // No need to insert into ocr_items table
    }
    }
  } catch (err) {
    console.error("Failed to sync uploads to database:", err);
  }

  // 3. Seed sample data if database is empty
  await seedSampleData(pool);
}
