export type MessageType = "text" | "image" | "link";

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
  timestamp: number;
  createdAt: string;
}

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
