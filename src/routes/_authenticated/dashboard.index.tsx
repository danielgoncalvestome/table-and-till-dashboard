import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { fetchEvents, summarize } from "@/lib/analytics";
import { useCatalog } from "@/lib/use-catalog";
import { BarList, PageTitle, Panel, Stat } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/menu";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard/")({ component: Overview });

function Overview() {
  const { t, lang } = useI18n();
  const { restaurant: r, refresh } = useRestaurant();
  const { data: ev } = useQuery({ queryKey: ["events", r.id], queryFn: () => fetchEvents(r.id) });
  const { data: cat } = useCatalog(r.id);
  const { data: logs } = useQuery({
    queryKey: ["audit", r.id],
    queryFn: async () => (await supabase.from("audit_logs").select("*").eq("restaurant_id", r.id).order("created_at", { ascending: false }).limit(8)).data ?? [],
  });
  const s = ev ? summarize(ev) : null;
  const dishName = (id: string) => cat?.dishes.find((d) => d.id === id)?.name ?? "—";
  const catName = (id: string) => cat?.cats.find((d) => d.id === id)?.name ?? "—";

  async function togglePublish() {
    const { error } = await supabase.from("restaurants").update({ published: !r.published }).eq("id", r.id);
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved"));
    refresh();
  }

  return (
    <div>
      <PageTitle title={t("dash.overview")} action={<Button onClick={togglePublish} variant={r.published ? "outline" : "default"}>{r.published ? t("dash.unpublish") : t("dash.publish")}</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        <Stat label={t("ov.views")} value={s?.views ?? "—"} />
        <Stat label={t("ov.sessions")} value={s?.sessions ?? "—"} />
        <Stat label={t("dash.menus")} value={cat ? cat.dishes.filter((d) => !d.archived).length : "—"} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Panel title={t("ov.topDishes")}><BarList items={(s?.topDishes ?? []).slice(0, 5).map(([k, v]) => [dishName(k), v])} empty={t("ov.noData")} /></Panel>
        <Panel title={t("ov.topCats")}><BarList items={(s?.topCats ?? []).slice(0, 5).map(([k, v]) => [catName(k), v])} empty={t("ov.noData")} /></Panel>
        <Panel title={t("ov.langs")}><BarList items={(s?.langs ?? []).map(([k, v]) => [k.toUpperCase(), v])} empty={t("ov.noData")} /></Panel>
      </div>
      <Panel title={t("ov.activity")} className="mt-4">
        {logs?.length ? (
          <ul className="divide-y text-sm">{logs.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.action}</span><span className="text-muted-foreground">{formatDate(l.created_at, lang)}</span></li>)}</ul>
        ) : <p className="text-sm text-muted-foreground">{t("common.empty")}</p>}
      </Panel>
      {!r.published && <p className="mt-6 text-sm text-muted-foreground">{t("sub.trialNot")} <Link to="/dashboard/menus" className="text-primary underline">{t("dash.menus")}</Link></p>}
    </div>
  );
}
