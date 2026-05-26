# Message Status (WhatsApp-style) — Design Specification

**Date**: 2026-05-26
**Project**: chat-anywhere
**Status**: Draft

## 1. Overview

Add WhatsApp-style message delivery indicators to the chat interface:
- 🕐 Clock icon while the message is being sent (pending)
- ✓ Single gray check when the message is stored on the server (sent)
- ✓✓ Double blue check when the message was broadcast to other connected clients (delivered)

## 2. Data Model

### types/index.ts

```typescript
export type MessageStatus = "pending" | "sent" | "delivered";

export interface Message {
  // ... existing fields unchanged
  status: MessageStatus;
}
```

### kv.ts
- No schema changes needed — `saveMessage` persists arbitrary fields
- `getMessages` and `getRecentMessages` supply `status: "sent"` as default when field is absent (backward compat)

## 3. Flow

### Send flow (optimistic)

```
User clicks send
  │
  ├─1. RoomContext.sendMessage()
  │     ├─ Generate local tempId
  │     ├─ Add message to state with status:"pending"
  │     └─ POST /api/rooms/{roomId}/messages (includes tempId)
  │
  ├─2. Server (POST route)
  │     ├─ Generate server id
  │     ├─ Count other connected users via getRoomUsers(roomId)
  │     ├─ Set status: others.length > 0 ? "delivered" : "sent"
  │     ├─ saveMessage() to KV
  │     ├─ broadcastToRoom() with { message, tempId }
  │     └─ Response 201 with { message, tempId }
  │
  ├─3. Client receives 201
  │     └─ updateMessageStatus(tempId, response.status)
  │        (pending → sent or delivered)
  │
  │
  └─4. SSE event arrives (carries tempId + server message)
        │
        ├─ If 201 already processed: message.id exists → dedup (skip)
        │
        └─ If SSE arrived first (before 201):
             └─ handleNewMessage finds pending by tempId, replaces with server data
```

### Receiving side (other users)
- SSE broadcasts message with `status: "delivered"` (since there are other users)
- Message appears already with double blue check

## 4. API Changes

### `POST /api/rooms/[roomId]/messages`

- Accept `tempId` in request body
- Before saving, call `getRoomUsers(roomId)` to count other connected users
- Set `message.status = otherUsers.length > 0 ? "delivered" : "sent"`
- Include `tempId` in the SSE broadcast payload and in the response body

### Response body change

```json
{
  "tempId": "abc-123",
  "message": { "id": "...", "status": "sent", ... }
}
```

## 5. Client Changes

### RoomContext

- `sendMessage`: generate tempId, add pending message locally, POST with tempId, on success update status, on error mark as failed
- `handleNewMessage`: if SSE event includes tempId that matches a pending message, replace it instead of deduping
- New state: `updateMessageStatus(tempId, newStatus)` helper

### MessageBubble

- Replace static single checkmark SVG with dynamic status icons:
  - `pending`: clock icon (gray animated)
  - `sent`: single check (gray)
  - `delivered`: double check (blue)
- For non-own messages: no status icon (just timestamp)

## 6. KV Backward Compatibility

- Existing stored messages lack `status` field
- `getMessages` / `getRecentMessages` supply default `status: "sent"` when parsing
- Old messages render with single gray check (correct behavior)

## 7. Error Handling

- POST fails → message stays as `"pending"`, UI shows clock indefinitely
- Future enhancement: add error state ("failed") with retry button

## 8. Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `MessageStatus` type, add `status` to `Message` |
| `src/context/RoomContext.tsx` | Optimistic send with tempId, status transition, handle tempId from SSE |
| `src/components/MessageBubble.tsx` | Status icons (clock, single check, double blue check) |
| `src/app/api/rooms/[roomId]/messages/route.ts` | Accept tempId, check room users, set status |
| `src/lib/kv.ts` | Default `status: "sent"` on read |
