import { Link, useNavigate } from "@tanstack/react-router";
import { Check, Grid2X2, Pencil, Plus, RotateCcw, Settings2 } from "lucide-react";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DOCK_ACTIONS, MAX_DOCK_ACTIONS, type DockAction, type DockActionId } from "@/lib/dock-actions";
import { OVERVIEW_COLUMNS, OVERVIEW_ROWS, WIDGET_TITLES } from "@/lib/overview-layout";
import { useDashboardCustomization } from "./DashboardCustomization";

export function QuickActionIcon({ action, className = "" }: { action: DockAction; className?: string }) {
  const Icon = action.icon;
  return (
    <span className={`dock-action-icon ${className}`} style={{ color: action.color }} aria-hidden="true">
      <Icon className="h-[52%] w-[52%]" strokeWidth={1.8} />
      {action.plus && <span className="dock-action-plus" style={{ backgroundColor: action.color }}><Plus className="dock-action-plus-icon h-3 w-3" strokeWidth={3} /></span>}
    </span>
  );
}

function ActionDestination({ id, children }: { id: DockActionId; children: React.ReactNode }) {
  const props = { className: "dock-item relative flex flex-col items-center", "aria-label": DOCK_ACTIONS.find((a) => a.id === id)?.label };
  switch (id) {
    case "new-reservation": return <Link to="/dashboard/reservations" search={{ nova: 1 }} {...props}>{children}</Link>;
    case "orders": return <Link to="/dashboard/orders" search={{ full: 1 }} {...props}>{children}</Link>;
    case "room": return <Link to="/dashboard/room" search={{ full: 1 }} {...props}>{children}</Link>;
    case "new-dish": return <Link to="/dashboard/menus" {...props}>{children}</Link>;
    case "menus": return <Link to="/dashboard/menus" {...props}>{children}</Link>;
    case "design": return <Link to="/dashboard/design" {...props}>{children}</Link>;
    case "intelligence": return <Link to="/dashboard/intelligence" {...props}>{children}</Link>;
    case "analytics": return <Link to="/dashboard/analytics" {...props}>{children}</Link>;
  }
}

export function DockQuickActions() {
  const { actions } = useDashboardCustomization();
  return <>{actions.map((id) => {
    const action = DOCK_ACTIONS.find((a) => a.id === id);
    if (!action) return null;
    return <ActionDestination key={id} id={id}><QuickActionIcon action={action} className="h-12 w-12" /><span className="mt-0.5 h-1 w-1 rounded-full bg-transparent" /></ActionDestination>;
  })}</>;
}

export function DockConfigurator() {
  const { configOpen, setConfigOpen, actions, toggleAction, layout, patchWidget, editing, setEditing, resetLayout, setAsDefault, isAdmin } = useDashboardCustomization();
  const [tab, setTab] = useState<"actions" | "widgets">("actions");
  const navigate = useNavigate();
  const selected = new Set(actions);
  const editGrid = () => {
    setConfigOpen(false);
    setEditing(true);
    navigate({ to: "/dashboard" });
  };
  return (
    <>
      <button type="button" className="dock-item mb-1.5 grid h-12 w-12 place-items-center rounded-xl text-muted-foreground" onClick={() => setConfigOpen(true)} title="Personalizar Dock e widgets" aria-label="Personalizar Dock e widgets"><Settings2 className="h-5 w-5" /></button>
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="max-w-2xl gap-5 p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle>Personalizar o seu espaço</DialogTitle>
            <DialogDescription>Escolha as ações da Dock e os widgets que quer ter sempre à vista.</DialogDescription>
          </DialogHeader>
          <div className="inline-flex w-fit rounded-xl bg-muted p-1" role="tablist" aria-label="Personalização">
            <button role="tab" aria-selected={tab === "actions"} onClick={() => setTab("actions")} className="rounded-lg px-3 py-1.5 text-sm">Ações na Dock</button>
            <button role="tab" aria-selected={tab === "widgets"} onClick={() => setTab("widgets")} className="rounded-lg px-3 py-1.5 text-sm">Catálogo de widgets</button>
          </div>
          {tab === "actions" ? (
            <div>
              <p className="mb-3 text-xs text-muted-foreground">{actions.length} de {MAX_DOCK_ACTIONS} ações escolhidas. Os atalhos ficam separados da navegação principal.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {DOCK_ACTIONS.map((action) => (
                  <button key={action.id} type="button" onClick={() => toggleAction(action.id)} aria-pressed={selected.has(action.id)} className="flex items-center gap-3 rounded-xl border p-2.5 text-left">
                    <QuickActionIcon action={action} className="h-10 w-10 shrink-0" />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{action.label}</span>
                    <Switch checked={selected.has(action.id)} tabIndex={-1} className="pointer-events-none" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">Mostre, esconda e dimensione os cartões. No telemóvel, deslize entre widgets.</p>
                <Button size="sm" variant="ghost" onClick={editGrid}><Pencil className="h-4 w-4" />{editing ? "Continuar edição" : "Editar disposição"}</Button>
              </div>
              <div className="grid max-h-[45dvh] gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
                {layout.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-xl border px-3 py-2">
                    <Grid2X2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate text-sm">{WIDGET_TITLES[item.id]}</span>
                    <span className="hidden text-[10px] tabular-nums text-muted-foreground sm:inline">{item.w}/{OVERVIEW_COLUMNS} · {item.h}/{OVERVIEW_ROWS}</span>
                    <Switch checked={!item.hidden} onCheckedChange={(v) => patchWidget(item.id, { hidden: !v })} aria-label={`${item.hidden ? "Mostrar" : "Esconder"} ${WIDGET_TITLES[item.id]}`} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
            <Button variant="ghost" size="sm" onClick={resetLayout}><RotateCcw className="h-4 w-4" />Repor widgets</Button>
            {isAdmin && <Button variant="ghost" size="sm" onClick={() => void setAsDefault()}><Check className="h-4 w-4" />Predefinição da plataforma</Button>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
