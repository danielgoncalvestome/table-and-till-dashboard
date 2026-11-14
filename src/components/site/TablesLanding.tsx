import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarCheck, Clock, Hand, LayoutGrid, Map as MapIcon, RefreshCw, Smartphone, Sparkles, Users, Zap } from "lucide-react";
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
          <HeroDemo />
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
      </div>
  );
}
