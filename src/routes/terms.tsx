import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Termos e condições — MenuTap" },
      { name: "description", content: "Termos de utilização da plataforma MenuTap." },
      { property: "og:title", content: "Termos e condições — MenuTap" },
      { property: "og:description", content: "Termos de utilização do MenuTap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Terms,
});

function Terms() {
  const { lang, t } = useI18n();
  const body = lang === "pt"
    ? ["O MenuTap disponibiliza uma plataforma de menus digitais mediante subscrição mensal, com período experimental gratuito.", "O restaurante é responsável pela exatidão de preços, ingredientes e alergénios publicados.", "Pode cancelar a qualquer momento. Após o fim da subscrição, os dados são preservados durante um período de carência e o acesso passa a só de leitura.", "Documento provisório — deve ser revisto por um jurista antes do lançamento comercial."]
    : ["MenuTap provides a digital menu platform through a monthly subscription, with a free trial period.", "The restaurant is responsible for the accuracy of published prices, ingredients and allergens.", "You can cancel anytime. After the subscription ends, data is preserved for a grace period and access becomes read-only.", "Provisional document — must be reviewed by a lawyer before commercial launch."];
  return (
    <SitePage>
      <PageIntro title={t("footer.terms")} />
      <div className="mx-auto max-w-3xl space-y-4 px-5 text-muted-foreground">{body.map((p) => <p key={p}>{p}</p>)}</div>
    </SitePage>
  );
}
