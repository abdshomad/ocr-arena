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
  const res = await query("SELECT metadata FROM documents WHERE id = $1", [docId]);
  if (!res.rowCount || res.rowCount === 0) return;
  const metadata = res.rows[0].metadata || {};
  const items = metadata.items || [];

  const regex = /^[0-9]{8}$/;
  const oldFlagged = metadata.flagged || {};
  const oldRemarks = metadata.remarks || {};
  
  const newItems = [];
  const newFlagged: Record<number, boolean> = {};
  const newRemarks: Record<number, string> = {};
  
  let newIdx = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const kode = item.kodeBarang || item.kode_barang || "";
    if (kode && typeof kode === "string" && regex.test(kode.trim())) {
      newItems.push(item);
      if (oldFlagged[i]) {
        newFlagged[newIdx] = true;
      }
      if (oldRemarks[i]) {
        newRemarks[newIdx] = oldRemarks[i];
      }
      newIdx++;
    }
  }

  metadata.items = newItems;
  metadata.flagged = newFlagged;
  metadata.remarks = newRemarks;

  await query("UPDATE documents SET metadata = $1 WHERE id = $2", [JSON.stringify(metadata), docId]);
}

export { pool };
