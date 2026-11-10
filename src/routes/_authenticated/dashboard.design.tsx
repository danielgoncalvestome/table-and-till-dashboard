import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { FONTS, TEMPLATES, uploadImage } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/dashboard/design")({ component: Design });

function Design() {
  const { t, lang } = useI18n();
  const { restaurant: r, refresh } = useRestaurant();
  const [f, setF] = useState({ primary_color: r.primary_color, background_color: r.background_color, accent_color: r.accent_color, font: r.font, template: r.template, logo_url: r.logo_url ?? "", cover_url: r.cover_url ?? "" });
  const [busy, setBusy] = useState(false);

  async function up(k: "logo_url" | "cover_url", file?: File) {
    if (!file) return;
    try { setBusy(true); const url = await uploadImage(r.id, file); setF((p) => ({ ...p, [k]: url })); } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }
  async function save() {
    const { error } = await supabase.from("restaurants").update({ ...f, logo_url: f.logo_url || null, cover_url: f.cover_url || null }).eq("id", r.id);
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved")); refresh();
  }
  const font = FONTS.find((x) => x.id === f.font)?.css;
  return (
    <div>
      <PageTitle title={t("design.title")} action={<Button onClick={save} disabled={busy}>{t("common.save")}</Button>} />
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Panel title={t("design.template")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {TEMPLATES.map((tp) => (
                <button key={tp.id} onClick={() => setF({ ...f, template: tp.id, primary_color: tp.primary, background_color: tp.bg, accent_color: tp.accent, font: tp.font })} className={`rounded border p-3 text-left ${f.template === tp.id ? "border-primary ring-1 ring-primary" : ""}`}>
                  <div className="flex gap-1">{[tp.primary, tp.bg, tp.accent].map((c) => <span key={c} className="h-5 w-5 rounded-full border" style={{ background: c }} />)}</div>
                  <p className="mt-2 text-sm font-semibold">{tp[lang]}</p>
                </button>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="grid gap-4 sm:grid-cols-3">
              {([["primary_color", t("design.primary")], ["background_color", t("design.bg")], ["accent_color", t("design.accent")]] as const).map(([k, l]) => (
                <div key={k}><Label>{l}</Label><div className="flex items-center gap-2"><input type="color" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className="h-9 w-12 rounded border" /><Input value={f[k]} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && setF({ ...f, [k]: e.target.value })} /></div></div>
              ))}
            </div>
            <div className="mt-4"><Label>{t("design.font")}</Label>
              <div className="mt-1 flex flex-wrap gap-2">{FONTS.map((x) => <button key={x.id} onClick={() => setF({ ...f, font: x.id })} style={{ fontFamily: x.css }} className={`rounded border px-3 py-1.5 ${f.font === x.id ? "border-primary bg-secondary" : ""}`}>{x.label}</button>)}</div>
            </div>
          </Panel>
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label>{t("f.logo")}</Label>{f.logo_url && <img src={f.logo_url} alt="" className="my-2 h-16 w-16 rounded-full object-cover" />}<Input type="file" accept="image/*" onChange={(e) => up("logo_url", e.target.files?.[0])} /></div>
              <div><Label>{t("f.cover")}</Label>{f.cover_url && <img src={f.cover_url} alt="" className="my-2 h-16 w-full rounded object-cover" />}<Input type="file" accept="image/*" onChange={(e) => up("cover_url", e.target.files?.[0])} /></div>
            </div>
          </Panel>
        </div>
        <div className="sticky top-6 h-fit overflow-hidden rounded-md border" style={{ background: f.background_color, color: f.primary_color }}>
          {f.cover_url && <img src={f.cover_url} alt="" className="h-28 w-full object-cover" />}
          <div className="p-4">
            <p className="text-2xl" style={{ fontFamily: font }}>{r.name}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest" style={{ color: f.accent_color }}>{lang === "pt" ? "Recomendados" : "Recommended"}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">{[1, 2].map((i) => <div key={i}><div className="aspect-square rounded" style={{ background: f.primary_color, opacity: 0.12 }} /><p className="mt-1 text-sm font-semibold">Prato {i}</p><p className="text-sm">€ 12,00</p></div>)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
