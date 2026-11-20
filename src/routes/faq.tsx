import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Rocket, QrCode, CalendarDays, ChefHat, Brain, CreditCard, Users, ShieldCheck,
  Search, ChevronDown, MessageCircle, Sparkles, type LucideIcon,
} from "lucide-react";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Perguntas frequentes — Crumb" },
      { name: "description", content: "Menu digital, QR e NFC, reservas, planta da sala, pedidos, Menu Intelligence, planos e cancelamento." },
      { property: "og:title", content: "Perguntas frequentes — Crumb" },
      { property: "og:description", content: "Todas as respostas sobre o menu digital, reservas, pedidos e Menu Intelligence do Crumb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Faq,
});

type QA = [string, string];
type Cat = { id: string; icon: LucideIcon; pt: string; en: string; qa: { pt: QA[]; en: QA[] } };

const CATS: Cat[] = [
  { id: "start", icon: Rocket, pt: "Começar", en: "Getting started", qa: {
    pt: [
      ["Quanto tempo demora a configurar?", "A maioria dos restaurantes publica o primeiro menu em menos de 30 minutos: crie a conta, adicione categorias e pratos e publique."],
      ["Posso entrar com a conta Google?", "Sim. Pode entrar com Google, com email ou com nome de utilizador e palavra-passe."],
      ["Posso gerir vários restaurantes?", "Sim. Cada restaurante tem o seu menu, equipa e subscrição, e troca entre eles no menu lateral do painel."],
      ["Funciona no telemóvel?", "Sim. O painel, o controlo da sala e os pedidos estão otimizados para telemóvel e tablet, e pode adicionar o Crumb ao ecrã principal do iPhone."],
    ],
    en: [
      ["How long does setup take?", "Most restaurants publish their first menu in under 30 minutes: create an account, add categories and dishes and publish."],
      ["Can I sign in with Google?", "Yes. Sign in with Google, email, or username and password."],
      ["Can I manage several restaurants?", "Yes. Each restaurant has its own menu, team and subscription; switch between them in the dashboard sidebar."],
      ["Does it work on mobile?", "Yes. The dashboard, room control and orders are optimised for phones and tablets, and you can add Crumb to your iPhone home screen."],
    ] } },
  { id: "menu", icon: QrCode, pt: "Menu digital", en: "Digital menu", qa: {
    pt: [
      ["Preciso de mudar alguma coisa quando altero o menu?", "Não. Os dispositivos NFC apontam para um link em nuvem permanente; todas as alterações aparecem no mesmo endereço."],
      ["Posso editar preços ou esgotar pratos durante o serviço?", "Sim. A mudança fica visível de imediato para os clientes."],
      ["Posso ter vários menus?", "Sim — por exemplo almoço, jantar e bebidas — e reordenar categorias e pratos quando quiser."],
      ["Os clientes podem filtrar alergénios?", "Sim. Cada prato pode ter alergénios e dietas, e o cliente filtra o menu de acordo."],
      ["Em que idiomas funciona?", "Português e inglês. Os pratos podem ser traduzidos um a um; se faltar uma tradução, mostramos o original."],
      ["Posso personalizar o aspeto do menu?", "Sim. Em Design escolhe cores, logótipo, fotografias e estilo para o menu ficar com a cara do restaurante."],
    ],
    en: [
      ["Do I need to reprint the QR code when I change the menu?", "No. The QR code and NFC tag point to a permanent link; every change appears at the same address."],
      ["Can I edit prices or mark dishes sold out during service?", "Yes. Changes are visible to guests immediately."],
      ["Can I have several menus?", "Yes — for example lunch, dinner and drinks — and reorder categories and dishes anytime."],
      ["Can guests filter allergens?", "Yes. Each dish can list allergens and diets, and guests filter the menu accordingly."],
      ["Which languages are supported?", "Portuguese and English. Dishes can be translated one by one; if a translation is missing, the original is shown."],
      ["Can I customise the menu's look?", "Yes. In Design pick colours, logo, photos and style to match your restaurant."],
    ] } },
  { id: "res", icon: CalendarDays, pt: "Reservas e sala", en: "Bookings & room", qa: {
    pt: [
      ["Como recebo reservas online?", "O restaurante tem uma página de reservas pública. O cliente escolhe dia, hora e pessoas e só vê horários com mesa disponível."],
      ["Pode haver reservas duplicadas na mesma mesa?", "Não. A disponibilidade é verificada no servidor no momento da marcação, por isso duas reservas nunca ficam na mesma mesa à mesma hora."],
      ["Como edito a planta da sala?", "Na página Salas ative a edição da planta e arraste as mesas, crie zonas e ajuste lugares. Pode abrir o controlo da sala em ecrã inteiro."],
      ["E os clientes que chegam sem reserva?", "Use “Cliente à porta”: indica pessoas e mesa e o cliente fica sentado de imediato."],
      ["Posso limitar quem altera a planta?", "Sim. A edição da sala é uma permissão própria; a equipa pode gerir reservas sem mexer na disposição das mesas."],
    ],
    en: [
      ["How do I receive online bookings?", "Your restaurant gets a public booking page. Guests choose day, time and party size and only see slots with a free table."],
      ["Can two bookings land on the same table?", "No. Availability is checked on the server at booking time, so two bookings never share a table at the same time."],
      ["How do I edit the floor plan?", "In Rooms turn on plan editing and drag tables, create zones and set seats. Room control can open full screen."],
      ["What about walk-ins?", "Use “Walk-in”: set party size and table and the guest is seated immediately."],
      ["Can I restrict who changes the plan?", "Yes. Room editing is its own permission; staff can manage bookings without moving tables."],
    ] } },
  { id: "orders", icon: ChefHat, pt: "Pedidos", en: "Orders", qa: {
    pt: [
      ["Como chegam os pedidos?", "Pelo menu digital, feito pelo cliente, ou pela equipa a partir de uma mesa ocupada. Todos aparecem em tempo real na página Pedidos."],
      ["Como acompanho o estado de cada pedido?", "Cada cartão mostra o próximo passo: Começar → Pronto → Entregar. Pode filtrar por estado no topo; por defeito vê só os pedidos em aberto."],
      ["Posso ver os pedidos de uma mesa?", "Sim. Toque na mesa no controlo da sala para ver os pedidos e o total dessa mesa."],
      ["Os pedidos funcionam em ecrã inteiro na cozinha?", "Sim. A página Pedidos abre em ecrã inteiro, ideal para um tablet na cozinha ou no balcão."],
    ],
    en: [
      ["How do orders arrive?", "From the digital menu by the guest, or by staff from an occupied table. All appear in real time on the Orders page."],
      ["How do I track each order?", "Each card shows the next step: Start → Ready → Deliver. Filter by status at the top; by default you see open orders only."],
      ["Can I see a table's orders?", "Yes. Tap the table in room control to see its orders and total."],
      ["Do orders work full screen in the kitchen?", "Yes. The Orders page opens full screen, ideal for a kitchen or counter tablet."],
    ] } },
  { id: "intel", icon: Brain, pt: "Menu Intelligence", en: "Menu Intelligence", qa: {
    pt: [
      ["O que é o Menu Intelligence?", "Uma análise que cruza popularidade e margem de cada prato e os divide em Estrelas, Populares, Oportunidades e A rever."],
      ["Que sugestões dá?", "Para cada prato indica o que fazer: rever o preço, destacar no menu, melhorar a descrição ou retirar."],
      ["Que estatísticas tenho?", "Visitas ao menu, pratos mais vistos, reservas e pedidos, por 7, 30 ou 90 dias, num dashboard que pode arrastar e redimensionar."],
    ],
    en: [
      ["What is Menu Intelligence?", "An analysis crossing each dish's popularity and margin, sorting them into Stars, Popular, Opportunities and Review."],
      ["What suggestions does it give?", "For each dish it says what to do: adjust price, highlight it, improve the description or remove it."],
      ["What stats do I get?", "Menu visits, most viewed dishes, bookings and orders over 7, 30 or 90 days, in a dashboard you can drag and resize."],
    ] } },
  { id: "team", icon: Users, pt: "Equipa", en: "Team", qa: {
    pt: [
      ["Posso convidar a minha equipa?", "Sim. Em Definições → Equipa convide membros e escolha o que cada um pode fazer."],
      ["A equipa vê a faturação?", "Não. A subscrição e os dados de pagamento são geridos apenas pelo dono do restaurante."],
    ],
    en: [
      ["Can I invite my team?", "Yes. In Settings → Team invite members and choose what each can do."],
      ["Does staff see billing?", "No. Subscription and payment details are managed by the restaurant owner only."],
    ] } },
  { id: "billing", icon: CreditCard, pt: "Planos e pagamento", en: "Plans & billing", qa: {
    pt: [
      ["Que planos existem?", "Menu Digital, e Gestão de Reservas e Pedidos, que acrescenta planta da sala, reservas e pedidos. Veja os preços na página de planos."],
      ["Como funciona o período experimental?", "Tem 10 dias grátis a partir do momento em que publica o menu. Não pedimos cartão."],
      ["Serei cobrado automaticamente?", "Nunca sem a sua autorização expressa. A subscrição só começa depois de a confirmar."],
      ["Posso mudar de plano?", "Sim, a qualquer momento, nas Definições → Subscrição."],
      ["Posso cancelar?", "Sim, a qualquer momento. Os seus dados e menus são preservados."],
    ],
    en: [
      ["Which plans are there?", "Digital Menu, and Bookings & Orders, which adds the floor plan, bookings, orders and Menu Intelligence. See prices on the plans page."],
      ["How does the trial work?", "You get 10 free days from the moment you publish your menu. No card required."],
      ["Will I be charged automatically?", "Never without your explicit authorisation. The subscription only starts once you confirm it."],
      ["Can I change plans?", "Yes, anytime, in Settings → Subscription."],
      ["Can I cancel?", "Yes, anytime. Your data and menus are preserved."],
    ] } },
  { id: "sec", icon: ShieldCheck, pt: "Dados e segurança", en: "Data & security", qa: {
    pt: [
      ["Os meus dados estão seguros?", "Sim. Cada restaurante só é acessível à sua equipa, e os pagamentos são processados por um fornecedor certificado — nunca guardamos dados de cartão."],
      ["O que acontece ao menu se a subscrição terminar?", "O menu público deixa de estar visível, mas nada é apagado: ao reativar, tudo volta como estava."],
    ],
    en: [
      ["Is my data safe?", "Yes. Each restaurant is only accessible to its team, and payments are handled by a certified provider — we never store card details."],
      ["What happens to my menu if the subscription ends?", "The public menu stops showing, but nothing is deleted: reactivate and everything is back."],
    ] } },
];

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, v] as const;
}
function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const [ref, v] = useInView<HTMLDivElement>();
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 ${v ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}>{children}</div>;
}

