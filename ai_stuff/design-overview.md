# Chat-Anywhere Design Overview

## Architecture Overview

Chat-Anywhere is a real-time chat application built with Next.js 14 (App Router) and deployed on Vercel's Hobby plan. The architecture follows a client-server model leveraging Vercel's built-in services for storage and real-time communication, while maintaining user session data in localStorage as requested.

### Key Architectural Decisions

1. **Real-time Communication**: Server-Sent Events (SSE) via Next.js API routes
   - Chosen over polling for efficiency and true real-time experience
   - Works well with Vercel's serverless functions
   - Automatic reconnection handling built into the EventSource API

2. **Data Storage**: 
   - **Vercel KV (Redis)**: For chat messages and room data with 24-hour TTL
   - **Vercel Blob**: For temporary image storage (24-hour expiration)
   - **localStorage**: For user session data (avatar, name, email) per room

3. **Client-Server Responsibilities**:
   - **Client (React)**: UI rendering, user input handling, localStorage management, SSE connection management
   - **Server (Next.js API Routes)**: Message storage/retrieval, image upload handling, link preview generation, SSE broadcasting

### Core System Boundaries

- **Room Scope**: Each URL path (e.g., `/xpto`) represents an isolated chat room
- **Data Persistence**: Messages persist for 24 hours in Vercel KV, then automatically expire
- **User Identity**: Stored only in localStorage; no server-side user accounts
- **Media Handling**: Images stored temporarily in Vercel Blob with automatic cleanup

This architecture satisfies the requirements of:
- No WebSockets (using SSE instead)
- Next.js only on Vercel Hobby plan
- No permanent data storage (TTL-based expiration)
- localStorage for user session persistence
- Historical message fetching for new users
- Image sharing and link preview features