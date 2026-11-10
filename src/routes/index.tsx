import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Languages, QrCode, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { PhonePreview } from "@/components/site/PhonePreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuTap — Menus digitais com QR code e NFC para restaurantes" },
      { name: "description", content: "Crie, traduza e atualize o menu do seu restaurante em segundos. QR code e NFC permanentes. 10 dias grátis." },
      { property: "og:title", content: "MenuTap — O seu menu. À distância de um toque." },
      { property: "og:description", content: "Menus digitais elegantes para restaurantes, cafés e bares." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const values = [
    { icon: Sparkles, t: t("home.v1.t"), d: t("home.v1.d") },
    { icon: QrCode, t: t("home.v2.t"), d: t("home.v2.d") },
    { icon: Languages, t: t("home.v3.t"), d: t("home.v3.d") },
    { icon: BarChart3, t: t("home.v4.t"), d: t("home.v4.d") },
  ];
  return (
    <SitePage>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-[1.15fr_0.85fr] md:pt-24">
        <div>
          <p className="eyebrow">MenuTap · QR & NFC</p>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-7xl">{t("hero.tagline")}</h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{t("hero.sub")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/demo">{t("cta.demo")} <ArrowRight /></Link></Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t("hero.note")}</p>
        </div>
        <PhonePreview />
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="eyebrow">{t("home.why")}</p>
          <div className="mt-8 grid gap-10 md:grid-cols-4">
            {values.map((v) => (
              <div key={v.t}>
                <v.icon className="h-5 w-5 text-primary" />
                <h3 className="mt-4 text-xl">{v.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2 md:items-center">
        <img src="/images/demo/cover.jpg" alt="Casa do Largo" width={1600} height={912} loading="lazy" className="aspect-[4/3] w-full rounded-md object-cover" />
        <div>
          <p className="eyebrow">{t("common.demo")}</p>
          <h2 className="mt-3 text-4xl">{t("home.demoTitle")}</h2>
          <p className="mt-4 text-muted-foreground">{t("home.demoSub")}</p>
          <Button asChild className="mt-6" variant="outline"><Link to="/r/$slug" params={{ slug: "casa-do-largo" }}>{t("cta.demo")} <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-md bg-primary px-8 py-16 text-center text-primary-foreground">
          <h2 className="text-4xl">{t("home.final")}</h2>
          <Button asChild size="lg" variant="secondary" className="mt-8"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.start")}</Link></Button>
        </div>
      </section>
    </SitePage>
  );
}
