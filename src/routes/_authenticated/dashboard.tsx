import { IconDashboard, IconReservas, IconSalas, IconPedidos, IconMenus, IconDesign, IconAnalise, IconIntelligence, IconDefinicoes } from "@/components/dash/DockIcons";
import { AlertDot, useAdminAlerts } from "@/hooks/use-admin-alerts";
import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType } from "react";
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
import { SystemControls } from "@/components/dash/SystemControls";
import { DashboardCustomizationProvider } from "@/components/dash/DashboardCustomization";
import { DockConfigurator, DockQuickActions } from "@/components/dash/DockQuickActions";

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
    queryFn: async () => currentId ? (await supabase.from("restaurants").select("*").eq("id", currentId).maybeSingle()).data : null,
  });
  const list = extra ? [...(mine ?? []), { role: "owner" as const, ...extra }] : mine;

  useEffect(() => {
    const saved = localStorage.getItem("mt-current-restaurant");
    if (saved) setCurrentId(saved);
  }, []);

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">{t("common.loading")}</div>;
  if (!list || list.length === 0) return <Onboarding />;
  const current = list.find((r) => r.id === currentId) ?? list[0];
  if (!current) return <Onboarding />;

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

  const imgOf: Record<string, ComponentType<{ className?: string }>> = { "/dashboard": IconDashboard, "/dashboard/reservations": IconReservas, "/dashboard/room": IconSalas, "/dashboard/orders": IconPedidos, "/dashboard/menus": IconMenus, "/dashboard/design": IconDesign, "/dashboard/analytics": IconAnalise, "/dashboard/intelligence": IconIntelligence, "/dashboard/manage": IconDefinicoes };
  const DockImg = ({ to, className }: { to: string; className?: string }) => { const C = imgOf[to]; return C ? <C className={className} /> : null; };
  const settingsItem = { to: "/dashboard/manage", label: t("dash.settings") } as const;
  const dockItems = [{ to: topItem.to, label: topItem.label }, ...nav.map((n) => ({ to: n.to, label: n.label })), settingsItem];
  const isActive = (to: string) => to === "/dashboard" ? path === to || path === to + "/" : path === to || path.startsWith(to + "/");
  const rowCls = "flex w-full items-center gap-2.5 rounded-md px-2.5 py-[5px] text-[13px] text-sidebar-foreground/85 transition-colors hover:bg-foreground/[0.06]";
  const activeCls = "!bg-foreground/[0.09] font-medium text-foreground";

  const sidebar = (isMobile: boolean) => (
    <aside className="panel-sidebar panel-sidebar-frost flex h-full flex-col">
      {list.length > 1 && (
        <div className="relative mx-3 mt-4">
          <select aria-label="Restaurante" className="w-full cursor-pointer appearance-none truncate rounded-md bg-transparent py-1 pl-2 pr-6 text-[13px] font-semibold hover:bg-foreground/[0.06]" value={current.id} onChange={(e) => { localStorage.setItem("mt-current-restaurant", e.target.value); setCurrentId(e.target.value); }}>
            {list.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
          <ChevronsUpDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-5">
        <Link to={topItem.to} onClick={() => setMobileNav(false)} activeOptions={{ exact: true }} className={rowCls} activeProps={{ className: activeCls }}>
          <DockImg to={topItem.to} className="h-5 w-5 shrink-0" /><span className="truncate">{topItem.label}</span>
        </Link>
        {groups.map((g) => (
          <div key={g} className="mt-4">
            <p className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground/80">{g}</p>
            {nav.filter((n) => n.group === g).map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setMobileNav(false)} className={rowCls} activeProps={{ className: activeCls }}>
                <DockImg to={n.to} className="h-5 w-5 shrink-0" /><span className="truncate">{n.label}</span>
              </Link>
            ))}
          </div>
        ))}
        <div className="mt-4">
          <p className="px-2.5 pb-1 text-[11px] font-semibold text-muted-foreground/80">Conta</p>
          <Link to="/dashboard/manage" search={{ s: undefined, checkout: undefined }} onClick={() => setMobileNav(false)} className={rowCls} activeProps={{ className: activeCls }}>
            <IconDefinicoes className="h-5 w-5 shrink-0" /><span className="truncate">{t("dash.settings")}</span>
          </Link>
          {isAdmin && <Link to="/admin" className={rowCls}><Shield className="h-5 w-5 shrink-0 p-0.5 text-muted-foreground" /><span className="truncate">{t("dash.admin")}</span><AdminBadge /></Link>}
        </div>
      </nav>
      <div className="space-y-0.5 px-3 pb-4 pt-2">
        <SystemControls variant="list" onSignOut={signOut} dockActive={mini} onCollapse={() => { if (isMobile) setMobileNav(false); toggleCollapsed(); }} />
      </div>
    </aside>
  );

  const dock = (
    <div className="dock-wrap group/dock fixed inset-x-0 bottom-3 z-40 flex justify-center pointer-events-none">
      <div className="relative pointer-events-auto">
        <div className="dock-mini absolute -top-10 right-1 flex items-center gap-0.5 rounded-full px-1.5 py-1 opacity-0 transition-opacity duration-200 group-hover/dock:opacity-100 focus-within:opacity-100">
          <SystemControls variant="mini" onSignOut={signOut} onCollapse={toggleCollapsed} />
        </div>
        <nav aria-label="Navegação" className="dock-bar flex max-w-[calc(100vw-1.5rem)] items-end gap-1.5 overflow-x-auto overflow-y-visible rounded-[22px] px-2 pb-1.5 pt-2 md:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {dockItems.map((d) => (
            <button key={d.to} type="button" onClick={() => navigate({ to: d.to as "/dashboard" })} title={d.label} aria-label={d.label} className="dock-item relative flex flex-col items-center">
              <DockImg to={d.to} className="h-12 w-12" />
              <span className={`mt-0.5 h-1 w-1 rounded-full ${isActive(d.to) ? "bg-foreground/70" : "bg-transparent"}`} />
            </button>
          ))}
          <span className="mx-1 mb-3 h-10 w-px shrink-0 bg-foreground/15" />
          <DockQuickActions />
          <DockConfigurator />
          {isAdmin && <><span className="mx-1 mb-3 h-10 w-px shrink-0 bg-foreground/15" /><Link to="/admin" title={t("dash.admin")} aria-label={t("dash.admin")} className="dock-item mb-1.5 grid h-12 w-12 place-items-center rounded-xl bg-card"><Shield className="h-6 w-6 text-muted-foreground" /></Link></>}
        </nav>
      </div>
    </div>
  );

  const iconBtn = "grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground";
  const overview = path === "/dashboard" || path === "/dashboard/";
  return (
    <RestaurantProvider restaurant={current}>
      <DashboardCustomizationProvider>
        <div className="workspace-shell flex min-h-screen bg-background">
          {!mini && <div className="sticky top-0 hidden h-dvh w-[236px] shrink-0 border-r border-sidebar-border md:block">{sidebar(false)}</div>}
          {mini && dock}
          {mobileNav && <div className="fixed inset-0 z-50 flex md:hidden"><div className="w-72 max-w-[85vw] border-r border-sidebar-border shadow-xl">{sidebar(true)}</div><Button variant="ghost" className="!h-full flex-1 !rounded-none !bg-foreground/20" aria-label="Fechar menu" onClick={() => setMobileNav(false)} /></div>}
          <div className="min-w-0 flex-1">
            <header className="panel-menubar sticky top-0 z-40 flex items-center justify-between gap-2 border-b px-2 sm:px-3">
              <div className="flex min-w-0 items-center gap-1.5">
                <Button variant="ghost" size="icon" className={`${iconBtn} !h-7 !w-7 md:hidden`} onClick={() => setMobileNav(true)} aria-label="Menu"><MenuIcon className="h-4 w-4" /></Button>
                <Link to="/dashboard" className="px-1.5 text-[13px] font-bold">Crumb</Link>
                <span className="truncate px-1.5 text-xs font-medium">{active?.label ?? current.name}</span>
                <span className="hidden truncate px-2 text-xs text-muted-foreground lg:inline">{current.name}</span>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <span className={`mr-1 hidden items-center gap-1 text-[11px] sm:inline-flex ${current.published ? "text-st-free" : "text-muted-foreground"}`}><span className={`h-1.5 w-1.5 rounded-full ${current.published ? "bg-st-free" : "bg-muted-foreground"}`} />{current.published ? t("dash.published") : t("dash.unpublished")}</span>
                <SystemControls variant="bar" onSignOut={signOut} />
                <Button asChild variant="ghost" size="icon" className="!h-7 !w-7" title={t("dash.settings")} aria-label={t("dash.settings")}><Link to="/dashboard/manage" search={{ s: undefined, checkout: undefined }}><Settings className="h-3.5 w-3.5" /></Link></Button>
              </div>
            </header>
            <main className={overview ? "overview-main" : `workspace-content mx-auto max-w-7xl px-4 py-6 sm:px-8 sm:py-8 lg:px-10 ${mini ? "pb-28 md:pb-32" : ""}`}>{blocked ? <p className="py-20 text-center text-muted-foreground">Não tem permissão para aceder a esta página. Peça ao proprietário do restaurante.</p> : <Outlet />}</main>
          </div>
        </div>
        <AnnouncementPopup />
      </DashboardCustomizationProvider>
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
    if (!u.user) { setBusy(false); return toast.error(t("common.error")); }
    const { data, error } = await supabase.from("restaurants").insert({ ...f, created_by: u.user.id, languages: en ? ["pt", "en"] : ["pt"] }).select().single();
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
