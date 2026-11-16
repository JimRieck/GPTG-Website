"use client";

import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import { setLeadStatus } from "../actions";

export function StatusForm({ leadId, status }: { leadId: string; status: LeadStatus }) {
  return (
    <form action={setLeadStatus} className="status-form">
      <input type="hidden" name="id" value={leadId} />
      <select name="status" defaultValue={status} aria-label="Lead status">
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button type="submit" className="button small secondary">
        Save
      </button>
    </form>
  );
}
