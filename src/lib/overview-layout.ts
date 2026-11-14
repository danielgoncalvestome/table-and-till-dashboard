export const SECTION_IDS = ["actions", "alerts", "status", "today", "floor", "orders", "views", "kpis", "dishes", "ratings"] as const;
export type SectionId = (typeof SECTION_IDS)[number];
export type LayoutItem = { id: SectionId; wide: boolean; hidden: boolean };
export const DEFAULT_LAYOUT: LayoutItem[] = SECTION_IDS.map((id) => ({ id, wide: id === "actions" || id === "status", hidden: false }));
/** Keeps saved order, drops unknown ids and appends sections added later. */
export function normalizeLayout(v: unknown): LayoutItem[] {
  if (!Array.isArray(v)) return DEFAULT_LAYOUT;
  const out: LayoutItem[] = [];
  for (const x of v) if (x && (SECTION_IDS as readonly string[]).includes(x.id) && !out.some((o) => o.id === x.id)) out.push({ id: x.id, wide: !!x.wide, hidden: !!x.hidden });
  for (const d of DEFAULT_LAYOUT) if (!out.some((o) => o.id === d.id)) out.push(d);
  return out;
}
