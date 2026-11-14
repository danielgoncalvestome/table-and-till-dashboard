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
