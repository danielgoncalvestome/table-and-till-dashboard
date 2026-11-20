import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { canAccess } from "@/lib/team-rules";
import { FloorPlan } from "@/components/res/FloorPlan";
import { RoomControl } from "@/components/res/RoomControl";
import { Floor, NewReservation } from "@/components/res/RoomShared";
import { todayStr } from "@/lib/reservations";

export const Route = createFileRoute("/_authenticated/dashboard/room")({
  head: () => ({ meta: [{ title: "Salas — Crumb" }, { name: "description", content: "Controlo da sala em tempo real: planta, mesas e ações rápidas." }, { property: "og:title", content: "Salas — Crumb" }, { property: "og:description", content: "Controlo da sala em tempo real: planta, mesas e ações rápidas." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { full?: 1 } => (s.full ? { full: 1 } : {}),
  component: Room,
});

function enterFs() {
  const el = document.documentElement;
  if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
}
function exitFs() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

function Room() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { restaurant: r, refresh } = useRestaurant();
  const canEditRoom = canAccess(r.role, r.permissions, "room_edit");
  const [date, setDate] = useState(todayStr());
  const [editPlan, setEditPlan] = useState(false);
  const [full, setFull] = useState(!!search.full);
  const [open, setOpen] = useState<{ tableId?: string; walkin?: boolean } | null>(null);
  const adv = r.res_mode === "advanced";

  useEffect(() => { if (search.full) enterFs(); }, [search.full]);
  function openFull() { enterFs(); setFull(true); }
  function closeFull() { exitFs(); setFull(false); if (search.full) navigate({ to: "/dashboard/room", search: {}, replace: true }); }

  async function submitPlan() {
    if (!canEditRoom) return;
    if (!confirm("Enviar a planta atual à Crumb para contabilizar os dispositivos (1 por mesa ativa)?")) return;
    const { data, error } = await supabase.rpc("submit_floor_plan", { _restaurant_id: r.id });
    if (error) return toast.error(error.message);
    toast.success(`Planta submetida: ${data} mesas`);
  }
  async function setMode(m: string) { if (!canEditRoom) return; const { error } = await supabase.rpc("set_room_mode", { _restaurant_id: r.id, _mode: m }); if (error) return toast.error(error.message); refresh(); }

  return (
    <div>
      <PageTitle icon={LayoutGrid} title="Salas" sub="Controlo da sala, planta e mesas em tempo real." action={<div className="flex gap-2">{canEditRoom && <Button size="sm" variant="outline" onClick={submitPlan}>Submeter planta</Button>}<Button size="sm" onClick={openFull}><Maximize2 className="h-4 w-4" />Ecrã inteiro</Button></div>} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />
        {adv && canEditRoom && <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">{([[false, "Operacional"], [true, "Editar planta"]] as const).map(([k, l]) => <Button variant={editPlan === k ? "secondary" : "ghost"} size="sm" key={String(k)} onClick={() => setEditPlan(k)}>{l}</Button>)}</div>}
        {canEditRoom && <div className="ml-auto inline-flex rounded-md border bg-card p-0.5 text-xs" role="group" aria-label="Modo">
          {[["simple", "Modo simples"], ["advanced", "Modo avançado"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`rounded px-3 py-1 ${r.res_mode === k ? "bg-foreground text-background" : ""}`}>{l}</button>)}
        </div>}
      </div>
      {adv ? <FloorPlan date={date} live={!editPlan || !canEditRoom} onBook={(tableId) => setOpen({ tableId })} /> : <Floor date={date} onBook={(tableId) => setOpen({ tableId })} />}
      {full && <RoomControl onClose={closeFull} onBook={(tableId, walkin) => setOpen({ tableId, walkin })} onWaitlist={() => { closeFull(); navigate({ to: "/dashboard/reservations", search: { tab: "wait" } }); }} />}
      {open && <NewReservation date={date} tableId={open.tableId} walkin={open.walkin} onClose={() => setOpen(null)} />}
    </div>
  );
}
