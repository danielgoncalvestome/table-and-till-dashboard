import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageIntro, SitePage } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";

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
  const [msg, setMsg] = useState("");
  const href = `mailto:ola@menutap.pt?subject=${encodeURIComponent("MenuTap — " + name)}&body=${encodeURIComponent(msg)}`;
  return (
    <SitePage>
      <PageIntro eyebrow={t("nav.contact")} title={t("contact.title")} sub={t("contact.sub")} />
      <div className="mx-auto w-full max-w-xl px-5">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = href; }}>
          <div><Label>{t("auth.name")}</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
          <div><Label>{t("f.description")}</Label><Textarea rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} required /></div>
          <Button type="submit">{t("contact.send")}</Button>
        </form>
      </div>
    </SitePage>
  );
}
