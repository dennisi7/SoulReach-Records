"use client";

import { type FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { RosaBrand } from "@/components/rosa-brand";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminSignInPage() {
  return <Suspense fallback={<main className="auth-shell" />}><SignInForm /></Suspense>;
}

function SignInForm() {
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const accessError = params.get("error") === "access-denied"
    ? "This account does not have admin access. Ask the ROSA UHAS team to approve your account."
    : params.get("error") === "unavailable"
      ? "The admin workspace could not verify your access. Try signing in again in a moment."
      : "";
  const [loading, setLoading] = useState(false);

  // Render credential fields after hydration so autofill extensions cannot
  // modify server-rendered inputs before React attaches to them.
  useEffect(() => setReady(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setError("Admin sign-in requires Supabase configuration.");
      return;
    }
    const fields = new FormData(event.currentTarget);
    const email = String(fields.get("email") ?? "").trim();
    const password = String(fields.get("password") ?? "");
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (!result.error) {
        window.location.replace("/admin");
        return;
      }
      if (result.error.code === "invalid_credentials") {
        setError("That email and password did not match. Check both and try again.");
      } else if (result.error.code === "email_not_confirmed") {
        setError("Confirm your email address using the message from Supabase, then try again.");
      } else if (result.error.status === 429) {
        setError("Too many sign-in attempts. Wait a moment before trying again.");
      } else {
        setError("Sign-in is temporarily unavailable. Check your connection and try again.");
      }
    } catch {
      setError("Sign-in is temporarily unavailable. Try again.");
    }
    setLoading(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <RosaBrand />
        <div className="auth-copy">
          <p className="eyebrow">Private workspace</p>
          <h1>Welcome back.</h1>
          <p className="muted">Sign in to view and manage evangelism records.</p>
        </div>
        {ready ? (
          <form onSubmit={submit} method="post" className="fields">
            <label className="field">
              <span>Email address</span>
              <input name="email" spellCheck={false} type="email" autoComplete="email" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input name="password" type="password" autoComplete="current-password" required />
            </label>
            {!loading && (error || accessError) && <div className="error-summary" role="alert">{error || accessError}</div>}
            <button className="button button-primary" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span>
            </button>
          </form>
        ) : <p className="muted" role="status">Loading sign-in…</p>}
        <Link href="/" className="back-button">← Return to the public form</Link>
      </div>
    </main>
  );
}
