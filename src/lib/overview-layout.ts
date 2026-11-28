export const SECTION_IDS = [
  "actions", "today", "floor", "orders", "alerts", "dishes",
  "status", "views", "kpis", "ratings", "service", "menu",
  "availability", "categories", "week", "orderSummary", "tables",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type LayoutItem = { id: SectionId; w: number; h: number; hidden: boolean };
export const OVERVIEW_COLUMNS = 12;
export const OVERVIEW_ROWS = 6;
export const WIDGET_TITLES: Record<SectionId, string> = {
  actions: "Ações rápidas", today: "Reservas de hoje", floor: "Ocupação da sala",
  orders: "Pedidos ao vivo", alerts: "Notificações operacionais", dishes: "Menu Intelligence",
  status: "Estado do serviço", views: "Visualizações", kpis: "Indicadores",
  ratings: "Avaliações", service: "Relógio do serviço", menu: "Controlo do menu",
  availability: "Disponibilidade dos pratos", categories: "Categorias e menus",
  week: "Reservas dos próximos dias", orderSummary: "Resumo de pedidos", tables: "Mesas e salas",
};

const size = (id: SectionId, w: number, h: number, hidden = false): LayoutItem => ({ id, w, h, hidden });

export const DEFAULT_LAYOUT: LayoutItem[] = [
  size("actions", 12, 1),
  size("today", 4, 3),
  size("floor", 4, 3),
  size("orders", 4, 3),
  size("alerts", 4, 2),
  size("dishes", 8, 2),
  size("status", 6, 2, true),
  size("views", 6, 2, true),
  size("kpis", 6, 2, true),
  size("ratings", 6, 2, true),
  size("service", 4, 2, true),
  size("menu", 4, 2, true),
  size("availability", 4, 2, true),
  size("categories", 4, 2, true),
  size("week", 6, 2, true),
  size("orderSummary", 6, 2, true),
  size("tables", 6, 2, true),
];

const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, Math.round(v))) : fallback;

/** Migrates the old two-column layout and keeps every widget inside the fixed screen grid. */
export function normalizeLayout(v: unknown): LayoutItem[] {
  if (!Array.isArray(v)) return DEFAULT_LAYOUT;
  const out: LayoutItem[] = [];
  for (const x of v) {
    if (!x || typeof x !== "object" || !("id" in x) || !(SECTION_IDS as readonly string[]).includes(String(x.id))) continue;
    const id = x.id as SectionId;
    if (out.some((o) => o.id === id)) continue;
    const fallback = DEFAULT_LAYOUT.find((d) => d.id === id)!;
    const legacyWide = "wide" in x && x.wide === true;
    const legacyHeight = "h" in x && typeof x.h === "number"
      ? ("w" in x ? x.h : x.h >= 120 ? Math.round(x.h / 110) : fallback.h)
      : fallback.h;
    out.push({
      id,
      w: clamp("w" in x ? x.w : legacyWide ? OVERVIEW_COLUMNS : fallback.w, 2, OVERVIEW_COLUMNS, fallback.w),
      h: clamp("h" in x ? legacyHeight : fallback.h, 1, OVERVIEW_ROWS, fallback.h),
      hidden: "hidden" in x && x.hidden === true,
    });
  }
  for (const d of DEFAULT_LAYOUT) if (!out.some((o) => o.id === d.id)) out.push({ ...d });
  return out;
}
