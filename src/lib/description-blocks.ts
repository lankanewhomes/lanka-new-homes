// Turns a listing description typed as plain text into display blocks. Pasted developer copy often puts every short line ("4Km to
// Hanwella town") in its own paragraph with a blank line between, plus stray double spaces; shown with white-space: pre-line that
// became a column of widely spaced one-liners (owner, 2026-11-02: "why too many spaces"). Consecutive short lines that do not end a
// sentence are grouped into one tight list; everything else becomes a normal paragraph. Runs of spaces are collapsed.

export type DescriptionBlock = { type: "p"; text: string } | { type: "list"; items: string[] }

const LIST_LINE_MAX = 100
const clean = (line: string) => line.replace(/[\s ]+/g, " ").trim()
const isListLine = (line: string) => line.length <= LIST_LINE_MAX && !/[.!?:;]$/.test(line)

export function descriptionBlocks(raw: string | null | undefined): DescriptionBlock[] {
  const groups = String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .split(/\n[ \t ]*\n+/)
    .map((group) => group.split("\n").map(clean).filter(Boolean))
    .filter((lines) => lines.length > 0)

  const blocks: DescriptionBlock[] = []
  let run: string[] = []
  const flush = () => {
    if (run.length >= 2) blocks.push({ type: "list", items: run })
    else for (const text of run) blocks.push({ type: "p", text })
    run = []
  }
  for (const lines of groups) {
    if (lines.every(isListLine)) { run.push(...lines); continue }
    flush()
    blocks.push({ type: "p", text: lines.join(" ") })
  }
  flush()
  return blocks
}
