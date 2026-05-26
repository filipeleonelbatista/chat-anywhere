"use client";
import React, { useState, useRef, useEffect } from "react";
import type { Message, Reaction } from "@/types";
import { REACTION_EMOJIS } from "@/types";
import { formatTimestamp } from "@/utils/formatting";
import { useRoom } from "@/context/RoomContext";

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}>])/g;

function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5 3 .5-1-3.5-2V7z"/>
    </svg>
  );
}

function SingleCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 11" fill="currentColor">
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l2.455 2.557c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
    </svg>
  );
}

function DoubleCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 16 11" fill="currentColor">
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l2.455 2.557c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.735-.766a.49.49 0 0 0-.348-.155l.528.55c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365zM7.471 5.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-3.19 3.936-1.011-1.055a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l1.455 1.557c.19.2.495.19.684-.013l3.632-4.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
    </svg>
  );
}

function linkify(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(URL_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <a
        key={match.index}
        href={match[1]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
      >
        {match[1]}
      </a>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : text;
}

function aggregateReactions(reactions: Reaction[]) {
  const map = new Map<string, { emoji: string; count: number; users: string[] }>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count++;
      existing.users.push(r.userName);
    } else {
      map.set(r.emoji, { emoji: r.emoji, count: 1, users: [r.userName] });
    }
  }
  return Array.from(map.values());
}

interface Props {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  scrollToMessage: (messageId: string) => void;
}

export function MessageBubble({ message, isOwn, onReply, scrollToMessage }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const { reactToMessage, deleteMessage } = useRoom();
  const menuRef = useRef<HTMLDivElement>(null);

  const positioningRef = useRef(true);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setEmojiPickerOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Adjust dropdown position to stay within viewport
  useEffect(() => {
    if (!menuOpen) {
      positioningRef.current = true;
      return;
    }
    const el = menuRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    el.style.right = "";
    el.style.left = "";
    el.style.top = "";
    el.style.bottom = "";

    if (rect.right > window.innerWidth) {
      el.style.right = "auto";
      el.style.left = "0";
    }
    if (rect.bottom > window.innerHeight) {
      el.style.top = "auto";
      el.style.bottom = "calc(100% + 8px)";
    }
  }, [menuOpen]);

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 items-end gap-2`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg flex-shrink-0">
          {message.senderAvatar}
        </div>
      )}
      <div
        className={`max-w-[80%] relative group rounded-lg px-3 py-2 shadow-sm ${
          isOwn
            ? "bg-whatsapp-bubble dark:bg-[#005C4B] rounded-br-sm"
            : "bg-white dark:bg-gray-700 rounded-bl-sm"
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green mb-1">
            {message.senderName}
          </p>
        )}

        {/* Reply preview */}
        {message.replyTo && (
          <div
            className="flex items-stretch gap-2 mb-2 cursor-pointer"
            onClick={() => scrollToMessage(message.replyTo.messageId)}
          >
            <div className={`w-1 rounded-full flex-shrink-0 ${
              message.replyTo.deleted
                ? "bg-gray-300 dark:bg-gray-500"
                : "bg-whatsapp-green dark:bg-green-400"
            }`} />
            <div className="flex-1 min-w-0 bg-black/5 dark:bg-white/10 rounded p-1.5">
              <p className="text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green truncate">
                {message.replyTo.senderName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {message.replyTo.deleted ? (
                  <span className="italic">mensagem apagada</span>
                ) : (
                  message.replyTo.content
                )}
              </p>
            </div>
          </div>
        )}

        {/* Caret menu */}
        <div className="absolute top-1 right-1">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs opacity-0 group-hover:opacity-100"
            aria-label="Menu"
          >
            ▼
          </button>

          {menuOpen && (
            <div
              ref={menuRef}
              className="absolute top-6 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 py-1 min-w-[150px]"
            >
              <button
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                😊 Reagir
              </button>

              <button
                onClick={() => {
                  onReply(message);
                  setMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                ↩ Responder
              </button>

              {emojiPickerOpen && (
                <div className="flex gap-1 px-3 py-2 border-t dark:border-gray-700">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        reactToMessage(message.id, emoji);
                        setMenuOpen(false);
                        setEmojiPickerOpen(false);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {isOwn && (
                <button
                  onClick={() => {
                    deleteMessage(message.id);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  🗑 Excluir
                </button>
              )}
            </div>
          )}
        </div>

        {message.deleted ? (
          <div className="italic text-gray-400 dark:text-gray-500 text-sm py-3 text-center">
            mensagem apagada pelo usuario
          </div>
        ) : (
          <>
            {message.type === "image" && message.imageUrl && (
              <img
                src={message.imageUrl}
                alt="Shared image"
                className="max-w-full rounded-lg mb-1 cursor-pointer"
                onClick={() => window.open(message.imageUrl, "_blank")}
              />
            )}
            {message.type === "link" && message.linkPreview && (
              <a
                href={message.linkPreview.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block mb-1 border rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                {message.linkPreview.image && (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={message.linkPreview.image}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-2">
                  <p className="text-sm font-semibold truncate">
                    {message.linkPreview.title}
                  </p>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {message.linkPreview.description}
                  </p>
                </div>
              </a>
            )}
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
              {linkify(message.content)}
            </p>
          </>
        )}
        {!message.deleted && message.reactions && message.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mb-1 ${isOwn ? "justify-start" : "justify-end"}`}>
            {aggregateReactions(message.reactions).map(({ emoji, count, users }) => (
              <span
                key={emoji}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded-full border dark:border-gray-600 text-xs shadow-sm cursor-default"
                title={users.join(", ")}
              >
                <span>{emoji}</span>
                <span className="text-gray-500 dark:text-gray-400">{count}</span>
              </span>
            ))}
          </div>
        )}

        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {isOwn && message.status === "pending" && <ClockIcon />}
          {isOwn && message.status === "sent" && <SingleCheckIcon />}
          {isOwn && message.status === "delivered" && <DoubleCheckIcon />}
        </div>
      </div>
    </div>
  );
}
