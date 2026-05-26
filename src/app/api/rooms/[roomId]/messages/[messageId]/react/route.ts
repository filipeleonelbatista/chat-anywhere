import { NextRequest, NextResponse } from "next/server";
import { updateMessage, getRecentMessages } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import type { Reaction, SSEAction } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { emoji, userId, userName } = await request.json();

    if (!emoji || !userId) {
      return NextResponse.json(
        { error: "Missing emoji or userId" },
        { status: 400 }
      );
    }

    const messages = await getRecentMessages(roomId, 100);
    const message = messages.find((m) => m.id === messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    let reactions = message.reactions || [];

    const existingIndex = reactions.findIndex((r) => r.userId === userId);
    if (existingIndex !== -1) {
      if (reactions[existingIndex].emoji === emoji) {
        reactions = reactions.filter((r) => r.userId !== userId);
      } else {
        reactions[existingIndex] = { emoji, userId, userName } as Reaction;
      }
    } else {
      reactions.push({ emoji, userId, userName } as Reaction);
    }

    await updateMessage(roomId, messageId, {
      reactions: JSON.stringify(reactions),
    });

    const payload: SSEAction = {
      action: "react",
      messageId,
      reactions,
    };
    broadcastToRoom(roomId, payload);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Failed to react" },
      { status: 500 }
    );
  }
}
