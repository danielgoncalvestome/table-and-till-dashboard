import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Gift, Sparkles, UtensilsCrossed, CalendarCheck2, MonitorSmartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { usePlans } from "@/lib/use-plans";
import { formatPrice } from "@/lib/menu";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Preço — MenuTap" },
      { name: "description", content: "Um plano simples com tudo incluído. 10 dias grátis, sem cartão, cancele quando quiser." },
      { property: "og:title", content: "Preço — MenuTap" },
      { property: "og:description", content: "Um plano. Tudo incluído. 10 dias grátis." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pricing,
});

const STR = {
  pt: {
    recommended: "Mais completo",
    includes: "Tudo o que está incluído",
    includesSub: "Em qualquer plano, sem extras escondidos.",
    menuFeatures: ["Menu digital completo", "Menus, categorias e pratos ilimitados", "Tradução para inglês", "Alergénios e etiquetas alimentares", "Análise, estatística e Menu Intelligence", "Personalização completa do design"],
    resFeatures: ["Menu Digital", "Planta da sala editável", "Reservas online e cliente à porta", "Pedidos interativos, em tempo real", "Pedido feito a partir da mesa ou do menu digital", "4 dispositivos + 1 dispositivo por mesa"],
    faqTitle: "Perguntas frequentes",
    faq: [
      ["Quando começo a pagar?", "Só depois dos 10 dias grátis, contados a partir da publicação do seu menu. Não pedimos cartão para experimentar."],
      ["Posso mudar de plano?", "Sim, a qualquer momento. Pode passar do Menu Digital para Gestão e Reservas (ou o contrário) sempre que quiser."],
      ["Posso cancelar quando quiser?", "Sim. Não há fidelização: cancela quando quiser e mantém o acesso até ao fim do período pago."],
    ] as [string, string][],
    start: "Começar agora",
  },
  en: {
    recommended: "Most complete",
    includes: "Everything that's included",
    includesSub: "In every plan, no hidden extras.",
    menuFeatures: ["Full digital menu", "Unlimited menus, categories and dishes", "English translation", "Allergens and dietary labels", "Analytics and Menu Intelligence", "Full design customisation"],
    resFeatures: ["Everything in the Digital Menu plan", "Drag-and-drop floor plan editor", "Online bookings and walk-ins", "Live card-based orders", "Ordering from the table", "1 compatible device per table"],
    faqTitle: "Frequently asked questions",
    faq: [
      ["When do I start paying?", "Only after the 10 free days, counted from when your menu is published. We don't ask for a card to try."],
      ["Can I change plan?", "Yes, at any time. You can switch between Digital Menu and Bookings whenever you like."],
      ["Can I cancel anytime?", "Yes. There's no lock-in: cancel whenever you want and keep access until the end of the paid period."],
    ] as [string, string][],
    start: "Get started",
  },
};

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null); const [on, setOn] = useState(false);
  useEffect(() => { const el = ref.current; if (!el) return; const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); o.disconnect(); } }, { threshold: 0.15 }); o.observe(el); return () => o.disconnect(); }, []);
  return [ref, on] as const;
}
function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const [ref, on] = useInView<HTMLDivElement>();
  return <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`transition-all duration-700 motion-reduce:transition-none ${on ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"} ${className}`}>{children}</div>;
}

function Pricing() {
  const { t, lang } = useI18n();
  const PLANS = usePlans();
  const s = STR[lang as keyof typeof STR] ?? STR.pt;
  const features = [s.menuFeatures, s.resFeatures];
  const icons = [UtensilsCrossed, CalendarCheck2];
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.pricing")} title={t("pricing.title")} />
      <section className="mx-auto max-w-5xl px-5 pb-16">

        {/* plan cards */}
        <div className="grid gap-5 sm:grid-cols-2">
          {PLANS.map((p, i) => {
            const Icon = icons[i] ?? UtensilsCrossed;
            const hot = p.reservations;
            return (
              <Reveal key={p.priceId} delay={i * 120}>
                <div className={`group relative flex h-full flex-col rounded-2xl border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${hot ? "ring-2 ring-primary" : ""}`}>
                  {hot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow">
                      <Sparkles className="mr-1 inline h-3 w-3" />{s.recommended}
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${hot ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="font-semibold leading-tight">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{t(p.reservations ? "plans.withRes" : "plans.menuOnly")}</p>
                    </div>
                  </div>
                  <p className="mt-5 font-display text-5xl text-primary">{formatPrice(p.cents / 100, lang)}<span className="text-base text-muted-foreground">{t("pricing.per")}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("pricing.vat")}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><MonitorSmartphone className="h-3.5 w-3.5" />{p.devices === "per_table" ? t("plans.perTable") : t("plans.devices").replace("{n}", String(p.devices))}</p>
                  <ul className="mt-5 flex-1 space-y-2.5 border-t pt-5">
                    {features[i].map((f, j) => (
                      <li key={f} className="tl-in flex items-start gap-2.5 text-sm" style={{ animationDelay: `${j * 60}ms` }}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" variant={hot ? "default" : "outline"} className="mt-6 w-full transition-transform duration-300 group-hover:scale-[1.02]">
                    <Link to="/auth" search={{ mode: "signup" }}>{s.start}</Link>
                  </Button>
                </div>
              </Reveal>
            );
          })}
        </div>

        {/* trial banner */}
        <Reveal delay={100}>
          <div className="relative mt-8 overflow-hidden rounded-2xl border bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
            <span className="tl-ping absolute right-8 top-8 h-3 w-3 rounded-full bg-primary-foreground" />
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <span className="tl-float grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/15"><Gift className="h-6 w-6" /></span>
              <div className="flex-1">
                <p className="font-semibold">{t("pricing.trial")}</p>
                <p className="mt-1 text-sm opacity-80">{t("plans.free")}</p>
              </div>
              <Button asChild size="lg" variant="secondary" className="shrink-0"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
            </div>
          </div>
        </Reveal>

        {/* everything included */}
        <Reveal className="mt-14">
          <h2 className="text-center font-display text-2xl">{s.includes}</h2>
          <p className="mt-1 text-center text-sm text-muted-foreground">{s.includesSub}</p>
        </Reveal>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {t("pricing.items").split("|").map((item, i) => (
            <Reveal key={item} delay={i * 60}>
              <div className="flex items-center gap-3 rounded-xl border bg-card p-4 text-sm shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Check className="h-4 w-4" /></span>
                {item}
              </div>
            </Reveal>
          ))}
        </div>

        {/* FAQ */}
        <Reveal className="mt-14">
          <h2 className="text-center font-display text-2xl">{s.faqTitle}</h2>
        </Reveal>
        <div className="mx-auto mt-6 max-w-3xl space-y-3">
          {s.faq.map(([q, a], i) => <Faq key={q} q={q} a={a} delay={i * 80} />)}
        </div>
      </section>
    </SitePage>
  );
}

function Faq({ q, a, delay }: { q: string; a: string; delay: number }) {
  const [open, setOpen] = useState(false);
  return (
    <Reveal delay={delay}>
      <button onClick={() => setOpen(!open)} className={`w-full rounded-xl border bg-card p-4 text-left shadow-sm transition-all duration-300 hover:border-primary/40 ${open ? "border-primary/40 shadow-md" : ""}`}>
        <span className="flex items-center justify-between gap-3 text-sm font-medium">
          {q}
          <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`} />
        </span>
        <span className={`grid transition-all duration-300 ${open ? "mt-2 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
          <span className="overflow-hidden text-sm text-muted-foreground">{a}</span>
        </span>
      </button>
    </Reveal>
  );
}
