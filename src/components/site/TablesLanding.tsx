import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode, type PointerEvent as RPE } from "react";
import { ArrowRight, Brain, CalendarCheck, Check, ChefHat, Clock, DoorOpen, Expand, Gauge, Globe, Hand, LayoutGrid, Map as MapIcon, Minus, Move, Plus, QrCode, RefreshCw, Send, Shield, Smartphone, Sparkles, Star, TrendingUp, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

type S = "free" | "reserved" | "seated";
const COLOR: Record<S, string> = { free: "var(--st-free)", reserved: "var(--st-reserved)", seated: "var(--st-seated)" };
const LABEL: Record<S, string> = { free: "Livre", reserved: "Reservada", seated: "Ocupada" };
const NEXT: Record<S, S> = { free: "reserved", reserved: "seated", seated: "free" };

function useReduced() { const [r, setR] = useState(false); useEffect(() => setR(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []); return r; }
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null); const [on, setOn] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => e.isIntersecting && (setOn(true), o.disconnect()), { threshold: 0.15 }); o.observe(el); return () => o.disconnect(); }, []);
  return <div ref={ref} className={`motion-safe-anim transition-all duration-700 ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"} ${className}`}>{children}</div>;
}
const Legend = () => <div className="flex gap-3 text-[11px]">{(Object.keys(LABEL) as S[]).map((s) => <span key={s} className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLOR[s] }} />{LABEL[s]}</span>)}</div>;

