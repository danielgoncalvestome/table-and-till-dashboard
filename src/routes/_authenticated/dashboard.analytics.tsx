import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { fetchEvents, summarize } from "@/lib/analytics";
import { useCatalog } from "@/lib/use-catalog";
import { BarList } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { WEEKDAYS } from "@/lib/menu";
import { useMemo, useState, type ReactNode } from "react";
import { CalendarDays, ChefHat, Download, Eye, FileText, Sparkles, Star, TrendingUp, Users, Utensils, type LucideIcon } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchOrders, fetchReservations, menuInsights, reservationInsights, summarizeOrders, summarizeReservations } from "@/lib/insights";
import { STATUS_LABEL, type ResStatus } from "@/lib/reservations";
import { formatPrice } from "@/lib/menu";

function downloadCsv(rows: (string | number)[][], name: string) {
  const csv = "\uFEFF" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({ head: () => ({ meta: [{ title: "Análise — MenuTap" }, { name: "description", content: "Visitas ao menu, reservas e pedidos com gráficos interativos." }, { property: "og:title", content: "Análise — MenuTap" }, { property: "og:description", content: "Visitas ao menu, reservas e pedidos com gráficos interativos." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Analytics });

function Analytics() {
  const { t, lang } = useI18n();
  const pt = lang === "pt";
  const { restaurant: r } = useRestaurant();
  const [days, setDays] = useState(30);
  const [tab, setTab] = useState<"menu" | "res" | "orders">("menu");
  const { data: ev } = useQuery({ queryKey: ["events", r.id, days], queryFn: () => fetchEvents(r.id, days) });
  const { data: resRows } = useQuery({ queryKey: ["an-res", r.id, days], queryFn: () => fetchReservations(r.id, days) });
  const { data: ordRows } = useQuery({ queryKey: ["an-orders", r.id, days], queryFn: () => fetchOrders(r.id, days) });
  const { data: cat } = useCatalog(r.id);
  const { data: ratings } = useQuery({ queryKey: ["ratings", r.id], queryFn: async () => (await supabase.rpc("dish_rating_summary", { _restaurant_id: r.id })).data ?? [] });
  const daily = useMemo(() => {
    const key = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon" }).format(d);
    const n = Math.min(days, 90);
    const keys = Array.from({ length: n }, (_, i) => key(new Date(Date.now() - (n - 1 - i) * 864e5)));
    const m = new Map(keys.map((k) => [k, { day: k.slice(5).split("-").reverse().join("/"), views: 0, reservas: 0, pessoas: 0, pedidos: 0, valor: 0 }]));
    for (const e of ev ?? []) if (e.event_type === "menu_view") { const x = m.get(key(new Date(e.created_at))); if (x) x.views++; }
    for (const x of resRows ?? []) if (x.status !== "cancelled") { const d = m.get(key(new Date(x.starts_at))); if (d) { d.reservas++; d.pessoas += x.party; } }
    for (const o of ordRows ?? []) if (o.status !== "cancelled") { const d = m.get(key(new Date(o.created_at))); if (d) { d.pedidos++; d.valor += Number(o.total); } }
    return [...m.values()];
  }, [ev, resRows, ordRows, days]);
  if (!ev || !cat || !resRows || !ordRows) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  const s = summarize(ev);
  const rs = summarizeReservations(resRows);
  const os = summarizeOrders(ordRows);
  const dn = (id: string) => cat.dishes.find((d) => d.id === id)?.name ?? "—";
  const cn = (id: string) => cat.cats.find((d) => d.id === id)?.name ?? "—";
  const mi = menuInsights(s, cat, pt);
  const ri = reservationInsights(rs, pt);
  const oi: string[] = os.count ? [pt ? `${os.count} pedido(s) pelo menu, valor médio ${formatPrice(os.avg)}.` : `${os.count} menu order(s), average ${formatPrice(os.avg)}.`, ...(os.topItems[0] ? [pt ? `Prato mais pedido: “${os.topItems[0][0]}” (${os.topItems[0][1]}×).` : `Most ordered: “${os.topItems[0][0]}” (${os.topItems[0][1]}×).`] : [])] : [];
  const insights = [...mi, ...ri, ...oi];
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
    rows.push([pt ? "Reservas" : "Reservations"], [pt ? "Reservas" : "Bookings", rs.total], [pt ? "Pessoas" : "Guests", rs.covers], [pt ? "Não comparência" : "No-show", `${Math.round(rs.noShowRate * 100)}%`], []);
    rows.push([pt ? "Pedidos" : "Orders"], [pt ? "Pedidos" : "Orders", os.count], [pt ? "Valor" : "Value", os.revenue.toFixed(2)], ...os.topItems.slice(0, 15).map(([k, v]) => [k, v]), []);
    rows.push([t("an.ratings")]);
    (ratings ?? []).forEach((x) => rows.push([dn(x.dish_id), Number(x.avg_stars).toFixed(1), Number(x.total)]));
    downloadCsv(rows, `menutap-${r.slug ?? "relatorio"}-${days}d.csv`);
  };
  const exportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const W = 210, M = 16; let y = 20;
    const ensure = (h: number) => { if (y + h > 282) { doc.addPage(); y = 20; } };
    doc.setFillColor(24, 53, 43); doc.rect(0, 0, W, 34, "F");
    doc.setTextColor(255, 255, 255); doc.setFont("helvetica", "bold"); doc.setFontSize(18);
    doc.text(`${t("an.title")} — ${r.name}`, M, 16);
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`${pt ? `Últimos ${days} dias` : `Last ${days} days`} · ${new Date().toLocaleDateString(pt ? "pt-PT" : "en-GB")}`, M, 25);
    y = 44; doc.setTextColor(32, 38, 34);
    const stats: [string, number][] = [[t("ov.views"), s.views], [t("ov.sessions"), s.sessions], [`${t("an.recs")} · ${t("an.impr")}`, totalImpr], [`${t("an.recs")} · ${t("an.clicks")}`, totalClicks]];
    const bw = (W - 2 * M - 9) / 4;
    stats.forEach(([k, v], i) => {
      const x = M + i * (bw + 3);
      doc.setFillColor(246, 243, 236); doc.roundedRect(x, y, bw, 22, 2, 2, "F");
      doc.setFontSize(8); doc.setTextColor(100, 110, 104); doc.text(doc.splitTextToSize(k, bw - 6), x + 3, y + 6);
      doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(24, 53, 43); doc.text(String(v), x + 3, y + 18);
      doc.setFont("helvetica", "normal");
    });
    y += 32;
    const heading = (title: string) => { ensure(14); doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(24, 53, 43); doc.text(title, M, y); y += 6; doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(32, 38, 34); };
    if (insights.length) {
      heading(t("an.insights"));
      insights.forEach((i) => { const l = doc.splitTextToSize(`• ${i}`, W - 2 * M); ensure(l.length * 4.5); doc.text(l, M, y); y += l.length * 4.5 + 1; });
      y += 5;
    }
    const bars = (title: string, items: [string, number][]) => {
      heading(title);
      if (!items.length) { doc.setTextColor(120, 120, 120); doc.text(t("ov.noData"), M, y); y += 10; return; }
      const max = Math.max(...items.map(([, v]) => v), 1);
      items.forEach(([k, v]) => {
        ensure(7);
        doc.setTextColor(32, 38, 34); doc.text(doc.splitTextToSize(k, 70)[0], M, y + 3);
        doc.setFillColor(230, 234, 228); doc.rect(M + 74, y, 90, 4, "F");
        doc.setFillColor(24, 53, 43); doc.rect(M + 74, y, (90 * v) / max, 4, "F");
        doc.text(String(v), W - M, y + 3, { align: "right" }); y += 6.5;
      });
      y += 6;
    };
    bars(t("ov.topDishes"), s.topDishes.slice(0, 10).map(([k, v]) => [dn(k), v]));
    bars(t("ov.topCats"), s.topCats.slice(0, 10).map(([k, v]) => [cn(k), v]));
    bars(t("an.days"), s.days.map((v, i) => [WEEKDAYS[lang][i], v]));
    bars(t("an.hours"), s.hours.map((v, i) => [`${i}h`, v] as [string, number]).filter(([, v]) => v > 0));
    bars(t("an.searches"), s.searches.slice(0, 10));
    bars(t("ov.langs"), s.langs.map(([k, v]) => [k.toUpperCase(), v]));
    bars(t("an.sources"), s.sources);
    bars(pt ? "Reservas por dia da semana (pessoas)" : "Bookings by weekday (guests)", rs.days.map((v, i) => [WEEKDAYS[lang][i], v]));
    bars(pt ? "Pratos mais pedidos" : "Most ordered dishes", os.topItems.slice(0, 10));
    bars(t("an.ratings"), (ratings ?? []).map((x) => [`${dn(x.dish_id)} · ${Number(x.avg_stars).toFixed(1)}/5`, Number(x.total)] as [string, number]).sort((a, b) => b[1] - a[1]));
    const n = doc.getNumberOfPages();
    for (let p = 1; p <= n; p++) { doc.setPage(p); doc.setFontSize(8); doc.setTextColor(140, 140, 140); doc.text(`MenuTap · ${p}/${n}`, W - M, 292, { align: "right" }); }
    doc.save(`menutap-${r.slug ?? "relatorio"}-${days}d.pdf`);
  };
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const hourData = Array.from({ length: 24 }, (_, h) => ({ h: `${h}h`, menu: s.hours[h], reservas: rs.hours[h], pedidos: os.hours[h] })).filter((x, i) => i >= 8 || x.menu || x.reservas || x.pedidos);
  const weekData = WEEKDAYS[lang].map((d, i) => ({ d, menu: s.days[i], pessoas: rs.days[i] }));
  const STATUS_COLORS: Record<string, string> = { pending: "var(--st-reserved)", confirmed: "var(--chart-2)", seated: "var(--st-seated)", completed: "var(--chart-1)", cancelled: "var(--muted-foreground)", no_show: "var(--destructive)" };
  const statusData = Object.entries(rs.status).map(([k, v]) => ({ name: STATUS_LABEL[k as ResStatus] ?? k, value: v, fill: STATUS_COLORS[k] ?? "var(--chart-3)" }));
  const SRC: Record<string, string> = { online: "Online", staff: pt ? "Equipa" : "Staff", walk_in: pt ? "À porta" : "Walk-in" };
  const srcData = Object.entries(rs.sources).map(([k, v], i) => ({ name: SRC[k] ?? k, value: v, fill: `var(--chart-${(i % 5) + 1})` }));
  const partyData = ["1", "2", "3", "4", "5", "6", "7+"].map((k) => ({ k, v: rs.party[k] ?? 0 }));
  const totalRatings = (ratings ?? []).reduce((a, x) => a + Number(x.total), 0);
  const avgStars = totalRatings ? (ratings ?? []).reduce((a, x) => a + Number(x.avg_stars) * Number(x.total), 0) / totalRatings : 0;
  const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }, cursor: { fill: "var(--muted)" } };
  const axis = { stroke: "var(--muted-foreground)", fontSize: 10, tickLine: false, axisLine: false };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow">{pt ? `Últimos ${days} dias` : `Last ${days} days`}</p>
          <h1 className="mt-1 text-2xl md:text-4xl">{t("an.title")}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <div className="flex rounded-full border bg-card p-1">
            {[7, 30, 90, 365].map((d) => <button key={d} onClick={() => setDays(d)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{d === 365 ? (pt ? "1 ano" : "1 year") : `${d}d`}</button>)}
          </div>
          <button type="button" onClick={exportReport} className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"><Download className="h-4 w-4" />Excel</button>
          <button type="button" onClick={exportPdf} className="inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3 text-sm font-medium hover:bg-muted"><FileText className="h-4 w-4" />PDF</button>
        </div>
      </div>

      <div className="flex w-fit rounded-full border bg-card p-1">
        {([["menu", pt ? "Menu" : "Menu", Utensils], ["res", pt ? "Reservas" : "Bookings", CalendarDays], ["orders", pt ? "Pedidos" : "Orders", ChefHat]] as const).map(([k, l, I]) => (
          <button key={k} onClick={() => setTab(k)} className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${tab === k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}><I className="h-4 w-4" />{l}</button>
        ))}
      </div>

      {tab === "menu" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title={t("an.hours")}><Chart><BarChart data={hourData} margin={{ left: -24 }}><XAxis dataKey="h" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="menu" name={pt ? "Visualizações" : "Views"} fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={t("an.days")}><Chart><BarChart data={weekData} margin={{ left: -24 }}><XAxis dataKey="d" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="menu" name={pt ? "Visualizações" : "Views"} fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={t("ov.topDishes")}><BarList items={s.topDishes.slice(0, 8).map(([k, v]) => [dn(k), v])} empty={t("ov.noData")} /></Card>
          <Card title={t("ov.topCats")}><BarList items={s.topCats.slice(0, 8).map(([k, v]) => [cn(k), v])} empty={t("ov.noData")} /></Card>
          <Card title={`${t("an.recs")}`}><div className="grid grid-cols-2 gap-3 text-center"><Mini label={t("an.impr")} value={totalImpr} /><Mini label={t("an.clicks")} value={totalClicks} /><Mini label="CTR" value={totalImpr ? pct(totalClicks / totalImpr) : "—"} /><Mini label={pt ? "Pesquisas" : "Searches"} value={s.searches.reduce((a, [, v]) => a + v, 0)} /></div></Card>
          <Card title={t("an.searches")}><BarList items={s.searches.slice(0, 8)} empty={t("ov.noData")} /></Card>
          <Card title={t("an.ratings")}><BarList items={(ratings ?? []).map((x) => [`${dn(x.dish_id)} · ★ ${Number(x.avg_stars).toFixed(1)}`, Number(x.total)] as [string, number]).sort((a, b) => b[1] - a[1]).slice(0, 8)} empty={t("ov.noData")} /></Card>
        </div>
      )}
      {tab === "res" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title={pt ? "Pessoas por hora" : "Guests by hour"}><Chart><BarChart data={hourData} margin={{ left: -24 }}><XAxis dataKey="h" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="reservas" name={pt ? "Pessoas" : "Guests"} fill="var(--chart-3)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={pt ? "Pessoas por dia da semana" : "Guests by weekday"}><Chart><BarChart data={weekData} margin={{ left: -24 }}><XAxis dataKey="d" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="pessoas" name={pt ? "Pessoas" : "Guests"} fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={pt ? "Estado das reservas" : "Booking status"}><DonutChart data={statusData} empty={pt ? "Ainda sem reservas." : "No bookings yet."} /></Card>
          <Card title={pt ? "Origem das reservas" : "Booking source"}><DonutChart data={srcData} empty={pt ? "Ainda sem reservas." : "No bookings yet."} /></Card>
          <Card title={pt ? "Tamanho dos grupos" : "Party size"}><Chart><BarChart data={partyData} margin={{ left: -24 }}><XAxis dataKey="k" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="v" name={pt ? "Reservas" : "Bookings"} fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={pt ? "Clientes" : "Customers"}><div className="grid grid-cols-2 gap-3 text-center"><Mini label={pt ? "Clientes" : "Customers"} value={rs.customers} /><Mini label={pt ? "Regressaram" : "Returning"} value={rs.returning} /><Mini label={pt ? "Grupo médio" : "Avg party"} value={rs.avgParty.toFixed(1)} /><Mini label={pt ? "Antecedência (dias)" : "Lead (days)"} value={rs.avgLeadDays.toFixed(1)} /><Mini label={pt ? "Cancelamentos" : "Cancellations"} value={pct(rs.cancelRate)} /><Mini label={pt ? "Por confirmar" : "Pending"} value={rs.pending} /></div></Card>
        </div>
      )}
      {tab === "orders" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card title={pt ? "Valor por dia" : "Value per day"}><Chart><BarChart data={daily} margin={{ left: -16 }}><XAxis dataKey="day" {...axis} minTickGap={16} /><YAxis {...axis} /><Tooltip {...tip} formatter={(v: number) => formatPrice(v)} /><Bar dataKey="valor" name={pt ? "Valor" : "Value"} fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={pt ? "Pedidos por hora" : "Orders by hour"}><Chart><BarChart data={hourData} margin={{ left: -24 }}><XAxis dataKey="h" {...axis} /><YAxis {...axis} allowDecimals={false} /><Tooltip {...tip} /><Bar dataKey="pedidos" name={pt ? "Pedidos" : "Orders"} fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></Chart></Card>
          <Card title={pt ? "Pratos mais pedidos" : "Most ordered dishes"}><BarList items={os.topItems.slice(0, 8)} empty={pt ? "Ainda sem pedidos." : "No orders yet."} /></Card>
          <Card title={pt ? "Resumo" : "Summary"}><div className="grid grid-cols-2 gap-3 text-center"><Mini label={pt ? "Pedidos" : "Orders"} value={os.count} /><Mini label={pt ? "Valor total" : "Total"} value={formatPrice(os.revenue)} /><Mini label={pt ? "Valor médio" : "Average"} value={formatPrice(os.avg)} /><Mini label={pt ? "Cancelados" : "Cancelled"} value={os.cancelled} /></div></Card>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Kpi icon={Eye} label={t("ov.views")} value={s.views} />
        <Kpi icon={Users} label={t("ov.sessions")} value={s.sessions} />
        <Kpi icon={CalendarDays} label={pt ? "Reservas" : "Bookings"} value={rs.total} sub={`${rs.covers} ${pt ? "pessoas" : "guests"}`} />
        <Kpi icon={TrendingUp} label={pt ? "Não comparência" : "No-show"} value={pct(rs.noShowRate)} />
        <Kpi icon={ChefHat} label={pt ? "Pedidos" : "Orders"} value={os.count} sub={formatPrice(os.revenue)} />
        <Kpi icon={Star} label={t("an.ratings")} value={totalRatings ? avgStars.toFixed(1) : "—"} sub={`${totalRatings} ${pt ? "aval." : "ratings"}`} />
      </div>

      <Card title={t("an.insights")} icon={Sparkles}>
        {insights.length ? (
          <ul className="grid gap-2 md:grid-cols-2">
            {[...mi.map((x) => [x, Utensils] as const), ...ri.map((x) => [x, CalendarDays] as const), ...oi.map((x) => [x, ChefHat] as const)].map(([x, I]) => (
              <li key={x} className="flex items-start gap-2.5 rounded-xl bg-muted/50 p-3 text-sm"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><I className="h-3 w-3" /></span>{x}</li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t("ov.noData")}</p>}
      </Card>

      <Card title={pt ? "Evolução diária" : "Daily trend"} icon={TrendingUp}>
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={daily} margin={{ left: -20, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} /></linearGradient>
                <linearGradient id="gr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.35} /><stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" {...axis} minTickGap={16} />
              <YAxis {...axis} allowDecimals={false} />
              <Tooltip {...tip} />
              <Area type="monotone" dataKey="views" name={pt ? "Visualizações" : "Views"} stroke="var(--chart-1)" fill="url(#gv)" strokeWidth={2} />
              <Area type="monotone" dataKey="pessoas" name={pt ? "Pessoas reservadas" : "Booked guests"} stroke="var(--chart-3)" fill="url(#gr)" strokeWidth={2} />
              <Area type="monotone" dataKey="pedidos" name={pt ? "Pedidos" : "Orders"} stroke="var(--chart-2)" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

    </div>
  );
}

function Kpi({ icon: I, label, value, sub }: { icon: LucideIcon; label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-secondary text-primary"><I className="h-4 w-4" /></span>
      <p className="mt-3 font-display text-3xl leading-none">{value}</p>
      <p className="mt-1 truncate text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
function Card({ title, icon: I, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border bg-card p-4 sm:p-5">
      <h2 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold">{I && <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary text-primary"><I className="h-3.5 w-3.5" /></span>}{title}</h2>
      {children}
    </section>
  );
}
function Chart({ children }: { children: React.ReactElement }) {
  return <div className="h-52"><ResponsiveContainer>{children}</ResponsiveContainer></div>;
}
function Mini({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-muted/50 p-3"><p className="font-display text-xl">{value}</p><p className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p></div>;
}
function DonutChart({ data, empty }: { data: { name: string; value: number; fill: string }[]; empty: string }) {
  const total = data.reduce((a, x) => a + x.value, 0);
  if (!total) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-40 w-40 shrink-0">
        <PieChart width={160} height={160}><Pie data={data} cx={80} cy={80} dataKey="value" nameKey="name" innerRadius={50} outerRadius={74} isAnimationActive={false} paddingAngle={2} stroke="none">{data.map((d) => <Cell key={d.name} fill={d.fill} />)}</Pie><Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} /></PieChart>
        <div className="pointer-events-none absolute inset-0 grid place-items-center font-display text-2xl">{total}</div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">{data.map((d) => <li key={d.name} className="flex items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.fill }} /><span className="flex-1 truncate">{d.name}</span><span className="text-muted-foreground">{Math.round((d.value / total) * 100)}%</span></li>)}</ul>
    </div>
  );
}
