import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Panel } from "@/components/dash/ui";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/help")({ component: Help });

function Help() {
  const { t, lang } = useI18n();
  const items = lang === "pt"
    ? [["Alterar um preço", "Em Menus e pratos, escreva o novo preço na caixa ao lado do prato e carregue Enter."], ["Esconder um prato esgotado", "Desligue o interruptor “Disponível”. Fica visível como esgotado."], ["Publicar", "No Visão geral, carregue em “Publicar menu”. O período experimental começa nesse momento."], ["QR e NFC", "Em QR & NFC, descarregue o QR ou copie o link para gravar numa etiqueta NFC."]]
    : [["Change a price", "In Menus & dishes, type the new price next to the dish and press Enter."], ["Hide a sold-out dish", "Turn off the “Available” switch. It shows as sold out."], ["Publish", "In Overview, click “Publish menu”. Your trial starts at that moment."], ["QR & NFC", "In QR & NFC, download the QR or copy the link to write to an NFC tag."]];
  return (
    <div>
      <PageTitle title={t("help.title")} />
      <div className="grid gap-4 md:grid-cols-2">{items.map(([a, b]) => <Panel key={a} title={a}><p className="text-sm text-muted-foreground">{b}</p></Panel>)}</div>
      <p className="mt-6 text-sm">ola@menutap.pt</p>
    </div>
  );
}
