// Categories for the To-do list (owner, 2026-10-15: "the to do list can you categorize them"). A task gets its category from its title
// the first time it is saved; the owner can change it afterwards. Order matters: the first matching rule wins.
export const TODO_CATEGORIES = [
  'Publishing',
  'Contact & WhatsApp',
  'Dates & construction',
  'Pricing & payment',
  'Location & map',
  'Photos & media',
  'Amenities & features',
  'Floor plans, units & plots',
  'Developer & people',
  'Other',
] as const

export type TodoCategory = (typeof TODO_CATEGORIES)[number]

const RULES: [TodoCategory, RegExp][] = [
  ['Publishing', /\bpublish/i],
  ['Contact & WhatsApp', /whatsapp|\bcontact\b|\be-?mail\b|\bphone\b|verify invite|invite/i],
  ['Dates & construction', /completion|handover|hand-over|construction|\bstage\b|\bstatus\b|launch|progress/i],
  ['Pricing & payment', /\bprice|pricing|payment|deposit|rental|yield|\bcost\b|discount|loan/i],
  ['Location & map', /\bmap\b|coordinates|street ?view|address|neighbou?rhood|nearby|location|\bdistrict\b|\broad\b/i],
  ['Photos & media', /photo|image|video|gallery|brochure|render|logo|hero|block plan|road map/i],
  ['Amenities & features', /amenit|specification|\bspec\b|key features|features|parking|facilit|air conditioning/i],
  ['Floor plans, units & plots', /floor|plan|unit|bathroom|bedroom|\bplot|\bsize|\bsizes\b|\barea\b|perch|duplex|penthouse|tower|villa count|availab/i],
  ['Developer & people', /developer|architect|contractor|award|builder|company|owner/i],
]

export function categorizeTodo(title: string | null | undefined, notes?: string | null): TodoCategory {
  const t = String(title ?? '')
  for (const [cat, re] of RULES) if (re.test(t)) return cat
  const n = String(notes ?? '')
  // Fall back to the notes only for the clearest signals, so a vague title is not misfiled.
  if (/payment plan|per-plan price/i.test(n)) return 'Pricing & payment'
  return 'Other'
}
