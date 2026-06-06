import { NextRequest } from "next/server";
import { handleGetHistory } from "./getHandler";
import { handlePostHistory } from "./postHandler";
import { handleDeleteHistory } from "./deleteHandler";

export const maxDuration = 120;

export async function GET(req: NextRequest) {
  return handleGetHistory(req);
}

export async function POST(req: NextRequest) {
  return handlePostHistory(req);
}

export async function DELETE(req: NextRequest) {
  return handleDeleteHistory(req);
}
