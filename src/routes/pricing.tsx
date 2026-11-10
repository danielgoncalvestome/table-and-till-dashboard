import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/menu";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Preço — MenuTap" },
      { name: "description", content: "Um plano simples com tudo incluído. 10 dias grátis, sem cartão, cancele quando quiser." },
      { property: "og:title", content: "Preço — MenuTap" },
      { property: "og:description", content: "Um plano. Tudo incluído. 10 dias grátis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const { t, lang } = useI18n();
  const { data } = useQuery({
    queryKey: ["platform_settings"],
    queryFn: async () => (await supabase.from("platform_settings").select("monthly_price_cents").eq("id", 1).single()).data,
  });
  const price = (data?.monthly_price_cents ?? 990) / 100;
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.pricing")} title={t("pricing.title")} />
      <section className="mx-auto max-w-xl px-5">
        <div className="rounded-md border bg-card p-10">
          <p className="eyebrow">MenuTap</p>
          <p className="mt-4 font-display text-6xl text-primary">{formatPrice(price, lang)}<span className="text-xl text-muted-foreground">{t("pricing.per")}</span></p>
          <p className="mt-1 text-xs text-muted-foreground">{t("pricing.vat")}</p>
          <ul className="mt-8 space-y-3">
            {t("pricing.items").split("|").map((i) => (
              <li key={i} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{i}</li>
            ))}
          </ul>
          <p className="mt-8 rounded bg-muted p-4 text-sm text-muted-foreground">{t("pricing.trial")}</p>
          <Button asChild size="lg" className="mt-6 w-full"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
        </div>
      </section>
    </SitePage>
  );
}
