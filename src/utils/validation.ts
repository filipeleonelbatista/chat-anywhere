const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

export function isValidName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 50;
}

export function isValidMessageContent(content: string): boolean {
  return content.trim().length > 0 && content.trim().length <= 5000;
}

export function isValidFileType(file: File): boolean {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  return allowedTypes.includes(file.type);
}

export function isValidFileSize(file: File, maxSizeMB = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
