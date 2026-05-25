import { NextRequest } from "next/server";
import { createSSEStream } from "@/lib/sse";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params;
  const userId = request.nextUrl.searchParams.get("userId") || "anonymous";
  const clientId = `${roomId}-${userId}-${Date.now()}`;

  const stream = createSSEStream(roomId, clientId);

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
