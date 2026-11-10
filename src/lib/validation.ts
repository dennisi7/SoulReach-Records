import { z } from "zod";

const optionalText = z.string().trim().max(250).optional().or(z.literal(""));
const requiredText = (message: string) => z.preprocess((value) => value ?? "", z.string().trim().min(1, message).max(250));

export const recordSchema = z
  .object({
    personFullName: z.preprocess((value) => value ?? "", z.string().trim().min(2, "Enter the person’s full name.").max(250)),
    personPhone: requiredText("Enter the person’s phone or WhatsApp number."),
    studentStatus: z.enum(["Student", "Non-student"], { message: "Choose the student status." }),
    academicLevel: optionalText,
    residence: requiredText("Enter the person’s area or residence."),
    hostel: optionalText,
    decision: z.enum(["New Convert", "Rededication"], { message: "Choose a decision." }),
    dateReached: z.iso.date({ message: "Enter a valid date reached." }),
    churchDenomination: optionalText,
    baptismStatus: z.enum(["Yes", "No", "Unknown / not disclosed"], { message: "Choose a baptism status." }),
    preferredContactMethod: z.enum(["Phone call", "WhatsApp", "SMS", "No Contact"], { message: "Choose a preferred contact method." }),
    evangelismLocation: optionalText,
    remarks: z.string().trim().max(250, "Keep remarks to 250 characters or fewer.").optional().or(z.literal("")),
    evangelistFullName: z.preprocess((value) => value ?? "", z.string().trim().min(2, "Enter the evangelist’s full name.").max(250)),
    evangelistPhone: requiredText("Enter your phone or WhatsApp number."),
    hallZone: requiredText("Enter your hall or zone."),
    department: requiredText("Enter your department or ministry."),
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

export type RecordFormValues = z.infer<typeof recordSchema>;
