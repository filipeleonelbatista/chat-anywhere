import { NextRequest, NextResponse } from "next/server";
import { saveMessage, getMessages, getRecentMessages } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";
import { broadcastToRoom } from "@/lib/sse";
import type { Message } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const limit = searchParams.get("limit");

  if (since) {
    const messages = await getMessages(roomId, {
      since: parseInt(since),
      limit: limit ? parseInt(limit) : 20,
    });
    return NextResponse.json(messages);
  }

  const messages = await getRecentMessages(
    roomId,
    limit ? parseInt(limit) : 50
  );
  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json(
      { error: "Missing x-user-id header" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const message: Message = {
    id: uuidv4(),
    roomId,
    senderId: body.senderId,
    senderName: body.senderName,
    senderAvatar: body.senderAvatar,
    content: body.content,
    type: body.type || "text",
    imageUrl: body.imageUrl,
    linkPreview: body.linkPreview,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  await saveMessage(roomId, message);
  broadcastToRoom(roomId, message);

  return NextResponse.json(message, { status: 201 });
}
