export interface SSEClient {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userAvatar: string;
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
  clients.forEach((client) => {
    if (client.roomId === roomId) {
      try {
        client.controller.enqueue(encoder.encode(message));
      } catch {
        removeClient(client.id);
      }
    }
  });
}

export function createSSEStream(
  roomId: string,
  clientId: string,
  userId: string,
  userName: string,
  userAvatar: string
): ReadableStream {
  return new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const client: SSEClient = {
        id: clientId,
        roomId,
        userId,
        userName,
        userAvatar,
        controller,
        encoder,
      };
      addClient(client);
      // Send initial connection event
      controller.enqueue(
        encoder.encode(
          `event: connected\ndata: {"clientId":"${clientId}"}\n\n`
        )
      );
      // Tab count in Redis (shared across serverless instances) → join on first tab only
      void (async () => {
        try {
          const { registerSseTab } = await import("@/lib/sse-presence");
          const tabCount = await registerSseTab(roomId, userId, clientId);
          if (tabCount === 1) {
            const { broadcastPresence } = await import("@/lib/presence");
            await broadcastPresence(
              roomId,
              userId,
              userName,
              userAvatar,
              "join"
            );
          }
        } catch (e) {
          console.error("[sse] Redis register tab / join", e);
        }
      })();
    },
    cancel() {
      removeClient(clientId);
      void (async () => {
        try {
          const { unregisterSseTab } = await import("@/lib/sse-presence");
          const tabCount = await unregisterSseTab(roomId, userId, clientId);
          if (tabCount === 0) {
            const { broadcastPresence } = await import("@/lib/presence");
            await broadcastPresence(
              roomId,
              userId,
              userName,
              userAvatar,
              "leave"
            );
          }
        } catch (e) {
          console.error("[sse] Redis unregister tab / leave", e);
        }
      })();
    },
  });
}

export function getRoomUsers(roomId: string) {
  const users: Array<{ id: string; name: string; avatar: string }> = [];
  clients.forEach((client) => {
    if (client.roomId === roomId) {
      users.push({
        id: client.userId,
        name: client.userName,
        avatar: client.userAvatar,
      });
    }
  });
  return users;
}
