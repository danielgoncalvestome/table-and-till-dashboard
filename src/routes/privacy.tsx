import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — MenuTap" },
      { name: "description", content: "Como o MenuTap trata dados pessoais, em conformidade com o RGPD." },
      { property: "og:title", content: "Política de privacidade — MenuTap" },
      { property: "og:description", content: "Privacidade e RGPD no MenuTap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  const { lang, t } = useI18n();
  const body = lang === "pt"
    ? ["Os clientes dos restaurantes navegam nos menus sem registo. Registamos apenas eventos anónimos (visualizações, pesquisas, idioma) associados a um identificador de sessão aleatório, sem nome, email ou endereço IP.", "As contas de restaurante guardam o email e o nome do utilizador para autenticação. Pode pedir a exportação ou eliminação dos seus dados para ola@menutap.pt.", "Os dados são alojados na União Europeia sempre que possível e não são vendidos a terceiros.", "Documento provisório — deve ser revisto por um jurista antes do lançamento comercial."]
    : ["Restaurant guests browse menus without signing up. We only record anonymous events (views, searches, language) tied to a random session identifier, without name, email or IP address.", "Restaurant accounts store the user's email and name for authentication. You can request export or deletion of your data at ola@menutap.pt.", "Data is hosted in the European Union where possible and is never sold to third parties.", "Provisional document — must be reviewed by a lawyer before commercial launch."];
  return (
    <SitePage>
      <PageIntro title={t("footer.privacy")} />
      <div className="mx-auto max-w-3xl space-y-4 px-5 text-muted-foreground">{body.map((p) => <p key={p}>{p}</p>)}</div>
    </SitePage>
  );
}
