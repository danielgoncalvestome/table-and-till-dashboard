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
import { planByPrice } from "@/lib/billing-rules";
import { Bell } from "lucide-react";
import { AlertDot, useAdminAlerts } from "@/hooks/use-admin-alerts";

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
  const { data: subs } = useQuery({ queryKey: ["admin-subs"], queryFn: async () => (await supabase.from("account_subscriptions").select("*").not("paddle_subscription_id","is",null).order("created_at", { ascending: false })).data ?? [], enabled: !!isAdmin });
  const { data: al } = useAdminAlerts(!!isAdmin);
  const [f, setF] = useState({ trial_days: 10 });
  useEffect(() => { if (s) setF({ trial_days: s.trial_days }); }, [s]);

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p><Link to="/dashboard" className="text-primary underline">{t("nav.dashboard")}</Link></div>;

  async function save() {
    const { error } = await supabase.from("platform_settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) return toast.error(t("common.error"));
    await audit("platform.settings", null, f);
    toast.success(t("common.saved"));
    qc.invalidateQueries({ queryKey: ["platform_settings"] });
  }
  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link to="/dashboard" className="text-sm text-muted-foreground">← {t("nav.dashboard")}</Link>
      <PageTitle title={t("admin.title")} action={<div className="flex items-center gap-2">{!!al && al.messages + al.orders > 0 && <span className="relative mr-1" title="Alertas"><Bell className="h-5 w-5 text-destructive" /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" /></span>}<Link to="/admin/messages" className="rounded-md border px-4 py-2 text-sm hover:bg-muted">{t("admin.messages")}<AlertDot n={al?.messages ?? 0} /></Link></div>} />
      <Panel>
        <div className="grid items-end gap-4 md:grid-cols-3">
                    <div><Label>{t("admin.trial")}</Label><Input type="number" min={0} value={f.trial_days} onChange={(e) => setF({ ...f, trial_days: Number(e.target.value) })} /></div>
          <Button onClick={save}>{t("common.save")}</Button>
        </div>
      </Panel>
      <Panel title={t("admin.subs")} className="mt-4">
        <ul className="divide-y text-sm">{subs?.map((x) => { const r = rs?.find((y) => y.created_by === x.user_id); return <li key={x.id} className="flex justify-between py-2"><span>{r?.name ?? x.user_id.slice(0, 8)} · {planByPrice(x.price_id)?.name ?? "?"}</span><span className="text-muted-foreground">{x.environment === "sandbox" ? "teste · " : ""}{x.status} · {formatDate(x.created_at, lang)}</span></li>; })}</ul>
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
