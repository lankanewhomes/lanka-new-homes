import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

// Permanently deletes the signed-in user's auth.users row — profiles,
// saved_listings, saved_developers, and saved_searches all have
// `on delete cascade` FKs to auth.users, so this also removes those.
// leads.user_id is `on delete set null` — past enquiries stay (they're the
// developer's record of contact, not just the buyer's), just unlinked.
export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
