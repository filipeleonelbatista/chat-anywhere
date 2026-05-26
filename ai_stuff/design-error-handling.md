# Chat-Anywhere Error Handling

## Error Handling Philosophy

The application follows a resilient design principle: **graceful degradation**. When errors occur, the UI remains functional, provides clear feedback to users, and automatically attempts recovery where possible. No error should leave the user in a broken state without a path forward.

## 1. Network and Connection Errors

### API Request Failures
- **Detection**: Catch errors from fetch/axios calls, check HTTP status codes
- **User Feedback**: 
  - Show non-intrusive toast notification: "Failed to send message. Retrying..."
  - For critical actions (sending message): inline error with retry button
- **Recovery Strategy**:
  - Automatic retry with exponential backoff (max 3 attempts)
  - For message sending: keep message in input field until successful send
  - For history loading: show "Failed to load older messages" with retry option
  - For SSE: automatic reconnection with jittered backoff

### SSE Connection Issues
- **Detection**: EventSource `onerror` handler, `readyState` checks
- **User Feedback**:
  - Subtle connection status indicator in header (● green = connected, ● yellow = reconnecting, ● red = disconnected)
  - Toast notification on prolonged disconnection: "Connection lost. Reconnecting..."
- **Recovery Strategy**:
  - Automatic reconnection with increasing delays (1s, 2s, 4s, 8s, max 30s)
  - On reconnection: request missed messages since last received timestamp
  - Max retry attempts: indefinite (continue trying until success or page unload)

## 2. Validation and Input Errors

### User Registration
- **Detection**: 
  - Client-side: empty name, invalid email format
  - Server-side: duplicate validation for security
- **User Feedback**:
  - Inline validation messages under each field (red text)
  - Disable submit button until all fields valid
  - Examples: "Name is required", "Please enter a valid email"
- **Recovery**: User corrects input and resubmits

### Message Validation
- **Detection**:
  - Client: empty message prevention
  - Server: validate message structure, size limits, content sanitization
- **User Feedback**:
  - Send button disabled for empty input
  - For server validation errors: toast with "Invalid message. Please try again."
  - Message remains in input field for correction
- **Recovery**: User edits message and resends

## 3. Storage Errors (Vercel KV/Blob)

### KV Operations
- **Detection**: Catch exceptions from KV client, check for timeout/responses
- **User Feedback**:
  - For message sending: "Unable to send message. Server temporarily unavailable."
  - For history loading: "Unable to load chat history. Please try again later."
  - General: persistent banner at top: "Experiencing delays. Some features may be slow."
- **Recovery Strategy**:
  - Queue operations locally and retry when connection restored
  - For sending: store message in localStorage queue, attempt to send when KV available
  - For history: show cached/local messages if available, note potential incompleteness
  - Circuit breaker pattern: temporarily disable non-essential features if KV repeatedly fails

### Blob Storage (Images)
- **Detection**: Upload API errors, timeout responses
- **User Feedback**:
  - During upload: show error in image picker UI
  - Toast: "Image upload failed. Please check your connection and try again."
  - Keep image selected in picker for retry
- **Recovery Strategy**:
  - Automatic retry (2 attempts) with different Blob endpoints if available
  - Fallback: allow sending message without image, notify user: "Image not sent due to upload failure"
  - Client-side cleanup: revoke object URLs for failed uploads to prevent memory leaks

## 4. Media Processing Errors

### Image Processing
- **Detection**: 
  - Client: invalid file type/size before upload
  - Server: corrupt image, unsupported format during processing
- **User Feedback**:
  - Client-side: "Please select a valid image file (JPG, PNG, GIF, max 5MB)"
  - Server-side: toast "Unable to process this image. Please try a different file."
- **Recovery**: User selects different image or sends without image

### Link Preview Generation
- **Detection**:
  - Client: network errors, timeout (5s limit)
  - Server: invalid URL, timeout fetching page, parsing errors
- **User Feedback**:
  - While typing: show "Link preview unavailable" as fallback
  - On send: if preview fails, send message with just the URL (no preview)
  - Toast: "Link preview not available. Message sent as plain text."
- **Recovery Strategy**:
  - Cache successful previews briefly to reduce server load
  - Respect robots.txt and rate limits when fetching URLs
  - Sanitize fetched content to prevent XSS
  - Fallback behavior always available: send message with URL only

