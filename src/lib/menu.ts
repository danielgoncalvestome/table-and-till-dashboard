import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "./i18n";

export const ALLERGENS = [
  { id: "gluten", pt: "Glúten", en: "Gluten" },
  { id: "crustaceans", pt: "Crustáceos", en: "Crustaceans" },
  { id: "eggs", pt: "Ovos", en: "Eggs" },
  { id: "fish", pt: "Peixe", en: "Fish" },
  { id: "peanuts", pt: "Amendoins", en: "Peanuts" },
  { id: "soy", pt: "Soja", en: "Soy" },
  { id: "milk", pt: "Leite", en: "Milk" },
  { id: "nuts", pt: "Frutos de casca rija", en: "Tree nuts" },
  { id: "celery", pt: "Aipo", en: "Celery" },
  { id: "mustard", pt: "Mostarda", en: "Mustard" },
  { id: "sesame", pt: "Sésamo", en: "Sesame" },
  { id: "sulphites", pt: "Sulfitos", en: "Sulphites" },
  { id: "lupin", pt: "Tremoço", en: "Lupin" },
  { id: "molluscs", pt: "Moluscos", en: "Molluscs" },
] as const;

export const DIETARY = [
  { id: "vegetarian", pt: "Vegetariano", en: "Vegetarian" },
  { id: "vegan", pt: "Vegan", en: "Vegan" },
  { id: "gluten_free", pt: "Sem glúten", en: "Gluten-free" },
  { id: "lactose_free", pt: "Sem lactose", en: "Lactose-free" },
  { id: "spicy", pt: "Picante", en: "Spicy" },
  { id: "organic", pt: "Biológico", en: "Organic" },
] as const;

export const MENU_KINDS = [
  { id: "all_day", pt: "Todo o dia", en: "All day" },
  { id: "lunch", pt: "Almoço", en: "Lunch" },
  { id: "dinner", pt: "Jantar", en: "Dinner" },
  { id: "brunch", pt: "Brunch", en: "Brunch" },
  { id: "drinks", pt: "Bebidas", en: "Drinks" },
  { id: "happy_hour", pt: "Happy hour", en: "Happy hour" },
  { id: "seasonal", pt: "Sazonal", en: "Seasonal" },
  { id: "specials", pt: "Pratos do dia", en: "Daily specials" },
] as const;

export const FONTS = [
  { id: "serif", label: "Fraunces", css: "'Fraunces', Georgia, serif" },
  { id: "classic", label: "Cormorant", css: "'Cormorant Garamond', Georgia, serif" },
  { id: "sans", label: "Manrope", css: "'Manrope', system-ui, sans-serif" },
  { id: "modern", label: "Space Grotesk", css: "'Space Grotesk', system-ui, sans-serif" },
] as const;

export const TEMPLATES = [
  { id: "minimalist", pt: "Minimalista", en: "Minimalist", primary: "#18352B", bg: "#F6F3EC", accent: "#8FA68E", font: "serif" },
  { id: "elegant", pt: "Elegante", en: "Elegant", primary: "#2B2320", bg: "#FBF8F2", accent: "#B08D57", font: "classic" },
  { id: "cafe", pt: "Café moderno", en: "Modern café", primary: "#3A2E26", bg: "#F3EEE6", accent: "#C46A3A", font: "modern" },
  { id: "premium", pt: "Restaurante premium", en: "Premium restaurant", primary: "#E9E2D3", bg: "#151A17", accent: "#B9A26C", font: "classic" },
] as const;

export const WEEKDAYS = { pt: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };

export function labelOf(list: readonly { id: string; pt: string; en: string }[], id: string, lang: Lang) {
  return list.find((x) => x.id === id)?.[lang] ?? id;
}

export function tr(base: string | null | undefined, i18n: unknown, lang: Lang): string {
  if (lang === "pt") return base ?? "";
  const v = (i18n as Record<string, string> | null)?.[lang];
  return v && v.trim() ? v : (base ?? "");
}

export function formatPrice(n: number | string | null | undefined, lang: Lang = "pt") {
  if (n === null || n === undefined || n === "") return "";
  return new Intl.NumberFormat(lang === "pt" ? "pt-PT" : "en-IE", { style: "currency", currency: "EUR" }).format(Number(n));
}

export function formatDate(d: string | Date, lang: Lang = "pt") {
  return new Intl.DateTimeFormat(lang === "pt" ? "pt-PT" : "en-GB", { dateStyle: "medium", timeZone: "Europe/Lisbon" }).format(new Date(d));
}

export function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Lisbon wall-clock: weekday (0=Sun) and minutes since midnight. */
export function lisbonNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Lisbon", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(date);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd), minutes: h * 60 + m };
}

function toMin(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

/** Whether a menu is active now according to its schedule (Europe/Lisbon). Overnight ranges supported. */
export function isMenuActive(
  menu: { schedule_days: number[]; schedule_start: string | null; schedule_end: string | null },
  date = new Date(),
) {
  const { day, minutes } = lisbonNow(date);
  if (!menu.schedule_start || !menu.schedule_end) return menu.schedule_days.includes(day);
  const s = toMin(menu.schedule_start);
  const e = toMin(menu.schedule_end);
  if (s <= e) return menu.schedule_days.includes(day) && minutes >= s && minutes < e;
  // overnight: started yesterday or today
  if (minutes >= s) return menu.schedule_days.includes(day);
  return menu.schedule_days.includes((day + 6) % 7) && minutes < e;
}

export function getSessionId() {
  let id = sessionStorage.getItem("mt-sid");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("mt-sid", id);
  }
  return id;
}

export function getRaterId() {
  let id = localStorage.getItem("mt-rater");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("mt-rater", id);
  }
  return id;
}

type EventType =
  | "menu_view" | "dish_view" | "category_view" | "search" | "rec_impression" | "rec_click"
  | "language_change" | "call_click" | "instagram_click" | "reviews_click";

export function track(restaurantId: string, event_type: EventType, extra: { dish_id?: string; category_id?: string; lang?: string; query?: string; source?: string } = {}) {
  try {
    void supabase.from("analytics_events").insert({ restaurant_id: restaurantId, event_type, session_id: getSessionId(), ...extra, query: extra.query?.slice(0, 80) });
  } catch {
    /* analytics must never break the menu */
  }
}

/** Upload to private bucket and return a long-lived signed URL usable on the public menu. */
export async function uploadImage(restaurantId: string, file: File) {
  if (file.size > 5 * 1024 * 1024) throw new Error("max 5MB");
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${restaurantId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("menu-images").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { data, error: e2 } = await supabase.storage.from("menu-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !data) throw e2 ?? new Error("url");
  return data.signedUrl;
}
