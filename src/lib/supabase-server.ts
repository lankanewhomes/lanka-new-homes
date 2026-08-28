import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client that reads/writes the auth session via cookies. Use in
// Server Components, Server Actions, and Route Handlers — never in a client
// component (use createSupabaseBrowserClient there instead).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — middleware handles the refresh instead.
          }
        },
      },
    }
  );
}
