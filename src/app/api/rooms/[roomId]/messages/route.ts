import { NextRequest, NextResponse } from "next/server";
import {
  saveMessage,
  getLatestMessagesInWindow,
  getOlderMessagesInWindow,
} from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";
import { broadcastToRoom, getRoomUsers } from "@/lib/sse";
import type { Message, MessageStatus, MessageType } from "@/types";
import {
  ROOM_HISTORY_INITIAL_LIMIT,
  ROOM_HISTORY_PAGE,
} from "@/lib/room-history";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const { searchParams } = new URL(request.url);
  const beforeRaw = searchParams.get("before");
  const limitRaw = searchParams.get("limit");

  if (beforeRaw != null && beforeRaw !== "") {
    const before = parseInt(beforeRaw, 10);
    if (Number.isNaN(before)) {
      return NextResponse.json({ error: "Invalid before" }, { status: 400 });
    }
    const pageLimit = Math.min(
      100,
      Math.max(
        1,
        parseInt(limitRaw ?? String(ROOM_HISTORY_PAGE), 10) || ROOM_HISTORY_PAGE
      )
    );
    const messages = await getOlderMessagesInWindow(
      roomId,
      before,
      pageLimit,
      Date.now()
    );
    return NextResponse.json(messages);
  }

  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(limitRaw ?? String(ROOM_HISTORY_INITIAL_LIMIT), 10) ||
        ROOM_HISTORY_INITIAL_LIMIT
    )
  );
  const messages = await getLatestMessagesInWindow(roomId, limit, Date.now());
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

  const { content, type, senderId, senderName, senderAvatar, imageUrl, linkPreview, tempId, replyTo } = await request.json();
  if (type === "system") {
    return NextResponse.json(
      { error: "System messages cannot be created via this endpoint" },
      { status: 400 }
    );
  }
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
    ...(replyTo && { replyTo }),
    status,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  await saveMessage(roomId, message);
  broadcastToRoom(roomId, { action: "message", message, tempId });

  return NextResponse.json({ action: "message", message, tempId }, { status: 201 });
}
