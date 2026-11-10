import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { audit, useRestaurant } from "@/lib/restaurant";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({ component: Settings });

function Settings() {
  const { t } = useI18n();
  const { restaurant: r, refresh } = useRestaurant();
  const [f, setF] = useState({ name: r.name, description: r.description ?? "", descEn: (r.description_i18n as Record<string, string>)?.en ?? "", address: r.address ?? "", phone: r.phone ?? "", email: r.email ?? "", website: r.website ?? "", instagram_url: r.instagram_url ?? "", google_reviews_url: r.google_reviews_url ?? "", opening_hours: r.opening_hours ?? "", en: r.languages.includes("en") });
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { descEn, en, ...rest } = f;
    const { error } = await supabase.from("restaurants").update({ ...rest, description_i18n: descEn ? { en: descEn } : {}, languages: en ? ["pt", "en"] : ["pt"] }).eq("id", r.id);
    if (error) return toast.error(t("common.error"));
    await audit("restaurant.update", r.id);
    toast.success(t("common.saved")); refresh();
  }
  async function exportData() {
    const tables = ["menus", "categories", "dishes", "recommendations"] as const;
    const out: Record<string, unknown> = { restaurant: r };
    for (const tb of tables) out[tb] = (await supabase.from(tb).select("*").eq("restaurant_id", r.id)).data;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: "application/json" }));
    a.download = `${r.slug}-export.json`; a.click();
  }
  const fld = (k: Exclude<keyof typeof f, "en">, l: string) => <div><Label>{l}</Label><Input value={f[k] as string} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>;
  return (
    <div>
      <PageTitle title={t("dash.settings")} />
      <form onSubmit={save}>
        <Panel>
          <div className="grid gap-4 md:grid-cols-2">
            {fld("name", t("f.name"))}
            <div><Label>{t("f.slug")}</Label><Input value={`/r/${r.slug}`} disabled /></div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div><Label>{t("f.description")}</Label><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
            <div><Label>{t("f.description")} (EN)</Label><Textarea value={f.descEn} onChange={(e) => setF({ ...f, descEn: e.target.value })} /></div>
            {fld("address", t("f.address"))}{fld("phone", t("f.phone"))}{fld("email", t("f.email"))}{fld("website", t("f.website"))}
            {fld("instagram_url", t("f.instagram"))}{fld("google_reviews_url", t("f.reviews"))}{fld("opening_hours", t("f.hours"))}
          </div>
          <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={f.en} onChange={(e) => setF({ ...f, en: e.target.checked })} />{t("f.languages")}: PT + EN</label>
          <div className="mt-6 flex gap-2"><Button>{t("common.save")}</Button><Button type="button" variant="outline" onClick={exportData}>Export (RGPD)</Button></div>
        </Panel>
      </form>
    </div>
  );
}
