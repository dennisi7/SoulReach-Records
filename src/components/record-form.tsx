"use client";

import { useEffect, useRef, useState } from "react";
import { RosaBrand } from "@/components/rosa-brand";
import { clearFormDraft, readFormDraft, saveFormDraft } from "@/lib/form-draft";
import { recordSchema, type RecordFormValues } from "@/lib/validation";

const initialValues: RecordFormValues = {
  personFullName: "", personPhone: "", studentStatus: "" as never, academicLevel: "", residence: "", hostel: "",
  decision: undefined as never, dateReached: new Date().toISOString().slice(0, 10), churchDenomination: "", baptismStatus: "" as never, preferredContactMethod: "" as never, evangelismLocation: "", remarks: "",
  evangelistFullName: "", evangelistPhone: "", hallZone: "", department: "",
};

const steps = ["Personal", "Evangelism", "Evangelist"];
const fieldsByStep = [
  ["personFullName", "personPhone", "studentStatus", "academicLevel", "residence", "hostel"],
  ["decision", "dateReached", "churchDenomination", "baptismStatus", "preferredContactMethod", "evangelismLocation", "remarks"],
  ["evangelistFullName", "evangelistPhone", "hallZone", "department", "consentConfirmed"],
];

function focusField(key: string) {
  const field = document.getElementById(key);
  if (field instanceof HTMLFieldSetElement) field.querySelector("input")?.focus();
  else field?.focus();
}

function getDraftStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function RecordForm() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<RecordFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"none" | "restored" | "saved" | "unavailable">("none");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const submissionRouteWarmed = useRef(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || step === 0 || submissionRouteWarmed.current) return;
    submissionRouteWarmed.current = true;
    // Compile the route while the user is still filling out the form.
    void fetch("/api/records", { method: "HEAD" }).catch(() => {});
  }, [step]);

  useEffect(() => {
    const storage = getDraftStorage();
    const draft = storage && readFormDraft(storage);
    if (draft) {
      setValues({ ...initialValues, ...draft.values });
      setStep(Math.min(Math.max(draft.step, 0), 2));
      setDraftStatus("restored");
    }
    setDraftReady(true);
  }, []);

  useEffect(() => {
    if (!draftReady || submitted || (step === 0 && values === initialValues)) return;
    const storage = getDraftStorage();
    const saved = storage && saveFormDraft(storage, { step, values });
    setDraftStatus((current) => saved ? (current === "restored" ? current : "saved") : "unavailable");
  }, [draftReady, step, submitted, values]);

  useEffect(() => {
    const target = pendingFocus.current;
    if (target === "heading") heading.current?.focus();
    else if (target) focusField(target);
    pendingFocus.current = null;
  }, [step, errors, submitted]);

  const update = (key: keyof RecordFormValues, value: string | boolean) => {
    setValues((current) => ({ ...current, [key]: value }));
    setDraftStatus((current) => current === "restored" ? "saved" : current);
  };

  const goToStep = (next: number) => {
    pendingFocus.current = "heading";
    setErrors({});
    setSubmitError("");
    setStep(next);
  };

  const validateStep = (all = false) => {
    const result = recordSchema.safeParse(values);
    const issues: Record<string, string> = {};
    if (!result.success) {
      for (const issue of result.error.issues) issues[String(issue.path[0])] ??= issue.message;
    }
    if (values.studentStatus === "Student" && !values.academicLevel) {
      issues.academicLevel ??= "Choose the academic level.";
    }
    if (!consentConfirmed) issues.consentConfirmed = "Confirm consent before submitting.";
    const firstStep = all ? fieldsByStep.findIndex((fields) => fields.some((key) => issues[key])) : step;
    if (firstStep < 0) return true;
    const nextErrors = Object.fromEntries(fieldsByStep[firstStep].filter((key) => issues[key]).map((key) => [key, issues[key]]));
    if (Object.keys(nextErrors).length === 0) return true;
    pendingFocus.current = Object.keys(nextErrors)[0];
    setErrors(nextErrors);
    setStep(firstStep);
    return false;
  };

  const continueStep = () => { if (validateStep()) goToStep(step + 1); };
  const submit = async () => {
    if (submitting || !validateStep(true)) return;
    setErrors({});
    setSubmitting(true);
    setSubmitError("");
    const response = await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, consentConfirmed }) }).catch(() => null);
    if (!response) {
      setSubmitError("Connection lost. Your answers are still here. Try again.");
      setSubmitting(false);
      return;
    }
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setSubmitError(result?.error ?? "The record could not be submitted. Please try again.");
      setSubmitting(false);
      return;
    }
    const storage = getDraftStorage();
    if (storage) clearFormDraft(storage);
    pendingFocus.current = "heading";
    setSubmitted(true);
    setSubmitting(false);
  };

  const reset = () => {
    const storage = getDraftStorage();
    if (storage) clearFormDraft(storage);
    setValues(initialValues);
    setConsentConfirmed(false);
    setSubmitted(false);
    setDraftStatus("none");
    goToStep(0);
  };

  if (submitted) return <SuccessState heading={heading} onReset={reset} />;

  return <main className="form-shell">
    <aside className="identity-panel"><RosaBrand /><div className="identity-copy"><h1>Every encounter<br /><em>matters.</em></h1><p>A thoughtful way to preserve the details of every evangelism encounter for Royalhouse Chapel.</p></div><div className="identity-footer"><span className="gold-rule" /> <span>For the work that continues after the conversation.</span></div></aside>
    <section className="form-area">
      <header className="form-top">
        <span className="secure-note"><span className="lock" aria-hidden="true">⌁</span> Secure record</span>
      </header>
      <div className="form-content"><div className="progress" aria-label={`Step ${step + 1} of 3`}><div className="progress-head"><span>Step {String(step + 1).padStart(2, "0")} of 03</span><strong>{steps[step]}</strong></div><div className="progress-bar">{steps.map((item, index) => <span className={index <= step ? "filled" : ""} key={item} />)}</div></div><div className="form-heading"><p className="eyebrow">Record an encounter</p><h2 ref={heading} tabIndex={-1}>{step === 0 ? "Who did you meet?" : step === 1 ? "Tell us about the encounter." : "Who is making this record?"}</h2><p className="muted">{step === 0 ? "Start with a few details about the person you reached." : step === 1 ? "Capture the moment while it is still fresh." : "These details help your team follow up well."}</p><p className="required-note"><span aria-hidden="true">*</span> Required field</p>{step === 0 && <p className="draft-note">Drafts can contain personal information. Clear the draft on a shared device.</p>}{draftStatus !== "none" && <p className="draft-note" role="status">{draftStatus === "restored" ? "Draft restored from this device." : draftStatus === "saved" ? "Answers saved on this device." : "Draft could not be saved. Keep this page open."} <button className="draft-clear" type="button" onClick={reset} disabled={submitting}>Clear saved draft</button></p>}</div>{Object.keys(errors).length > 0 && <div className="error-summary" role="alert"><strong>There is a problem</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={`#${key}`} onClick={(event) => { event.preventDefault(); focusField(key); }}>{message}</a></li>)}</ul></div>}{step === 0 && <PersonalStep values={values} errors={errors} update={update} />}{step === 1 && <EvangelismStep values={values} errors={errors} update={update} />}{step === 2 && <EvangelistStep values={values} errors={errors} update={update} />}
      {step === 2 && (
        <div className="consent-confirmation">
          <label className="consent">
            <input id="consentConfirmed" type="checkbox" required checked={consentConfirmed}
              onChange={(event) => setConsentConfirmed(event.target.checked)}
              aria-invalid={Boolean(errors.consentConfirmed)} aria-describedby={errors.consentConfirmed ? "consent-error" : undefined} />
            <span>I confirm the person agreed to have these details recorded and used for follow-up according to their preference. <b className="required-mark" aria-hidden="true">*</b></span>
          </label>
          {errors.consentConfirmed && <small id="consent-error" className="inline-error">{errors.consentConfirmed}</small>}
        </div>
      )}
      {submitError && <div className="error-summary" role="alert">{submitError}</div>}<div className="form-actions">{step > 0 && <button className="button button-secondary back-button" onClick={() => goToStep(step - 1)} disabled={submitting} type="button">← Back</button>}{step < 2 ? <button className="button button-primary button-next" onClick={continueStep} type="button">Continue <span aria-hidden="true">→</span></button> : <button className="button button-primary button-next" onClick={submit} disabled={submitting} type="button">{submitting ? "Submitting…" : "Submit record"} <span aria-hidden="true">→</span></button>}</div><p className="form-footnote">Your information is kept private and only shared with approved ministry administrators.</p></div></section>
  </main>;
}

