import { getServiceSupabase } from "@/lib/supabase/service";
import type { ContactInput } from "@/lib/validation";
import type { AddressVerification } from "@/lib/geocode";
import type { LeadStatus } from "@/lib/lead-status";

export type Lead = {
  id: string;
  created_at: string;
  status: LeadStatus;
  name: string;
  company_name: string | null;
  address: string;
  city: string;
  state: string;
  zip: string;
  email: string;
  phone: string;
  message: string;
  address_verified: boolean | null;
  address_verified_at: string | null;
  address_verification: AddressVerification | null;
};

export async function insertLead(input: ContactInput): Promise<{ id: string }> {
  const { data, error } = await getServiceSupabase()
    .from("leads")
    .insert({
      name: input.name,
      company_name: input.companyName || null,
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      email: input.email,
      phone: input.phone,
      message: input.message,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to save lead: ${error.message}`);
  return { id: data.id as string };
}

export async function listLeads(options: { includeArchived?: boolean } = {}): Promise<Lead[]> {
  let query = getServiceSupabase()
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (!options.includeArchived) query = query.neq("status", "archived");

  const { data, error } = await query;

  if (error) throw new Error(`Failed to load leads: ${error.message}`);
  return (data ?? []) as Lead[];
}

export async function getLead(id: string): Promise<Lead | null> {
  const { data, error } = await getServiceSupabase().from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  return (data as Lead | null) ?? null;
}

export async function updateLeadStatus(id: string, status: LeadStatus): Promise<void> {
  const { error } = await getServiceSupabase().from("leads").update({ status }).eq("id", id);
  if (error) throw new Error(`Failed to update status: ${error.message}`);
}

export async function saveAddressVerification(id: string, result: AddressVerification): Promise<void> {
  const { error } = await getServiceSupabase()
    .from("leads")
    .update({
      address_verified: result.verified,
      address_verified_at: result.checkedAt,
      address_verification: result,
    })
    .eq("id", id);

  if (error) throw new Error(`Failed to save verification: ${error.message}`);
}
