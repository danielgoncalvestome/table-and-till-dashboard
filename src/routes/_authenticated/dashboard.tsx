import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  LayoutDashboard, BookOpen, Sparkles, BarChart3, Palette, QrCode, Users, CreditCard, Settings, LifeBuoy, ExternalLink, LogOut, Shield, Menu as MenuIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Logo } from "@/components/site/SiteLayout";
import { LangSwitch, useI18n } from "@/lib/i18n";
import { RestaurantProvider, audit, useIsAdmin, useMyRestaurants } from "@/lib/restaurant";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — MenuTap" }, { name: "description", content: "Gira os restaurantes da sua conta MenuTap." }, { property: "og:title", content: "Painel — MenuTap" }, { property: "og:description", content: "Gira os restaurantes da sua conta MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { t } = useI18n();
  const { data: list, isLoading } = useMyRestaurants();
  const { data: isAdmin } = useIsAdmin();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    const saved = localStorage.getItem("mt-current-restaurant");
    if (saved) setCurrentId(saved);
  }, []);

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">{t("common.loading")}</div>;
  if (!list || list.length === 0) return <Onboarding />;
  const current = list.find((r) => r.id === currentId) ?? list[0];

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("dash.overview"), exact: true },
    { to: "/dashboard/menus", icon: BookOpen, label: t("dash.menus") },
    { to: "/dashboard/recommendations", icon: Sparkles, label: t("dash.recs") },
    { to: "/dashboard/analytics", icon: BarChart3, label: t("dash.analytics") },
    { to: "/dashboard/design", icon: Palette, label: t("dash.design") },
    { to: "/dashboard/qr", icon: QrCode, label: t("dash.qr") },
    { to: "/dashboard/team", icon: Users, label: t("dash.team") },
    { to: "/dashboard/subscription", icon: CreditCard, label: t("dash.sub") },
    { to: "/dashboard/settings", icon: Settings, label: t("dash.settings") },
    { to: "/dashboard/help", icon: LifeBuoy, label: t("dash.help") },
  ] as const;

  const sidebar = (
    <aside className="flex h-full flex-col gap-1 bg-sidebar p-4">
      <div className="mb-4 px-2"><Logo /></div>
      {list.length > 1 && (
        <select className="mb-3 rounded border bg-card px-2 py-1.5 text-sm" value={current.id} onChange={(e) => { localStorage.setItem("mt-current-restaurant", e.target.value); setCurrentId(e.target.value); }}>
          {list.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      )}
      {nav.map((n) => (
        <Link key={n.to} to={n.to} onClick={() => setMobileNav(false)} activeOptions={{ exact: "exact" in n }} className="flex items-center gap-3 rounded px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent" activeProps={{ className: "bg-sidebar-accent font-semibold text-sidebar-accent-foreground" }}>
          <n.icon className="h-4 w-4" />{n.label}
        </Link>
      ))}
      {isAdmin && (
        <Link to="/admin" className="mt-2 flex items-center gap-3 rounded px-3 py-2 text-sm hover:bg-sidebar-accent"><Shield className="h-4 w-4" />{t("dash.admin")}</Link>
      )}
      <div className="mt-auto space-y-3 border-t pt-4">
        <LangSwitch className="px-3" />
        <button onClick={signOut} className="flex items-center gap-3 px-3 text-sm text-muted-foreground hover:text-foreground"><LogOut className="h-4 w-4" />{t("common.signout")}</button>
      </div>
    </aside>
  );

  return (
    <RestaurantProvider restaurant={current}>
      <div className="flex min-h-screen">
        <div className="sticky top-0 hidden h-screen w-60 shrink-0 border-r md:block">{sidebar}</div>
        {mobileNav && <div className="fixed inset-0 z-50 flex md:hidden"><div className="w-64 border-r">{sidebar}</div><button className="flex-1 bg-foreground/30" aria-label="Close" onClick={() => setMobileNav(false)} /></div>}
        <div className="min-w-0 flex-1">
          <header className="flex h-14 items-center justify-between border-b bg-card px-5">
            <div className="flex items-center gap-3">
              <button className="md:hidden" onClick={() => setMobileNav(true)} aria-label="Menu"><MenuIcon className="h-5 w-5" /></button>
              <span className="font-display text-lg">{current.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${current.published ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{current.published ? t("dash.published") : t("dash.unpublished")}</span>
            </div>
            <Button asChild variant="outline" size="sm"><a href={`/r/${current.slug}`} target="_blank" rel="noreferrer">{t("dash.viewMenu")} <ExternalLink /></a></Button>
          </header>
          <main className="mx-auto max-w-6xl p-5 md:p-8"><Outlet /></main>
        </div>
      </div>
    </RestaurantProvider>
  );
}

function Onboarding() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", slug: "", description: "", address: "", phone: "", email: "", website: "", instagram_url: "", google_reviews_url: "", opening_hours: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [en, setEn] = useState(true);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v, ...(k === "name" && !slugTouched ? { slug: slugify(v) } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("restaurants").insert({ ...f, created_by: u.user!.id, languages: en ? ["pt", "en"] : ["pt"] }).select().single();
    if (error) {
      setBusy(false);
      return toast.error(error.code === "23505" ? (t("f.slug") + " ✕") : error.message);
    }
    const { data: menu } = await supabase.from("menus").insert({ restaurant_id: data.id, name: "Menu", name_i18n: { en: "Menu" } }).select().single();
    if (menu) await supabase.from("categories").insert({ restaurant_id: data.id, menu_id: menu.id, name: "Entradas", name_i18n: { en: "Starters" } });
    await audit("restaurant.create", data.id);
    await qc.invalidateQueries({ queryKey: ["my-restaurants"] });
    setBusy(false);
  }

  const field = (k: keyof typeof f, label: string, type = "text") => (
    <div><Label>{label}</Label><Input type={type} value={f[k]} onChange={(e) => set(k, e.target.value)} /></div>
  );

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b px-6 py-4"><Logo /><LangSwitch /></div>
      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-5 px-6 py-12">
        <h1 className="text-4xl">{t("onb.title")}</h1>
        <p className="text-muted-foreground">{t("onb.sub")}</p>
        <div><Label>{t("f.name")} *</Label><Input required value={f.name} onChange={(e) => set("name", e.target.value)} /></div>
        <div>
          <Label>{t("f.slug")} *</Label>
          <div className="flex items-center rounded-md border bg-card pl-3 text-sm text-muted-foreground">menutap.pt/r/<input required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="h-9 flex-1 bg-transparent px-1 text-foreground outline-none" value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} /></div>
        </div>
        <div><Label>{t("f.description")}</Label><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="grid gap-4 md:grid-cols-2">
          {field("address", t("f.address"))}{field("phone", t("f.phone"), "tel")}
          {field("email", t("f.email"), "email")}{field("website", t("f.website"), "url")}
          {field("instagram_url", t("f.instagram"), "url")}{field("google_reviews_url", t("f.reviews"), "url")}
        </div>
        {field("opening_hours", t("f.hours"))}
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={en} onChange={(e) => setEn(e.target.checked)} /> {t("f.languages")}: PT + EN</label>
        <Button size="lg" disabled={busy}>{t("onb.create")}</Button>
      </form>
    </div>
  );
}
