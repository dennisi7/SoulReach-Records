export const evangelismAreas = ["Ahoe", "Alaye", "Dave", "Godokpe", "Kojobi", "Mirage", "Poly", "Sokode", "Trafalgar"] as const;

export const recordFields = [
  ["personFullName", "person_full_name", "Full name"],
  ["personPhone", "person_phone", "Phone or WhatsApp"],
  ["studentStatus", "student_status", "Student status", ["Student", "Non-student"]],
  ["academicLevel", "academic_level", "Academic level", ["100", "200", "300", "400", "500+", "Other"]],
  ["residence", "residence", "Area or residence", evangelismAreas],
  ["hostel", "hostel", "Hostel"],
  ["decision", "decision", "Decision", ["New Convert", "Rededication"]],
  ["dateReached", "date_reached", "Date reached"],
  ["churchDenomination", "church_denomination", "Church or denomination"],
  ["baptismStatus", "baptism_status", "Baptism status", ["Yes", "No", "Unknown / not disclosed"]],
  ["preferredContactMethod", "preferred_contact_method", "Preferred contact", ["Phone call", "WhatsApp", "SMS", "No Contact"]],
  ["evangelismLocation", "evangelism_location", "Evangelism area", evangelismAreas],
  ["evangelistFullName", "evangelist_full_name", "Evangelist full name"],
] as const;
export const recordColumns = `id, person_full_name, person_phone, student_status, academic_level, residence,
  hostel, decision, date_reached, church_denomination, baptism_status, preferred_contact_method,
  evangelism_location, evangelist_full_name, contacted, updated_at` as const;
