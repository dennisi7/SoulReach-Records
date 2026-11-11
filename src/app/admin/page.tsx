import { RosaBrand } from "@/components/rosa-brand";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AdminRecords, type AdminRecord } from "@/components/admin-records";
import { recordFields } from "@/lib/record-fields";

export const dynamic = "force-dynamic";

const sampleRecords = [
  { name: "Ama Mensah", decision: "New Convert", date: "10 Nov 2026", location: "North Campus", status: "Not contacted" },
  { name: "Daniel Owusu", decision: "Rededication", date: "09 Nov 2026", location: "Student Centre", status: "Contacted" },
  { name: "Mavis Aidoo", decision: "New Convert", date: "08 Nov 2026", location: "Legon Hall", status: "No preference" },
];

export default async function AdminPage() {
  const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!configured && process.env.NODE_ENV === "production") redirect("/admin/sign-in");
  let records: AdminRecord[] = sampleRecords;
  let loadFailed = false;
  if (configured) {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError?.name === "AuthRetryableFetchError") redirect("/admin/sign-in?error=unavailable");
    if (!user) redirect("/admin/sign-in");
    const { data: admin, error: approvalError } = await supabase.from("approved_admins").select("user_id").eq("user_id", user.id).maybeSingle();
    if (approvalError) redirect("/admin/sign-in?error=unavailable");
    if (!admin) redirect("/admin/sign-in?error=access-denied");
    const { data, error } = await supabase.from("evangelism_records").select("*").order("date_reached", { ascending: false });
    loadFailed = Boolean(error);
    records = (data ?? []).map((record) => ({
      id: record.id,
      name: record.person_full_name,
      decision: record.decision,
      date: record.date_reached,
      location: record.evangelism_location ?? "",
      status: record.preferred_contact_method === "No Contact" ? "Do not contact" : record.contacted ? "Contacted" : "Not contacted",
      phone: record.person_phone,
      studentStatus: record.student_status,
      academicLevel: record.academic_level,
      residence: record.residence,
      hostel: record.hostel,
      church: record.church_denomination,
      baptism: record.baptism_status,
      contactMethod: record.preferred_contact_method,
      remarks: record.remarks,
      evangelist: record.evangelist_full_name,
      evangelistPhone: record.evangelist_phone,
      hallZone: record.hall_zone,
      department: record.department,
      fields: Object.fromEntries(recordFields.map(([key, column]) => [key, record[column] ?? ""])),
    }));
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand-link" aria-label="ROSA UHAS public form"><RosaBrand compact /></Link>
        <nav className="admin-nav" aria-label="Admin navigation"><a className="active" href="#records">Records</a></nav>
        {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
          <form action={async () => {
            "use server";
            const supabase = await createSupabaseServerClient();
            await supabase.auth.signOut({ scope: "local" });
            redirect("/admin/sign-in");
          }}><button className="text-button">Sign out</button></form>}
      </header>
      <section className="admin-content" id="records">
        <div className="admin-heading-row"><div><p className="eyebrow">Admin dashboard</p><h1>Evangelism records</h1><p className="muted">A clear view of every encounter your team has recorded.</p></div></div>
        <div className="stat-strip"><div><span className="stat-label">Total records</span><strong>{records.length}</strong><span className="stat-note">All time</span></div><div><span className="stat-label">New converts</span><strong>{records.filter((record) => record.decision === "New Convert").length}</strong><span className="stat-note">Of all records</span></div><div><span className="stat-label">Rededications</span><strong>{records.filter((record) => record.decision === "Rededication").length}</strong><span className="stat-note">Of all records</span></div></div>
        {loadFailed ? <p role="alert">Records could not be loaded. Refresh to try again.</p> :
          <div className="records-card"><AdminRecords initialRecords={records} /></div>}
      </section>
    </main>
  );
}
