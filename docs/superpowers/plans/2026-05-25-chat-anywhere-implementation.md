# Chat-Anywhere Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a real-time chat application with room-based URLs, WhatsApp-like interface, image sharing, link previews, SSE-based real-time updates, and localStorage session persistence on Vercel Hobby plan.

**Architecture:** Next.js 14 App Router with Server-Sent Events for real-time communication. Messages stored in Vercel KV (24h TTL), images in Vercel Blob (24h expiration), user sessions in localStorage. API routes handle message CRUD, SSE streaming, image upload, and link preview generation.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Vercel KV (@vercel/kv), Vercel Blob (@vercel/blob), Jest + React Testing Library, uuid

---

## File Structure

```
chat-anywhere/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with global styles
│   │   ├── page.tsx                 # Landing page → redirect to /random-room
│   │   ├── [roomId]/
│   │   │   └── page.tsx             # Room chat page
│   │   └── api/
│   │       ├── rooms/
│   │       │   └── [roomId]/
│   │       │       ├── sse/
│   │       │       │   └── route.ts # SSE endpoint (GET)
│   │       │       └── messages/
│   │       │           └── route.ts # Messages CRUD (GET, POST)
│   │       ├── upload/
│   │       │   └── image/
│   │       │       └── route.ts     # Image upload (POST)
│   │       └── link-preview/
│   │           └── route.ts         # Link preview (POST)
│   ├── components/
│   │   ├── ChatInterface.tsx        # Main chat layout
│   │   ├── MessageList.tsx          # Virtualized message list
│   │   ├── MessageInput.tsx         # Text input + send
│   │   ├── MessageBubble.tsx        # Individual message display
│   │   ├── UserRegistrationModal.tsx # Avatar + name + email form
│   │   ├── AvatarSelector.tsx       # Predefined avatar picker
│   │   ├── ImagePicker.tsx          # Image upload button
│   │   ├── LinkPreview.tsx          # Link preview card
│   │   ├── NewMessageIndicator.tsx  # "N new messages" badge
│   │   └── ConnectionStatus.tsx     # Live/Reconnecting/Offline indicator
│   ├── context/
│   │   ├── RoomContext.tsx           # Room state provider (messages, SSE)
│   │   └── UserContext.tsx           # User session provider (localStorage)
│   ├── hooks/
│   │   ├── useLocalStorage.ts       # Typed localStorage hook
│   │   ├── useSSE.ts                # SSE connection management
│   │   └── useLinkDetection.ts      # URL detection in text
│   ├── lib/
│   │   ├── kv.ts                    # Vercel KV client
│   │   ├── blob.ts                  # Vercel Blob client
│   │   └── sse.ts                   # SSE helpers
│   ├── types/
│   │   └── index.ts                 # TypeScript types
│   └── utils/
│       ├── validation.ts            # Input validation helpers
│       ├── sanitize.ts              # XSS sanitization helpers
│       └── formatting.ts            # Date/time formatting
├── __tests__/
│   ├── components/
│   │   ├── MessageBubble.test.tsx
│   │   ├── MessageInput.test.tsx
│   │   ├── UserRegistrationModal.test.tsx
│   │   └── AvatarSelector.test.tsx
│   ├── api/
│   │   └── messages.test.ts
│   ├── hooks/
│   │   └── useLocalStorage.test.ts
│   └── utils/
│       ├── validation.test.ts
│       ├── sanitize.test.ts
│       └── formatting.test.ts
├── .env.local.example               # Environment variables template
├── jest.config.ts                   # Jest configuration
├── jest.setup.ts                    # Jest setup (RTL)
├── next.config.mjs                  # Next.js configuration
├── tailwind.config.ts               # Tailwind configuration
├── postcss.config.mjs               # PostCSS configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
└── README.md                        # Already exists - preserved
```

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.local.example`

- [ ] **Step 1: Create package.json with all dependencies**

```bash
cd /home/filipelb/projetos/chat-anywhere
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "chat-anywhere",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@vercel/kv": "^2.0.0",
    "@vercel/blob": "^0.23.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^9.0.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "jest": "^29.7.0",
    "@jest/globals": "^29.7.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/jest-dom": "^6.4.0",
    "@testing-library/user-event": "^14.5.0",
    "jest-environment-jsdom": "^29.7.0",
    "ts-jest": "^29.1.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0"
  }
}
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Write next.config.mjs**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 5: Write tailwind.config.ts**

```typescript
import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: "#25D366",
          "green-dark": "#128C7E",
          "green-darker": "#075E54",
          bg: "#E5DDD5",
          "bg-dark": "#111B21",
          bubble: "#DCF8C6",
          "bubble-own": "#DCF8C6",
          "bubble-other": "#FFFFFF",
          header: "#075E54",
          input: "#F0F2F5",
        },
      },
    },
  },
  plugins: [],
};
export default config;
```

- [ ] **Step 6: Write postcss.config.mjs**

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
```

- [ ] **Step 7: Write .env.local.example**

```
KV_URL=your_vercel_kv_connection_string
KV_REST_API_URL=your_vercel_kv_rest_url
KV_REST_API_TOKEN=your_vercel_kv_rest_token
KV_REST_API_READ_ONLY_TOKEN=your_vercel_kv_read_only_token
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

- [ ] **Step 8: Install dependencies**

Run: `npm install`
Expected: All 21 packages installed, `node_modules/` created, `package-lock.json` created

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.mjs .env.local.example
git commit -m "chore: initialize Next.js project with dependencies"
```

---

### Task 2: Set Up Project Structure and Types

**Files:**
- Create: `src/types/index.ts`
- Create: `src/utils/validation.ts`
- Create: `src/utils/sanitize.ts`
- Create: `src/utils/formatting.ts`
- Create: `
src/app/globals.css`
- Modify: `src/app/layout.tsx` (basic)

- [ ] **Step 1: Write types**

```typescript
// src/types/index.ts
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
```

- [ ] **Step 2: Write validation utilities**

```typescript
// src/utils/validation.ts
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50;
}

