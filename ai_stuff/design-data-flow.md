# Chat-Anywhere Data Flow

## 1. User Joins a Room

### Scenario: User navigates to `/xpto` for the first time or returns after session clearance

**Steps:**
1. **Route Matching**: Next.js App Router matches `/[roomId]` and extracts `roomId = "xpto"`
2. **Session Check**: 
   - Component checks `localStorage` for `chat-anywhere:xpto:user`
   - If found and valid → proceed to step 4
   - If not found or expired → show registration modal
3. **Registration (if needed)**:
   - User selects avatar, enters name/email
   - On submit: 
     - Validate inputs (name not empty, email format)
     - Generate random user ID
     - Save user object to `localStorage`: `chat-anywhere:xpto:user`
4. **Initial History Load**:
   - Fetch last 50 messages via GET `/api/rooms/xpto/messages?limit=50`
   - Server: 
     - Queries Vercel KV for room messages sorted by timestamp (descending)
     - Returns messages in chronological order (oldest first)
   - Client: Stores messages in RoomProvider state, renders MessageList
5. **SSE Connection**:
   - Establish SSE connection to `/api/rooms/xpto/sse`
   - Pass user data in headers for authentication
   - Server: 
     - Validates user data from headers
     - Sets up listener for new messages in Vercel KV
     - Keeps connection open, streams new messages as SSE
   - Client: 
     - Listens for incoming SSE events
     - On message event: append to messages state
     - On error/reconnect: attempt to reconnect with backoff

## 2. Sending a Text Message

### Scenario: User types a message and presses Enter or clicks Send

**Steps:**
1. **Input Handling**:
   - User types in MessageInput component
   - On form submit (Enter key or Send button):
     - Prevent default form submission
     - Validate message not empty
2. **Message Preparation**:
   - Create message object:
     ```javascript
     {
       id: uuidv4(),
       roomId: currentRoomId,
       senderId: user.id from localStorage,
       senderName: user.name,
       senderAvatar: user.avatar,
       content: sanitized text,
       type: 'text',
       timestamp: Date.now()
     }
     ```
3. **API Call**:
   - POST `/api/rooms/xpto/messages` with message object
   - Server:
     - Validates user data from headers matches message sender
     - Stores message in Vercel KV:
       - Add to sorted set: `ZADD room:xpto:messages <timestamp> <messageId>`
       - Store message details: `HSET message:<messageId> <fields>`
       - Set TTL: `EXPIRE room:xpto:messages 86400` (24 hours)
     - Returns success response
   - Client:
     - On success: clear input field, message already received via SSE
     - On error: show retry option, keep message in input
4. **Message Broadcasting**:
   - SSE endpoint detects new message in Vercel KV (via polling or KV listeners)
   - Streams message to all connected SSE clients for room xpto
   - Each client receives via SSE and appends to their messages list

## 3. Sending an Image Message

### Scenario: User attaches an image and sends it

**Steps:**
1. **Image Selection**:
   - User clicks image attachment button
   - Selects file via file picker
   - ImagePicker component validates:
     - File type: JPG, PNG, GIF, WEBP
     - File size: ≤ 5MB
     - Shows preview if valid
2. **Upload Process**:
   - On send:
     - Disable send button, show upload progress
     - POST `/api/upload/image` with file as FormData
     - Server:
       - Validates file again (security)
       - Uploads to Vercel Blob
       - Returns public URL with short-lived token
       - (Optional: Store mapping in Vercel KV for cleanup tracking)
     - Client:
       - On success: get image URL from response
       - On error: show retry, keep image selected
3. **Message Creation** (same as text message but with image):
   - Create message object with:
     - `type: 'image'`
     - `imageUrl: returned URL from upload`
     - `content: ""` (or optional caption)
   - Continue with API call and SSE broadcasting as in step 3 of text message flow

## 4. Sending a Link with Preview

### Scenario: User pastes a URL and sends it (or waits for auto-preview)

**Steps:**
1. **Link Detection**:
   - As user types in MessageInput, detect URL patterns
   - When URL detected (space/enter or pause typing):
     - Extract URL from text
