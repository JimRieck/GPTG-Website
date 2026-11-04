import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (data.user && isAdminEmail(data.user.email)) redirect("/admin/leads");

  return (
    <section className="narrow">
      <h1>Admin sign in</h1>
      <LoginForm />
    </section>
  );
}