export function isValidMessageContent(content: string): boolean {
  return content.trim().length > 0 && content.trim().length <= 5000;
}

export function isValidFileType(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return allowedTypes.includes(file.type);
}

export function isValidFileSize(file: File, maxSizeMB = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
```

- [ ] **Step 3: Write sanitization utilities**

```typescript
// src/utils/sanitize.ts
export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeMessageContent(content: string): string {
  return sanitizeHtml(content.trim());
}

export function sanitizeName(name: string): string {
  return sanitizeHtml(name.trim()).slice(0, 50);
}
```

- [ ] **Step 4: Write formatting utilities**

```typescript
// src/utils/formatting.ts
export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatFullTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateRoomId(): string {
  const adjectives = ["cozy", "sunny", "happy", "cool", "wild", "calm", "bright", "quiet"];
  const nouns = ["chat", "talk", "meet", "room", "den", "spot", "hub", "nest"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}
```

- [ ] **Step 5: Write globals.css with WhatsApp theme**

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-whatsapp-bg dark:bg-whatsapp-bg-dark text-gray-900 dark:text-gray-100;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
}

@layer components {
  .chat-bubble-own {
    @apply bg-whatsapp-bubble rounded-lg px-3 py-2 max-w-[80%] shadow-sm;
  }
  .chat-bubble-other {
    @apply bg-white dark:bg-gray-700 rounded-lg px-3 py-2 max-w-[80%] shadow-sm;
  }
  .chat-header {
    @apply bg-whatsapp-header text-white px-4 py-3 shadow-md;
  }
  .chat-input-bg {
    @apply bg-whatsapp-input dark:bg-gray-800;
  }
}
```

- [ ] **Step 6: Write root layout.tsx**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chat-Anywhere",
  description: "Real-time chat rooms. No signup. No storage. Just chat.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="h-screen overflow-hidden">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Run type check to verify**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 8: Commit**

```bash
git add src/types/index.ts src/utils/validation.ts src/utils/sanitize.ts src/utils/formatting.ts src/app/globals.css src/app/layout.tsx
git commit -m "feat: add project types, utilities, and base layout"
```

---

### Task 3: Write Utility Tests (TDD)

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `__tests__/utils/validation.test.ts`
- Create: `__tests__/utils/sanitize.test.ts`
- Create: `__tests__/utils/formatting.test.ts`

- [ ] **Step 1: Create jest.config.ts**

```typescript
// jest.config.ts
import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterSetup: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testPathIgnorePatterns: ["<rootDir>/node_modules/", "<rootDir>/.next/"],
};
export default config;
```

- [ ] **Step 2: Create jest.setup.ts**

```typescript
// jest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Write validation test and run to verify it fails**

```typescript
// __tests__/utils/validation.test.ts
import { isValidEmail, isValidName, isValidMessageContent, isValidFileType, isValidFileSize } from "@/utils/validation";

describe("isValidEmail", () => {
  it("returns true for valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });
  it("returns false for invalid email", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidName", () => {
  it("returns true for valid name", () => {
    expect(isValidName("Alice")).toBe(true);
  });
  it("returns false for invalid name", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("A")).toBe(false);
  });
});

describe("isValidMessageContent", () => {
  it("returns true for valid content", () => {
    expect(isValidMessageContent("Hello!")).toBe(true);
  });
  it("returns false for empty content", () => {
    expect(isValidMessageContent("")).toBe(false);
    expect(isValidMessageContent("   ")).toBe(false);
  });
});

describe("isValidFileType", () => {
  it("returns true for allowed image types", () => {
    expect(isValidFileType(new File([], "test.jpg", { type: "image/jpeg" }))).toBe(true);
    expect(isValidFileType(new File([], "test.png", { type: "image/png" }))).toBe(true);
  });
  it("returns false for disallowed types", () => {
    expect(isValidFileType(new File([], "test.pdf", { type: "application/pdf" }))).toBe(false);
  });
});

describe("isValidFileSize", () => {
  it("returns true for file under 5MB", () => {
    const f = new File([new ArrayBuffer(1024 * 1024)], "test.jpg", { type: "image/jpeg" });
    expect(isValidFileSize(f, 5)).toBe(true);
  });
  it("returns false for file over 5MB", () => {
    const f = new File([new ArrayBuffer(6 * 1024 * 1024)], "test.jpg", { type: "image/jpeg" });
    expect(isValidFileSize(f, 5)).toBe(false);
  });
});
```

Run: `npx jest __tests__/utils/validation.test.ts --no-coverage`
Expected: Tests pass (green) - jest config + setup should be in place, and validation.ts already exists from Task 2

- [ ] **Step 4: Write sanitize test and run**

```typescript
// __tests__/utils/sanitize.test.ts
import { sanitizeHtml, sanitizeMessageContent, sanitizeName } from "@/utils/sanitize";

describe("sanitizeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe("&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;");
  });
  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeMessageContent", () => {
  it("trims and sanitizes content", () => {
    expect(sanitizeMessageContent("  Hello <b>world</b>  ")).toBe("Hello &lt;b&gt;world&lt;/b&gt;");
  });
});

describe("sanitizeName", () => {
  it("truncates long names to 50 chars", () => {
    expect(sanitizeName("a".repeat(100))).toBe("a".repeat(50));
  });
  it("sanitizes HTML in names", () => {
    expect(sanitizeName("<b>Name</b>")).toBe("&lt;b&gt;Name&lt;/b&gt;");
  });
});
```

Run: `npx jest __tests__/utils/sanitize.test.ts --no-coverage`
Expected: All tests pass (green)

- [ ] **Step 5: Write formatting test and run**

```typescript
// __tests__/utils/formatting.test.ts
import { formatTimestamp, generateRoomId } from "@/utils/formatting";

describe("formatTimestamp", () => {
  it('returns "now" for recent timestamps', () => {
    expect(formatTimestamp(Date.now())).toBe("now");
  });
  it("returns minutes ago for recent messages", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatTimestamp(fiveMinAgo)).toBe("5m ago");
  });
  it("returns hours ago for older messages", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(formatTimestamp(twoHoursAgo)).toBe("2h ago");
  });
});

