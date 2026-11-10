import { NextRequest, NextResponse } from "next/server";
import { recordSchema } from "@/lib/validation";
import { getApprovedAdmin } from "@/lib/supabase/authorization";

export async function GET(request: NextRequest) {
  const { supabase, user, approved } = await getApprovedAdmin();
  if (!supabase || !user || !approved) return NextResponse.json({ error: "Not authorized." }, { status: 403 });

  const search = request.nextUrl.searchParams.get("search")?.trim();
  const decision = request.nextUrl.searchParams.get("decision");
  let query = supabase.from("evangelism_records").select("*").order("date_reached", { ascending: false });
  if (search) {
    const literal = search.slice(0, 150).replace(/[\\%_]/g, "\\$&").replace(/[\\"]/g, "\\$&");
    query = query.or(`person_full_name.ilike."%${literal}%",evangelism_location.ilike."%${literal}%"`);
  }
  if (decision && decision !== "all") query = query.eq("decision", decision);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Records could not be loaded." }, { status: 500 });
  return NextResponse.json({ records: data });
}

export async function PATCH(request: NextRequest) {
  const { supabase, user, approved } = await getApprovedAdmin();
  if (!supabase || !user || !approved) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) return NextResponse.json({ error: "A record id is required." }, { status: 400 });

  if (payload?.action === "contacted") {
    if (typeof payload.contacted !== "boolean") return NextResponse.json({ error: "A follow-up status is required." }, { status: 400 });
    const { data, error } = await supabase.from("evangelism_records")
      .update({ contacted: payload.contacted, updated_at: new Date().toISOString() })
      .eq("id", id).or("preferred_contact_method.is.null,preferred_contact_method.neq.No Contact")
      .select("id").maybeSingle();
    if (error) return NextResponse.json({ error: "The follow-up status could not be updated." }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Record unavailable or marked No Contact." }, { status: 409 });
    return NextResponse.json({ record: data });
  }

  const parsed = recordSchema.safeParse(payload?.record);
  if (!parsed.success) return NextResponse.json({ error: "Check the record fields.", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  const data = parsed.data;
  const { data: saved, error } = await supabase.from("evangelism_records").update({ person_full_name: data.personFullName, person_phone: data.personPhone || null, student_status: data.studentStatus || null, academic_level: data.studentStatus === "Student" ? data.academicLevel || null : null, residence: data.residence || null, hostel: data.hostel || null, decision: data.decision, date_reached: data.dateReached, church_denomination: data.churchDenomination || null, baptism_status: data.baptismStatus || null, preferred_contact_method: data.preferredContactMethod || null, evangelism_location: data.evangelismLocation || null, remarks: data.remarks || null, evangelist_full_name: data.evangelistFullName, evangelist_phone: data.evangelistPhone || null, hall_zone: data.hallZone || null, department: data.department || null, updated_at: new Date().toISOString() }).eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "The record could not be updated." }, { status: 500 });
  if (!saved) return NextResponse.json({ error: "Record unavailable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { supabase, user, approved } = await getApprovedAdmin();
  if (!supabase || !user || !approved) return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const id = typeof payload?.id === "string" ? payload.id : "";
  if (!id) return NextResponse.json({ error: "A record id is required." }, { status: 400 });
  const { data: deleted, error } = await supabase.from("evangelism_records").delete().eq("id", id).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "The record could not be deleted." }, { status: 500 });
  if (!deleted) return NextResponse.json({ error: "Record unavailable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
