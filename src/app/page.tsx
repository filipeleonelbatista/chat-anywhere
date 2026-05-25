import { redirect } from "next/navigation";
import { generateRoomId } from "@/utils/formatting";

export default function HomePage() {
  const roomId = generateRoomId();
  redirect(`/${roomId}`);
}
