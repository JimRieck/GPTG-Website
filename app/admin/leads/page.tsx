import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { LEAD_STATUS_LABELS } from "@/lib/lead-status";
import { signOutAdmin } from "../actions";
import VerifyButton from "./VerifyButton";
import { StatusForm } from "./LeadRowActions";

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
  const leads = await listLeads({ includeArchived: showArchived });

  return (
    <section className="wide-page">
      <div className="admin-bar">
        <h1>
          {showArchived ? "Archived leads" : "Leads"} ({leads.length})
        </h1>
        <div>
          <Link href={showArchived ? "/admin/leads" : "/admin/leads?archived=1"} className="button secondary small">
            {showArchived ? "Hide archived" : "Show archived"}
          </Link>{" "}
          <span className="muted">{email}</span>{" "}
          <form action={signOutAdmin} style={{ display: "inline" }}>
            <button type="submit" className="button secondary">
              Sign out
            </button>
          </form>
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
                  <td>{new Date(lead.created_at).toLocaleString("en-US")}</td>
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
                        Checked {new Date(lead.address_verified_at).toLocaleString("en-US")}
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
