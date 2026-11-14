export type CartLine = { dish_id: string; name: string; price: number; qty: number; note: string };
export type OrderOptions = { statuses: boolean; sound: boolean; notes: boolean; bill: boolean };
export const ORDER_STATUSES = ["new", "preparing", "ready", "delivered", "cancelled"] as const;
export const ORDER_STATUS_LABEL = {
  pt: { new: "Novo", preparing: "Em preparação", ready: "Pronto", delivered: "Entregue", cancelled: "Cancelado" },
  en: { new: "New", preparing: "Preparing", ready: "Ready", delivered: "Delivered", cancelled: "Cancelled" },
};
export function orderOptions(v: unknown): OrderOptions {
  const o = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  const b = (k: string) => o[k] !== false;
  return { statuses: b("statuses"), sound: b("sound"), notes: b("notes"), bill: b("bill") };
}
export function cartTotal(lines: { price: number; qty: number }[]) {
  return Math.round(lines.reduce((a, l) => a + l.price * l.qty, 0) * 100) / 100;
}
/** Warn admin when the active table count no longer matches the submitted plan or the devices sent. */
export type DeviceWarning = { kind: "plan_changed" | "device_mismatch"; text: string };
export function deviceWarningItems(activeTables: number, submitted: number | null | undefined, devices: number): DeviceWarning[] {
  const w: DeviceWarning[] = [];
  if (submitted != null && submitted !== activeTables) w.push({ kind: "plan_changed", text: `A planta mudou: ${activeTables} mesas ativas, ${submitted} na última submissão.` });
  if (devices !== activeTables) w.push({ kind: "device_mismatch", text: `Dispositivos (${devices}) diferente do número de mesas ativas (${activeTables}).` });
  return w;
}
export function deviceWarnings(activeTables: number, submitted: number | null | undefined, devices: number) {
  return deviceWarningItems(activeTables, submitted, devices).map((w) => w.text);
}
