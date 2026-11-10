import { NextRequest, NextResponse } from "next/server";
import { recordSchema } from "@/lib/validation";
import { submissionClientHash } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

  const supabase = createSupabaseAdminClient();
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabase || !secret) return NextResponse.json({ error: "Record submission is not configured yet." }, { status: 503 });

  const { data: retryAfter, error: quotaError } = await supabase.rpc("reserve_record_submission", {
    p_client_hash: submissionClientHash(request.headers, secret),
  });
  if (quotaError || !Number.isInteger(retryAfter) || retryAfter < 0) {
    return NextResponse.json({ error: "Submissions are temporarily unavailable. Try again later." }, { status: 503 });
  }
  if (retryAfter > 0) {
    return NextResponse.json({ error: "Too many submissions. Please try again later." }, {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  const data = parsed.data;
  const { error } = await supabase.from("evangelism_records").insert({
    person_full_name: data.personFullName,
    person_phone: data.personPhone || null,
    student_status: data.studentStatus || null,
    academic_level: data.studentStatus === "Student" ? data.academicLevel || null : null,
    residence: data.residence || null,
    hostel: data.hostel || null,
    decision: data.decision,
    date_reached: data.dateReached,
    church_denomination: data.churchDenomination || null,
    baptism_status: data.baptismStatus || null,
    preferred_contact_method: data.preferredContactMethod || null,
    evangelism_location: data.evangelismLocation || null,
    remarks: data.remarks || null,
    evangelist_full_name: data.evangelistFullName,
    evangelist_phone: data.evangelistPhone || null,
    hall_zone: data.hallZone || null,
    department: data.department || null,
    consent_given: true,
  });

  if (error) return NextResponse.json({ error: "The record could not be saved. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
