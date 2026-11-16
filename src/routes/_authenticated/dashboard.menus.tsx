import { BookOpen as BookOpenIcon } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, Archive, ArchiveRestore, GripVertical, Pencil, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageTitle, Panel } from "@/components/dash/ui";
import { DishDialog } from "@/components/dash/DishDialog";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/lib/i18n";
import { useRestaurant, audit } from "@/lib/restaurant";
import { useCatalog } from "@/lib/use-catalog";
import { MENU_KINDS, WEEKDAYS, formatPrice, isMenuActive } from "@/lib/menu";

type Dish = Database["public"]["Tables"]["dishes"]["Row"];
type Menu = Database["public"]["Tables"]["menus"]["Row"];

export const Route = createFileRoute("/_authenticated/dashboard/menus")({ head: () => ({ meta: [{ title: "Menus e pratos — MenuTap" }, { name: "description", content: "Gira os menus, pratos e preços do restaurante." }, { property: "og:title", content: "Menus e pratos — MenuTap" }, { property: "og:description", content: "Gira os menus, pratos e preços do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Menus });

function Menus() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const qc = useQueryClient();
  const { data, isLoading } = useCatalog(r.id);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [edit, setEdit] = useState<{ dish: Dish | null; cat: string } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const reload = () => qc.invalidateQueries({ queryKey: ["catalog", r.id] });

  useEffect(() => {
    if (data && (!menuId || !data.menus.some((m) => m.id === menuId))) setMenuId(data.menus[0]?.id ?? null);
  }, [data, menuId]);

  if (isLoading || !data) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  const menu = data.menus.find((m) => m.id === menuId) ?? null;
  const cats = data.cats.filter((c) => c.menu_id === menuId);

  const run = async (p: PromiseLike<{ error: unknown }>) => { const { error } = await p; if (error) toast.error(t("common.error")); reload(); };

  async function newMenu() {
    const { data: m, error } = await supabase.from("menus").insert({ restaurant_id: r.id, name: t("menu.new"), position: data!.menus.length }).select().single();
    if (error) return toast.error(t("common.error"));
    setMenuId(m.id); reload();
  }
  async function newCat() {
    if (!menu) return;
    await run(supabase.from("categories").insert({ restaurant_id: r.id, menu_id: menu.id, name: t("menu.newCat"), position: cats.length }));
  }
  async function moveCat(i: number, dir: -1 | 1) {
    const a = cats[i], b = cats[i + dir];
    if (!a || !b) return;
    await Promise.all([supabase.from("categories").update({ position: i + dir }).eq("id", a.id), supabase.from("categories").update({ position: i }).eq("id", b.id)]);
    reload();
  }
  async function reorder(catId: string, fromId: string, toId: string) {
    const list = data!.dishes.filter((d) => d.category_id === catId).map((d) => d.id);
    const from = list.indexOf(fromId), to = list.indexOf(toId);
    if (from < 0 || to < 0 || from === to) return;
    list.splice(to, 0, list.splice(from, 1)[0]);
    await Promise.all(list.map((id, i) => supabase.from("dishes").update({ position: i }).eq("id", id)));
    reload();
  }
  async function quickPrice(d: Dish, v: string) {
    const n = Number(v.replace(",", "."));
    if (isNaN(n) || n < 0 || n === Number(d.price)) return;
    await run(supabase.from("dishes").update({ price: n, updated_at: new Date().toISOString() }).eq("id", d.id));
    await audit("dish.price", r.id, { dish: d.name, from: d.price, to: n });
    toast.success(t("common.saved"));
  }
  async function duplicate(d: Dish) {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = d;
    await run(supabase.from("dishes").insert({ ...rest, name: `${d.name} (2)`, position: d.position + 1 }));
  }

  return (
    <div>
      <PageTitle icon={BookOpenIcon} title={t("dash.menus")} action={<Button onClick={newMenu}><Plus />{t("menu.new")}</Button>} />
      {data.menus.length === 0 ? <p className="text-muted-foreground">{t("menu.noMenus")}</p> : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            {data.menus.map((m) => (
              <button key={m.id} onClick={() => setMenuId(m.id)} className={`rounded-full border px-4 py-1.5 text-sm ${m.id === menuId ? "border-primary bg-primary text-primary-foreground" : "bg-card"}`}>
                {m.name}{!m.published && " ·"}
              </button>
            ))}
            {menu && <button type="button" onClick={() => setShowSettings((v) => !v)} aria-expanded={showSettings} className={`flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm ${showSettings ? "border-primary bg-secondary" : "bg-card"}`}><Settings className="h-4 w-4" />Menus</button>}
          </div>
          {menu && showSettings && <MenuSettings key={menu.id} menu={menu} onChanged={reload} />}

          <div className="mt-6 flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-muted-foreground"><Switch checked={showArchived} onCheckedChange={setShowArchived} />{t("dish.archived")}</label>
            <Button variant="outline" onClick={newCat}><Plus />{t("menu.newCat")}</Button>
          </div>
          {cats.length === 0 && <p className="mt-6 text-muted-foreground">{t("menu.noCats")}</p>}
          <div className="mt-4 space-y-4">
            {cats.map((c, i) => {
              const dishes = data.dishes.filter((d) => d.category_id === c.id && (showArchived || !d.archived));
              const en = (c.name_i18n as Record<string, string>)?.en ?? "";
              return (
                <Panel key={c.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input defaultValue={c.name} className="max-w-xs font-semibold" onBlur={(e) => e.target.value !== c.name && run(supabase.from("categories").update({ name: e.target.value }).eq("id", c.id))} />
                    <Input defaultValue={en} placeholder="EN" className="max-w-[12rem]" onBlur={(e) => e.target.value !== en && run(supabase.from("categories").update({ name_i18n: { en: e.target.value } }).eq("id", c.id))} />
                    <div className="ml-auto flex gap-1">
                      <Button size="icon" variant="ghost" aria-label="up" onClick={() => moveCat(i, -1)} disabled={i === 0}><ArrowUp /></Button>
                      <Button size="icon" variant="ghost" aria-label="down" onClick={() => moveCat(i, 1)} disabled={i === cats.length - 1}><ArrowDown /></Button>
                      <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => confirm(t("common.confirmDelete")) && run(supabase.from("categories").delete().eq("id", c.id))}><Trash2 /></Button>
                      <Button size="sm" onClick={() => setEdit({ dish: null, cat: c.id })}><Plus />{t("menu.newDish")}</Button>
                    </div>
                  </div>
                  {dishes.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{t("menu.noDishes")}</p> : (
                    <ul className="mt-4 divide-y">
                      {dishes.map((d) => (
                        <li key={d.id} draggable onDragStart={() => setDrag(d.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) reorder(c.id, drag, d.id); setDrag(null); }}
                          className={`flex flex-wrap items-center gap-3 py-2.5 ${d.archived ? "opacity-50" : ""} ${drag === d.id ? "bg-muted" : ""}`}>
                          <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground" />
                          {d.image_url ? <img src={d.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <div className="h-10 w-10 rounded bg-muted" />}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{d.name}{d.featured && <span className="ml-2 text-xs text-sage">★</span>}</p>
                            <p className="text-xs text-muted-foreground">{d.promo_price != null ? `${formatPrice(d.promo_price, lang)} · ` : ""}{!d.allergens_verified && "⚠ " + t("dish.allergens")}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm">€<Input aria-label={t("dish.price")} defaultValue={String(d.price)} inputMode="decimal" className="h-8 w-20" onBlur={(e) => quickPrice(d, e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} /></div>
                          <label className="flex items-center gap-1.5 text-xs" title={t("dish.available")}><Switch checked={d.available} onCheckedChange={(v) => run(supabase.from("dishes").update({ available: v }).eq("id", d.id))} />{d.available ? t("dish.available") : t("dish.unavailable")}</label>
                          <div className="flex">
                            <Button size="icon" variant="ghost" aria-label={t("common.edit")} onClick={() => setEdit({ dish: d, cat: c.id })}><Pencil /></Button>
                            <Button size="icon" variant="ghost" aria-label={t("common.duplicate")} onClick={() => duplicate(d)}><Copy /></Button>
                            <Button size="icon" variant="ghost" aria-label={d.archived ? t("common.restore") : t("common.archive")} onClick={() => run(supabase.from("dishes").update({ archived: !d.archived }).eq("id", d.id))}>{d.archived ? <ArchiveRestore /> : <Archive />}</Button>
                            <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={() => confirm(t("common.confirmDelete")) && run(supabase.from("dishes").delete().eq("id", d.id))}><Trash2 /></Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>
              );
            })}
          </div>
        </>
      )}
      <DishDialog open={!!edit} dish={edit?.dish ?? null} defaultCategoryId={edit?.cat ?? ""} cats={cats} restaurantId={r.id} onClose={() => setEdit(null)} onSaved={reload} />
    </div>
  );
}

function MenuSettings({ menu, onChanged }: { menu: Menu; onChanged: () => void }) {
  const { t, lang } = useI18n();
  const [f, setF] = useState({ name: menu.name, en: (menu.name_i18n as Record<string, string>)?.en ?? "", kind: menu.kind, published: menu.published, days: menu.schedule_days, start: menu.schedule_start?.slice(0, 5) ?? "", end: menu.schedule_end?.slice(0, 5) ?? "" });
  const active = isMenuActive({ schedule_days: f.days, schedule_start: f.start || null, schedule_end: f.end || null });
  async function save() {
    const { error } = await supabase.from("menus").update({ name: f.name, name_i18n: f.en ? { en: f.en } : {}, kind: f.kind, published: f.published, schedule_days: f.days, schedule_start: f.start || null, schedule_end: f.end || null }).eq("id", menu.id);
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved")); onChanged();
  }
  async function remove() {
    if (!confirm(t("common.confirmDelete"))) return;
    await supabase.from("menus").delete().eq("id", menu.id); onChanged();
  }
  return (
    <Panel>
      <div className="grid gap-4 md:grid-cols-4">
        <div><Label>{t("f.name")}</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><Label>EN</Label><Input value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></div>
        <div><Label>{t("menu.kind")}</Label>
          <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
            {MENU_KINDS.map((k) => <option key={k.id} value={k.id}>{k[lang]}</option>)}
          </select>
        </div>
        <label className="flex items-end gap-2 pb-2 text-sm"><Switch checked={f.published} onCheckedChange={(v) => setF({ ...f, published: v })} />{f.published ? t("dash.published") : t("dash.unpublished")}</label>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <Label>{t("menu.schedule")}</Label>
          <div className="mt-1 flex gap-1">
            {WEEKDAYS[lang].map((d, i) => (
              <button key={i} type="button" onClick={() => setF({ ...f, days: f.days.includes(i) ? f.days.filter((x) => x !== i) : [...f.days, i].sort() })} className={`h-8 w-10 rounded border text-xs ${f.days.includes(i) ? "border-primary bg-secondary font-semibold" : "text-muted-foreground"}`}>{d}</button>
            ))}
          </div>
        </div>
        <div><Label>{t("menu.from")}</Label><Input type="time" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} className="w-28" /></div>
        <div><Label>{t("menu.to")}</Label><Input type="time" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} className="w-28" /></div>
        <span className={`mb-2 rounded-full px-2 py-0.5 text-xs ${active ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>{active ? "● " + (lang === "pt" ? "Ativo agora" : "Active now") : lang === "pt" ? "Fora de horário" : "Outside schedule"}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" onClick={remove}><Trash2 /></Button>
          <Button onClick={save}>{t("common.save")}</Button>
        </div>
      </div>
    </Panel>
  );
}
