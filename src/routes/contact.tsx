import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  Mail, Clock, MessageSquareText, User, AtSign, Send, CheckCircle2,
  ChevronDown, Lightbulb, ArrowRight, QrCode, CalendarDays, ChefHat, CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { submitContact } from "@/utils/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto — Crumb" },
      { name: "description", content: "Fale com a equipa Crumb. Apoio por email em dias úteis." },
      { property: "og:title", content: "Contacto — Crumb" },
      { property: "og:description", content: "Fale com a equipa Crumb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

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

const STR = {
  pt: {
    emailT: "Email", emailD: "Escreva-nos para qualquer questão — respondemos a todos.",
    timeT: "Tempo de resposta", timeD: "Dias úteis, normalmente em menos de 24 horas.",
    faqT: "Em desenvolvimento", faqD: "Aceitamos sugestões e necessidades específicas - conte-nos o que lhe faz falta.",
    topicsT: "Sobre o que quer falar?",
    topics: ["Menu digital e QR", "Reservas e sala", "Pedidos", "Planos e pagamento", "Outro assunto"],
    namePh: "O seu nome", emailPh: "email@exemplo.com", msgPh: "Conte-nos como podemos ajudar…",
    quickT: "Respostas rápidas", quickD: "As dúvidas mais comuns, respondidas já.",
    quick: [
      ["Preciso de reimprimir o QR quando altero o menu?", "Não. O QR code e a etiqueta NFC apontam para um link permanente; todas as alterações aparecem no mesmo endereço."],
      ["Como funcionam os 10 dias grátis?", "O período experimental começa quando publica o menu. Não pedimos cartão e nunca cobramos sem a sua autorização expressa."],
      ["Posso convidar a minha equipa?", "Sim. Em Definições → Equipa convide membros e escolha o que cada um pode fazer. A faturação fica só com o dono."],
      ["Posso cancelar quando quiser?", "Sim, a qualquer momento. Os seus dados e menus são preservados."],
    ] as [string, string][],
    allFaq: "Ver todas as perguntas",
  },
  en: {
    emailT: "Email", emailD: "Write to us about anything — we answer every message.",
    timeT: "Response time", timeD: "Business days, usually within 24 hours.",
    faqT: "We're in development", faqD: "We welcome suggestions and specific needs from your restaurant — tell us what you're missing.",
    topicsT: "What do you want to talk about?",
    topics: ["Digital menu & QR", "Bookings & room", "Orders", "Plans & billing", "Something else"],
    namePh: "Your name", emailPh: "email@example.com", msgPh: "Tell us how we can help…",
    quickT: "Quick answers", quickD: "The most common questions, answered right away.",
    quick: [
      ["Do I need to reprint the QR when I change the menu?", "No. The QR code and NFC tag point to a permanent link; every change appears at the same address."],
      ["How do the 10 free days work?", "The trial starts when you publish your menu. No card required and we never charge without your explicit authorisation."],
      ["Can I invite my team?", "Yes. In Settings → Team invite members and choose what each can do. Billing stays with the owner."],
      ["Can I cancel anytime?", "Yes, anytime. Your data and menus are preserved."],
    ] as [string, string][],
    allFaq: "See all questions",
  },
};

const TOPIC_ICONS = [QrCode, CalendarDays, ChefHat, CreditCard, MessageSquareText];

function QuickFaq({ items }: { items: [string, string][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        return (
          <div key={q} className={`overflow-hidden rounded-xl border bg-card transition-shadow ${isOpen ? "shadow-md" : "hover:shadow-sm"}`}>
            <button type="button" onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left">
              <span className="text-sm font-medium">{q}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
              <div className="overflow-hidden"><p className="px-4 pb-3 text-sm text-muted-foreground">{a}</p></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Contact() {
  const { t, lang } = useI18n();
  const s = STR[lang as keyof typeof STR] ?? STR.pt;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [topic, setTopic] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const prefix = topic !== null ? `[${s.topics[topic]}] ` : "";
      const r = await submitContact({ data: { name, email, message: prefix + msg } });
      if (!r.ok) throw new Error();
      setDone(true);
    } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }

  const cards = [
    { icon: Mail, title: s.emailT, desc: s.emailD },
    { icon: Clock, title: s.timeT, desc: s.timeD },
    { icon: Lightbulb, title: s.faqT, desc: s.faqD },
  ];

  return (
    <SitePage>
      <div className="mx-auto w-full max-w-4xl space-y-8 px-5 pt-10">
        <h1 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("nav.contact")}</h1>
        {/* Info cards */}
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((c, i) => {
            const inner = (
              <div className="dash-card flex h-full items-start gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><c.icon className="h-5 w-5" /></span>
                <span>
                  <span className="block text-sm font-semibold">{c.title}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{c.desc}</span>
                </span>
              </div>
            );
            return (
              <Reveal key={c.title} delay={i * 100}>
                {inner}
              </Reveal>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Form */}
          <Reveal>
            {done ? (
              <div className="dash-card flex flex-col items-center gap-3 rounded-2xl border bg-card p-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary"><CheckCircle2 className="h-7 w-7" /></span>
                <p className="font-medium">{t("contact.thanks")}</p>
              </div>
            ) : (
              <form className="dash-card space-y-4 rounded-2xl border bg-card p-5 sm:p-6" onSubmit={onSubmit}>
                <div>
                  <p className="mb-2 text-sm font-medium">{s.topicsT}</p>
                  <div className="flex flex-wrap gap-2">
                    {s.topics.map((tp, i) => {
                      const Icon = TOPIC_ICONS[i];
                      const active = topic === i;
                      return (
                        <button key={tp} type="button" onClick={() => setTopic(active ? null : i)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 ${active ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                          <Icon className="h-3.5 w-3.5" />{tp}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder={s.namePh} value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
                </div>
                <div className="relative">
                  <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" type="email" placeholder={s.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
                <Textarea rows={6} placeholder={s.msgPh} value={msg} onChange={(e) => setMsg(e.target.value)} required maxLength={5000} />
                <Button type="submit" disabled={busy} className="w-full gap-2 sm:w-auto">
                  <Send className="h-4 w-4" />{t("contact.send")}
                </Button>
              </form>
            )}
          </Reveal>

          {/* Quick FAQ */}
          <Reveal delay={120}>
            <div>
              <h2 className="mb-4 text-lg font-semibold">{s.quickT}</h2>
              <QuickFaq items={s.quick} />
              <Link to="/faq" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                {s.allFaq}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </SitePage>
  );
}
