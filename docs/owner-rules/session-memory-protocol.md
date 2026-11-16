# Saving sessions to memory (so a lost chat can be rebuilt)

| Step | Rule |
|---|---|
| When | After every finished task, and whenever the owner states a new rule or preference ("always keep everything in memory", 2026-11-15) |
| Where | `~/.claude/projects/-Volumes-MyStorage-LNH-lankanewhomes/memory/` (one `.md` per topic) plus a one-line pointer in `MEMORY.md` |
| Check first | Look for an existing note and update it instead of creating a duplicate |
| Format | Frontmatter (`name`, `description`, `metadata.type` = user / feedback / project / reference), then the fact, then **Why** and **How to apply** |
| Session note | What the session was for, what is done, what is open, what you are waiting on the owner for, where the files, scripts, branch and commit are |
| Rules vs history | Standing rules also go into `docs/owner-rules/*.md` (committed, pushed) so any session can read them; history stays in memory |
| Not stored | Phone numbers, passwords, keys, tokens, lead contact details |
| Verify before relying | A memory that names a file, flag or branch may be stale; check it exists |
| Handover | Keep a "START HERE" note for the busiest workstream (see `session-handover-2026-11-15.md`) |
