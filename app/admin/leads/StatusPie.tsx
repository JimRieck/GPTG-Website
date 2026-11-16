import { buildPieSlices } from "@/lib/pie";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/lead-status";

// Colours chosen to stay distinct for colour-blind readers and readable in both themes.
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "#2f80ed",
  contacted: "#f2c94c",
  qualified: "#9b51e0",
  won: "#2b8a3e",
  lost: "#c0392b",
  archived: "#8a8f8c",
};

export default function StatusPie({ counts }: { counts: Record<LeadStatus, number> }) {
  const slices = buildPieSlices(
    LEAD_STATUSES.map((s) => ({
      label: LEAD_STATUS_LABELS[s],
      value: counts[s],
      color: STATUS_COLORS[s],
    })),
  );
  const total = LEAD_STATUSES.reduce((sum, s) => sum + counts[s], 0);

  return (
    <section className="status-chart" aria-label="Leads by status">
      <h2>Leads by status</h2>
      {total === 0 ? (
        <p className="muted">No leads to chart yet.</p>
      ) : (
        <div className="chart-body">
          <svg viewBox="0 0 200 200" width="200" height="200" role="img" aria-label={`Pie chart of ${total} leads by status`}>
            {slices.length === 1 ? (
              <circle cx="100" cy="100" r="90" fill={slices[0].color} />
            ) : (
              slices.map((s) => <path key={s.label} d={s.path ?? undefined} fill={s.color} />)
            )}
          </svg>
          <ul className="legend">
            {slices.map((s) => (
              <li key={s.label}>
                <span className="swatch" style={{ background: s.color }} aria-hidden="true" />
                {s.label}: {s.value} ({s.percent.toFixed(0)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
