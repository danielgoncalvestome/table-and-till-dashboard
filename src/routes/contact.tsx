import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { submitContact } from "@/utils/contact.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contacto — MenuTap" },
      { name: "description", content: "Fale com a equipa MenuTap. Apoio por email em dias úteis." },
      { property: "og:title", content: "Contacto — MenuTap" },
      { property: "og:description", content: "Fale com a equipa MenuTap." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Contact,
});

function Contact() {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await submitContact({ data: { name, email, message: msg } });
      if (!r.ok) throw new Error();
      setDone(true);
    } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.contact")} title={t("contact.title")} sub={t("contact.sub")} />
      <div className="mx-auto w-full max-w-xl px-5">
        {done ? (
          <div className="rounded-lg border bg-secondary p-6 text-center font-medium">{t("contact.thanks")}</div>
        ) : (
          <form className="space-y-4" onSubmit={onSubmit}>
            <div><Label>{t("auth.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} /></div>
            <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} /></div>
            <div><Label>{t("contact.message")}</Label><Textarea rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} required maxLength={5000} /></div>
            <Button type="submit" disabled={busy}>{t("contact.send")}</Button>
          </form>
        )}
      </div>
    </SitePage>
  );
}