## 5. Authentication and Session Issues

### Session Corruption
- **Detection**: 
  - localStorage data missing required fields
  - Data type mismatches (e.g., expecting string, getting object)
  - Expiration checks (if implemented)
- **User Feedback**:
  - Automatically clear corrupted session data
  - Show registration modal: "Your session data was invalid. Please re-enter your details."
  - Log info to console for debugging (in development only)
- **Recovery**: User completes registration again

### Anonymous Access Prevention
- **Detection**: 
  - Missing user data in API request headers
  - Mismatch between claimed senderId and actual session
- **User Feedback**:
  - Server: reject request with 401 Unauthorized
  - Client: clear localStorage for that room, show registration modal
  - Toast: "Session expired. Please rejoin the chat."
- **Recovery**: User re-registers and continues

## 6. Edge Case Handling

### Empty Rooms/New Rooms
- **Detection**: No messages found in Vercel KV for roomId
- **User Feedback**: 
  - Show welcome message: "This room is new! Start the conversation by sending a message."
  - Input field focused and ready
- **Recovery**: Normal operation begins with first message

### History Limits and Boundaries
- **Detection**: 
  - Requesting history before first message (negative timestamps)
  - Requesting more messages than available
- **User Feedback**:
  - For beginning of history: hide loading indicator, show "You're up to date!" briefly when scrolling
  - For requests exceeding available: return all available messages without error
  - No artificial limits on scroll - natural boundary at first/last message
- **Recovery**: Automatic adjustment of requests to valid ranges

### Message Ordering and Duplicates
- **Detection**: 
  - Out-of-order message arrival (rare with SSE but possible with network issues)
  - Duplicate message IDs (shouldn't happen with UUIDv4 but defend anyway)
- **User Feedback**: Silent correction - no user impact
- **Recovery Strategy**:
  - Client-side deduplication by message ID
  - Reorder messages by timestamp before rendering if needed
  - Insert out-of-order messages at correct position in virtualized list

### Browser Tab/Window Management
- **Detection**:
  - Page visibility change (hidden/visible)
  - Multiple tabs open to same room
- **User Feedback**: None required - seamless experience
- **Recovery Strategy**:
  - Pause SSE when tab hidden, resume when visible (to save resources)
  - Use BroadcastChannel API to sync localStorage user data between tabs
  - When tab gains focus: check for missed messages, request if needed
  - Share SSE connections between tabs where possible to reduce resource usage

## 7. Error Logging and Monitoring

### Client-Side Logging
- **Development**: Detailed console logs with stack traces
- **Production**: 
  - Only log errors (not warnings) to reduce noise
  - Send critical errors to error monitoring service (if configured)
  - Never log user-sensitive data (messages, emails, etc.)
  - Rate-limit error reporting to prevent flooding

### Server-Side Logging
- **Next.js API Routes**:
  - Log errors with request ID for tracing
  - Log warnings for unusual but non-fatal events
  - Avoid logging full request bodies (privacy)
  - Use Vercel's built-in logging infrastructure

### Metrics and Observability
- Track key error rates:
  - Message send failure rate
  - SSE connection failure rate
  - API error rate by endpoint
- Monitor performance:
  - Average message delivery latency
  - History load times
  - Image upload success rates
- Alert on anomaly detection (sudden error spikes)

## 8. User Experience During Errors

### Progressive Enhancement
- Core functionality (viewing history, sending text) works even if some features fail
- Advanced features (image upload, link previews) fail gracefully to basics
- Example: If image service down, users can still send text and links

### Clear Communication
- Error messages are user-actionable: tell user what they can do
- Avoid technical jargon: "Connection problem" not "ECONNRESET"
- Provide clear paths forward: retry buttons, alternative actions
- Maintain tone: friendly and helpful, not frustrated or alarming

### State Preservation
- Preserve user input during errors wherever possible
- Don't clear forms unless absolutely necessary
- Maintain scroll position and UI state during recovery attempts
- Allow users to continue working in other parts of the app while background retries occur

This error handling strategy ensures that chat-anywhere remains usable and friendly even when facing various failure conditions, aligning with the goal of providing a reliable communication tool despite the constraints of a serverless environment.