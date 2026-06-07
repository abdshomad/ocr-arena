import { NextRequest } from "next/server";
import { handleGetArena } from "./getHandler";
import { handlePostArena } from "./postHandler";

export const maxDuration = 120; // Allow up to 120 seconds for slow model inference

export async function GET(req: NextRequest) {
  return handleGetArena(req);
}

export async function POST(req: NextRequest) {
  return handlePostArena(req);
}
