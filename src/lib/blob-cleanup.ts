import { del, list } from "@vercel/blob";
import { CHAT_IMAGE_BLOB_PREFIX } from "@/lib/blob";

const LIST_PAGE_SIZE = 500;

function uploadedAtMs(blob: { uploadedAt: Date }): number {
  const d = blob.uploadedAt;
  return d instanceof Date ? d.getTime() : new Date(d).getTime();
}

/**
 * Deletes blobs under {@link CHAT_IMAGE_BLOB_PREFIX} whose `uploadedAt` is older than `maxAgeMs`.
 * Paginates until all matching blobs are processed.
 */
export async function cleanupChatImagesOlderThan(maxAgeMs: number): Promise<{
  scanned: number;
  deleted: number;
  errors: string[];
}> {
  const cutoff = Date.now() - maxAgeMs;
  let scanned = 0;
  let deleted = 0;
  const errors: string[] = [];
  let cursor: string | undefined;

  for (;;) {
    const result = await list({
      prefix: CHAT_IMAGE_BLOB_PREFIX,
      cursor,
      limit: LIST_PAGE_SIZE,
    });

    const staleUrls: string[] = [];
    for (const blob of result.blobs) {
      scanned++;
      if (uploadedAtMs(blob) < cutoff) {
        staleUrls.push(blob.url);
      }
    }

    if (staleUrls.length > 0) {
      try {
        await del(staleUrls);
        deleted += staleUrls.length;
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        errors.push(`batch del (${staleUrls.length}): ${msg}`);
      }
    }

    if (!result.hasMore) break;
    cursor = result.cursor;
  }

  return { scanned, deleted, errors };
}
