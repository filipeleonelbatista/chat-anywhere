"use client";
import React from "react";

interface Props {
  count: number;
  onClick: () => void;
}

export function NewMessageIndicator({ count, onClick }: Props) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-whatsapp-green text-white text-sm px-4 py-1.5 rounded-full shadow-lg hover:bg-whatsapp-green-dark transition-colors animate-bounce"
    >
      {count} new message{count !== 1 ? "s" : ""} ↓
    </button>
  );
}
