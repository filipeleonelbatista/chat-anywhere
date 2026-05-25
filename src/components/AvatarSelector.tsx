"use client";
import React from "react";

const AVATARS = [
  "😀", "😎", "🤩", "😺", "🦊", "🐼",
  "🐨", "🦁", "🐯", "🐸", "🦄", "🐙",
];

interface Props {
  selected: string;
  onSelect: (avatar: string) => void;
}

export function AvatarSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          onClick={() => onSelect(avatar)}
          className={`text-3xl w-12 h-12 rounded-full transition-all ${
            selected === avatar
              ? "ring-2 ring-whatsapp-green scale-110 bg-gray-100 dark:bg-gray-600"
              : "hover:bg-gray-100 dark:hover:bg-gray-600"
          }`}
          aria-label={`Select avatar ${avatar}`}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
}
