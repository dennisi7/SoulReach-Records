import { recordFields } from "../record-fields";
import type { RecordFormValues } from "../validation";
import { recordsDb } from "./admin";

export type StoredRecord = {
  id: string;
  person_full_name: string;
  decision: string;
  date_reached: string;
  contacted: boolean;
  [key: string]: string | boolean | null;
};

export function recordData(values: Partial<RecordFormValues>) {
  const result: Record<string, string | null> = {};
  for (const [key, column] of recordFields) {
    if (values[key] !== undefined) result[column] = String(values[key] ?? "").trim() || null;
  }
  result.academic_level = values.studentStatus === "Student" ? values.academicLevel || null : null;
  return result;
}

export async function listRecords(): Promise<StoredRecord[]> {
  const snapshot = await recordsDb().collection("evangelism_records").orderBy("date_reached", "desc").get();
  return snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }) as StoredRecord);
}

export async function reserveQuota(hash: string, maximum = 5, namespace = "submission") {
  const windowMs = 10 * 60 * 1000;
  const start = Math.floor(Date.now() / windowMs) * windowMs;
  // Each client reuses one document, bounding storage without a paid TTL service.
  const ref = recordsDb().collection("request_quotas").doc(namespace + "-" + hash);
  return recordsDb().runTransaction(async (transaction) => {
    const previous = (await transaction.get(ref)).data();
    const attempts = previous?.window_start === start ? Number(previous.attempts) : 0;
    if (attempts >= maximum) return Math.max(1, Math.ceil((start + windowMs - Date.now()) / 1000));
    transaction.set(ref, { window_start: start, attempts: attempts + 1 });
    return 0;
  });
}
