"use client";
import React, { useState, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { RoomProvider } from "@/context/RoomContext";
import { useRoom } from "@/context/RoomContext";
import { UserRegistrationModal } from "./UserRegistrationModal";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConnectionStatus } from "./ConnectionStatus";
import { HelpModal } from "./HelpModal";
import { ThemeToggle } from "./ThemeToggle";
import { PeopleModal } from "./PeopleModal";
import { uploadImage } from "@/lib/blob";
import type { LinkPreview, Message, ReplyTo } from "@/types";

interface Props {
  roomId: string;
}

function ChatContent({ roomId }: { roomId: string }) {
  const { user } = useUser();
  const [helpOpen, setHelpOpen] = useState(false);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const {
    messages,
    status,
    sendMessage,
    loadOlderMessages,
    hasMoreMessages,
    loadingOlder,
  } = useRoom();

  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);

  const handleReply = useCallback((message: Message) => {
    setReplyingTo({
      messageId: message.id,
      senderName: message.senderName,
      content: message.content.slice(0, 80),
    });
  }, []);

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleSend = useCallback((content: string, linkPreview?: LinkPreview) => {
    sendMessage(content, { linkPreview, replyTo: replyingTo ?? undefined });
    setReplyingTo(null);
  }, [replyingTo, sendMessage]);

  const handleSendImage = async (file: File) => {
    try {
      const { url } = await uploadImage(file);
      sendMessage("", { imageUrl: url });
    } catch {
      alert("Falha ao enviar imagem. Tente novamente.");
    }
  };

  const statusLabel =
    status.type === "connected"
      ? "Conectado"
      : status.type === "reconnecting"
        ? "Reconectando..."
        : "Desconectado";

  return (
    <div className="flex flex-col h-full w-full mx-auto max-w-3xl lg:max-w-none shadow-2xl relative bg-whatsapp-bg dark:bg-whatsapp-bg-dark" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      {/* Header */}
      <div className="chat-header flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
            {user!.avatar}
          </div>
          <div className="min-w-0">
            <h1 className="font-semibold text-sm truncate">#{roomId}</h1>
            <div
              className="flex items-center gap-1.5 cursor-default"
              title={statusLabel}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  status.type === "connected"
                    ? "bg-green-500"
                    : status.type === "reconnecting"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
              />
              <p className="text-xs opacity-80 truncate">{user!.name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <ThemeToggle />
          <button
            onClick={() => setPeopleOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors text-sm"
            aria-label="Pessoas na sala"
            title="Pessoas na sala"
          >
            👥
          </button>
          <button
            onClick={() => setHelpOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition-colors text-sm font-bold"
            aria-label="Ajuda"
            title="Como funciona"
          >
            ?
          </button>
        </div>
      </div>
      {/* Messages */}
      <MessageList
        messages={messages}
        userId={user!.id}
        onLoadOlder={loadOlderMessages}
        hasMore={hasMoreMessages}
        loadingOlder={loadingOlder}
        onReply={handleReply}
      />
      {/* Input */}
      <MessageInput
        onSend={handleSend}
        onSendImage={handleSendImage}
        disabled={status.type === "disconnected"}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />
      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
      {/* People Modal */}
      <PeopleModal
        roomId={roomId}
        isOpen={peopleOpen}
        onClose={() => setPeopleOpen(false)}
      />
    </div>
  );
}

export function ChatInterface({ roomId }: Props) {
  const { user, register, isRegistered } = useUser();

  const handleRegister = (
    name: string,
    email: string,
    avatar: string
  ) => {
    register(name, email, avatar);
  };

  if (!isRegistered || !user) {
    return (
      <UserRegistrationModal roomId={roomId} onRegister={handleRegister} />
    );
  }

  return (
    <RoomProvider
      roomId={roomId}
      userId={user.id}
      userName={user.name}
      userAvatar={user.avatar}
    >
      <ChatContent roomId={roomId} />
    </RoomProvider>
  );
}
