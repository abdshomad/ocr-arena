import { NextRequest, NextResponse } from "next/server";
import { query } from "../../../db";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { page, rowIndex, action } = body;

    if (!page || rowIndex === undefined || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const safeFile = path.basename(page);

    // Get document metadata
    const docRes = await query("SELECT id, metadata FROM documents WHERE filename = $1", [safeFile]);
    if (!docRes.rowCount || docRes.rowCount === 0) {
      return NextResponse.json({ error: "Document not found in database" }, { status: 404 });
    }
    const docId = docRes.rows[0].id;
    const metadata = docRes.rows[0].metadata || {};
    
    if (action === "edit") {
      const { field, value } = body;
      if (!field || value === undefined) {
        return NextResponse.json({ error: "Missing edit parameters" }, { status: 400 });
      }

      if (!metadata.items) metadata.items = [];
      if (metadata.items[rowIndex]) {
        metadata.items[rowIndex][field] = value;
      } else {
        metadata.items[rowIndex] = { [field]: value };
      }

      await query("UPDATE documents SET metadata = $1 WHERE id = $2", [JSON.stringify(metadata), docId]);
      return NextResponse.json({ success: true });
    } else if (action === "flag") {
      const { isFlagged, remark } = body;
      if (isFlagged === undefined || remark === undefined) {
        return NextResponse.json({ error: "Missing flag parameters" }, { status: 400 });
      }

      if (!metadata.flagged) metadata.flagged = {};
      if (!metadata.remarks) metadata.remarks = {};

      if (isFlagged) {
        metadata.flagged[rowIndex] = true;
      } else {
        delete metadata.flagged[rowIndex];
      }

      if (remark && remark.trim()) {
        metadata.remarks[rowIndex] = remark;
      } else {
        delete metadata.remarks[rowIndex];
      }

      await query("UPDATE documents SET metadata = $1 WHERE id = $2", [JSON.stringify(metadata), docId]);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: unknown) {
    console.error("Error in update-row API route:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
