import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Returns true when the email belongs to the single allowed admin.
 * Admin accounts are created manually in the Supabase dashboard (public sign-up is disabled).
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!email && !!admin && email.trim().toLowerCase() === admin;
}

/** Server-side guard. Redirects to the admin login page unless the user is the admin. */
export async function requireAdmin(): Promise<{ email: string }> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email || !isAdminEmail(email)) {
    redirect("/admin/login");
  }
  return { email };
}