function HeroDemo() {
  const reduced = useReduced();
  const [tables, setTables] = useState<S[]>(["free", "seated", "reserved", "free", "seated", "free", "reserved", "free"]);
  const [toast, setToast] = useState(false);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => {
      setTables((t) => { const i = Math.floor(Math.random() * t.length); const n = [...t]; n[i] = NEXT[n[i]]; return n; });
      setToast(true); setTimeout(() => setToast(false), 2200);
    }, 3200);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <div className="relative rounded-xl border bg-card p-4 shadow-xl" aria-label="Demonstração ilustrativa do painel de mesas" role="img">
      <div className="mb-3 flex items-center justify-between text-xs"><span className="font-semibold">Sala · Hoje</span><Legend /></div>
      <div className="grid grid-cols-4 gap-2">
        {tables.map((s, i) => (
          <div key={i} className="motion-safe-anim rounded-lg border-2 p-2 transition-colors duration-500" style={{ borderColor: COLOR[s], background: `color-mix(in oklch, ${COLOR[s]} 14%, transparent)` }}>
            <p className="font-display text-lg leading-none">{i + 1}</p><p className="mt-1 text-[10px] text-muted-foreground">{LABEL[s]}</p>
          </div>
        ))}
      </div>
      <div className={`motion-safe-anim absolute -bottom-4 right-4 flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-xs shadow-lg transition-all duration-500 ${toast ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}><CalendarCheck className="h-4 w-4 text-primary" />Nova reserva online · 4 pessoas · 20:30</div>
    </div>
  );
}

function SimpleDemo() {
  const [t, setT] = useState<S[]>(["free", "reserved", "seated", "free", "reserved", "free"]);
  const [view, setView] = useState<number | null>(1);
  const names = ["—", "Ana · 20:00", "Rui · até 21:30", "—", "Marta · 21:00", "—"];
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-center justify-between text-xs"><span><b>{t.filter((x) => x !== "free").length}</b> reservas hoje</span><Legend /></div>
      <div className="grid grid-cols-3 gap-2">
        {t.map((s, i) => (
          <button key={i} onClick={() => { setT(t.map((x, j) => (j === i ? NEXT[x] : x))); setView(i); }} className="rounded-lg border-2 p-2 text-left transition-colors focus-visible:outline-2" style={{ borderColor: COLOR[s], background: `color-mix(in oklch, ${COLOR[s]} 14%, transparent)` }} aria-label={`Mesa ${i + 1}: ${LABEL[s]}. Clique para mudar o estado.`}>
            <p className="font-display text-xl">{i + 1}</p><p className="text-[10px] text-muted-foreground">{LABEL[s]}</p>
          </button>
        ))}
      </div>
      <p className="mt-3 min-h-5 text-xs text-muted-foreground">{view !== null ? `Mesa ${view + 1} · ${names[view]}` : ""}</p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Hand className="h-3 w-3" />Toque numa mesa para mudar o estado (exemplo)</p>
    </div>
  );
}

const PLAN = [
  { n: 1, x: 6, y: 10, w: 12, h: 16, r: true, s: "seated" as S, c: 2 }, { n: 2, x: 24, y: 10, w: 12, h: 16, r: true, s: "free" as S, c: 2 },
  { n: 3, x: 6, y: 42, w: 30, h: 16, r: false, s: "reserved" as S, c: 6 }, { n: 4, x: 6, y: 72, w: 14, h: 18, r: false, s: "free" as S, c: 4 },
  { n: 5, x: 24, y: 72, w: 14, h: 18, r: false, s: "seated" as S, c: 4 }, { n: 6, x: 60, y: 14, w: 14, h: 18, r: true, s: "reserved" as S, c: 4 },
  { n: 7, x: 80, y: 14, w: 14, h: 18, r: true, s: "free" as S, c: 4 }, { n: 8, x: 60, y: 54, w: 34, h: 18, r: false, s: "seated" as S, c: 8 },
];
function AdvancedDemo() {
  const [sel, setSel] = useState(3);
  const t = PLAN.find((p) => p.n === sel)!;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-2 flex justify-between text-xs"><span><b>Sala</b> · Esplanada</span><Legend /></div>
      <div className="relative aspect-[16/10] rounded-md border" style={{ backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)", backgroundSize: "16px 16px" }}>
        <div className="absolute inset-y-0 left-[50%] w-1 bg-muted-foreground/40" aria-hidden />
        <span className="absolute left-[2%] top-[1%] text-[9px] text-muted-foreground">SALA</span><span className="absolute left-[56%] top-[1%] text-[9px] text-muted-foreground">ESPLANADA</span>
        <div className="absolute bottom-[3%] left-[60%] h-[8%] w-[34%] rounded-sm bg-muted-foreground/30" aria-hidden />
        {PLAN.map((p) => (
          <button key={p.n} onClick={() => setSel(p.n)} aria-label={`Mesa ${p.n}, ${p.c} lugares, ${LABEL[p.s]}`} className={`absolute grid place-items-center text-xs font-bold text-primary-foreground transition-transform hover:scale-105 ${p.r ? "rounded-full" : "rounded-md"} ${sel === p.n ? "ring-2 ring-foreground ring-offset-2" : ""}`} style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.w}%`, height: `${p.h}%`, background: COLOR[p.s] }}>{p.n}</button>
        ))}
      </div>
      <p className="mt-3 text-xs"><b>Mesa {t.n}</b> · {t.c} lugares · {LABEL[t.s]}{t.s === "reserved" ? " · 20:30" : t.s === "seated" ? " · liberta 21:45" : ""}</p>
    </div>
  );
}

