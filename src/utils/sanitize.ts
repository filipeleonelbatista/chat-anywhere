export function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeMessageContent(content: string): string {
  return sanitizeHtml(content.trim());
}

export function sanitizeName(name: string): string {
  return sanitizeHtml(name.trim()).slice(0, 50);
}
