import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Demonstração — Casa do Largo · MenuTap" },
      { name: "description", content: "Explore o menu digital de demonstração do restaurante fictício Casa do Largo." },
      { property: "og:title", content: "Demonstração MenuTap — Casa do Largo" },
      { property: "og:description", content: "Um menu digital real, interativo, em português e inglês." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Demo,
});

function Demo() {
  const { t } = useI18n();
  return (
    <SitePage>
      <PageIntro eyebrow={t("pub.demoBanner")} title={t("home.demoTitle")} sub={t("home.demoSub")} />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-[380px_1fr]">
        <div className="mx-auto h-[720px] w-[360px] overflow-hidden rounded-[2.2rem] border-8 border-charcoal bg-card shadow-2xl">
          <iframe src="/r/casa-do-largo" title="Casa do Largo" className="h-full w-full" />
        </div>
        <div className="self-center">
          <p className="text-muted-foreground">menutap.pt/r/casa-do-largo</p>
          <Button asChild className="mt-4"><Link to="/r/$slug" params={{ slug: "casa-do-largo" }}>{t("common.open")} <ExternalLink /></Link></Button>
          <div className="mt-10 border-t pt-6">
            <Button asChild size="lg" variant="outline"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
          </div>
        </div>
      </div>
    </SitePage>
  );
}
