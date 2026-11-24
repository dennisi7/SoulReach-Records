import { cookies } from "next/headers";
import { firebaseAuth, recordsDb } from "./admin";

export const SESSION_COOKIE = "__session";

export async function getApprovedAdmin() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!session) return { user: null, approved: false };
  try {
    const user = await firebaseAuth().verifySessionCookie(session, true);
    const admin = await recordsDb().collection("approved_admins").doc(user.uid).get();
    return { user, approved: admin.exists && admin.data()?.enabled === true };
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code && ["auth/session-cookie-expired", "auth/session-cookie-revoked", "auth/invalid-session-cookie",
      "auth/argument-error", "auth/user-disabled", "auth/user-not-found"].includes(code)) {
      return { user: null, approved: false };
    }
    throw error;
  }
}
