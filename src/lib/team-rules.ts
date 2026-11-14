export const PERMISSIONS = ["menus", "reservations", "room_edit", "orders", "analytics", "design", "settings"] as const;
export type Permission = (typeof PERMISSIONS)[number];
export type PermMap = Partial<Record<Permission, boolean>>;
export const PERM_LABELS: Record<Permission, { pt: string; en: string }> = {
  menus: { pt: "Menus e pratos", en: "Menus & dishes" },
  reservations: { pt: "Reservas e sala", en: "Reservations & floor" },
  room_edit: { pt: "Editar sala", en: "Edit floor plan" },
  orders: { pt: "Pedidos", en: "Orders" },
  analytics: { pt: "Análise", en: "Analytics" },
  design: { pt: "Design", en: "Design" },
  settings: { pt: "Definições", en: "Settings" },
};
/** Owners and managers see everything; team and subscription pages stay owner-only. */
export function canAccess(role: string, perms: unknown, page: Permission | "team" | "subscription"): boolean {
  if (role === "owner") return true;
  if (page === "team" || page === "subscription") return false;
  if (page === "room_edit") return !!(perms && typeof perms === "object" && (perms as PermMap).room_edit === true);
  if (role === "manager") return true;
  return !!(perms && typeof perms === "object" && (perms as PermMap)[page]);
}
export function cleanPerms(input: PermMap): PermMap {
  return Object.fromEntries(PERMISSIONS.map((p) => [p, !!input[p]]));
}
