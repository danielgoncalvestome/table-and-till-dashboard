import { CalendarCheck, UsersRound, Armchair, UserX } from "lucide-react";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Trash2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Stat, BarList, Columns } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { BLOCKING, STATUS_LABEL, customerKey, hhmm, resError, todayStr, type ResStatus } from "@/lib/reservations";
import { useResData, useResRange } from "./data";

const BAR: Record<string, string> = { pending: "bg-muted-foreground/60", confirmed: "bg-st-reserved", seated: "bg-st-seated", completed: "bg-st-free", cancelled: "bg-muted", no_show: "bg-destructive/40" };
const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function Agenda({ date, setDate }: { date: string; setDate: (d: string) => void }) {
  const [view, setView] = useState<"day" | "week">("day");
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-md border bg-card p-0.5 text-xs">{(["day", "week"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded px-3 py-1 ${view === v ? "bg-foreground text-background" : ""}`}>{v === "day" ? "Dia (timeline)" : "Semana"}</button>)}</div>
      {view === "day" ? <Timeline date={date} /> : <Week date={date} onPick={(d) => { setDate(d); setView("day"); }} />}
    </div>
  );
}

function Timeline({ date }: { date: string }) {
  const { r, tables, res } = useResData(date);
  const open = Number(r.booking_open.slice(0, 2)), close = Math.min(24, Number(r.booking_close.slice(0, 2)) + Math.ceil(r.meal_minutes / 60) + 1);
  const hours = Array.from({ length: close - open }, (_, i) => open + i);
  const base = new Date(`${date}T00:00:00`).getTime() + open * 3600000, span = (close - open) * 3600000;
  const pct = (iso: string) => Math.max(0, Math.min(100, ((Date.parse(iso) - base) / span) * 100));
  const nowPct = ((Date.now() - base) / span) * 100;
  if (!tables.length) return <Panel><p className="text-sm text-muted-foreground">Sem mesas configuradas.</p></Panel>;
  return (
    <div className="overflow-x-auto rounded-md border bg-card">
      <div className="min-w-[720px] p-3 text-xs">
        <div className="ml-14 flex border-b pb-1 text-muted-foreground">{hours.map((h) => <span key={h} className="flex-1">{h}h</span>)}</div>
        {tables.filter((t) => t.active).map((t) => (
          <div key={t.id} className="flex h-9 items-center border-b last:border-0">
            <span className="w-14 shrink-0 font-semibold">{t.label} <span className="font-normal text-muted-foreground">{t.seats}p</span></span>
            <div className="relative h-7 flex-1">
              {nowPct > 0 && nowPct < 100 && <div className="absolute inset-y-0 w-px bg-destructive" style={{ left: `${nowPct}%` }} />}
              {res.filter((x) => x.table_id === t.id && x.status !== "cancelled").map((x) => (
                <div key={x.id} title={`${x.name} · ${x.party}p · ${STATUS_LABEL[x.status as ResStatus]}`} className={`absolute inset-y-0.5 truncate rounded px-1.5 py-1 text-[10px] text-primary-foreground ${BAR[x.status]}`} style={{ left: `${pct(x.starts_at)}%`, width: `${Math.max(2, pct(x.ends_at) - pct(x.starts_at))}%` }}>{hhmm(x.starts_at)} {x.name}</div>
              ))}
            </div>
          </div>
        ))}
        {res.some((x) => !x.table_id && x.status !== "cancelled") && <p className="mt-2 text-destructive">Há reservas sem mesa atribuída — veja o separador «Reservas».</p>}
      </div>
    </div>
  );
}

