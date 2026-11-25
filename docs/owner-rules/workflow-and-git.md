# Workflow, git and deploys

| Rule | Detail |
|---|---|
| Local folder first | Write changes in the one local folder, commit only your own files, then push (owner 2026-11-15). Since 2026-11-25 that folder is `c:\Users\rupan\OneDrive\Desktop\lnh\lankanewhomes` on the Windows PC (owner: "i dont use mac anymore"); the old Mac folder `/Volumes/MyStorage/LNH/lankanewhomes` is retired. No worktrees, no copies of the repo |
| Branch | Push only to `cloudflare-migration`; never `main`; no PR unless asked (owner 2026-11-05: "I don't want to use main anymore") |
| Remote | Named `lankanewhomes` (not `origin`): `https://github.com/lankanewhomes/lanka-new-homes`; the only allowed remote; switch with `gh auth switch -u lankanewhomes` |
| Local folder state (2026-11-15) | Historical, Mac only: it had diverged from the remote (17 ahead, 73 behind). The Mac is retired (2026-11-25); the PC folder tracks `lankanewhomes/cloudflare-migration` directly |
| Before pushing | Run type-check, tests (`npx vitest run`) and lint; GitHub CI does not run on this branch, so never claim a green build |
| Deploy | Cloudflare Workers Builds builds from the GitHub repo on every push to `cloudflare-migration`, usually 3-15 minutes; watch it at the Worker's Builds tab in the Cloudflare dashboard. Never run `cf:deploy` from a PC; deploys come from the push only. The owner thinks in Cloudflare terms ("i dont use github anymore. i use cloudflare", 2026-11-25): say "push so Cloudflare builds it", point to the Cloudflare page, never start a GitHub login for them |
| After pushing | Check the live site (home page, a project page, the changed page) and report whether the change is live |
| Cached pages | After a data change, pages may be stale until the next deploy |
| Bare-domain redirect | Do it as a Cloudflare Redirect Rule, never in `next.config.ts` (it once caused a 308 loop) |
| Images | After adding photos run `npm run images:presize` (Cloudflare resize quota fallback) |
| Finish first | Finish and verify the current task before starting the next; queue new requests |
| Next.js | This is a newer Next.js: read `node_modules/next/dist/docs/` before writing code |
| Scripts | Data scripts live in `scripts/`, dry-run by default, `--apply` to write, and must be safe to re-run |
| Dev server | `next dev` for this folder runs on port 3001 (3000 is another project) |
