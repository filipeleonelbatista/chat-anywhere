"use client";
import React from "react";
import type { Message } from "@/types";
import { formatTimestamp } from "@/utils/formatting";

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

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 items-end gap-2`}>
      {!isOwn && (
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-lg flex-shrink-0">
          {message.senderAvatar}
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
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
              <img
                src={message.linkPreview.image}
                alt=""
                className="w-full h-32 object-cover"
              />
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
