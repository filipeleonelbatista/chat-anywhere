# Message Reactions and Deletion — Design Specification

**Date**: 2026-05-26
**Project**: chat-anywhere
**Status**: Draft

## 1. Overview

Add WhatsApp-style message reactions (5 emojis) and message deletion to the chat interface:
- ❤️ 😂 😨 😡 🤔 — each user can react once (replaces previous reaction)
- Reactions display with emoji + count in the corner opposite to timestamp
- Caret-down menu on each message with "Reagir" (emoji picker) and "Excluir" (own messages only)
- Deleted message shows "mensagem apagada pelo usuario", all content/reactions cleared

## 2. Data Model

### types/index.ts

```typescript
export const REACTION_EMOJIS = ["❤️", "😂", "😨", "😡", "🤔"] as const;
export type ReactionEmoji = typeof REACTION_EMOJIS[number];

export interface Reaction {
  emoji: ReactionEmoji;
  userId: string;
  userName: string;
}

export interface Message {
  // ... existing fields unchanged
  reactions?: Reaction[];
  deleted?: boolean;
}
```

### KV backward compatibility
- `getMessages` / `getRecentMessages` supply `reactions: []` and `deleted: false` by default
- Existing messages render normally (no reactions, not deleted)

## 3. API Changes

### New route: `POST /api/rooms/[roomId]/messages/[messageId]/react`

- Body: `{ emoji: string, userId: string, userName: string }`
- Server checks if user already reacted:
  - If same emoji → remove reaction (toggle off)
  - If different emoji → replace reaction
  - If no reaction → add
- Calls `updateMessage(roomId, messageId, { reactions })` in KV
- SSE broadcast: `{ action: "react", messageId, reactions }`

### New route: `POST /api/rooms/[roomId]/messages/[messageId]/delete`

- Body: `{ userId: string }`
- Validates `userId` matches `message.senderId`
- Calls `updateMessage(roomId, messageId, { deleted: true, content: "", imageUrl: null, linkPreview: null, reactions: [] })`
- SSE broadcast: `{ action: "delete", messageId }`

### SSE payload format

All SSE events now carry an `action` field:

```typescript
type SSEAction =
  | { action: "message"; message: Message; tempId?: string }
  | { action: "react"; messageId: string; reactions: Reaction[] }
  | { action: "delete"; messageId: string };
```

## 4. KV Changes

### kv.ts

New function:

```typescript
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

Update `getMessages` and `getRecentMessages` to parse `reactions` and `deleted`:

```typescript
const message: Message = {
  // ... existing fields
  status: (fields.status as MessageStatus) || "sent",
  reactions: fields.reactions ? JSON.parse(fields.reactions) : [],
  deleted: fields.deleted === "true",
  // ...
};
```

## 5. Client Changes

### RoomContext

- New SSE action routing in `handleNewMessage`:
  - `"message"` → existing logic (dedup/tempId replace)
  - `"react"` → `setMessages` updates `reactions` on the matching messageId
  - `"delete"` → `setMessages` updates `deleted: true` and clears fields on matching messageId
- New methods exposed: `reactToMessage(messageId, emoji)`, `deleteMessage(messageId)`

### MessageBubble

- **Deleted state**: if `message.deleted`, render only the sender name + "mensagem apagada pelo usuario" + timestamp — no content, image, link preview, reactions
- **Reaction bar**: at the bottom of the bubble, opposite side from timestamp/status. For own messages: left side. For others: right side. Shows each unique emoji with count
- **Caret-down menu (▼)**: positioned at the top-right corner of the bubble (or inline). On click, shows dropdown:
  - "Reagir" → opens inline emoji picker (5 emojis)
  - "Excluir" → only for `isOwn` messages, calls `deleteMessage`
- **Emoji picker**: simple row of 5 clickable emojis. Clicking replaces the user's reaction

## 6. UI Layout

```
┌─────────────────────────────┐
│                     [▼]     │  <- caret menu (top right)
│ [sender name]               │
│ ┌─ link preview card ─────┐ │
│ │ ...                     │ │
│ └─────────────────────────┘ │
│ message content text        │
│ ❤️1 😂2              12:30 ✓✓│  <- reactions (left) + timestamp + status (right)
└─────────────────────────────┘
```

For others' messages, the reaction bar appears on the right side.

Deleted message:

```
┌─────────────────────────────┐
│ [sender name]               │
│ ┌─────────────────────────┐ │
│ │ mensagem apagada pelo   │ │
│ │ usuario                 │ │
│ └─────────────────────────┘ │
│                        12:30│
└─────────────────────────────┘
```

## 7. Error Handling

- Reaction POST fails → UI keeps previous state (no change)
- Delete POST fails → UI keeps message as-is
- SSE event for reaction/delete arrives before API response → state updated correctly (idempotent by messageId)

## 8. Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Reaction`, `REACTION_EMOJIS`, fields to `Message` |
| `src/lib/kv.ts` | Add `updateMessage`, parse `reactions`/`deleted` on read |
| `src/app/api/rooms/[roomId]/messages/route.ts` | Import new types |
| `src/app/api/rooms/[roomId]/messages/[messageId]/react/route.ts` | NEW — react endpoint |
| `src/app/api/rooms/[roomId]/messages/[messageId]/delete/route.ts` | NEW — delete endpoint |
| `src/context/RoomContext.tsx` | Action routing, `reactToMessage`, `deleteMessage` |
| `src/hooks/useSSE.ts` | Update `onMessage` type for `SSEAction` |
| `src/components/MessageBubble.tsx` | Reactions bar, caret menu, emoji picker, deleted state |
