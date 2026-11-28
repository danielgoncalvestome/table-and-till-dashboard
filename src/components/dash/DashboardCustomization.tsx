import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useRestaurant } from "@/lib/restaurant";
import { DEFAULT_LAYOUT, normalizeLayout, type LayoutItem, type SectionId } from "@/lib/overview-layout";
import { DEFAULT_DOCK_ACTIONS, normalizeDockActions, toggleDockAction, type DockActionId } from "@/lib/dock-actions";

type DashboardCustomizationValue = {
  layout: LayoutItem[];
  editing: boolean;
  setEditing: (v: boolean) => void;
  saveLayout: (layout: LayoutItem[]) => void;
  patchWidget: (id: SectionId, patch: Partial<Omit<LayoutItem, "id">>) => void;
  moveWidget: (from: SectionId, to: SectionId) => void;
  resetLayout: () => void;
  setAsDefault: () => Promise<void>;
  isAdmin: boolean;
  actions: DockActionId[];
  toggleAction: (id: DockActionId) => void;
  configOpen: boolean;
  setConfigOpen: (v: boolean) => void;
};

const Ctx = createContext<DashboardCustomizationValue | null>(null);

export function DashboardCustomizationProvider({ children }: { children: ReactNode }) {
  const { restaurant: r } = useRestaurant();
  const { data: admin } = useIsAdmin();
  const isAdmin = !!admin;
  const storeKey = `mt-overview-layout-${r.id}`;
  const actionKey = `mt-dock-actions-${r.id}`;
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [actions, setActions] = useState<DockActionId[]>(DEFAULT_DOCK_ACTIONS);
  const [editing, setEditing] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const { data: platformDefault, refetch } = useQuery({
    queryKey: ["default-overview-layout"],
    queryFn: async () => (await supabase.rpc("default_overview_layout")).data ?? null,
  });
  const baseLayout = useMemo(() => {
    const modern = Array.isArray(platformDefault) && platformDefault.some((x) => x && typeof x === "object" && "w" in x);
    return modern ? normalizeLayout(platformDefault) : DEFAULT_LAYOUT;
  }, [platformDefault]);

  useEffect(() => {
    if (platformDefault === undefined) return;
    const raw = localStorage.getItem(storeKey);
    try { setLayout(raw ? normalizeLayout(JSON.parse(raw)) : baseLayout); } catch { setLayout(baseLayout); }
    setEditing(false);
  }, [storeKey, platformDefault, baseLayout]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(actionKey);
      setActions(raw ? normalizeDockActions(JSON.parse(raw)) : [...DEFAULT_DOCK_ACTIONS]);
    } catch { setActions([...DEFAULT_DOCK_ACTIONS]); }
  }, [actionKey]);

  const saveLayout = (next: LayoutItem[]) => {
    const normalized = normalizeLayout(next);
    setLayout(normalized);
    localStorage.setItem(storeKey, JSON.stringify(normalized));
  };
  const patchWidget = (id: SectionId, patch: Partial<Omit<LayoutItem, "id">>) => saveLayout(layout.map((x) => x.id === id ? { ...x, ...patch } : x));
  const moveWidget = (from: SectionId, to: SectionId) => {
    if (from === to) return;
    const next = [...layout];
    const a = next.findIndex((x) => x.id === from);
    const [item] = next.splice(a, 1);
    if (!item) return;
    const b = next.findIndex((x) => x.id === to);
    next.splice(a <= b ? b + 1 : b, 0, item);
    saveLayout(next);
  };
  const resetLayout = () => saveLayout(baseLayout.map((x) => ({ ...x })));
  const setAsDefault = async () => {
    const { error } = await supabase.from("platform_settings").update({ overview_layout: layout as never, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) { toast.error(error.message); return; }
    toast.success("Disposição definida como predefinida para todos os restaurantes");
    await refetch();
  };
  const toggleAction = (id: DockActionId) => {
    const next = toggleDockAction(actions, id);
    if (next === actions) return toast.info(`Pode escolher até 6 ações rápidas.`);
    setActions(next);
    localStorage.setItem(actionKey, JSON.stringify(next));
  };

  return <Ctx.Provider value={{ layout, editing, setEditing, saveLayout, patchWidget, moveWidget, resetLayout, setAsDefault, isAdmin, actions, toggleAction, configOpen, setConfigOpen }}>{children}</Ctx.Provider>;
}

export function useDashboardCustomization() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useDashboardCustomization outside provider");
  return value;
}
