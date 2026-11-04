import { z } from "zod";

const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN",
  "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
  "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT",
  "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  companyName: z.string().trim().max(160).optional().default(""),
  address: z.string().trim().min(1, "Address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(100),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => (US_STATE_CODES as readonly string[]).includes(v), "Enter a valid 2-letter US state code"),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Enter a valid ZIP code (12345 or 12345-6789)"),
  email: z.email("Enter a valid email address").max(254),
  phone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 10 && v.replace(/\D/g, "").length <= 15, "Enter a valid phone number"),
  message: z.string().trim().min(10, "Please tell us a little about your inquiry").max(5000),
  // Honeypot: real users never see or fill this field. Bots often do.
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function parseContactForm(formData: FormData):
  | { ok: true; data: ContactInput }
  | { ok: false; errors: Record<string, string> } {
  const raw = Object.fromEntries(
    ["name", "companyName", "address", "city", "state", "zip", "email", "phone", "message", "website"].map(
      (k) => [k, String(formData.get(k) ?? "")],
    ),
  );
  const result = contactSchema.safeParse(raw);
  if (result.success) return { ok: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
