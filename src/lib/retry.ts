// The "get everything" Supabase reads (all lands, all projects, all developers) occasionally hit the database's statement timeout
// when many pages are generated at the same time (a Cloudflare build failed on 2026-10-10 with "canceling statement due to
// statement timeout" while prerendering). A short retry makes those reads robust without changing what they return.
export async function retryQuery<T extends { error: { message: string } | null }>(run: () => PromiseLike<T>, attempts = 4): Promise<T> {
  let result = await run();
  for (let attempt = 1; attempt < attempts && result.error && /timeout|timed out|fetch failed|ECONNRESET|terminated/i.test(result.error.message); attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    result = await run();
  }
  return result;
}
