# Reply to Message Design

## Data Model

Add to `src/types/index.ts`:

```typescript
export interface ReplyTo {
  messageId: string;
  senderName: string;
  content: string;       // preview truncado (80 chars)
  deleted?: boolean;     // true se a original foi apagada
}
```

Add `replyTo` field to `Message`:

```typescript
export interface Message {
  // ... existing fields
  replyTo?: ReplyTo;
}
```

## Components Flow

### State: `replyingTo` in ChatContent

`ChatContent` (inside `ChatInterface.tsx`) holds local state:

```typescript
const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
```

Passes down to:
- `MessageList` → `onReply(message: Message)` callback
- `MessageInput` → `replyingTo: ReplyTo | null` + `onCancelReply()`

### MessageBubble

- "Responder" button in the caret (▼) menu
- Calls `onReply(message)` prop (passed via MessageList)
- If `message.replyTo` exists, render reply preview above content:
  - Borda esquerda (2px) + fundo cinza claro
  - Nome do remetente (negrito pequeno)
  - Conteúdo truncado (texto pequeno)
  - Se `replyTo.deleted`, mostrar "mensagem apagada" em itálico
- Click no reply preview → `scrollToMessage(replyTo.messageId)`

### MessageList

- Renders each bubble with `id="msg-{message.id}"`
- Exposes `scrollToMessage(id: string)` function
  - `document.getElementById("msg-" + id)?.scrollIntoView({ behavior: "smooth", block: "center" })`
- Focus/highlight effect: temporary bg highlight, remove after 1s
- Passes `onReply` to MessageBubble

### MessageInput

- When `replyingTo` is non-null:
  - Barra no topo do input container com:
    - Ícone de seta indicando reply ↗
    - Nome do remetente + preview (truncado 60px)
    - Botão X para cancelar
  - `handleSubmit` inclui `replyTo` no payload via fetch
- `onCancelReply` → limpa o estado

### ChatContent (orchestration)

```typescript
const handleReply = (message: Message) => {
  setReplyingTo({
    messageId: message.id,
    senderName: message.senderName,
    content: message.content.slice(0, 80),
  });
  inputRef.current?.focus();
};

const handleCancelReply = () => {
  setReplyingTo(null);
};
```

### RoomContext (`sendMessage`)

- Extends `SendMessageOpts`:

```typescript
interface SendMessageOpts {
  imageUrl?: string;
  linkPreview?: LinkPreview;
  replyTo?: ReplyTo;
}
```

- POST `/api/rooms/[roomId]/messages` payload inclui `replyTo`
- Server stores `replyTo` como `ReplyTo` em KV
- SSE action `"message"` já inclui `message` completo com `replyTo`
- No change needed for SSE action type

### SSE delete handling (update replies)

In `RoomContext`, when processing `action: "delete"`:

```typescript
case "delete":
  setMessages(prev => prev.map(m => {
    if (m.replyTo?.messageId === payload.messageId) {
      return { ...m, replyTo: { ...m.replyTo, deleted: true } };
    }
    if (m.id === payload.messageId) {
      return { ...m, deleted: true, content: "", imageUrl: undefined };
    }
    return m;
  }));
  break;
```

### API: POST /api/rooms/[roomId]/messages

No changes besides accepting `replyTo` in the request body and storing it alongside the message in KV.

### KV

No changes needed. `replyTo` will be stored as JSON string in the KV hash, like `reactions`.

## Implementation Tasks

1. **Types** — `ReplyTo` interface, `replyTo` on `Message`
2. **RoomContext** — extend `SendMessageOpts` with `replyTo`, update SSE delete handler
3. **ChatInterface** — `replyingTo` state, wire `handleReply`/`handleCancelReply`
4. **MessageBubble** — "Responder" menu item, reply preview rendering, click-to-scroll
5. **MessageList** — `onReply` prop, `id` attrs, `scrollToMessage`
6. **MessageInput** — reply preview bar, cancel button, include `replyTo` in send
7. **Build + verify**
