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
import type { Message, ConnectionStatus } from "@/types";

interface RoomContextType {
  messages: Message[];
  status: ConnectionStatus;
  sendMessage: (
    content: string,
    opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }
  ) => Promise<void>;
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
  const oldestTimestampRef = useRef<number>(Infinity);

  const handleNewMessage = useCallback((payload: { message: Message; tempId?: string }) => {
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
  }, []);

  const { status } = useSSE({ roomId, userId, userName, userAvatar, onMessage: handleNewMessage });

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }
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
    setLoadingOlder(true);
    try {
      const since =
        oldestTimestampRef.current === Infinity
          ? Date.now()
          : oldestTimestampRef.current;
      const res = await fetch(
        `/api/rooms/${roomId}/messages?since=${since}&limit=20`,
        { headers: { "x-user-id": userId } }
      );
      if (!res.ok) throw new Error("Failed to load older messages");
      const olderMessages: Message[] = await res.json();
      if (olderMessages.length < 20) setHasMoreMessages(false);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = olderMessages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length > 0) {
          oldestTimestampRef.current = Math.min(
            ...newMsgs.map((m) => m.timestamp)
          );
        }
        return [...newMsgs, ...prev];
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, userId, loadingOlder, hasMoreMessages]);

  const loadOlderRef = useRef(loadOlderMessages);
  loadOlderRef.current = loadOlderMessages;
  useEffect(() => {
    loadOlderRef.current();
  }, []);

  return (
    <RoomContext.Provider
      value={{
        messages,
        status,
        sendMessage,
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
