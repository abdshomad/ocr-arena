import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = "/uploads";

export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get("file");
    if (!filename) {
      return NextResponse.json({ error: "File name is required" }, { status: 400 });
    }

    const safeFile = path.basename(filename);
    const filePath = path.join(UPLOADS_DIR, safeFile);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Determine content type based on extension
    const ext = path.extname(safeFile).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") {
      contentType = "image/jpeg";
    } else if (ext === ".png") {
      contentType = "image/png";
    } else if (ext === ".gif") {
      contentType = "image/gif";
    } else if (ext === ".pdf") {
      contentType = "application/pdf";
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error: unknown) {
    console.error("Error serving file from uploads:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
