import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { audit, useIsAdmin } from "@/lib/restaurant";
import { formatDate } from "@/lib/menu";
import { getStripeEnvironment } from "@/lib/stripe";
import { applyMonthlyPriceToSubscriptions } from "@/utils/payments.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Administração — MenuTap" }, { name: "description", content: "Administração da plataforma MenuTap." }, { property: "og:title", content: "Administração — MenuTap" }, { property: "og:description", content: "Administração da plataforma MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Admin,
});

function Admin() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: s } = useQuery({ queryKey: ["platform_settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data, enabled: !!isAdmin });
  const { data: rs } = useQuery({ queryKey: ["admin-restaurants"], queryFn: async () => (await supabase.from("restaurants").select("*").order("created_at", { ascending: false })).data ?? [], enabled: !!isAdmin });
  const { data: logs } = useQuery({ queryKey: ["admin-audit"], queryFn: async () => (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(30)).data ?? [], enabled: !!isAdmin });
  const [f, setF] = useState({ monthly_price_cents: 990, trial_days: 10 });
  useEffect(() => { if (s) setF({ monthly_price_cents: s.monthly_price_cents, trial_days: s.trial_days }); }, [s]);

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p><Link to="/dashboard" className="text-primary underline">{t("nav.dashboard")}</Link></div>;

  async function save() {
    const { error } = await supabase.from("platform_settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(t("common.error"));
    await audit("platform.settings", null, f);
    toast.success(t("common.saved"));
    const environment = getStripeEnvironment();
    if (environment && s && s.monthly_price_cents !== f.monthly_price_cents) {
      const r = await applyMonthlyPriceToSubscriptions({ data: { environment } });
      if ("error" in r) toast.error(r.error); else toast.success(t("admin.priceApplied").replace("{n}", String(r.updated)));
    }
    qc.invalidateQueries({ queryKey: ["platform_settings"] });
  }
  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link to="/dashboard" className="text-sm text-muted-foreground">← {t("nav.dashboard")}</Link>
      <PageTitle title={t("admin.title")} action={<Link to="/admin/products" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">{t("admin.shop")}</Link>} />
      <Panel>
        <div className="grid items-end gap-4 md:grid-cols-3">
          <div><Label>{t("admin.price")}</Label><Input type="number" min={0} value={f.monthly_price_cents} onChange={(e) => setF({ ...f, monthly_price_cents: Number(e.target.value) })} /></div>
          <div><Label>{t("admin.trial")}</Label><Input type="number" min={0} value={f.trial_days} onChange={(e) => setF({ ...f, trial_days: Number(e.target.value) })} /></div>
          <Button onClick={save}>{t("common.save")}</Button>
        </div>
      </Panel>
      <Panel title={t("admin.restaurants")} className="mt-4">
        <ul className="divide-y text-sm">{rs?.map((r) => <li key={r.id} className="flex justify-between py-2"><a href={`/r/${r.slug}`} target="_blank" rel="noreferrer">{r.name}</a><span className="text-muted-foreground">{r.status} · {r.published ? "✓" : "—"} · {formatDate(r.created_at, lang)}</span></li>)}</ul>
      </Panel>
      <Panel title={t("admin.audit")} className="mt-4">
        <ul className="divide-y text-sm">{logs?.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.action}</span><span className="text-muted-foreground">{formatDate(l.created_at, lang)}</span></li>)}</ul>
      </Panel>
    </div>
  );
}
