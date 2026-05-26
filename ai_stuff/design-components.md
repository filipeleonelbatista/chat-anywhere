# Chat-Anywhere Core Components

## Frontend Components (React/Next.js)

### 1. RoomProvider (Context)
- Manages room-specific state: messages, user info, connection status
- Handles SSE subscription/unsubscription for the current room
- Provides methods for sending messages, fetching history
- Persists user data to localStorage

### 2. ChatInterface (Main Layout)
- **MessageList**: Virtualized list of chat messages with infinite scroll for history
- **MessageInput**: Text input with image attachment, link detection, send button
- **UserHeader**: Shows current room ID and user info (avatar/name)
- **NewMessageIndicator**: Visual cue when new messages arrive while viewing history

### 3. UserRegistrationModal
- Avatar selector (12 predefined options)
- Name and email input fields with validation
- Submit button to join room
- Stores user data in localStorage upon successful registration

### 4. MessageComponent
- Displays different message types:
  - Text messages
  - Image messages (with click-to-expand)
  - Link messages (with preview card)
  - System messages (joins, leaves, etc.)
- Shows sender avatar, name, and timestamp
- Indicates own messages with different styling

### 5. ImagePicker
- File input with preview
- Validates file type and size (5MB limit)
- Shows upload progress
- Returns temporary URL from Vercel Blob after upload

### 6. LinkPreviewGenerator
- Detects URLs in text input
- Fetches metadata via API route (title, description, image)
- Displays preview card in message input
- Handles errors gracefully (shows URL if preview fails)

## Backend Components (Next.js API Routes)

### 1. SSE Endpoint (`/api/rooms/[roomId]/sse`)
- GET endpoint that establishes SSE connection
- Authenticates user via headers (user data from localStorage)
- Listens for new messages in Vercel KV for the room
- Streams messages to client as Server-Sent Events
- Handles client disconnections gracefully

### 2. Message Endpoint (`/api/rooms/[roomId]/messages`)
- GET: Fetch message history for room (with pagination)
  - Query params: `since` (timestamp), `limit` (default 20)
  - Returns messages older than `since` timestamp
- POST: Send new message to room
  - Expects: message content, optional image URL, link preview data
  - Validates user data from headers
  - Stores message in Vercel KV with room ID and timestamp
  - Triggers SSE broadcast to all connected clients

### 3. Image Upload Endpoint (`/api/upload/image`)
- POST: Handle image file upload
  - Validates file type and size
  - Uploads to Vercel Blob
  - Returns temporary URL with 24-hour expiration
  - Deletes temporary file after upload

### 4. Link Preview Endpoint (`/api/link-preview`)
- POST: Fetch metadata for URL
  - Expects: URL in request body
  - Fetches page and extracts Open Graph/meta tags
  - Returns: title, description, image URL
  - Caches results briefly to avoid duplicate requests
  - Handles timeouts and invalid URLs gracefully

## Infrastructure Components

### 1. Vercel KV (Redis)
- Data Structure:
  - Room messages: `room:{roomId}:messages` (sorted set by timestamp)
  - Message details: `message:{messageId}` (hash with content, sender, etc.)
- TTL: 24 hours on all keys
- Commands Used: ZADD, ZRANGE, HSET, HGETALL, EXPIRE

### 2. Vercel Blob
- Used for: Temporary image storage
- Expiration: 24 hours (automatic via lifecycle policy)
- Access: Public read URLs with short-lived tokens for upload

### 3. localStorage Schema (per room)
```
chat-anywhere:{roomId}:user = {
  id: string (random),
  name: string,
  email: string,
  avatar: string (URL or identifier),
  joinedAt: timestamp
}
```

## Data Models

### Message Object
```javascript
{
  id: string (uuid),
  roomId: string (from URL),
  senderId: string (from localStorage),
  senderName: string,
  senderAvatar: string,
  content: string,
  type: 'text' | 'image' | 'link',
  imageUrl?: string (for image type),
  linkPreview?: {
    url: string,
    title: string,
    description: string,
    image?: string
  } (for link type),
  timestamp: number (Unix ms),
  createdAt: string (ISO)
}
```

### Room Metadata (implicit)
- Defined by the roomId in URL path
- All data scoped to this roomId in Vercel KV
- Automatically expires when all messages exceed TTL