function FlowDemo() {
  const reduced = useReduced(); const [step, setStep] = useState(reduced ? 3 : 0);
  useEffect(() => { if (reduced) return; const id = setInterval(() => setStep((s) => (s + 1) % 4), 2000); return () => clearInterval(id); }, [reduced]);
  const steps = [[Smartphone, "O cliente reserva online"], [CalendarCheck, "Aparece no painel"], [Sparkles, "O sistema escolhe a mesa ideal"], [Hand, "A equipa confirma ou altera"]] as const;
  return (
    <ol className="grid gap-3 sm:grid-cols-4">
      {steps.map(([I, l], i) => (
        <li key={l} className={`motion-safe-anim rounded-xl border p-4 transition-all duration-500 ${i <= step ? "border-primary bg-card shadow-md" : "bg-card/40 opacity-60"}`}>
          <I className="h-6 w-6 text-primary" /><p className="mt-3 text-xs text-muted-foreground">{i + 1}</p><p className="text-sm font-medium">{l}</p>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Floor plan editor ---------- */
type FT = { id: number; x: number; y: number; round: boolean; seats: number };
function FloorEditorDemo() {
  const [edit, setEdit] = useState(true);
  const [tables, setTables] = useState<FT[]>([
    { id: 1, x: 10, y: 15, round: true, seats: 2 }, { id: 2, x: 36, y: 15, round: true, seats: 2 },
    { id: 3, x: 62, y: 15, round: false, seats: 4 }, { id: 4, x: 10, y: 58, round: false, seats: 6 }, { id: 5, x: 50, y: 58, round: false, seats: 4 },
  ]);
  const box = useRef<HTMLDivElement>(null); const drag = useRef<number | null>(null);
  const move = (e: RPE) => {
    if (drag.current === null || !box.current) return;
    const r = box.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(82, ((e.clientX - r.left) / r.width) * 100 - 9));
    const y = Math.max(0, Math.min(74, ((e.clientY - r.top) / r.height) * 100 - 12));
    setTables((t) => t.map((p) => (p.id === drag.current ? { ...p, x, y } : p)));
  };
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 font-semibold"><MapIcon className="h-3.5 w-3.5 text-primary" />Planta · Sala principal</span>
        <div className="flex gap-1.5">
          <button onClick={() => setTables((t) => [...t, { id: t.length + 1, x: 40, y: 38, round: t.length % 2 === 0, seats: 4 }].slice(0, 9))} className="flex items-center gap-1 rounded-full border px-2.5 py-1 hover:bg-muted"><Plus className="h-3 w-3" />Mesa</button>
          <button onClick={() => setEdit(!edit)} className={`rounded-full px-2.5 py-1 transition-colors ${edit ? "bg-primary text-primary-foreground" : "border hover:bg-muted"}`}>{edit ? "A editar" : "Editar planta"}</button>
        </div>
      </div>
      <div ref={box} onPointerMove={move} onPointerUp={() => (drag.current = null)} onPointerLeave={() => (drag.current = null)} className="relative aspect-[16/10] touch-none rounded-xl border" style={{ backgroundImage: edit ? "radial-gradient(var(--border) 1px, transparent 1px)" : undefined, backgroundSize: "14px 14px" }}>
        {tables.map((t) => (
          <div key={t.id} onPointerDown={(e) => { if (!edit) return; drag.current = t.id; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            className={`tl-in absolute grid w-[18%] place-items-center border-2 text-xs font-bold transition-shadow ${t.round ? "aspect-square rounded-full" : "aspect-[4/3] rounded-lg"} ${edit ? "cursor-grab border-dashed border-primary bg-primary/10 shadow-md active:cursor-grabbing" : "border-transparent"}`}
            style={{ left: `${t.x}%`, top: `${t.y}%`, background: edit ? undefined : "color-mix(in oklch, var(--st-free) 45%, transparent)" }}>
            <span>{t.id}<span className="block text-[9px] font-normal text-muted-foreground">{t.seats} lug.</span></span>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground"><Move className="h-3 w-3" />Arraste as mesas para desenhar a sua sala (exemplo)</p>
    </div>
  );
}

/* ---------- Orders cards ---------- */
type OS = "new" | "prep" | "ready" | "done";
const OS_L: Record<OS, string> = { new: "Novo", prep: "Em preparação", ready: "Pronto", done: "Entregue" };
const OS_NEXT: Record<OS, [OS, string] | null> = { new: ["prep", "Começar"], prep: ["ready", "Pronto"], ready: ["done", "Entregar"], done: null };
const OS_C: Record<OS, string> = { new: "var(--st-seated)", prep: "var(--st-reserved)", ready: "var(--st-free)", done: "var(--muted-foreground)" };
function OrdersDemo() {
  const reduced = useReduced();
  const seed = [
    { id: 1, t: 4, items: ["2× Bacalhau à Brás", "1× Vinho verde"], note: "sem azeitonas", s: "new" as OS, min: 1 },
    { id: 2, t: 7, items: ["4× Pastel de nata", "2× Café"], note: "", s: "prep" as OS, min: 6 },
    { id: 3, t: 2, items: ["1× Polvo à lagareiro"], note: "", s: "ready" as OS, min: 12 },
  ];
  const [orders, setOrders] = useState(seed);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setOrders((o) => {
      const n = o.map((x) => ({ ...x, min: x.min + 1 }));
      const i = n.findIndex((x) => x.s !== "done");
      if (i >= 0 && Math.random() > 0.4) n[i] = { ...n[i], s: OS_NEXT[n[i].s]![0] };
      const open = n.filter((x) => x.s !== "done");
      return open.length < 2 ? [...open, { ...seed[Math.floor(Math.random() * 3)], id: Date.now(), s: "new", min: 0, t: 1 + Math.floor(Math.random() * 9) }] : open;
    }), 2600);
    return () => clearInterval(id);
  }, [reduced]);
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold"><ChefHat className="h-3.5 w-3.5 text-primary" />Pedidos</span>
        <div className="flex rounded-full border p-0.5 text-[10px]">{["Em aberto", "Entregues", "Todos"].map((l, i) => <span key={l} className={`rounded-full px-2 py-0.5 ${i === 0 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{l}</span>)}</div>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {orders.slice(0, 3).map((o) => (
          <div key={o.id} className="tl-in rounded-xl border p-3 transition-all duration-500" style={{ borderColor: o.s === "new" ? OS_C.new : undefined }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-lg leading-none">Mesa {o.t}</span>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-semibold transition-colors duration-500" style={{ background: `color-mix(in oklch, ${OS_C[o.s]} 35%, transparent)` }}>{OS_L[o.s]}</span>
            </div>
            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground"><Clock className="h-3 w-3" />há {o.min} min</p>
            <ul className="mt-2 space-y-0.5 text-[11px]">{o.items.map((x) => <li key={x}>{x}</li>)}</ul>
            {o.note && <p className="mt-1 text-[10px] italic text-muted-foreground">“{o.note}”</p>}
            {OS_NEXT[o.s] && <button onClick={() => setOrders((all) => all.map((x) => (x.id === o.id ? { ...x, s: OS_NEXT[x.s]![0] } : x)))} className="mt-2 w-full rounded-lg bg-primary py-1 text-[11px] font-medium text-primary-foreground transition-transform hover:scale-[1.02] active:scale-95">{OS_NEXT[o.s]![1]}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Order from table ---------- */
const DISHES = [["Entradas", "Pão & azeitonas", 2.5], ["Entradas", "Queijo da Serra", 8], ["Pratos", "Bacalhau à Brás", 14.5], ["Pratos", "Polvo à lagareiro", 18], ["Sobremesas", "Pastel de nata", 1.6]] as const;
function TableOrderDemo() {
  const [q, setQ] = useState<number[]>([1, 0, 2, 0, 2]);
  const [sent, setSent] = useState(false);
  const total = q.reduce((a, n, i) => a + n * DISHES[i][2], 0);
  let last = "";
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-xs"><span className="font-semibold">Mesa 5 · Fazer pedido</span><span className="rounded-full px-2 py-0.5 text-[10px]" style={{ background: "color-mix(in oklch, var(--st-seated) 40%, transparent)" }}>Ocupada</span></div>
      <div className="space-y-1">
        {DISHES.map(([c, n, p], i) => {
          const head = c !== last; last = c;
          return (
            <div key={n}>
              {head && <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{c}</p>}
              <div className="flex items-center justify-between rounded-lg px-2 py-1 text-xs hover:bg-muted/60">
                <span>{n} <span className="text-muted-foreground">· {p.toFixed(2).replace(".", ",")} €</span></span>
                <span className="flex items-center gap-1.5">
                  <button aria-label={`Menos ${n}`} onClick={() => setQ(q.map((x, j) => (j === i ? Math.max(0, x - 1) : x)))} className="grid h-5 w-5 place-items-center rounded-full border"><Minus className="h-3 w-3" /></button>
                  <span className="w-3 text-center tabular-nums">{q[i]}</span>
                  <button aria-label={`Mais ${n}`} onClick={() => setQ(q.map((x, j) => (j === i ? x + 1 : x)))} className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Plus className="h-3 w-3" /></button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <button onClick={() => { setSent(true); setTimeout(() => setSent(false), 1800); }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2 text-xs font-medium text-primary-foreground transition-all active:scale-95">
        {sent ? <><Check className="h-3.5 w-3.5" />Enviado para os pedidos</> : <><Send className="h-3.5 w-3.5" />Enviar pedido · {total.toFixed(2).replace(".", ",")} €</>}
      </button>
    </div>
  );
}

/* ---------- Menu intelligence ---------- */
const MI = [["Polvo", 80, 82], ["Bacalhau", 72, 40], ["Bitoque", 30, 70], ["Salada", 25, 25], ["Nata", 85, 20], ["Risotto", 45, 85]] as const;
function IntelligenceDemo() {
  const [range, setRange] = useState(30);
  const [sel, setSel] = useState(0);
  const k = range === 7 ? 0.8 : range === 90 ? 1.1 : 1;
  const pts = MI.map(([n, x, y], i) => ({ n, x: Math.min(92, Math.max(8, x * k + (i % 2 ? 4 : -4) * (k - 1) * 10)), y: Math.min(92, Math.max(8, y / k)) }));
  const quad = (p: { x: number; y: number }) => (p.x >= 50 ? (p.y >= 50 ? "Estrela" : "Cavalo de batalha") : p.y >= 50 ? "Enigma" : "Cão");
  const s = pts[sel];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-semibold"><Brain className="h-3.5 w-3.5 text-primary" />Menu Intelligence</span>
        <div className="flex rounded-full border p-0.5 text-[10px]">{[7, 30, 90].map((r) => <button key={r} onClick={() => setRange(r)} className={`rounded-full px-2 py-0.5 transition-colors ${range === r ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>{r}d</button>)}</div>
      </div>
      <div className="relative aspect-[16/10] rounded-xl border">
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed" /><div className="absolute inset-y-0 left-1/2 border-l border-dashed" />
        {[["Enigma", "left-2 top-1"], ["Estrela", "right-2 top-1"], ["Cão", "left-2 bottom-1"], ["Cavalo de batalha", "right-2 bottom-1"]].map(([l, c]) => <span key={l} className={`absolute ${c} text-[9px] uppercase tracking-wider text-muted-foreground`}>{l}</span>)}
        {pts.map((p, i) => (
          <button key={p.n} onClick={() => setSel(i)} className="motion-safe-anim absolute -translate-x-1/2 translate-y-1/2 transition-all duration-700 ease-out" style={{ left: `${p.x}%`, bottom: `${p.y}%` }} aria-label={p.n}>
            {sel === i && <span className="tl-ping absolute inset-0 rounded-full bg-primary" />}
            <span className={`relative block h-3 w-3 rounded-full ${sel === i ? "bg-primary" : "bg-primary/50"}`} />
            <span className="absolute left-4 top-[-3px] whitespace-nowrap text-[10px]">{p.n}</span>
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2 text-xs">
        <span><b>{s.n}</b> · {quad(s)}</span>
        <span className="flex items-center gap-1 text-primary"><TrendingUp className="h-3 w-3" />{quad(s) === "Estrela" ? "Manter em destaque" : quad(s) === "Enigma" ? "Promover no menu" : quad(s) === "Cão" ? "Rever ou retirar" : "Ajustar o preço"}</span>
      </div>
    </div>
  );
}

/* ---------- Dashboard KPIs ---------- */
function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null); const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (!e.isIntersecting) return; o.disconnect(); const t0 = performance.now(); const f = (t: number) => { const p = Math.min(1, (t - t0) / 1200); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); });
    o.observe(el); return () => o.disconnect();
  }, [to]);
  return <span ref={ref} className="tabular-nums">{v}{suffix}</span>;
}
function DashboardDemo() {
  const kpis = [[CalendarCheck, "Reservas hoje", 24, ""], [Users, "Pessoas", 86, ""], [LayoutGrid, "Ocupação", 72, "%"], [ChefHat, "Pedidos abertos", 9, ""]] as const;
  const bars = [40, 65, 52, 80, 95, 70, 88];
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold"><Gauge className="h-3.5 w-3.5 text-primary" />Dashboard</p>
      <div className="grid grid-cols-2 gap-2">
        {kpis.map(([I, l, n, s]) => (
          <div key={l} className="rounded-xl border p-3 transition-transform hover:-translate-y-0.5">
            <I className="h-4 w-4 text-primary" /><p className="mt-2 font-display text-2xl leading-none"><Count to={n} suffix={s} /></p><p className="mt-1 text-[10px] text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex h-20 items-end gap-1.5 rounded-xl border p-2">
        {bars.map((b, i) => <Reveal key={i} className="flex h-full flex-1 items-end"><div className="w-full rounded-t-md bg-primary/70" style={{ height: `${b}%` }} /></Reveal>)}
      </div>
    </div>
  );
}

const FEATURES: [typeof Clock, string, string][] = [
  [MapIcon, "Editor de planta", "Desenhe salas e esplanadas a arrastar mesas, redondas ou retangulares."],
  [Expand, "Ecrã inteiro", "Controlo da sala e pedidos em ecrã inteiro para tablets e monitores."],
  [DoorOpen, "Cliente à porta", "Sente quem chega sem reserva em dois toques."],
  [ChefHat, "Pedidos com cartões", "Novo, em preparação, pronto, entregue — com notas e tempos."],
  [Send, "Pedido pelo menu digital ou mesa", "A equipa faz o pedido a partir da mesa ocupada ou o cliente pede pelo Menu."],
  [Brain, "Menu Intelligence", "Descubra estrelas, enigmas e pratos a rever."],
  [Gauge, "Dashboard personalizável", "Arraste e redimensione os cartões à sua medida."],
  [Users, "Equipa e permissões", "Convide colaboradores e decida quem edita a sala."],
  [QrCode, "Menu digital incluído", "Menu por QR code e NFC, sempre atualizado."],
  [Globe, "Português e inglês", "Painel e menus bilingues para os seus clientes."],
  [Star, "Avaliações", "Receba opiniões e reforce a reputação no Google."],
  [Shield, "Sem reservas duplicadas", "O sistema bloqueia conflitos de mesa automaticamente."],
];

function Showcase({ eyebrow, icon: I, title, text, points, demo, flip }: { eyebrow: string; icon: typeof Clock; title: string; text: string; points: string[]; demo: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-2">
      <Reveal className={flip ? "md:order-2" : ""}>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><I className="h-4 w-4" />{eyebrow}</p>
        <h3 className="mt-2 text-2xl md:text-4xl">{title}</h3>
        <p className="mt-3 text-muted-foreground">{text}</p>
        <ul className="mt-5 space-y-2">{points.map((p) => <li key={p} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-primary" />{p}</li>)}</ul>
      </Reveal>
      <Reveal className={flip ? "md:order-1" : ""}>{demo}</Reveal>
    </div>
  );
}

function PlatformSections() {
  return (
    <>
      <section className="mx-auto max-w-6xl space-y-24 px-5 py-24">
        <Reveal className="mx-auto max-w-2xl text-center"><p className="eyebrow text-primary">A plataforma completa</p><h2 className="mt-3 text-3xl md:text-5xl">Da porta à cozinha. Da mesa aos números.</h2><p className="mt-4 text-muted-foreground">Experimente os exemplos abaixo — são interativos.</p></Reveal>
        <Showcase eyebrow="Editor de planta" icon={MapIcon} title="Desenhe a sua sala em minutos." text="Arraste mesas, escolha a forma e os lugares, e organize várias salas e esplanadas. A planta fica igual ao seu espaço real." points={["Mesas redondas e retangulares", "Várias salas e zonas", "Permissão própria para editar a sala"]} demo={<FloorEditorDemo />} />
        <Showcase flip eyebrow="Pedidos" icon={ChefHat} title="Cada pedido, um cartão claro." text="Os pedidos chegam em cartões com o estado, os pratos, as notas e há quanto tempo entraram. Um toque avança para o passo seguinte." points={["Novo → Em preparação → Pronto → Entregue", "Filtro por estado no topo", "Modo ecrã inteiro para a cozinha"]} demo={<OrdersDemo />} />
        <Showcase eyebrow="Pedido pela mesa" icon={Send} title="Toque na mesa. Faça o pedido." text="Com a mesa ocupada, a equipa abre um menu simples por categorias, junta os pratos e envia diretamente para os pedidos." points={["Pratos e preços sempre do menu", "Ver os pedidos de cada mesa", "Total da mesa em tempo real"]} demo={<TableOrderDemo />} />
        <Showcase flip eyebrow="Menu Intelligence" icon={Brain} title="Saiba o que cada prato vale." text="Cruzamos popularidade e rentabilidade para mostrar onde está cada prato e o que fazer a seguir." points={["Matriz de engenharia de menu", "Períodos de 7, 30 e 90 dias", "Oportunidades sugeridas"]} demo={<IntelligenceDemo />} />
        <Showcase eyebrow="Dashboard" icon={Gauge} title="O seu dia, num relance." text="Reservas, pessoas, ocupação e pedidos em cartões que pode arrastar e redimensionar à sua medida." points={["Ações rápidas", "Mesas que ficam livres em breve", "Disposição guardada por restaurante"]} demo={<DashboardDemo />} />
      </section>

      <section className="border-y bg-card/50 py-24">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="max-w-2xl"><p className="eyebrow text-primary">Tudo incluído</p><h2 className="mt-3 text-3xl md:text-5xl">Tudo o que precisa. Nada a mais.</h2></Reveal>
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([I, t, d], i) => (
              <Reveal key={t}><div className="group h-full rounded-2xl border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg" style={{ transitionDelay: `${(i % 4) * 40}ms` }}>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110"><I className="h-5 w-5" /></span>
                <h3 className="mt-4 font-sans text-sm font-semibold">{t}</h3><p className="mt-1 text-xs text-muted-foreground">{d}</p>
              </div></Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function TablesPricing() {
  const inc = ["Reservas online e manuais", "Editor de planta e várias salas", "Pedidos com cartões e pedido pela mesa", "Menu Intelligence e dashboard", "Menu digital por QR e NFC incluído", "Equipa com permissões por pessoa"];
  return (
    <section className="mx-auto max-w-6xl px-5 py-24">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="eyebrow text-primary">Preço</p>
        <h2 className="mt-3 text-4xl">Um plano. Tudo incluído.</h2>
        <div className="relative mt-10 overflow-hidden rounded-3xl border bg-card p-8 text-left shadow-xl md:p-10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" aria-hidden />
          <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-sm font-semibold">Gestão e Reservas</p>
              <p className="mt-3 text-5xl">19,90 € <span className="text-lg text-muted-foreground">/ mês</span></p>
              <p className="mt-3 text-sm text-muted-foreground">10 dias grátis, sem cartão. Cancele quando quiser.</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Começar agora <ArrowRight /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/pricing">Ver preços</Link></Button>
              </div>
            </div>
            <ul className="space-y-2.5">{inc.map((x) => <li key={x} className="flex items-center gap-2 text-sm"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary"><Check className="h-3 w-3" /></span>{x}</li>)}</ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

const Benefit = ({ children }: { children: ReactNode }) => <li className="flex items-center gap-2 text-sm"><span className="h-1.5 w-1.5 rounded-full bg-primary" />{children}</li>;

export function TablesLanding() {
  return (
      <>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 md:grid-cols-2 md:pt-24">
          <div>
            <p className="eyebrow text-primary">Mesas e reservas</p>
            <h1 className="mt-3 text-4xl leading-tight md:text-6xl">As suas mesas. As suas reservas. Tudo sob controlo.</h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">Uma gestão de mesas e reservas pensada para o seu restaurante. Simples quando precisa de simplicidade. Avançada quando precisa de mais.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
              <Button size="lg" variant="outline" onClick={() => document.getElementById("modos")?.scrollIntoView({ behavior: "smooth" })}>Explorar funcionalidades</Button>
            </div>
          </div>
          <div className="tl-float motion-safe-anim"><HeroDemo /></div>
        </section>

        <section id="modos" className="scroll-mt-20 border-y bg-card/50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="max-w-2xl"><h2 className="text-3xl md:text-5xl">O seu restaurante não é igual aos outros. A sua gestão também não tem de ser.</h2><p className="mt-4 text-muted-foreground">Escolha a experiência que melhor acompanha a dimensão e as necessidades do seu estabelecimento.</p></Reveal>
            <div className="mt-12 grid gap-10 md:grid-cols-2">
              <Reveal>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><LayoutGrid className="h-4 w-4" />Modo simples</p>
                <h3 className="mt-2 text-2xl md:text-3xl">Simples por natureza. Completo no essencial.</h3>
                <p className="mt-2 text-sm text-muted-foreground">Todas as ferramentas essenciais para organizar as suas mesas e gerir reservas, sem configurações complicadas.</p>
                <div className="mt-5"><SimpleDemo /></div>
                <ul className="mt-5 grid grid-cols-2 gap-2"><Benefit>Configuração rápida</Benefit><Benefit>Reservas online e manuais</Benefit><Benefit>Atribuição automática de mesas</Benefit><Benefit>Controlo imediato da ocupação</Benefit></ul>
                <p className="mt-4 text-xs text-muted-foreground">Ideal para cafés, pequenos restaurantes e estabelecimentos que valorizam a simplicidade.</p>
              </Reveal>
              <Reveal>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary"><MapIcon className="h-4 w-4" />Modo avançado</p>
                <h3 className="mt-2 text-2xl md:text-3xl">Controlo total. Sem deixar nada ao acaso.</h3>
                <p className="mt-2 text-sm text-muted-foreground">Uma solução completa para gerir espaços, mesas e reservas com maior flexibilidade e precisão.</p>
                <div className="mt-5"><AdvancedDemo /></div>
                <ul className="mt-5 grid grid-cols-2 gap-2"><Benefit>Planta visual interativa</Benefit><Benefit>Atribuição automática otimizada</Benefit><Benefit>Gestão de várias salas e mesas</Benefit><Benefit>Controlo detalhado da ocupação</Benefit></ul>
                <p className="mt-4 text-xs text-muted-foreground">Ideal para restaurantes com várias salas, maior capacidade ou operações mais exigentes.</p>
              </Reveal>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="max-w-2xl"><h2 className="text-3xl md:text-5xl">Todas as reservas. Num único lugar.</h2><p className="mt-4 text-muted-foreground">Receba reservas diretamente dos seus clientes ou registe-as manualmente. Tudo sincronizado, atualizado e organizado num só sistema.</p></Reveal>
          <Reveal className="mt-10"><FlowDemo /></Reveal>
          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-3">{[[Clock, "Reservas online 24 horas por dia"], [Users, "Reservas introduzidas pela equipa"], [Hand, "Atribuição automática com controlo manual"]].map(([I, l]) => { const Ic = I as typeof Clock; return <p key={l as string} className="flex items-center gap-2"><Ic className="h-4 w-4 text-primary" />{l as string}</p>; })}</div>
        </section>

        <section className="border-t bg-card/50 py-20">
          <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-4">
            <Reveal><h2 className="text-3xl">Menos confusão. Mais controlo.</h2></Reveal>
            {[[RefreshCw, "Tudo sincronizado", "Reservas e ocupação atualizadas num único sistema."], [Zap, "Menos trabalho manual", "Atribuição automática de mesas e organização das reservas."], [Hand, "Mais flexibilidade", "A equipa mantém sempre a possibilidade de intervir e alterar a organização."]].map(([I, h, p]) => { const Ic = I as typeof Clock; return <Reveal key={h as string}><Ic className="h-6 w-6 text-primary" /><h3 className="mt-3 font-sans text-base font-semibold">{h as string}</h3><p className="mt-1 text-sm text-muted-foreground">{p as string}</p></Reveal>; })}
          </div>
        </section>

        <PlatformSections />
        <TablesPricing />

        <section className="mx-auto max-w-6xl px-5 py-20">
          <div className="rounded-2xl bg-primary px-6 py-14 text-center text-primary-foreground md:px-16">
            <h2 className="mx-auto max-w-3xl text-3xl md:text-5xl">Dê ao seu restaurante uma forma mais inteligente de gerir reservas.</h2>
            <p className="mx-auto mt-4 max-w-xl opacity-80">Escolha o modo ideal para o seu estabelecimento e comece a simplificar a gestão das suas mesas.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/auth" search={{ mode: "signup" }}>Começar agora</Link></Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"><Link to="/" search={{ p: undefined }}>Conhecer o MenuTap</Link></Button>
            </div>
          </div>
        </section>
      </>
  );
}
