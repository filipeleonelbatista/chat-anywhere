"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Message, ConnectionStatus } from "@/types";

interface UseSSEOptions {
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  onMessage: (data: { message: Message; tempId?: string }) => void;
}

export function useSSE({ roomId, userId, userName, userAvatar, onMessage }: UseSSEOptions) {
  const [status, setStatus] = useState<ConnectionStatus>({
    type: "disconnected",
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  const connect = useCallback(function connectFn() {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/rooms/${roomId}/sse?userId=${userId}&userName=${encodeURIComponent(userName)}&userAvatar=${encodeURIComponent(userAvatar)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    retryCountRef.current = 0;

    es.onopen = () => {
      setStatus({ type: "connected" });
      retryCountRef.current = 0;
    };

    es.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data) as { message: Message; tempId?: string };
        onMessage(data);
      } catch {
        // Ignore malformed messages
      }
    });

    es.onerror = () => {
      es.close();
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setStatus({
          type: "reconnecting",
          message: `Reconnecting (${retryCountRef.current}/${maxRetries})...`,
        });
        const delay = Math.min(
          1000 * Math.pow(2, retryCountRef.current),
          30000
        );
        setTimeout(connectFn, delay);
      } else {
        setStatus({ type: "disconnected", message: "Connection lost" });
      }
    };
  }, [roomId, userId, userName, userAvatar, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { status };
}
