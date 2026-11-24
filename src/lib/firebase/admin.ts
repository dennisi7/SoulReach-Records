import "server-only";
import { readFileSync } from "node:fs";
import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function firebaseApp() {
  const existing = getApps().find((app) => app.name === "soulreach");
  if (existing) return existing;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    (process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, "utf8")
      : undefined);
  if (!raw) throw new Error("Firebase server credentials are missing");
  const account = JSON.parse(raw);
  if (account.project_id !== "soulreach-records") throw new Error("Unexpected Firebase project");
  return initializeApp({ credential: cert(account as ServiceAccount), projectId: account.project_id }, "soulreach");
}

export const firebaseAuth = () => getAuth(firebaseApp());
export const recordsDb = () => getFirestore(firebaseApp());
