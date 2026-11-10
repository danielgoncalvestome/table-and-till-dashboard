import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin } from "@/lib/restaurant";
import { formatDate, formatPrice, uploadImage } from "@/lib/menu";

const SHOP_FOLDER = "00000000-0000-0000-0000-000000000000";
const empty = { id: "", name: "", description: "", price: "", image_url: "", active: true, position: 0 };

export const Route = createFileRoute("/_authenticated/admin_/products")({
  head: () => ({ meta: [{ title: "Produtos — Administração MenuTap" }, { name: "description", content: "Gerir os cartões e produtos vendidos aos restaurantes." }, { property: "og:title", content: "Produtos — Administração MenuTap" }, { property: "og:description", content: "Gerir os produtos MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Products,
});

function Products() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [f, setF] = useState(empty);
  const [busy, setBusy] = useState(false);
  const { data: products } = useQuery({ queryKey: ["admin-shop-products"], enabled: !!isAdmin, queryFn: async () => (await supabase.from("shop_products").select("*").order("position").order("created_at")).data ?? [] });
  const { data: orders } = useQuery({ queryKey: ["admin-shop-orders"], enabled: !!isAdmin, queryFn: async () => (await supabase.from("shop_orders").select("*, restaurant:restaurants(name)").neq("status", "pending").order("created_at", { ascending: false }).limit(100)).data ?? [] });

  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p><Link to="/dashboard" className="text-primary underline">{t("nav.dashboard")}</Link></div>;

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-shop-products"] });
  async function onFile(file?: File) {
    if (!file) return;
    try { setBusy(true); const url = await uploadImage(SHOP_FOLDER, file); setF((p) => ({ ...p, image_url: url })); } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price_cents = Math.round(Number(f.price.replace(",", ".")) * 100);
    if (!f.name.trim() || !Number.isFinite(price_cents) || price_cents < 50) return toast.error(t("common.error"));
    const row = { name: f.name.trim(), description: f.description || null, price_cents, image_url: f.image_url || null, active: f.active, position: f.position, updated_at: new Date().toISOString() };
    const { error } = f.id ? await supabase.from("shop_products").update(row).eq("id", f.id) : await supabase.from("shop_products").insert(row);
    if (error) return toast.error(error.message);
    toast.success(t("common.saved")); setF(empty); refresh();
  }
  async function remove(id: string) {
    const { error } = await supabase.from("shop_products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }
  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("shop_orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-shop-orders"] }); qc.invalidateQueries({ queryKey: ["admin-alerts"] });
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Link to="/admin" className="text-sm text-muted-foreground">← {t("admin.title")}</Link>
      <PageTitle title={t("admin.shop")} />
      <Panel title={f.id ? t("admin.edit") : t("admin.newProduct")}>
        <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
          <div><Label>{t("admin.pName")} *</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>{t("admin.pPrice")} *</Label><Input required inputMode="decimal" placeholder="19.90" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>{t("admin.pDesc")}</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div>
            <Label>{t("admin.pImage")}</Label>
            <Input type="file" accept="image/*" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
            {f.image_url && <img src={f.image_url} alt="" className="mt-2 h-24 rounded object-cover" />}
          </div>
          <div className="flex flex-col justify-end gap-3">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />{t("admin.pActive")}</label>
            <div className="flex gap-2"><Button disabled={busy}>{t("common.save")}</Button>{f.id && <Button type="button" variant="ghost" onClick={() => setF(empty)}>{t("common.cancel")}</Button>}</div>
          </div>
        </form>
      </Panel>
      <Panel title={t("admin.shop")} className="mt-4">
        <ul className="divide-y text-sm">{products?.map((p) => (
          <li key={p.id} className="flex items-center gap-3 py-2">
            {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
            <span className="flex-1">{p.name} {!p.active && <span className="text-muted-foreground">(—)</span>}</span>
            <span>{formatPrice(p.price_cents / 100, lang)}</span>
            <Button size="sm" variant="outline" onClick={() => setF({ id: p.id, name: p.name, description: p.description ?? "", price: (p.price_cents / 100).toFixed(2), image_url: p.image_url ?? "", active: p.active, position: p.position })}>{t("admin.edit")}</Button>
            <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>{t("admin.delete")}</Button>
          </li>))}</ul>
      </Panel>
      <Panel title={t("admin.orders")} className="mt-4">
        <ul className="divide-y text-sm">{orders?.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
            <span>{o.quantity}× {o.product_name} · {(o.restaurant as { name: string } | null)?.name ?? "—"} · {o.environment === "sandbox" ? "teste" : ""}</span>
            <span className="text-muted-foreground">{formatPrice(o.amount_cents / 100, lang)} · {formatDate(o.created_at, lang)}</span>
            {o.shipping && <span className="w-full text-xs text-muted-foreground">{(() => { const sh = o.shipping as { name?: string; address?: Record<string, string | null> }; return [sh.name, sh.address?.line1, sh.address?.line2, sh.address?.postal_code, sh.address?.city, sh.address?.country].filter(Boolean).join(", "); })()}</span>}
            <select className="rounded border bg-card px-2 py-1" value={o.status} onChange={(e) => setStatus(o.id, e.target.value)}>
              {["paid", "preparing", "shipped", "cancelled", "failed"].map((s) => <option key={s} value={s}>{t(`cards.st.${s}` as never)}</option>)}
            </select>
          </li>))}</ul>
      </Panel>
    </div>
  );
}
