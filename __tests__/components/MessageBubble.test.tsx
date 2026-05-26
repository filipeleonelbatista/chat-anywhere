import { render, screen } from "@testing-library/react";
import { MessageBubble } from "@/components/MessageBubble";
import type { Message } from "@/types";
import { RoomProvider } from "@/context/RoomContext";
import { useUser } from "@/context/UserContext";

jest.mock("@/context/UserContext");

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
    render(
      <RoomProvider roomId="test" userId="user1" userName="Test User" userAvatar="👤">
        <MessageBubble message={baseMessage} isOwn={false} />
      </RoomProvider>
    );
    expect(screen.getByText("Hello!")).toBeTruthy();
  });

  it("shows sender name for other messages", () => {
    render(
      <RoomProvider roomId="test" userId="user1" userName="Test User" userAvatar="👤">
        <MessageBubble message={baseMessage} isOwn={false} />
      </RoomProvider>
    );
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("hides sender name for own messages", () => {
    render(
      <RoomProvider roomId="test" userId="user1" userName="Test User" userAvatar="👤">
        <MessageBubble
          message={{ ...baseMessage, senderId: "me" }}
          isOwn={true}
        />
      </RoomProvider>
    );
    expect(screen.queryByText("Alice")).toBeNull();
  });
});
