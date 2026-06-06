import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../db";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = "/uploads";

export async function handleDeleteHistory(req: NextRequest) {
  try {
    const { filename, filenames } = await req.json();
    const filesToDelete: string[] = [];
    if (filename) {
      filesToDelete.push(filename);
    } else if (filenames && Array.isArray(filenames)) {
      filesToDelete.push(...filenames);
    }

    if (filesToDelete.length === 0) {
      return NextResponse.json({ error: "Filename(s) required" }, { status: 400 });
    }

    let deletedCount = 0;

    for (const f of filesToDelete) {
      const safeFile = path.basename(f);

      // Check if it exists and get its status
      const checkRes = await query(
        "SELECT id, is_sample FROM documents WHERE filename = $1",
        [safeFile]
      );

      if (checkRes.rowCount && checkRes.rowCount > 0) {
        const doc = checkRes.rows[0];
        const isSample = doc.is_sample;

        // Delete from DB (cascading delete will remove ocr_items)
        await query("DELETE FROM documents WHERE filename = $1", [safeFile]);

        // If it is a custom upload, clean up files from /uploads directory
        if (!isSample) {
          const imagePath = path.join(UPLOADS_DIR, safeFile);
          const jsonPath = path.join(UPLOADS_DIR, `${safeFile}.json`);

          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
          if (fs.existsSync(jsonPath)) {
            fs.unlinkSync(jsonPath);
          }
        }
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      return NextResponse.json({ success: true, deletedCount });
    }

    return NextResponse.json({ error: "Documents not found" }, { status: 404 });
  } catch (error: unknown) {
    console.error("Error in DELETE history API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
