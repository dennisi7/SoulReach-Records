import { NextRequest, NextResponse } from "next/server";
import { adminRecordSchema } from "@/lib/validation";
import { getApprovedAdmin } from "@/lib/firebase/authorization";
import { recordsDb } from "@/lib/firebase/admin";
import { listRecords, recordData } from "@/lib/firebase/records";
import { isSameOrigin } from "@/lib/same-origin";

export async function GET(request: NextRequest) {
  try {
    const { approved } = await getApprovedAdmin();
    if (!approved) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 150).toLowerCase() ?? "";
    const decision = request.nextUrl.searchParams.get("decision");
    const records = (await listRecords()).filter((record) =>
      (!decision || decision === "all" || record.decision === decision) &&
      `${record.person_full_name} ${record.evangelism_location ?? ""}`.toLowerCase().includes(search));
    return NextResponse.json({ records });
  } catch {
    return NextResponse.json({ error: "Records could not be loaded." }, { status: 503 });
  }
}

async function changeRecord(request: NextRequest, remove: boolean) {
  if (!isSameOrigin(request.headers)) {
    return NextResponse.json({ error: "Reload the page and try again." }, { status: 403 });
  }
  try {
    const { approved } = await getApprovedAdmin();
    if (!approved) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    const payload = await request.json().catch(() => null);
    const id = typeof payload?.id === "string" ? payload.id : "";
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return NextResponse.json({ error: "A valid record id is required." }, { status: 400 });
    const ref = recordsDb().collection("evangelism_records").doc(id);
    let updates: Record<string, unknown> = {};
    if (!remove) {
      if (payload.action === "contacted") {
        if (typeof payload.contacted !== "boolean") return NextResponse.json({ error: "A follow-up status is required." }, { status: 400 });
        updates = { contacted: payload.contacted, updated_at: new Date().toISOString() };
      } else {
        const parsed = adminRecordSchema.safeParse(payload.record);
        if (!parsed.success) return NextResponse.json({ error: "Check the record fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
        updates = { ...recordData(parsed.data), updated_at: new Date().toISOString() };
      }
    }
    const status = await recordsDb().runTransaction(async (transaction) => {
      const record = await transaction.get(ref);
      if (!record.exists) return 404;
      if (!remove && payload.action === "contacted" && record.data()?.preferred_contact_method === "No Contact") return 409;
      if (remove) transaction.delete(ref);
      else transaction.update(ref, updates);
      return 200;
    });
    if (status === 404) return NextResponse.json({ error: "Record unavailable." }, { status });
    if (status === 409) return NextResponse.json({ error: "Record marked No Contact." }, { status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "The change could not be saved. Try again." }, { status: 503 });
  }
}

export const PATCH = (request: NextRequest) => changeRecord(request, false);
export const DELETE = (request: NextRequest) => changeRecord(request, true);
