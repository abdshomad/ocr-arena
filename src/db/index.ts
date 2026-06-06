import { Pool } from "pg";
import { initDb } from "./init";

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  port: parseInt(process.env.PGPORT || "5432"),
  user: process.env.PGUSER || process.env.POSTGRES_USER || "postgres",
  password: process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.PGDATABASE || process.env.POSTGRES_DB || "ocrarena",
});

let initialized = false;
let initPromise: Promise<Pool> | null = null;

export async function getPool(): Promise<Pool> {
  if (initialized) {
    return pool;
  }
  if (!initPromise) {
    initPromise = (async () => {
      try {
        await initDb(pool);
        initialized = true;
      } catch (err) {
        console.error("Failed to initialize database:", err);
      }
      return pool;
    })();
  }
  return initPromise;
}

export async function query(text: string, params?: unknown[]) {
  const p = await getPool();
  return p.query(text, params);
}

export async function cleanupAndReindexItems(docId: number) {
  // 1. Delete rows where kode_barang is blank/null or doesn't match an 8-digit number
  await query(
    `DELETE FROM ocr_items 
     WHERE document_id = $1 
       AND (kode_barang IS NULL OR TRIM(kode_barang) = '' OR NOT (kode_barang ~ '^[0-9]{8}$'))`,
    [docId]
  );

  // 2. Fetch remaining rows ordered by row_index
  const res = await query(
    `SELECT id, row_index 
     FROM ocr_items 
     WHERE document_id = $1 
     ORDER BY row_index`,
    [docId]
  );

  // 3. Update row_index to be sequential
  for (let i = 0; i < res.rows.length; i++) {
    const row = res.rows[i];
    if (row.row_index !== i) {
      await query(
        `UPDATE ocr_items 
         SET row_index = $1 
         WHERE id = $2`,
        [i, row.id]
      );
    }
  }
}

export { pool };
