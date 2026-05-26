import { v4 as uuidv4 } from "uuid";
import { saveMessage } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import type { Message, PresenceKind } from "@/types";

/**
 * Persists a join/leave line in the room timeline and notifies SSE subscribers.
 */
export async function broadcastPresence(
  roomId: string,
  userId: string,
  userName: string,
  userAvatar: string,
  kind: PresenceKind
): Promise<void> {
  const message: Message = {
    id: uuidv4(),
    roomId,
    senderId: userId,
    senderName: userName,
    senderAvatar: userAvatar,
    content: "",
    type: "system",
    presence: kind,
    status: "sent",
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };
  await saveMessage(roomId, message);
  broadcastToRoom(roomId, { action: "message", message });
}
