import { NextRequest, NextResponse } from "next/server";
import { firebaseAuth, recordsDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE } from "@/lib/firebase/authorization";
import { reserveQuota } from "@/lib/firebase/records";
import { submissionClientHash } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/same-origin";

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request.headers)) {
    return NextResponse.json({ error: "Reload the sign-in page and try again." }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !password || password.length > 4096) {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  try {
    const key = process.env.FIREBASE_API_KEY;
    const quotaSecret = process.env.SUBMISSION_HASH_SECRET;
    if (!key || !quotaSecret) throw new Error("Missing authentication settings");
    const retry = await reserveQuota(submissionClientHash(request.headers, quotaSecret), 10, "login");
    if (retry) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(retry) } });
    const result = await fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(key), {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      signal: AbortSignal.timeout(15000),
    });
    const login = await result.json();
    if (!result.ok || !login.idToken) {
      return NextResponse.json({ error: "That email and password did not match. Check both and try again." }, { status: 401 });
    }
    const admin = await recordsDb().collection("approved_admins").doc(login.localId).get();
    if (!admin.exists || admin.data()?.enabled !== true) {
      return NextResponse.json({ error: "This account does not have approved admin access." }, { status: 403 });
    }
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const session = await firebaseAuth().createSessionCookie(login.idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, session, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: expiresIn / 1000,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Try again." }, { status: 503 });
  }
}
