import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "Política de reembolso — MenuTap" },
      { name: "description", content: "Garantia de reembolso de 14 dias nas subscrições MenuTap." },
      { property: "og:title", content: "Política de reembolso — MenuTap" },
      { property: "og:description", content: "Garantia de reembolso de 14 dias no MenuTap." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Refund,
});

const PT = [
  "Política de Reembolso — MenuTap (Daniel Gonçalves Tomé)",
  "Oferecemos uma garantia de reembolso de 14 dias. Se não estiver satisfeito com a sua subscrição, pode pedir o reembolso total no prazo de 14 dias a contar da data da encomenda.",
  "Os reembolsos são processados pelo nosso revendedor e Merchant of Record, a Paddle. Para pedir um reembolso, aceda a paddle.net e procure a sua encomenda, ou contacte-nos através da página de contacto.",
  "Pode também cancelar a subscrição a qualquer momento no painel; o cancelamento impede renovações futuras.",
  "Esta política complementa a Política de Reembolso da Paddle (https://www.paddle.com/legal/refund-policy).",
];
const EN = [
  "Refund Policy — MenuTap (Daniel Gonçalves Tomé)",
  "We offer a 14-day money-back guarantee. If you're not satisfied with your subscription, you can request a full refund within 14 days of your order date.",
  "Refunds are processed by our reseller and Merchant of Record, Paddle. To request a refund, visit paddle.net and look up your order, or contact us through the contact page.",
  "You can also cancel your subscription anytime from the dashboard; cancelling stops future renewals.",
  "This policy complements Paddle's Refund Policy (https://www.paddle.com/legal/refund-policy).",
];

function Refund() {
  const { lang, t } = useI18n();
  const body = lang === "pt" ? PT : EN;
  return (
    <SitePage>
      <PageIntro title={t("footer.refund")} />
      <div className="mx-auto max-w-3xl space-y-4 px-5 text-muted-foreground">{body.map((p) => <p key={p}>{p}</p>)}</div>
    </SitePage>
  );
}
