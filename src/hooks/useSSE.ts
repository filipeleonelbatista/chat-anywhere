"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Message, ConnectionStatus } from "@/types";

interface UseSSEOptions {
  roomId: string;
  userId: string;
  onMessage: (message: Message) => void;
}

export function useSSE({ roomId, userId, onMessage }: UseSSEOptions) {
  const [status, setStatus] = useState<ConnectionStatus>({
    type: "disconnected",
  });
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/rooms/${roomId}/sse?userId=${userId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    retryCountRef.current = 0;

    es.onopen = () => {
      setStatus({ type: "connected" });
      retryCountRef.current = 0;
    };

    es.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as Message;
        onMessage(message);
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
        setTimeout(connect, delay);
      } else {
        setStatus({ type: "disconnected", message: "Connection lost" });
      }
    };
  }, [roomId, userId, onMessage]);

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
