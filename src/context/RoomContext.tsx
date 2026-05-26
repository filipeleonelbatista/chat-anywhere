"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { useSSE } from "@/hooks/useSSE";
import type { Message, ConnectionStatus, SSEAction, ReplyTo } from "@/types";
import {
  ROOM_HISTORY_INITIAL_LIMIT,
  ROOM_HISTORY_PAGE,
} from "@/lib/room-history";

interface RoomContextType {
  messages: Message[];
  status: ConnectionStatus;
  sendMessage: (
    content: string,
    opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"]; replyTo?: ReplyTo }
  ) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  loadingOlder: boolean;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export function RoomProvider({
  children,
  roomId,
  userId,
  userName,
  userAvatar,
}: {
  children: React.ReactNode;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  /** Minimum timestamp in the current list; used to load the next older page inside the 24h window. */
  const oldestTimestampRef = useRef<number | null>(null);

  const handleNewMessage = useCallback((payload: SSEAction) => {
    if (payload.action === "message") {
      const { message, tempId } = payload;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        if (tempId) {
          const pendingIndex = prev.findIndex((m) => m.id === tempId);
          if (pendingIndex !== -1) {
            const updated = [...prev];
            updated[pendingIndex] = message;
            return updated;
          }
        }
        return [...prev, message];
      });
    } else if (payload.action === "react") {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === payload.messageId
            ? { ...m, reactions: payload.reactions }
            : m
        )
      );
    } else if (payload.action === "delete") {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.replyTo?.messageId === payload.messageId) {
            return { ...m, replyTo: { ...m.replyTo, deleted: true } };
          }
          if (m.id === payload.messageId) {
            return { ...m, deleted: true, content: "", imageUrl: undefined, linkPreview: undefined, reactions: [] };
          }
          return m;
        })
      );
    }
  }, []);

  const { status } = useSSE({ roomId, userId, userName, userAvatar, onMessage: handleNewMessage });

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"]; replyTo?: ReplyTo }
    ) => {
      const tempId = crypto.randomUUID();
      const pendingMessage: Message = {
        id: tempId,
        roomId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        content,
        type: opts?.imageUrl
          ? ("image" as const)
          : opts?.linkPreview
            ? ("link" as const)
            : ("text" as const),
        ...(opts?.imageUrl && { imageUrl: opts.imageUrl }),
        ...(opts?.linkPreview && { linkPreview: opts.linkPreview }),
        ...(opts?.replyTo && { replyTo: opts.replyTo }),
        status: "pending",
        timestamp: Date.now(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, pendingMessage]);

      try {
        const res = await fetch(`/api/rooms/${roomId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({ ...pendingMessage, tempId }),
        });

        if (!res.ok) {
          const err = await res.text();
          throw new Error(`Failed to send message: ${err}`);
        }
      } catch {
        setMessages((prev) =>
          prev.filter((m) => m.id !== tempId)
        );
      }
    },
    [roomId, userId, userName, userAvatar]
  );

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreMessages) return;
    if (oldestTimestampRef.current == null) return;
    setLoadingOlder(true);
    try {
      const before = oldestTimestampRef.current;
      const res = await fetch(
        `/api/rooms/${roomId}/messages?before=${before}&limit=${ROOM_HISTORY_PAGE}`,
        { headers: { "x-user-id": userId } }
      );
      if (!res.ok) throw new Error("Failed to load older messages");
      const olderMessages: Message[] = await res.json();
      if (olderMessages.length === 0) {
        setHasMoreMessages(false);
        return;
      }
      const oldestNew = Math.min(
        ...olderMessages.map((m) => m.timestamp)
      );
      oldestTimestampRef.current = Math.min(
        oldestTimestampRef.current,
        oldestNew
      );
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = olderMessages.filter((m) => !existingIds.has(m.id));
        return [...newMsgs, ...prev];
      });
      if (olderMessages.length < ROOM_HISTORY_PAGE) {
        setHasMoreMessages(false);
      }
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, userId, loadingOlder, hasMoreMessages]);

  useEffect(() => {
    let cancelled = false;
    oldestTimestampRef.current = null;
    setMessages([]);
    setHasMoreMessages(true);
    setLoadingOlder(true);
    (async () => {
      try {
        const res = await fetch(
          `/api/rooms/${roomId}/messages?limit=${ROOM_HISTORY_INITIAL_LIMIT}`,
          { headers: { "x-user-id": userId } }
        );
        if (!res.ok) throw new Error("Failed to load messages");
        const initial: Message[] = await res.json();
        if (cancelled) return;
        setMessages(initial);
        if (initial.length > 0) {
          oldestTimestampRef.current = Math.min(
            ...initial.map((m) => m.timestamp)
          );
        } else {
          oldestTimestampRef.current = null;
        }
        setHasMoreMessages(
          initial.length === ROOM_HISTORY_INITIAL_LIMIT
        );
      } catch {
        if (!cancelled) {
          setMessages([]);
          oldestTimestampRef.current = null;
          setHasMoreMessages(false);
        }
      } finally {
        if (!cancelled) setLoadingOlder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomId, userId]);

  const reactToMessage = useCallback(
    async (messageId: string, emoji: string) => {
      try {
        await fetch(`/api/rooms/${roomId}/messages/${messageId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emoji, userId, userName }),
        });
      } catch {
        // Silently fail — SSE will correct state if needed
      }
    },
    [roomId, userId, userName]
  );

  const deleteMessage = useCallback(
    async (messageId: string) => {
      try {
        await fetch(`/api/rooms/${roomId}/messages/${messageId}/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      } catch {
        // Silently fail
      }
    },
    [roomId, userId]
  );

  return (
    <RoomContext.Provider
      value={{
        messages,
        status,
        sendMessage,
        reactToMessage,
        deleteMessage,
        loadOlderMessages,
        hasMoreMessages,
        loadingOlder,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextType {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}
