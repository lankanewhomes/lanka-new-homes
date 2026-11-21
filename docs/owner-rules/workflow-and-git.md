# Workflow, git and deploys

| Rule | Detail |
|---|---|
| Local folder first | Write changes in `/Volumes/MyStorage/LNH/lankanewhomes`, commit only your own files, then push (owner 2026-11-15) |
| Branch | Push only to `cloudflare-migration`; never `main`; no PR unless asked (owner 2026-11-05: "I don't want to use main anymore") |
| Remote | Named `lankanewhomes` (not `origin`): `https://github.com/lankanewhomes/lanka-new-homes`; the only allowed remote; switch with `gh auth switch -u lankanewhomes` |
| Local folder state (2026-11-15) | Diverged from the remote (17 ahead, 73 behind). Do not `git pull --rebase` there. Push from a worktree on `lankanewhomes/cloudflare-migration` and cherry-pick, then reconcile the local folder |
| Before pushing | Run type-check, tests (`npx vitest run`) and lint; GitHub CI does not run on this branch, so never claim a green build |
| Deploy | Cloudflare builds on push, usually 3-15 minutes; never run `cf:deploy` from the Mac |
| After pushing | Check the live site (home page, a project page, the changed page) and report whether the change is live |
| Cached pages | After a data change, pages may be stale until the next deploy |
| Bare-domain redirect | Do it as a Cloudflare Redirect Rule, never in `next.config.ts` (it once caused a 308 loop) |
| Images | After adding photos run `npm run images:presize` (Cloudflare resize quota fallback) |
| Finish first | Finish and verify the current task before starting the next; queue new requests |
| Next.js | This is a newer Next.js: read `node_modules/next/dist/docs/` before writing code |
| Scripts | Data scripts live in `scripts/`, dry-run by default, `--apply` to write, and must be safe to re-run |
| Dev server | `next dev` for this folder runs on port 3001 (3000 is another project) |
