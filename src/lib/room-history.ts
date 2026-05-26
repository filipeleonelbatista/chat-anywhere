/**
 * Rolling history window per room (must stay aligned with MESSAGE_TTL in kv.ts).
 * Anyone opening the room sees the same timeline: messages from the last 24 hours.
 */
export const ROOM_HISTORY_MS = 24 * 60 * 60 * 1000;

/** First paint: how many newest messages inside the window to load (by offset 0). */
export const ROOM_HISTORY_INITIAL_LIMIT = 50;

/** Each “scroll up” batch (older messages still inside the window). */
export const ROOM_HISTORY_PAGE = 20;