function Item({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`rounded-2xl border bg-card transition-all duration-300 ${open ? "border-primary/40 shadow-md" : "hover:-translate-y-0.5 hover:shadow-sm"}`}>
      <button onClick={onToggle} className="flex w-full items-center gap-3 px-5 py-4 text-left" aria-expanded={open}>
        <span className="flex-1 font-medium">{q}</span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-300 ${open ? "rotate-180 bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          <ChevronDown className="h-4 w-4" />
        </span>
      </button>
      <div className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">{a}</p></div>
      </div>
    </div>
  );
}

function Faq() {
  const { t, lang } = useI18n();
  const L = lang === "en" ? "en" : "pt";
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>("start-0");

  const groups = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CATS.filter((c) => cat === "all" || c.id === cat)
      .map((c) => ({ c, items: c.qa[L].map((x, i) => ({ x, key: `${c.id}-${i}` })).filter(({ x }) => !s || (x[0] + x[1]).toLowerCase().includes(s)) }))
      .filter((g) => g.items.length);
  }, [cat, q, L]);

  const total = CATS.reduce((n, c) => n + c.qa[L].length, 0);
  const chip = (active: boolean) => `inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-all duration-200 ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:-translate-y-0.5 hover:border-primary/40"}`;

  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.faq")} title={t("faq.title")} />
      <div className="mx-auto max-w-4xl px-5 pb-20">
        <Reveal>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L === "pt" ? `Pesquisar em ${total} perguntas…` : `Search ${total} questions…`}
              className="h-12 w-full rounded-2xl border bg-card pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2 sm:flex-wrap">
            <button className={chip(cat === "all")} onClick={() => setCat("all")}><Sparkles className="h-4 w-4" />{L === "pt" ? "Todas" : "All"}</button>
            {CATS.map((c) => (
              <button key={c.id} className={chip(cat === c.id)} onClick={() => setCat(c.id)}><c.icon className="h-4 w-4" />{c[L]}</button>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 space-y-10">
          {groups.length === 0 && (
            <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{L === "pt" ? "Nenhuma pergunta encontrada." : "No questions found."}</p>
          )}
          {groups.map(({ c, items }, gi) => (
            <Reveal key={c.id + cat + q} delay={gi * 60}>
              <section>
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></span>
                  <h2 className="text-lg font-semibold">{c[L]}</h2>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="space-y-2">
                  {items.map(({ x, key }) => (
                    <Item key={key} q={x[0]} a={x[1]} open={open === key} onToggle={() => setOpen(open === key ? null : key)} />
                  ))}
                </div>
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal delay={100}>
          <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-primary p-8 text-center text-primary-foreground sm:flex-row sm:text-left">
            <MessageCircle className="h-10 w-10 shrink-0 animate-[float_4s_ease-in-out_infinite]" />
            <div className="flex-1">
              <p className="text-lg font-semibold">{L === "pt" ? "Não encontrou a resposta?" : "Didn't find your answer?"}</p>
              <p className="text-sm opacity-80">{L === "pt" ? "Experimente grátis durante 10 dias ou veja os planos." : "Try it free for 10 days or see the plans."}</p>
            </div>
            <div className="flex gap-2">
              <Link to="/pricing" className="rounded-full border border-primary-foreground/30 px-4 py-2 text-sm font-medium transition hover:bg-primary-foreground/10">{L === "pt" ? "Ver planos" : "See plans"}</Link>
              <Link to="/auth" className="rounded-full bg-primary-foreground px-4 py-2 text-sm font-medium text-primary transition hover:-translate-y-0.5">{L === "pt" ? "Começar" : "Start"}</Link>
            </div>
          </div>
        </Reveal>
      </div>
    </SitePage>
  );
}
