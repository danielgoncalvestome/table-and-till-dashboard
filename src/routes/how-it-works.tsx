import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "Como funciona — MenuTap" },
      { name: "description", content: "Crie o menu, personalize, gere o QR/NFC permanente e gira tudo em tempo real." },
      { property: "og:title", content: "Como funciona — MenuTap" },
      { property: "og:description", content: "Do primeiro prato ao QR code na mesa, em minutos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: How,
});

function How() {
  const { t } = useI18n();
  const steps = [1, 2, 3, 4, 5] as const;
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.how")} title={t("how.title")} />
      <ol className="mx-auto max-w-4xl px-5">
        {steps.map((n) => (
          <li key={n} className="grid grid-cols-[4rem_1fr] gap-4 border-t py-8">
            <span className="font-display text-4xl text-sage">0{n}</span>
            <div>
              <h3 className="text-2xl">{t(`how.${n}` as never)}</h3>
              <p className="mt-2 text-muted-foreground">{t(`how.${n}d` as never)}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mx-auto mt-8 flex max-w-4xl gap-3 px-5">
        <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.start")}</Link></Button>
        <Button asChild size="lg" variant="outline"><Link to="/demo">{t("cta.demo")}</Link></Button>
      </div>
    </SitePage>
  );
}
