import { CalendarDays as CalendarDaysIcon } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Minus, Trash2, Users, Clock, AlertTriangle, ExternalLink, DoorOpen, UserRound, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { canAccess } from "@/lib/team-rules";
import { FloorPlan } from "@/components/res/FloorPlan";
import { RoomControl } from "@/components/res/RoomControl";
import { TableOrderDialog } from "@/components/res/TableOrderDialog";
import { ChefHat } from "lucide-react";
import { Maximize2 } from "lucide-react";
import { Agenda, Customers, ResStats, Waitlist } from "@/components/res/Panels";
import { BLOCKING, RES_STATUSES, STATUS_LABEL, dayRange, hhmm, isLate, resError, todayStr, type ResStatus } from "@/lib/reservations";
const STATUS_CLS: Record<string, string> = { free: "border-st-free/50 bg-st-free/10", reserved: "border-st-reserved/70 bg-st-reserved/15", seated: "border-st-seated/60 bg-st-seated/10", late: "border-st-reserved bg-st-reserved/30 animate-pulse" };

export function useData(date: string) {
  const { restaurant: r } = useRestaurant();
  const [s, e] = dayRange(date);
  const zones = useQuery({ queryKey: ["zones", r.id], queryFn: async () => (await supabase.from("zones").select("*").eq("restaurant_id", r.id).order("position")).data ?? [] });
  const tables = useQuery({ queryKey: ["tables", r.id], queryFn: async () => (await supabase.from("dining_tables").select("*").eq("restaurant_id", r.id).order("position").order("label")).data ?? [] });
  const res = useQuery({ queryKey: ["reservations", r.id, date], refetchInterval: 30000, queryFn: async () => (await supabase.from("reservations").select("*").eq("restaurant_id", r.id).gte("starts_at", s).lt("starts_at", e).order("starts_at")).data ?? [] });
  return { r, zones: zones.data ?? [], tables: tables.data ?? [], res: res.data ?? [] };
}

export function Floor({ date, onBook }: { date: string; onBook: (id: string) => void }) {
  const { r, zones, tables, res } = useData(date);
  const [zone, setZone] = useState<string>("all");
  const qc = useQueryClient();
  if (!tables.length) return <Panel><p className="text-sm text-muted-foreground">Ainda não tem mesas. Crie-as no separador «Mesas e zonas».</p></Panel>;
  const shown = tables.filter((t) => t.active && (zone === "all" || t.zone_id === zone));
  const now = Date.now();
  async function setStatus(id: string, status: ResStatus) {
    await supabase.from("reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reservations", r.id] });
  }
  const [orderT, setOrderT] = useState<{ id: string; label: string } | null>(null);
  const counts = { free: 0, reserved: 0, seated: 0 };
  const cards = shown.map((t) => {
    const mine = res.filter((x) => x.table_id === t.id && BLOCKING.includes(x.status as ResStatus));
    const seated = mine.find((x) => x.status === "seated");
    const next = mine.find((x) => x.status !== "seated" && Date.parse(x.ends_at) > now);
    const late = next && isLate(next.status, next.starts_at, r.late_tolerance_minutes, now);
    const st = seated ? "seated" : late ? "late" : next ? "reserved" : "free";
    counts[st === "late" ? "reserved" : st]++;
    return { t, seated, next, st };
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap gap-1.5 text-xs">
        {([["free", counts.free, "Livres", "bg-st-free"], ["reserved", counts.reserved, "Reservadas", "bg-st-reserved"], ["seated", counts.seated, "Ocupadas", "bg-st-seated"]] as const).map(([k, n, l, dot]) => (
          <div key={k} className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 shadow-sm"><span className={`h-2 w-2 rounded-full ${dot}`} /><span className="font-semibold tabular-nums">{n}</span><span className="text-muted-foreground">{l}</span></div>
        ))}
      </div>
      {zones.length > 0 && <div className="flex gap-1 overflow-x-auto rounded-full border bg-card p-0.5">{[{ id: "all", name: "Todas" }, ...zones].map((z) => <button key={z.id} onClick={() => setZone(z.id)} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs ${zone === z.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{z.name}</button>)}</div>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ t, seated, next, st }) => (
          <div key={t.id} className={`rounded-lg border-2 p-3 ${STATUS_CLS[st]}`}>
            <div className="flex items-center justify-between"><span className="font-display text-2xl">{t.label}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{t.seats}</span></div>
            {seated && <p className="mt-1 text-xs">{seated.name} · liberta {hhmm(seated.ends_at)}</p>}
            {next && <p className="mt-1 flex items-center gap-1 text-xs">{st === "late" && <AlertTriangle className="h-3 w-3 text-st-reserved" />}<Clock className="h-3 w-3" />{hhmm(next.starts_at)} · {next.name} ({next.party})</p>}
            {!seated && !next && <p className="mt-1 text-xs text-muted-foreground">Livre</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {seated ? <><Button size="sm" className="h-7 text-xs" onClick={() => setOrderT({ id: t.id, label: t.label })}><ChefHat className="mr-1 h-3 w-3" />Pedido</Button><Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(seated.id, "completed")}>Limpar</Button></>
                : next ? <><Button size="sm" className="h-7 text-xs" onClick={() => setStatus(next.id, "seated")}>Sentar</Button>{st === "late" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(next.id, "no_show")}>No-show</Button>}</>
                : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onBook(t.id)}>Reservar / sentar</Button>}
            </div>
          </div>
        ))}
      </div>
      <TableOrderDialog restaurantId={r.id} table={orderT} onClose={() => setOrderT(null)} />
    </div>
  );
}


