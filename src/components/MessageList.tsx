"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { NewMessageIndicator } from "./NewMessageIndicator";
import type { Message } from "@/types";

interface Props {
  messages: Message[];
  userId: string;
  onLoadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
}

export function MessageList({
  messages,
  userId,
  onLoadOlder,
  hasMore,
  loadingOlder,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const prevLengthRef = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
      setNewCount(0);
    } else if (messages.length > prevLengthRef.current) {
      setNewCount((c) => c + (messages.length - prevLengthRef.current));
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
    if (el.scrollTop < 50 && hasMore && !loadingOlder) {
      onLoadOlder();
    }
  }, [hasMore, loadingOlder, onLoadOlder]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
    >
      {loadingOlder && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-400">
            Loading older messages...
          </span>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === userId}
        />
      ))}
      <div ref={bottomRef} />
      <NewMessageIndicator count={newCount} onClick={scrollToBottom} />
    </div>
  );
}
