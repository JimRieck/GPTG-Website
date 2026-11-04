"use client";

import { useActionState } from "react";
import { verifyLeadAddress, type VerifyState } from "../actions";

const initial: VerifyState = { ok: false, message: "" };

export default function VerifyButton({ leadId }: { leadId: string }) {
  const [state, formAction, pending] = useActionState(verifyLeadAddress, initial);
  return (
    <form action={formAction} className="verify">
      <input type="hidden" name="id" value={leadId} />
      <button type="submit" className="button small" disabled={pending}>
        {pending ? "Checking..." : "Verify address"}
      </button>
      {state.message && <small className={state.ok && state.result?.verified ? "ok-text" : "bad-text"}>{state.message}</small>}
    </form>
  );
}
