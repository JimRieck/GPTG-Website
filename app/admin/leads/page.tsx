import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";
import { formatEastern } from "@/lib/time";
import AdminNav from "../AdminNav";
import VerifyButton from "./VerifyButton";
import { StatusForm } from "./LeadRowActions";
import StatusPie from "./StatusPie";

export const metadata = {
  title: "Leads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const { email } = await requireAdmin();
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  // Load everything once: the chart counts all leads, the table hides archived ones by default.
  const allLeads = await listLeads({ includeArchived: true });
  const leads = showArchived ? allLeads : allLeads.filter((l) => l.status !== "archived");

  const counts = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const lead of allLeads) counts[lead.status] += 1;

  return (
    <section className="wide-page">
      <AdminNav email={email} current="leads" />

      <StatusPie counts={counts} />

      <div className="admin-bar">
        <h1>
          {showArchived ? "Archived leads" : "Leads"} ({leads.length})
        </h1>
        <div>
          <Link href={showArchived ? "/admin/leads" : "/admin/leads?archived=1"} className="button secondary small">
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>
        </div>
      </div>

      {leads.length === 0 ? (
        <p>No leads yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Received</th>
                <th>Name</th>
                <th>Company</th>
                <th>Address</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Message</th>
                <th>Address check</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{formatEastern(lead.created_at)}</td>
                  <td>{lead.name}</td>
                  <td>{lead.company_name ?? "—"}</td>
                  <td>
                    {lead.address}
                    <br />
                    {lead.city}, {lead.state} {lead.zip}
                  </td>
                  <td>
                    <a href={`mailto:${lead.email}`}>{lead.email}</a>
                  </td>
                  <td>
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`}>{lead.phone}</a>
                  </td>
                  <td className="message-cell">{lead.message}</td>
                  <td>
                    {lead.address_verified === null ? (
                      <span className="badge neutral">Not checked</span>
                    ) : lead.address_verified ? (
                      <span className="badge ok">Verified</span>
                    ) : (
                      <span className="badge bad">Not verified</span>
                    )}
                    {lead.address_verification?.formattedAddress && (
                      <small className="formatted">{lead.address_verification.formattedAddress}</small>
                    )}
                    {lead.address_verified_at && (
                      <small className="muted">
                        Checked {formatEastern(lead.address_verified_at)}
                      </small>
                    )}
                  </td>
                  <td>
                    <VerifyButton leadId={lead.id} />
                  </td>
                  <td>
                    <StatusForm leadId={lead.id} status={lead.status} />
                    <small className="muted">{LEAD_STATUS_LABELS[lead.status]}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