describe("generateRoomId", () => {
  it("generates a string with format adj-noun-num", () => {
    const id = generateRoomId();
    expect(id).toMatch(/^[a-z]+-[a-z]+-\d+$/);
  });
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRoomId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});
```

Run: `npx jest __tests__/utils/formatting.test.ts --no-coverage`
Expected: All tests pass (green)

- [ ] **Step 6: Run all utility tests together**

Run: `npx jest __tests__/utils/ --no-coverage`
Expected: All 3 test files pass (green)

- [ ] **Step 7: Commit**

```bash
git add jest.config.ts jest.setup.ts __tests__/utils/
git commit -m "feat: add utility tests with TDD"
```

---

### Task 4: Create Library Modules (KV, Blob, SSE)

**Files:**
- Create: `src/lib/kv.ts`
- Create: `src/lib/blob.ts`
- Create: `src/lib/sse.ts`

- [ ] **Step 1: Write Vercel KV client**

```typescript
// src/lib/kv.ts
import { kv } from "@vercel/kv";

const MESSAGE_TTL = 86400; // 24 hours in seconds
const MESSAGE_BATCH = 20;

export interface StoredMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: "text" | "image" | "link";
  imageUrl?: string;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image?: string;
  };
  timestamp: number;
  createdAt: string;
}

export async function saveMessage(roomId: string, message: StoredMessage): Promise<void> {
  const messagesKey = `room:${roomId}:messages`;
  const messageKey = `message:${message.id}`;
  await Promise.all([
    kv.zadd(messagesKey, { score: message.timestamp, member: message.id }),
    kv.hset(messageKey, message as unknown as Record<string, unknown>),
    kv.expire(messagesKey, MESSAGE_TTL),
    kv.expire(messageKey, MESSAGE_TTL),
  ]);
}

export async function getMessages(
  roomId: string,
  opts: { since?: number; limit?: number } = {}
): Promise<StoredMessage[]> {
  const { since = Date.now(), limit = MESSAGE_BATCH } = opts;
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, 0, -1, {
    byScore: { min: "-inf", max: since },
    rev: true,
    count: limit,
    offset: 0,
  });
  if (messageIds.length === 0) return [];
  const keys = messageIds.map((id) => `message:${id}`);
  const results = await Promise.all(keys.map((key) => kv.hgetall(key)));
  return results
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((r) => r as unknown as StoredMessage)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function getRecentMessages(
  roomId: string,
  limit = 50
): Promise<StoredMessage[]> {
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, -limit, -1);
  if (messageIds.length === 0) return [];
  const keys = messageIds.map((id) => `message:${id}`);
  const results = await Promise.all(keys.map((key) => kv.hgetall(key)));
  return results
    .filter((r): r is Record<string, unknown> => r !== null)
    .map((r) => r as unknown as StoredMessage)
    .sort((a, b) => a.timestamp - b.timestamp);
}

export async function deleteRoomMessages(roomId: string): Promise<void> {
  const messagesKey = `room:${roomId}:messages`;
  const messageIds = await kv.zrange(messagesKey, 0, -1);
  if (messageIds.length > 0) {
    const keys = messageIds.map((id) => `message:${id}`);
    await Promise.all([kv.del(messagesKey), ...keys.map((k) => kv.del(k))]);
  }
}
```

- [ ] **Step 2: Write Vercel Blob client**

```typescript
// src/lib/blob.ts
import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  contentType: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`);
  }
  const filename = `chat-images/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return {
    url: blob.url,
    contentType: file.type,
    size: file.size,
  };
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
```

- [ ] **Step 3: Write SSE helper**

```typescript
// src/lib/sse.ts
export interface SSEClient {
  id: string;
  roomId: string;
  controller: ReadableStreamDefaultController;
  encoder: TextEncoder;
}

const clients = new Map<string, SSEClient>();

export function addClient(client: SSEClient): void {
  clients.set(client.id, client);
}

export function removeClient(id: string): void {
  clients.delete(id);
}

export function getClient(id: string): SSEClient | undefined {
  return clients.get(id);
}

export function broadcastToRoom(roomId: string, data: unknown): void {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  for (const [, client] of clients) {
    if (client.roomId === roomId) {
      try {
        client.controller.enqueue(encoder.encode(message));
      } catch {
        removeClient(client.id);
      }
    }
  }
}

export function getRoomClientCount(roomId: string): number {
  let count = 0;
  for (const [, client] of clients) {
    if (client.roomId === roomId) count++;
  }
  return count;
}

export function createSSEStream(roomId: string, clientId: string): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const client: SSEClient = { id: clientId, roomId, controller, encoder };
      addClient(client);
      // Send initial connection event
      controller.enqueue(encoder.encode(`event: connected\ndata: {"clientId":"${clientId}"}\n\n`));
    },
    cancel() {
      removeClient(clientId);
    },
  });
}
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/
git commit -m "feat: add KV, Blob, and SSE library modules"
```

---

### Task 5: Create Hooks

**Files:**
- Create: `src/hooks/useLocalStorage.ts`
- Create: `src/hooks/useSSE.ts`
- Create: `src/hooks/useLinkDetection.ts`
- Create: `__tests__/hooks/useLocalStorage.test.ts`

- [ ] **Step 1: Write useLocalStorage hook and test (TDD)**

```typescript
// src/hooks/useLocalStorage.ts
"use client";
import { useState, useCallback } from "react";

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const nextValue = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(nextValue));
        } catch (e) {
          console.error("Failed to save to localStorage:", e);
        }
        return nextValue;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (e) {
      console.error("Failed to remove from localStorage:", e);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
```

```typescript
// __tests__/hooks/useLocalStorage.test.ts
import { renderHook, act } from "@testing-library/react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns initial value when no stored value exists", () => {
    const { result } = renderHook(() => useLocalStorage("test", "default"));
    expect(result.current[0]).toBe("default");
  });

  it("stores and retrieves values", () => {
    const { result } = renderHook(() => useLocalStorage("test", "default"));
    act(() => {
      result.current[1]("new value");
    });
    expect(result.current[0]).toBe("new value");
    expect(localStorage.getItem("test")).toBe(JSON.stringify("new value"));
  });

  it("removes value and resets to initial", () => {
    const { result } = renderHook(() => useLocalStorage("test", "default"));
    act(() => {
      result.current[1]("new value");
    });
    act(() => {
      result.current[2]();
    });
    expect(result.current[0]).toBe("default");
    expect(localStorage.getItem("test")).toBeNull();
  });

  it("reads existing value from localStorage", () => {
    localStorage.setItem("existing", JSON.stringify({ name: "Alice" }));
    const { result } = renderHook(() => useLocalStorage("existing", { name: "" }));
    expect(result.current[0]).toEqual({ name: "Alice" });
  });
});
```

Run: `npx jest __tests__/hooks/useLocalStorage.test.ts --no-coverage`
Expected: All tests pass (green)

- [ ] **Step 2: Write useSSE hook**

```typescript
// src/hooks/useSSE.ts
"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Message, ConnectionStatus } from "@/types";

