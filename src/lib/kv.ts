import { kv } from "@vercel/kv";
import type { Message, MessageStatus } from "@/types";

const MESSAGE_TTL = 86400; // 24 hours in seconds
const MESSAGE_BATCH = 20;

export interface StoredMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: "text" | "image" | "link";
  imageUrl?: string;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image?: string;
  };
  timestamp: number;
  createdAt: string;
}

export async function saveMessage(
  roomId: string,
  message: StoredMessage
): Promise<void> {
  const messagesKey = `room:${roomId}:messages`;
  const messageKey = `message:${message.id}`;
  await Promise.all([
    kv.zadd(messagesKey, { score: message.timestamp, member: message.id }),
    kv.hset(
      messageKey,
      Object.fromEntries(
        Object.entries(message as unknown as Record<string, unknown>).filter(
          ([, v]) => v != null
        )
      )
    ),
    kv.expire(messagesKey, MESSAGE_TTL),
    kv.expire(messageKey, MESSAGE_TTL),
  ]);
}

export async function getMessages(
  roomId: string,
  opts: { since?: number; limit?: number } = {}
): Promise<StoredMessage[]> {
  const { since = Date.now(), limit = MESSAGE_BATCH } = opts;
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, "-inf", since, {
    byScore: true,
    rev: true,
    count: limit,
    offset: 0,
  });
  if (messageIds.length === 0) return [];
  const keys = messageIds.map((id) => `message:${id}`);
  const results = await Promise.all(
    keys.map((key) => kv.hgetall(key))
  );
  return results
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((r) => {
      const fields = r as Record<string, string>;
      const message: Message = {
        id: fields.id,
        roomId: fields.roomId,
        senderId: fields.senderId,
        senderName: fields.senderName,
        senderAvatar: fields.senderAvatar,
        content: fields.content,
        type: fields.type as Message["type"],
        imageUrl: fields.imageUrl,
        linkPreview: fields.linkPreview ? JSON.parse(fields.linkPreview) : undefined,
        status: (fields.status as MessageStatus) || "sent",
        timestamp: Number(fields.timestamp),
        createdAt: fields.createdAt,
      };
      return message;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getRecentMessages(
  roomId: string,
  limit = 50
): Promise<StoredMessage[]> {
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, -limit, -1);
  if (messageIds.length === 0) return [];
  const keys = messageIds.map((id) => `message:${id}`);
  const results = await Promise.all(
    keys.map((key) => kv.hgetall(key))
  );
  return results
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((r) => {
      const fields = r as Record<string, string>;
      const message: Message = {
        id: fields.id,
        roomId: fields.roomId,
        senderId: fields.senderId,
        senderName: fields.senderName,
        senderAvatar: fields.senderAvatar,
        content: fields.content,
        type: fields.type as Message["type"],
        imageUrl: fields.imageUrl,
        linkPreview: fields.linkPreview ? JSON.parse(fields.linkPreview) : undefined,
        status: (fields.status as MessageStatus) || "sent",
        timestamp: Number(fields.timestamp),
        createdAt: fields.createdAt,
      };
      return message;
    })
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function deleteRoomMessages(
  roomId: string
): Promise<void> {
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, 0, -1);
  if (messageIds.length > 0) {
    const keys = messageIds.map((id) => `message:${id}`);
    await Promise.all([
      kv.del(messagesKey),
      ...keys.map((k) => kv.del(k)),
    ]);
  }
}
