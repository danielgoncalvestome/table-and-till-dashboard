import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageTitle, Panel } from "@/components/dash/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { realAccountEmail } from "@/lib/account-rules";
import { submitContact } from "@/utils/contact.functions";

export const Route = createFileRoute("/_authenticated/dashboard/help")({ head: () => ({ meta: [{ title: "Ajuda — MenuTap" }, { name: "description", content: "Encontre apoio para gerir o MenuTap." }, { property: "og:title", content: "Ajuda — MenuTap" }, { property: "og:description", content: "Encontre apoio para gerir o MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Help });

const FAQ: Record<"pt" | "en", [string, string][]> = {
  pt: [
    ["Alterar um preço", "Em Menus e pratos, escreva o novo preço na caixa ao lado do prato e carregue Enter."],
    ["Esconder um prato esgotado", "Desligue o interruptor “Disponível”. Fica visível como esgotado."],
    ["Publicar", "No Visão geral, carregue em “Publicar menu”. O período experimental começa nesse momento."],
    ["QR e NFC", "Em QR & NFC, descarregue o QR ou copie o link para gravar numa etiqueta NFC."],
    ["Traduzir o menu para inglês", "Ao criar ou editar um prato, preencha os campos de nome e descrição em inglês. Os clientes escolhem o idioma no topo do menu."],
    ["Adicionar fotografias a um prato", "No prato, carregue a imagem principal e, se quiser, imagens adicionais para a galeria. A principal aparece na lista; as outras abrem na página do prato."],
    ["Etiquetas dietéticas", "Escolha uma das etiquetas sugeridas (vegetariano, vegan, sem glúten…) ou escreva a sua. Aparecem junto ao nome do prato."],
    ["Alergénios", "Assinale os alergénios do prato e confirme que a informação está correta. São mostrados ao cliente com uma nota de aviso."],
    ["Página de detalhe do prato", "O cliente toca no prato para abrir a descrição longa, a galeria de imagens, os ingredientes e a avaliação por estrelas."],
    ["Avaliações dos clientes", "Cada prato pode ser avaliado de 1 a 5 estrelas, sem registo. A média aparece no menu e nas estatísticas."],
    ["Ver estatísticas", "Em Estatísticas tem visualizações por dia e por hora, pratos e categorias mais vistos, pesquisas e idiomas."],
    ["Equipas e locais", "Em Equipa e locais vê quem tem acesso e adiciona os endereços do espaço. Convites por email ainda não estão disponíveis."],
    ["Adicionar email ou mudar a palavra-passe", "Em Definições, na secção Conta e segurança, pode associar um email à conta e alterar a palavra-passe."],
    ["Período experimental", "São 10 dias grátis a partir da publicação do primeiro menu, sem cartão. Depois, escolha um plano em Subscrição."],
    ["Cancelar a subscrição", "Em Subscrição pode cancelar quando quiser; mantém o acesso até ao fim do período já pago."],
    ["O menu não abre", "Confira se publicou o menu e se o link ou o QR são os do Visão geral. Se o problema continuar, use o formulário acima."],
  ],
  en: [
    ["Change a price", "In Menus & dishes, type the new price next to the dish and press Enter."],
    ["Hide a sold-out dish", "Turn off the “Available” switch. It shows as sold out."],
    ["Publish", "In Overview, click “Publish menu”. Your trial starts at that moment."],
    ["QR & NFC", "In QR & NFC, download the QR or copy the link to write to an NFC tag."],
    ["Translate the menu to English", "When creating or editing a dish, fill in the English name and description fields. Customers pick the language at the top of the menu."],
    ["Add photos to a dish", "In the dish, upload the main image and, if you want, extra images for the gallery. The main one shows in the list; the others open on the dish page."],
    ["Dietary tags", "Pick one of the suggested tags (vegetarian, vegan, gluten-free…) or write your own. They appear next to the dish name."],
    ["Allergens", "Tick the dish's allergens and confirm the information is correct. Customers see them with a warning note."],
    ["Dish detail page", "Customers tap a dish to open the long description, image gallery, ingredients and star rating."],
    ["Customer ratings", "Each dish can be rated from 1 to 5 stars, with no sign-up. The average shows in the menu and in analytics."],
    ["See analytics", "In Analytics you get views by day and hour, most-seen dishes and categories, searches and languages."],
    ["Team and locations", "In Team & locations you see who has access and add the venue's addresses. Email invitations are not available yet."],
    ["Add an email or change the password", "In Settings, under Account & security, you can attach an email to the account and change the password."],
    ["Trial period", "You get 10 free days from publishing your first menu, with no card. After that, pick a plan in Subscription."],
    ["Cancel the subscription", "In Subscription you can cancel anytime; you keep access until the end of the period already paid for."],
    ["The menu won't open", "Check that you published the menu and that the link or QR are the ones from Overview. If it keeps happening, use the form above."],
  ],
};

function Help() {
  const { t, lang } = useI18n();
  const items = FAQ[lang];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const { data: account } = useQuery({
    queryKey: ["help-account"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw error ?? new Error("Authentication required");
      return realAccountEmail(user.email);
    },
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await submitContact({ data: { name, email, message: msg } });
      if (!r.ok) throw new Error();
      setDone(true);
      setMsg("");
    } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageTitle title={t("help.title")} />

      <Panel title={t("contact.title")}>
        <p className="mb-4 text-sm text-muted-foreground">{t("contact.sub")}</p>
        {done ? (
          <div className="rounded-md border bg-secondary p-4 text-sm font-medium">{t("contact.thanks")}</div>
        ) : (
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <div>
              <Label htmlFor="help-name">{t("auth.name")}</Label>
              <Input id="help-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className="mt-1" />
            </div>
            <div>
              <Label htmlFor="help-email">Email</Label>
              <Input id="help-email" type="email" value={email || (account ?? "")} onChange={(e) => setEmail(e.target.value)} required maxLength={255} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="help-msg">{t("contact.message")}</Label>
              <Textarea id="help-msg" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} required maxLength={5000} className="mt-1" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy}>{t("contact.send")}</Button>
            </div>
          </form>
        )}
      </Panel>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map(([a, b]) => <Panel key={a} title={a}><p className="text-sm text-muted-foreground">{b}</p></Panel>)}
      </div>
    </div>
  );
}