interface UseSSEOptions {
  roomId: string;
  userId: string;
  onMessage: (message: Message) => void;
}

export function useSSE({ roomId, userId, onMessage }: UseSSEOptions) {
  const [status, setStatus] = useState<ConnectionStatus>({ type: "disconnected" });
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10;

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/rooms/${roomId}/sse?userId=${userId}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;
    retryCountRef.current = 0;

    es.onopen = () => {
      setStatus({ type: "connected" });
      retryCountRef.current = 0;
    };

    es.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data) as Message;
        onMessage(message);
      } catch {
        // Ignore malformed messages
      }
    });

    es.onerror = () => {
      es.close();
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setStatus({
          type: "reconnecting",
          message: `Reconnecting (${retryCountRef.current}/${maxRetries})...`,
        });
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000);
        setTimeout(connect, delay);
      } else {
        setStatus({ type: "disconnected", message: "Connection lost" });
      }
    };
  }, [roomId, userId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [connect]);

  return { status };
}
```

- [ ] **Step 3: Write useLinkDetection hook**

```typescript
// src/hooks/useLinkDetection.ts
"use client";
import { useState, useCallback } from "react";

const URL_REGEX = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]}>])/g;

export interface DetectedLink {
  url: string;
  start: number;
  end: number;
}

export function useLinkDetection() {
  const [links, setLinks] = useState<DetectedLink[]>([]);

  const detectLinks = useCallback((text: string): DetectedLink[] => {
    const detected: DetectedLink[] = [];
    let match: RegExpExecArray | null;
    const regex = new RegExp(URL_REGEX.source, "g");
    while ((match = regex.exec(text)) !== null) {
      detected.push({
        url: match[1],
        start: match.index,
        end: match.index + match[1].length,
      });
    }
    setLinks(detected);
    return detected;
  }, []);

  return { links, detectLinks };
}
```

- [ ] **Step 4: Run all tests and type check**

Run: `npx jest __tests__/ --no-coverage && npx tsc --noEmit`
Expected: All tests pass, no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/hooks/ __tests__/hooks/
git commit -m "feat: add hooks (useLocalStorage, useSSE, useLinkDetection)"
```

---

### Task 6: Create Context Providers

**Files:**
- Create: `src/context/UserContext.tsx`
- Create: `src/context/RoomContext.tsx`

- [ ] **Step 1: Write UserContext**

```typescript
// src/context/UserContext.tsx
"use client";
import React, { createContext, useContext, useCallback } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import type { User } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface UserContextType {
  user: User | null;
  register: (name: string, email: string, avatar: string, roomId: string) => void;
  clearUser: (roomId: string) => void;
  isRegistered: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children, roomId }: { children: React.ReactNode; roomId: string }) {
  const storageKey = `chat-anywhere:${roomId}:user`;
  const [user, setUser, removeUser] = useLocalStorage<User | null>(storageKey, null);

  const register = useCallback(
    (name: string, email: string, avatar: string, rid: string) => {
      const newUser: User = {
        id: uuidv4(),
        name,
        email,
        avatar,
        joinedAt: Date.now(),
      };
      const key = `chat-anywhere:${rid}:user`;
      localStorage.setItem(key, JSON.stringify(newUser));
      setUser(newUser);
    },
    [setUser]
  );

  const clearUser = useCallback(
    (rid: string) => {
      const key = `chat-anywhere:${rid}:user`;
      localStorage.removeItem(key);
      removeUser();
    },
    [removeUser]
  );

  return (
    <UserContext.Provider value={{ user, register, clearUser, isRegistered: user !== null }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
```

- [ ] **Step 2: Write RoomContext**

