"use client";

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { recordFields } from "@/lib/record-fields";
import { useRouter } from "next/navigation";

export type AdminRecord = {
  fields?: Record<string, string>;
  id?: string;
  name: string;
  decision: string;
  date: string;
  location: string;
  status: string;
  phone?: string;
  studentStatus?: string;
  academicLevel?: string;
  residence?: string;
  hostel?: string;
  church?: string;
  baptism?: string;
  contactMethod?: string;
  remarks?: string;
  evangelist?: string;
  evangelistPhone?: string;
  hallZone?: string;
  department?: string;
};

export function AdminRecords({ initialRecords }: { initialRecords: AdminRecord[] }) {
  const router = useRouter();
  const records = initialRecords;
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [search, setSearch] = useState("");
  const [decision, setDecision] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<AdminRecord | null>(null);
  const [contactBusy, setContactBusy] = useState(false);
  const [contactFeedback, setContactFeedback] = useState<{ error: boolean; text: string } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const drawerOpen = selected !== null;

  useEffect(() => {
    if (!drawerOpen) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [drawerOpen]);

  function openDetails(record: AdminRecord) {
    setActionError("");
    setConfirmDelete(false);
    setContactFeedback(null);
    setSelected(record);
  }

  function closeDetails() {
    dialogRef.current?.close();
    setSelected(null);
  }
  const filtered = useMemo(() => records.filter((record) => {
    const matchesSearch = `${record.name} ${record.location}`.toLowerCase().includes(search.toLowerCase());
    const matchesDecision = decision === "all" || record.decision === decision;
    const matchesStatus = status === "all" || record.status === status;
    return matchesSearch && matchesDecision && matchesStatus;
  }), [decision, records, search, status]);

  function exportCsv() {
    const rows = ["Name,Decision,Date reached,Location,Follow-up", ...filtered.map((record) =>
      [record.name, record.decision, record.date, record.location, record.status].map((value) => {
        const safeValue = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/u.test(value) ? "'" + value : value;
        return '"' + safeValue.replaceAll('"', '""') + '"';
      }).join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "evangelism-records.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function toggleContact(record: AdminRecord) {
    if (!record.id || record.status === "Do not contact" || contactBusy || busy) return;
    setContactBusy(true);
    setContactFeedback(null);
    const contacted = record.status !== "Contacted";
    try {
      const response = await fetch("/api/admin/records", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: record.id, action: "contacted", contacted }),
      });
      if (!response.ok) throw new Error("Follow-up update failed");
      setSelected((current) => current?.id === record.id && current
        ? { ...current, status: contacted ? "Contacted" : "Not contacted" }
        : current);
      setContactFeedback({ error: false, text: contacted ? "Marked as contacted." : "Marked as not contacted." });
      router.refresh();
    } catch {
      setContactFeedback({ error: true, text: "Could not update follow-up. Try again." });
    } finally {
      setContactBusy(false);
    }
  }

  async function changeRecord(method: "PATCH" | "DELETE", body: object) {
    if (busy || contactBusy) return;
    setBusy(true);
    setActionError("");
    try {
      const response = await fetch("/api/admin/records", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setActionError(result?.fields ? Object.values(result.fields).flat().join(" ") : result?.error ?? "The change could not be saved.");
        return;
      }
      setConfirmDelete(false);
      closeDetails();
      router.refresh();
    } catch {
      setActionError("Connection lost. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="records-toolbar"><label className="search-field"><span aria-hidden="true">⌕</span><input placeholder="Search by name or location" aria-label="Search records" value={search} onChange={(event) => setSearch(event.target.value)} /></label><FilterMenu label="Decision" value={decision} onChange={setDecision} options={[{ value: "all", label: "All decisions" }, { value: "New Convert", label: "New Convert" }, { value: "Rededication", label: "Rededication" }]} /><FilterMenu label="Follow-up" value={status} onChange={setStatus} options={[{ value: "all", label: "All follow-up" }, { value: "Contacted", label: "Contacted" }, { value: "Not contacted", label: "Not contacted" }, { value: "Do not contact", label: "Do not contact" }]} /><button className="toolbar-export" type="button" onClick={exportCsv} disabled={filtered.length === 0}>Export filtered CSV</button></div>
    <div className="result-line"><span>{filtered.length} record{filtered.length === 1 ? "" : "s"}</span>{(search || decision !== "all" || status !== "all") && <button type="button" onClick={() => { setSearch(""); setDecision("all"); setStatus("all"); }}>Clear filters</button>}</div>
    <div className="table-wrap"><table><thead><tr><th>Name</th><th>Decision</th><th>Date reached</th><th>Location</th><th>Follow-up</th><th><span className="sr-only">Action</span></th></tr></thead><tbody>{filtered.map((record) => <tr key={`${record.name}-${record.date}-${record.id ?? "preview"}`}><td><button className="name-button" type="button" onClick={() => openDetails(record)}><strong>{record.name}</strong><span className="mobile-meta">{record.location}</span></button></td><td><span className={`decision decision-${record.decision === "New Convert" ? "new" : "rededication"}`}>{record.decision}</span></td><td>{record.date}</td><td>{record.location}</td><td><span className="status-dot" />{record.status}</td><td><button className="row-action" type="button" onClick={() => openDetails(record)}>View details <span aria-hidden="true">→</span></button></td></tr>)}</tbody></table></div>
    {filtered.length === 0 && (
      <div className="empty-note" role="status">
        <span className="empty-icon" aria-hidden="true">⌕</span>
        <div>
          <strong>{records.length ? "No records match these filters." : "No records yet."}</strong>
          <p>{records.length ? "Try another search or clear the filters." : "Submitted encounters will appear here."}</p>
        </div>
      </div>
    )}
    {selected && <dialog ref={dialogRef} className="detail-dialog" aria-labelledby="detail-title"
      onCancel={(event) => { event.preventDefault(); closeDetails(); }}
      onClick={(event) => { if (event.target === event.currentTarget) closeDetails(); }}>
      <aside className="detail-panel"><div className="detail-header"><button className="back-button" type="button" onClick={closeDetails}>← Back to records</button><button className="close-button" type="button" aria-label="Close details" onClick={closeDetails}>×</button></div><p className="eyebrow">Record details</p><h2 id="detail-title">{selected.name}</h2><div className="detail-meta"><span className={`decision decision-${selected.decision === "New Convert" ? "new" : "rededication"}`}>{selected.decision}</span><span>{selected.date}</span></div><section className="detail-section"><h3>Personal</h3><DetailRow label="Phone" value={selected.phone} /><DetailRow label="Student status" value={selected.studentStatus} /><DetailRow label="Academic level" value={selected.academicLevel} /><DetailRow label="Residence" value={selected.residence} /><DetailRow label="Hostel" value={selected.hostel} /></section><section className="detail-section"><h3>Evangelism</h3><DetailRow label="Church or denomination" value={selected.church} /><DetailRow label="Baptism" value={selected.baptism} /><DetailRow label="Preferred contact" value={selected.contactMethod} /><DetailRow label="Location" value={selected.location} /><DetailRow label="Remarks" value={selected.remarks} /></section><section className="detail-section"><h3>Evangelist</h3><DetailRow label="Full name" value={selected.evangelist} /><DetailRow label="Phone" value={selected.evangelistPhone} /><DetailRow label="Hall or zone" value={selected.hallZone} /><DetailRow label="Department" value={selected.department} /></section><button className="button button-primary contact-button" type="button" disabled={!selected.id || selected.status === "Do not contact" || contactBusy || busy} onClick={() => toggleContact(selected)}>{contactBusy ? "Saving…" : selected.status === "Contacted" ? "Mark as not contacted" : "Mark as contacted"}</button>
      {contactFeedback && <p className={contactFeedback.error ? "inline-error" : "muted"} role={contactFeedback.error ? "alert" : "status"}>{contactFeedback.text}</p>}
      {selected.id && selected.fields && (
      <section className="detail-section" key={selected.id}>
        <details>
          <summary>Edit record</summary>
          <form className="fields" onSubmit={(event) => {
            event.preventDefault();
            const record = Object.fromEntries(new FormData(event.currentTarget));
            void changeRecord("PATCH", { id: selected.id, record });
          }}>
            {recordFields.map(([key, , label, options]) => (
              <label className="field" key={key}>
                <span>{label}</span>
                {options ? (
                  <select name={key} defaultValue={selected.fields?.[key]} required={key === "decision"}>
                    <option value="">Select an option</option>
                    {options.map((value) => <option key={value}>{value}</option>)}
                  </select>
                ) : key === "remarks" ? (
                  <textarea name={key} defaultValue={selected.fields?.[key]} maxLength={250} />
                ) : (
                  <input name={key} defaultValue={selected.fields?.[key]} type={key === "dateReached" ? "date" : "text"}
                    required={["dateReached", "personFullName", "evangelistFullName"].includes(key)} />
                )}
              </label>
            ))}
            <button className="button button-primary" disabled={busy || contactBusy}>Save changes</button>
          </form>
        </details>
        {confirmDelete ? (
          <div role="group" aria-label="Confirm deletion">
            <p>Permanently delete the record for {selected.name}?</p>
            <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>{" "}
            <button type="button" disabled={busy || contactBusy} onClick={() => void changeRecord("DELETE", { id: selected.id })}>Confirm deletion</button>
          </div>
        ) : <button className="back-button" type="button" onClick={() => setConfirmDelete(true)}>Delete record</button>}
        {actionError && <p role="alert">{actionError}</p>}
      </section>
    )}</aside></dialog>}
  </>;
}

function FilterMenu({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));

  useEffect(() => {
    if (!open) return;
    wrapperRef.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]')?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function handleKey(event: KeyboardEvent<HTMLDivElement>) {
    const { key } = event;
    if (open && key === "Escape") {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      return;
    }
    const items = Array.from(wrapperRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]') ?? []);
    const current = items.findIndex((item) => item === document.activeElement);
    const next = key === "Home" ? 0 : key === "End" ? items.length - 1
      : (current + (key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  }

  return (
    <div className="filter-menu" ref={wrapperRef} onKeyDown={handleKey}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button ref={triggerRef} className={`filter-trigger ${value !== "all" ? "active" : ""}`} type="button"
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="filter-trigger-label">{label}</span>
        <span className="filter-trigger-value">{options[selectedIndex].label}</span>
        <span className="filter-chevron" aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="filter-menu-panel" role="listbox" aria-label={`${label} filter`}>
          {options.map((option) => (
            <button key={option.value} className="filter-option" type="button" role="option" tabIndex={-1}
              aria-selected={option.value === value} onClick={() => {
                onChange(option.value);
                setOpen(false);
                triggerRef.current?.focus();
              }}>
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) { return <div className="detail-row"><dt>{label}</dt><dd>{value || "Not provided"}</dd></div>; }
