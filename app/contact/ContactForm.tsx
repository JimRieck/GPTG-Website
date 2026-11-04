"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "./actions";

const initialContactState: ContactFormState = { status: "idle" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState(submitContactForm, initialContactState);
  const v = (k: string) => state.values?.[k] ?? "";
  const err = (k: string) => state.errors?.[k];

  if (state.status === "success") {
    return (
      <div className="notice success" role="status">
        <h2>Thank you!</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="form" noValidate>
      {state.status === "error" && state.message && (
        <div className="notice error" role="alert">
          {state.message}
        </div>
      )}

      <div className="grid">
        <Field label="Full name" name="name" required error={err("name")} defaultValue={v("name")} autoComplete="name" />
        <Field label="Company name" name="companyName" error={err("companyName")} defaultValue={v("companyName")} autoComplete="organization" />
        <Field label="Email" name="email" type="email" required error={err("email")} defaultValue={v("email")} autoComplete="email" />
        <Field label="Phone" name="phone" type="tel" required error={err("phone")} defaultValue={v("phone")} autoComplete="tel" />
        <Field label="Street address" name="address" required wide error={err("address")} defaultValue={v("address")} autoComplete="street-address" />
        <Field label="City" name="city" required error={err("city")} defaultValue={v("city")} autoComplete="address-level2" />
        <Field label="State" name="state" required maxLength={2} placeholder="e.g. TX" error={err("state")} defaultValue={v("state")} autoComplete="address-level1" />
        <Field label="ZIP code" name="zip" required error={err("zip")} defaultValue={v("zip")} autoComplete="postal-code" inputMode="numeric" />
      </div>

      <label className="field wide">
        <span>What would you like to talk about? <em>*</em></span>
        <textarea name="message" rows={6} defaultValue={v("message")} aria-invalid={!!err("message")} />
        {err("message") && <small className="error-text">{err("message")}</small>}
      </label>

      {/* Honeypot: hidden from people and screen readers, filled in only by bots. */}
      <div aria-hidden="true" className="hp">
        <label>
          Leave this field empty
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <button type="submit" className="button" disabled={pending}>
        {pending ? "Sending..." : "Send inquiry"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  error,
  required,
  wide,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  defaultValue?: string;
  type?: string;
  maxLength?: number;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "numeric" | "tel" | "email" | "text";
}) {
  return (
    <label className={`field${wide ? " wide" : ""}`}>
      <span>
        {label} {required && <em>*</em>}
      </span>
      <input name={name} aria-invalid={!!error} {...rest} />
      {error && <small className="error-text">{error}</small>}
    </label>
  );
}
