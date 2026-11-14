import { supabase } from "@/integrations/supabase/client";
import type { CartLine } from "@/lib/orders";

export type ResRow = { starts_at: string; created_at: string; party: number; status: string; source: string; phone: string | null; email: string | null; name: string };
export type OrderRow = { created_at: string; status: string; total: number; items: unknown };

const since = (days: number) => new Date(Date.now() - days * 864e5).toISOString();
export async function fetchReservations(restaurantId: string, days: number): Promise<ResRow[]> {
  const { data } = await supabase.from("reservations").select("starts_at,created_at,party,status,source,phone,email,name")
    .eq("restaurant_id", restaurantId).gte("starts_at", since(days)).lte("starts_at", new Date(Date.now() + 30 * 864e5).toISOString()).limit(5000);
  return data ?? [];
}
export async function fetchOrders(restaurantId: string, days: number): Promise<OrderRow[]> {
  const { data } = await supabase.from("table_orders").select("created_at,status,total,items").eq("restaurant_id", restaurantId).gte("created_at", since(days)).limit(5000);
  return data ?? [];
}

function lisbon(iso: string) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", weekday: "short", hour12: false }).formatToParts(new Date(iso));
  return { hour: Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24, day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.find((x) => x.type === "weekday")?.value ?? "Sun") };
}

/** Reservation stats; only past-or-today reservations count toward no-show rate. */
export function summarizeReservations(rows: ResRow[], now = Date.now()) {
  const valid = rows.filter((r) => r.status !== "cancelled");
  const past = rows.filter((r) => new Date(r.starts_at).getTime() <= now && ["completed", "seated", "no_show"].includes(r.status));
  const noShows = past.filter((r) => r.status === "no_show").length;
  const hours = Array(24).fill(0) as number[];
  const days = Array(7).fill(0) as number[];
  for (const r of valid) { const p = lisbon(r.starts_at); hours[p.hour] += r.party; days[p.day] += r.party; }
  const status: Record<string, number> = {};
  for (const r of rows) status[r.status] = (status[r.status] ?? 0) + 1;
  const src: Record<string, number> = {};
  for (const r of valid) src[r.source] = (src[r.source] ?? 0) + 1;
  const party: Record<string, number> = {};
  for (const r of valid) { const k = r.party >= 7 ? "7+" : String(r.party); party[k] = (party[k] ?? 0) + 1; }
  const visits = new Map<string, number>();
  for (const r of valid) { const k = (r.phone || r.email || r.name).toLowerCase().trim(); visits.set(k, (visits.get(k) ?? 0) + 1); }
  const lead = valid.map((r) => (new Date(r.starts_at).getTime() - new Date(r.created_at).getTime()) / 864e5).filter((x) => x >= 0);
  const upcoming = valid.filter((r) => new Date(r.starts_at).getTime() > now && ["pending", "confirmed"].includes(r.status));
  return {
    total: valid.length,
    covers: valid.reduce((a, r) => a + r.party, 0),
    avgParty: valid.length ? valid.reduce((a, r) => a + r.party, 0) / valid.length : 0,
    noShowRate: past.length ? noShows / past.length : 0,
    cancelRate: rows.length ? (status.cancelled ?? 0) / rows.length : 0,
    onlineShare: valid.length ? (src.online ?? src.public ?? 0) / valid.length : 0,
    returning: [...visits.values()].filter((v) => v > 1).length,
    customers: visits.size,
    avgLeadDays: lead.length ? lead.reduce((a, b) => a + b, 0) / lead.length : 0,
    pending: rows.filter((r) => r.status === "pending" && new Date(r.starts_at).getTime() > now).length,
    upcomingCovers: upcoming.reduce((a, r) => a + r.party, 0),
    hours, days, status, sources: src, party,
  };
}

export function summarizeOrders(rows: OrderRow[]) {
  const ok = rows.filter((o) => o.status !== "cancelled");
  const revenue = ok.reduce((a, o) => a + Number(o.total), 0);
  const dish = new Map<string, number>();
  const hours = Array(24).fill(0) as number[];
  for (const o of ok) {
    hours[lisbon(o.created_at).hour]++;
    for (const l of (Array.isArray(o.items) ? o.items : []) as CartLine[]) dish.set(l.name, (dish.get(l.name) ?? 0) + (l.qty || 1));
  }
  return { count: ok.length, cancelled: rows.length - ok.length, revenue, avg: ok.length ? revenue / ok.length : 0, topItems: [...dish.entries()].sort((a, b) => b[1] - a[1]), hours };
}

