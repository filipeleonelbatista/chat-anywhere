import { NextRequest, NextResponse } from "next/server";
import { CHAT_IMAGE_BLOB_PREFIX } from "@/lib/blob";
import { cleanupChatImagesOlderThan } from "@/lib/blob-cleanup";

const TWENTY_FOUR_H_MS = 24 * 60 * 60 * 1000;

function isCronAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Cron endpoint: delete chat images in Blob storage older than 24 hours.
 * Secure with `Authorization: Bearer <CRON_SECRET>` (Vercel Cron sends this automatically when CRON_SECRET is set in the project).
 *
 * @see https://vercel.com/docs/cron-jobs
 */
export async function GET(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN is not configured" },
      { status: 500 }
    );
  }

  try {
    const { scanned, deleted, errors } =
      await cleanupChatImagesOlderThan(TWENTY_FOUR_H_MS);

    return NextResponse.json({
      ok: true,
      scanned,
      deleted,
      errors,
      maxAgeHours: 24,
      prefix: CHAT_IMAGE_BLOB_PREFIX,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[cron/clean-blobs]", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

/** Vercel Pro / Fluid: allow long runs if the store is large. */
export const maxDuration = 60;
