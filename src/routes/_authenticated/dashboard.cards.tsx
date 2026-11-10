import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { formatDate, formatPrice } from "@/lib/menu";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { confirmShopCheckout, createShopCheckout } from "@/utils/shop.functions";

export const Route = createFileRoute("/_authenticated/dashboard/cards")({
  head: () => ({ meta: [{ title: "Cartões — MenuTap" }, { name: "description", content: "Encomende cartões e materiais MenuTap para o seu restaurante." }, { property: "og:title", content: "Cartões — MenuTap" }, { property: "og:description", content: "Encomende cartões MenuTap." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ session_id: typeof s.session_id === "string" && /^cs_[a-zA-Z0-9_]+$/.test(s.session_id) ? s.session_id : undefined }),
  component: Cards,
});

function Cards() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const environment = getStripeEnvironment();
  const { session_id } = Route.useSearch();
  const qc = useQueryClient();
  const checkout = useServerFn(createShopCheckout);
  const confirm = useServerFn(confirmShopCheckout);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [secret, setSecret] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [useDefault, setUseDefault] = useState(true);
  const [addr, setAddr] = useState({ name: "", line1: "", postalCode: "", city: "", country: "PT" as "PT" | "ES" });
  const hasDefault = !!r.address?.trim();
  const ownAddr = !useDefault || !hasDefault;
  const addrOk = !ownAddr || (addr.name.trim() && addr.line1.trim() && addr.postalCode.trim() && addr.city.trim());
  const [error, setError] = useState<string | null>(null);
  const { data: products } = useQuery({ queryKey: ["shop-products"], queryFn: async () => {
    const { data, error } = await supabase.from("shop_products").select("*").eq("active", true).order("position").order("created_at");
    if (error) throw error; return data ?? [];
  } });
  const { data: orders } = useQuery({ queryKey: ["shop-orders", environment], enabled: !!environment, queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("shop_orders").select("*").eq("user_id", u.user!.id).eq("environment", environment!).neq("status", "pending").order("created_at", { ascending: false });
    if (error) throw error; return data ?? [];
  } });
  const { data: outcome } = useQuery({ queryKey: ["shop-confirm", session_id], enabled: !!session_id && !!environment, queryFn: async () => {
    const res = await confirm({ data: { sessionId: session_id!, environment: environment! } });
    if ("error" in res) throw new Error(res.error);
    await qc.invalidateQueries({ queryKey: ["shop-orders"] });
    return res;
  } });

  async function buy(productId: string) {
    if (!environment) return;
    setBusy(productId); setError(null);
    try {
      const res = await checkout({ data: { environment, origin: window.location.origin, lang, productId, restaurantId: r.id, quantity: qty[productId] ?? 1, shipping: { useDefault: !ownAddr, ...(ownAddr && addr) } } });
      if ("error" in res) throw new Error(res.error);
      setSecret(res.clientSecret);
    } catch (e) { setError(e instanceof Error ? e.message : t("common.error")); } finally { setBusy(null); }
  }

  return (
    <div>
      <PageTitle title={t("dash.cards")} sub={t("cards.sub")} />
      {environment !== "live" && <p role="status" className="mb-6 border-y border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{t(environment === "sandbox" ? "sub.test" : "sub.liveMissing")}</p>}
      {outcome?.paid && <p role="status" className="mb-4 text-sm text-primary">{t("cards.paid")}</p>}
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {secret ? (
        <section className="border-t pt-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl">{t("cards.pay")}</h2><Button variant="ghost" size="icon" aria-label={t("common.cancel")} onClick={() => setSecret(null)}><X /></Button></div>
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret: secret }}><EmbeddedCheckout /></EmbeddedCheckoutProvider>
        </section>
      ) : !products?.length ? <p className="text-sm text-muted-foreground">{t("cards.empty")}</p> : (
        <>
        <section className="mb-6 rounded-md border bg-card p-4">
          <h2 className="mb-3 text-lg">{t("cards.ship")}</h2>
          {hasDefault && <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={useDefault} onChange={(e) => setUseDefault(e.target.checked)} /><span>{t("cards.shipDefault")}<span className="block text-muted-foreground">{r.address}</span></span></label>}
          {ownAddr && <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input placeholder={t("cards.shipName")} value={addr.name} onChange={(e) => setAddr({ ...addr, name: e.target.value })} />
            <Input placeholder={t("cards.shipLine")} value={addr.line1} onChange={(e) => setAddr({ ...addr, line1: e.target.value })} />
            <Input placeholder={t("cards.shipPostal")} value={addr.postalCode} onChange={(e) => setAddr({ ...addr, postalCode: e.target.value })} />
            <Input placeholder={t("cards.shipCity")} value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={addr.country} onChange={(e) => setAddr({ ...addr, country: e.target.value as "PT" | "ES" })}><option value="PT">Portugal</option><option value="ES">España</option></select>
          </div>}
        </section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article key={p.id} className="flex flex-col overflow-hidden rounded-md border bg-card">
              {p.image_url ? <img src={p.image_url} alt={p.name} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] w-full bg-muted" />}
              <div className="flex flex-1 flex-col p-4">
                <h3 className="text-xl">{p.name}</h3>
                {p.description && <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{p.description}</p>}
                <p className="mt-3 font-display text-2xl text-primary">{formatPrice(p.price_cents / 100, lang)}</p>
                <div className="mt-auto flex items-end gap-2 pt-4">
                  <label className="text-xs text-muted-foreground">{t("cards.qty")}<Input type="number" min={1} max={100} className="w-20" value={qty[p.id] ?? 1} onChange={(e) => setQty({ ...qty, [p.id]: Math.max(1, Math.min(100, Number(e.target.value) || 1)) })} /></label>
                  <Button className="flex-1" disabled={!!busy || !environment || !addrOk} onClick={() => buy(p.id)}><ShoppingCart />{busy === p.id ? t("common.loading") : t("cards.buy")}</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        </>
      )}
      {!!orders?.length && (
        <Panel title={t("cards.orders")} className="mt-8">
          <ul className="divide-y text-sm">{orders.map((o) => <li key={o.id} className="flex justify-between py-2"><span>{o.quantity}× {o.product_name}</span><span className="text-muted-foreground">{formatPrice(o.amount_cents / 100, lang)} · {t(`cards.st.${o.status}` as never)} · {formatDate(o.created_at, lang)}</span></li>)}</ul>
        </Panel>
      )}
    </div>
  );
}
