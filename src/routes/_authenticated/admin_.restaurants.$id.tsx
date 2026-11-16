import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ExternalLink, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/lib/panel-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { TableLinks } from "@/components/admin/TableLinks";
import { QrBox } from "@/components/dash/QrBox";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/lib/i18n";
import { audit, useIsAdmin } from "@/lib/restaurant";
import { formatDate, slugify } from "@/lib/menu";
import { planByPrice } from "@/lib/billing-rules";
import { daysLeft } from "@/lib/admin-alerts-rules";
import { useServerFn } from "@tanstack/react-start";
import { adminAssignPlan } from "@/utils/payments.functions";
import { PLANS } from "@/lib/billing-rules";

export const Route = createFileRoute("/_authenticated/admin_/restaurants/$id")({
  head: () => ({ meta: [{ title: "Restaurante — Administração MenuTap" }, { name: "description", content: "Ficha completa do restaurante." }, { property: "og:title", content: "Restaurante — Administração MenuTap" }, { property: "og:description", content: "Ficha completa do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminRestaurant,
});

type R = Database["public"]["Tables"]["restaurants"]["Row"];
const STATUSES: R["status"][] = ["draft", "demo", "trial", "active", "grace", "read_only", "cancelled"];

function AdminRestaurant() {
  const { id } = Route.useParams();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const en = !!isAdmin;
  const { data: r, refetch } = useQuery({ queryKey: ["admin-r", id], enabled: en, queryFn: async () => (await supabase.from("restaurants").select("*").eq("id", id).maybeSingle()).data });
  const owner = r?.created_by ?? null;
  const { data: subs } = useQuery({ queryKey: ["admin-r-subs", owner], enabled: en && !!owner, queryFn: async () => (await supabase.from("account_subscriptions").select("*").eq("user_id", owner!).order("created_at", { ascending: false })).data ?? [] });
  const assignFn = useServerFn(adminAssignPlan);
  const qcPlan = useQueryClient();
  const manual = subs?.find((s) => !s.paddle_subscription_id && !s.stripe_subscription_id && s.environment === "live" && s.status === "active");
  async function assign(priceId: string | null) {
    if (!owner) return;
    try { await assignFn({ data: { userId: owner, priceId } }); toast.success(priceId ? "Plano atribuído" : "Plano removido"); qcPlan.invalidateQueries({ queryKey: ["admin-r-subs", owner] }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
  }
  const { data: info } = useQuery({ queryKey: ["admin-owner", owner], enabled: en && !!owner, queryFn: async () => (await supabase.rpc("admin_owner_info", { _user_id: owner! })).data?.[0] ?? null });
  const { data: counts } = useQuery({ queryKey: ["admin-r-counts", id], enabled: en, queryFn: async () => {
    const c = (tb: "dishes" | "restaurant_members") => supabase.from(tb).select("id", { count: "exact", head: true }).eq("restaurant_id", id).then((x) => x.count ?? 0);
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [dishes, members, views] = await Promise.all([c("dishes"), c("restaurant_members"), supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("restaurant_id", id).eq("event_type", "menu_view").gte("created_at", since).then((x) => x.count ?? 0)]);
    return { dishes, members, views };
  } });
  const { data: logs } = useQuery({ queryKey: ["admin-r-logs", id], enabled: en, queryFn: async () => (await supabase.from("audit_logs").select("*").eq("restaurant_id", id).order("created_at", { ascending: false }).limit(10)).data ?? [] });

  const [f, setF] = useState<Partial<R>>({});
  const [trialEnd, setTrialEnd] = useState("");
  useEffect(() => { if (r) { setF(r); setTrialEnd(r.trial_ends_at ? r.trial_ends_at.slice(0, 10) : ""); } }, [r]);

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center">403</div>;
  if (!r) return <div className="p-10 text-center text-muted-foreground">…</div>;

  const set = (k: keyof R, v: unknown) => setF((p) => ({ ...p, [k]: v }));
  async function save() {
    const { name, slug, description, address, phone, email, website, instagram_url, google_reviews_url, opening_hours, primary_color, background_color, accent_color, font, template, status, published, default_lang, languages } = f as R;
    const { error } = await supabase.from("restaurants").update({ name, slug: slugify(slug), description, address, phone, email, website, instagram_url, google_reviews_url, opening_hours, primary_color, background_color, accent_color, font, template, status, published, default_lang, languages }).eq("id", id);
    if (error) return toast.error(error.code === "23505" ? "Endereço já usado" : error.message);
    await audit("admin.restaurant.update", id);
    toast.success("Guardado"); refetch(); qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }
  async function saveTrial(dateStr = trialEnd) {
    if (!dateStr) return;
    const { error } = await supabase.rpc("admin_set_trial_end", { _restaurant_id: id, _ends: new Date(`${dateStr}T23:59:59`).toISOString() });
    if (error) return toast.error(error.message);
    await audit("admin.trial.set", id, { ends: dateStr });
    toast.success("Período experimental atualizado"); refetch(); qc.invalidateQueries({ queryKey: ["admin-restaurants"] });
  }
  const extend = (d: number) => { const base = r.trial_ends_at && new Date(r.trial_ends_at) > new Date() ? new Date(r.trial_ends_at) : new Date(); base.setDate(base.getDate() + d); const s = base.toISOString().slice(0, 10); setTrialEnd(s); saveTrial(s); };
  async function remove() {
    if (prompt(`Escreva "${r!.slug}" para eliminar definitivamente`) !== r!.slug) return;
    const { error } = await supabase.from("restaurants").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await audit("admin.restaurant.delete", null, { id, name: r!.name });
    toast.success("Eliminado"); qc.invalidateQueries({ queryKey: ["admin-restaurants"] }); navigate({ to: "/admin" });
  }
  function manage() { localStorage.setItem("mt-current-restaurant", id); navigate({ to: "/dashboard" }); }

  const field = (k: keyof R, label: string, type = "text") => <div><Label>{label}</Label><Input type={type} value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value || null)} /></div>;
  const color = (k: keyof R, label: string) => <div><Label>{label}</Label><div className="flex gap-2"><input type="color" className="h-9 w-12 rounded border" value={(f[k] as string) ?? "#000000"} onChange={(e) => set(k, e.target.value)} /><Input value={(f[k] as string) ?? ""} onChange={(e) => set(k, e.target.value)} /></div></div>;
  const tl = daysLeft(r.trial_ends_at);

  const live = (subs ?? []).filter((s) => s.environment !== "sandbox");
  const activeSub = live.find((s) => s.status === "active") ?? live[0];
  const subStart = new Date(activeSub?.created_at ?? r.created_at).getTime();
  const subMonths = Math.max(0, Math.floor((Date.now() - subStart) / (30.44 * 864e5)));
  const subSince = subMonths < 1 ? "<1 mês" : subMonths < 12 ? `${subMonths} ${subMonths === 1 ? "mês" : "meses"}` : `${Math.floor(subMonths / 12)}a${subMonths % 12 ? ` ${subMonths % 12}m` : ""}`;
  const revenueCents = live.reduce((sum, s) => {
    const p = planByPrice(s.price_id);
    if (!p) return sum;
    const months = Math.max(1, Math.round((Date.now() - new Date(s.created_at).getTime()) / (30.44 * 864e5)));
    return sum + p.cents * months;
  }, 0);
  const revenue = `${(revenueCents / 100).toFixed(2).replace(".", ",")} €`;

  return (
    <div className="mx-auto max-w-6xl space-y-3 px-3 py-4 sm:px-6 md:py-6">
      <div className="flex items-center justify-between"><Link to="/admin" search={{ s: "restaurants" }} className="text-xs text-muted-foreground hover:text-foreground">← Administração</Link><ThemeToggle /></div>
      <header className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-[var(--shadow-card)]">
        {r.logo_url ? <img src={r.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl border object-contain" /> : <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-bold text-primary">{r.name.slice(0, 1).toUpperCase()}</span>}
        <div className="min-w-0 flex-1"><h1 className="truncate text-lg font-bold tracking-tight">{r.name}</h1><p className="truncate text-xs text-muted-foreground">/r/{r.slug} · {r.published ? "publicado" : "não publicado"}</p></div>
        <div className="flex shrink-0 gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" title="Ver menu" asChild><a href={`https://menutap.pt/r/${r.slug}`} target="_blank" rel="noreferrer"><ExternalLink /></a></Button>
          <Button size="icon" variant="outline" className="h-8 w-8" title="Gerir menus e pratos" onClick={manage}><LayoutDashboard /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" title="Eliminar" onClick={remove}><Trash2 /></Button>
        </div>
      </header>

      <div className="grid grid-cols-5 divide-x rounded-2xl border bg-card py-2 shadow-[var(--shadow-card)]">
        {[["Visitas 30d", counts?.views], ["Pratos", counts?.dishes], ["Membros", counts?.members], ["Subscrito há", subSince], ["Receita total", revenue]].map(([l, v]) => (
          <div key={l as string} className="min-w-0 px-1 text-center"><p className="text-base font-bold tabular-nums sm:text-lg">{v ?? "—"}</p><p className="truncate text-[10px] text-muted-foreground sm:text-xs">{l}</p></div>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Sec title="Cliente" defaultOpen>
          <dl className="space-y-1 text-xs sm:text-sm">
            <Row k="Utilizador" v={info?.username ?? "—"} />
            <Row k="Email" v={info?.email && !info.email.endsWith(".invalid") ? info.email : "—"} />
            <Row k="Conta criada" v={info?.created_at ? formatDate(info.created_at, lang) : "—"} />
            <Row k="Último acesso" v={info?.last_sign_in_at ? formatDate(info.last_sign_in_at, lang) : "—"} />
            <Row k="Restaurante criado" v={formatDate(r.created_at, lang)} />
          </dl>
        </Sec>
        <Sec title="Subscrição" hint={manual ? planByPrice(manual.price_id)?.name : subs?.length ? planByPrice(subs[0].price_id)?.name : r.trial_ends_at ? `Experimental · ${tl! >= 0 ? `${tl} d` : "terminado"}` : "Sem plano"} defaultOpen>
          {!!subs?.length && <ul className="mb-3 space-y-1.5 text-xs">
            {subs.map((s) => (
              <li key={s.id} className="rounded-lg border bg-background/50 px-2.5 py-1.5">
                <div className="flex justify-between gap-2"><strong className="truncate">{planByPrice(s.price_id)?.name ?? s.price_id}</strong><span className="shrink-0 text-muted-foreground">{s.status} · {s.environment === "sandbox" ? "teste" : "real"}</span></div>
                <p className="text-muted-foreground">{planByPrice(s.price_id) ? `${(planByPrice(s.price_id)!.cents / 100).toFixed(2).replace(".", ",")} €/mês · ` : ""}até {s.current_period_end ? formatDate(s.current_period_end, lang) : "—"}{s.cancel_at_period_end && " · cancela"}</p>
              </li>
            ))}
          </ul>}
          <p className="mb-1 text-xs font-semibold">Atribuir plano <span className="font-normal text-muted-foreground">· sem pagamento</span></p>
          <div className="flex flex-wrap gap-1.5">
            {PLANS.map((p) => <Button key={p.priceId} size="sm" className="h-7 px-2.5 text-xs" variant={manual?.price_id === p.priceId ? "default" : "outline"} disabled={!owner} onClick={() => assign(p.priceId)}>{p.name}</Button>)}
            {manual && <Button size="sm" className="h-7 px-2.5 text-xs" variant="ghost" onClick={() => assign(null)}>Remover</Button>}
          </div>
          <p className="mb-1 mt-3 text-xs font-semibold">Período experimental <span className="font-normal text-muted-foreground">· {r.trial_ends_at ? `até ${formatDate(r.trial_ends_at, lang)}` : "começa ao publicar"}</span></p>
          <div className="flex flex-wrap gap-1.5">
            <Input type="date" className="h-7 w-36 text-xs" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} />
            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => saveTrial()}>Definir</Button>
            {[7, 14, 30].map((d) => <Button key={d} size="sm" className="h-7 px-2 text-xs" variant="outline" onClick={() => extend(d)}>+{d}d</Button>)}
          </div>
        </Sec>
        <Sec title="QR code e link NFC"><QrBox slug={r.slug} color={r.primary_color} nfc /></Sec>
        <Sec title="Atividade" hint={`${logs?.length ?? 0}`}>
          {logs?.length ? <ul className="divide-y text-xs">{logs.map((l) => <li key={l.id} className="flex justify-between gap-2 py-1.5"><span className="truncate">{l.action}</span><span className="shrink-0 text-muted-foreground">{formatDate(l.created_at, lang)}</span></li>)}</ul> : <p className="text-xs text-muted-foreground">Sem atividade.</p>}
        </Sec>
      </div>

      <Sec title="Mesas e links"><TableLinks restaurantId={id} slug={r.slug} /></Sec>

      <Sec title="Editar restaurante" icon={Pencil}>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {field("name", "Nome")}{field("slug", "Endereço (/r/…)")}
          <div><Label>Estado</Label><select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={f.status ?? "draft"} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
          {field("address", "Morada")}{field("phone", "Telefone", "tel")}{field("email", "Email do restaurante", "email")}
          {field("website", "Website", "url")}{field("instagram_url", "Instagram", "url")}{field("google_reviews_url", "Avaliações Google", "url")}
          {field("opening_hours", "Horário")}{field("font", "Tipo de letra")}{field("template", "Modelo")}
          {color("primary_color", "Cor principal")}{color("background_color", "Cor de fundo")}{color("accent_color", "Cor de destaque")}
          <div><Label>Idioma predefinido</Label><select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={f.default_lang ?? "pt"} onChange={(e) => set("default_lang", e.target.value)}><option value="pt">PT</option><option value="en">EN</option></select></div>
          <label className="flex items-center gap-2 text-sm"><Switch checked={(f.languages ?? []).includes("en")} onCheckedChange={(v) => set("languages", v ? ["pt", "en"] : ["pt"])} />Inglês ativo</label>
          <label className="flex items-center gap-2 text-sm"><Switch checked={!!f.published} onCheckedChange={(v) => set("published", v)} />Publicado</label>
        </div>
        <div className="mt-3"><Label>Descrição</Label><Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
        <Button className="mt-3 w-full sm:w-auto" onClick={save}>Guardar alterações</Button>
      </Sec>
    </div>
  );
}

function Sec({ title, hint, icon: Icon, defaultOpen = false, children }: { title: string; hint?: string; icon?: typeof Pencil; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return <section className="min-w-0 rounded-2xl border bg-card shadow-[var(--shadow-card)]">
    <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2 px-3 py-2.5 text-left">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <span className="text-sm font-semibold">{title}</span>
      {hint && <span className="min-w-0 truncate text-xs text-muted-foreground">· {hint}</span>}
      <ChevronDown className={`ml-auto h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div className="border-t px-3 py-3">{children}</div>}
  </section>;
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="truncate text-right">{v}</dd></div>;
}
