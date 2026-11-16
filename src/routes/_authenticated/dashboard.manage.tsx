import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Settings, Users, CreditCard, Store, LifeBuoy, Search, ChevronRight, Sparkles, type LucideIcon } from "lucide-react";
import { useRestaurant } from "@/lib/restaurant";
import { canAccess } from "@/lib/team-rules";
import { Team } from "@/components/manage/Team";
import { Subscription } from "@/components/manage/Subscription";
import { RestaurantSettings } from "@/components/manage/RestaurantSettings";
import { Help } from "@/components/manage/Help";

type Key = "restaurant" | "team" | "subscription" | "help";
const KEYS: Key[] = ["restaurant", "team", "subscription", "help"];

export const Route = createFileRoute("/_authenticated/dashboard/manage")({
  head: () => ({ meta: [{ title: "Definições — MenuTap" }, { name: "description", content: "Restaurante, equipa, subscrição e ajuda num só lugar." }, { property: "og:title", content: "Definições — MenuTap" }, { property: "og:description", content: "Restaurante, equipa, subscrição e ajuda num só lugar." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ s: KEYS.includes(s.s as Key) ? (s.s as Key) : undefined, checkout: s.checkout === "success" ? ("success" as const) : undefined }),
  component: Manage,
});

const SECTIONS: { key: Key; icon: LucideIcon; title: string; desc: string; tags: string; perm?: "settings" | "team" | "subscription" }[] = [
  { key: "restaurant", icon: Store, title: "Empresa", desc: "Nome, contactos, horário, idiomas e conta", tags: "morada telefone email website instagram google horário descrição exportar password username", perm: "settings" },
  { key: "team", icon: Users, title: "Equipa e locais", desc: "Funcionários, permissões e locais", tags: "membros permissões staff funcionário locais morada", perm: "team" },
  { key: "subscription", icon: CreditCard, title: "Subscrição", desc: "Plano, pagamentos e faturas", tags: "plano pagamento fatura trial experimental preço", perm: "subscription" },
  { key: "help", icon: LifeBuoy, title: "Ajuda", desc: "Perguntas frequentes e contacto", tags: "faq suporte contacto dúvidas", },
];

function Manage() {
  const { restaurant: r } = useRestaurant();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [q, setQ] = useState("");
  const allowed = SECTIONS.filter((s) => !s.perm || canAccess(r.role, r.permissions, s.perm));
  const active = allowed.find((s) => s.key === search.s) ?? allowed[0];
  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? allowed.filter((s) => `${s.title} ${s.desc} ${s.tags}`.toLowerCase().includes(n)) : allowed;
  }, [q, allowed]);
  const go = (k: Key) => navigate({ search: { s: k, checkout: undefined }, replace: true });

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-tile)]"><Settings className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Definições</h1>
            <p className="text-sm text-muted-foreground">Tudo o que gere o {r.name}, num só lugar.</p>
          </div>
        </div>
        <label className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar definição…" className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-sm shadow-[var(--shadow-card)] outline-none transition focus:ring-2 focus:ring-primary/30" />
        </label>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {filtered.map((s) => {
              const on = s.key === active?.key;
              return <li key={s.key}>
                <button onClick={() => go(s.key)} aria-current={on ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-200 ${on ? "border-primary/40 bg-card shadow-[var(--shadow-card-hover)] ring-1 ring-primary/20" : "border-transparent bg-card/60 hover:-translate-y-0.5 hover:bg-card hover:shadow-[var(--shadow-card)]"}`}>
                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}><s.icon className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{s.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{s.desc}</span>
                  </span>
                  <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${on ? "translate-x-0.5 text-primary" : "text-muted-foreground/50 group-hover:translate-x-0.5"}`} />
                </button>
              </li>;
            })}
            {!filtered.length && <li className="rounded-2xl border border-dashed p-4 text-center text-sm text-muted-foreground">Nada encontrado para “{q}”.</li>}
          </ul>
          <div className="mt-4 hidden rounded-2xl border bg-gradient-to-br from-primary/10 to-transparent p-4 lg:block">
            <p className="flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles className="h-3.5 w-3.5" />Dica</p>
            <p className="mt-1 text-xs text-muted-foreground">Use a pesquisa para ir diretamente para uma definição — por exemplo “horário” ou “permissões”.</p>
          </div>
        </aside>

        {active && <section key={active.key} className="min-w-0 animate-in fade-in slide-in-from-bottom-1 duration-300">
          <div className="mb-4 flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)]">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><active.icon className="h-5 w-5" /></span>
            <div><h2 className="text-lg font-semibold tracking-tight">{active.title}</h2><p className="text-xs text-muted-foreground">{active.desc}</p></div>
          </div>
          <div className="manage-body">
            {active.key === "restaurant" && <RestaurantSettings embedded />}
            {active.key === "team" && <Team embedded />}
            {active.key === "subscription" && <Subscription embedded />}
            {active.key === "help" && <Help embedded />}
          </div>
        </section>}
      </div>
    </div>
  );
}
