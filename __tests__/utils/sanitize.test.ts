import { sanitizeHtml, sanitizeMessageContent, sanitizeName } from "@/utils/sanitize";

describe("sanitizeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(sanitizeHtml('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"
    );
  });
  it("returns empty string for empty input", () => {
    expect(sanitizeHtml("")).toBe("");
  });
});

describe("sanitizeMessageContent", () => {
  it("trims and sanitizes content", () => {
    expect(sanitizeMessageContent("  Hello <b>world</b>  ")).toBe(
      "Hello &lt;b&gt;world&lt;/b&gt;"
    );
  });
});

describe("sanitizeName", () => {
  it("truncates long names to 50 chars", () => {
    expect(sanitizeName("a".repeat(100))).toBe("a".repeat(50));
  });
  it("sanitizes HTML in names", () => {
    expect(sanitizeName("<b>Name</b>")).toBe("&lt;b&gt;Name&lt;/b&gt;");
  });
});