2. **Preview Generation** (optional while typing):
   - Client: POST `/api/link-preview` with `{ url: detectedUrl }`
   - Server:
     - Validate URL format
     - Fetch URL content (with timeout: 5s)
     - Parse HTML for Open Graph tags:
       - `og:title`, `og:description`, `og:image`
     - Fallback to standard meta tags
     - Return `{ title, description, image }`
   - Client: 
     - On success: show preview card below input
     - On error: show URL as fallback, optionally retry
3. **Message Creation**:
   - On send:
     - If preview was generated, include it in message
     - Create message object with:
       - `type: 'link'`
       - `content: original text with URL`
       - `linkPreview: { url, title, description, image }`
   - Continue with API call and SSE broadcasting
4. **Link Preview Display**:
   - In MessageComponent:
     - If message.type === 'link' and message.linkPreview exists:
       - Show clickable card with:
         - Image (if available) on left
         - Title and description on right
         - Favicon/domain indicator
     - Make entire card clickable to open URL in new tab

## 5. Receiving Messages (via SSE)

### Scenario: Any client receives a new message from SSE

**Steps:**
1. **SSE Event Reception**:
   - Browser EventSource receives message event
   - Data contains serialized message object
2. **Message Processing**:
   - Client: 
     - Deserialize message JSON
     - Validate required fields exist
     - Check if message is from self (for styling)
     - Add to messages state in RoomProvider
3. **UI Updates**:
   - MessageList:
     - Virtualized list automatically renders new message
     - Scrolls to bottom if user is viewing recent messages
     - Shows subtle indicator ("2 new messages") if user is scrolled up viewing history
   - NewMessageIndicator:
     - Shows when unread messages exist above current viewport
     - On click: scrolls to bottom, hides indicator
4. **History Storage**:
   - Messages are already stored in Vercel KV via the sending flow
   - No additional storage needed on receive

## 6. Fetching Older Messages (Infinite Scroll)

### Scenario: User scrolls to top of message list to load older history

**Steps:**
1. **Scroll Detection**:
   - MessageList component detects scroll near top
   - Triggers fetchOlderMessages() if not already loading
2. **API Call**:
   - GET `/api/rooms/xpto/messages?since=<oldestMessageTimestamp>&limit=20`
   - Client: 
     - Sets loading state
     - Passes timestamp of oldest currently loaded message
   - Server:
     - Queries Vercel KV for messages older than `since` timestamp
     - Returns up to `limit` messages in chronological order
     - Uses: `ZRANGE room:xpto:messages 0 -1` with score filtering
   - Client:
     - On success: prepend new messages to messages list
     - Maintains scroll position to avoid jumping
     - Updates loading state
     - If fewer than limit messages returned, hide loading indicator (end of history)
3. **Edge Cases**:
   - No older messages: return empty array, hide loading indicator
   - Error: show retry option, maintain loading state until resolved

## 7. Room Isolation and Data Scope

### How rooms remain isolated:

1. **URL-based Partitioning**:
   - All API endpoints include `[roomId]` as parameter
   - Vercel KV keys are prefixed with `room:{roomId}:`
   - Example: `room:xpto:messages` vs `room:ypto:messages`

2. **SSE Channel Separation**:
   - Each room has its own SSE endpoint: `/api/rooms/[roomId]/sse`
   - Connections are specific to roomId
   - Messages are only broadcast to connections for that roomId

3. **localStorage Scoping**:
   - User data stored per room: `chat-anywhere:{roomId}:user`
   - Users can have different identities in different rooms
   - No cross-room data leakage

4. **Automatic Cleanup**:
   - TTL on Vercel KV keys ensures rooms expire after 24h of inactivity
   - No manual cleanup needed
   - New room creation automatic on first message after expiry

This data flow ensures:
- Real-time updates via efficient SSE
- Persistent history for new users via Vercel KV
- Optimistic UI updates with error handling
- Proper scoping and isolation between rooms
- Graceful handling of edge cases and errors