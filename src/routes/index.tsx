import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { PhonePreview } from "@/components/site/PhonePreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MenuTap — Menus digitais com QR code e NFC para restaurantes" },
      { name: "description", content: "Crie o menu do seu restaurante uma vez e partilhe-o num link que nunca muda. QR code e NFC, sem app. 10 dias grátis." },
      { property: "og:title", content: "MenuTap — O seu menu digital. Simples, elegante e sempre atualizado." },
      { property: "og:description", content: "Menus digitais por QR e NFC para restaurantes, cafés e bares em Portugal." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const C = {
  pt: {
    eyebrow: "Menus digitais por QR e NFC",
    h1a: "O seu menu digital. Simples, elegante e", h1b: "sempre atualizado.",
    sub: "Crie o seu menu online e partilhe-o por QR code e NFC. Os clientes leem o QR code ou encostam o telemóvel, por NFC, e abrem o menu num segundo — sem app, sem registo, sem complicações",
    start: "Começar gratuitamente", seeFeatures: "Funcionalidades", addr: "O seu endereço, para sempre:",
    ideaEy: "A ideia por trás do MenuTap", ideaT: "Um identificador fixo.\u00a0Um menu sempre vivo.",
    ideaD: "Cada espaço recebe um link próprio —\u00a0coloque o QR ou a etiqueta NFC na mesa, no balcão ou na parede — e é por trás dele que o menu muda sempre que precisar.",
    ideas: [["Mudou um preço?", "Já está no menu dos clientes.\u00a0"], ["Acabou o polvo?", "Marque o prato como indisponível e o menu público reflete-o de imediato, sem recarregar a página."], ["Novo menu de jantar?", "Crie-o no painel. Sem regravar etiquetas NFC, sem reimprimir QR, sem refazer a carta."]],
    howEy: "Como funciona", howT: "Do primeiro prato à primeira mesa, em seis passos simples.",
    steps: [["Crie a sua conta", "Registo em segundos, sem cartão. Os 10 dias grátis só começam quando publicar o menu."], ["Crie o menu", "Categorias, pratos, preços e fotografias num painel simples. Alergénios, etiquetas alimentares e tradução para inglês — tudo num clique."], ["Personalize", "Logótipo, cores e perfil do espaço: telefone, Instagram e avaliações Google ao alcance do cliente."], ["Obtenha o seu link", "Um link permanente, para usar em QR code e em etiquetas NFC compatíveis."], ["Os clientes leem ou tocam", "Coloque-o na mesa, no balcão ou na parede — o menu abre de imediato no telemóvel, sem app nem conta."], ["Gestão de tudo em tempo real", "Preços, pratos e disponibilidade atualizados no mesmo endereço. Receba avaliações e estatísticas para melhorar o serviço e reforçar a reputação."]],
    featEy: "Funcionalidades", featT: "Pensado para quem serve. Claro para quem se senta.", featD: "Um painel privado para a sua equipa gerir tudo, e um menu público que cada cliente percebe em segundos.",
    feats: [
      ["Vários menus, a sua ordem", "Almoço, jantar, bebidas — cada menu com as suas categorias e pratos. Reordene e arquive o que já não está em uso.", ["Entradas", "Pratos de peixe", "Sobremesas"]],
      ["Disponível ou não, num toque", "Qualquer membro da equipa marca um prato como indisponível. Os clientes veem-no logo.", ["Caldo verde", "Bacalhau à Brás", "!Polvo à lagareiro", "!Sopa da pedra"]],
      ["Os 14 alergénios da UE", "Indique-os em cada prato. No menu, o cliente exclui os que não pode comer e vê apenas o que lhe serve.", ["Glúten", "Crustáceos", "Ovos", "Peixe", "Amendoins", "Soja", "Leite", "Frutos de casca rija", "Aipo", "Mostarda", "Sésamo", "Sulfitos", "Tremoço", "Moluscos"]],
      ["Etiquetas dietéticas bem visíveis", "Distintivos de alto contraste em cada prato, e filtros que se mantêm enquanto o cliente navega.", ["Vegetariano", "Vegan", "Sem glúten", "Sem lactose", "Picante", "Biológico"]],
      ["Tradução em inglês", "Cada prato tem campos próprios para o nome e a descrição também em inglês. Se faltar uma tradução, o menu mostra o português.", ["Nome EN", "Descrição EN"]],
      ["Fotos que carregam depressa", "Carregue fotos dos pratos, logótipo e imagem de capa, otimizadas para abrir rápido no telemóvel.", []],
      ["A sua equipa, só no seu espaço", "Vários colaboradores, cada um com acesso apenas ao espaço onde trabalha.", []],
    ] as [string, string, string[]][],
    anEy: "ANÁLISES E ESTATÍSTICA", anT: "Perceba o que os clientes procuram.",
    an: ["Visualizações do menu por dia, semana e mês e os pratos mais vistos", "Avaliações rápidas que permitem melhorar o serviço e reforçar a reputação"], anNote: "Sem cookies de rastreio. Sem dados pessoais de quem consulta o menu.",
    anStats: [["66%", "preferem menus com fotografias dos pratos"], ["59%", "consultam frequentemente ou sempre o menu antes"], ["77%", "dos 18-24 anos preferem menus com fotografias"]] as [string, string][],
    anBarsT: "O que os clientes valorizam",
    anBars: [["Preferem fotografias", 66, "forest"], ["Já utilizaram menus QR", 65, "clay"]] as [string, number, string][],
    anSrc: "Inquérito Toast a 850 pessoas, novembro de 2024.",
    anStudyEy: "Estudo publicado",
    anStudyT: "Com nomes descritivos comuns, acrescentar fotografias melhorou:",
    anStudy: ["A avaliação dos pratos pelos consumidores", "A intenção de compra", "A disposição para pagar"],
    anStudySrc: "Hou, Yang & Sun (2017), “Do pictures help? The effects of pictures and food names on menu evaluations”, International Journal of Hospitality Management, 60, 94–103.",
    prEy: "PREÇO", prT: "Um plano simples, tudo incluído.", prNote: "10 dias grátis, sem cartão. Cancele quando quiser.", prLink: "Experimentar",
    faqEy: "Perguntas frequentes", faqT: "Antes de começar.",
    faqs: [["Os meus clientes precisam de instalar alguma app?", "Não. O menu abre diretamente no navegador do telemóvel, sem app e sem criar conta."], ["Se mudar um preço, tenho de reimprimir o QR?", "Não. O QR e a etiqueta NFC apontam sempre para o mesmo endereço; as alterações aparecem de imediato."], ["Como funciona o NFC?", "O cliente aproxima o telemóvel de uma etiqueta NFC e o menu abre automaticamente."], ["Que dados recolhem de quem consulta o menu?", "Apenas estatísticas anónimas, sem cookies de rastreio nem dados pessoais."], ["A minha equipa pode ajudar a gerir o menu?", "Sim. Convide colaboradores, cada um com acesso apenas ao seu espaço."]],
    more: "Ver todas as perguntas", ctaEy: "Comece hoje", ctaT: "Um atalho para o seu menu. Para sempre.",
  },
  en: {
    eyebrow: "Digital menus via QR and NFC",
    h1a: "Your digital menu. Simple, elegant and", h1b: "always up to date.",
    sub: "Create your restaurant, café or bar menu once and share it on a link that never changes. Guests scan the QR or tap the NFC tag and open it on their phone — no app, no sign-up.",
    start: "Start for free", seeFeatures: "Features", addr: "Your address, forever:",
    ideaEy: "The idea behind MenuTap", ideaT: "One fixed link. A menu that's always alive.",
    ideaD: "Every venue gets its own address. That address lives on the table QR and the NFC tag — and behind it, your menu changes whenever you need.",
    ideas: [["Changed a price?", "It's already on your guests' menu. The printed code stays the same."], ["Out of octopus?", "Mark the dish unavailable and the public menu reflects it instantly."], ["New dinner menu?", "Create it in the dashboard. No re-writing NFC tags, no reprinting QR codes."]],
    howEy: "How it works", howT: "From first dish to first table, in six simple steps.",
    steps: [["Create your account", "Sign up in seconds, no card. The 10 free days only start when you publish your menu."], ["Build the menu", "Categories, dishes, prices and photos in a simple dashboard. Allergens, dietary tags and English translation — all in one click."], ["Customise", "Logo, colours and venue profile: phone, Instagram and Google reviews within the guest's reach."], ["Get your link", "A permanent link for your QR code and compatible NFC tags, never to be reprinted."], ["Guests scan or tap", "Place it on the table, counter or wall — the menu opens instantly on the phone, no app or account."], ["Manage everything live", "Prices, dishes and availability update at the same address. Get reviews and stats to improve service and reputation."]],
    featEy: "Features", featT: "Built for those who serve. Clear for those who sit.", featD: "A private dashboard for your team, and a public menu every guest understands in seconds.",
    feats: [
      ["Multiple menus, your order", "Lunch, dinner, drinks — each with its own categories and dishes. Reorder and archive.", ["Starters", "Fish dishes", "Desserts"]],
      ["Available or not, in one tap", "Any team member can mark a dish unavailable. Guests see it right away.", ["Caldo verde", "Bacalhau à Brás", "!polvo à lagareiro", "!sopa da pedra"]],
      ["The 14 EU allergens", "Set them per dish. Guests exclude what they can't eat.", ["Gluten", "Crustaceans", "Eggs", "Fish", "Peanuts", "Soy", "Milk", "Tree nuts", "Celery", "Mustard", "Sesame", "Sulphites", "Lupin", "Molluscs"]],
      ["Clear dietary labels", "High-contrast badges on every dish, with filters that persist.", ["Vegetarian", "Vegan", "Gluten-free", "Lactose-free", "Spicy", "Organic"]],
      ["English translation", "Each dish has its own fields for the name and description in English too. If a translation is missing, the menu shows Portuguese.", ["Name EN", "Description EN"]],
      ["Fast-loading photos", "Upload dish photos, logo and cover, optimised for mobile.", []],
      ["Your team, only your venue", "Multiple staff, each with access only to their venue.", []],
    ] as [string, string, string[]][],
    anEy: "Analytics", anT: "Understand what your guests look for.",
    an: ["Menu views by day, week and month", "Sessions and chosen languages", "Most-viewed dishes"], anNote: "No tracking cookies. No personal data from menu visitors.",
    anStats: [["66%", "prefer menus with photos of the dishes"], ["59%", "check the menu often or always beforehand"], ["77%", "of 18-24s prefer menus with photos"]] as [string, string][],
    anBarsT: "What guests value",
    anBars: [["Prefer photos", 66, "forest"], ["Have used QR menus", 65, "clay"]] as [string, number, string][],
    anSrc: "Toast survey of 850 people, November 2024.",
    anStudyEy: "Published study",
    anStudyT: "With common descriptive names, adding photos improved:",
    anStudy: ["Consumers' evaluation of the dishes", "Purchase intention", "Willingness to pay"],
    anStudySrc: "Hou, Yang & Sun (2017), “Do pictures help? The effects of pictures and food names on menu evaluations”, International Journal of Hospitality Management, 60, 94–103.",
    prEy: "Pricing", prT: "One simple plan, everything included.", prNote: "10 days free, no card. Cancel anytime.", prLink: "See pricing",
    faqEy: "FAQ", faqT: "Before you start.",
    faqs: [["Do my guests need to install an app?", "No. The menu opens straight in the phone browser, no app or account."], ["If I change a price, do I reprint the QR?", "No. The QR and NFC tag always point to the same address; changes show instantly."], ["How does NFC work?", "Guests hold their phone near an NFC tag and the menu opens."], ["What data do you collect from visitors?", "Only anonymous statistics, no tracking cookies or personal data."], ["Can my team help manage the menu?", "Yes. Invite staff, each with access only to your venue."]],
    more: "See all questions", ctaEy: "Start today", ctaT: "One link for your menu. Forever.",
  },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="eyebrow">— {children}</p>;
}

function Index() {
  const { lang } = useI18n();
  const c = C[lang] ?? C.pt;
  return (
    <SitePage>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-2 md:pt-20">
        <div>
          <Eyebrow>{c.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">{c.h1a} <span className="text-primary italic">{c.h1b}</span></h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{c.sub}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link to="/auth" search={{ mode: "signup" }}>{c.start}</Link></Button>
            <Button asChild size="lg" variant="outline"><Link to="/features">{c.seeFeatures}</Link></Button>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">{c.addr}</p>
          <p className="mt-1 font-mono text-sm">menutap.pt/r/o-seu-restaurante</p>
        </div>
        <PhonePreview />
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">— {c.ideaEy}</p>
            <h2 className="mt-3 text-4xl">{c.ideaT}</h2>
            <p className="mt-4 opacity-85">{c.ideaD}</p>
            <p className="mt-6 inline-block rounded-md bg-primary-foreground/10 px-4 py-2 font-mono text-sm">menutap.pt/r/o-seu-restaurante</p>
          </div>
          <div className="space-y-6">
            {c.ideas.map(([q, a]) => (
              <div key={q} className="border-l-2 border-primary-foreground/30 pl-5">
                <h3 className="text-xl">{q}</h3>
                <p className="mt-1 opacity-85">→ {a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Eyebrow>{c.howEy}</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-4xl">{c.howT}</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {c.steps.map(([t, d], i) => (
            <div key={t} className="rounded-md border bg-card p-6">
              <p className="font-mono text-sm text-primary">0{i + 1}</p>
              <h3 className="mt-3 text-xl">{t}</h3>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Eyebrow>{c.featEy}</Eyebrow>
          <h2 className="mt-3 max-w-2xl text-4xl">{c.featT}</h2>
          <p className="mt-4 max-w-2xl text-muted-foreground">{c.featD}</p>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.feats.map(([t, d, tags]) => (
              <div key={t} className="rounded-md border bg-background p-6">
                <h3 className="text-lg">{t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                {tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {tags.map((x) => {
                      const off = x.startsWith("!");
                      return <span key={x} className={off ? "rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs text-destructive line-through" : "rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"}>{off ? x.slice(1) : x}</span>;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 ">
        <div>
          <Eyebrow>{c.anEy}</Eyebrow>
          <h2 className="mt-3 text-4xl">{c.anT}</h2>
          <ul className="mt-6 space-y-3">
            {c.an.map((x) => <li key={x} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-primary" />{x}</li>)}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">{c.anNote}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {c.anStats.map(([n, d]) => (
            <div key={n} className="rounded-md border bg-card p-6">
              <p className="font-display text-5xl text-primary">{n}</p>
              <p className="mt-3 text-sm leading-snug text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
        <div className="rounded-md border bg-card p-6">
          <p className="eyebrow">{c.anBarsT}</p>
          <div className="mt-5 space-y-4">
            {c.anBars.map(([label, pct, tone]) => (
              <div key={label}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span>{label}</span>
                  <span className={tone === "clay" ? "font-semibold text-chart-3" : "font-semibold text-primary"}>{pct}%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-muted">
                  <div className={tone === "clay" ? "h-2 rounded-full bg-chart-3" : "h-2 rounded-full bg-primary"} style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">{c.anSrc}</p>
        </div>
        <div className="rounded-md border bg-card p-6">
          <p className="eyebrow">{c.anStudyEy}</p>
          <p className="mt-3 text-lg font-semibold leading-snug">{c.anStudyT}</p>
          <ul className="mt-4 space-y-2">
            {c.anStudy.map((x) => <li key={x} className="flex gap-3 text-sm"><Check className="h-4 w-4 shrink-0 text-primary" />{x}</li>)}
          </ul>
          <p className="mt-5 text-xs text-muted-foreground">{c.anStudySrc}</p>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          <Eyebrow>{c.prEy}</Eyebrow>
          <h2 className="mt-3 text-4xl">{c.prT}</h2>
          <p className="mt-6 text-5xl">9,90 € <span className="text-lg text-muted-foreground">/ {lang === "en" ? "month" : "mês"}</span></p>
          <p className="mt-3 text-muted-foreground">{c.prNote}</p>
          <Button asChild variant="outline" className="mt-6"><Link to="/pricing">{c.prLink} <ArrowRight /></Link></Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <Eyebrow>{c.faqEy}</Eyebrow>
        <h2 className="mt-3 text-4xl">{c.faqT}</h2>
        <div className="mt-8 divide-y border-y">
          {c.faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="cursor-pointer list-none text-lg">{q}</summary>
              <p className="mt-2 text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
        <Link to="/faq" className="mt-6 inline-block text-sm text-primary underline">{c.more}</Link>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rounded-md bg-primary px-8 py-16 text-center text-primary-foreground">
          <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">— {c.ctaEy}</p>
          <h2 className="mt-3 text-4xl">{c.ctaT}</h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="secondary"><Link to="/auth" search={{ mode: "signup" }}>{c.start}</Link></Button>
          </div>
        </div>
      </section>
    </SitePage>
  );
}
