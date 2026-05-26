# Message Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp-style message status icons (clock, single gray check, double blue check) with optimistic local state and server-side delivery determination.

**Architecture:** Client generates tempId, adds pending message locally, POSTs to server. Server counts connected users via SSE client map, sets status as "sent" or "delivered", broadcasts with tempId. Client reconciles via 201 response or SSE race. MessageBubble renders status-appropriate icon.

**Tech Stack:** Next.js 16 (App Router), Vercel KV, SSE (in-memory), Tailwind CSS, TypeScript

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/types/index.ts` | `MessageStatus` type, `status` field on `Message` |
| `src/lib/kv.ts` | Default `status: "sent"` on message read |
| `src/app/api/rooms/[roomId]/messages/route.ts` | Accept tempId, check room users, set status |
| `src/context/RoomContext.tsx` | Optimistic send, tempId reconciliation, status transitions |
| `src/components/MessageBubble.tsx` | Status icons (clock, single check, double blue check) |

### Task 1: Update types

**Files:**
- Modify: `src/types/index.ts:1-22`

- [ ] **Step 1: Add `MessageStatus` type and update `Message`**

Add the new type and field to `src/types/index.ts`:

```typescript
export type MessageType = "text" | "image" | "link";

export type MessageStatus = "pending" | "sent" | "delivered";

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
  timestamp: number;
  createdAt: string;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add MessageStatus type to Message"
```

### Task 2: Update KV to default status on read

**Files:**
- Modify: `src/lib/kv.ts`

- [ ] **Step 1: Read current `src/lib/kv.ts`**

Read the full file to understand `getMessages` and `getRecentMessages` functions.

- [ ] **Step 2: Add status default to `getMessages`**

In `getMessages`, after parsing each message from the hash, ensure `status` defaults to `"sent"`:

```typescript
const message: Message = {
  id,
  roomId,
  senderId: fields.senderId,
  senderName: fields.senderName,
  senderAvatar: fields.senderAvatar,
  content: fields.content,
  type: fields.type as MessageType,
  imageUrl: fields.imageUrl,
  linkPreview: fields.linkPreview ? JSON.parse(fields.linkPreview) : undefined,
  status: (fields.status as MessageStatus) || "sent",
  timestamp: Number(fields.timestamp),
  createdAt: fields.createdAt,
};
```

- [ ] **Step 3: Add status default to `getRecentMessages`**

Same change — ensure `status: (fields.status as MessageStatus) || "sent"` after parsing each message.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 5: Commit**

```bash
git add src/lib/kv.ts
git commit -m "feat: default status sent for legacy messages"
```

### Task 3: Update POST route to check delivery status

**Files:**
- Modify: `src/app/api/rooms/[roomId]/messages/route.ts`

- [ ] **Step 1: Read current POST handler**

Read the file to understand current message creation and broadcasting.

- [ ] **Step 2: Accept tempId from body**

Extract `tempId` from the request body:

```typescript
const { tempId, content, type, imageUrl, linkPreview } = await request.json();
```

- [ ] **Step 3: Check connected users and set status**

Import `getRoomUsers` from the SSE lib and add user count check:

```typescript
import { broadcastToRoom, getRoomUsers } from "@/lib/sse";

// after parsing body, before creating message:
const roomUsers = getRoomUsers(roomId);
const senderId = request.headers.get("x-user-id") || "";
const otherUsers = roomUsers.filter((u) => u.id !== senderId);
const status: MessageStatus = otherUsers.length > 0 ? "delivered" : "sent";
```

Include `status` in the message object:

```typescript
const message = {
  id,
  roomId,
  senderId,
  senderName,
  senderAvatar,
  content,
  type: (type as MessageType) || "text",
  ...(imageUrl && { imageUrl }),
  ...(linkPreview && { linkPreview }),
  status,
  timestamp: Date.now(),
  createdAt: new Date().toISOString(),
};
```

- [ ] **Step 4: Include tempId in broadcast and response**

Change `broadcastToRoom` to include `tempId`:

```typescript
broadcastToRoom(roomId, { message, tempId });
```

Change the response to include `tempId`:

```typescript
return NextResponse.json({ message, tempId }, { status: 201 });
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 6: Commit**