```typescript
// src/context/RoomContext.tsx
"use client";
import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import { useSSE } from "@/hooks/useSSE";
import type { Message, ConnectionStatus } from "@/types";
import { v4 as uuidv4 } from "uuid";

interface RoomContextType {
  messages: Message[];
  status: ConnectionStatus;
  sendMessage: (content: string, opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  loadingOlder: boolean;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const API_BASE = "";

export function RoomProvider({
  children,
  roomId,
  userId,
  userName,
  userAvatar,
}: {
  children: React.ReactNode;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const oldestTimestampRef = useRef<number>(Infinity);

  const handleNewMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) return prev;
      return [...prev, message];
    });
  }, []);

  const { status } = useSSE({ roomId, userId, onMessage: handleNewMessage });

  const sendMessage = useCallback(
    async (
      content: string,
      opts?: { imageUrl?: string; linkPreview?: Message["linkPreview"] }
    ) => {
      const message: Omit<Message, "id" | "timestamp" | "createdAt"> = {
        roomId,
        senderId: userId,
        senderName: userName,
        senderAvatar: userAvatar,
        content,
        type: opts?.imageUrl ? "image" : opts?.linkPreview ? "link" : "text",
        ...(opts?.imageUrl && { imageUrl: opts.imageUrl }),
        ...(opts?.linkPreview && { linkPreview: opts.linkPreview }),
      };

      const res = await fetch(`${API_BASE}/api/rooms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": userId },
        body: JSON.stringify(message),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to send message: ${err}`);
      }
    },
    [roomId, userId, userName, userAvatar]
  );

  const loadOlderMessages = useCallback(async () => {
    if (loadingOlder || !hasMoreMessages) return;
    setLoadingOlder(true);
    try {
      const since = oldestTimestampRef.current === Infinity ? Date.now() : oldestTimestampRef.current;
      const res = await fetch(
        `${API_BASE}/api/rooms/${roomId}/messages?since=${since}&limit=20`,
        { headers: { "x-user-id": userId } }
      );
      if (!res.ok) throw new Error("Failed to load older messages");
      const olderMessages: Message[] = await res.json();
      if (olderMessages.length < 20) setHasMoreMessages(false);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = olderMessages.filter((m) => !existingIds.has(m.id));
        if (newMsgs.length > 0) {
          oldestTimestampRef.current = Math.min(...newMsgs.map((m) => m.timestamp));
        }
        return [...newMsgs, ...prev];
      });
    } finally {
      setLoadingOlder(false);
    }
  }, [roomId, userId, loadingOlder, hasMoreMessages]);

  return (
    <RoomContext.Provider
      value={{ messages, status, sendMessage, loadOlderMessages, hasMoreMessages, loadingOlder }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export function useRoom(): RoomContextType {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within a RoomProvider");
  return ctx;
}
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add src/context/
git commit -m "feat: add UserContext and RoomContext providers"
```

---

### Task 7: Create UI Components

**Files:**
- Create: `src/components/AvatarSelector.tsx`
- Create: `src/components/UserRegistrationModal.tsx`
- Create: `src/components/MessageBubble.tsx`
- Create: `src/components/MessageList.tsx`
- Create: `src/components/MessageInput.tsx`
- Create: `src/components/ImagePicker.tsx`
- Create: `src/components/LinkPreview.tsx`
- Create: `src/components/NewMessageIndicator.tsx`
- Create: `src/components/ConnectionStatus.tsx`
- Create: `src/components/ChatInterface.tsx`

- [ ] **Step 1: Write AvatarSelector**

```typescript
// src/components/AvatarSelector.tsx
"use client";
import React from "react";

const AVATARS = [
  "😀", "😎", "🤩", "😺", "🦊", "🐼",
  "🐨", "🦁", "🐯", "🐸", "🦄", "🐙",
];

interface Props {
  selected: string;
  onSelect: (avatar: string) => void;
}

export function AvatarSelector({ selected, onSelect }: Props) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {AVATARS.map((avatar) => (
        <button
          key={avatar}
          type="button"
          onClick={() => onSelect(avatar)}
          className={`text-3xl w-12 h-12 rounded-full transition-all ${
            selected === avatar
              ? "ring-2 ring-whatsapp-green scale-110 bg-gray-100 dark:bg-gray-600"
              : "hover:bg-gray-100 dark:hover:bg-gray-600"
          }`}
          aria-label={`Select avatar ${avatar}`}
        >
          {avatar}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write UserRegistrationModal**

```typescript
// src/components/UserRegistrationModal.tsx
"use client";
import React, { useState } from "react";
import { AvatarSelector } from "./AvatarSelector";
import { isValidEmail, isValidName } from "@/utils/validation";
import { sanitizeName } from "@/utils/sanitize";

interface Props {
  roomId: string;
  onRegister: (name: string, email: string, avatar: string) => void;
}

export function UserRegistrationModal({ roomId, onRegister }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; avatar?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!isValidName(name)) newErrors.name = "Name must be 2-50 characters";
    if (!isValidEmail(email)) newErrors.email = "Please enter a valid email";
    if (!avatar) newErrors.avatar = "Please select an avatar";
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onRegister(sanitizeName(name), email.trim(), avatar);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-900 dark:text-white">
          Join #{roomId}
        </h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-6">
          Choose your identity to start chatting
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Choose Avatar
            </label>
            <AvatarSelector selected={avatar} onSelect={setAvatar} />
            {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar}</p>}
          </div>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Your name"
              maxLength={50}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-whatsapp-green focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="your@email.com"
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-whatsapp-green hover:bg-whatsapp-green-dark text-white font-semibold rounded-lg transition-colors"
          >
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write MessageBubble**