const WD = { pt: ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"], en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] };
const pctf = (x: number) => `${Math.round(x * 100)}%`;
const argmax = (a: number[]) => a.indexOf(Math.max(...a));

export function reservationInsights(s: ReturnType<typeof summarizeReservations>, pt = true): string[] {
  const out: string[] = [];
  if (!s.total) return out;
  out.push(pt ? `Dia mais forte: ${WD.pt[argmax(s.days)]}; pico de pessoas por volta das ${argmax(s.hours)}h.` : `Busiest day: ${WD.en[argmax(s.days)]}; peak covers around ${argmax(s.hours)}:00.`);
  if (s.noShowRate >= 0.1) out.push(pt ? `Taxa de não comparência de ${pctf(s.noShowRate)}. Considere confirmar reservas por telefone no próprio dia.` : `No-show rate of ${pctf(s.noShowRate)}. Consider confirming bookings by phone on the day.`);
  else if (s.noShowRate > 0) out.push(pt ? `Não comparências controladas: ${pctf(s.noShowRate)}.` : `No-shows under control: ${pctf(s.noShowRate)}.`);
  if (s.pending) out.push(pt ? `${s.pending} reserva(s) futura(s) ainda por confirmar.` : `${s.pending} upcoming booking(s) still pending.`);
  if (s.customers && s.returning) out.push(pt ? `${s.returning} cliente(s) voltaram a reservar (${pctf(s.returning / s.customers)} dos clientes).` : `${s.returning} returning customer(s) (${pctf(s.returning / s.customers)}).`);
  out.push(pt ? `Grupo médio de ${s.avgParty.toFixed(1)} pessoas; reservam em média com ${s.avgLeadDays.toFixed(1)} dia(s) de antecedência.` : `Average party of ${s.avgParty.toFixed(1)}; booked ${s.avgLeadDays.toFixed(1)} day(s) ahead on average.`);
  if (s.upcomingCovers) out.push(pt ? `${s.upcomingCovers} pessoa(s) já esperadas nas próximas reservas.` : `${s.upcomingCovers} guest(s) expected in upcoming bookings.`);
  return out;
}

type MenuSummary = { views: number; hours: number[]; topDishes: [string, number][]; topCats: [string, number][]; recClicks: [string, number][]; searches: [string, number][] };
type Cat = { dishes: { id: string; name: string; image_url: string | null }[]; cats: { id: string; name: string }[] };
export function menuInsights(s: MenuSummary, cat: Cat, pt = true): string[] {
  const out: string[] = [];
  const dn = (id: string) => cat.dishes.find((d) => d.id === id)?.name ?? "—";
  if (s.topDishes[0]) out.push(pt ? `“${dn(s.topDishes[0][0])}” é o prato mais consultado (${s.topDishes[0][1]} visualizações).` : `“${dn(s.topDishes[0][0])}” is the most viewed dish (${s.topDishes[0][1]} views).`);
  const viewed = new Set(s.topCats.map(([k]) => k));
  const unexplored = cat.cats.filter((c) => !viewed.has(c.id));
  if (s.views > 0 && unexplored.length) out.push(pt ? `Categorias pouco exploradas: ${unexplored.map((c) => c.name).join(", ")}. Considere destacá-las.` : `Least explored categories: ${unexplored.map((c) => c.name).join(", ")}. Consider featuring them.`);
  if (s.views > 0) out.push(pt ? `Maior procura do menu por volta das ${argmax(s.hours)}h.` : `Menu peak around ${argmax(s.hours)}:00.`);
  if (s.recClicks[0]) out.push(pt ? `A recomendação mais clicada é “${dn(s.recClicks[0][0])}”.` : `Most clicked recommendation: “${dn(s.recClicks[0][0])}”.`);
  if (s.searches[0]) out.push(pt ? `Pesquisa mais feita: “${s.searches[0][0]}”.` : `Top search: “${s.searches[0][0]}”.`);
  const noPhoto = s.topDishes.slice(0, 5).filter(([id]) => !cat.dishes.find((d) => d.id === id)?.image_url);
  if (noPhoto.length) out.push(pt ? `Pratos populares sem fotografia: ${noPhoto.map(([id]) => dn(id)).join(", ")}.` : `Popular dishes without a photo: ${noPhoto.map(([id]) => dn(id)).join(", ")}.`);
  return out;
}

/** Decides which half-width items must stretch to full width so the 2-column grid has no empty cells. */
export function fillRows(items: { wide: boolean }[]): boolean[] {
  const out = items.map((x) => x.wide);
  let col = 0;
  for (let i = 0; i < items.length; i++) {
    if (out[i]) { col = 0; continue; }
    if (col === 0 && (i === items.length - 1 || out[i + 1])) { out[i] = true; continue; }
    col = col === 0 ? 1 : 0;
  }
  return out;
}
