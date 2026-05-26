# Reply to Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to reply to a specific message with preview, scroll-to-original, and live update on deletion.

**Architecture:** `ReplyTo` type holding original message metadata; `replyingTo` local state in `ChatContent`; MessageInput shows preview bar; MessageBubble renders reply preview + caret menu button + scroll-to-original; SSE delete handler updates references.

**Tech Stack:** Next.js, React, Vercel KV, SSE

---

### Task 1: Types

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/lib/kv.ts`

- [ ] **Step 1: Add `ReplyTo` interface and update `Message`**

In `src/types/index.ts`, add before `Message`:

```typescript
export interface ReplyTo {
  messageId: string;
  senderName: string;
  content: string;       // preview truncado (80 chars)
  deleted?: boolean;
}
```

Add `replyTo` field to `Message`:

```typescript
export interface Message {
  // ... existing fields
  replyTo?: ReplyTo;
}
```

- [ ] **Step 2: Update `StoredMessage` in kv.ts**

In `src/lib/kv.ts`, add `replyTo` to `StoredMessage`:

```typescript
export interface StoredMessage {
  // ... existing fields
  replyTo?: ReplyTo;
}
```

Also add the missing import at the top:

```typescript
import type { Message, MessageStatus, Reaction, ReplyTo } from "@/types";
```

- [ ] **Step 3: Parse `replyTo` in `getMessages` and `getRecentMessages`**

In both `getMessages` and `getRecentMessages`, add after the `deleted` line:

```typescript
replyTo: fields.replyTo ? JSON.parse(fields.replyTo) : undefined,
```

- [ ] **Step 4: Save `replyTo` in API route**

In `src/app/api/rooms/[roomId]/messages/route.ts`, destructure `replyTo` from the request body, and include it in the message:

```typescript
const { content, type, senderId, senderName, senderAvatar, imageUrl, linkPreview, tempId, replyTo } = await request.json();

// ... in the message object:
const message: Message = {
  // ... existing fields
  ...(replyTo && { replyTo }),
};
```

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/lib/kv.ts src/app/api/rooms/[roomId]/messages/route.ts
git commit -m "feat: add ReplyTo type and wire through KV and API"
```

---

### Task 2: RoomContext — extend `sendMessage` opts and SSE delete handler

**Files:**
- Modify: `src/context/RoomContext.tsx`

- [ ] **Step 1: Add `replyTo` to `SendMessageOpts`**

Replace the `sendMessage` type signature in `RoomContextType`:

```typescript
sendMessage: (
  content: string,
  opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"]; replyTo?: ReplyTo }
) => Promise<void>;
```

Add `ReplyTo` to imports:

```typescript
import type { Message, ConnectionStatus, SSEAction, ReplyTo } from "@/types";
```

- [ ] **Step 2: Add `replyTo` to pending message**

In the `sendMessage` callback, add `replyTo` spread:

```typescript
const pendingMessage: Message = {
  id: tempId,
  // ... existing fields
  ...(opts?.replyTo && { replyTo: opts.replyTo }),
  status: "pending",
  timestamp: Date.now(),
  createdAt: new Date().toISOString(),
};
```

- [ ] **Step 3: Update SSE delete handler to update replies**

Replace the `action === "delete"` handler:

```typescript
} else if (payload.action === "delete") {
  setMessages((prev) =>
    prev.map((m) => {
      if (m.replyTo?.messageId === payload.messageId) {
        return { ...m, replyTo: { ...m.replyTo, deleted: true } };
      }
      if (m.id === payload.messageId) {
        return { ...m, deleted: true, content: "", imageUrl: undefined, linkPreview: undefined, reactions: [] };
      }
      return m;
    })
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/context/RoomContext.tsx
git commit -m "feat: extend RoomContext with replyTo support and SSE reply update"
```

---

### Task 3: ChatInterface — replyingTo state

**Files:**
- Modify: `src/components/ChatInterface.tsx`

- [ ] **Step 1: Add `replyingTo` state and handlers**

In `ChatContent`, add:

```typescript
import type { LinkPreview, ReplyTo } from "@/types";
```

Add state and handlers:

```typescript
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
```

- [ ] **Step 2: Update `handleSend` to include replyTo**

```typescript
const handleSend = (content: string, linkPreview?: LinkPreview) => {
  sendMessage(content, { linkPreview, replyTo: replyingTo || undefined });
  setReplyingTo(null);
};
```

- [ ] **Step 3: Wire props to children**

Update MessageList to pass `onReply`:

```typescript
<MessageList
  messages={messages}
  userId={user!.id}
  onLoadOlder={loadOlderMessages}
  hasMore={hasMoreMessages}
  loadingOlder={loadingOlder}
  onReply={handleReply}
/>
```

Update MessageInput to pass `replyingTo` and `onCancelReply`:

