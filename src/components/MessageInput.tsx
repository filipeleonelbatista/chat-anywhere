"use client";
import React, { useState, useRef } from "react";
import { ImagePicker } from "./ImagePicker";
import { LinkPreview } from "./LinkPreview";
import { useLinkDetection } from "@/hooks/useLinkDetection";

interface Props {
  onSend: (content: string) => void;
  onSendImage: (file: File) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onSendImage, disabled }: Props) {
  const [text, setText] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { links, detectLinks } = useLinkDetection();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    detectLinks(e.target.value);
  };

  const handleImageSelected = async (file: File) => {
    setShowImagePicker(false);
    onSendImage(file);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="chat-input-bg px-4 py-2 flex items-end gap-2"
    >
      <button
        type="button"
        onClick={() => setShowImagePicker(!showImagePicker)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="Attach image"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
          />
        </svg>
      </button>
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="w-full resize-none rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
          disabled={disabled}
        />
        {links.length > 0 && <LinkPreview url={links[0].url} />}
      </div>
      {showImagePicker && <ImagePicker onSelect={handleImageSelected} />}
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-2 text-whatsapp-green hover:text-whatsapp-green-dark disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
        aria-label="Send message"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
        </svg>
      </button>
    </form>
  );
}