function Field({ label, name, value, onChange, error, type = "text", placeholder, required = false }: { label: string; name: string; value?: string; onChange: (value: string) => void; error?: string; type?: string; placeholder?: string; required?: boolean }) {
  const errorId = `${name}-error`;
  return <label className={`field ${error ? "has-error" : ""}`} htmlFor={name}><span>{label}{required && <b className="required-mark" aria-hidden="true">*</b>}</span><input id={name} name={name} type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} required={required} />{error && <small id={errorId}>{error}</small>}</label>;
}
function SelectField({ label, name, value, onChange, children, error, required = false }: { label: string; name: string; value?: string; onChange: (value: string) => void; children: React.ReactNode; error?: string; required?: boolean }) {
  const errorId = `${name}-error`;
  return <label className={`field ${error ? "has-error" : ""}`} htmlFor={name}><span>{label}{required && <b className="required-mark" aria-hidden="true">*</b>}</span><select id={name} name={name} value={value ?? ""} onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? errorId : undefined} required={required}><option value="">Select an option</option>{children}</select>{error && <small id={errorId}>{error}</small>}</label>;
}
function PersonalStep({ values, errors, update }: { values: RecordFormValues; errors: Record<string, string>; update: (key: keyof RecordFormValues, value: string | boolean) => void }) { return <div className="fields"><Field label="Full name" name="personFullName" value={values.personFullName} onChange={(value) => update("personFullName", value)} error={errors.personFullName} placeholder="Enter full name" required /><Field label="Phone or WhatsApp number" name="personPhone" type="tel" value={values.personPhone} onChange={(value) => update("personPhone", value)} error={errors.personPhone} placeholder="e.g. 024 123 4567" required /><SelectField label="Student status" name="studentStatus" value={values.studentStatus} onChange={(value) => update("studentStatus", value)} error={errors.studentStatus} required><option>Student</option><option>Non-student</option></SelectField>{values.studentStatus === "Student" && <SelectField label="Academic level" name="academicLevel" value={values.academicLevel} onChange={(value) => update("academicLevel", value)} error={errors.academicLevel} required><option>100</option><option>200</option><option>300</option><option>400</option><option>500+</option><option>Other</option></SelectField>}<div className="field-row"><Field label="Area or residence" name="residence" value={values.residence} onChange={(value) => update("residence", value)} error={errors.residence} placeholder="e.g. Ho, near Trafalgar" required /><Field label="Hostel" name="hostel" error={errors.hostel} value={values.hostel} onChange={(value) => update("hostel", value)} placeholder="e.g. Trafalgar, Dave, or Berrock" /></div></div>; }
function EvangelismStep({ values, errors, update }: { values: RecordFormValues; errors: Record<string, string>; update: (key: keyof RecordFormValues, value: string | boolean) => void }) { return <div className="fields"><fieldset id="decision" className={`choice-group ${errors.decision ? "has-error" : ""}`} aria-invalid={Boolean(errors.decision)} aria-describedby={errors.decision ? "decision-error" : undefined}><legend>Decision made <b className="required-mark" aria-hidden="true">*</b></legend><div className="choice-row">{["New Convert", "Rededication"].map((choice) => <label className={`choice ${values.decision === choice ? "selected" : ""}`} key={choice}><input type="radio" required name="decision" value={choice} checked={values.decision === choice} onChange={() => update("decision", choice)} /><span>{choice}</span></label>)}</div>{errors.decision && <small id="decision-error" className="inline-error">{errors.decision}</small>}</fieldset><Field label="Date reached" name="dateReached" type="date" value={values.dateReached} onChange={(value) => update("dateReached", value)} error={errors.dateReached} required /><div className="field-row"><Field label="Church or denomination" name="churchDenomination" error={errors.churchDenomination} value={values.churchDenomination} onChange={(value) => update("churchDenomination", value)} placeholder="e.g. Royal House Chapel" /><SelectField label="Baptism status" name="baptismStatus" value={values.baptismStatus} onChange={(value) => update("baptismStatus", value)} error={errors.baptismStatus} required><option>Yes</option><option>No</option><option>Unknown / not disclosed</option></SelectField></div><SelectField label="Preferred contact method" name="preferredContactMethod" value={values.preferredContactMethod} onChange={(value) => update("preferredContactMethod", value)} error={errors.preferredContactMethod} required><option>Phone call</option><option>WhatsApp</option><option>SMS</option><option>No Contact</option></SelectField><Field label="Location of evangelism" name="evangelismLocation" error={errors.evangelismLocation} value={values.evangelismLocation} onChange={(value) => update("evangelismLocation", value)} placeholder="e.g. Jim Fugar Main Campus" /><label className="field"><span>Additional remarks</span><textarea id="remarks" aria-invalid={Boolean(errors.remarks)} aria-describedby={errors.remarks ? "remarks-error" : undefined} name="remarks" value={values.remarks} maxLength={250} onChange={(event) => update("remarks", event.target.value)} placeholder="Keep notes relevant and concise." />{errors.remarks && <small id="remarks-error">{errors.remarks}</small>}<small className="character-count">{values.remarks?.length ?? 0} / 250</small></label></div>; }
function EvangelistStep({ values, errors, update }: { values: RecordFormValues; errors: Record<string, string>; update: (key: keyof RecordFormValues, value: string | boolean) => void }) { return <div className="fields"><Field label="Your full name" name="evangelistFullName" value={values.evangelistFullName} onChange={(value) => update("evangelistFullName", value)} error={errors.evangelistFullName} placeholder="Enter full name" required /><Field label="Your phone or WhatsApp number" name="evangelistPhone" type="tel" value={values.evangelistPhone} onChange={(value) => update("evangelistPhone", value)} error={errors.evangelistPhone} placeholder="e.g. 024 123 4567" required /><div className="field-row"><Field label="Hall or zone" name="hallZone" value={values.hallZone} onChange={(value) => update("hallZone", value)} error={errors.hallZone} placeholder="e.g. Trafalgar, Dave, or Berrock" required /><Field label="Department or ministry" name="department" value={values.department} onChange={(value) => update("department", value)} error={errors.department} placeholder="e.g. ROSA, Nursing, or Music" required /></div><div className="review-card"><div><p className="eyebrow">Before you submit</p><h3>Check the record is accurate.</h3><p>Consent is confirmed before this form is sent. Please make sure the contact details and encounter notes are correct.</p></div></div></div>; }
function SuccessState({ heading, onReset }: { heading: React.Ref<HTMLHeadingElement>; onReset: () => void }) { return <main className="success-shell"><div className="success-mark">✓</div><p className="eyebrow">Record submitted</p><h1 ref={heading} tabIndex={-1}>Thank you for<br /><em>keeping the story.</em></h1><p className="success-copy">The encounter has been recorded securely. Your team can now see it and follow up according to the person’s preference.</p><button className="button button-primary" onClick={onReset} type="button">Record another encounter <span aria-hidden="true">→</span></button></main>; }
