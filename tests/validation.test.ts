import { describe, expect, it } from "vitest";
import { parseContactForm } from "@/lib/validation";

function form(overrides: Record<string, string> = {}): FormData {
  const base: Record<string, string> = {
    name: "Jane Rancher",
    companyName: "Rancher Co",
    address: "123 Main St",
    city: "Austin",
    state: "tx",
    zip: "78701",
    email: "jane@example.com",
    phone: "(512) 555-0123",
    message: "We need help building a website for our farm.",
    website: "",
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) fd.set(k, v);
  return fd;
}

describe("parseContactForm", () => {
  it("accepts a valid submission and normalises state to upper case", () => {
    const result = parseContactForm(form());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.state).toBe("TX");
      expect(result.data.companyName).toBe("Rancher Co");
    }
  });

  it("allows company name to be left blank", () => {
    const result = parseContactForm(form({ companyName: "" }));
    expect(result.ok).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = parseContactForm(form({ email: "not-an-email" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.email).toBeTruthy();
  });

  it("rejects an unknown state code", () => {
    const result = parseContactForm(form({ state: "ZZ" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.state).toBeTruthy();
  });

  it("accepts ZIP+4 and rejects malformed ZIP codes", () => {
    expect(parseContactForm(form({ zip: "78701-1234" })).ok).toBe(true);
    const bad = parseContactForm(form({ zip: "7870" }));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.zip).toBeTruthy();
  });

  it("rejects phone numbers with too few digits", () => {
    const result = parseContactForm(form({ phone: "555-1234" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.phone).toBeTruthy();
  });

  it("requires a meaningful message", () => {
    const result = parseContactForm(form({ message: "hi" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.message).toBeTruthy();
  });

  it("fails when the honeypot field is filled in", () => {
    const result = parseContactForm(form({ website: "http://spam.example" }));
    expect(result.ok).toBe(false);
  });

  it("reports every missing required field", () => {
    const fd = new FormData();
    const result = parseContactForm(fd);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      for (const key of ["name", "address", "city", "state", "zip", "email", "phone", "message"]) {
        expect(result.errors[key], key).toBeTruthy();
      }
    }
  });
});