function Week({ date, onPick }: { date: string; onPick: (d: string) => void }) {
  const start = new Date(`${date}T00:00:00`); start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  const end = new Date(start); end.setDate(end.getDate() + 7);
  const { data = [] } = useResRange(start.toISOString(), end.toISOString(), `week-${todayStr(start)}`);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {days.map((d) => {
        const list = data.filter((x) => new Date(x.starts_at).toDateString() === d.toDateString() && x.status !== "cancelled");
        return (
          <button key={d.toISOString()} onClick={() => onPick(todayStr(d))} className={`rounded-md border bg-card p-3 text-left hover:border-primary ${todayStr(d) === todayStr() ? "border-primary" : ""}`}>
            <p className="text-xs text-muted-foreground">{DAYS[d.getDay()]} {d.getDate()}</p>
            <p className="font-display text-2xl">{list.length}</p>
            <p className="text-[11px] text-muted-foreground">{list.reduce((a, x) => a + x.party, 0)} pessoas</p>
            <ul className="mt-2 space-y-0.5 text-[11px]">{list.slice(0, 4).map((x) => <li key={x.id} className="truncate">{hhmm(x.starts_at)} {x.name}</li>)}{list.length > 4 && <li className="text-muted-foreground">+{list.length - 4}</li>}</ul>
          </button>
        );
      })}
    </div>
  );
}

