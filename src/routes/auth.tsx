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
import { signInWithUsername } from "@/utils/username-auth.functions";

type AuthMode = "login" | "signup" | "forgot";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  validateSearch: (search: Record<string, unknown>): { mode?: AuthMode } => ({
    mode: search.mode === "signup" || search.mode === "forgot" ? (search.mode as AuthMode) : "login",
  }),
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function AuthPage() {
  const { t } = useI18n();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const usernameLogin = useServerFn(signInWithUsername);
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => setMode(search.mode ?? "login"), [search.mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setInfo(null);
    try {
      if (mode === "signup") {
        const u = username.trim().toLowerCase();
        const syntheticEmail = `${u}@users.menutap.pt`;
        const { error } = await supabase.auth.signUp({
          email: syntheticEmail,
          password,
          options: { data: { username: u } },
        });
        if (error) throw error;
        toast.success(t("auth.signedUp"));
        navigate({ to: "/dashboard" });
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth?mode=login`,
        });
        if (error) throw error;
        setInfo(t("auth.resetSent"));
      } else {
        const id = email.trim();
        if (!id.includes("@")) {
          const res = await usernameLogin({ data: { username: id, password } });
          if (!res.ok) {
            const msg = res.reason === "no_user" || res.reason === "bad_pass"
              ? t("auth.invalidCredentials")
              : (res.error ?? "Erro ao iniciar sessão");
            throw new Error(msg);
          }
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: res.session.access_token,
            refresh_token: res.session.refresh_token,
          });
          if (sessionError) throw sessionError;
          toast.success(t("auth.loggedIn"));
          navigate({ to: "/dashboard" });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: id,
          password,
        });
        if (error) throw error;
        toast.success(t("auth.loggedIn"));
        navigate({ to: "/dashboard" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Erro de autenticação");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (error) toast.error(error.message);
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
