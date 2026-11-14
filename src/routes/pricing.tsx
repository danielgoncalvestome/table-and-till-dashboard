import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { usePlans } from "@/lib/use-plans";
import { formatPrice } from "@/lib/menu";
import logoDark from "@/assets/menutap-logo.png.asset.json";

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
  const PLANS = usePlans();
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.pricing")} title={t("pricing.title")} />
      <section className="mx-auto max-w-5xl px-5">
        <div className="rounded-md border bg-card p-8">
          <img src={logoDark.url} alt="MenuTap" className="h-10 w-auto" />
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {t("pricing.items").split("|").map((i) => (
              <li key={i} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{i}</li>
            ))}
          </ul>
          <p className="mt-6 text-sm">{t("plans.free")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 ">
            {PLANS.map((p) => (
              <div key={p.priceId} className="rounded-md border p-5">
                <p className="font-display text-4xl text-primary">{formatPrice(p.cents / 100, lang)}<span className="text-base text-muted-foreground">{t("pricing.per")}</span></p>
                <p className="mt-1 text-xs text-muted-foreground">{t("pricing.vat")}</p>
                <p className="mt-3 text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{t(p.reservations ? "plans.withRes" : "plans.menuOnly")}</p>
                <p className="text-xs text-muted-foreground">{p.devices === "per_table" ? t("plans.perTable") : t("plans.devices").replace("{n}", String(p.devices))}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 rounded bg-muted p-4 text-sm text-muted-foreground">{t("pricing.trial")}</p>
          <p className="mt-3 text-xs text-muted-foreground">{t("plans.digital")}</p>
          <Button asChild size="lg" className="mt-6 w-full"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
        </div>
      </section>
    </SitePage>
  );
}