```typescript
// src/components/MessageBubble.tsx
"use client";
import React from "react";
import type { Message } from "@/types";
import { formatTimestamp } from "@/utils/formatting";

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 shadow-sm ${
          isOwn
            ? "bg-whatsapp-bubble dark:bg-[#005C4B] rounded-br-sm"
            : "bg-white dark:bg-gray-700 rounded-bl-sm"
        }`}
      >
        {!isOwn && (
          <p className="text-xs font-semibold text-whatsapp-green-dark dark:text-whatsapp-green mb-1">
            {message.senderName}
          </p>
        )}
        {message.type === "image" && message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Shared image"
            className="max-w-full rounded-lg mb-1 cursor-pointer"
            onClick={() => window.open(message.imageUrl, "_blank")}
          />
        )}
        {message.type === "link" && message.linkPreview && (
          <a
            href={message.linkPreview.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-1 border rounded-lg overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-600"
          >
            {message.linkPreview.image && (
              <img
                src={message.linkPreview.image}
                alt=""
                className="w-full h-32 object-cover"
              />
            )}
            <div className="p-2">
              <p className="text-sm font-semibold truncate">{message.linkPreview.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{message.linkPreview.description}</p>
            </div>
          </a>
        )}
        <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div className="flex justify-end items-center gap-1 mt-1">
          <span className="text-[10px] text-gray-400">
            {formatTimestamp(message.timestamp)}
          </span>
          {isOwn && (
            <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 16 11" fill="currentColor">
              <path d="M11.071.653a.457.457 0 0 0-.304-.102.493.493 0 0 0-.381.178l-6.19 7.636-2.011-2.095a.463.463 0 0 0-.336-.153.457.457 0 0 0-.334.165.537.537 0 0 0-.128.361.49.49 0 0 0 .153.349l2.455 2.557c.19.2.495.19.684-.013l6.632-8.182a.495.495 0 0 0 .114-.336.462.462 0 0 0-.154-.365z" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write MessageList**

```typescript
// src/components/MessageList.tsx
"use client";
import React, { useRef, useEffect, useCallback } from "react";
import { MessageBubble } from "./MessageBubble";
import { NewMessageIndicator } from "./NewMessageIndicator";
import type { Message } from "@/types";

interface Props {
  messages: Message[];
  userId: string;
  onLoadOlder: () => void;
  hasMore: boolean;
  loadingOlder: boolean;
}

export function MessageList({ messages, userId, onLoadOlder, hasMore, loadingOlder }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const [newCount, setNewCount] = React.useState(0);
  const prevLengthRef = useRef(messages.length);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
      setNewCount(0);
    } else if (messages.length > prevLengthRef.current) {
      setNewCount((c) => c + (messages.length - prevLengthRef.current));
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, isAtBottom, scrollToBottom]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsAtBottom(atBottom);
    if (atBottom) setNewCount(0);
    // Load older when scrolled to top
    if (el.scrollTop < 50 && hasMore && !loadingOlder) {
      onLoadOlder();
    }
  }, [hasMore, loadingOlder, onLoadOlder]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-2 space-y-1"
    >
      {loadingOlder && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-400">Loading older messages...</span>
        </div>
      )}
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === userId} />
      ))}
      <div ref={bottomRef} />
      <NewMessageIndicator count={newCount} onClick={scrollToBottom} />
    </div>
  );
}
```

- [ ] **Step 5: Write MessageInput**

```typescript
// src/components/MessageInput.tsx
"use client";
import React, { useState, useRef } from "react";
import { ImagePicker } from "./ImagePicker";
import { LinkPreview } from "./LinkPreview";
import { useLinkDetection } from "@/hooks/useLinkDetection";

interface Props {
  onSend: (content: string) => void;
  onSendImage: (file: File) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onSendImage, disabled }: Props) {
  const [text, setText] = useState("");
  const [showImagePicker, setShowImagePicker] = useState(false);
  const { links, detectLinks } = useLinkDetection();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    detectLinks(e.target.value);
  };

  const handleImageSelected = async (file: File) => {
    setShowImagePicker(false);
    onSendImage(file);
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-bg px-4 py-2 flex items-end gap-2">
      <button
        type="button"
        onClick={() => setShowImagePicker(!showImagePicker)}
        className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        aria-label="Attach image"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
      </button>
      <div className="flex-1 relative">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
          className="w-full resize-none rounded-lg px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-whatsapp-green focus:border-transparent"
          disabled={disabled}
        />
        {links.length > 0 && <LinkPreview url={links[0].url} />}
      </div>
      {showImagePicker && (
        <ImagePicker onSelect={handleImageSelected} />
      )}
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="p-2 text-whatsapp-green hover:text-whatsapp-green-dark disabled:text-gray-300 dark:disabled:text-gray-600 transition-colors"
        aria-label="Send message"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" />
        </svg>
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Write ImagePicker**

```typescript
// src/components/ImagePicker.tsx
"use client";
import React, { useRef, useState } from "react";
import { isValidFileType, isValidFileSize } from "@/utils/validation";

interface Props {
  onSelect: (file: File) => void;
}

export function ImagePicker({ onSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (!isValidFileType(file)) {
      setError("Invalid file type. Use JPG, PNG, GIF, or WebP.");
      return;
    }
    if (!isValidFileSize(file)) {
      setError("File too large. Max 5MB.");
      return;
    }
    setPreview(URL.createObjectURL(file));
    onSelect(file);
  };

  return (
    <div className="absolute bottom-full mb-2 bg-white dark:bg-gray-700 rounded-lg shadow-lg p-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="px-4 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-500"
      >
        Choose Image
      </button>
      {preview && (
        <img src={preview} alt="Preview" className="mt-2 max-h-24 rounded" />
      )}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
```

- [ ] **Step 7: Write LinkPreview**

```typescript
// src/components/LinkPreview.tsx
"use client";
import React, { useEffect, useState } from "react";

interface PreviewData {
  title: string;
  description: string;
  image?: string;
}

interface Props {
  url: string;
}

export function LinkPreview({ url }: Props) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/link-preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [url]);

  if (loading) return <div className="text-xs text-gray-400 mt-1">Loading preview...</div>;
  if (!preview) return null;

  return (
    <div className="flex items-start gap-2 p-2 mt-1 bg-gray-50 dark:bg-gray-800 rounded-lg border text-xs">
      {preview.image && (
        <img src={preview.image} alt="" className="w-12 h-12 rounded object-cover flex-shrink-0" />
      )}
      <div className="min-w-0">
        <p className="font-semibold truncate">{preview.title}</p>
        <p className="text-gray-500 line-clamp-1">{preview.description}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Write NewMessageIndicator**

```typescript
// src/components/NewMessageIndicator.tsx
"use client";
import React from "react";

interface Props {
  count: number;
  onClick: () => void;
}

export function NewMessageIndicator({ count, onClick }: Props) {
  if (count === 0) return null;
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-whatsapp-green text-white text-sm px-4 py-1.5 rounded-full shadow-lg hover:bg-whatsapp-green-dark transition-colors animate-bounce"
    >
      {count} new message{count !== 1 ? "s" : ""} ↓
    </button>
  );
}
```

- [ ] **Step 9: Write ConnectionStatus**

```typescript
// src/components/ConnectionStatus.tsx
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
```

- [ ] **Step 10: Write ChatInterface (main layout)**

```typescript
// src/components/ChatInterface.tsx
"use client";
import React from "react";
import { useUser } from "@/context/UserContext";
import { useRoom } from "@/context/RoomContext";
import { UserRegistrationModal } from "./UserRegistrationModal";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConnectionStatus } from "./ConnectionStatus";
import { uploadImage } from "@/lib/blob";

interface Props {
  roomId: string;
}

export function ChatInterface({ roomId }: Props) {
  const { user, register, isRegistered } = useUser();
  const { messages, status, sendMessage, loadOlderMessages, hasMoreMessages, loadingOlder } = useRoom();

  const handleRegister = (name: string, email: string, avatar: string) => {
    register(name, email, avatar, roomId);
  };

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleSendImage = async (file: File) => {
    try {
      const { url } = await uploadImage(file);
      sendMessage("", { imageUrl: url });
    } catch {
      alert("Failed to upload image. Please try again.");
    }
  };

  if (!isRegistered || !user) {
    return <UserRegistrationModal roomId={roomId} onRegister={handleRegister} />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="chat-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            {user.avatar}
          </div>
          <div>
            <h1 className="font-semibold text-sm">#{roomId}</h1>
            <p className="text-xs opacity-80">{user.name}</p>
          </div>
        </div>
        <ConnectionStatus status={status} />
      </div>
      {/* Messages */}
      <MessageList
        messages={messages}
        userId={user.id}
        onLoadOlder={loadOlderMessages}
        hasMore={hasMoreMessages}
        loadingOlder={loadingOlder}
      />
      {/* Input */}
      <MessageInput onSend={handleSend} onSendImage={handleSendImage} disabled={status.type === "disconnected"} />
    </div>
  );
}
```

- [ ] **Step 11: Write component tests**

```typescript
// __tests__/components/MessageBubble.test.tsx
import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/MessageBubble";
import type { Message } from "@/types";

const baseMessage: Message = {
  id: "1",
  roomId: "test",
  senderId: "user1",
  senderName: "Alice",
  senderAvatar: "😀",
  content: "Hello!",
  type: "text",
  timestamp: Date.now(),
  createdAt: new Date().toISOString(),
};

describe("MessageBubble", () => {
  it("renders text message content", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });
  it("shows sender name for other messages", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
  it("hides sender name for own messages", () => {
    render(<MessageBubble message={{ ...baseMessage, senderId: "me" }} isOwn={true} />);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });
});
```

Run: `npx jest __tests__/components/MessageBubble.test.tsx --no-coverage`
Expected: All tests pass (green)

- [ ] **Step 12: Run all tests and verify**

Run: `npx jest --no-coverage`
Expected: All tests pass

- [ ] **Step 13: Commit**

```bash
git add src/components/ __tests__/components/
git commit -m "feat: add UI components (chat, messages, registration)"
```

---

### Task 8: Create API Routes

**Files:**
- Create: `src/app/api/rooms/[roomId]/messages/route.ts`
- Create: `src/app/api/rooms/[roomId]/sse/route.ts`
- Create: `src/app/api/upload/image/route.ts`
- Create: `src/app/api/link-preview/route.ts`
- Create: `__tests__/api/messages.test.ts`

- [ ] **Step 1: Write messages API route**

```typescript
// src/app/api/rooms/[roomId]/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { saveMessage, getMessages, getRecentMessages } from "@/lib/kv";
import { v4 as uuidv4 } from "uuid";
import { broadcastToRoom } from "@/lib/sse";
import type { Message } from "@/types";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const { searchParams } = new URL(request.url);
  const since = searchParams.get("since");
  const limit = searchParams.get("limit");

  if (since) {
    const messages = await getMessages(roomId, {
      since: parseInt(since),
      limit: limit ? parseInt(limit) : 20,
    });
    return NextResponse.json(messages);
  }

  const messages = await getRecentMessages(roomId, limit ? parseInt(limit) : 50);
  return NextResponse.json(messages);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const userId = request.headers.get("x-user-id");
  if (!userId) {
    return NextResponse.json({ error: "Missing x-user-id header" }, { status: 401 });
  }

  const body = await request.json();
  const message: Message = {
    id: uuidv4(),
    roomId,
    senderId: body.senderId,
    senderName: body.senderName,
    senderAvatar: body.senderAvatar,
    content: body.content,
    type: body.type || "text",
    imageUrl: body.imageUrl,
    linkPreview: body.linkPreview,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
  };

  await saveMessage(roomId, message);
  broadcastToRoom(roomId, message);

  return NextResponse.json(message, { status: 201 });
}
```

- [ ] **Step 2: Write SSE API route**

```typescript
// src/app/api/rooms/[roomId]/sse/route.ts
import { NextRequest } from "next/server";
import { createSSEStream } from "@/lib/sse";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const userId = request.nextUrl.searchParams.get("userId") || "anonymous";
  const clientId = `${roomId}-${userId}-${Date.now()}`;

  const stream = createSSEStream(roomId, clientId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- [ ] **Step 3: Write image upload API route**

```typescript
// src/app/api/upload/image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/blob";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    const result = await uploadImage(file);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
```

- [ ] **Step 4: Write link preview API route**

```typescript
// src/app/api/link-preview/route.ts
import { NextRequest, NextResponse } from "next/server";

interface PreviewData {
  title: string;
  description: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "chat-anywhere/1.0" },
    });
    clearTimeout(timeout);

    const html = await res.text();
    const preview: PreviewData = {
      title: extractMeta(html, "og:title") || extractTitle(html) || url,
      description: extractMeta(html, "og:description") || extractMeta(html, "description") || "",
      image: extractMeta(html, "og:image") || undefined,
    };

    return NextResponse.json(preview);
  } catch {
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 502 });
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match ? match[1] : null;
}
```

- [ ] **Step 5: Write API tests**

```typescript
// __tests__/api/messages.test.ts
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/rooms/[roomId]/messages/route";

// Mock Vercel KV
jest.mock("@/lib/kv", () => ({
  saveMessage: jest.fn(),
  getMessages: jest.fn().mockResolvedValue([]),
  getRecentMessages: jest.fn().mockResolvedValue([]),
}));

// Mock SSE
jest.mock("@/lib/sse", () => ({
  broadcastToRoom: jest.fn(),
}));

describe("Messages API", () => {
  it("GET returns messages array", async () => {
    const req = new NextRequest(new Request("http://localhost/api/rooms/test/messages"));
    const res = await GET(req, { params: { roomId: "test" } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("POST returns 401 without userId header", async () => {
    const req = new NextRequest(
      new Request("http://localhost/api/rooms/test/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "Hello" }),
      })
    );
    const res = await POST(req, { params: { roomId: "test" } });
    expect(res.status).toBe(401);
  });
});
```

Run: `npx jest __tests__/api/messages.test.ts --no-coverage`
Expected: All tests pass (green)

- [ ] **Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/app/api/ __tests__/api/
git commit -m "feat: add API routes (messages, SSE, upload, link-preview)"
```

---

### Task 9: Create Pages and Routing

**Files:**
- Create/Rewrite: `src/app/page.tsx`
- Create: `src/app/[roomId]/page.tsx`

- [ ] **Step 1: Write root page (landing/redirect)**

```typescript
// src/app/page.tsx
import { redirect } from "next/navigation";
import { generateRoomId } from "@/utils/formatting";

export default function HomePage() {
  const roomId = generateRoomId();
  redirect(`/${roomId}`);
}
```

- [ ] **Step 2: Write room page** (UserProvider wraps ChatInterface, RoomProvider sits inside ChatInterface)

```typescript
// src/app/[roomId]/page.tsx
"use client";
import React from "react";
import { UserProvider } from "@/context/UserContext";
import { ChatInterface } from "@/components/ChatInterface";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <UserProvider roomId={params.roomId}>
      <ChatInterface roomId={params.roomId} />
    </UserProvider>
  );
}
```

- [ ] **Step 3: Refactor ChatInterface to wrap RoomProvider internally**

```typescript
// Updated src/components/ChatInterface.tsx (replace previous version)
"use client";
import React from "react";
import { useUser } from "@/context/UserContext";
import { RoomProvider } from "@/context/RoomContext";
import { useRoom } from "@/context/RoomContext";
import { UserRegistrationModal } from "./UserRegistrationModal";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { ConnectionStatus } from "./ConnectionStatus";
import { uploadImage } from "@/lib/blob";

interface Props {
  roomId: string;
}

function ChatContent({ roomId }: { roomId: string }) {
  const { user } = useUser();
  const { messages, status, sendMessage, loadOlderMessages, hasMoreMessages, loadingOlder } = useRoom();

  const handleSend = (content: string) => {
    sendMessage(content);
  };

  const handleSendImage = async (file: File) => {
    try {
      const { url } = await uploadImage(file);
      sendMessage("", { imageUrl: url });
    } catch {
      alert("Failed to upload image. Please try again.");
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="chat-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
            {user!.avatar}
          </div>
          <div>
            <h1 className="font-semibold text-sm">#{roomId}</h1>
            <p className="text-xs opacity-80">{user!.name}</p>
          </div>
        </div>
        <ConnectionStatus status={status} />
      </div>
      <MessageList
        messages={messages}
        userId={user!.id}
        onLoadOlder={loadOlderMessages}
        hasMore={hasMoreMessages}
        loadingOlder={loadingOlder}
      />
      <MessageInput onSend={handleSend} onSendImage={handleSendImage} disabled={status.type === "disconnected"} />
    </div>
  );
}

export function ChatInterface({ roomId }: Props) {
  const { user, register, isRegistered } = useUser();

  const handleRegister = (name: string, email: string, avatar: string) => {
    register(name, email, avatar, roomId);
  };

  if (!isRegistered || !user) {
    return <UserRegistrationModal roomId={roomId} onRegister={handleRegister} />;
  }

  return (
    <RoomProvider
      roomId={roomId}
      userId={user.id}
      userName={user.name}
      userAvatar={user.avatar}
    >
      <ChatContent roomId={roomId} />
    </RoomProvider>
  );
}
```

- [ ] **Step 5: Update room page**

```typescript
// src/app/[roomId]/page.tsx
"use client";
import React from "react";
import { UserProvider } from "@/context/UserContext";
import { ChatInterface } from "@/components/ChatInterface";

export default function RoomPage({ params }: { params: { roomId: string } }) {
  return (
    <UserProvider roomId={params.roomId}>
      <ChatInterface roomId={params.roomId} />
    </UserProvider>
  );
}
```

- [ ] **Step 6: Run type check**

Run: `npx tsc --noEmit`
Expected: No TypeScript errors

- [ ] **Step 7: Run all tests**

Run: `npx jest --no-coverage`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/app/\[roomId\]/ src/components/ChatInterface.tsx
git commit -m "feat: add pages and routing with provider hierarchy"
```

---

### Task 10: Final Integration and Vercel Configuration

**Files:**
- Create: `vercel.json`
- Modify: `next.config.mjs` (add image domains if needed)

- [ ] **Step 1: Create vercel.json**

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "installCommand": "npm install"
}
```

- [ ] **Step 2: Update next.config.mjs to allow external images**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};
export default nextConfig;
```

- [ ] **Step 3: Run full test suite**

Run: `npx jest --no-coverage && npx tsc --noEmit`
Expected: All tests pass, no TypeScript errors

- [ ] **Step 4: Build to verify production readiness**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Commit all remaining changes**

```bash
git add vercel.json next.config.mjs
git commit -m "chore: add Vercel configuration and finalize project"
```

- [ ] **Step 6: Create final summary commit message**

```bash
git log --oneline -10
```

Expected: Shows 10 feature commits that build the project incrementally<｜end▁of▁thinking｜>

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="read">
<｜｜DSML｜｜parameter name="filePath" string="true">/home/filipelb/projetos/chat-anywhere/docs/superpowers/plans/2026-05-25-chat-anywhere-implementation.md