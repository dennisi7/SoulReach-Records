"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { RosaBrand } from "@/components/rosa-brand";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminSignInPage() {
  return <Suspense fallback={<main className="auth-shell" />}><SignInForm /></Suspense>;
}

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(params.get("error") === "access-denied" ? "This account is not approved to view records." : "");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
      setError("Admin sign-in requires Supabase configuration.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) {
        setError("That email and password combination could not be signed in.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Sign-in is temporarily unavailable. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell"><div className="auth-card"><RosaBrand /><div className="auth-copy"><p className="eyebrow">Private workspace</p><h1>Welcome back.</h1><p className="muted">Sign in to view and manage evangelism records.</p></div><form onSubmit={submit} className="fields"><label className="field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></label><label className="field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required /></label>{error && <div className="error-summary" role="alert">{error}</div>}<button className="button button-primary" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span></button></form><Link href="/" className="back-button">← Return to the public form</Link></div></main>;
}
