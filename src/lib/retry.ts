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

// One shared read for a short time. During a build or a traffic spike many pages ask for "all lands" / "all projects" at the same
// moment; each used to be its own database query, and enough of them at once hit the 8 second statement timeout. Concurrent and
// near-in-time callers now share one query. A failed read is never kept, so the next caller tries again.
export function memoizeAsync<T>(load: () => Promise<T>, ttlMs = 20_000): () => Promise<T> {
  let cached: { at: number; promise: Promise<T> } | null = null;
  return () => {
    if (cached && Date.now() - cached.at < ttlMs) return cached.promise;
    const promise = load();
    cached = { at: Date.now(), promise };
    promise.catch(() => {
      if (cached?.promise === promise) cached = null;
    });
    return promise;
  };
}
