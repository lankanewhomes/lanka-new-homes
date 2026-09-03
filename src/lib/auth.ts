import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Profile = {
  id: string;
  role: "buyer" | "developer";
  fullName: string | null;
  avatarUrl: string | null;
  developerSlug: string | null;
  email: string | null;
  phone: string | null;
  preferredLocations: string[];
  preferredPropertyTypes: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  preferredBedrooms: string | null;
  notifyEmail: boolean;
  notifyNewProperties: boolean;
  notifyPriceChanges: boolean;
  marketingOptIn: boolean;
};

const PROFILE_COLUMNS =
  "id, role, full_name, avatar_url, developer_slug, phone, preferred_locations, preferred_property_types, budget_min, budget_max, preferred_bedrooms, notify_email, notify_new_properties, notify_price_changes, marketing_opt_in";

type ProfileRow = {
  id: string;
  role: "buyer" | "developer";
  full_name: string | null;
  avatar_url: string | null;
  developer_slug: string | null;
  phone: string | null;
  preferred_locations: string[] | null;
  preferred_property_types: string[] | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_bedrooms: string | null;
  notify_email: boolean;
  notify_new_properties: boolean;
  notify_price_changes: boolean;
  marketing_opt_in: boolean;
};

function rowToProfile(row: ProfileRow, email: string | null): Profile {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    developerSlug: row.developer_slug,
    email,
    phone: row.phone,
    preferredLocations: row.preferred_locations ?? [],
    preferredPropertyTypes: row.preferred_property_types ?? [],
    budgetMin: row.budget_min,
    budgetMax: row.budget_max,
    preferredBedrooms: row.preferred_bedrooms,
    notifyEmail: row.notify_email,
    notifyNewProperties: row.notify_new_properties,
    notifyPriceChanges: row.notify_price_changes,
    marketingOptIn: row.marketing_opt_in,
  };
}

// Server-side helper: current signed-in user's profile, or null if signed out.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).single();

  if (!profile) return null;

  return rowToProfile(profile as ProfileRow, user.email ?? null);
}
