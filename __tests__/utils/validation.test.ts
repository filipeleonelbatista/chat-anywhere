import {
  isValidEmail,
  isValidName,
  isValidMessageContent,
  isValidFileType,
  isValidFileSize,
} from "@/utils/validation";

describe("isValidEmail", () => {
  it("returns true for valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });
  it("returns false for invalid email", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("")).toBe(false);
  });
});

describe("isValidName", () => {
  it("returns true for valid name", () => {
    expect(isValidName("Alice")).toBe(true);
  });
  it("returns false for invalid name", () => {
    expect(isValidName("")).toBe(false);
    expect(isValidName("A")).toBe(false);
  });
});

describe("isValidMessageContent", () => {
  it("returns true for valid content", () => {
    expect(isValidMessageContent("Hello!")).toBe(true);
  });
  it("returns false for empty content", () => {
    expect(isValidMessageContent("")).toBe(false);
    expect(isValidMessageContent("   ")).toBe(false);
  });
});

describe("isValidFileType", () => {
  it("returns true for allowed image types", () => {
    expect(
      isValidFileType(new File([], "test.jpg", { type: "image/jpeg" }))
    ).toBe(true);
    expect(
      isValidFileType(new File([], "test.png", { type: "image/png" }))
    ).toBe(true);
  });
  it("returns false for disallowed types", () => {
    expect(
      isValidFileType(new File([], "test.pdf", { type: "application/pdf" }))
    ).toBe(false);
  });
});

describe("isValidFileSize", () => {
  it("returns true for file under 5MB", () => {
    const f = new File([new ArrayBuffer(1024 * 1024)], "test.jpg", {
      type: "image/jpeg",
    });
    expect(isValidFileSize(f, 5)).toBe(true);
  });
  it("returns false for file over 5MB", () => {
    const f = new File([new ArrayBuffer(6 * 1024 * 1024)], "test.jpg", {
      type: "image/jpeg",
    });
    expect(isValidFileSize(f, 5)).toBe(false);
  });
});
