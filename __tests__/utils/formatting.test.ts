import { formatTimestamp, generateRoomId } from "@/utils/formatting";

describe("formatTimestamp", () => {
  it('returns "now" for recent timestamps', () => {
    expect(formatTimestamp(Date.now())).toBe("now");
  });
  it("returns minutes ago for recent messages", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatTimestamp(fiveMinAgo)).toBe("5m ago");
  });
  it("returns hours ago for older messages", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(formatTimestamp(twoHoursAgo)).toBe("2h ago");
  });
});

describe("generateRoomId", () => {
  it('generates a string with format "adj-noun-num"', () => {
    const id = generateRoomId();
    expect(id).toMatch(/^[a-z]+-[a-z]+-\d+$/);
  });
  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateRoomId()));
    expect(ids.size).toBeGreaterThan(90);
  });
});
