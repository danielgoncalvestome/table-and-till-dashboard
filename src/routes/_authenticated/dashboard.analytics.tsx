import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { fetchEvents, summarize } from "@/lib/analytics";
import { useCatalog } from "@/lib/use-catalog";
import { BarList, Columns, PageTitle, Panel, Stat } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { WEEKDAYS } from "@/lib/menu";
import { useState } from "react";
import { Download } from "lucide-react";

function downloadCsv(rows: (string | number)[][], name: string) {
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({ head: () => ({ meta: [{ title: "Estatísticas — MenuTap" }, { name: "description", content: "Consulte as visitas e avaliações do menu." }, { property: "og:title", content: "Estatísticas — MenuTap" }, { property: "og:description", content: "Consulte as visitas e avaliações do menu." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Analytics });

function Analytics() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const [days, setDays] = useState(30);
  const { data: ev } = useQuery({ queryKey: ["events", r.id, days], queryFn: () => fetchEvents(r.id, days) });
  const { data: cat } = useCatalog(r.id);
  const { data: ratings } = useQuery({ queryKey: ["ratings", r.id], queryFn: async () => (await supabase.rpc("dish_rating_summary", { _restaurant_id: r.id })).data ?? [] });
  if (!ev || !cat) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  const s = summarize(ev);
  const dn = (id: string) => cat.dishes.find((d) => d.id === id)?.name ?? "—";
  const cn = (id: string) => cat.cats.find((d) => d.id === id)?.name ?? "—";

  const insights: string[] = [];
  const pt = lang === "pt";
  if (s.topDishes[0]) insights.push(pt ? `“${dn(s.topDishes[0][0])}” é o prato mais consultado (${s.topDishes[0][1]} visualizações).` : `“${dn(s.topDishes[0][0])}” is the most viewed dish (${s.topDishes[0][1]} views).`);
  const viewedCats = new Set(s.topCats.map(([k]) => k));
  const unexplored = cat.cats.filter((c) => !viewedCats.has(c.id));
  if (s.views > 0 && unexplored.length) insights.push(pt ? `Categorias pouco exploradas: ${unexplored.map((c) => c.name).join(", ")}. Considere destacá-las ou mudá-las de posição.` : `Least explored categories: ${unexplored.map((c) => c.name).join(", ")}. Consider featuring or moving them.`);
  const peak = s.hours.indexOf(Math.max(...s.hours));
  if (s.views > 0) insights.push(pt ? `Maior procura por volta das ${peak}h (hora de Lisboa).` : `Peak browsing around ${peak}:00 (Lisbon time).`);
  if (s.recClicks[0]) insights.push(pt ? `A recomendação mais clicada é “${dn(s.recClicks[0][0])}”.` : `The most clicked recommendation is “${dn(s.recClicks[0][0])}”.`);
  const noPhoto = s.topDishes.slice(0, 5).filter(([id]) => !cat.dishes.find((d) => d.id === id)?.image_url);
  if (noPhoto.length) insights.push(pt ? `Pratos populares sem fotografia: ${noPhoto.map(([id]) => dn(id)).join(", ")}.` : `Popular dishes without a photo: ${noPhoto.map(([id]) => dn(id)).join(", ")}.`);

  const totalImpr = s.recImpr.reduce((a, [, v]) => a + v, 0);
  const totalClicks = s.recClicks.reduce((a, [, v]) => a + v, 0);
  const exportReport = () => {
    const rows: (string | number)[][] = [[r.name], [pt ? `Últimos ${days} dias` : `Last ${days} days`, new Date().toLocaleDateString(pt ? "pt-PT" : "en-GB")], []];
    rows.push([t("ov.views"), s.views], [t("ov.sessions"), s.sessions], [`${t("an.recs")} · ${t("an.impr")}`, totalImpr], [`${t("an.recs")} · ${t("an.clicks")}`, totalClicks], []);
    if (insights.length) rows.push([t("an.insights")], ...insights.map((i) => [i]), []);
    const sec = (title: string, items: [string, number][]) => { rows.push([title]); items.forEach(([k, v]) => rows.push([k, v])); rows.push([]); };
    sec(t("ov.topDishes"), s.topDishes.map(([k, v]) => [dn(k), v]));
    sec(t("ov.topCats"), s.topCats.map(([k, v]) => [cn(k), v]));
    sec(t("an.hours"), s.hours.map((v, i) => [`${i}h`, v]));
    sec(t("an.days"), s.days.map((v, i) => [WEEKDAYS[lang][i], v]));
    sec(t("an.searches"), s.searches);
    sec(t("ov.langs"), s.langs.map(([k, v]) => [k.toUpperCase(), v]));
    sec(t("an.sources"), s.sources);
    rows.push([t("an.ratings")]);
    (ratings ?? []).forEach((x) => rows.push([dn(x.dish_id), Number(x.avg_stars).toFixed(1), Number(x.total)]));
    downloadCsv(rows, `menutap-${r.slug ?? "relatorio"}-${days}d.csv`);
  };
  return (
    <div>
      <PageTitle title={t("an.title")} sub={t("an.note")} action={
        <div className="flex items-center gap-2">
          <select aria-label={pt ? "Período de análise" : "Analysis period"} value={days} onChange={(e) => setDays(Number(e.target.value))} className="h-9 rounded-md border bg-background px-3 text-sm">
            {[7, 30, 90, 365].map((d) => <option key={d} value={d}>{pt ? `Últimos ${d} dias` : `Last ${d} days`}</option>)}
          </select>
          <button type="button" onClick={exportReport} className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Download className="h-4 w-4" />{pt ? "Exportar relatório" : "Export report"}
          </button>
        </div>
      } />
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label={t("ov.views")} value={s.views} />
        <Stat label={t("ov.sessions")} value={s.sessions} />
        <Stat label={`${t("an.recs")} · ${t("an.impr")}`} value={totalImpr} />
        <Stat label={`${t("an.recs")} · ${t("an.clicks")}`} value={totalClicks} />
      </div>
      <Panel title={t("an.insights")} className="mt-4">
        {insights.length ? <ul className="list-disc space-y-1 pl-5 text-sm">{insights.map((i) => <li key={i}>{i}</li>)}</ul> : <p className="text-sm text-muted-foreground">{t("ov.noData")}</p>}
      </Panel>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Panel title={t("an.hours")}><Columns values={s.hours} labels={s.hours.map((_, i) => (i % 3 === 0 ? String(i) : ""))} /></Panel>
        <Panel title={t("an.days")}><Columns values={s.days} labels={WEEKDAYS[lang]} /></Panel>
        <Panel title={t("ov.topDishes")}><BarList items={s.topDishes.slice(0, 8).map(([k, v]) => [dn(k), v])} empty={t("ov.noData")} /></Panel>
        <Panel title={t("ov.topCats")}><BarList items={s.topCats.slice(0, 8).map(([k, v]) => [cn(k), v])} empty={t("ov.noData")} /></Panel>
        <Panel title={t("an.searches")}><BarList items={s.searches.slice(0, 8)} empty={t("ov.noData")} /></Panel>
        <Panel title={t("ov.langs")}><BarList items={s.langs.map(([k, v]) => [k.toUpperCase(), v])} empty={t("ov.noData")} /></Panel>
        <Panel title={t("an.sources")}><BarList items={s.sources} empty={t("ov.noData")} /></Panel>
        <Panel title={t("an.ratings")}><BarList items={(ratings ?? []).map((x) => [`${dn(x.dish_id)} · ★ ${Number(x.avg_stars).toFixed(1)}`, Number(x.total)] as [string, number]).sort((a, b) => b[1] - a[1])} empty={t("ov.noData")} /></Panel>
      </div>
    </div>
  );
}
