"use client";
import React from "react";
import { UserProvider } from "@/context/UserContext";
import { ChatInterface } from "@/components/ChatInterface";

export default function RoomPage({
  params,
}: {
  params: { roomId: string };
}) {
  return (
    <UserProvider roomId={params.roomId}>
      <ChatInterface roomId={params.roomId} />
    </UserProvider>
  );
}
