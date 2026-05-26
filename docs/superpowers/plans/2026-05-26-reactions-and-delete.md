# Message Reactions and Deletion — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 5-emoji reaction system with toggle and message deletion with real-time broadcast.

**Architecture:** New API routes for react/delete update KV and broadcast SSE with action-typed payloads. RoomContext routes SSE by action. MessageBubble renders reaction bar, caret menu, emoji picker, and deleted state.

**Tech Stack:** Next.js 16 (App Router), Vercel KV, SSE (in-memory), Tailwind CSS, TypeScript

---

## File Structure

| Task | File(s) | Responsibility |
|------|---------|---------------|
| T1 | `src/types/index.ts` | `REACTION_EMOJIS`, `Reaction`, `SSEAction` types; `Message` fields |
| T2 | `src/lib/kv.ts` | `updateMessage()`, parse `reactions`/`deleted` on read |
| T3 | `src/app/api/rooms/[roomId]/messages/[messageId]/react/route.ts` | POST react endpoint |
| T4 | `src/app/api/rooms/[roomId]/messages/[messageId]/delete/route.ts` | POST delete endpoint |
| T5 | `src/hooks/useSSE.ts`, `src/context/RoomContext.tsx` | SSE action routing, `reactToMessage`, `deleteMessage` |
| T6 | `src/components/MessageBubble.tsx` | Reaction bar, caret menu, emoji picker, deleted state |
| T7 | `src/app/api/rooms/[roomId]/messages/route.ts` | Update SSE broadcast to include `action: "message"` |

### Task 1: Update types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add Reaction types and update Message**

Replace `src/types/index.ts` with the expanded types:

```typescript
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Reaction, SSEAction types; extend Message"
```

### Task 2: Update KV layer

**Files:**
- Modify: `src/lib/kv.ts`

- [ ] **Step 1: Add `updateMessage` function**

Add after `saveMessage`:

```typescript
import type { Message, MessageStatus } from "@/types";

export async function updateMessage(
  roomId: string,
  messageId: string,
  fields: Record<string, unknown>
): Promise<void> {
  const messageKey = `message:${messageId}`;
  await kv.hset(
    messageKey,
    Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v != null)
    )
  );
}
```

- [ ] **Step 2: Parse `reactions` and `deleted` on read**

In BOTH `getMessages` and `getRecentMessages`, update the message construction to include:

```typescript
const message: Message = {
  // ... existing fields
  status: (fields.status as MessageStatus) || "sent",
  reactions: fields.reactions ? JSON.parse(fields.reactions) : [],
  deleted: fields.deleted === "true",
  // ...
};
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/lib/kv.ts
git commit -m "feat: add updateMessage, parse reactions/deleted"
```

### Task 3: Create react API route

**Files:**
- Create: `src/app/api/rooms/[roomId]/messages/[messageId]/react/route.ts`

- [ ] **Step 1: Create the react endpoint**

