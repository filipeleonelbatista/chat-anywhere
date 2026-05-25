# Chat-Anywhere Design Specification

**Date**: 2026-05-25  
**Project**: chat-anywhere  
**Status**: Approved

## 1. Project Overview

Chat-Anywhere is a real-time chat application built with Next.js 14 (App Router) and deployed on Vercel's Hobby plan. The application allows users to create and join chat rooms via URL paths (e.g., `/xpto`) with features including:
- WhatsApp-like interface
- Image sharing with preview
- Link previews with metadata
- User registration (avatar, name, email)
- Session persistence via localStorage
- Historical message fetching
- Real-time updates without WebSockets

## 2. Architecture Overview

### Key Decisions
- **Real-time Communication**: Server-Sent Events (SSE) via Next.js API routes
- **Data Storage**: 
  - Vercel KV (Redis) for chat messages with 24-hour TTL
  - Vercel Blob for temporary image storage (24-hour expiration)
  - localStorage for user session data per room
- **Room Isolation**: Each URL path represents an isolated chat room
- **Data Persistence**: Messages expire after 24 hours (no permanent storage)

### System Boundaries
- **Frontend**: React components handling UI, user input, localStorage, SSE connections
- **Backend**: Next.js API routes managing storage, message broadcasting, media processing
- **Infrastructure**: Vercel services (KV, Blob) and browser APIs

## 3. Core Components

### Frontend Components
- **RoomProvider**: Manages room state, SSE connections, localStorage persistence
- **ChatInterface**: Main layout with MessageList, MessageInput, UserHeader
- **UserRegistrationModal**: Avatar selection, name/email input, validation
- **MessageComponent**: Renders text, image, link, and system messages
- **ImagePicker**: File input with preview, validation, upload progress
- **LinkPreviewGenerator**: URL detection, metadata fetching, preview display

### Backend Components (API Routes)
- **SSE Endpoint** (`/api/rooms/[roomId]/sse`): Real-time message streaming
- **Message Endpoint** (`/api/rooms/[roomId]/messages`): Message history and sending
- **Image Upload Endpoint** (`/api/upload/image`): Temporary image storage
- **Link Preview Endpoint** (`/api/link-preview`): Metadata extraction for URLs

### Infrastructure
- **Vercel KV**: Sorted sets for room messages, hashes for message details
- **Vercel Blob**: Temporary image hosting with automatic expiration
- **localStorage**: Per-room user data (avatar, name, email, ID, timestamp)

## 4. Data Models

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
  imageUrl?: string,
  linkPreview?: {
    url: string,
    title: string,
    description: string,
    image?: string
  },
  timestamp: number (Unix ms),
  createdAt: string (ISO)
}
```

## 5. Key Data Flows

### User Joins Room
1. Check localStorage for existing session
2. Show registration modal if needed
3. Save user data to localStorage
4. Fetch initial history (last 50 messages) via API
5. Establish SSE connection for real-time updates

### Sending Messages
1. Create message object with user data and content
2. For images: upload to Vercel Blob, get URL
3. For links: fetch metadata via API route
4. POST message to API route
5. Store in Vercel KV with room ID and timestamp
6. Broadcast via SSE to all connected clients

### Receiving Messages
1. Receive via SSE connection
2. Append to messages state
3. Update UI (auto-scroll if viewing recent messages)
4. Show indicator if viewing history

### History Fetching
1. On scroll to top: request older messages since timestamp
2. API queries Vercel KV for messages before given timestamp
3. Prepend new messages to list, maintain scroll position

## 6. Error Handling

### Strategies
- **Network Errors**: Automatic retry with exponential backoff
- **SSE Issues**: Automatic reconnection with jittered backoff
- **Validation Errors**: Inline feedback, prevent invalid submissions
- **Storage Errors**: Queue operations, retry, graceful degradation
- **Media Errors**: Fallbacks (send without image/preview), user notifications
- **Session Issues**: Clear corrupted data, prompt re-registration

### User Experience
- Non-intrusive toast notifications for transient issues
- Inline errors with recovery options for blocking problems
- Connection status indicator in header
- Preserve user input and state during recovery attempts

## 7. Testing Strategy

### Levels
- **Unit Testing**: Utilities, hooks, context providers (Jest)
- **Component Testing**: UI components and interactions (RTL + Jest)
- **API Testing**: Route handlers, validation, responses (Jest + SuperTest)
- **Integration Testing**: Component interactions, user flows (RTL)
- **E2E Testing**: Real user scenarios (Cypress/Playwright)
- **Manual Testing**: UI/UX, accessibility, performance, compatibility

### Coverage Goals
- 90%+ for utilities and helpers
- 80%+ for components and hooks
- 70%+ for API routes
- 60%+ overall

### Key Test Scenarios
- New user joins and registers
- Message sending and receiving (text, image, link)
- History loading and infinite scroll
- SSE connection and reconnection
- Error conditions and recovery
- Session persistence across browser sessions
- Multi-tab synchronization
- Room isolation and data scoping

## 8. Implementation Notes

### Technical Requirements
- Node.js 18+ (Vercel default)
- Next.js 14 (App Router)
- React 18
- TypeScript recommended
- Vercel KV and Blob dependencies

### Environment Variables
- `KV_URL`: Vercel KV connection string
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob access token
- Optional: Link preview timeout/cache settings

### Browser Support
- Modern browsers: Chrome, Firefox, Safari, Edge
- Mobile: iOS Safari, Android Chrome
- Graceful degradation for older browsers

## 9. Future Considerations

### Potential Enhancements
- Read receipts and typing indicators
- Message reactions and replies
- File sharing beyond images
- Custom themes and dark mode
- Message editing and deletion
- Administrative controls (moderation)
- Push notifications (Service Workers)
- Improved accessibility features

### Scalability
- Current design supports moderate usage via Vercel Hobby limits
- For higher usage: consider upgrading Vercel plan, optimizing KV usage
- SSE connection limits per region should be monitored

---
*This design has been reviewed and approved for implementation. The next step is to create a detailed implementation plan using the writing-plans skill.*