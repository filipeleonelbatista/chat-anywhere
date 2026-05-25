"use client";
import React from "react";
import type { ConnectionStatus as CS } from "@/types";

interface Props {
  status: CS;
}

export function ConnectionStatus({ status }: Props) {
  const colors = {
    connected: "bg-green-500",
    reconnecting: "bg-yellow-500",
    disconnected: "bg-red-500",
  };
  const labels = {
    connected: "Connected",
    reconnecting: "Reconnecting...",
    disconnected: "Disconnected",
  };
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colors[status.type]}`} />
      <span className="text-xs opacity-80">{labels[status.type]}</span>
    </div>
  );
}