Create the file:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateMessage, getMessages, getRecentMessages } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import type { Reaction, SSEAction } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { emoji, userId, userName } = await request.json();

    if (!emoji || !userId) {
      return NextResponse.json(
        { error: "Missing emoji or userId" },
        { status: 400 }
      );
    }

    // Fetch current reactions from KV
    const messages = await getRecentMessages(roomId, 100);
    const message = messages.find((m) => m.id === messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    let reactions = message.reactions || [];

    // Check if user already reacted
    const existingIndex = reactions.findIndex((r) => r.userId === userId);
    if (existingIndex !== -1) {
      if (reactions[existingIndex].emoji === emoji) {
        // Same emoji → remove (toggle off)
        reactions = reactions.filter((r) => r.userId !== userId);
      } else {
        // Different emoji → replace
        reactions[existingIndex] = { emoji, userId, userName } as Reaction;
      }
    } else {
      // New reaction → add
      reactions.push({ emoji, userId, userName } as Reaction);
    }

    // Persist
    await updateMessage(roomId, messageId, {
      reactions: JSON.stringify(reactions),
    });

    // Broadcast
    const payload: SSEAction = {
      action: "react",
      messageId,
      reactions,
    };
    broadcastToRoom(roomId, payload);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Failed to react" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rooms/[roomId]/messages/[messageId]/react/route.ts
git commit -m "feat: add react API endpoint"
```

### Task 4: Create delete API route

**Files:**
- Create: `src/app/api/rooms/[roomId]/messages/[messageId]/delete/route.ts`

- [ ] **Step 1: Create the delete endpoint**

Create the file:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { updateMessage, getRecentMessages } from "@/lib/kv";
import { broadcastToRoom } from "@/lib/sse";
import type { SSEAction } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string; messageId: string }> }
) {
  try {
    const { roomId, messageId } = await params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Verify sender
    const messages = await getRecentMessages(roomId, 100);
    const message = messages.find((m) => m.id === messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    if (message.senderId !== userId) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    // Mark as deleted — clear content, reactions, media
    await updateMessage(roomId, messageId, {
      deleted: "true",
      content: "",
      reactions: JSON.stringify([]),
    });

    // Broadcast
    const payload: SSEAction = {
      action: "delete",
      messageId,
    };
    broadcastToRoom(roomId, payload);

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { error: "Failed to delete" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rooms/[roomId]/messages/[messageId]/delete/route.ts
git commit -m "feat: add delete API endpoint"
```

### Task 5: Update messages POST route to include action in SSE

**Files:**
- Modify: `src/app/api/rooms/[roomId]/messages/route.ts`

- [ ] **Step 1: Change SSE broadcast to include `action: "message"`**

In the POST handler, change the broadcast from:

```typescript
broadcastToRoom(roomId, { message, tempId });
```

to:

```typescript
broadcastToRoom(roomId, { action: "message", message, tempId });
```

And the response:

```typescript
return NextResponse.json({ action: "message", message, tempId }, { status: 201 });
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/rooms/[roomId]/messages/route.ts
git commit -m "feat: include action in message SSE broadcast"
```

### Task 6: Update RoomContext and SSE hook for action routing

**Files:**
- Modify: `src/hooks/useSSE.ts`
- Modify: `src/context/RoomContext.tsx`

- [ ] **Step 1: Update `useSSE.ts` `onMessage` type**

Change the `onMessage` type from:

```typescript
onMessage: (data: { message: Message; tempId?: string }) => void;
```

to:

```typescript
onMessage: (data: SSEAction) => void;
```

Import `SSEAction` from `@/types`:

```typescript
import type { SSEAction } from "@/types";
```

Remove the `import type { Message }` if it's no longer needed directly.

- [ ] **Step 2: Update `RoomContext.tsx` — handleNewMessage routing**

Replace the current `handleNewMessage` with action-based routing:

```typescript
const handleNewMessage = useCallback((payload: SSEAction) => {
  if (payload.action === "message") {
    const { message, tempId } = payload;
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      if (tempId) {
        const pendingIndex = prev.findIndex((m) => m.id === tempId);
        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = message;
          return updated;
        }
      }
      return [...prev, message];
    });
  } else if (payload.action === "react") {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === payload.messageId
          ? { ...m, reactions: payload.reactions }
          : m
      )
    );
  } else if (payload.action === "delete") {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === payload.messageId
          ? { ...m, deleted: true, content: "", imageUrl: undefined, linkPreview: undefined, reactions: [] }
          : m
      )
    );
  }
}, []);
```

- [ ] **Step 3: Add `reactToMessage` and `deleteMessage` to RoomContext**

Add these methods to the context type and provider:

```typescript
interface RoomContextType {
  messages: Message[];
  status: ConnectionStatus;
  sendMessage: (
    content: string,
    opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }
  ) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  loadingOlder: boolean;
}
```

Add the implementations before the return statement:

```typescript
const reactToMessage = useCallback(
  async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/messages/${messageId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userId, userName }),
      });
    } catch {
      // Silently fail — SSE will correct state if needed
    }
  },
  [roomId, userId, userName]
);

const deleteMessage = useCallback(
  async (messageId: string) => {
    try {
      await fetch(`/api/rooms/${roomId}/messages/${messageId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch {
      // Silently fail
    }
  },
  [roomId, userId]
);
```

Update the context provider value to include both:

```typescript
value={{
  messages,
  status,
  sendMessage,
  reactToMessage,
  deleteMessage,
  loadOlderMessages,
  hasMoreMessages,
  loadingOlder,
}}
```

- [ ] **Step 4: Update imports in RoomContext.tsx**

Add `SSEAction` to the import from `@/types`:

```typescript
import type { Message, ConnectionStatus, SSEAction } from "@/types";
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSSE.ts src/context/RoomContext.tsx
git commit -m "feat: SSE action routing, reactToMessage, deleteMessage"
```

### Task 7: Update MessageBubble UI

**Files:**
- Modify: `src/components/MessageBubble.tsx`

- [ ] **Step 1: Read current `MessageBubble.tsx`**

Read the current file to understand the full structure.

- [ ] **Step 2: Add `useRoom` import and context**

Import the room context to access `reactToMessage` and `deleteMessage`:

```typescript
import { useRoom } from "@/context/RoomContext";
import { REACTION_EMOJIS } from "@/types";
import type { Reaction } from "@/types";
```

- [ ] **Step 3: Add state for menu and emoji picker**

Inside the `MessageBubble` function, add state:

```typescript
const [menuOpen, setMenuOpen] = useState(false);
const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
const { reactToMessage, deleteMessage } = useRoom();
const menuRef = useRef<HTMLDivElement>(null);
```

Add imports:

```typescript
import React, { useState, useRef, useEffect } from "react";
```

- [ ] **Step 4: Add click-outside handler for menu**

```typescript
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
```

- [ ] **Step 5: Add deleted message rendering**

At the top of the bubble content (right after sender name rendering), handle deleted state:

```typescript
{message.deleted ? (
  <div className="italic text-gray-400 dark:text-gray-500 text-sm py-1">
    mensagem apagada pelo usuario
  </div>
) : (
  <>
    {/* existing content: image, link preview, text */}
  </>
)}
```

When deleted, also skip the reaction bar (don't render it).

- [ ] **Step 6: Add caret down button and dropdown menu**

Add the caret button and dropdown. Position it at the top-right of the bubble (inside the bubble, before content):

```typescript
{/* ... sender name ... */}
<div className="relative">
  <button
    onClick={() => setMenuOpen(!menuOpen)}
    className="absolute -top-1 right-0 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-xs"
    aria-label="Menu"
  >
    ▼
  </button>

  {menuOpen && (
    <div
      ref={menuRef}
      className={`absolute top-5 right-0 z-50 bg-white dark:bg-gray-800 shadow-lg rounded-lg border dark:border-gray-700 py-1 min-w-[140px]`}
    >
      <button
        onClick={() => {
          setEmojiPickerOpen(!emojiPickerOpen);
        }}
        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {emojiPickerOpen ? "◀ Voltar" : "😊 Reagir"}
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
          className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          🗑 Excluir
        </button>
      )}
    </div>
  )}
