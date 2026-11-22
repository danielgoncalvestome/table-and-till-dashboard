import { AlertDot, useAdminAlerts } from "@/hooks/use-admin-alerts";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BookOpen, BarChart3, Brain, ChefHat, Palette, Users, CreditCard, Settings, LifeBuoy, CalendarDays, CalendarPlus, ExternalLink, LogOut, Shield, Menu as MenuIcon,
  ClipboardList, UtensilsCrossed, LayoutGrid, ChevronsUpDown, PanelLeftClose, PanelLeftOpen, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AnnouncementPopup } from "@/components/announce/AnnouncementPopup";
import { Logo } from "@/components/site/SiteLayout";
import { LangSwitch, useI18n } from "@/lib/i18n";
import { RestaurantProvider, audit, useIsAdmin, useMyRestaurants } from "@/lib/restaurant";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/menu";
import { ThemeToggle } from "@/lib/panel-theme";
import { canAccess, type Permission } from "@/lib/team-rules";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel — Crumb" }, { name: "description", content: "Gira os restaurantes da sua conta Crumb." }, { property: "og:title", content: "Painel — Crumb" }, { property: "og:description", content: "Gira os restaurantes da sua conta Crumb." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const { t } = useI18n();
  const { data: mine, isLoading } = useMyRestaurants();
  const { data: isAdmin } = useIsAdmin();
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("mt-sidebar-mini") === "1"); }, []);
  const toggleCollapsed = () => setCollapsed((v) => { localStorage.setItem("mt-sidebar-mini", v ? "0" : "1"); return !v; });
  const navigate = useNavigate();
  const path = useLocation({ select: (l) => l.pathname });
  const qc = useQueryClient();

  const { data: extra } = useQuery({
    queryKey: ["admin-managed", currentId],
    enabled: !!isAdmin && !!currentId && !!mine && !mine.some((r) => r.id === currentId),
    queryFn: async () => (await supabase.from("restaurants").select("*").eq("id", currentId!).maybeSingle()).data,
  });
  const list = extra ? [...(mine ?? []), { role: "owner" as const, ...extra }] : mine;

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

  const allNav = [
    { group: "Operação", to: "/dashboard/reservations", icon: CalendarDays, label: t("dash.reservations"), perm: "reservations" },
    { group: "Operação", to: "/dashboard/room", icon: LayoutGrid, label: "Salas", perm: "reservations" },
    { group: "Operação", to: "/dashboard/orders", icon: ChefHat, label: t("dash.orders"), perm: "orders" },
    { group: "Menu", to: "/dashboard/menus", icon: BookOpen, label: t("dash.menus"), perm: "menus" },
    { group: "Menu", to: "/dashboard/design", icon: Palette, label: t("dash.design"), perm: "design" },
    { group: "Análise", to: "/dashboard/analytics", icon: BarChart3, label: t("dash.analytics"), perm: "analytics" },
    { group: "Análise", to: "/dashboard/intelligence", icon: Brain, label: "Menu Intelligence", perm: "analytics" },
  ] as const;
  const perms = (current as { permissions?: Record<string, boolean> }).permissions;
  const allowed = (perm?: string) => !perm || canAccess(current.role, perms, perm as Permission | "team" | "subscription");
  const nav = allNav.filter((n) => allowed("perm" in n ? n.perm : undefined));
  const groups = [...new Set(nav.map((n) => n.group))];
  const topItem = { to: "/dashboard", icon: Gauge, label: t("dash.overview"), exact: true } as const;
  const blocked = allNav.find((n) => "perm" in n && !allowed(n.perm) && (path === n.to || path.startsWith(n.to + "/")));
  const active = [...nav, topItem].reverse().find((n) => ("exact" in n ? path === n.to || path === n.to + "/" : path === n.to || path.startsWith(n.to + "/")));
  const mini = collapsed;

  const sidebar = (isMobile: boolean) => {
    const m = mini && !isMobile;
    const railBtn = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground";
    const topBtn = "grid h-10 w-full shrink-0 place-items-center rounded-xl border bg-card text-muted-foreground shadow-[var(--shadow-card)] transition hover:-translate-y-px hover:text-foreground";
    return (
    <aside className="panel-sidebar flex h-full flex-col bg-sidebar">
      <div className={`flex items-center gap-2 border-b border-sidebar-border p-3 ${m ? "flex-col gap-2 py-3" : ""}`}>
        <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">{current.logo_url ? <img src={current.logo_url} alt={current.name} className="h-full w-full object-contain" /> : <UtensilsCrossed className="h-4 w-4 text-primary" />}</span>
        {!m && (list.length > 1 ? (
          <div className="relative min-w-0 flex-1">
            <select aria-label="Restaurante" className="w-full cursor-pointer appearance-none truncate rounded-lg bg-transparent py-1.5 pl-1 pr-6 text-sm font-semibold hover:bg-sidebar-accent" value={current.id} onChange={(e) => { localStorage.setItem("mt-current-restaurant", e.target.value); setCurrentId(e.target.value); }}>
              {list.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronsUpDown className="pointer-events-none absolute right-1 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          </div>
        ) : <span className="min-w-0 flex-1 truncate text-sm font-semibold">{current.name}</span>)}
        {!isMobile && (
          <Button variant="ghost" size="icon" onClick={toggleCollapsed} title={m ? "Expandir menu" : "Recolher menu"} aria-label={m ? "Expandir menu" : "Recolher menu"} aria-expanded={!m} className={railBtn}>{m ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}</Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className={`mb-2 gap-2 ${m ? "flex flex-col items-center" : "grid grid-cols-4 px-1"}`}>
          <Link to="/dashboard/manage" search={{ s: undefined, checkout: undefined }} aria-label={t("dash.settings")} title={t("dash.settings")} className={topBtn}><Settings className="h-5 w-5" /></Link>
          <ThemeToggle className="!h-10 !w-full !rounded-xl text-muted-foreground [&_svg]:!h-5 [&_svg]:!w-5" />
          <a href={`https://menutap.pt/r/${current.slug}`} target="_blank" rel="noreferrer" aria-label={t("dash.viewMenu")} title={t("dash.viewMenu")} className={topBtn}><BookOpen className="h-5 w-5" /></a>
          <a href={`https://menutap.pt/r/${current.slug}/reservar`} target="_blank" rel="noreferrer" aria-label="Página de reservas" title="Página de reservas" className={topBtn}><CalendarPlus className="h-5 w-5" /></a>
        </div>
        <Link to={topItem.to} title={topItem.label} onClick={() => setMobileNav(false)} activeOptions={{ exact: true }} className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${m ? "mx-auto h-10 w-10 justify-center px-0" : ""}`} activeProps={{ className: "bg-card font-semibold text-foreground shadow-[var(--shadow-card)] ring-1 ring-border" }}>
          <topItem.icon className="h-4 w-4 shrink-0" />{!m && <span className="truncate">{topItem.label}</span>}
        </Link>
        <div className={`my-2 h-px bg-sidebar-border ${m ? "mx-auto w-6" : "mx-3"}`} />
        {groups.map((g, gi) => (
          <div key={g} className="mb-3">
            {m ? gi > 0 && <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" /> : <p className="px-3 pb-1 pt-1 text-[11px] font-semibold text-muted-foreground">{g}</p>}
            {nav.filter((n) => n.group === g).map((n) => (
              <Link key={n.to} to={n.to} title={n.label} onClick={() => setMobileNav(false)} activeOptions={{ exact: "exact" in n }} className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${m ? "mx-auto h-10 w-10 justify-center px-0" : ""}`} activeProps={{ className: "bg-card font-semibold text-foreground shadow-[var(--shadow-card)] ring-1 ring-border" }}>
                <n.icon className="h-4 w-4 shrink-0" />{!m && <span className="truncate">{n.label}</span>}
              </Link>
            ))}
          </div>
        ))}
        {isAdmin && (
          <div className="mb-3">
            {m ? <div className="mx-auto mb-2 h-px w-6 bg-sidebar-border" /> : <p className="px-3 pb-1 text-[11px] font-semibold text-muted-foreground">Plataforma</p>}
            <Link to="/admin" title={t("dash.admin")} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent ${m ? "mx-auto h-10 w-10 justify-center px-0" : ""}`}><Shield className="h-4 w-4 shrink-0" />{!m && <>{t("dash.admin")}<AdminBadge /></>}</Link>
          </div>
        )}
      </nav>
      <div className="space-y-2 border-t border-sidebar-border p-3">
        {!m && <LangSwitch className="px-2" />}
        <Button variant="ghost" onClick={signOut} title={t("common.signout")} className={`flex w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground ${m ? "mx-auto h-10 w-10 justify-center px-0" : ""}`}><LogOut className="h-4 w-4 shrink-0" />{!m && t("common.signout")}</Button>
        {!isMobile && <Button variant="ghost" onClick={toggleCollapsed} title={m ? "Expandir" : "Recolher"} className={`flex w-full justify-start gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground ${m ? "mx-auto h-10 w-10 justify-center px-0" : ""}`}>{m ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" />Recolher</>}</Button>}
      </div>
    </aside>
  );
  };

  const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-card text-foreground/80 shadow-[var(--shadow-card)] transition hover:-translate-y-px hover:text-foreground";
  return (
    <RestaurantProvider restaurant={current}>
      <div className="flex min-h-screen bg-background">
        <div className={`sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-200 md:block ${mini ? "w-[68px]" : "w-60"}`}>{sidebar(false)}</div>
        {mobileNav && <div className="fixed inset-0 z-50 flex md:hidden"><div className="w-64 border-r border-sidebar-border shadow-xl">{sidebar(true)}</div><button className="flex-1 bg-foreground/30 backdrop-blur-sm" aria-label="Close" onClick={() => setMobileNav(false)} /></div>}
        <div className="min-w-0 flex-1">
          <header className="panel-toolbar sticky top-0 z-40 grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b px-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Button variant="outline" size="icon" className={`${iconBtn} md:hidden`} onClick={() => setMobileNav(true)} aria-label="Menu"><MenuIcon className="h-4 w-4" /></Button>
              {active && <span className="hidden h-8 w-8 shrink-0 place-items-center rounded-lg border bg-card sm:grid"><active.icon className="h-4 w-4" /></span>}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold leading-tight">{active?.label ?? current.name}</p>
                <p className="truncate text-xs text-muted-foreground">{current.name}</p>
              </div>
              <span className={`ml-1 hidden shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:inline-flex ${current.published ? "border-st-free/30 bg-st-free/10 text-st-free" : "bg-muted text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${current.published ? "animate-pulse bg-st-free" : "bg-muted-foreground"}`} />{current.published ? t("dash.published") : t("dash.unpublished")}</span>
            </div>

          </header>
          <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8">{blocked ? <p className="py-20 text-center text-muted-foreground">Não tem permissão para aceder a esta página. Peça ao proprietário do restaurante.</p> : <Outlet />}</main>
        </div>
      </div>
      <AnnouncementPopup />
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
      <div className="flex items-center justify-between border-b px-6 py-4"><Logo /><div className="flex items-center gap-3"><LangSwitch /><ThemeToggle /></div></div>
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


function AdminBadge() {
  const { data } = useAdminAlerts(true);
  return <AlertDot n={(data?.messages ?? 0) + (data?.orders ?? 0)} />;
}
