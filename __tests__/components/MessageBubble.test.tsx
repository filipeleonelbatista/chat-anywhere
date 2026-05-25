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
    expect(screen.getByText("Hello!")).toBeTruthy();
  });

  it("shows sender name for other messages", () => {
    render(<MessageBubble message={baseMessage} isOwn={false} />);
    expect(screen.getByText("Alice")).toBeTruthy();
  });

  it("hides sender name for own messages", () => {
    render(
      <MessageBubble
        message={{ ...baseMessage, senderId: "me" }}
        isOwn={true}
      />
    );
    expect(screen.queryByText("Alice")).toBeNull();
  });
});
