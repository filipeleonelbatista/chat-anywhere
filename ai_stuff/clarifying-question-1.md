**Clarifying Question 1: Real-time Updates Mechanism**

You mentioned wanting to implement this without WebSockets using only Next.js on Vercel's Hobby plan. Since Vercel Hobby doesn't support persistent connections (required for WebSockets), how do you envision handling real-time message updates between users in the same room?

Some possibilities to consider:
1. Polling: Clients periodically check the server for new messages (e.g., every 3 seconds)
2. Server-Sent Events (SSE): Using Next.js API routes to push updates to clients
3. Using Vercel's Edge Config or KV for temporary storage with change notifications

Which approach would you prefer, or do you have another idea in mind?