import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Brain, Crown, Eye, Flame, HelpCircle, Image as ImageIcon, Lightbulb, MousePointerClick, Search, ShoppingBag, Sparkles, Star, TrendingDown, Utensils, type LucideIcon } from "lucide-react";
import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Cell } from "recharts";
import { useRestaurant } from "@/lib/restaurant";
import { useCatalog } from "@/lib/use-catalog";
import { fetchEvents, summarize } from "@/lib/analytics";
import { fetchOrders, summarizeOrders } from "@/lib/insights";
import { formatPrice } from "@/lib/menu";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle, Panel, Stat } from "@/components/dash/ui";

const META = "Matriz de engenharia de menu: popularidade, preço, avaliações e oportunidades por prato.";
export const Route = createFileRoute("/_authenticated/dashboard/intelligence")({
  head: () => ({ meta: [{ title: "Menu Intelligence — MenuTap" }, { name: "description", content: META }, { property: "og:title", content: "Menu Intelligence — MenuTap" }, { property: "og:description", content: META }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Intelligence,
});

type Q = "star" | "plow" | "puzzle" | "dog";
const QUAD: Record<Q, { label: string; hint: string; icon: LucideIcon; color: string; tip: string }> = {
  star: { label: "Estrelas", hint: "Populares e de valor alto", icon: Crown, color: "var(--chart-1)", tip: "Destaque no topo do menu e mantenha a qualidade." },
  plow: { label: "Cavalos de trabalho", hint: "Populares, valor baixo", icon: Flame, color: "var(--chart-2)", tip: "Teste um pequeno aumento de preço ou um acompanhamento." },
  puzzle: { label: "Enigmas", hint: "Valor alto, pouca procura", icon: HelpCircle, color: "var(--chart-4)", tip: "Melhore foto e descrição ou recomende-o mais." },
  dog: { label: "A rever", hint: "Pouca procura, valor baixo", icon: TrendingDown, color: "var(--chart-5)", tip: "Pense em reformular ou retirar do menu." },
};

function Intelligence() {
  const { restaurant: r } = useRestaurant();
  const [days, setDays] = useState(30);
  const [focus, setFocus] = useState<Q | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"score" | "views" | "orders" | "price" | "rating">("score");
  const [sel, setSel] = useState<string | null>(null);
  const { data: ev } = useQuery({ queryKey: ["events", r.id, days], queryFn: () => fetchEvents(r.id, days) });
  const { data: ord } = useQuery({ queryKey: ["an-orders", r.id, days], queryFn: () => fetchOrders(r.id, days) });
  const { data: cat } = useCatalog(r.id);
  const { data: ratings } = useQuery({ queryKey: ["ratings", r.id], queryFn: async () => (await supabase.rpc("dish_rating_summary", { _restaurant_id: r.id })).data ?? [] });

  const rows = useMemo(() => {
    if (!ev || !ord || !cat) return [];
    const s = summarize(ev), o = summarizeOrders(ord);
    const views = new Map(s.topDishes), clicks = new Map(s.recClicks), sold = new Map(o.topItems);
    const rat = new Map((ratings ?? []).map((x) => [x.dish_id, { avg: Number(x.avg_stars), n: Number(x.total) }]));
    const list = cat.dishes.filter((d) => !d.archived).map((d) => {
      const v = views.get(d.id) ?? 0, n = sold.get(d.name) ?? 0, price = Number(d.price ?? 0);
      return { id: d.id, name: d.name, img: d.image_url as string | null, cat: cat.cats.find((c) => c.id === d.category_id)?.name ?? "—", available: d.available, price, views: v, orders: n, clicks: clicks.get(d.id) ?? 0, rating: rat.get(d.id), pop: n * 3 + v, conv: v ? n / v : 0 };
    });
    const avgPop = list.length ? list.reduce((a, x) => a + x.pop, 0) / list.length : 0;
    const prices = list.map((x) => x.price).sort((a, b) => a - b);
    const medPrice = prices.length ? prices[Math.floor(prices.length / 2)] : 0;
    const maxPop = Math.max(1, ...list.map((x) => x.pop)), maxPrice = Math.max(1, ...prices);
    return list.map((x) => {
      const quad: Q = x.pop >= avgPop ? (x.price >= medPrice ? "star" : "plow") : x.price >= medPrice ? "puzzle" : "dog";
      const score = Math.round(55 * (x.pop / maxPop) + 25 * (x.price / maxPrice) + 20 * ((x.rating?.avg ?? 3) / 5));
      return { ...x, quad, score, avgPop, medPrice };
    });
  }, [ev, ord, cat, ratings]);

  if (!ev || !ord || !cat) return <p className="text-muted-foreground">A carregar…</p>;
  const count = (k: Q) => rows.filter((x) => x.quad === k).length;
  const shown = rows.filter((x) => (!focus || x.quad === focus) && x.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => sort === "rating" ? (b.rating?.avg ?? 0) - (a.rating?.avg ?? 0) : (b[sort] as number) - (a[sort] as number));
  const pick = rows.find((x) => x.id === sel) ?? null;
  const totViews = rows.reduce((a, x) => a + x.views, 0), totOrders = rows.reduce((a, x) => a + x.orders, 0);
  const rated = rows.filter((x) => x.rating);
  const avgRating = rated.length ? rated.reduce((a, x) => a + x.rating!.avg, 0) / rated.length : 0;
  const health = rows.length ? Math.round(rows.reduce((a, x) => a + x.score, 0) / rows.length) : 0;

  const tips: { icon: LucideIcon; text: string; id?: string }[] = [];
  for (const x of rows.filter((x) => x.quad === "puzzle").slice(0, 2)) tips.push({ icon: Sparkles, text: `“${x.name}” tem valor alto mas pouca procura — ative-o como recomendação.`, id: x.id });
  for (const x of rows.filter((x) => x.views > 0 && !x.img).sort((a, b) => b.views - a.views).slice(0, 2)) tips.push({ icon: ImageIcon, text: `“${x.name}” é visto ${x.views}× sem foto — uma imagem aumenta pedidos.`, id: x.id });
  for (const x of rows.filter((x) => x.quad === "plow").slice(0, 1)) tips.push({ icon: Flame, text: `“${x.name}” vende bem a ${formatPrice(x.price)} — há margem para ajustar o preço.`, id: x.id });
  for (const x of rows.filter((x) => x.rating && x.rating.avg < 3.5).slice(0, 1)) tips.push({ icon: Star, text: `“${x.name}” tem avaliação ${x.rating!.avg.toFixed(1)} — reveja a receita.`, id: x.id });
  for (const x of rows.filter((x) => x.views >= 5 && x.orders === 0).slice(0, 1)) tips.push({ icon: MousePointerClick, text: `“${x.name}” desperta curiosidade (${x.views} vistas) mas ninguém pede.`, id: x.id });

  return (
    <div className="space-y-6">
      <PageTitle icon={Brain} title="Menu Intelligence" sub="Descubra que pratos brilham, quais precisam de atenção e onde está o próximo euro."
        action={<div className="flex rounded-full border bg-card p-1 shadow-sm">{[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)} className={`rounded-full px-3 py-1 text-xs font-medium transition ${days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{d} dias</button>))}</div>} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Brain} label="Saúde do menu" value={`${health}/100`} />
        <Stat icon={Eye} label="Pratos vistos" value={totViews} />
        <Stat icon={ShoppingBag} label="Unidades pedidas" value={totOrders} />
        <Stat icon={Star} label="Avaliação média" value={avgRating ? avgRating.toFixed(1) : "—"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(QUAD) as Q[]).map((k) => { const Q_ = QUAD[k]; const on = focus === k; return (
          <button key={k} onClick={() => setFocus(on ? null : k)} className={`dash-card group flex items-start gap-3 p-4 text-left transition hover:-translate-y-0.5 ${on ? "ring-2 ring-primary" : ""}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-sm" style={{ background: Q_.color }}><Q_.icon className="h-5 w-5" /></span>
            <span className="min-w-0"><span className="flex items-baseline gap-2"><span className="text-2xl font-bold">{count(k)}</span><span className="text-sm font-semibold">{Q_.label}</span></span>
              <span className="block text-xs text-muted-foreground">{Q_.hint}</span><span className="mt-1 block text-xs text-muted-foreground opacity-0 transition group-hover:opacity-100">{Q_.tip}</span></span>
          </button>); })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><Panel title="Matriz do menu">
          <p className="mb-2 text-xs text-muted-foreground">Cada bolha é um prato: à direita mais procura, acima preço mais alto, maior = mais vendido. Clique numa bolha para ver detalhes.</p>
          <div className="h-80">{rows.length ? (
            <ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" dataKey="pop" name="Procura" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis type="number" dataKey="price" name="Preço" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <ZAxis type="number" dataKey="orders" range={[60, 400]} />
              <ReferenceLine x={rows[0].avgPop} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <ReferenceLine y={rows[0].medPrice} stroke="var(--muted-foreground)" strokeDasharray="4 4" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => { const x = payload?.[0]?.payload; return x ? (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md"><p className="font-semibold">{x.name}</p><p>{formatPrice(x.price)} · {x.views} vistas · {x.orders} pedidos</p><p className="text-muted-foreground">{QUAD[x.quad as Q].label}</p></div>) : null; }} />
              <Scatter data={focus ? rows.filter((x) => x.quad === focus) : rows} onClick={(d) => setSel((d as unknown as { id: string }).id)} className="cursor-pointer">
                {(focus ? rows.filter((x) => x.quad === focus) : rows).map((x) => <Cell key={x.id} fill={QUAD[x.quad].color} fillOpacity={sel && sel !== x.id ? 0.35 : 0.85} />)}
              </Scatter>
            </ScatterChart></ResponsiveContainer>) : <p className="grid h-full place-items-center text-sm text-muted-foreground">Ainda não há pratos.</p>}</div>
        </Panel></div>

        <Panel title={pick ? "Detalhe do prato" : "Oportunidades"}>
          {pick ? (
            <div className="space-y-3">
              {pick.img ? <img src={pick.img} alt={pick.name} className="h-32 w-full rounded-xl object-cover" /> : <div className="grid h-32 place-items-center rounded-xl bg-muted text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>}
              <div><p className="font-semibold">{pick.name}</p><p className="text-xs text-muted-foreground">{pick.cat} · {formatPrice(pick.price)}</p></div>
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-primary-foreground" style={{ background: QUAD[pick.quad].color }}>{QUAD[pick.quad].label}</span>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {[["Vistas", pick.views], ["Pedidos", pick.orders], ["Conversão", `${Math.round(pick.conv * 100)}%`], ["Avaliação", pick.rating ? `${pick.rating.avg.toFixed(1)} (${pick.rating.n})` : "—"], ["Cliques recomend.", pick.clicks], ["Pontuação", pick.score]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg bg-muted/60 p-2"><p className="text-[11px] text-muted-foreground">{k}</p><p className="font-semibold">{v}</p></div>))}
              </div>
              <p className="rounded-lg border border-dashed p-2 text-xs"><Lightbulb className="mr-1 inline h-3.5 w-3.5 text-primary" />{QUAD[pick.quad].tip}</p>
              <div className="flex gap-2"><Link to="/dashboard/menus" className="flex-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-medium text-primary-foreground">Editar no menu</Link>
                <button onClick={() => setSel(null)} className="rounded-lg border px-3 py-2 text-xs">Fechar</button></div>
            </div>
          ) : tips.length ? (
            <ul className="space-y-2">{tips.map((x, i) => (
              <li key={i}><button onClick={() => x.id && setSel(x.id)} className="flex w-full items-start gap-2 rounded-lg p-2 text-left text-sm transition hover:bg-muted">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"><x.icon className="h-4 w-4" /></span>{x.text}</button></li>))}</ul>
          ) : <p className="text-sm text-muted-foreground">Sem sugestões por agora — mais visitas trazem mais pistas.</p>}
        </Panel>
      </div>

      <Panel title="Desempenho por prato">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar prato…" className="h-9 rounded-lg border bg-background pl-8 pr-3 text-sm" /></div>
          <div className="flex flex-wrap gap-1">{([["score", "Pontuação"], ["views", "Vistas"], ["orders", "Pedidos"], ["price", "Preço"], ["rating", "Avaliação"]] as const).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={`rounded-full px-3 py-1 text-xs ${sort === k ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{l}</button>))}</div>
          {focus && <button onClick={() => setFocus(null)} className="ml-auto rounded-full border px-3 py-1 text-xs">Filtro: {QUAD[focus].label} ✕</button>}
        </div>
        <div className="divide-y">{shown.map((x) => (
          <button key={x.id} onClick={() => setSel(x.id)} className={`flex w-full items-center gap-3 py-2.5 text-left transition hover:bg-muted/50 ${sel === x.id ? "bg-muted/60" : ""}`}>
            {x.img ? <img src={x.img} alt="" className="h-9 w-9 rounded-lg object-cover" /> : <span className="grid h-9 w-9 place-items-center rounded-lg bg-muted"><Utensils className="h-4 w-4 text-muted-foreground" /></span>}
            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{x.name}</span><span className="text-xs text-muted-foreground">{x.cat} · {formatPrice(x.price)}{!x.available && " · indisponível"}</span></span>
            <span className="hidden w-16 text-right text-xs sm:block"><Eye className="mr-1 inline h-3 w-3" />{x.views}</span>
            <span className="hidden w-16 text-right text-xs sm:block"><ShoppingBag className="mr-1 inline h-3 w-3" />{x.orders}</span>
            <span className="hidden w-14 text-right text-xs md:block"><Star className="mr-1 inline h-3 w-3" />{x.rating ? x.rating.avg.toFixed(1) : "—"}</span>
            <span className="w-24"><span className="block h-1.5 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${x.score}%`, background: QUAD[x.quad].color }} /></span><span className="text-[11px] text-muted-foreground">{x.score}</span></span>
          </button>))}
          {!shown.length && <p className="py-6 text-center text-sm text-muted-foreground">Nenhum prato encontrado.</p>}
        </div>
      </Panel>
    </div>
  );
}
