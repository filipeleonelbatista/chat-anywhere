"use client";
import React from "react";
import { UserProvider } from "@/context/UserContext";
import { ChatInterface } from "@/components/ChatInterface";

export default function RoomClient({ roomId }: { roomId: string }) {
  return (
    <UserProvider roomId={roomId}>
      <ChatInterface roomId={roomId} />
    </UserProvider>
  );
}
