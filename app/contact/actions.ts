"use server";

import { parseContactForm } from "@/lib/validation";
import { insertLead } from "@/lib/leads";
import {
  buildLeadConfirmationEmail,
  buildLeadNotificationEmail,
  sendEmailWithResend,
} from "@/lib/email";

// Types are erased at build time, so they are safe to export from a "use server" file.
// (Non-async runtime values such as constants are not allowed there.)
export type ContactFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Record<string, string>;
  values?: Record<string, string>;
};

const FIELD_NAMES = ["name", "companyName", "address", "city", "state", "zip", "email", "phone", "message"];

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const values = Object.fromEntries(FIELD_NAMES.map((k) => [k, String(formData.get(k) ?? "")]));

  const parsed = parseContactForm(formData);
  if (!parsed.ok) {
    return {
      status: "error",
      message: "Please fix the highlighted fields and try again.",
      errors: parsed.errors,
      values,
    };
  }

  // Honeypot tripped: pretend success so bots get no signal, and store nothing.
  if (parsed.data.website) {
    return { status: "success", message: "Thanks! We'll be in touch shortly." };
  }

  const lead = parsed.data;

  try {
    await insertLead(lead);
  } catch (err) {
    console.error("[contact] failed to save lead", err);
    return {
      status: "error",
      message: "Something went wrong saving your request. Please try again in a moment.",
      values,
    };
  }

  // Emails are best-effort: the lead is already saved, so a mail failure should not
  // make the visitor think their request was lost. Failures are logged for follow-up.
  const notify = buildLeadNotificationEmail(lead);
  const confirm = buildLeadConfirmationEmail(lead);
  const notifyTo = process.env.NOTIFY_EMAIL ?? "";

  const results = await Promise.allSettled([
    sendEmailWithResend({
      to: notifyTo,
      subject: notify.subject,
      text: notify.text,
      replyTo: lead.email,
    }),
    sendEmailWithResend({
      to: lead.email,
      subject: confirm.subject,
      text: confirm.text,
    }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`[contact] email ${i === 0 ? "to owner" : "to submitter"} failed`, r.reason);
    }
  });

  return {
    status: "success",
    message: "Thanks for reaching out! We've received your inquiry and sent you a confirmation email.",
  };
}
