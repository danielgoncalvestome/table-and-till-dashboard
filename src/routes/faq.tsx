import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — MenuTap" },
      { name: "description", content: "Configuração, QR e NFC, edição, idiomas, período experimental e cancelamento." },
      { property: "og:title", content: "Perguntas frequentes — MenuTap" },
      { property: "og:description", content: "Respostas às dúvidas mais comuns sobre o MenuTap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Faq,
});

const FAQ = {
  pt: [
    ["Quanto tempo demora a configurar?", "A maioria dos restaurantes publica o primeiro menu em menos de 30 minutos. Basta criar a conta, adicionar categorias e pratos e publicar."],
    ["Preciso de reimprimir o QR code quando altero o menu?", "Não. O QR code e a etiqueta NFC apontam para um link permanente. Todas as alterações aparecem automaticamente no mesmo endereço."],
    ["Que etiquetas NFC funcionam?", "NTAG213 e outras etiquetas compatíveis com NDEF. Grava-se apenas o link — nunca o conteúdo do menu."],
    ["Posso editar preços durante o serviço?", "Sim. Altere um preço ou marque um prato como esgotado e a mudança fica visível de imediato."],
    ["Em que idiomas funciona?", "O painel está em português e inglês. Os pratos podem ser traduzidos individualmente; se faltar uma tradução, mostramos o texto original em português."],
    ["Como funciona o período experimental?", "Tem 10 dias grátis a partir do momento em que publica o menu. Não pedimos cartão."],
    ["Serei cobrado automaticamente?", "Nunca sem a sua autorização expressa. A subscrição só começa depois de a confirmar."],
    ["Posso cancelar?", "Sim, a qualquer momento. Os seus dados e menus são preservados."],
  ],
  en: [
    ["How long does setup take?", "Most restaurants publish their first menu in under 30 minutes. Create an account, add categories and dishes, then publish."],
    ["Do I need to reprint the QR code when I change the menu?", "No. The QR code and NFC tag point to a permanent link. Every change appears automatically at the same address."],
    ["Which NFC tags work?", "NTAG213 and other NDEF-compatible tags. Only the link is written — never the menu content."],
    ["Can I edit prices during service?", "Yes. Change a price or mark a dish as sold out and it's visible immediately."],
    ["Which languages are supported?", "The dashboard is in Portuguese and English. Dishes can be translated individually; if a translation is missing, the original Portuguese is shown."],
    ["How does the trial work?", "You get 10 free days from the moment you publish your menu. No card required."],
    ["Will I be charged automatically?", "Never without your explicit authorisation. The subscription only starts once you confirm it."],
    ["Can I cancel?", "Yes, anytime. Your data and menus are preserved."],
  ],
};

function Faq() {
  const { t, lang } = useI18n();
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.faq")} title={t("faq.title")} />
      <div className="mx-auto max-w-3xl px-5">
        <Accordion type="single" collapsible>
          {FAQ[lang].map(([q, a], i) => (
            <AccordionItem key={i} value={String(i)}>
              <AccordionTrigger className="text-left text-base">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </SitePage>
  );
}
