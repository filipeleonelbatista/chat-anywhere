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
      handleSubmitAndReset();
    }
  };

  const adjustHeight = () => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    detectLinks(e.target.value);
    requestAnimationFrame(adjustHeight);
  };

  const handleSubmitAndReset = (e?: React.FormEvent) => {
    handleSubmit(e);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (el) el.style.height = "auto";
    });
  };

  const handleImageSelected = async (file: File) => {
    setShowImagePicker(false);
    onSendImage(file);
  };

  return (
    <div className="relative w-full flex justify-center">
      <form
        onSubmit={handleSubmitAndReset}
        className="w-[95%]"
      >
        <div className="flex items-end gap-0 bg-white dark:bg-gray-800 rounded-[28px] px-1 py-0.5 shadow-lg mb-3 relative">
          <button
            type="button"
            onClick={() => setShowImagePicker(!showImagePicker)}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex-shrink-0 mb-[1.8px]"
            aria-label="Attach image"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
          <div className="flex-1 relative min-w-0">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem"
              rows={1}
              className="w-full resize-none px-3 py-3 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none overflow-y-auto text-sm leading-5"
              disabled={disabled}
            />
            {links.length > 0 && <LinkPreview url={links[0].url} />}
          </div>
          <button
            type="submit"
            disabled={!text.trim() || disabled}
            className="w-12 h-12 flex items-center justify-center bg-whatsapp-green hover:bg-whatsapp-green-dark disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-colors flex-shrink-0 mb-[1.8px]"
            aria-label="Send message"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
            </svg>
          </button>
          {showImagePicker && <ImagePicker onSelect={handleImageSelected} />}
        </div>
      </form>
    </div>
  );
}
