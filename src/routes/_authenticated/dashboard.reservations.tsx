import { CalendarDays as CalendarDaysIcon } from "lucide-react";
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
import { useData, NewReservation } from "@/components/res/RoomShared";
import { Maximize2, ListChecks, CalendarRange, Hourglass, Contact, BarChart3, Armchair, SlidersHorizontal, Send, ChevronLeft, ChevronRight, CalendarCheck, Gauge, Search, LayoutGrid, Rows3, Check, CheckCheck, Phone, Mail, Globe } from "lucide-react";
import { Agenda, Customers, ResStats, Waitlist } from "@/components/res/Panels";
import { BLOCKING, RES_STATUSES, STATUS_LABEL, dayRange, hhmm, isLate, resError, todayStr, type ResStatus } from "@/lib/reservations";

export const Route = createFileRoute("/_authenticated/dashboard/reservations")({
  head: () => ({ meta: [{ title: "Reservas e mesas — Crumb" }, { name: "description", content: "Gira reservas, mesas e zonas do restaurante." }, { property: "og:title", content: "Reservas e mesas — Crumb" }, { property: "og:description", content: "Gira reservas, mesas e zonas do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>): { nova?: 1; tab?: "wait" } => ({ ...(s.nova ? { nova: 1 as const } : {}), ...(s.tab === "wait" ? { tab: "wait" as const } : {}) }),
  component: Reservations,
});

const TABS = [["list", "Reservas", ListChecks], ["agenda", "Agenda", CalendarRange], ["wait", "Espera", Hourglass], ["clients", "Clientes", Contact], ["stats", "Estatísticas", BarChart3], ["tables", "Mesas e zonas", Armchair], ["settings", "Regras", SlidersHorizontal]] as const;
const STATUS_CLS: Record<string, string> = { free: "border-st-free/50 bg-st-free/10", reserved: "border-st-reserved/70 bg-st-reserved/15", seated: "border-st-seated/60 bg-st-seated/10", late: "border-st-reserved bg-st-reserved/30 animate-pulse" };
const CHIP: Record<string, string> = { pending: "bg-st-reserved/15 text-foreground border-st-reserved/40", confirmed: "bg-primary/10 text-primary border-primary/30", seated: "bg-st-seated/10 text-st-seated border-st-seated/30", completed: "bg-muted text-muted-foreground border-border", cancelled: "bg-destructive/10 text-destructive border-destructive/30", no_show: "bg-destructive/10 text-destructive border-destructive/30" };
const DOT: Record<string, string> = { pending: "bg-st-reserved", confirmed: "bg-primary", seated: "bg-st-seated", completed: "bg-muted-foreground", cancelled: "bg-destructive", no_show: "bg-destructive" };

function shiftDate(d: string, n: number) { const x = new Date(d + "T12:00:00"); x.setDate(x.getDate() + n); return todayStr(x); }
function prettyDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" }); }

function Reservations() {
  const search = Route.useSearch();
  const [tab, setTab] = useState<(typeof TABS)[number][0]>(search.tab ?? "list");
  const [navCollapsed, setNavCollapsed] = useState(() => { try { return localStorage.getItem("res-nav-collapsed") === "1"; } catch { return false; } });
  const toggleNav = () => setNavCollapsed((c) => { try { localStorage.setItem("res-nav-collapsed", c ? "0" : "1"); } catch { /* ignore */ } return !c; });
  const [date, setDate] = useState(todayStr());
  const [open, setOpen] = useState<{ tableId?: string } | null>(search.nova ? {} : null);
  const { restaurant: r, refresh } = useRestaurant();
  const canEditRoom = canAccess(r.role, r.permissions, "room_edit");
  async function submitPlan() {
    if (!canEditRoom) return;
    if (!confirm("Enviar a planta atual à Crumb para contabilizar os dispositivos (1 por mesa ativa)?")) return;
    const { data, error } = await supabase.rpc("submit_floor_plan", { _restaurant_id: r.id });
    if (error) return toast.error(error.message);
    toast.success(`Planta submetida: ${data} mesas`);
  }
  async function setMode(m: string) { if (!canEditRoom) return; const { error } = await supabase.rpc("set_room_mode", { _restaurant_id: r.id, _mode: m }); if (error) return toast.error(error.message); refresh(); }
  const dated = tab === "list" || tab === "agenda";
  const isToday = date === todayStr();
  return (
    <div>
      <PageTitle icon={CalendarDaysIcon} title="Reservas" sub="Mesas, reservas do dia e reservas online." action={<div className="flex flex-wrap gap-2">{r.booking_enabled && <Button asChild variant="outline" size="sm" className="rounded-xl"><a href={`https://menutap.pt/r/${r.slug}/reservar`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" />Página pública</a></Button>}{canEditRoom && <Button size="sm" variant="outline" className="rounded-xl" onClick={submitPlan}><Send className="h-4 w-4" />Submeter planta</Button>}<Button size="sm" className="rounded-xl shadow-[var(--shadow-tile)]" onClick={() => setOpen({})}><Plus className="h-4 w-4" />Nova reserva</Button></div>} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <nav className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl border bg-card p-1 shadow-sm" aria-label="Secções">
          <button onClick={toggleNav} aria-label={navCollapsed ? "Expandir menu" : "Recolher menu"} title={navCollapsed ? "Expandir menu" : "Recolher menu"} className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
            {navCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {TABS.filter(([k]) => k !== "tables" || canEditRoom).map(([k, l, Icon]) => (
            <button key={k} onClick={() => setTab(k)} title={navCollapsed ? l : undefined} aria-label={navCollapsed ? l : undefined} className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg text-sm font-medium transition-all ${navCollapsed ? "px-2 py-1.5" : "px-3 py-1.5"} ${tab === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-4 w-4" />{!navCollapsed && l}</button>
          ))}
        </nav>
        {canEditRoom && (tab === "tables" || tab === "settings") && <div className="inline-flex shrink-0 rounded-xl border bg-card p-1 text-xs shadow-sm" role="group" aria-label="Modo">
          {[["simple", "Simples"], ["advanced", "Avançado"]].map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`rounded-lg px-3 py-1.5 font-medium transition-all ${r.res_mode === k ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>{l}</button>)}
        </div>}
      </div>

      {dated && (
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <div className="dash-card inline-flex items-center gap-1 p-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" aria-label="Dia anterior" onClick={() => setDate(shiftDate(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <label className="relative cursor-pointer px-2 text-sm font-semibold capitalize">
              {prettyDate(date)}
              <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label="Escolher data" />
            </label>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" aria-label="Dia seguinte" onClick={() => setDate(shiftDate(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          {!isToday && <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setDate(todayStr())}>Hoje</Button>}
          {isToday && <span className="inline-flex items-center gap-1.5 rounded-full border border-st-free/30 bg-st-free/10 px-2.5 py-1 text-xs font-semibold text-st-free"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-st-free" />Hoje</span>}
        </div>
      )}

      {tab === "agenda" && <Agenda date={date} setDate={setDate} />}
      {tab === "wait" && <Waitlist />}
      {tab === "clients" && <Customers />}
      {tab === "stats" && <ResStats />}
      {tab === "list" && <List date={date} onNew={() => setOpen({})} />}
      {tab === "tables" && canEditRoom && <TablesConfig />}
      {tab === "settings" && <Rules />}
      {open && <NewReservation date={date} tableId={open.tableId} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Widget({ icon: Icon, label, value, hint, tone = "", children }: { icon: typeof Users; label: string; value: React.ReactNode; hint?: string; tone?: string; children?: React.ReactNode }) {
  return (
    <div className="dash-card group p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={`grid h-8 w-8 place-items-center rounded-lg border bg-muted/60 ${tone}`}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

function List({ date, onNew }: { date: string; onNew: () => void }) {
  const { r, tables, res } = useData(date);
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("active");
  const [q, setQ] = useState("");
  const [view, setView] = useState<"cards" | "rows">("cards");
  const now = Date.now();
  const live = res.filter((x) => BLOCKING.includes(x.status as ResStatus));
  const covers = live.reduce((a, x) => a + x.party, 0);
  const seats = tables.filter((t) => t.active).reduce((a, t) => a + t.seats, 0);
  const occ = seats ? Math.min(100, Math.round((covers / seats) * 100)) : 0;
  const pending = res.filter((x) => x.status === "pending").length;
  const seated = res.filter((x) => x.status === "seated").length;
  const unassigned = live.filter((x) => !x.table_id).length;
  const next = live.filter((x) => x.status !== "seated" && Date.parse(x.starts_at) >= now - 15 * 60000)[0];
  const tableLabel = (id: string | null) => tables.find((t) => t.id === id)?.label;
  const inv = () => qc.invalidateQueries({ queryKey: ["reservations", r.id] });
  async function setStatus(id: string, status: string) { await supabase.from("reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id); inv(); toast.success(STATUS_LABEL[status as ResStatus]); }
  async function move(id: string, table: string) { const { error } = await supabase.rpc("move_reservation", { _id: id, _table_id: table }); if (error) toast.error(resError(error.message)); inv(); }

  const filters: [string, string, number][] = [["active", "Ativas", live.length], ["all", "Todas", res.length], ...RES_STATUSES.map((s) => [s, STATUS_LABEL[s], res.filter((x) => x.status === s).length] as [string, string, number])];
  const shown = res.filter((x) => (filter === "all" || (filter === "active" ? BLOCKING.includes(x.status as ResStatus) : x.status === filter)) && (!q || [x.name, x.phone, x.email].some((v) => v?.toLowerCase().includes(q.toLowerCase()))));
  const groups = shown.reduce<Record<string, typeof shown>>((g, x) => { const h = hhmm(x.starts_at).slice(0, 2) + ":00"; (g[h] ||= []).push(x); return g; }, {});

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Widget icon={CalendarCheck} label="Reservas" value={live.length} hint={`${res.length} no total`} />
        <Widget icon={Users} label="Pessoas" value={covers} hint={`${seats} lugares disponíveis`} />
        <Widget icon={Gauge} label="Ocupação" value={`${occ}%`}>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${occ}%` }} /></div>
        </Widget>
        <Widget icon={Armchair} label="Sentados" value={seated} hint="à mesa agora" tone="text-st-seated" />
        <Widget icon={AlertTriangle} label="Por tratar" value={pending + unassigned} hint={`${pending} pendentes · ${unassigned} sem mesa`} tone={pending + unassigned ? "text-st-reserved" : ""} />
      </div>

      {next && (
        <div className="dash-card flex flex-wrap items-center gap-4 border-l-4 border-l-primary p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-tile)]"><Clock className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Próxima chegada</p>
            <p className="truncate font-semibold">{hhmm(next.starts_at)} · {next.name} · {next.party} pax {tableLabel(next.table_id) ? `· Mesa ${tableLabel(next.table_id)}` : ""}</p>
          </div>
          <Button size="sm" className="rounded-xl" onClick={() => setStatus(next.id, "seated")}><Armchair className="h-4 w-4" />Sentar</Button>
        </div>
      )}

      <div className="dash-card p-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Procurar nome, telefone, email…" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl pl-9" />
          </div>
          <div className="inline-flex rounded-lg border bg-muted/50 p-0.5" role="group" aria-label="Vista">
            <button aria-label="Cartões" onClick={() => setView("cards")} className={`rounded-md p-1.5 ${view === "cards" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><LayoutGrid className="h-4 w-4" /></button>
            <button aria-label="Lista" onClick={() => setView("rows")} className={`rounded-md p-1.5 ${view === "rows" ? "bg-card shadow-sm" : "text-muted-foreground"}`}><Rows3 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {filters.map(([k, l, n]) => (
            <button key={k} onClick={() => setFilter(k)} className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${filter === k ? "border-foreground bg-foreground text-background" : "bg-card text-muted-foreground hover:text-foreground"}`}>
              {DOT[k] && <span className={`h-1.5 w-1.5 rounded-full ${DOT[k]}`} />}{l}<span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>

        {!shown.length ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl border bg-muted/60"><CalendarDaysIcon className="h-6 w-6 text-muted-foreground" /></span>
            <p className="font-medium">{res.length ? "Nenhuma reserva com este filtro" : "Sem reservas neste dia"}</p>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={onNew}><Plus className="h-4 w-4" />Criar reserva</Button>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groups).map(([h, items]) => (
              <section key={h}>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><Clock className="h-3.5 w-3.5" />{h}<span className="h-px flex-1 bg-border" /><span>{items.reduce((a, x) => a + x.party, 0)} pax</span></div>
                <div className={view === "cards" ? "grid gap-3 sm:grid-cols-2 xl:grid-cols-3" : "divide-y rounded-xl border"}>
                  {items.map((x) => {
                    const late = isLate(x.status, x.starts_at, r.late_tolerance_minutes, now);
                    const actions = (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {x.status === "pending" && <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-xs" onClick={() => setStatus(x.id, "confirmed")}><Check className="h-3.5 w-3.5" />Confirmar</Button>}
                        {(x.status === "pending" || x.status === "confirmed") && <Button size="sm" className="h-7 rounded-lg px-2 text-xs" onClick={() => setStatus(x.id, "seated")}><Armchair className="h-3.5 w-3.5" />Sentar</Button>}
                        {x.status === "seated" && <Button size="sm" variant="outline" className="h-7 rounded-lg px-2 text-xs" onClick={() => setStatus(x.id, "completed")}><CheckCheck className="h-3.5 w-3.5" />Concluir</Button>}
                        <select aria-label="Mesa" className="h-7 rounded-lg border bg-card px-2 text-xs" value={x.table_id ?? ""} onChange={(e) => move(x.id, e.target.value)}>
                          <option value="" disabled>Mesa…</option>{tables.map((t) => <option key={t.id} value={t.id}>Mesa {t.label}</option>)}
                        </select>
                        <select aria-label="Estado" className="h-7 rounded-lg border bg-card px-2 text-xs" value={x.status} onChange={(e) => setStatus(x.id, e.target.value)}>
                          {RES_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                        </select>
                      </div>
                    );
                    const chip = <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${late ? "border-st-reserved bg-st-reserved/20 text-foreground" : CHIP[x.status]}`}><span className={`h-1.5 w-1.5 rounded-full ${late ? "animate-pulse bg-st-reserved" : DOT[x.status]}`} />{late ? "Atrasada" : STATUS_LABEL[x.status as ResStatus]}</span>;
                    const meta = <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {x.phone && <a href={`tel:${x.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3 w-3" />{x.phone}</a>}
                      {x.email && <a href={`mailto:${x.email}`} className="inline-flex min-w-0 items-center gap-1 truncate hover:text-foreground"><Mail className="h-3 w-3" />{x.email}</a>}
                      {x.source === "online" && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" />Online</span>}
                    </div>;
                    if (view === "rows") return (
                      <div key={x.id} className="flex flex-wrap items-center gap-3 p-3 text-sm hover:bg-muted/40">
                        <span className="w-12 font-semibold tabular-nums">{hhmm(x.starts_at)}</span>
                        <div className="min-w-0 flex-1"><p className="truncate font-medium">{x.name} <span className="text-muted-foreground">· {x.party} pax</span></p>{meta}</div>
                        {chip}{actions}
                      </div>
                    );
                    return (
                      <article key={x.id} className={`group rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] ${late ? "border-st-reserved" : ""}`}>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-sm font-bold">{x.name.slice(0, 1).toUpperCase()}</span>
                            <div className="min-w-0"><p className="truncate font-semibold">{x.name}</p><p className="text-xs tabular-nums text-muted-foreground">{hhmm(x.starts_at)} – {hhmm(x.ends_at)}</p></div>
                          </div>
                          {chip}
                        </div>
                        <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2 py-1.5"><Users className="h-3.5 w-3.5 text-muted-foreground" /><b>{x.party}</b> pessoas</div>
                          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${x.table_id ? "bg-muted/50" : "bg-destructive/10 text-destructive"}`}><Armchair className="h-3.5 w-3.5" />{x.table_id ? <>Mesa <b>{tableLabel(x.table_id)}</b></> : "Sem mesa"}</div>
                        </div>
                        {meta}
                        {x.notes && <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-dashed px-2 py-1.5 text-xs text-muted-foreground"><StickyNote className="mt-0.5 h-3 w-3 shrink-0" />{x.notes}</p>}
                        <div className="mt-3 border-t pt-3">{actions}</div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
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
