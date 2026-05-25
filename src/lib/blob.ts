import { put, del } from "@vercel/blob";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  url: string;
  contentType: string;
  size: number;
}

export async function uploadImage(file: File): Promise<UploadResult> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(", ")}`
    );
  }
  if (file.size > MAX_SIZE) {
    throw new Error(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Max: 5MB`
    );
  }
  const filename = `chat-images/${Date.now()}-${file.name.replace(
    /[^a-zA-Z0-9.-]/g,
    "_"
  )}`;
  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return {
    url: blob.url,
    contentType: file.type,
    size: file.size,
  };
}

export async function deleteImage(url: string): Promise<void> {
  await del(url);
}