export function Waitlist() {
  const { restaurant: r } = useRestaurant();
  const qc = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ["waitlist", r.id], refetchInterval: 20000, queryFn: async () => (await supabase.from("waitlist").select("*").eq("restaurant_id", r.id).eq("status", "waiting").order("created_at")).data ?? [] });
  const [f, setF] = useState({ name: "", phone: "", party: 2 });
  const inv = () => qc.invalidateQueries({ queryKey: ["waitlist", r.id] });
  async function seat(w: (typeof data)[number]) {
    const { data: id, error } = await supabase.rpc("staff_book", { _restaurant_id: r.id, _start: new Date().toISOString(), _party: w.party, _name: w.name, _phone: w.phone ?? "", _email: "", _notes: w.notes ?? "", _source: "walk_in" });
    if (error || !id) return toast.error(error ? resError(error.message) : "Sem mesa livre");
    const { data: row } = await supabase.from("reservations").select("table_id").eq("id", id).single();
    if (!row?.table_id) { await supabase.from("reservations").delete().eq("id", id); return toast.error("Ainda não há mesa livre para este grupo."); }
    await supabase.from("reservations").update({ status: "seated" }).eq("id", id);
    await supabase.from("waitlist").update({ status: "seated" }).eq("id", w.id);
    inv(); qc.invalidateQueries({ queryKey: ["reservations", r.id] }); toast.success("Cliente sentado");
  }
  return (
    <Panel>
      <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); if (!f.name.trim()) return; await supabase.from("waitlist").insert({ restaurant_id: r.id, name: f.name.trim(), phone: f.phone, party: f.party }); setF({ name: "", phone: "", party: 2 }); inv(); }}>
        <Input placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="max-w-[180px]" />
        <Input type="tel" placeholder="Telefone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="max-w-[150px]" />
        <Input type="number" min={1} value={f.party} onChange={(e) => setF({ ...f, party: Number(e.target.value) })} className="w-20" aria-label="Pessoas" />
        <Button>Adicionar</Button>
      </form>
      {!data.length ? <p className="mt-4 text-sm text-muted-foreground">Ninguém em espera.</p> : (
        <ul className="mt-4 divide-y text-sm">
          {data.map((w, i) => (
            <li key={w.id} className="flex items-center gap-3 py-2">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-muted text-xs">{i + 1}</span>
              <div className="min-w-0 flex-1"><p className="truncate font-medium">{w.name} · {w.party}p</p><p className="text-xs text-muted-foreground">{w.phone} · à espera há {Math.round((Date.now() - Date.parse(w.created_at)) / 60000)} min</p></div>
              <Button size="sm" onClick={() => seat(w)}><UserCheck className="h-4 w-4" />Sentar</Button>
              <Button size="icon" variant="ghost" aria-label="Remover" onClick={async () => { await supabase.from("waitlist").update({ status: "left" }).eq("id", w.id); inv(); }}><Trash2 className="h-4 w-4" /></Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function useYear() {
  const to = new Date(); to.setDate(to.getDate() + 90); const from = new Date(); from.setDate(from.getDate() - 365);
  return useResRange(from.toISOString(), to.toISOString(), "year");
}

export function Customers() {
  const { data = [] } = useYear();
  const [q, setQ] = useState("");
  const map = new Map<string, { name: string; phone: string | null; email: string | null; visits: number; noShows: number; last: string; notes: string[] }>();
  for (const x of data) {
    const k = customerKey(x); const c = map.get(k) ?? { name: x.name, phone: x.phone, email: x.email, visits: 0, noShows: 0, last: x.starts_at, notes: [] };
    if (x.status === "completed" || x.status === "seated") c.visits++;
    if (x.status === "no_show") c.noShows++;
    if (x.starts_at > c.last) c.last = x.starts_at;
    if (x.notes && !c.notes.includes(x.notes)) c.notes.push(x.notes);
    map.set(k, c);
  }
  const list = [...map.values()].filter((c) => `${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => b.visits - a.visits);
  return (
    <Panel>
      <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Procurar cliente" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {!list.length ? <p className="text-sm text-muted-foreground">Os clientes aparecem aqui à medida que fazem reservas.</p> : (
        <ul className="divide-y text-sm">
          {list.slice(0, 200).map((c) => (
            <li key={c.name + c.phone + c.email} className="py-2">
              <div className="flex flex-wrap items-center gap-2"><span className="font-medium">{c.name}</span>{c.visits >= 3 && <span className="rounded-full bg-accent px-2 text-[10px] text-accent-foreground">Habitual</span>}{c.noShows > 0 && <span className="rounded-full bg-destructive/15 px-2 text-[10px] text-destructive">{c.noShows} no-show</span>}<span className="ml-auto text-xs text-muted-foreground">{c.visits} visitas · última {new Date(c.last).toLocaleDateString("pt-PT")}</span></div>
              <p className="truncate text-xs text-muted-foreground">{[c.phone, c.email, ...c.notes].filter(Boolean).join(" · ")}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function ResStats() {
  const [days, setDays] = useState(30);
  const from = new Date(); from.setDate(from.getDate() - days);
  const { data: all = [] } = useResRange(from.toISOString(), new Date().toISOString(), `stats-${days}`);
  const valid = all.filter((x) => x.status !== "cancelled");
  const covers = valid.filter((x) => x.status !== "no_show").reduce((a, x) => a + x.party, 0);
  const noShow = all.filter((x) => x.status === "no_show").length;
  const decided = all.filter((x) => ["completed", "seated", "no_show"].includes(x.status)).length;
  const byDow = Array(7).fill(0) as number[]; const byHour = new Map<string, number>(); const bySource = new Map<string, number>();
  for (const x of valid) { const d = new Date(x.starts_at); byDow[(d.getDay() + 6) % 7]++; const h = `${d.getHours()}h`; byHour.set(h, (byHour.get(h) ?? 0) + 1); const s = x.source === "online" ? "Online" : x.source === "walk_in" ? "À porta" : "Equipa"; bySource.set(s, (bySource.get(s) ?? 0) + 1); }
  return (
    <div className="space-y-4">
      <select className="rounded-md border bg-card px-2 py-1.5 text-sm" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 30, 90, 365].map((d) => <option key={d} value={d}>Últimos {d} dias</option>)}</select>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat highlight icon={CalendarCheck} label="Reservas" value={valid.length} />
        <Stat icon={UsersRound} label="Pessoas servidas" value={covers} />
        <Stat icon={Armchair} label="Média por mesa" value={valid.length ? (valid.reduce((a, x) => a + x.party, 0) / valid.length).toFixed(1) : "—"} />
        <Stat icon={UserX} label="Taxa de no-show" value={decided ? `${Math.round((noShow / decided) * 100)}%` : "—"} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Reservas por dia da semana"><Columns values={byDow} labels={["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]} /></Panel>
        <Panel title="Horas mais procuradas"><BarList items={[...byHour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)} empty="Sem dados." /></Panel>
        <Panel title="Origem"><BarList items={[...bySource.entries()].sort((a, b) => b[1] - a[1])} empty="Sem dados." /></Panel>
        <Panel title="Cancelamentos">{all.filter((x) => x.status === "cancelled").length} cancelada(s) · {all.filter((x) => (BLOCKING as string[]).includes(x.status)).length} em aberto</Panel>
      </div>
    </div>
  );
}
