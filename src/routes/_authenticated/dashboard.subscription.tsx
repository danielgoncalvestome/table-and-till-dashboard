import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPaddleEnvironment, openPlanCheckout } from "@/lib/paddle";
import { createPortalSession } from "@/utils/payments.functions";
import { PageTitle, Panel } from "@/components/dash/ui";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { formatDate, formatPrice } from "@/lib/menu";
import { PLANS, planByPrice } from "@/lib/billing-rules";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  head: () => ({ meta: [{ title: "Subscrição — MenuTap" }, { name: "description", content: "Gerir a subscrição, pagamentos e período experimental da sua conta MenuTap." }, { property: "og:title", content: "Subscrição — MenuTap" }, { property: "og:description", content: "Gerir os pagamentos da sua conta MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (search: Record<string, unknown>) => ({ checkout: search.checkout === "success" ? "success" as const : undefined }),
  component: Sub,
});

function Sub() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const environment = getPaddleEnvironment();
  const { checkout } = Route.useSearch();
  const portal = useServerFn(createPortalSession);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useQuery({ queryKey: ["billing-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: sub, error: subError } = useQuery({
    queryKey: ["account-subscription", user?.id, environment], enabled: !!user && !!environment,
    queryFn: async () => {
      const { data, error } = await supabase.from("account_subscriptions").select("*").eq("user_id", user!.id).eq("environment", environment!).not("paddle_subscription_id", "is", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    }, refetchInterval: 5000,
  });
  const { data: owned } = useQuery({ queryKey: ["billing-owned-restaurants", user?.id], enabled: !!user, queryFn: async () => {
    const { data, error } = await supabase.from("restaurants").select("trial_ends_at,trial_started_at").eq("created_by", user!.id).eq("is_demo", false);
    if (error) throw error;
    return data ?? [];
  } });
  const trialEnd = owned?.map(x => x.trial_ends_at).filter((x): x is string => !!x).sort()[0];
  const owner = user?.id === r.created_by;
  const published = !!owned?.some(x => x.trial_started_at);
  const running = sub && sub.status !== "canceled";
  const current = planByPrice(sub?.price_id);
  async function buy(priceId: string) {
    if (!user) return;
    setBusy(priceId); setError(null);
    try { await openPlanCheckout({ priceId, userId: user.id, email: user.email?.endsWith(".invalid") ? undefined : user.email, lang }); }
    catch (e) { setError(e instanceof Error ? e.message : t("common.error")); }
    finally { setBusy(null); }
  }
  async function manage() {
    if (!environment) return;
    setBusy("portal"); setError(null);
    try { const res = await portal({ data: { environment } }); if ("error" in res) throw new Error(res.error); window.open(res.url, "_blank", "noopener,noreferrer"); }
    catch (e) { setError(e instanceof Error ? e.message : t("common.error")); }
    finally { setBusy(null); }
  }
  return (
    <div>
      <PaymentTestModeBanner />
      <PageTitle title={t("sub.title")} />
      {checkout && <p role="status" className="mb-4 text-sm text-primary">{t(sub ? "sub.confirmed" : "sub.pending")}</p>}
      {(error || subError) && <p role="alert" className="mb-4 text-sm text-destructive">{error ?? subError?.message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t("sub.trial")}>
          {trialEnd ? <p className="text-sm">{t("sub.trialEnds")} <strong>{formatDate(trialEnd, lang)}</strong></p> : <p className="text-sm text-muted-foreground">{t("sub.trialNot")}</p>}
          {sub && <p className="mt-3 text-sm">{t((`sub.${sub.status}` in { "sub.active": 1, "sub.trialing": 1, "sub.past_due": 1, "sub.canceled": 1, "sub.paused": 1 } ? `sub.${sub.status}` : "sub.none") as Parameters<typeof t>[0])}{current && <> · {current.name}</>}</p>}
          {sub?.cancel_at_period_end && sub.current_period_end && <p className="mt-3 text-sm">{t("sub.cancels")} {formatDate(sub.current_period_end, lang)}</p>}
          {owner && running && <Button className="mt-5" variant="outline" disabled={!!busy} onClick={manage}><ExternalLink />{busy === "portal" ? t("common.loading") : t("sub.manage")}</Button>}
        </Panel>
        <Panel title={t("dash.cards")}>
          <p className="flex gap-2 text-sm"><CreditCard className="h-4 w-4 shrink-0 text-primary" />{t("plans.free")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("plans.more")}</p>
          <p className="mt-3 text-xs text-muted-foreground">{t("sub.keep")}</p>
        </Panel>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(p => (
          <div key={p.priceId} className={`rounded-md border bg-card p-5 ${current?.priceId === p.priceId && running ? "border-primary" : ""}`}>
            <p className="font-display text-3xl text-primary">{formatPrice(p.cents / 100, lang)}<span className="text-sm text-muted-foreground">{t("pricing.per")}</span></p>
            <p className="mt-1 text-xs text-muted-foreground">{t("pricing.vat")}</p>
            <p className="mt-3 text-sm font-medium">{p.name}</p>
            {owner && (current?.priceId === p.priceId && running
              ? <p className="mt-4 text-sm text-primary">{t("plans.current")}</p>
              : !running && <Button className="mt-4 w-full" disabled={!!busy || !environment || !published} onClick={() => buy(p.priceId)}><CreditCard />{busy === p.priceId ? t("common.loading") : t("plans.choose")}</Button>)}
          </div>
        ))}
      </div>
      {!owner && <p className="mt-5 text-sm text-muted-foreground">{t("sub.owner")}</p>}
      {owner && !published && <p className="mt-3 text-sm text-muted-foreground">{t("sub.publishFirst")}</p>}
      <p className="mt-3 text-sm text-muted-foreground">{t("sub.account")} {t("sub.authorize")}</p>
    </div>
  );
}
