import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { CreditCard, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createPortalSession, getCheckoutResult } from "@/utils/payments.functions";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { formatDate, formatPrice } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({
  head: () => ({ meta: [{ title: "Subscrição — MenuTap" }, { name: "description", content: "Gerir a subscrição, pagamentos e período experimental da sua conta MenuTap." }, { property: "og:title", content: "Subscrição — MenuTap" }, { property: "og:description", content: "Gerir os pagamentos da sua conta MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (search: Record<string, unknown>) => ({ session_id: typeof search.session_id === "string" && /^cs_[a-zA-Z0-9_]+$/.test(search.session_id) ? search.session_id : undefined }),
  component: Sub,
});

function Sub() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const environment = getStripeEnvironment();
  const { session_id } = Route.useSearch();
  const qc = useQueryClient();
  const checkout = useServerFn(createCheckoutSession);
  const portal = useServerFn(createPortalSession);
  const result = useServerFn(getCheckoutResult);
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: user } = useQuery({ queryKey: ["billing-user"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: sub, isPending: subPending, error: subError } = useQuery({
    queryKey: ["account-subscription", user?.id, environment], enabled: !!user && !!environment,
    queryFn: async () => {
      if (!user || !environment) return null;
      const { data, error } = await supabase.from("account_subscriptions").select("*").eq("user_id", user.id).eq("environment", environment).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    }, refetchInterval: 5000,
  });
  const { data: owned } = useQuery({queryKey:["billing-owned-restaurants", user?.id], enabled:!!user, queryFn:async()=>{
    if (!user) return [];
    const {data,error}=await supabase.from("restaurants").select("trial_ends_at,trial_started_at").eq("created_by",user.id).eq("is_demo",false);
    if(error) throw error;
    return data ?? [];
  }});
  const trialDates = owned?.map(x=>x.trial_ends_at).filter((x):x is string=>!!x).sort() ?? [];
  const trialEnd = trialDates[0];
  const owner = user?.id === r.created_by;
  const canSubscribe = owner && !!owned?.some(x=>x.trial_started_at) && !subPending && !subError;
  const needsPortal = sub && !["canceled", "incomplete_expired"].includes(sub.status);
  const { data: outcome, error: outcomeError } = useQuery({
    queryKey: ["checkout-result", session_id, environment], enabled: !!session_id && !!environment,
    queryFn: async () => {
      if (!session_id || !environment) return null;
      const response = await result({ data: { sessionId: session_id, environment } });
      if ("error" in response) throw new Error(response.error);
      await qc.invalidateQueries({ queryKey: ["account-subscription"] });
      return response;
    }, refetchInterval: query => query.state.data?.paymentStatus === "unpaid" ? 5000 : false,
  });
  async function start(manage = false) {
    if (!environment) return;
    setBusy(true); setError(null);
    try {
      const data = { environment, origin: window.location.origin, lang };
      if (manage) {
        const response = await portal({ data });
        if ("error" in response) throw new Error(response.error);
        window.open(response.url, "_blank", "noopener,noreferrer");
      } else {
        const response = await checkout({ data });
        if ("error" in response) throw new Error(response.error);
        setSecret(response.clientSecret);
      }
    } catch(e) { setError(e instanceof Error ? e.message : t("common.error")); }
    finally {setBusy(false);}
  }
  const { data: s } = useQuery({ queryKey: ["platform_settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  return (
    <div>
      <PageTitle title={t("sub.title")} />
      {environment !== "live" && <p role="status" className="mb-6 border-y border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{t(environment === "sandbox" ? "sub.test" : "sub.liveMissing")}</p>}
      {outcome && <p role="status" className="mb-4 text-sm text-primary">{t(outcome.status === "complete" && outcome.paymentStatus !== "unpaid" ? "sub.confirmed" : "sub.pending")}</p>}
      {(error || subError || outcomeError) && <p role="alert" className="mb-4 text-sm text-destructive">{error ?? subError?.message ?? outcomeError?.message}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t("sub.trial")}>
          {trialEnd ? (
            <p className="text-sm">{t("sub.trialEnds")} <strong>{formatDate(trialEnd, lang)}</strong></p>
          ) : <p className="text-sm text-muted-foreground">{t("sub.trialNot")}</p>}
          {sub && <p className="mt-3 text-sm">{t((`sub.${sub.status}` in ({"sub.active":1,"sub.trialing":1,"sub.past_due":1,"sub.canceled":1,"sub.incomplete":1,"sub.unpaid":1,"sub.paused":1,"sub.incomplete_expired":1}) ? `sub.${sub.status}` : "sub.none") as Parameters<typeof t>[0])}</p>}
          {sub?.cancel_at_period_end && sub.current_period_end && <p className="mt-3 text-sm">{t("sub.cancels")} {formatDate(sub.current_period_end,lang)}</p>}
        </Panel>
        <Panel title="MenuTap">
          <p className="font-display text-4xl text-primary">{formatPrice((s?.monthly_price_cents ?? 990) / 100, lang)}<span className="text-base text-muted-foreground">{t("pricing.per")}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{t("pricing.vat")}</p>
          <p className="mt-4 text-sm">{t("sub.account")}</p>
          <p className="mt-3 text-sm text-muted-foreground">{t("sub.authorize")}</p>
          {owner ? <Button className="mt-5" disabled={busy || !environment || (!needsPortal && !canSubscribe)} onClick={()=>start(!!needsPortal)}>{needsPortal ? <ExternalLink/> : <CreditCard/>}{busy ? t("common.loading") : t(needsPortal ? "sub.manage" : "sub.subscribe")}</Button> : <p className="mt-5 text-sm text-muted-foreground">{t("sub.owner")}</p>}
          {owner && !owned?.some(x=>x.trial_started_at) && <p className="mt-3 text-sm text-muted-foreground">{t("sub.publishFirst")}</p>}
          <p className="mt-3 text-xs text-muted-foreground">{t("sub.keep")}</p>
        </Panel>
      </div>
      {secret && <section className="mt-8 border-t pt-6"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl">{t("sub.payTitle")}</h2><Button variant="ghost" size="icon" aria-label={t("common.cancel")} onClick={()=>setSecret(null)}><X/></Button></div><EmbeddedCheckoutProvider stripe={getStripe()} options={{clientSecret:secret}}><EmbeddedCheckout/></EmbeddedCheckoutProvider></section>}
    </div>
  );
}
