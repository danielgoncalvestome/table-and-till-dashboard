import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, QrCode, Languages, ShieldAlert, Sparkles, Clock, BarChart3, Star, UtensilsCrossed, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Funcionalidades — MenuTap" },
      { name: "description", content: "Menus digitais, QR e NFC, traduções, alergénios, recomendações, horários e análise." },
      { property: "og:title", content: "Funcionalidades — MenuTap" },
      { property: "og:description", content: "Tudo o que o menu do seu restaurante precisa, num único plano." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Features,
});

function Features() {
  const { t } = useI18n();
  const items = [
    [BookOpen, "f.menus"], [QrCode, "f.qr"], [Languages, "f.tr"], [ShieldAlert, "f.al"],
    [Sparkles, "f.rec"], [Clock, "f.sch"], [BarChart3, "f.an"], [Star, "f.rate"],
  ] as const;
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.features")} title={t("features.title")} sub={t("features.sub")} />
      <section className="mx-auto mb-10 grid max-w-6xl gap-4 px-5 md:grid-cols-3">
        {[
          [UtensilsCrossed, "f.h1"],
          [RefreshCw, "f.h2"],
          [TrendingUp, "f.h3"],
        ].map(([Icon, k], i) => (
          <div key={k} className="rounded-md bg-primary p-6 text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10">
                <Icon className="h-4 w-4 text-sage" />
              </span>
              <span className="font-display text-sm text-primary-foreground/50">0{i + 1}</span>
            </div>
            <h3 className="mt-5 text-xl">{t(k)}</h3>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/75">{t(`${k}.d` as never)}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto grid max-w-6xl gap-px overflow-hidden rounded-md border bg-border px-0 md:grid-cols-2">
        {items.map(([Icon, k]) => (
          <div key={k} className="bg-card p-8">
            <Icon className="h-5 w-5 text-primary" />
            <h3 className="mt-4 text-2xl">{t(k)}</h3>
            <p className="mt-2 text-muted-foreground">{t(`${k}.d` as never)}</p>
          </div>
        ))}
      </section>
      <div className="mx-auto mt-12 max-w-6xl px-5">
        <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
      </div>
    </SitePage>
  );
}
