/**
 * Transactional email via Resend (https://resend.com).
 * Uses the REST API directly so there is no extra SDK dependency.
 */

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export type EmailSender = (message: EmailMessage) => Promise<void>;

export async function sendEmailWithResend(
  message: EmailMessage,
  env: { apiKey?: string; from?: string } = {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.EMAIL_FROM,
  },
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  if (!env.apiKey || !env.from) {
    throw new Error("Email is not configured: RESEND_API_KEY and EMAIL_FROM are required");
  }

  const res = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend API error ${res.status}: ${body}`);
  }
}

export function buildLeadNotificationEmail(lead: {
  name: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  message: string;
}): { subject: string; text: string } {
  const company = lead.companyName || "(not provided)";
  return {
    subject: `New website inquiry from ${lead.name}`,
    text: [
      "A new inquiry was submitted on the Green Pastures Technology Group website.",
      "",
      `Name: ${lead.name}`,
      `Company: ${company}`,
      `Address: ${lead.address}, ${lead.city}, ${lead.state} ${lead.zip}`,
      `Email: ${lead.email}`,
      `Phone: ${lead.phone}`,
      "",
      "What they want to discuss:",
      lead.message,
      "",
      "View all leads in the admin area.",
    ].join("\n"),
  };
}

export function buildLeadConfirmationEmail(lead: { name: string }): { subject: string; text: string } {
  return {
    subject: "Thanks for contacting Green Pastures Technology Group",
    text: [
      `Hi ${lead.name},`,
      "",
      "Thank you for reaching out to Green Pastures Technology Group. We received your inquiry",
      "and will be in touch soon.",
      "",
      "If you need to add anything, just reply to this email.",
      "",
      "Green Pastures Technology Group",
    ].join("\n"),
  };
}
