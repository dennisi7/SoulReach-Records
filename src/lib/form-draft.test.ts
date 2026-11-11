import { describe, expect, it } from "vitest";
import { clearFormDraft, FORM_DRAFT_KEY, readFormDraft, saveFormDraft } from "./form-draft";

function storage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  };
}

describe("form draft storage", () => {
  it("round trips a draft and records its save time", () => {
    const browserStorage = storage();
    const values = { personFullName: "Ama Mensah" } as never;

    saveFormDraft(browserStorage, { step: 1, values }, 1_000);

    expect(readFormDraft(browserStorage, 2_000)).toEqual({ savedAt: 1_000, step: 1, values });
  });

  it("removes drafts older than one day", () => {
    const browserStorage = storage();
    saveFormDraft(browserStorage, { step: 0, values: {} as never }, 1_000);

    expect(readFormDraft(browserStorage, 1_000 + 24 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(browserStorage.getItem(FORM_DRAFT_KEY)).toBeNull();
  });

  it("reports a failed write when storage is unavailable", () => {
    const unavailable = { setItem() { throw new Error("Storage unavailable"); } };
    expect(saveFormDraft(unavailable, { step: 0, values: {} as never })).toBe(false);
  });

  it("clears the saved draft", () => {
    const browserStorage = storage();
    browserStorage.setItem(FORM_DRAFT_KEY, "saved");

    clearFormDraft(browserStorage);

    expect(browserStorage.getItem(FORM_DRAFT_KEY)).toBeNull();
  });
});
