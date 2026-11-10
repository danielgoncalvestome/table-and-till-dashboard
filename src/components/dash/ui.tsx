import type { ReactNode } from "react";

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl md:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-md border bg-card p-5 ${className}`}>
      {title && <h2 className="mb-4 font-sans text-sm font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md border bg-card p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-4xl text-primary">{value}</p>
    </div>
  );
}

export function BarList({ items, empty }: { items: [string, number][]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = items[0][1];
  return (
    <ul className="space-y-2">
      {items.map(([k, v]) => (
        <li key={k} className="text-sm">
          <div className="flex justify-between"><span className="truncate">{k}</span><span className="text-muted-foreground">{v}</span></div>
          <div className="mt-1 h-1.5 rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

export function Columns({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(1, ...values);
  return (
    <div className="flex h-32 items-end gap-1">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1" title={`${labels[i]}: ${v}`}>
          <div className="w-full rounded-t bg-primary/80" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 2 : 0 }} />
          <span className="text-[9px] text-muted-foreground">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
