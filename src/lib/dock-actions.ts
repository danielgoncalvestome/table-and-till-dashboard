import { BarChart3, BookOpen, Brain, CalendarPlus, ChefHat, LayoutGrid, Palette, UtensilsCrossed, type LucideIcon } from "lucide-react";

export const MAX_DOCK_ACTIONS = 6;
export const DOCK_ACTION_IDS = ["new-reservation", "orders", "room", "new-dish", "menus", "design", "intelligence", "analytics"] as const;
export type DockActionId = (typeof DOCK_ACTION_IDS)[number];
export type DockAction = { id: DockActionId; label: string; icon: LucideIcon; color: string; plus?: boolean };

export const DOCK_ACTIONS: DockAction[] = [
  { id: "new-reservation", label: "Nova reserva", icon: CalendarPlus, color: "#ff3b30", plus: true },
  { id: "orders", label: "Pedidos ao vivo", icon: ChefHat, color: "#ff2d55" },
  { id: "room", label: "Abrir sala", icon: LayoutGrid, color: "#248a3d" },
  { id: "new-dish", label: "Novo prato", icon: UtensilsCrossed, color: "#ff9f0a", plus: true },
  { id: "menus", label: "Gerir menus", icon: BookOpen, color: "#ff9f0a" },
  { id: "design", label: "Editar design", icon: Palette, color: "#bf5af2" },
  { id: "intelligence", label: "Menu Intelligence", icon: Brain, color: "#5856d6" },
  { id: "analytics", label: "Abrir análise", icon: BarChart3, color: "#007aff" },
];

export const DEFAULT_DOCK_ACTIONS: DockActionId[] = ["new-reservation", "orders", "room"];

export function normalizeDockActions(v: unknown): DockActionId[] {
  if (!Array.isArray(v)) return [...DEFAULT_DOCK_ACTIONS];
  const valid = v.filter((x): x is DockActionId => typeof x === "string" && (DOCK_ACTION_IDS as readonly string[]).includes(x));
  return [...new Set(valid)].slice(0, MAX_DOCK_ACTIONS);
}

export function toggleDockAction(current: DockActionId[], id: DockActionId): DockActionId[] {
  if (current.includes(id)) return current.filter((x) => x !== id);
  return current.length >= MAX_DOCK_ACTIONS ? current : [...current, id];
}
