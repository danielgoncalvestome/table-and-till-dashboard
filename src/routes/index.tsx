import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BarChart3, Check, ChevronDown, ChevronUp, Brain, Copy, Image as ImageIcon, Languages, Layers, Leaf, Nfc, Palette, Plus, QrCode, ShieldCheck, Smartphone, Sparkles, Star, ToggleRight, TrendingUp, UserPlus, Users, UtensilsCrossed, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { PhonePreview } from "@/components/site/PhonePreview";
import { TablesLanding } from "@/components/site/TablesLanding";

export const Route = createFileRoute("/")({
  validateSearch: (s: Record<string, unknown>): { p?: "reservas" } =>
    s.p === "reservas" ? { p: "reservas" } : {},
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
    ideaEy: "A ideia por trás do MenuTap", ideaT: "Um link fixo.\u00a0Um menu sempre vivo.",
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

function HomeSwitch({ active }: { active: "menu" | "reservas" }) {
  const navigate = useNavigate({ from: "/" });
  const base = "rounded-full px-4 py-2 text-sm font-medium transition-colors";
  return (
    <div className="flex justify-center px-5 pt-6">
      <div className="inline-flex rounded-full border bg-card p-1" role="tablist" aria-label="Escolher página inicial">
        <button
          role="tab"
          aria-selected={active === "menu"}
          onClick={() => navigate({ to: "/", search: { p: undefined }, replace: true })}
          className={`${base} ${active === "menu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Menu digital
        </button>
        <button
          role="tab"
          aria-selected={active === "reservas"}
          onClick={() => navigate({ to: "/", search: { p: "reservas" }, replace: true })}
          className={`${base} ${active === "reservas" ? "bg-bordeaux text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          Gestão e reservas
        </button>
      </div>
    </div>
  );
}

function Index() {
  const { lang } = useI18n();
  const c = C[lang] ?? C.pt;
  const { p } = Route.useSearch();
  if (p === "reservas") {
    return (
      <div className="theme-bordeaux">
        <SitePage>
          <HomeSwitch active="reservas" />
          <TablesLanding />
        </SitePage>
      </div>
    );
  }
  return (
    <SitePage>
      <HomeSwitch active="menu" />
      <section className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 md:grid-cols-2 md:pt-20">
          <Reveal>
            <Eyebrow>{c.eyebrow}</Eyebrow>
            <h1 className="mt-4 text-5xl leading-[1.05] md:text-6xl">{c.h1a} <span className="text-primary italic">{c.h1b}</span></h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">{c.sub}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="group"><Link to="/auth" search={{ mode: "signup" }}>{c.start} <ArrowRight className="transition-transform group-hover:translate-x-1" /></Link></Button>
              <Button asChild size="lg" variant="outline"><a href="#funcionalidades">{c.seeFeatures}</a></Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">{c.addr}</p>
            <CopyLink />
          </Reveal>
          <Reveal className="delay-150"><div className="motion-safe:animate-[float_6s_ease-in-out_infinite]"><PhonePreview /></div></Reveal>
        </div>
      </section>

      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">— {c.ideaEy}</p>
            <h2 className="mt-3 text-4xl">{c.ideaT}</h2>
            <p className="mt-4 opacity-85">{c.ideaD}</p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-md bg-primary-foreground/10 px-4 py-2 font-mono text-sm"><span className="flex gap-1"><QrCode className="h-4 w-4" /><Nfc className="h-4 w-4" /></span>menutap.pt/r/o-seu-restaurante</div>
          </Reveal>
          <IdeaTabs ideas={c.ideas} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal><Eyebrow>{c.howEy}</Eyebrow><h2 className="mt-3 max-w-2xl text-4xl">{c.howT}</h2></Reveal>
        <Steps steps={c.steps} />
      </section>

      <section id="funcionalidades" className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal>
            <Eyebrow>{c.featEy}</Eyebrow>
            <h2 className="mt-3 max-w-2xl text-4xl">{c.featT}</h2>
            <p className="mt-4 max-w-2xl text-muted-foreground">{c.featD}</p>
          </Reveal>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <Reveal className="lg:col-span-2"><AllergenDemo tags={c.feats[2][2]} diet={c.feats[3][2]} /></Reveal>
            <Reveal className="delay-100"><AvailabilityDemo dishes={c.feats[1][2]} /></Reveal>
            <Reveal><LangDemo /></Reveal>
            <Reveal className="lg:col-span-2 delay-100"><MenusDemo cats={c.feats[0][2]} /></Reveal>
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.feats.map(([t, d], i) => {
              const I = FEAT_ICONS[i] ?? Sparkles;
              return (
                <Reveal key={t}>
                  <div className="group h-full rounded-xl border bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3"><I className="h-5 w-5" /></span>
                    <h3 className="mt-4 text-lg">{t}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{d}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <IntelSection />

      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-20">
        <Reveal>
          <Eyebrow>{c.anEy}</Eyebrow>
          <h2 className="mt-3 text-4xl">{c.anT}</h2>
          <ul className="mt-6 space-y-3">
            {c.an.map((x) => <li key={x} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-primary" />{x}</li>)}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">{c.anNote}</p>
        </Reveal>
        <Reveal><ViewsChart /></Reveal>
        <div className="grid gap-4 sm:grid-cols-3">
          {c.anStats.map(([n, d], i) => (
            <Reveal key={n}>
              <div className="h-full rounded-xl border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-lg">
                <p className="font-display text-5xl text-primary"><Counter to={parseInt(n)} />%</p>
                <p className="mt-3 text-sm leading-snug text-muted-foreground">{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Reveal>
            <div className="h-full rounded-xl border bg-card p-6">
              <p className="eyebrow">{c.anBarsT}</p>
              <div className="mt-5 space-y-4">
                {c.anBars.map(([label, pct, tone]) => <Bar key={label} label={label} pct={pct} clay={tone === "clay"} />)}
              </div>
              <p className="mt-5 text-xs text-muted-foreground">{c.anSrc}</p>
            </div>
          </Reveal>
          <Reveal className="delay-100">
            <div className="h-full rounded-xl border bg-card p-6">
              <p className="eyebrow">{c.anStudyEy}</p>
              <p className="mt-3 text-lg font-semibold leading-snug">{c.anStudyT}</p>
              <ul className="mt-4 space-y-2">
                {c.anStudy.map((x) => <li key={x} className="flex gap-3 text-sm"><TrendingUp className="h-4 w-4 shrink-0 text-primary" />{x}</li>)}
              </ul>
              <p className="mt-5 text-xs text-muted-foreground">{c.anStudySrc}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <Reveal className="text-center"><Eyebrow>{c.prEy}</Eyebrow><h2 className="mt-3 text-4xl">{c.prT}</h2></Reveal>
          <Reveal className="mx-auto mt-10 max-w-md">
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary bg-background p-8 shadow-xl transition-transform hover:-translate-y-1">
              <div aria-hidden className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" />
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">Menu digital</p>
              <p className="mt-3 text-5xl">9,90 € <span className="text-lg text-muted-foreground">/ {lang === "en" ? "month" : "mês"}</span></p>
              <p className="mt-2 text-sm text-muted-foreground">{c.prNote}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {c.feats.map(([t]) => <li key={t} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{t}</li>)}
                <li className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{c.anT}</li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="group flex-1"><Link to="/auth" search={{ mode: "signup" }}>{c.start} <ArrowRight className="transition-transform group-hover:translate-x-1" /></Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/pricing">{c.prLink}</Link></Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <Reveal><Eyebrow>{c.faqEy}</Eyebrow><h2 className="mt-3 text-4xl">{c.faqT}</h2></Reveal>
        <div className="mt-8 divide-y border-y">
          {c.faqs.map(([q, a]) => (
            <details key={q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg">{q}<Plus className="h-5 w-5 shrink-0 text-primary transition-transform duration-300 group-open:rotate-45" /></summary>
              <p className="mt-2 text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1">{a}</p>
            </details>
          ))}
        </div>
        <Link to="/faq" className="mt-6 inline-block text-sm text-primary underline">{c.more}</Link>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-16 text-center text-primary-foreground">
            <div aria-hidden className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary-foreground/10 blur-2xl motion-safe:animate-pulse" />
            <p className="text-xs font-medium uppercase tracking-[0.2em] opacity-80">— {c.ctaEy}</p>
            <h2 className="mt-3 text-4xl">{c.ctaT}</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary"><Link to="/auth" search={{ mode: "signup" }}>{c.start}</Link></Button>
            </div>
          </div>
        </Reveal>
      </section>
    </SitePage>
  );
}

/* ---------- motion helpers & interactive demos ---------- */
function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null); const [on, setOn] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); o.disconnect(); } }, { threshold: 0.15 }); o.observe(el); return () => o.disconnect(); }, []);
  return [ref, on] as const;
}
function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const [ref, on] = useInView<HTMLDivElement>();
  return <div ref={ref} className={`transition-all duration-700 motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"} ${className}`}>{children}</div>;
}
function Counter({ to }: { to: number }) {
  const [ref, on] = useInView<HTMLSpanElement>(); const [v, setV] = useState(0);
  useEffect(() => { if (!on) return; let f = 0; const t0 = performance.now(); const tick = (t: number) => { const p = Math.min(1, (t - t0) / 1200); setV(Math.round(to * (1 - Math.pow(1 - p, 3)))); if (p < 1) f = requestAnimationFrame(tick); }; f = requestAnimationFrame(tick); return () => cancelAnimationFrame(f); }, [on, to]);
  return <span ref={ref}>{v}</span>;
}
function Bar({ label, pct, clay }: { label: string; pct: number; clay: boolean }) {
  const [ref, on] = useInView<HTMLDivElement>();
  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-4 text-sm"><span>{label}</span><span className={clay ? "font-semibold text-chart-3" : "font-semibold text-primary"}>{pct}%</span></div>
      <div className="mt-2 h-2 rounded-full bg-muted"><div className={`h-2 rounded-full transition-[width] duration-1000 ease-out ${clay ? "bg-chart-3" : "bg-primary"}`} style={{ width: on ? `${pct}%` : "0%" }} /></div>
    </div>
  );
}
function CopyLink() {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText("menutap.pt/r/o-seu-restaurante"); setOk(true); setTimeout(() => setOk(false), 1500); }} className="mt-1 inline-flex items-center gap-2 rounded-md border bg-card px-3 py-1.5 font-mono text-sm transition-colors hover:border-primary">
      menutap.pt/r/o-seu-restaurante {ok ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}
function IdeaTabs({ ideas }: { ideas: string[][] }) {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % ideas.length), 4500); return () => clearInterval(id); }, [ideas.length]);
  return (
    <div className="space-y-3">
      {ideas.map(([q, a], k) => (
        <button key={q} onClick={() => setI(k)} className={`block w-full rounded-lg border-l-2 p-4 pl-5 text-left transition-all duration-500 ${i === k ? "border-primary-foreground bg-primary-foreground/10" : "border-primary-foreground/30 opacity-70 hover:opacity-100"}`}>
          <h3 className="text-xl">{q}</h3>
          <p className={`overflow-hidden opacity-85 transition-all duration-500 ${i === k ? "mt-1 max-h-24" : "max-h-0"}`}>→ {a}</p>
        </button>
      ))}
    </div>
  );
}
const STEP_ICONS = [UserPlus, UtensilsCrossed, Palette, QrCode, Smartphone, BarChart3];
function Steps({ steps }: { steps: string[][] }) {
  const [ref, on] = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {steps.map(([t, d], i) => {
        const I = STEP_ICONS[i];
        return (
          <div key={t} style={{ transitionDelay: `${i * 90}ms` }} className={`group rounded-xl border bg-card p-6 transition-all duration-700 hover:-translate-y-1 hover:shadow-lg ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <div className="flex items-center justify-between"><p className="font-mono text-sm text-primary">0{i + 1}</p><I className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" /></div>
            <h3 className="mt-3 text-xl">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        );
      })}
    </div>
  );
}
const FEAT_ICONS = [Layers, ToggleRight, ShieldCheck, Leaf, Languages, ImageIcon];
const DISHES = [
  { n: "Bacalhau à Brás", p: "14,50", a: ["Peixe", "Ovos", "Fish", "Eggs"], d: [] as string[] },
  { n: "Risotto de cogumelos", p: "12,00", a: ["Leite", "Milk"], d: ["Vegetariano", "Sem glúten", "Vegetarian", "Gluten-free"] },
  { n: "Francesinha", p: "11,50", a: ["Glúten", "Leite", "Ovos", "Mostarda", "Gluten", "Milk", "Eggs", "Mustard"], d: ["Picante", "Spicy"] },
  { n: "Salada de grão", p: "9,00", a: ["Sésamo", "Sesame"], d: ["Vegan", "Vegetariano", "Sem lactose", "Vegetarian", "Lactose-free"] },
  { n: "Arroz de marisco", p: "19,00", a: ["Crustáceos", "Moluscos", "Crustaceans", "Molluscs"], d: ["Sem glúten", "Gluten-free"] },
];
function AllergenDemo({ tags, diet }: { tags: string[]; diet: string[] }) {
  const [ex, setEx] = useState<string[]>([]); const [dt, setDt] = useState<string | null>(null);
  const list = DISHES.filter((x) => !x.a.some((a) => ex.includes(a)) && (!dt || x.d.includes(dt)));
  return (
    <div className="h-full rounded-xl border bg-background p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" />Filtro de alergénios e dietas <span className="ml-auto text-xs font-normal text-muted-foreground">experimente</span></div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {tags.slice(0, 9).map((t) => { const on = ex.includes(t); return <button key={t} onClick={() => setEx(on ? ex.filter((x) => x !== t) : [...ex, t])} className={`rounded-full border px-2.5 py-0.5 text-xs transition-all active:scale-95 ${on ? "border-destructive bg-destructive/10 text-destructive line-through" : "bg-secondary text-secondary-foreground hover:border-primary"}`}>{t}</button>; })}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {diet.slice(0, 5).map((t) => <button key={t} onClick={() => setDt(dt === t ? null : t)} className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all active:scale-95 ${dt === t ? "bg-primary text-primary-foreground" : "border hover:border-primary"}`}>{t}</button>)}
      </div>
      <ul className="mt-4 space-y-1.5">
        {list.map((x) => <li key={x.n} className="flex justify-between rounded-md border bg-card px-3 py-2 text-sm motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-left-2"><span>{x.n}</span><span className="text-muted-foreground">{x.p} €</span></li>)}
        {!list.length && <li className="py-3 text-center text-sm text-muted-foreground">Nenhum prato corresponde.</li>}
      </ul>
    </div>
  );
}
function AvailabilityDemo({ dishes }: { dishes: string[] }) {
  const [off, setOff] = useState(dishes.map((d) => d.startsWith("!")));
  return (
    <div className="h-full rounded-xl border bg-background p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><ToggleRight className="h-4 w-4 text-primary" />Disponibilidade em tempo real</div>
      <ul className="mt-3 space-y-2">
        {dishes.map((d, i) => (
          <li key={d} className="flex items-center justify-between gap-3 text-sm">
            <span className={`transition-all ${off[i] ? "text-muted-foreground line-through" : ""}`}>{d.replace("!", "")}</span>
            <button role="switch" aria-checked={!off[i]} onClick={() => setOff(off.map((x, j) => (j === i ? !x : x)))} className={`relative h-5 w-9 rounded-full transition-colors ${off[i] ? "bg-muted" : "bg-primary"}`}>
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-background shadow transition-all ${off[i] ? "left-0.5" : "left-[18px]"}`} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Zap className="h-3 w-3 text-primary" />O menu público atualiza de imediato.</p>
    </div>
  );
}
function LangDemo() {
  const [en, setEn] = useState(false);
  return (
    <div className="h-full rounded-xl border bg-background p-5">
      <div className="flex items-center gap-2 text-sm font-semibold"><Languages className="h-4 w-4 text-primary" />PT / EN
        <div className="ml-auto inline-flex rounded-full border p-0.5 text-xs">{["PT", "EN"].map((l, i) => <button key={l} onClick={() => setEn(!!i)} className={`rounded-full px-2.5 py-0.5 transition-colors ${en === !!i ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>)}</div>
      </div>
      <div key={String(en)} className="mt-4 rounded-md border bg-card p-3 motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95">
        <p className="font-medium">{en ? "Octopus lagareiro style" : "Polvo à lagareiro"}</p>
        <p className="mt-1 text-xs text-muted-foreground">{en ? "Roasted octopus, punched potatoes, garlic and olive oil." : "Polvo assado, batata a murro, alho e azeite."}</p>
        <p className="mt-2 text-sm">18,50 €</p>
      </div>
    </div>
  );
}
function MenusDemo({ cats }: { cats: string[] }) {
  const menus = ["Almoço", "Jantar", "Bebidas"]; const [m, setM] = useState(0); const [order, setOrder] = useState(cats);
  return (
    <div className="h-full rounded-xl border bg-background p-5">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold"><Layers className="h-4 w-4 text-primary" />Vários menus
        <div className="ml-auto inline-flex rounded-full border p-0.5 text-xs font-normal">{menus.map((x, i) => <button key={x} onClick={() => setM(i)} className={`rounded-full px-3 py-0.5 transition-colors ${m === i ? "bg-primary text-primary-foreground" : ""}`}>{x}</button>)}</div>
      </div>
      <ul className="mt-4 space-y-2">
        {order.map((c, i) => (
          <li key={c} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm transition-all">
            <span className="font-mono text-xs text-muted-foreground">{i + 1}</span>{c} <span className="text-xs text-muted-foreground">· {menus[m]}</span>
            <span className="ml-auto flex gap-1">
              <button aria-label="Subir" disabled={!i} onClick={() => { const n = [...order]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; setOrder(n); }} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronUp className="h-4 w-4" /></button>
              <button aria-label="Descer" disabled={i === order.length - 1} onClick={() => { const n = [...order]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; setOrder(n); }} className="rounded p-1 hover:bg-muted disabled:opacity-30"><ChevronDown className="h-4 w-4" /></button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
function ViewsChart() {
  const data = { d: [12, 18, 15, 22, 30, 41, 38], s: [80, 95, 110, 102, 130, 160, 175], m: [320, 410, 380, 460, 520, 610, 700] };
  const [k, setK] = useState<"d" | "s" | "m">("s"); const [ref, on] = useInView<HTMLDivElement>();
  const v = data[k]; const max = Math.max(...v);
  return (
    <div ref={ref} className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 text-sm font-semibold"><BarChart3 className="h-4 w-4 text-primary" />Visualizações do menu <span className="text-xs font-normal text-muted-foreground">(exemplo)</span>
        <div className="ml-auto inline-flex rounded-full border p-0.5 text-xs font-normal">{([["d", "Dia"], ["s", "Semana"], ["m", "Mês"]] as const).map(([x, l]) => <button key={x} onClick={() => setK(x)} className={`rounded-full px-3 py-0.5 transition-colors ${k === x ? "bg-primary text-primary-foreground" : ""}`}>{l}</button>)}</div>
      </div>
      <div className="mt-6 flex h-40 items-end gap-2">
        {v.map((n, i) => (
          <div key={i} className="group relative flex-1">
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs opacity-0 transition-opacity group-hover:opacity-100">{n}</span>
            <div className="rounded-t-md bg-primary/80 transition-all duration-700 ease-out group-hover:bg-primary" style={{ height: on ? `${(n / max) * 150}px` : "0px", transitionDelay: `${i * 50}ms` }} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="text-muted-foreground">Mais vistos:</span>{["Bacalhau à Brás", "Francesinha", "Pastel de nata"].map((x, i) => <span key={x} className="rounded-full bg-secondary px-2.5 py-0.5">{i + 1}. {x}</span>)}<span className="ml-auto flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />4,8</span></div>
    </div>
  );
}

/* ---------- Menu Intelligence ---------- */
const INTEL = {
  pt: {
    ey: "Menu Intelligence", t: "O seu menu, lido como um mapa.",
    d: "Cruzamos a popularidade de cada prato com a sua margem e mostramos onde está o dinheiro: os pratos estrela, os populares que ganham pouco, as oportunidades escondidas e os que pedem atenção.",
    x: "Popularidade →", y: "Margem →",
    quads: ["Estrelas", "Populares", "Oportunidades", "A rever"],
    quadD: ["Muita procura, boa margem. Proteja-os.", "Muito pedidos, margem baixa. Reveja preço ou custo.", "Boa margem, pouca procura. Dê-lhes destaque.", "Pouca procura, pouca margem. Reformule ou retire."],
    views: "visualizações", margin: "margem", hint: "toque num quadrante ou num prato",
    all: "Todos",
  },
  en: {
    ey: "Menu Intelligence", t: "Your menu, read like a map.",
    d: "We cross each dish's popularity with its margin and show you where the money is: star dishes, popular low-earners, hidden opportunities and the ones that need attention.",
    x: "Popularity →", y: "Margin →",
    quads: ["Stars", "Popular", "Opportunities", "Review"],
    quadD: ["High demand, good margin. Protect them.", "Very popular, low margin. Review price or cost.", "Good margin, low demand. Give them the spotlight.", "Low demand, low margin. Rework or remove."],
    views: "views", margin: "margin", hint: "tap a quadrant or a dish",
    all: "All",
  },
};
const INTEL_DISHES = [
  { n: "Bacalhau à Brás", x: 82, y: 74, views: 412, margin: "8,10 €", q: 0, tip: { pt: "Estrela absoluta. Mantenha-o no topo do menu e bem fotografado.", en: "Absolute star. Keep it at the top of the menu, well photographed." } },
  { n: "Arroz de marisco", x: 66, y: 62, views: 298, margin: "9,40 €", q: 0, tip: { pt: "Estrela em crescimento. Um destaque visual pode levá-lo mais longe.", en: "Rising star. A visual highlight can take it further." } },
  { n: "Francesinha", x: 88, y: 28, views: 455, margin: "3,20 €", q: 1, tip: { pt: "Muito pedida, mas ganha pouco. Reveja o preço ou o custo da receita.", en: "Very popular but earns little. Review the price or recipe cost." } },
  { n: "Risotto de cogumelos", x: 30, y: 78, views: 96, margin: "7,60 €", q: 2, tip: { pt: "Margem excelente, pouca procura. Uma fotografia e um destaque podem mudar tudo.", en: "Excellent margin, low demand. A photo and a highlight can change everything." } },
  { n: "Salada de grão", x: 20, y: 24, views: 54, margin: "2,10 €", q: 3, tip: { pt: "Pouca procura e pouca margem. Considere reformular ou dar lugar a outro prato.", en: "Low demand and low margin. Consider reworking it or making room for another dish." } },
];
const QUAD_TONES = ["bg-primary", "bg-chart-3", "bg-chart-2", "bg-muted-foreground"];
function IntelSection() {
  const { lang } = useI18n();
  const t = INTEL[lang] ?? INTEL.pt;
  const [quad, setQuad] = useState<number | null>(null);
  const [sel, setSel] = useState(0);
  const [ref, on] = useInView<HTMLDivElement>();
  const dish = INTEL_DISHES[sel];
  const dim = (q: number) => quad !== null && quad !== q;
  return (
    <section className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <Eyebrow>{t.ey}</Eyebrow>
        <h2 className="mt-3 max-w-2xl text-4xl">{t.t}</h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">{t.d}</p>
      </Reveal>
      <div ref={ref} className="mt-10 grid gap-6 lg:grid-cols-2">
        {/* matrix */}
        <Reveal>
          <div className="rounded-xl border bg-card p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><Brain className="h-4 w-4 text-primary" />{t.ey} <span className="ml-auto text-xs font-normal text-muted-foreground">{t.hint}</span></div>
            <div className="relative mt-4 aspect-square w-full overflow-hidden rounded-lg border bg-background">
              <div aria-hidden className="absolute left-1/2 top-0 h-full w-px border-l border-dashed border-muted-foreground/30" />
              <div aria-hidden className="absolute left-0 top-1/2 w-full border-t border-dashed border-muted-foreground/30" />
              {t.quads.map((q, i) => (
                <button key={q} onClick={() => setQuad(quad === i ? null : i)}
                  className={`absolute z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-300 ${quad === i ? "bg-primary text-primary-foreground shadow-lg" : "bg-muted/80 text-muted-foreground hover:bg-muted"} ${i === 0 ? "right-2 top-2" : i === 1 ? "bottom-2 right-2" : i === 2 ? "left-2 top-2" : "bottom-2 left-2"}`}>{q}</button>
              ))}
              {INTEL_DISHES.map((dd, i) => (
                <button key={dd.n} aria-label={dd.n} onClick={() => { setSel(i); setQuad(null); }}
                  className={`absolute z-20 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-background shadow-md transition-all duration-500 ${QUAD_TONES[dd.q]} ${sel === i ? "h-5 w-5 ring-4 ring-primary/30" : "h-3.5 w-3.5 hover:scale-125"} ${dim(dd.q) ? "opacity-15" : "opacity-100"}`}
                  style={{ left: `${dd.x}%`, bottom: `${dd.y}%`, transitionDelay: on ? `${i * 60}ms` : "0ms", scale: on ? undefined : "0" }} />
              ))}
              <span className="pointer-events-none absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground">{t.x}</span>
              <span className="pointer-events-none absolute left-1 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] text-muted-foreground">{t.y}</span>
            </div>
          </div>
        </Reveal>
        {/* detail */}
        <Reveal className="delay-100">
          <div className="flex h-full flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {t.quads.map((q, i) => (
                <button key={q} onClick={() => setQuad(quad === i ? null : i)}
                  className={`rounded-lg border p-3 text-left transition-all duration-300 hover:-translate-y-0.5 ${quad === i ? "border-primary bg-primary/5 shadow-md" : "bg-card"}`}>
                  <span className={`block h-1.5 w-6 rounded-full ${QUAD_TONES[i]}`} />
                  <p className="mt-2 text-xs font-semibold">{q}</p>
                  <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{t.quadD[i]}</p>
                </button>
              ))}
            </div>
            <ul className="space-y-1.5">
              {INTEL_DISHES.map((dd, i) => (
                <li key={dd.n}>
                  <button onClick={() => setSel(i)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-all duration-300 ${sel === i ? "border-primary bg-primary/5" : "bg-card hover:border-primary/40"} ${dim(dd.q) ? "opacity-40" : ""}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${QUAD_TONES[dd.q]}`} />
                    <span className="font-medium">{dd.n}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{dd.views} {t.views}</span>
                  </button>
                </li>
              ))}
            </ul>
            <div key={sel} className="rounded-xl border bg-card p-5 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground ${QUAD_TONES[dish.q]}`}>{t.quads[dish.q]}</span>
                <p className="font-semibold">{dish.n}</p>
              </div>
              <div className="mt-3 flex gap-6 text-sm">
                <span><span className="font-display text-2xl text-primary">{dish.views}</span> <span className="text-xs text-muted-foreground">{t.views}</span></span>
                <span><span className="font-display text-2xl text-primary">{dish.margin}</span> <span className="text-xs text-muted-foreground">{t.margin}</span></span>
              </div>
              <p className="mt-3 flex gap-2 text-sm text-muted-foreground"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{dish.tip[lang] ?? dish.tip.pt}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