export function NewReservation({ date, tableId, walkin: walkin0, onClose }: { date: string; tableId?: string; walkin?: boolean; onClose: () => void }) {
  const { r, tables } = useData(date);
  const qc = useQueryClient();
  const nowT = new Date(); const def = `${String(nowT.getHours()).padStart(2, "0")}:${nowT.getMinutes() < 30 ? "30" : "00"}`;
  const [f, setF] = useState({ date, time: def, party: 2, name: "", phone: "", email: "", notes: "", table: tableId ?? "", walkin: !!walkin0 });
  const [showContact, setShowContact] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    const start = f.walkin ? new Date() : new Date(`${f.date}T${f.time}:00`);
    const { data, error } = await supabase.rpc("staff_book", { _restaurant_id: r.id, _start: start.toISOString(), _party: f.party, _name: f.name || "Cliente", _phone: f.phone, _email: f.email, _notes: f.notes, _table_id: f.table || undefined, _source: f.walkin ? "walk_in" : "staff" });
    if (!error && f.walkin && data) await supabase.from("reservations").update({ status: "seated" }).eq("id", data);
    setBusy(false);
    if (error) return toast.error(resError(error.message));
    toast.success(f.walkin ? "Cliente sentado" : "Reserva criada");
    qc.invalidateQueries({ queryKey: ["reservations", r.id] }); onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova reserva</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <button type="button" role="switch" aria-checked={f.walkin} onClick={() => { const w = !f.walkin; setF({ ...f, walkin: w }); if (!w) setShowContact(true); }} className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border px-4 py-3 text-center transition-colors ${f.walkin ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>
            <DoorOpen className={`h-5 w-5 ${f.walkin ? "text-primary-foreground" : "text-muted-foreground"}`} />
            <span className="text-sm font-semibold">Cliente à porta (sentar agora)</span>
          </button>
          {!f.walkin && <div className="grid grid-cols-2 gap-2"><div><Label>Data</Label><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></div><div><Label>Hora</Label><Input type="time" step={900} value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div></div>}
          <div>
            <Label>Pessoas</Label>
            <div className="mt-1 flex items-center justify-between rounded-xl border bg-card px-2 py-1.5">
              <button type="button" aria-label="Menos pessoas" disabled={f.party <= 1} onClick={() => setF({ ...f, party: Math.max(1, f.party - 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted disabled:opacity-40"><Minus className="h-4 w-4" /></button>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="min-w-8 text-center text-xl font-bold tabular-nums">{f.party}</span>
              </div>
              <button type="button" aria-label="Mais pessoas" disabled={f.party >= 50} onClick={() => setF({ ...f, party: Math.min(50, f.party + 1) })} className="flex h-9 w-9 items-center justify-center rounded-full border bg-background transition-colors hover:bg-muted disabled:opacity-40"><Plus className="h-4 w-4" /></button>
            </div>
          </div>
          <div>
            <Label>Mesa</Label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              <button type="button" onClick={() => setF({ ...f, table: "" })} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${f.table === "" ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>Automática</button>
              {tables.filter((t) => t.active).map((t) => (
                <button type="button" key={t.id} onClick={() => setF({ ...f, table: f.table === t.id ? "" : t.id })} className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${f.table === t.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>{t.label} <span className={`text-xs ${f.table === t.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>({t.seats})</span></button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" aria-expanded={showContact} onClick={() => setShowContact(!showContact)} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm transition-colors ${showContact || f.name || f.phone || f.email ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              <UserRound className="h-4 w-4" />Cliente{(f.name || f.phone || f.email) && !showContact ? " •" : ""}
            </button>
            <button type="button" aria-expanded={showNotes} onClick={() => setShowNotes(!showNotes)} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-sm transition-colors ${showNotes || f.notes ? "border-primary bg-primary/10 text-primary" : "bg-card text-muted-foreground hover:bg-muted"}`}>
              <StickyNote className="h-4 w-4" />Notas{f.notes && !showNotes ? " •" : ""}
            </button>
          </div>
          {showContact && (
            <div className="space-y-2 rounded-xl border bg-muted/40 p-3">
              <Input placeholder="Nome" value={f.name} required={!f.walkin} onChange={(e) => setF({ ...f, name: e.target.value })} />
              <Input type="tel" placeholder="Telefone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <Input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            </div>
          )}
          {showNotes && (
            <div className="rounded-xl border bg-muted/40 p-3">
              <Textarea placeholder="Observações" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            </div>
          )}
          <Button className="w-full" disabled={busy}>Guardar</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

