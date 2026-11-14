import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useI18n } from "@/lib/i18n";
import { ALLERGENS, DIETARY, uploadImage } from "@/lib/menu";
import { useCatalog } from "@/lib/use-catalog";
import { ImageUploadField } from "@/components/dash/ImageUploadField";

type Dish = Database["public"]["Tables"]["dishes"]["Row"];
type Cat = Database["public"]["Tables"]["categories"]["Row"];

export function DishDialog({ dish, cats, restaurantId, defaultCategoryId, open, onClose, onSaved }: {
  dish: Dish | null; cats: Cat[]; restaurantId: string; defaultCategoryId: string; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const { t, lang } = useI18n();
  const blank = { name: "", description: "", nameEn: "", descEn: "", price: "", promo: "", image_url: "", category_id: defaultCategoryId, allergens: [] as string[], allergens_verified: false, dietary: [] as string[], longDesc: "", longDescEn: "", ingredients: "", ingredientsEn: "", gallery: [] as string[], featured: false, available: true, prep: "", calories: "" };
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [tag, setTag] = useState("");
  const { data: catalog } = useCatalog(restaurantId);
  const [recs, setRecs] = useState<string[]>([]);
  const others = (catalog?.dishes ?? []).filter((d) => !d.archived && d.id !== dish?.id);
  const addTag = () => { const v = tag.trim(); if (v && !f.dietary.includes(v)) setF((p) => ({ ...p, dietary: [...p.dietary, v] })); setTag(""); };

  useEffect(() => {
    if (!open) return;
    if (dish) {
      const ni = dish.name_i18n as Record<string, string>; const di = dish.description_i18n as Record<string, string>;
      setF({ name: dish.name, description: dish.description ?? "", nameEn: ni?.en ?? "", descEn: di?.en ?? "", price: String(dish.price), promo: dish.promo_price != null ? String(dish.promo_price) : "", image_url: dish.image_url ?? "", category_id: dish.category_id, allergens: dish.allergens, allergens_verified: dish.allergens_verified, dietary: dish.dietary, longDesc: dish.long_description ?? "", longDescEn: (dish.long_description_i18n as Record<string, string>)?.en ?? "", ingredients: dish.ingredients ?? "", ingredientsEn: (dish.ingredients_i18n as Record<string, string>)?.en ?? "", gallery: dish.gallery ?? [], featured: dish.featured, available: dish.available, prep: dish.prep_minutes?.toString() ?? "", calories: dish.calories?.toString() ?? "" });
    } else setF({ ...blank, category_id: defaultCategoryId });
    setRecs([]);
    if (dish) supabase.from("recommendations").select("recommended_dish_id").eq("dish_id", dish.id).then(({ data }) => setRecs((data ?? []).map((x) => x.recommended_dish_id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dish, defaultCategoryId]);

  const toggle = (k: "allergens" | "dietary", id: string) => setF((p) => ({ ...p, [k]: p[k].includes(id) ? p[k].filter((x) => x !== id) : [...p[k], id] }));

  async function onFile(file?: File) {
    if (!file) return;
    try { setBusy(true); const url = await uploadImage(restaurantId, file); setF((p) => ({ ...p, image_url: url })); }
    catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }
  async function onGallery(files?: FileList | null) {
    if (!files?.length) return;
    try { setBusy(true); for (const file of Array.from(files)) { const url = await uploadImage(restaurantId, file); setF((p) => ({ ...p, gallery: [...p.gallery, url] })); } }
    catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const price = Number(f.price.replace(",", "."));
    const promo = f.promo ? Number(f.promo.replace(",", ".")) : null;
    if (!f.name.trim() || isNaN(price) || price < 0 || (promo !== null && (isNaN(promo) || promo < 0))) return toast.error(t("common.error"));
    setBusy(true);
    const row = {
      restaurant_id: restaurantId, category_id: f.category_id, name: f.name.trim(), description: f.description || null,
      name_i18n: f.nameEn ? { en: f.nameEn } : {}, description_i18n: f.descEn ? { en: f.descEn } : {},
      price, promo_price: promo, image_url: f.image_url || null, allergens: f.allergens, allergens_verified: f.allergens_verified,
      dietary: f.dietary, long_description: f.longDesc.trim() || null, long_description_i18n: f.longDescEn ? { en: f.longDescEn } : {}, ingredients: f.ingredients.trim() || null, ingredients_i18n: f.ingredientsEn ? { en: f.ingredientsEn } : {}, gallery: f.gallery, featured: f.featured, available: f.available, prep_minutes: f.prep ? Number(f.prep) : null, calories: f.calories ? Number(f.calories) : null, updated_at: new Date().toISOString(),
    };
    const res = dish ? await supabase.from("dishes").update(row).eq("id", dish.id).select("id").single() : await supabase.from("dishes").insert({ ...row, position: 999 }).select("id").single();
    if (res.error) { setBusy(false); return toast.error(res.error.message); }
    const id = res.data.id;
    await supabase.from("recommendations").delete().eq("dish_id", id);
    if (recs.length) await supabase.from("recommendations").insert(recs.map((rid) => ({ restaurant_id: restaurantId, dish_id: id, recommended_dish_id: rid, label: "Combina bem com", label_i18n: { en: "Pairs well with" } })));
    setBusy(false);
    toast.success(t("common.saved"));
    onSaved();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{dish ? t("common.edit") : t("menu.newDish")}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>{t("f.name")} *</Label><Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>{t("dish.category")}</Label>
              <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={f.category_id} onChange={(e) => setF({ ...f, category_id: e.target.value })}>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div><Label>{t("f.description")}</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>{t("dish.price")} *</Label><Input required inputMode="decimal" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
            <div><Label>{t("dish.promo")}</Label><Input inputMode="decimal" value={f.promo} onChange={(e) => setF({ ...f, promo: e.target.value })} /></div>
          </div>
          <div>
            <Label>{t("dish.image")}</Label>
            <div className="mt-1"><ImageUploadField value={f.image_url || undefined} accept="image/jpeg,image/png,image/webp" disabled={busy} onFile={(files) => onFile(files?.[0])} onRemove={() => setF({ ...f, image_url: "" })} /></div>
          </div>
          <div>
            <Label>{lang === "pt" ? "Imagens secundárias (aparecem ao abrir o prato)" : "Secondary images (shown when the dish is opened)"}</Label>
            <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {f.gallery.map((g, i) => (
                <ImageUploadField key={g} value={g} disabled={busy} onFile={(files) => { const file = files?.[0]; if (!file) return; void (async () => { try { setBusy(true); const url = await uploadImage(restaurantId, file); setF((p) => ({ ...p, gallery: p.gallery.map((x, j) => (j === i ? url : x)) })); } catch { toast.error(t("common.error")); } finally { setBusy(false); } })(); }} onRemove={() => setF((p) => ({ ...p, gallery: p.gallery.filter((_, j) => j !== i) }))} />
              ))}
              <ImageUploadField accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onFile={(files) => onGallery(files)} hint={lang === "pt" ? "Adicionar imagens" : "Add images"} />
            </div>
          </div>
          <div><Label>{lang === "pt" ? "Descrição detalhada (página do prato)" : "Detailed description (dish page)"}</Label><Textarea rows={4} value={f.longDesc} onChange={(e) => setF({ ...f, longDesc: e.target.value })} /></div>
          <div><Label>{lang === "pt" ? "Ingredientes (opcional)" : "Ingredients (optional)"}</Label><Textarea rows={2} placeholder={lang === "pt" ? "Ex.: bacalhau, batata, cebola, azeite" : "E.g. cod, potato, onion, olive oil"} value={f.ingredients} onChange={(e) => setF({ ...f, ingredients: e.target.value })} /></div>
          <fieldset className="rounded border p-3">
            <legend className="px-1 text-sm font-semibold">{t("dish.translations")}</legend>
            <div className="space-y-3">
              <div><Label>{t("dish.nameEn")}</Label><Input value={f.nameEn} onChange={(e) => setF({ ...f, nameEn: e.target.value })} /></div>
              <div><Label>{t("dish.descEn")}</Label><Textarea value={f.descEn} onChange={(e) => setF({ ...f, descEn: e.target.value })} /></div>
              <div><Label>{lang === "pt" ? "Descrição detalhada (EN)" : "Detailed description (EN)"}</Label><Textarea value={f.longDescEn} onChange={(e) => setF({ ...f, longDescEn: e.target.value })} /></div>
              <div><Label>{lang === "pt" ? "Ingredientes (EN)" : "Ingredients (EN)"}</Label><Input value={f.ingredientsEn} onChange={(e) => setF({ ...f, ingredientsEn: e.target.value })} /></div>
            </div>
          </fieldset>
          <fieldset className="rounded border p-3">
            <legend className="px-1 text-sm font-semibold">{t("dish.allergens")}</legend>
            <div className="flex flex-wrap gap-2">
              {ALLERGENS.map((a) => (
                <button type="button" key={a.id} onClick={() => toggle("allergens", a.id)} className={`rounded-full border px-2.5 py-1 text-xs ${f.allergens.includes(a.id) ? "border-primary bg-primary text-primary-foreground" : ""}`}>{a[lang]}</button>
              ))}
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={f.allergens_verified} onChange={(e) => setF({ ...f, allergens_verified: e.target.checked })} />{t("dish.allergensVerified")}</label>
          </fieldset>
          <div>
            <Label>{t("dish.dietary")}</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {DIETARY.map((a) => (
                <button type="button" key={a.id} onClick={() => toggle("dietary", a.id)} className={`rounded-full border px-2.5 py-1 text-xs ${f.dietary.includes(a.id) ? "border-primary bg-secondary" : ""}`}>{a[lang]}</button>
              ))}
              {f.dietary.filter((x) => !DIETARY.some((d) => d.id === x)).map((x) => (
                <button type="button" key={x} onClick={() => toggle("dietary", x)} className="rounded-full border border-primary bg-secondary px-2.5 py-1 text-xs">{x} ×</button>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <Input value={tag} maxLength={30} placeholder={lang === "pt" ? "Nova etiqueta (ex.: Halal)" : "New label (e.g. Halal)"} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }} />
              <Button type="button" variant="outline" onClick={addTag}>{lang === "pt" ? "Adicionar" : "Add"}</Button>
            </div>
          </div>
          <div>
            <Label>{lang === "pt" ? "Recomendações (combina bem com)" : "Recommendations (pairs well with)"}</Label>
            <p className="text-xs text-muted-foreground">{lang === "pt" ? "Pratos sugeridos na página deste prato." : "Dishes suggested on this dish's page."}</p>
            {others.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {others.map((d) => (
                  <button type="button" key={d.id} onClick={() => setRecs((p) => p.includes(d.id) ? p.filter((x) => x !== d.id) : [...p, d.id])} className={`rounded-full border px-2.5 py-1 text-xs ${recs.includes(d.id) ? "border-primary bg-primary text-primary-foreground" : ""}`}>{d.name}</button>
                ))}
              </div>
            ) : <p className="mt-1 text-xs text-muted-foreground">{lang === "pt" ? "Adicione mais pratos para poder recomendá-los." : "Add more dishes to recommend them."}</p>}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div><Label>{t("dish.prep")}</Label><Input type="number" min={0} value={f.prep} onChange={(e) => setF({ ...f, prep: e.target.value })} /></div>
            <div><Label>{t("dish.calories")}</Label><Input type="number" min={0} value={f.calories} onChange={(e) => setF({ ...f, calories: e.target.value })} /></div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.featured} onCheckedChange={(v) => setF({ ...f, featured: v })} />{t("dish.featured")}</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.available} onCheckedChange={(v) => setF({ ...f, available: v })} />{t("dish.available")}</label>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
            <Button disabled={busy}>{t("common.save")}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
