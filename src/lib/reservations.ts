export const RES_STATUSES = ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"] as const;
export type ResStatus = (typeof RES_STATUSES)[number];
export const STATUS_LABEL: Record<ResStatus, string> = { pending: "Pendente", confirmed: "Confirmada", seated: "Sentados", completed: "Concluída", cancelled: "Cancelada", no_show: "Não compareceu" };
export const BLOCKING: ResStatus[] = ["pending", "confirmed", "seated"];
/** Possible no-show: confirmed, not seated, and past start + tolerance. */
export function isLate(status: string, startsAt: string, toleranceMin: number, now = Date.now()) {
  return status === "confirmed" && now > Date.parse(startsAt) + toleranceMin * 60000;
}
export function dayRange(date: string) {
  const s = new Date(`${date}T00:00:00`); const e = new Date(s); e.setDate(e.getDate() + 1);
  return [s.toISOString(), e.toISOString()] as const;
}
export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function hhmm(iso: string) { return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" }); }
export const RES_ERRORS: Record<string, string> = { unavailable: "Sem disponibilidade para esse horário.", table_busy: "Essa mesa já está ocupada nesse horário.", contact_required: "Indique telefone ou email.", invalid: "Dados inválidos." };
export function resError(msg: string) { const k = Object.keys(RES_ERRORS).find((k) => msg.includes(k)); return k ? RES_ERRORS[k] : msg; }

export type TableState = "free" | "reserved" | "seated" | "late";
type ResLite = { id: string; table_id: string | null; status: string; starts_at: string; ends_at: string; name: string; party: number };
/** Operational state of one table, given the day's reservations. */
export function tableState(tableId: string, res: ResLite[], toleranceMin: number, now = Date.now()) {
  const mine = res.filter((x) => x.table_id === tableId && (BLOCKING as string[]).includes(x.status));
  const seated = mine.find((x) => x.status === "seated");
  const next = mine.find((x) => x.status !== "seated" && Date.parse(x.ends_at) > now);
  const late = !!next && isLate(next.status, next.starts_at, toleranceMin, now);
  const state: TableState = seated ? "seated" : late ? "late" : next ? "reserved" : "free";
  return { state, seated, next };
}
/** Customer key used to group reservation history. */
export function customerKey(x: { phone: string | null; email: string | null; name: string }) {
  return (x.phone?.replace(/\D/g, "") || x.email?.toLowerCase().trim() || x.name.toLowerCase().trim());
}
