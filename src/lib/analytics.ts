import { supabase } from "@/integrations/supabase/client";

export type Event = { event_type: string; dish_id: string | null; category_id: string | null; lang: string | null; source: string | null; query: string | null; session_id: string | null; created_at: string };

export async function fetchEvents(restaurantId: string, days = 30): Promise<Event[]> {
  const since = new Date(Date.now() - days * 864e5).toISOString();
  const out: Event[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from("analytics_events").select("event_type,dish_id,category_id,lang,source,query,session_id,created_at")
      .eq("restaurant_id", restaurantId).gte("created_at", since).order("created_at", { ascending: false }).range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < 1000 || out.length >= 20000) break;
  }
  return out;
}

export function countBy<T>(arr: T[], key: (x: T) => string | null | undefined) {
  const m = new Map<string, number>();
  for (const x of arr) {
    const k = key(x);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function lisbonParts(iso: string) {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", hour: "2-digit", weekday: "short", hour12: false }).formatToParts(new Date(iso));
  return { hour: Number(p.find((x) => x.type === "hour")?.value ?? 0) % 24, day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.find((x) => x.type === "weekday")?.value ?? "Sun") };
}

export function summarize(events: Event[]) {
  const views = events.filter((e) => e.event_type === "menu_view");
  const sessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size;
  const hours = Array(24).fill(0) as number[];
  const days = Array(7).fill(0) as number[];
  for (const v of views) { const p = lisbonParts(v.created_at); hours[p.hour]++; days[p.day]++; }
  return {
    views: views.length,
    sessions,
    topDishes: countBy(events.filter((e) => e.event_type === "dish_view"), (e) => e.dish_id),
    topCats: countBy(events.filter((e) => e.event_type === "category_view"), (e) => e.category_id),
    langs: countBy(views, (e) => e.lang),
    sources: countBy(views, (e) => e.source ?? "direct"),
    searches: countBy(events.filter((e) => e.event_type === "search"), (e) => e.query?.toLowerCase().trim()),
    recImpr: countBy(events.filter((e) => e.event_type === "rec_impression"), (e) => e.dish_id),
    recClicks: countBy(events.filter((e) => e.event_type === "rec_click"), (e) => e.dish_id),
    hours,
    days,
  };
}
