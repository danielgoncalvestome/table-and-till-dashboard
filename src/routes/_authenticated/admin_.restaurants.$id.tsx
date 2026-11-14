import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ExternalLink, History, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin_/restaurants/$id")({
  head: () => ({ meta: [{ title: "Restaurante — Administração MenuTap" }, { name: "description", content: "Ficha completa do restaurante." }, { property: "og:title", content: "Restaurante — Administração MenuTap" }, { property: "og:description", content: "Ficha completa do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminRestaurant,
});

type R = Database["public"]["Tables"]["restaurants"]["Row"];
const STATUSES: R["status"][] = ["draft", "demo", "trial", "active", "grace", "read_only", "cancelled"];
const box = "rounded-2xl border bg-card p-6";

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
  const { data: info } = useQuery({ queryKey: ["admin-owner", owner], enabled: en && !!owner, queryFn: async () => (await supabase.rpc("admin_owner_info", { _user_id: owner! })).data?.[0] ?? null });
  const { data: counts } = useQuery({ queryKey: ["admin-r-counts", id], enabled: en, queryFn: async () => {
    const c = (tb: "menus" | "categories" | "dishes" | "restaurant_members") => supabase.from(tb).select("id", { count: "exact", head: true }).eq("restaurant_id", id).then((x) => x.count ?? 0);
    const since = new Date(Date.now() - 30 * 864e5).toISOString();
    const [menus, cats, dishes, members, views] = await Promise.all([c("menus"), c("categories"), c("dishes"), c("restaurant_members"), supabase.from("analytics_events").select("id", { count: "exact", head: true }).eq("restaurant_id", id).eq("event_type", "menu_view").gte("created_at", since).then((x) => x.count ?? 0)]);
    return { menus, cats, dishes, members, views };
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

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-5 md:p-8">
      <div className="flex items-center justify-between"><Link to="/admin" className="text-sm text-muted-foreground">← Administração</Link><ThemeToggle /></div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          {r.logo_url && <img src={r.logo_url} alt="" className="h-14 w-14 rounded-xl border object-contain" />}
          <div><p className="eyebrow">/r/{r.slug}</p><h1 className="mt-1 text-3xl md:text-4xl">{r.name}</h1></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild><a href={`/r/${r.slug}`} target="_blank" rel="noreferrer">Ver menu <ExternalLink /></a></Button>
          <Button variant="outline" onClick={manage}><LayoutDashboard />Gerir menus e pratos</Button>
          <Button variant="destructive" onClick={remove}><Trash2 />Eliminar</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {[["Visualizações 30d", counts?.views], ["Menus", counts?.menus], ["Categorias", counts?.cats], ["Pratos", counts?.dishes], ["Membros", counts?.members]].map(([l, v]) => (
          <div key={l as string} className={box}><p className="eyebrow">{l}</p><p className="mt-2 font-display text-3xl">{v ?? "—"}</p></div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className={box}>
          <h2 className="mb-4 font-sans text-sm font-semibold">Cliente</h2>
          <dl className="space-y-2 text-sm">
            <Row k="Utilizador" v={info?.username ?? "—"} />
            <Row k="Email da conta" v={info?.email && !info.email.endsWith(".invalid") ? info.email : "— (sem email)"} />
            <Row k="Conta criada" v={info?.created_at ? formatDate(info.created_at, lang) : "—"} />
            <Row k="Último acesso" v={info?.last_sign_in_at ? formatDate(info.last_sign_in_at, lang) : "—"} />
            <Row k="Restaurante criado" v={formatDate(r.created_at, lang)} />
          </dl>
        </section>
        <section className={box}>
          <h2 className="mb-4 font-sans text-sm font-semibold">Subscrição e faturação</h2>
          {subs?.length ? (
            <ul className="space-y-3 text-sm">
              {subs.map((s) => (
                <li key={s.id} className="rounded-lg border p-3">
                  <div className="flex justify-between"><strong>{planByPrice(s.price_id)?.name ?? s.price_id}</strong><span className="text-muted-foreground">{s.environment === "sandbox" ? "teste" : "real"}</span></div>
                  <p>Estado: <strong>{s.status}</strong>{s.cancel_at_period_end && " · cancela no fim do período"}</p>
                  <p className="text-muted-foreground">{planByPrice(s.price_id) ? `${(planByPrice(s.price_id)!.cents / 100).toFixed(2).replace(".", ",")} €/mês · ` : ""}Período até {s.current_period_end ? formatDate(s.current_period_end, lang) : "—"}</p>
                  {s.paddle_subscription_id && <p className="truncate font-mono text-[11px] text-muted-foreground">{s.paddle_subscription_id}</p>}
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted-foreground">Sem subscrição paga.</p>}
          <div className="mt-5 border-t pt-4">
            <p className="text-sm font-semibold">Período experimental</p>
            <p className="text-xs text-muted-foreground">{r.trial_ends_at ? `Termina a ${formatDate(r.trial_ends_at, lang)} (${tl! >= 0 ? `${tl} dias` : "terminado"})` : "Ainda não iniciado (começa ao publicar)"}</p>
            <div className="mt-2 flex gap-2"><Input type="date" value={trialEnd} onChange={(e) => setTrialEnd(e.target.value)} /><Button onClick={() => saveTrial()}>Definir</Button></div>
            <div className="mt-2 flex gap-2">{[7, 14, 30].map((d) => <Button key={d} size="sm" variant="outline" onClick={() => extend(d)}>+{d} dias</Button>)}</div>
          </div>
        </section>
        <section className={box}>
          <h2 className="mb-4 font-sans text-sm font-semibold">QR code e link NFC</h2>
          <QrBox slug={r.slug} color={r.primary_color} nfc />
        </section>
      </div>

      <TableLinks restaurantId={id} slug={r.slug} />

      <section className={box}>
        <div className="mb-5 flex items-center justify-between"><h2 className="font-sans text-sm font-semibold">Editar restaurante</h2><Button onClick={save}>Guardar alterações</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
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
        <div className="mt-4"><Label>Descrição</Label><Textarea value={f.description ?? ""} onChange={(e) => set("description", e.target.value)} /></div>
      </section>

      <section className={box}>
        <h2 className="mb-4 font-sans text-sm font-semibold">Atividade</h2>
        {logs?.length ? <ul className="divide-y text-sm">{logs.map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.action}</span><span className="text-muted-foreground">{formatDate(l.created_at, lang)}</span></li>)}</ul> : <p className="text-sm text-muted-foreground">Sem atividade.</p>}
      </section>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="truncate text-right">{v}</dd></div>;
}
