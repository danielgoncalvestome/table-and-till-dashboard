import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { formatDate, formatPrice } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/dashboard/subscription")({ component: Sub });

function Sub() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const { data: s } = useQuery({ queryKey: ["platform_settings"], queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data });
  return (
    <div>
      <PageTitle title={t("sub.title")} />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title={t("sub.trial")}>
          {r.trial_started_at ? (
            <p className="text-sm">{t("sub.trialEnds")} <strong>{formatDate(r.trial_ends_at!, lang)}</strong></p>
          ) : <p className="text-sm text-muted-foreground">{t("sub.trialNot")}</p>}
          <p className="mt-3 text-xs text-muted-foreground">Status: {r.status}</p>
        </Panel>
        <Panel title="MenuTap">
          <p className="font-display text-4xl text-primary">{formatPrice((s?.monthly_price_cents ?? 990) / 100, lang)}<span className="text-base text-muted-foreground">{t("pricing.per")}</span></p>
          <p className="mt-4 rounded bg-muted p-3 text-sm text-muted-foreground">{t("sub.notConfigured")}</p>
          <p className="mt-3 text-xs text-muted-foreground">{t("sub.keep")}</p>
        </Panel>
      </div>
    </div>
  );
}
