import { homeRoute } from "@/lib/home-route";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LangSwitch, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useServerFn } from "@tanstack/react-start";
import { usernameSchema, usernameEmail } from "@/lib/account-rules";
import { signInWithUsername } from "@/utils/account.functions";

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
  const [username, setUsername] = useState("");
  const usernameLogin = useServerFn(signInWithUsername);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => setMode(search.mode ?? "login"), [search.mode]);
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => { if (data.user) navigate({ to: await homeRoute() }); });
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "login") {
        if (email.includes("@")) {
          const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
          if (error) throw new Error(t("auth.credentials"));
        } else {
          const parsed = usernameSchema.safeParse(email);
          if (!parsed.success) throw new Error(t("auth.credentials"));
          const result = await usernameLogin({ data: { username: parsed.data, password } });
          if (!result.session) throw new Error(t("auth.credentials"));
          const { error } = await supabase.auth.setSession(result.session);
          if (error) throw error;
        }
        navigate({ to: await homeRoute() });
      } else if (mode === "signup") {
        const parsed = usernameSchema.safeParse(username);
        if (!parsed.success) throw new Error(t("auth.usernameInvalid"));
        const { data: available, error: availabilityError } = await supabase.rpc("username_available", { _username: parsed.data });
        if (availabilityError) throw availabilityError;
        if (!available) throw new Error(t("auth.usernameTaken"));
        const { data, error } = await supabase.auth.signUp({ email: usernameEmail(parsed.data), password, options: { emailRedirectTo: window.location.origin, data: { username: parsed.data } } });
        if (error) {
          const { data: stillAvailable } = await supabase.rpc("username_available", { _username: parsed.data });
          throw new Error(stillAvailable === false || error.code === "user_already_exists" ? t("auth.usernameTaken") : error.message);
        }
        if (data.session) navigate({ to: await homeRoute() });
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
    else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) navigate({ to: await homeRoute() });
    }
  }

  const title = mode === "signup" ? t("auth.signup") : mode === "forgot" ? t("auth.forgot") : "Login";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-muted to-secondary px-4 py-10">
      <div className="mb-4 flex w-full max-w-sm justify-end"><LangSwitch /></div>
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl">
        <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
        <div className="px-7 pb-6 pt-6">
          <Link to="/" aria-label="MenuTap" className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
          </Link>
          <h1 className="mt-4 text-center text-2xl font-bold">{title}</h1>
          {info ? (
            <p className="mt-6 rounded-md bg-accent p-4 text-sm text-accent-foreground">{info}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" ? <>
                <div><Label htmlFor="n" className="sr-only">{t("auth.username")}</Label><Input id="n" placeholder={t("auth.username")} className="h-11 bg-muted/50" autoComplete="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]{3,30}" value={username} onChange={(e) => setUsername(e.target.value)} required /><p className="mt-2 text-xs text-muted-foreground">{t("auth.usernameHint")}</p></div>
                <p className="text-xs text-muted-foreground">{t("auth.noEmailWarning")}</p>
              </> : <div><Label htmlFor="e" className="sr-only">{mode === "forgot" ? t("auth.email") : t("auth.identifier")}</Label><Input id="e" placeholder={mode === "forgot" ? t("auth.email") : t("auth.identifier")} className="h-11 bg-muted/50" type={mode === "forgot" ? "email" : "text"} autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>}
              {mode !== "forgot" && (
                <div className="relative">
                  <Label htmlFor="p" className="sr-only">{t("auth.password")}</Label>
                  <Input id="p" placeholder={t("auth.password")} className="h-11 bg-muted/50 pr-10" type={showPw ? "text" : "password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={t("auth.password")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              )}
              {mode === "login" && (
                <div className="flex justify-end"><button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setMode("forgot")}>{t("auth.forgot")}</button></div>
              )}
              <Button type="submit" className="h-11 w-full bg-gradient-to-r from-primary to-primary/80 font-semibold uppercase tracking-wide shadow-lg" disabled={busy}>{mode === "signup" ? t("auth.signup") : mode === "forgot" ? t("auth.sendReset") : t("auth.login")}</Button>
            </form>
          )}
          {!info && mode !== "forgot" && (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase text-muted-foreground"><span className="h-px flex-1 bg-border" />{t("auth.or")}<span className="h-px flex-1 bg-border" /></div>
              <button type="button" onClick={google} className="flex h-11 w-full items-center justify-center gap-[10px] rounded-md border border-[#747775] bg-[#FFFFFF] px-3 text-sm font-medium text-[#1F1F1F]">
                <GoogleIcon /> {t("auth.google")}
              </button>
            </>
          )}
          <div className="mt-5 text-center text-sm">
            {mode === "login"
              ? <p className="text-muted-foreground">{t("auth.noAccount")} <button className="font-semibold text-primary" onClick={() => { setInfo(null); setMode("signup"); }}>{t("auth.signup")}</button></p>
              : <button className="font-semibold text-primary" onClick={() => { setInfo(null); setMode("login"); }}>{t("auth.back")}</button>}
          </div>
          <div className="mt-5 flex justify-center gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link><span>•</span>
            <Link to="/terms" className="hover:text-foreground">{t("footer.terms")}</Link><span>•</span>
            <Link to="/contact" className="hover:text-foreground">{t("nav.contact")}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
