import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { query } from "../../../db";
import crypto from "crypto";

const UPLOADS_DIR = "/uploads";
const PUBLIC_DIR = path.join(process.cwd(), "public/arena");

export async function POST(req: NextRequest) {
  try {
    const { filename, image } = await req.json();

    if (!filename || !image) {
      return NextResponse.json({ error: "Filename and image base64 data are required" }, { status: 400 });
    }

    const safeFile = path.basename(filename);
    
    const isSample = fs.existsSync(path.join(PUBLIC_DIR, safeFile));
    const filePath = isSample 
      ? path.join(PUBLIC_DIR, safeFile)
      : path.join(UPLOADS_DIR, safeFile);

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Write file to disk
    fs.writeFileSync(filePath, buffer);
    console.log(`Rotated file saved successfully at ${filePath}`);

    // Update database fields
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");
    const stats = fs.statSync(filePath);

    // Update document to unparsed state since layout changes
    await query(
      "UPDATE documents SET size = $1, file_hash = $2, parsed = false, layout_parsing_result = NULL WHERE filename = $3",
      [stats.size, fileHash, filename]
    );

    // Clear old items inside document metadata
    await query("UPDATE documents SET metadata = NULL WHERE filename = $1", [filename]);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error rotating file:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
