import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/SiteLayout";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir palavra-passe — Crumb" },
      { name: "description", content: "Defina uma nova palavra-passe para a sua conta Crumb." },
      { property: "og:title", content: "Redefinir palavra-passe — Crumb" },
      { property: "og:description", content: "Defina uma nova palavra-passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(t("auth.updated"));
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Logo />
      <h1 className="mt-10 text-3xl">{t("auth.newPassword")}</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label htmlFor="p">{t("auth.password")}</Label><Input id="p" type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <Button className="w-full" disabled={busy}>{t("auth.save")}</Button>
      </form>
    </div>
  );
}
