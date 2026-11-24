import { RosaBrand } from "@/components/rosa-brand";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getApprovedAdmin, SESSION_COOKIE } from "@/lib/firebase/authorization";
import { listRecords } from "@/lib/firebase/records";
import { AdminRecords, type AdminRecord } from "@/components/admin-records";
import { recordFields } from "@/lib/record-fields";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let access;
  try {
    access = await getApprovedAdmin();
  } catch {
    redirect("/admin/sign-in?error=unavailable");
  }
  if (!access.user) redirect("/admin/sign-in");
  if (!access.approved) redirect("/admin/sign-in?error=access-denied");
  let records: AdminRecord[] = [];
  let loadFailed = false;
  try {
    records = (await listRecords()).map((record) => ({
      id: record.id,
      name: record.person_full_name,
      decision: record.decision,
      date: record.date_reached,
      location: String(record.evangelism_location ?? ""),
      status: record.preferred_contact_method === "No Contact" ? "Do not contact" : record.contacted ? "Contacted" : "Not contacted",
      phone: String(record.person_phone ?? ""),
      studentStatus: String(record.student_status ?? ""),
      academicLevel: String(record.academic_level ?? ""),
      residence: String(record.residence ?? ""),
      hostel: String(record.hostel ?? ""),
      church: String(record.church_denomination ?? ""),
      baptism: String(record.baptism_status ?? ""),
      contactMethod: String(record.preferred_contact_method ?? ""),
      evangelist: String(record.evangelist_full_name ?? ""),
      fields: Object.fromEntries(recordFields.map(([key, column]) => [key, String(record[column] ?? "")])),
    }));
  } catch {
    loadFailed = true;
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <Link href="/" className="admin-brand-link" aria-label="ROSA UHAS public form"><RosaBrand compact /></Link>
        <nav className="admin-nav" aria-label="Admin navigation"><a className="active" href="#records">Records</a></nav>
        <form action={async () => {
            "use server";
            (await cookies()).delete(SESSION_COOKIE);
            redirect("/admin/sign-in");
          }}><button className="text-button">Sign out</button></form>
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
