import { z } from "zod";
import { evangelismAreas } from "./record-fields";

const optionalText = z.string().trim().max(250).optional().or(z.literal(""));
const requiredText = (message: string) => z.preprocess((value) => value ?? "", z.string().trim().min(1, message).max(250));
const residenceArea = z.string({ error: "Choose the person’s area or residence." })
  .refine((value) => evangelismAreas.some((area) => area === value), "Choose the person’s area or residence.");

// Admin edits can omit a field to keep the residence already stored on the record.
export const adminRecordSchema = z
  .object({
    personFullName: z.preprocess((value) => value ?? "", z.string().trim().min(2, "Enter the person’s full name.").max(250)),
    personPhone: requiredText("Enter the person’s phone or WhatsApp number."),
    studentStatus: z.enum(["Student", "Non-student"], { message: "Choose the student status." }),
    academicLevel: optionalText,
    residence: residenceArea.optional(),
    hostel: optionalText,
    decision: z.enum(["New Convert", "Rededication"], { message: "Choose a decision." }),
    dateReached: z.iso.date({ message: "Enter a valid date reached." }),
    churchDenomination: optionalText,
    baptismStatus: z.enum(["Yes", "No", "Unknown / not disclosed"], { message: "Choose a baptism status." }),
    preferredContactMethod: z.enum(["Phone call", "WhatsApp", "SMS", "No Contact"], { message: "Choose a preferred contact method." }),
    evangelismLocation: z.enum([...evangelismAreas, ""], { message: "Choose an area from the list." }).optional(),
    evangelistFullName: z.preprocess((value) => value ?? "", z.string().trim().min(2, "Enter your full name.").max(250)),
  })
  .superRefine((data, context) => {
    if (data.studentStatus === "Student" && !data.academicLevel) {
      context.addIssue({
        code: "custom",
        path: ["academicLevel"],
        message: "Choose the academic level.",
      });
    }
  });

export const recordSchema = adminRecordSchema.safeExtend({ residence: residenceArea });

export type RecordFormValues = z.infer<typeof recordSchema>;
