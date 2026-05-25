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

export function getRoomClientCount(roomId: string): number {
  let count = 0;
  clients.forEach((client) => {
    if (client.roomId === roomId) count++;
  });
  return count;
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
    },
    cancel() {
      removeClient(clientId);
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
