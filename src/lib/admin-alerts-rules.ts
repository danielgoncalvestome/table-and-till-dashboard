/** Pure rules for platform/restaurant alerts (testable). */
import { deviceWarningItems } from "@/lib/orders";

export const TRIAL_WARN_DAYS = 3;
const DAY = 864e5;

export type AlertSub = { user_id: string; status: string; current_period_end: string | null; cancel_at_period_end: boolean; environment: string };
export type AlertRestaurant = { id: string; name: string; created_by: string | null; published: boolean; is_demo: boolean; trial_ends_at: string | null; created_at: string };
export type PlatformAlert = { level: "high" | "medium" | "low"; restaurantId?: string; text: string };
export type DeviceInfo = { devices: number; submitted: number | null; tables: number };

export function daysLeft(iso: string | null, now = Date.now()) {
  return iso ? Math.ceil((new Date(iso).getTime() - now) / DAY) : null;
}

export function activeSub<S extends AlertSub>(subs: S[], userId: string | null): S | undefined {
  return subs.find((s) => s.user_id === userId && s.environment === "live" && ["active", "trialing", "past_due"].includes(s.status));
}

/** Restaurant-side: warn when the free trial ends within TRIAL_WARN_DAYS and no paid plan exists. */
export function trialWarning(trialEndsAt: string | null, hasPaid: boolean, now = Date.now()) {
  if (hasPaid || !trialEndsAt) return null;
  const d = daysLeft(trialEndsAt, now)!;
  if (d < 0 || (d === 0 && new Date(trialEndsAt).getTime() < now)) return { kind: "expired" as const, days: 0 };
  if (d <= TRIAL_WARN_DAYS) return { kind: "ending" as const, days: d };
  return null;
}

export function platformAlerts(rs: AlertRestaurant[], subs: AlertSub[], unread: number, now = Date.now()): PlatformAlert[] {
  const out: PlatformAlert[] = [];
  if (unread) out.push({ level: "medium", text: `${unread} mensagem(ns) por ler` });
  for (const r of rs) {
    if (r.is_demo) continue;
    const sub = activeSub(subs, r.created_by);
    const w = trialWarning(r.trial_ends_at, !!sub, now);
    if (w?.kind === "expired") out.push({ level: "high", restaurantId: r.id, text: `${r.name}: período experimental terminou sem subscrição` });
    if (w?.kind === "ending") out.push({ level: "medium", restaurantId: r.id, text: `${r.name}: período experimental termina em ${w.days} dia(s)` });
    if (sub?.status === "past_due") out.push({ level: "high", restaurantId: r.id, text: `${r.name}: pagamento em atraso` });
    if (sub?.cancel_at_period_end) out.push({ level: "medium", restaurantId: r.id, text: `${r.name}: subscrição cancela em ${daysLeft(sub.current_period_end, now) ?? "?"} dia(s)` });
    else if (sub && sub.current_period_end && (daysLeft(sub.current_period_end, now) ?? 99) <= 3) out.push({ level: "low", restaurantId: r.id, text: `${r.name}: renovação em ${daysLeft(sub.current_period_end, now)} dia(s)` });
    if (!r.published && !r.trial_ends_at && now - new Date(r.created_at).getTime() > 7 * DAY) out.push({ level: "low", restaurantId: r.id, text: `${r.name}: criado há mais de 7 dias e nunca publicado` });
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}
