export function formatTimestamp(ts: number): string {
  const date = new Date(ts);
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatFullTimestamp(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function generateRoomId(): string {
  const adjectives = [
    "cozy", "sunny", "happy", "cool", "wild", "calm", "bright", "quiet",
  ];
  const nouns = ["chat", "talk", "meet", "room", "den", "spot", "hub", "nest"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 1000);
  return `${adj}-${noun}-${num}`;
}
