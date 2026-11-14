import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Menu as MenuIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangSwitch, useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

import logoDark from "@/assets/menutap-logo.png.asset.json";
import logoLight from "@/assets/menutap-logo-light.png.asset.json";

export function Logo({
  className = "",
  variant = "dark",
  height = "h-12",
}: {
  className?: string;
  variant?: "dark" | "light";
  height?: string;
}) {
  return (
    <Link to="/" aria-label="MenuTap" className={`inline-flex items-center ${className}`}>
      <img
        src={variant === "light" ? logoLight.url : logoDark.url}
        alt="MenuTap"
        className={`${height} w-auto max-w-none`}
      />
    </Link>
  );
}

function useSignedIn() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  return signedIn;
}

export function SiteHeader() {
  const { t } = useI18n();
  const signedIn = useSignedIn();
  const [open, setOpen] = useState(false);
  const links = [
    { to: "/features", label: t("nav.features") },
    { to: "/gestao-de-mesas", label: t("nav.tables") },
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/faq", label: t("nav.faq") },
    { to: "/contact", label: t("nav.contact") },
  ] as const;
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground font-medium" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <LangSwitch />
          {signedIn ? (
            <Button asChild size="sm"><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
          ) : (
            <>
              <Link to="/auth" className="text-sm font-medium">{t("nav.login")}</Link>
              <Button asChild size="sm"><Link to="/auth" search={{ mode: "signup" }}>{t("cta.trial")}</Link></Button>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <MenuIcon />}</button>
      </div>
      {open && (
        <div className="border-t px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>)}
            <LangSwitch />
            <Button asChild><Link to={signedIn ? "/dashboard" : "/auth"}>{signedIn ? t("nav.dashboard") : t("nav.login")}</Link></Button>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="mt-24 border-t bg-primary text-primary-foreground">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo variant="light" height="h-14" />
          <p className="mt-2 text-sm opacity-75">{t("hero.tagline")}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm opacity-90">
          <Link to="/features">{t("nav.features")}</Link>
          <Link to="/pricing">{t("nav.pricing")}</Link>
          <Link to="/faq">{t("nav.faq")}</Link>
        </div>
        <div className="flex flex-col gap-2 text-sm opacity-90">
          <Link to="/contact">{t("nav.contact")}</Link>
          <Link to="/privacy">{t("footer.privacy")}</Link>
          <Link to="/terms">{t("footer.terms")}</Link>
          <Link to="/refund">{t("footer.refund")}</Link>
          <a href="mailto:danielgoncalvestome+menutap@gmail.com">{"\n"}</a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-5 pb-8 text-xs opacity-60">© {new Date().getFullYear()} MenuTap. {t("footer.rights")}</div>
    </footer>
  );
}

export function SitePage({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageIntro({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-10 pt-16 md:pt-24">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="mt-3 max-w-3xl text-4xl leading-tight md:text-6xl">{title}</h1>
      {sub && <p className="mt-5 max-w-2xl text-lg text-muted-foreground">{sub}</p>}
    </section>
  );
}
