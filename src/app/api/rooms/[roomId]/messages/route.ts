import { NextRequest, NextResponse } from "next/server";
import { saveMessage, getMessages, getRecentMessages } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";
import { broadcastToRoom, getRoomUsers } from "@/lib/sse";
import type { Message, MessageStatus, MessageType } from "@/types";

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

  const { content, type, senderId, senderName, senderAvatar, imageUrl, linkPreview, tempId } = await request.json();
  const roomUsers = getRoomUsers(roomId);
  const otherUsers = roomUsers.filter((u) => u.id !== userId);
  const status: MessageStatus = otherUsers.length > 0 ? "delivered" : "sent";

  const message: Message = {
    id: uuidv4(),
    roomId,
    senderId,
    senderName,
    senderAvatar,
    content,
    type: (type as MessageType) || "text",
    ...(imageUrl && { imageUrl }),
    ...(linkPreview && { linkPreview }),
    status,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  await saveMessage(roomId, message);
  broadcastToRoom(roomId, { message, tempId });

  return NextResponse.json({ message, tempId }, { status: 201 });
}