```typescript
<MessageInput
  onSend={handleSend}
  onSendImage={handleSendImage}
  disabled={status.type === "disconnected"}
  replyingTo={replyingTo}
  onCancelReply={handleCancelReply}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/ChatInterface.tsx
git commit -m "feat: add replyingTo state in ChatContent"
```

---

### Task 4: MessageList — onReply prop and scrollToMessage

**Files:**
- Modify: `src/components/MessageList.tsx`

- [ ] **Step 1: Add `onReply` prop and `scrollToMessage`**

Update Props:

```typescript
interface Props {
  messages: Message[];
  userId: string;
  onLoadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
  onReply: (message: Message) => void;
}
```

Add `scrollToMessage` function before the return:

```typescript
const scrollToMessage = useCallback((messageId: string) => {
  const el = document.getElementById(`msg-${messageId}`);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("ring-2", "ring-whatsapp-green", "ring-opacity-50");
    setTimeout(() => {
      el.classList.remove("ring-2", "ring-whatsapp-green", "ring-opacity-50");
    }, 1500);
  }
}, []);
```

- [ ] **Step 2: Pass `onReply` and `scrollToMessage` to MessageBubble**

Update the map to add `id` and pass props:

```typescript
{messages.map((msg) => (
  <div key={msg.id} id={`msg-${msg.id}`}>
    <MessageBubble
      message={msg}
      isOwn={msg.senderId === userId}
      onReply={onReply}
      scrollToMessage={scrollToMessage}
    />
  </div>
))}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MessageList.tsx
git commit -m "feat: onReply and scrollToMessage in MessageList"
```

---

### Task 5: MessageBubble — reply preview and Responder button

**Files:**
- Modify: `src/components/MessageBubble.tsx`

- [ ] **Step 1: Update Props**

```typescript
interface Props {
  message: Message;
  isOwn: boolean;
  onReply: (message: Message) => void;
  scrollToMessage: (messageId: string) => void;
}
```

- [ ] **Step 2: Add "Responder" button in caret menu**

Inside the dropdown menu, before the emoji picker toggle and after the "Reagir" button, add:

```typescript
<button
  onClick={() => {
    onReply(message);
    setMenuOpen(false);
  }}
  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
>
  ↩ Responder
</button>
```

- [ ] **Step 3: Add reply preview rendering**

Between the sender name block and the caret menu, add the reply preview:

```typescript
{/* Reply preview */}
{message.replyTo && (
  <div
    className="flex items-stretch gap-2 mb-2 cursor-pointer"
    onClick={() => scrollToMessage(message.replyTo!.messageId)}
  >
    <div className={`w-1 rounded-full flex-shrink-0 ${
      message.replyTo.deleted
        ? "bg-gray-300 dark:bg-gray-500"
        : "bg-whatsapp-green dark:bg-green-400"
    }`} />
    <div className="flex-1 min-w-0 bg-black/5 dark:bg-white/10 rounded p-1.5">
      <p className="text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green truncate">
        {message.replyTo.senderName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {message.replyTo.deleted ? (
          <span className="italic">mensagem apagada</span>
        ) : (
          message.replyTo.content
        )}
      </p>
    </div>
  </div>
)}
```

Position this right after the sender name block (the `{!isOwn && <p>...</p>}`) and before the caret menu div.

- [ ] **Step 4: Commit**

```bash
git add src/components/MessageBubble.tsx
git commit -m "feat: reply preview and Responder button in MessageBubble"
```

---

### Task 6: MessageInput — reply preview bar

**Files:**
- Modify: `src/components/MessageInput.tsx`

- [ ] **Step 1: Update Props**

```typescript
import type { LinkPreview as LinkPreviewType, ReplyTo } from "@/types";

interface Props {
  onSend: (content: string, linkPreview?: LinkPreviewType) => void;
  onSendImage: (file: File) => void;
  disabled?: boolean;
  replyingTo?: ReplyTo | null;
  onCancelReply?: () => void;
}
```

- [ ] **Step 2: Add reply preview bar**

Inside the returned JSX, before the `links.length > 0` link preview block, add the reply preview bar:

```typescript
{replyingTo && (
  <div className="w-[95%] mb-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex items-center gap-2 text-sm border-l-4 border-whatsapp-green">
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green truncate">
        {replyingTo.senderName}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
        {replyingTo.content}
      </p>
    </div>
    <button
      type="button"
      onClick={onCancelReply}
      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-black/5 dark:hover:bg-white/10 flex-shrink-0"
      aria-label="Cancelar reply"
    >
      ✕
    </button>
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/MessageInput.tsx
git commit -m "feat: reply preview bar in MessageInput"
```

---

### Task 7: Build verification

**Files:**
- Verify: entire project

- [ ] **Step 1: Build and fix TypeScript errors**

Run: `npm run build`
Expected: build succeeds with no errors

If there are type errors, fix them by checking the exact types used.

- [ ] **Step 2: Commit any fixes**

```bash
git add -A
git commit -m "fix: type errors after reply feature"
```
