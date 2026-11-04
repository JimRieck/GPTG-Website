import { describe, expect, it, vi } from "vitest";
import {
  buildLeadConfirmationEmail,
  buildLeadNotificationEmail,
  sendEmailWithResend,
} from "@/lib/email";

const lead = {
  name: "Jane Rancher",
  companyName: "",
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  email: "jane@example.com",
  phone: "5125550123",
  message: "We need a website.",
};

describe("email builders", () => {
  it("builds the owner notification with all lead fields", () => {
    const { subject, text } = buildLeadNotificationEmail(lead);
    expect(subject).toContain("Jane Rancher");
    expect(text).toContain("Company: (not provided)");
    expect(text).toContain("123 Main St, Austin, TX 78701");
    expect(text).toContain("We need a website.");
  });

  it("builds the submitter confirmation", () => {
    const { subject, text } = buildLeadConfirmationEmail({ name: "Jane" });
    expect(subject).toContain("Thanks");
    expect(text).toContain("Hi Jane,");
  });
});

describe("sendEmailWithResend", () => {
  const env = { apiKey: "re_test", from: "Green Pastures <hello@example.com>" };

  it("posts to the Resend API with auth and reply-to", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    await sendEmailWithResend(
      { to: "owner@example.com", subject: "s", text: "t", replyTo: "jane@example.com" },
      env,
      fetchMock as unknown as typeof fetch,
    );
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(["owner@example.com"]);
    expect(body.reply_to).toBe("jane@example.com");
  });

  it("throws when the API responds with an error", async () => {
    const fetchMock = vi.fn(async () => new Response("bad", { status: 422 }));
    await expect(
      sendEmailWithResend({ to: "a@b.co", subject: "s", text: "t" }, env, fetchMock as unknown as typeof fetch),
    ).rejects.toThrow(/422/);
  });

  it("throws when email is not configured", async () => {
    await expect(sendEmailWithResend({ to: "a@b.co", subject: "s", text: "t" }, {})).rejects.toThrow(/not configured/);
  });
});
