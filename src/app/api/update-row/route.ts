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

    // Get document ID
    const docRes = await query("SELECT id FROM documents WHERE filename = $1", [safeFile]);
    if (!docRes.rowCount || docRes.rowCount === 0) {
      return NextResponse.json({ error: "Document not found in database" }, { status: 404 });
    }
    const docId = docRes.rows[0].id;

    if (action === "edit") {
      const { field, value } = body;
      if (!field || value === undefined) {
        return NextResponse.json({ error: "Missing edit parameters" }, { status: 400 });
      }

      // Map UI field names to database columns
      let colName = "";
      if (field === "kodeBarang") {
        colName = "kode_barang";
      } else if (field === "banyak") {
        colName = "banyak";
      } else if (field === "jumlah") {
        colName = "jumlah";
      } else {
        return NextResponse.json({ error: "Invalid field name" }, { status: 400 });
      }

      await query(
        `UPDATE ocr_items 
         SET ${colName} = $1 
         WHERE document_id = $2 AND row_index = $3`,
        [value, docId, rowIndex]
      );

      return NextResponse.json({ success: true });
    } else if (action === "flag") {
      const { isFlagged, remark } = body;
      if (isFlagged === undefined || remark === undefined) {
        return NextResponse.json({ error: "Missing flag parameters" }, { status: 400 });
      }

      await query(
        `UPDATE ocr_items 
         SET is_flagged = $1, remark = $2 
         WHERE document_id = $3 AND row_index = $4`,
        [!!isFlagged, remark, docId, rowIndex]
      );

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
