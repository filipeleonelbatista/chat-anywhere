import { formatTimestamp, generateRoomId } from "@/utils/formatting";

describe("formatTimestamp", () => {
  it('returns HH:mm format for recent timestamps', () => {
    expect(formatTimestamp(Date.now())).toMatch(/\d{2}:\d{2}/);
  });

  it("returns HH:mm format for recent messages", () => {
    const fiveMinAgo = Date.now() - 5 * 60 * 1000;
    expect(formatTimestamp(fiveMinAgo)).toMatch(/\d{2}:\d{2}/);
  });

  it("returns HH:mm format for older messages", () => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    expect(formatTimestamp(twoHoursAgo)).toMatch(/\d{2}:\d{2}/);
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
