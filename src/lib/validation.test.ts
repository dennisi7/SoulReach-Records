import { describe, expect, it } from "vitest";
import { adminRecordSchema, recordSchema } from "./validation";

describe("recordSchema", () => {
  it("requires the important contact and context fields", () => {
    const result = recordSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.path.join("."))).toEqual(
        expect.arrayContaining([
          "personFullName",
          "personPhone",
          "studentStatus",
          "residence",
          "decision",
          "dateReached",
          "baptismStatus",
          "preferredContactMethod",
          "evangelistFullName",
        ]),
      );
    }
  });

  it.each([
    ["Dave", true],
    ["", true],
    ["Jim Fugar Main Campus", false],
  ])("validates the shorter form with area %j", (area, valid) => {
    const result = recordSchema.safeParse({
      personFullName: "Ama Mensah",
      personPhone: "024 123 4567",
      studentStatus: "Student",
      academicLevel: "200",
      residence: "Trafalgar",
      hostel: "",
      decision: "New Convert",
      dateReached: "2026-11-10",
      churchDenomination: "Royal House Chapel",
      baptismStatus: "Unknown / not disclosed",
      preferredContactMethod: "No Contact",
      evangelismLocation: area,
      evangelistFullName: "Kojo Agyeman",
    });

    expect(result.success).toBe(valid);
  });

  it("uses actionable messages when required text fields are missing", () => {
    const result = recordSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
      expect(messages.personFullName).toBe("Enter the person’s full name.");
      expect(messages.personPhone).toBe("Enter the person’s phone or WhatsApp number.");
      expect(messages.residence).toBe("Choose the person’s area or residence.");
      expect(messages.evangelistFullName).toBe("Enter your full name.");
    }
  });

  it("requires a listed residence for submissions and lets admin edits keep a previous residence", () => {
    const record = {
      personFullName: "Ama Mensah",
      personPhone: "024 123 4567",
      studentStatus: "Non-student",
      decision: "New Convert",
      dateReached: "2026-11-10",
      baptismStatus: "Unknown / not disclosed",
      preferredContactMethod: "WhatsApp",
      evangelistFullName: "Kojo Agyeman",
    };

    expect(recordSchema.safeParse(record).success).toBe(false);
    expect(recordSchema.safeParse({ ...record, residence: "Old free-text residence" }).success).toBe(false);
    expect(recordSchema.safeParse({ ...record, residence: "Godokpe" }).success).toBe(true);
    expect(adminRecordSchema.parse(record)).not.toHaveProperty("residence");
    expect(adminRecordSchema.safeParse({ ...record, residence: "" }).success).toBe(false);
  });

  it("requires academic level only for students", () => {
    const result = recordSchema.safeParse({
      personFullName: "Ama Mensah",
      personPhone: "024 123 4567",
      studentStatus: "Student",
      residence: "Trafalgar",
      decision: "New Convert",
      dateReached: "2026-11-10",
      baptismStatus: "Unknown / not disclosed",
      preferredContactMethod: "No Contact",
      evangelistFullName: "Kojo Agyeman",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "academicLevel")).toBe(true);
    }
  });
});
