import { createFileRoute } from "@tanstack/react-router";
import { SitePage } from "@/components/site/SiteLayout";
import { TablesLanding } from "@/components/site/TablesLanding";

const TITLE = "Gestão de Mesas e Reservas para Restaurantes | Crumb";
const DESC = "Simplifique a gestão de mesas e reservas do seu restaurante com o Crumb. Escolha entre um sistema simples ou avançado, com reservas online e atribuição automática de mesas.";
export const Route = createFileRoute("/gestao-de-mesas")({
  head: () => ({ meta: [{ title: TITLE }, { name: "description", content: DESC }, { property: "og:title", content: TITLE }, { property: "og:description", content: DESC }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Landing,
});

function Landing() {
  return (
    <div className="theme-bordeaux">
      <SitePage>
        <TablesLanding />
      </SitePage>
    </div>
  );
}
