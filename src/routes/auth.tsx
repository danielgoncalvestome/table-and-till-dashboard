import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/site/SiteLayout";
import { LangSwitch, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

type Mode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode } => ({
    mode: s.mode === "signup" || s.mode === "forgot" ? s.mode : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar — MenuTap" },
      { name: "description", content: "Entre ou crie a sua conta MenuTap." },
      { property: "og:title", content: "Entrar — MenuTap" },
      { property: "og:description", content: "Aceda ao painel do seu restaurante." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function GoogleIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.930-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
  );
}

function AuthPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => setMode(search.mode ?? "login"), [search.mode]);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard" }); });
    const { data } = supabase.auth.onAuthStateChange((e, s) => { if (e === "SIGNED_IN" && s) navigate({ to: "/dashboard" }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + "/dashboard", data: { display_name: name } } });
        if (error) throw error;
        if (data.session) navigate({ to: "/dashboard" });
        else setInfo(t("auth.checkEmail"));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        setInfo(t("auth.resetSent"));
      }
    } catch (err) {
      toast.error((err as Error).message || t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (r.error) toast.error(t("common.error"));
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="hidden bg-primary md:block">
        <img src="/images/demo/cover.jpg" alt="" className="h-full w-full object-cover opacity-80" />
      </div>
      <div className="flex flex-col px-6 py-8">
        <div className="flex items-center justify-between"><Logo /><LangSwitch /></div>
        <div className="mx-auto my-auto w-full max-w-sm py-12">
          <h1 className="text-4xl">{mode === "signup" ? t("auth.signup") : mode === "forgot" ? t("auth.forgot") : t("auth.login")}</h1>
          {info ? (
            <p className="mt-6 rounded bg-accent p-4 text-sm text-accent-foreground">{info}</p>
          ) : (
            <>
              {mode !== "forgot" && (
                <>
                  <button type="button" onClick={google} className="mt-8 flex h-10 w-full items-center justify-center gap-[10px] rounded-md border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]">
                    <GoogleIcon /> {t("auth.google")}
                  </button>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>
                </>
              )}
              <form onSubmit={submit} className="space-y-4">
                {mode === "signup" && <div><Label htmlFor="n">{t("auth.name")}</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} required /></div>}
                <div><Label htmlFor="e">{t("auth.email")}</Label><Input id="e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                {mode !== "forgot" && <div><Label htmlFor="p">{t("auth.password")}</Label><Input id="p" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>}
                <Button type="submit" className="w-full" disabled={busy}>{mode === "signup" ? t("auth.signup") : mode === "forgot" ? t("auth.sendReset") : t("auth.login")}</Button>
              </form>
            </>
          )}
          <div className="mt-6 space-y-2 text-sm">
            {mode === "login" && (
              <>
                <button className="text-muted-foreground underline" onClick={() => setMode("forgot")}>{t("auth.forgot")}</button>
                <p>{t("auth.noAccount")} <button className="font-semibold text-primary" onClick={() => { setInfo(null); setMode("signup"); }}>{t("auth.signup")}</button></p>
              </>
            )}
            {mode !== "login" && <button className="font-semibold text-primary" onClick={() => { setInfo(null); setMode("login"); }}>{t("auth.back")}</button>}
          </div>
          <p className="mt-10 text-xs text-muted-foreground"><Link to="/terms">{t("footer.terms")}</Link> · <Link to="/privacy">{t("footer.privacy")}</Link></p>
        </div>
      </div>
    </div>
  );
}
