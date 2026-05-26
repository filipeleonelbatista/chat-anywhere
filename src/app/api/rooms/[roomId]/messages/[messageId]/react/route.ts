import { NextRequest, NextResponse } from "next/server";
import { applyReactionAtomic } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import { REACTION_EMOJIS, type ReactionEmoji, type SSEAction } from "@/types";

const ALLOWED_EMOJI = new Set<string>(REACTION_EMOJIS);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const body = await request.json();
    const { emoji, userId, userName } = body as {
      emoji?: string;
      userId?: string;
      userName?: string;
    };

    if (!emoji || !userId) {
      return NextResponse.json(
        { error: "Missing emoji or userId" },
        { status: 400 }
      );
    }

    if (!ALLOWED_EMOJI.has(emoji)) {
      return NextResponse.json({ error: "Invalid emoji" }, { status: 400 });
    }

    const reactionEmoji = emoji as ReactionEmoji;
    const safeName = typeof userName === "string" ? userName : "";

    const result = await applyReactionAtomic(
      roomId,
      messageId,
      userId,
      safeName,
      reactionEmoji
    );

    if (!result.ok && "notFound" in result && result.notFound) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (!result.ok) {
      console.error("[react]", "error" in result ? result.error : result);
      return NextResponse.json(
        { error: "Failed to react" },
        { status: 500 }
      );
    }

    const { reactions } = result;

    const payload: SSEAction = {
      action: "react",
      messageId,
      reactions,
    };
    broadcastToRoom(roomId, payload);

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[react]", err);
    return NextResponse.json(
      { error: "Failed to react" },
      { status: 500 }
    );
  }
}
