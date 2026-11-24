import { NextRequest, NextResponse } from "next/server";
import { recordSchema } from "@/lib/validation";
import { submissionClientHash } from "@/lib/rate-limit";
import { recordsDb } from "@/lib/firebase/admin";
import { recordData, reserveQuota } from "@/lib/firebase/records";

export function HEAD() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  let payload: unknown;
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: "The submitted data could not be read." }, { status: 400 });
  try {
    const decoder = new TextDecoder();
    let length = 0;
    let body = "";
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 16_384) {
        await reader.cancel().catch(() => undefined);
        return NextResponse.json({ error: "The submitted record is too large." }, { status: 413 });
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    payload = JSON.parse(body + decoder.decode());
  } catch {
    return NextResponse.json({ error: "The submitted data could not be read." }, { status: 400 });
  } finally {
    reader.releaseLock();
  }

  const parsed = recordSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  if ((payload as { consentConfirmed?: unknown }).consentConfirmed !== true) {
    return NextResponse.json({ error: "Confirm consent before submitting." }, { status: 422 });
  }

  const secret = process.env.SUBMISSION_HASH_SECRET;
  if (!secret) return NextResponse.json({ error: "Record submission is not configured yet." }, { status: 503 });
  let retryAfter: number;
  try {
    retryAfter = await reserveQuota(submissionClientHash(request.headers, secret));
  } catch {
    return NextResponse.json({ error: "Submissions are temporarily unavailable. Try again later." }, { status: 503 });
  }
  if (retryAfter > 0) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  try {
    const now = new Date().toISOString();
    await recordsDb().collection("evangelism_records").add({
      ...recordData(parsed.data), consent_given: true, contacted: false, created_at: now, updated_at: now,
    });
  } catch {
    return NextResponse.json({ error: "The record could not be saved. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
