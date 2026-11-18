import Link from "next/link";
import { signOutAdmin } from "./actions";

/** Shared top navigation for the signed-in admin pages. */
export default function AdminNav({ email, current }: { email: string; current: "leads" | "traffic" }) {
  return (
    <nav className="admin-nav" aria-label="Admin">
      <Link href="/admin/leads" aria-current={current === "leads" ? "page" : undefined}>
        Leads
      </Link>
      <Link href="/admin/traffic" aria-current={current === "traffic" ? "page" : undefined}>
        Traffic
      </Link>
      <span className="admin-nav-spacer" />
      <span className="muted">{email}</span>
      <form action={signOutAdmin}>
        <button type="submit" className="button secondary small">
          Sign out
        </button>
      </form>
    </nav>
  );
}
