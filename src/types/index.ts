export type MessageType = "text" | "image" | "link";

export type MessageStatus = "pending" | "sent" | "delivered";

export const REACTION_EMOJIS = ["❤️", "😂", "😨", "😡", "🤔"] as const;

export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface Reaction {
  emoji: ReactionEmoji;
  userId: string;
  userName: string;
}

export interface LinkPreview {
  url: string;
  title: string;
  description: string;
  image?: string;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: MessageType;
  imageUrl?: string;
  linkPreview?: LinkPreview;
  status: MessageStatus;
  reactions?: Reaction[];
  deleted?: boolean;
  timestamp: number;
  createdAt: string;
}

export type SSEAction =
  | { action: "message"; message: Message; tempId?: string }
  | { action: "react"; messageId: string; reactions: Reaction[] }
  | { action: "delete"; messageId: string };

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  joinedAt: number;
}

export interface ConnectionStatus {
  type: "connected" | "reconnecting" | "disconnected";
  message?: string;
}
