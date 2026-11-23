import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PageTitle({ title, sub, action, icon: Icon }: { title: string; sub?: string; action?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-8 grid grid-cols-1 items-end gap-4 sm:flex sm:flex-wrap sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon className="h-5 w-5" strokeWidth={1.5} /></span>}
        <div className="min-w-0">
          <h1 className="break-words font-sans text-2xl font-semibold md:text-[1.7rem]">{title}</h1>
          {sub && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
        </div>
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Card section. With a title it gets a header that collapses the body; state is remembered per title. */
export function Panel({ title, children, className = "", icon: Icon, action, collapsible = true, defaultOpen = true }: { title?: string; children: ReactNode; className?: string; icon?: LucideIcon; action?: ReactNode; collapsible?: boolean; defaultOpen?: boolean }) {
  const key = title ? `mt-panel-${title}` : null;
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => { if (key) { const v = localStorage.getItem(key); if (v) setOpen(v === "1"); } }, [key]);
  const toggle = () => { const v = !open; setOpen(v); if (key) localStorage.setItem(key, v ? "1" : "0"); };
  return (
    <section className={`dash-card p-5 ${className}`}>
      {title && (
        <header className={`flex items-center justify-between gap-2 ${open ? "mb-4" : ""}`}>
          <Button variant="ghost" type="button" onClick={collapsible ? toggle : undefined} className="group h-auto min-w-0 justify-start gap-2.5 p-0 text-left hover:bg-transparent" aria-expanded={open}>
            {Icon && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-muted/60 text-foreground/80"><Icon className="h-4 w-4" /></span>}
            <h2 className="truncate font-sans text-sm font-semibold">{title}</h2>
            {collapsible && <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground ${open ? "" : "-rotate-90"}`} />}
          </Button>
          {action}
        </header>
      )}
      {open && <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">{children}</div>}
    </section>
  );
}

export function Delta({ value }: { value: number }) {
  const up = value >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${up ? "border-st-free/30 bg-st-free/10 text-st-free" : "border-destructive/30 bg-destructive/10 text-destructive"}`}><Icon className="h-3 w-3" />{Math.abs(value)}%</span>;
}

export function Stat({ label, value, icon: Icon, delta, hint, highlight }: { label: string; value: ReactNode; icon?: LucideIcon; delta?: number; hint?: string; highlight?: boolean }) {
  return (
    <div className={`dash-card group p-5 transition-shadow hover:shadow-[var(--shadow-card-hover)] ${highlight ? "bg-muted/50" : ""}`}>
      {Icon && <span className={`mb-4 grid h-9 w-9 place-items-center rounded-xl ${highlight ? "bg-accent text-foreground" : "bg-muted text-muted-foreground"}`}><Icon className="h-4 w-4" /></span>}
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <p className="font-sans text-3xl font-semibold tabular-nums">{value}</p>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function BarList({ items, empty }: { items: [string, number][]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = items[0][1] || 1;
  return (
    <ul className="space-y-3">
      {items.map(([k, v]) => (
        <li key={k} className="group text-sm">
          <div className="flex justify-between gap-2"><span className="truncate">{k}</span><span className="font-semibold tabular-nums">{v}</span></div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-chart-1" style={{ width: `${(v / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Columns({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-36 items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${labels[i]}: ${v}`}>
          <span className="text-[10px] font-semibold opacity-0 transition-opacity group-hover:opacity-100">{v}</span>
          <div className="w-full rounded-md bg-chart-1/80" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 3 : 0 }} />
          <span className="text-[9px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
