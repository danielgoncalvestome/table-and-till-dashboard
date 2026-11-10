import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, QrCode, Languages, ShieldAlert, Sparkles, Clock, BarChart3, Star } from "lucide-react";
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
