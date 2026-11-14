import { createFileRoute } from "@tanstack/react-router";
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
import { Agenda, Customers, ResStats, Waitlist } from "@/components/res/Panels";
import { BLOCKING, RES_STATUSES, STATUS_LABEL, dayRange, hhmm, isLate, resError, todayStr, type ResStatus } from "@/lib/reservations";

export const Route = createFileRoute("/_authenticated/dashboard/reservations")({
  head: () => ({ meta: [{ title: "Reservas e mesas — MenuTap" }, { name: "description", content: "Gira reservas, mesas e zonas do restaurante." }, { property: "og:title", content: "Reservas e mesas — MenuTap" }, { property: "og:description", content: "Gira reservas, mesas e zonas do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { nova?: 1 } => (s.nova ? { nova: 1 } : {}),
  component: Reservations,
});

const TABS = [["today", "Sala"], ["list", "Reservas"], ["agenda", "Agenda"], ["wait", "Espera"], ["clients", "Clientes"], ["stats", "Estatísticas"], ["tables", "Mesas e zonas"], ["settings", "Regras"]] as const;
const STATUS_CLS: Record<string, string> = { free: "border-st-free/50 bg-st-free/10", reserved: "border-st-reserved/70 bg-st-reserved/15", seated: "border-st-seated/60 bg-st-seated/10", late: "border-st-reserved bg-st-reserved/30 animate-pulse" };

function Reservations() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("today");
  const [date, setDate] = useState(todayStr());
  const search = Route.useSearch();
  const [open, setOpen] = useState<{ tableId?: string } | null>(search.nova ? {} : null);
  const { restaurant: r, refresh } = useRestaurant();
  const canEditRoom = canAccess(r.role, r.permissions, "room_edit");
  const [editPlan, setEditPlan] = useState(false);
  const adv = r.res_mode === "advanced";
  async function submitPlan() {
    if (!canEditRoom) return;
    if (!confirm("Enviar a planta atual à MenuTap para contabilizar os dispositivos (1 por mesa ativa)?")) return;
    const { data, error } = await supabase.rpc("submit_floor_plan", { _restaurant_id: r.id });
    if (error) return toast.error(error.message);
    toast.success(`Planta submetida: ${data} mesas`);
  }
  async function setMode(m: string) { if (!canEditRoom) return; await supabase.from("restaurants").update({ res_mode: m }).eq("id", r.id); refresh(); }
  return (
    <div>
      <PageTitle title="Reservas" sub="Mesas, reservas do dia e reservas online." action={<div className="flex gap-2">{r.booking_enabled && <Button asChild variant="outline" size="sm"><a href={`/r/${r.slug}/reservar`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Página pública</a></Button>}{canEditRoom && <Button size="sm" variant="outline" onClick={submitPlan}>Submeter planta</Button>}<Button size="sm" onClick={() => setOpen({})}><Plus className="h-4 w-4" />Nova</Button></div>} />
      <div className="mb-5 flex gap-1 overflow-x-auto rounded-lg border bg-card p-1">
        {TABS.filter(([k]) => k !== "tables" || canEditRoom).map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>{l}</button>)}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(tab === "today" || tab === "list" || tab === "agenda") && <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-auto" />}
        {canEditRoom && <div className="ml-auto inline-flex rounded-md border bg-card p-0.5 text-xs" role="group" aria-label="Modo">
          {[["simple", "Modo simples"], ["advanced", "Modo avançado"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`rounded px-3 py-1 ${r.res_mode === k ? "bg-foreground text-background" : ""}`}>{l}</button>)}
        </div>}
      </div>
      {tab === "today" && adv && <div className="space-y-3">{canEditRoom && <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">{[[false, "Operacional"], [true, "Editar planta"]].map(([k, l]) => <Button variant={editPlan === k ? "secondary" : "ghost"} size="sm" key={String(k)} onClick={() => setEditPlan(k as boolean)}>{l as string}</Button>)}</div>}<FloorPlan date={date} live={!editPlan || !canEditRoom} onBook={(tableId) => setOpen({ tableId })} /></div>}
      {tab === "today" && !adv && <Floor date={date} onBook={(tableId) => setOpen({ tableId })} />}
      {tab === "agenda" && <Agenda date={date} setDate={setDate} />}
      {tab === "wait" && <Waitlist />}
      {tab === "clients" && <Customers />}
      {tab === "stats" && <ResStats />}
      {tab === "list" && <List date={date} />}
      {tab === "tables" && canEditRoom && <TablesConfig />}
      {tab === "settings" && <Rules />}
      {open && <NewReservation date={date} tableId={open.tableId} onClose={() => setOpen(null)} />}
    </div>
  );
}

function useData(date: string) {
  const { restaurant: r } = useRestaurant();
  const [s, e] = dayRange(date);
  const zones = useQuery({ queryKey: ["zones", r.id], queryFn: async () => (await supabase.from("zones").select("*").eq("restaurant_id", r.id).order("position")).data ?? [] });
  const tables = useQuery({ queryKey: ["tables", r.id], queryFn: async () => (await supabase.from("dining_tables").select("*").eq("restaurant_id", r.id).order("position").order("label")).data ?? [] });
  const res = useQuery({ queryKey: ["reservations", r.id, date], refetchInterval: 30000, queryFn: async () => (await supabase.from("reservations").select("*").eq("restaurant_id", r.id).gte("starts_at", s).lt("starts_at", e).order("starts_at")).data ?? [] });
  return { r, zones: zones.data ?? [], tables: tables.data ?? [], res: res.data ?? [] };
}

function Floor({ date, onBook }: { date: string; onBook: (id: string) => void }) {
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
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-md border bg-card p-3"><p className="font-display text-2xl text-st-free">{counts.free}</p>Livres</div>
        <div className="rounded-md border bg-card p-3"><p className="font-display text-2xl text-st-reserved">{counts.reserved}</p>Reservadas</div>
        <div className="rounded-md border bg-card p-3"><p className="font-display text-2xl text-st-seated">{counts.seated}</p>Ocupadas</div>
      </div>
      {zones.length > 0 && <div className="flex gap-2 overflow-x-auto">{[{ id: "all", name: "Todas" }, ...zones].map((z) => <button key={z.id} onClick={() => setZone(z.id)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${zone === z.id ? "bg-foreground text-background" : ""}`}>{z.name}</button>)}</div>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {cards.map(({ t, seated, next, st }) => (
          <div key={t.id} className={`rounded-lg border-2 p-3 ${STATUS_CLS[st]}`}>
            <div className="flex items-center justify-between"><span className="font-display text-2xl">{t.label}</span><span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{t.seats}</span></div>
            {seated && <p className="mt-1 text-xs">{seated.name} · liberta {hhmm(seated.ends_at)}</p>}
            {next && <p className="mt-1 flex items-center gap-1 text-xs">{st === "late" && <AlertTriangle className="h-3 w-3 text-st-reserved" />}<Clock className="h-3 w-3" />{hhmm(next.starts_at)} · {next.name} ({next.party})</p>}
            {!seated && !next && <p className="mt-1 text-xs text-muted-foreground">Livre</p>}
            <div className="mt-2 flex flex-wrap gap-1">
              {seated ? <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(seated.id, "completed")}>Libertar</Button>
                : next ? <><Button size="sm" className="h-7 text-xs" onClick={() => setStatus(next.id, "seated")}>Sentar</Button>{st === "late" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setStatus(next.id, "no_show")}>No-show</Button>}</>
                : <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onBook(t.id)}>Reservar / sentar</Button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function List({ date }: { date: string }) {
  const { r, tables, res } = useData(date);
  const qc = useQueryClient();
  if (!res.length) return <Panel><p className="text-sm text-muted-foreground">Sem reservas neste dia.</p></Panel>;
  return (
    <Panel>
      <ul className="divide-y">
        {res.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
            <span className="w-12 font-semibold">{hhmm(x.starts_at)}</span>
            <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.name} · {x.party} pax{!x.table_id && <span className="text-destructive"> · sem mesa</span>}</p><p className="truncate text-xs text-muted-foreground">{[x.phone, x.email, x.source === "online" ? "Online" : null, x.notes].filter(Boolean).join(" · ")}</p></div>
            <select aria-label="Mesa" className="rounded border bg-card px-2 py-1 text-xs" value={x.table_id ?? ""} onChange={async (e) => { const { error } = await supabase.rpc("move_reservation", { _id: x.id, _table_id: e.target.value }); if (error) toast.error(resError(error.message)); qc.invalidateQueries({ queryKey: ["reservations", r.id] }); }}>
              <option value="" disabled>Mesa…</option>{tables.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select className="rounded border bg-card px-2 py-1 text-xs" value={x.status} onChange={async (e) => { await supabase.from("reservations").update({ status: e.target.value, updated_at: new Date().toISOString() }).eq("id", x.id); qc.invalidateQueries({ queryKey: ["reservations", r.id] }); }}>
              {RES_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function NewReservation({ date, tableId, onClose }: { date: string; tableId?: string; onClose: () => void }) {
  const { r, tables } = useData(date);
  const qc = useQueryClient();
  const nowT = new Date(); const def = `${String(nowT.getHours()).padStart(2, "0")}:${nowT.getMinutes() < 30 ? "30" : "00"}`;
  const [f, setF] = useState({ date, time: def, party: 2, name: "", phone: "", email: "", notes: "", table: tableId ?? "", walkin: false });
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

function TablesConfig() {
  const { r, zones, tables } = useData(todayStr());
  const qc = useQueryClient();
  const [zn, setZn] = useState("");
  const [t, setT] = useState({ label: "", seats: 4, zone: "" });
  const inv = () => { qc.invalidateQueries({ queryKey: ["zones", r.id] }); qc.invalidateQueries({ queryKey: ["tables", r.id] }); };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel title="Zonas">
        <form className="flex gap-2" onSubmit={async (e) => { e.preventDefault(); if (!zn.trim()) return; await supabase.from("zones").insert({ restaurant_id: r.id, name: zn.trim(), position: zones.length }); setZn(""); inv(); }}>
          <Input placeholder="Sala, Esplanada…" value={zn} onChange={(e) => setZn(e.target.value)} /><Button>Criar</Button>
        </form>
        <ul className="mt-3 divide-y text-sm">
          {zones.map((z) => (
            <li key={z.id} className="flex items-center gap-3 py-2">
              <span className="flex-1">{z.name}</span>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={z.online} onChange={async (e) => { await supabase.from("zones").update({ online: e.target.checked }).eq("id", z.id); inv(); }} />Online</label>
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={z.active} onChange={async (e) => { await supabase.from("zones").update({ active: e.target.checked }).eq("id", z.id); inv(); }} />Ativa</label>
              <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={async () => { await supabase.from("zones").delete().eq("id", z.id); inv(); }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Mesas">
        <form className="grid grid-cols-[1fr_70px_1fr_auto] gap-2" onSubmit={async (e) => { e.preventDefault(); if (!t.label.trim()) return; await supabase.from("dining_tables").insert({ restaurant_id: r.id, label: t.label.trim(), seats: t.seats, max_seats: t.seats, min_seats: 1, zone_id: t.zone || null, position: tables.length }); setT({ ...t, label: String(Number(t.label) + 1 || "") }); inv(); }}>
          <Input placeholder="Nº" value={t.label} onChange={(e) => setT({ ...t, label: e.target.value })} />
          <Input type="number" min={1} value={t.seats} onChange={(e) => setT({ ...t, seats: Number(e.target.value) })} aria-label="Lugares" />
          <select className="h-9 rounded-md border bg-card px-2 text-sm" value={t.zone} onChange={(e) => setT({ ...t, zone: e.target.value })}><option value="">Sem zona</option>{zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}</select>
          <Button>+</Button>
        </form>
        <ul className="mt-3 divide-y text-sm">
          {tables.map((x) => (
            <li key={x.id} className="flex items-center gap-2 py-2">
              <span className="w-10 font-semibold">{x.label}</span>
              <label className="text-xs text-muted-foreground">mín<Input type="number" min={1} className="h-7 w-14" defaultValue={x.min_seats} onBlur={async (e) => { await supabase.from("dining_tables").update({ min_seats: Number(e.target.value) }).eq("id", x.id); inv(); }} /></label>
              <label className="text-xs text-muted-foreground">ideal<Input type="number" min={1} className="h-7 w-14" defaultValue={x.seats} onBlur={async (e) => { await supabase.from("dining_tables").update({ seats: Number(e.target.value) }).eq("id", x.id); inv(); }} /></label>
              <label className="text-xs text-muted-foreground">máx<Input type="number" min={1} className="h-7 w-14" defaultValue={x.max_seats} onBlur={async (e) => { await supabase.from("dining_tables").update({ max_seats: Number(e.target.value) }).eq("id", x.id); inv(); }} /></label>
              <label className="ml-auto flex items-center gap-1 text-xs"><input type="checkbox" checked={x.online} onChange={async (e) => { await supabase.from("dining_tables").update({ online: e.target.checked }).eq("id", x.id); inv(); }} />Online</label>
              <Button size="icon" variant="ghost" aria-label="Eliminar" onClick={async () => { await supabase.from("dining_tables").delete().eq("id", x.id); inv(); }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
function Rules() {
  const { restaurant: r, refresh } = useRestaurant();
  const [f, setF] = useState({ booking_enabled: r.booking_enabled, booking_open: r.booking_open.slice(0, 5), booking_close: r.booking_close.slice(0, 5), meal_minutes: r.meal_minutes, buffer_minutes: r.buffer_minutes, min_notice_minutes: r.min_notice_minutes, max_days_ahead: r.max_days_ahead, late_tolerance_minutes: r.late_tolerance_minutes, closed_days: r.closed_days, timezone: r.timezone });
  const num = (k: keyof typeof f, label: string) => <div><Label>{label}</Label><Input type="number" min={0} value={f[k] as number} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} /></div>;
  return (
    <Panel>
      <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.from("restaurants").update(f).eq("id", r.id); if (error) return toast.error(error.message); toast.success("Guardado"); refresh(); }}>
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={f.booking_enabled} onChange={(e) => setF({ ...f, booking_enabled: e.target.checked })} />Aceitar reservas online (botão no menu público)</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Primeira reserva</Label><Input type="time" value={f.booking_open} onChange={(e) => setF({ ...f, booking_open: e.target.value })} /></div>
          <div><Label>Última reserva</Label><Input type="time" value={f.booking_close} onChange={(e) => setF({ ...f, booking_close: e.target.value })} /></div>
          {num("meal_minutes", "Duração da refeição (min)")}{num("buffer_minutes", "Intervalo entre clientes (min)")}
          {num("min_notice_minutes", "Antecedência mínima (min)")}{num("max_days_ahead", "Antecedência máxima (dias)")}
          {num("late_tolerance_minutes", "Tolerância de atraso (min)")}
          <div><Label>Fuso horário</Label><Input value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} /></div>
        </div>
        <div><Label>Dias encerrados</Label><div className="mt-1 flex flex-wrap gap-1">{DAYS.map((d, i) => <button type="button" key={d} onClick={() => setF({ ...f, closed_days: f.closed_days.includes(i) ? f.closed_days.filter((x) => x !== i) : [...f.closed_days, i] })} className={`rounded-full border px-3 py-1 text-xs ${f.closed_days.includes(i) ? "bg-destructive text-destructive-foreground" : ""}`}>{d}</button>)}</div></div>
        <Button>Guardar</Button>
      </form>
    </Panel>
  );
}
