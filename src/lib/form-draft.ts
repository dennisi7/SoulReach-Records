import type { RecordFormValues } from "./validation";

export const FORM_DRAFT_KEY = "rosa-evangelism-record-draft";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type FormDraft = {
  savedAt: number;
  step: number;
  values: RecordFormValues;
};

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function readFormDraft(storage: DraftStorage, now = Date.now()): FormDraft | null {
  try {
    const raw = storage.getItem(FORM_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<FormDraft>;
    if (typeof draft.savedAt !== "number" || now - draft.savedAt > DRAFT_MAX_AGE_MS || !Number.isInteger(draft.step) || !draft.values) {
      clearFormDraft(storage);
      return null;
    }
    return draft as FormDraft;
  } catch {
    return null;
  }
}

export function saveFormDraft(storage: Pick<DraftStorage, "setItem">, draft: Omit<FormDraft, "savedAt">, now = Date.now()) {
  try {
    storage.setItem(FORM_DRAFT_KEY, JSON.stringify({ ...draft, savedAt: now } satisfies FormDraft));
    return true;
  } catch {
    return false;
  }
}

export function clearFormDraft(storage: Pick<DraftStorage, "removeItem">) {
  try {
    storage.removeItem(FORM_DRAFT_KEY);
  } catch {
    // Clearing a draft is best effort.
  }
}