</div>
```

The caret button should be rendered inside the bubble div but positioned absolutely so it doesn't affect layout.

- [ ] **Step 7: Add reaction bar at the bottom**

After the content and before the timestamp line, add the reaction bar:

```typescript
{!message.deleted && message.reactions && message.reactions.length > 0 && (
  <div className={`flex flex-wrap gap-1 -mt-1 mb-1 ${isOwn ? "justify-start" : "justify-end"}`}>
    {aggregateReactions(message.reactions).map(({ emoji, count, users }) => (
      <span
        key={emoji}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded-full border dark:border-gray-600 text-xs shadow-sm"
        title={users.join(", ")}
      >
        <span>{emoji}</span>
        <span className="text-gray-500 dark:text-gray-400">{count}</span>
      </span>
    ))}
  </div>
)}
```

Add the helper function before the component:

```typescript
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
```

- [ ] **Step 8: Fix the bubble positioning to accommodate the caret**

The current bubble div needs `relative` class for the absolute-positioned caret menu to work. Add `relative` to the bubble's className.

Also, ensure the deleted content is wrapped properly — the full content section should be inside the condition:

```typescript
{message.deleted ? (
  <div className="italic text-gray-400 dark:text-gray-500 text-sm py-3">
    mensagem apagada pelo usuario
  </div>
) : (
  <>
    {message.type === "image" && message.imageUrl && ( ... )}
    {message.type === "link" && message.linkPreview && ( ... )}
    <p className="...">{linkify(message.content)}</p>
    {message.reactions && message.reactions.length > 0 && (
      <div className={`flex flex-wrap gap-1 mb-1 ${isOwn ? "justify-start" : "justify-end"}`}>
        {/* reaction pills */}
      </div>
    )}
  </>
)}
```

- [ ] **Step 9: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 10: Commit**

```bash
git add src/components/MessageBubble.tsx
git commit -m "feat: reactions bar, caret menu, emoji picker, deleted state"
```
