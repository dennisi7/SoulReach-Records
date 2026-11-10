import { describe, expect, it } from "vitest";
import { recordSchema } from "./validation";

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
          "evangelistPhone",
          "hallZone",
          "department",
        ]),
      );
    }
  });

  it("accepts unknown baptism status, no contact, and an empty optional hostel", () => {
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
      evangelismLocation: "Jim Fugar Main Campus",
      evangelistFullName: "Kojo Agyeman",
      evangelistPhone: "020 987 6543",
      hallZone: "Dave",
      department: "ROSA",
    });

    expect(result.success).toBe(true);
  });

  it("uses actionable messages when required text fields are missing", () => {
    const result = recordSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]));
      expect(messages.personFullName).toBe("Enter the person’s full name.");
      expect(messages.personPhone).toBe("Enter the person’s phone or WhatsApp number.");
      expect(messages.residence).toBe("Enter the person’s area or residence.");
      expect(messages.evangelistFullName).toBe("Enter the evangelist’s full name.");
      expect(messages.evangelistPhone).toBe("Enter your phone or WhatsApp number.");
      expect(messages.hallZone).toBe("Enter your hall or zone.");
      expect(messages.department).toBe("Enter your department or ministry.");
    }
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
      evangelistPhone: "020 987 6543",
      hallZone: "Dave",
      department: "ROSA",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "academicLevel")).toBe(true);
    }
  });
});
