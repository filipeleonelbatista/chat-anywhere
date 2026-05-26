import { NextRequest, NextResponse } from "next/server";
import { updateMessage, getMessageForRoom } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import type { SSEAction } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Verify sender
    const message = await getMessageForRoom(roomId, messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (message.senderId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Mark as deleted — clear content, reactions, media
    await updateMessage(roomId, messageId, {
      deleted: "true",
      content: "",
      reactions: JSON.stringify([]),
    });

    // Broadcast
    const payload: SSEAction = {
      action: "delete",
      messageId,
    };
    broadcastToRoom(roomId, payload);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
