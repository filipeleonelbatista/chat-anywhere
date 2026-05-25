import { NextRequest, NextResponse } from "next/server";
import { getRoomUsers } from "@/lib/sse";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const users = getRoomUsers(roomId);
  return NextResponse.json({ users });
}
