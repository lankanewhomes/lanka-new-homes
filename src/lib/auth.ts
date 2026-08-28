import { createSupabaseServerClient } from "@/lib/supabase-server";

export type Profile = {
  id: string;
  role: "buyer" | "developer";
  fullName: string | null;
  avatarUrl: string | null;
  developerSlug: string | null;
  email: string | null;
};

// Server-side helper: current signed-in user's profile, or null if signed out.
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, avatar_url, developer_slug")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    id: profile.id,
    role: profile.role,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
    developerSlug: profile.developer_slug,
    email: user.email ?? null,
  };
}
