import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { X, Plus, DoorOpen, ListOrdered, RefreshCw, LayoutGrid, PencilRuler, Eye, Clock, AlertTriangle, Hourglass, CalendarClock, Users, Settings2, ChevronLeft, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { canAccess } from "@/lib/team-rules";
import { hhmm, isLate, tableState, todayStr } from "@/lib/reservations";
import { FloorPlan } from "./FloorPlan";
import { useResData } from "./data";

const WIDGETS = [["upcoming", "Próximas chegadas"], ["late", "Atrasadas"], ["freeing", "Ficam livres em breve"], ["waitlist", "Lista de espera"], ["covers", "Pessoas na sala"]] as const;
type WidgetId = (typeof WIDGETS)[number][0];
const LS = "menutap.room.widgets";

/** Full-screen room control: floor plan, quick actions, toggleable widgets and a live status bar. */
export function RoomControl({ onClose, onBook, onWaitlist }: { onClose: () => void; onBook: (tableId?: string, walkin?: boolean) => void; onWaitlist: () => void }) {
  const [date, setDate] = useState(todayStr());
  const { r, tables, res } = useResData(date);
  const qc = useQueryClient();
  const canEdit = canAccess(r.role, r.permissions, "room_edit");
  const [edit, setEdit] = useState(false);
  const [panel, setPanel] = useState(true);
  const [widgets, setWidgets] = useState<WidgetId[]>(["upcoming", "late", "freeing", "waitlist"]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { try { const v = JSON.parse(localStorage.getItem(LS) ?? "null"); if (Array.isArray(v)) setWidgets(v); } catch { /* ignore */ } }, []);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    const k = (e: KeyboardEvent) => { if (e.key === "Escape" && !document.querySelector("[role=dialog]")) onClose(); };
    window.addEventListener("keydown", k); return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", k); };
  }, [onClose]);
  const toggleW = (id: WidgetId) => setWidgets((w) => { const n = w.includes(id) ? w.filter((x) => x !== id) : [...w, id]; localStorage.setItem(LS, JSON.stringify(n)); return n; });

  const wait = useQuery({ queryKey: ["waitlist", r.id], refetchInterval: 20000, queryFn: async () => (await supabase.from("waitlist").select("*").eq("restaurant_id", r.id).eq("status", "waiting").order("created_at")).data ?? [] });

  const stats = useMemo(() => {
    const active = tables.filter((t) => t.active);
    const st = active.map((t) => ({ t, s: tableState(t.id, res, r.late_tolerance_minutes, now) }));
    const c = { free: 0, reserved: 0, seated: 0, late: 0 };
    st.forEach((x) => c[x.s.state]++);
    const seatedRes = res.filter((x) => x.status === "seated");
    const covers = seatedRes.reduce((a, x) => a + x.party, 0);
    const capacity = active.reduce((a, t) => a + t.seats, 0);
    const upcoming = res.filter((x) => (x.status === "pending" || x.status === "confirmed") && Date.parse(x.starts_at) >= now - 60000 && !isLate(x.status, x.starts_at, r.late_tolerance_minutes, now)).slice(0, 6);
    const late = res.filter((x) => isLate(x.status, x.starts_at, r.late_tolerance_minutes, now));
    const freeing = seatedRes.slice().sort((a, b) => Date.parse(a.ends_at) - Date.parse(b.ends_at)).slice(0, 6);
    const total = res.filter((x) => x.status !== "cancelled").length;
    return { c, covers, capacity, upcoming, late, freeing, total };
  }, [tables, res, now, r.late_tolerance_minutes]);
  const label = (id: string | null) => tables.find((t) => t.id === id)?.label ?? "—";
  const mins = (iso: string) => Math.round((Date.parse(iso) - now) / 60000);
  const shift = (d: number) => { const x = new Date(date + "T12:00:00"); x.setDate(x.getDate() + d); setDate(todayStr(x)); };

  const BAR = [
    ["Livres", stats.c.free, "var(--st-free)"], ["Reservadas", stats.c.reserved, "var(--st-reserved)"], ["Ocupadas", stats.c.seated, "var(--st-seated)"],
    ["Atrasadas", stats.c.late, "var(--destructive)"], ["Pessoas", `${stats.covers}/${stats.capacity}`, "var(--primary)"], ["Reservas", stats.total, "var(--muted-foreground)"], ["Espera", wait.data?.length ?? 0, "var(--accent-foreground)"],
  ] as const;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200" role="region" aria-label="Controlo da sala">
      {/* top bar */}
      <header className="flex items-center gap-2 border-b bg-card px-3 py-2 sm:px-4">
        <p className="mr-2 font-display text-lg">Controlo da sala</p>
        <div className="flex items-center rounded-full border bg-background p-0.5">
          <button aria-label="Dia anterior" onClick={() => shift(-1)} className="rounded-full p-1.5 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent px-1 text-sm outline-none" />
          <button aria-label="Dia seguinte" onClick={() => shift(1)} className="rounded-full p-1.5 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
        </div>
        {date !== todayStr() && <button onClick={() => setDate(todayStr())} className="rounded-full border px-3 py-1 text-xs hover:bg-muted">Hoje</button>}
        <div className="ml-auto flex items-center gap-1.5">
          {canEdit && <div className="hidden rounded-full border bg-background p-0.5 text-sm sm:flex">
            {[[false, "Operacional", Eye], [true, "Editar", PencilRuler]].map(([k, l, I]) => { const Icon = I as typeof Eye; return <button key={String(k)} onClick={() => setEdit(k as boolean)} className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition ${edit === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><Icon className="h-3.5 w-3.5" />{l as string}</button>; })}
          </div>}
          <Popover>
            <PopoverTrigger asChild><button aria-label="Widgets" className="rounded-full border p-2 hover:bg-muted"><Settings2 className="h-4 w-4" /></button></PopoverTrigger>
            <PopoverContent align="end" className="w-60 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Widgets visíveis</p>
              {WIDGETS.map(([id, l]) => <label key={id} className="flex cursor-pointer items-center gap-2 text-sm"><Checkbox checked={widgets.includes(id)} onCheckedChange={() => toggleW(id)} />{l}</label>)}
            </PopoverContent>
          </Popover>
          <button aria-label={panel ? "Esconder painel" : "Mostrar painel"} onClick={() => setPanel((p) => !p)} className={`rounded-full border p-2 hover:bg-muted ${panel ? "bg-muted" : ""}`}><LayoutGrid className="h-4 w-4" /></button>
          <button aria-label="Fechar" onClick={onClose} className="ml-1 rounded-full border-2 p-1.5 transition hover:rotate-90 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="min-h-0 min-w-0 flex-1 p-3 sm:p-4">
          <FloorPlan key={String(edit)} fullscreen date={date} live={!edit || !canEdit} onBook={(id) => onBook(id)} />
        </main>
        {panel && (
          <aside className="hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l bg-card p-4 md:flex animate-in slide-in-from-right-4 duration-200">
            <section>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Ações rápidas</p>
              <div className="grid grid-cols-2 gap-2">
                <Quick icon={Plus} label="Nova reserva" onClick={() => onBook()} primary />
                <Quick icon={DoorOpen} label="Cliente à porta" onClick={() => onBook(undefined, true)} />
                <Quick icon={ListOrdered} label="Lista de espera" onClick={onWaitlist} />
                <Quick icon={RefreshCw} label="Atualizar" onClick={() => { qc.invalidateQueries({ queryKey: ["reservations", r.id] }); qc.invalidateQueries({ queryKey: ["tables", r.id] }); wait.refetch(); }} />
              </div>
            </section>
            {widgets.includes("covers") && <Widget icon={Users} title="Pessoas na sala">
              <div className="flex items-end justify-between"><p className="font-display text-3xl">{stats.covers}<span className="text-base text-muted-foreground">/{stats.capacity}</span></p><p className="text-sm text-muted-foreground">{stats.capacity ? Math.round((stats.covers / stats.capacity) * 100) : 0}%</p></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${stats.capacity ? Math.min(100, (stats.covers / stats.capacity) * 100) : 0}%` }} /></div>
            </Widget>}
            {widgets.includes("late") && <Widget icon={AlertTriangle} title="Atrasadas" count={stats.late.length} tone="var(--destructive)">
              {stats.late.length ? stats.late.map((x) => <Row key={x.id} a={x.name} b={`Mesa ${label(x.table_id)} · ${x.party}p`} c={`${-mins(x.starts_at)} min`} tone="var(--destructive)" />) : <Empty />}
            </Widget>}
            {widgets.includes("upcoming") && <Widget icon={CalendarClock} title="Próximas chegadas" count={stats.upcoming.length}>
              {stats.upcoming.length ? stats.upcoming.map((x) => <Row key={x.id} a={x.name} b={`Mesa ${label(x.table_id)} · ${x.party}p`} c={hhmm(x.starts_at)} />) : <Empty />}
            </Widget>}
            {widgets.includes("freeing") && <Widget icon={Hourglass} title="Ficam livres em breve" count={stats.freeing.length}>
              {stats.freeing.length ? stats.freeing.map((x) => { const m = mins(x.ends_at); return <Row key={x.id} a={`Mesa ${label(x.table_id)}`} b={x.name} c={m >= 0 ? `${m} min` : "excedido"} tone={m < 0 ? "var(--destructive)" : undefined} />; }) : <Empty />}
            </Widget>}
            {widgets.includes("waitlist") && <Widget icon={Clock} title="Lista de espera" count={wait.data?.length ?? 0}>
              {wait.data?.length ? wait.data.slice(0, 6).map((w) => <Row key={w.id} a={w.name} b={`${w.party}p`} c={`${Math.max(0, Math.round((now - Date.parse(w.created_at)) / 60000))} min`} />) : <Empty />}
            </Widget>}
          </aside>
        )}
      </div>

      {/* status bar */}
      <footer className="flex items-center gap-2 overflow-x-auto border-t bg-card px-3 py-2 sm:px-4">
        {BAR.map(([l, v, c]) => (
          <div key={l} className="flex shrink-0 flex-col items-center rounded-lg px-3 py-1">
            <span className="min-w-8 rounded-md px-2 py-0.5 text-center text-sm font-semibold tabular-nums text-primary-foreground" style={{ background: c }}>{v}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{l}</span>
          </div>
        ))}
      </footer>
    </div>,
    document.body,
  );
}

function Quick({ icon: Icon, label, onClick, primary }: { icon: typeof Plus; label: string; onClick: () => void; primary?: boolean }) {
  return <button onClick={onClick} className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 ${primary ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:border-primary/50"}`}><Icon className="h-4 w-4 transition group-hover:scale-110" />{label}</button>;
}
function Widget({ icon: Icon, title, count, tone, children }: { icon: typeof Plus; title: string; count?: number; tone?: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-background p-3 animate-in fade-in duration-300">
    <div className="mb-2 flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" /><p className="text-sm font-medium">{title}</p>{count !== undefined && <span className="ml-auto rounded-full px-2 text-xs font-semibold tabular-nums" style={{ background: count ? (tone ?? "var(--muted)") : "var(--muted)", color: count && tone ? "var(--primary-foreground)" : undefined }}>{count}</span>}</div>
    <div className="space-y-1.5">{children}</div>
  </section>;
}
function Row({ a, b, c, tone }: { a: string; b: string; c: string; tone?: string }) {
  return <div className="flex items-center gap-2 text-sm"><div className="min-w-0 flex-1"><p className="truncate font-medium">{a}</p><p className="truncate text-xs text-muted-foreground">{b}</p></div><span className="shrink-0 text-xs font-semibold tabular-nums" style={{ color: tone }}>{c}</span></div>;
}
function Empty() { return <p className="text-xs text-muted-foreground">Nada de momento.</p>; }
