"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { getLead, saveAddressVerification, updateLeadStatus } from "@/lib/leads";
import { verifyAddress, type AddressVerification } from "@/lib/geocode";
import { isLeadStatus } from "@/lib/lead-status";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function setLeadStatus(formData: FormData): Promise<void> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!UUID_RE.test(id)) throw new Error("Invalid lead id.");
  if (!isLeadStatus(status)) throw new Error("Invalid status.");

  await updateLeadStatus(id, status);
  revalidatePath("/admin/leads");
}

export type LoginState = { error?: string };

export async function signInAdmin(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Same generic message for bad credentials and for valid non-admin accounts.
  if (error || !data.user || !isAdminEmail(data.user.email)) {
    if (data.user) await supabase.auth.signOut();
    return { error: "Invalid email or password." };
  }

  redirect("/admin/leads");
}

export async function signOutAdmin(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export type VerifyState = {
  ok: boolean;
  message: string;
  result?: AddressVerification;
};

export async function verifyLeadAddress(_prev: VerifyState, formData: FormData): Promise<VerifyState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { ok: false, message: "Invalid lead id." };

  const lead = await getLead(id);
  if (!lead) return { ok: false, message: "Lead not found." };

  try {
    const result = await verifyAddress({
      address: lead.address,
      city: lead.city,
      state: lead.state,
      zip: lead.zip,
    });
    await saveAddressVerification(id, result);
    revalidatePath("/admin/leads");
    return {
      ok: true,
      message: result.verified ? "Address verified." : `Not verified: ${result.reason}.`,
      result,
    };
  } catch (err) {
    console.error("[admin] address verification failed", err);
    return { ok: false, message: err instanceof Error ? err.message : "Verification failed." };
  }
}