```bash
git add src/app/api/rooms/[roomId]/messages/route.ts
git commit -m "feat: POST route sets message status and includes tempId"
```

### Task 4: Update RoomContext with optimistic send and status transitions

**Files:**
- Modify: `src/context/RoomContext.tsx`

- [ ] **Step 1: Read current `RoomContext.tsx`**

Read the full file to understand `sendMessage`, `handleNewMessage`, and context structure.

- [ ] **Step 2: Update `sendMessage` for optimistic send**

Replace current `sendMessage` with an optimistic version:

```typescript
const sendMessage = useCallback(
  async (
    content: string,
    opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }
  ) => {
    const tempId = crypto.randomUUID();
    const pendingMessage: Message = {
      id: tempId,
      roomId,
      senderId: userId,
      senderName: userName,
      senderAvatar: userAvatar,
      content,
      type: opts?.imageUrl
        ? ("image" as const)
        : opts?.linkPreview
          ? ("link" as const)
          : ("text" as const),
      ...(opts?.imageUrl && { imageUrl: opts.imageUrl }),
      ...(opts?.linkPreview && { linkPreview: opts.linkPreview }),
      status: "pending",
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, pendingMessage]);

    try {
      const res = await fetch(`/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({ ...pendingMessage, tempId }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to send message: ${err}`);
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== tempId)
      );
    }
  },
  [roomId, userId, userName, userAvatar]
);
```

- [ ] **Step 3: Update `handleNewMessage` to reconcile tempId**

Change the SSE callback to find and replace pending messages by tempId if present:

```typescript
const handleNewMessage = useCallback((payload: { message: Message; tempId?: string }) => {
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
}, []);
```

Also update the `useSSE` call's `onMessage` type — need to accept `{ message: Message; tempId?: string }`:

```typescript
const { status } = useSSE({
  roomId,
  userId,
  userName,
  userAvatar,
  onMessage: handleNewMessage,
});
```

- [ ] **Step 4: Update `useSSE` hook to handle wrapped payload**

Read and update `src/hooks/useSSE.ts` to parse the SSE data as `{ message, tempId }` instead of raw `Message`:

```typescript
// Inside the onmessage handler, change:
const data = JSON.parse(event.data) as { message: Message; tempId?: string };
onMessage(data);
```

- [ ] **Step 5: Update RoomContextType interface**

Change `onMessage` in the SSE types or just ensure the cast is correct with the new shape.

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/context/RoomContext.tsx src/hooks/useSSE.ts
git commit -m "feat: optimistic send with tempId and SSE reconciliation"
```

### Task 5: Update MessageBubble with status icons

**Files:**
- Modify: `src/components/MessageBubble.tsx`

- [ ] **Step 1: Read current `MessageBubble.tsx`**

Read the current file — already have it fresh in context.

- [ ] **Step 2: Add Clock SVG icon component**

Add a clock icon component for pending status:

```typescript
function ClockIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm1-13h-2v6l5 3 .5-1-3.5-2V7z"/>
    </svg>
  );
}
```

- [ ] **Step 3: Add Single Check icon**

```typescript
function SingleCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 11" fill="currentColor">
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l2.455 2.557c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
    </svg>
  );
}
```

- [ ] **Step 4: Add Double Check icon**

```typescript
function DoubleCheckIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-blue-500" viewBox="0 0 16 11" fill="currentColor">
      <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l2.455 2.557c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
      <path d="M15.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-.735-.766a.49.49 0 0 0-.348-.155l.528.55c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365zM7.471 5.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-3.19 3.936-1.011-1.055a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l1.455 1.557c.19.2.495.19.684-.013l3.632-4.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z"/>
    </svg>
  );
}
```

- [ ] **Step 5: Replace static checkmark with dynamic status**

Find the current timestamp + checkmark section (around lines 96-109) and replace with:

```typescript
        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {isOwn && message.status === "pending" && <ClockIcon />}
          {isOwn && message.status === "sent" && <SingleCheckIcon />}
          {isOwn && message.status === "delivered" && <DoubleCheckIcon />}
        </div>
```

- [ ] **Step 6: Verify build**

Run: `npm run build`
Expected: build succeeds

- [ ] **Step 7: Commit**

```bash
git add src/components/MessageBubble.tsx
git commit -m "feat: message status icons (clock, single check, double blue check)"
```
