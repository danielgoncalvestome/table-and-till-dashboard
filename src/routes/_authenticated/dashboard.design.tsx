import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { PageTitle, Panel } from "@/components/dash/ui";
import { ImageUploadField } from "@/components/dash/ImageUploadField";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { FONTS, TEMPLATES, uploadImage } from "@/lib/menu";
import { BOOKING_SECTIONS, MENU_SECTIONS, TEXT_SECTIONS, textStyle, type TextStyles, type TextStyle } from "@/lib/text-styles";

export const Route = createFileRoute("/_authenticated/dashboard/design")({ head: () => ({ meta: [{ title: "Aparência — MenuTap" }, { name: "description", content: "Personalize a aparência do seu menu digital." }, { property: "og:title", content: "Aparência — MenuTap" }, { property: "og:description", content: "Personalize a aparência do seu menu digital." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Design });

function Design() {
  const { t, lang } = useI18n();
  const { restaurant: r, refresh } = useRestaurant();
  const [target, setTarget] = useState<"menu" | "reservas">("menu");
  const [fm, setFm] = useState({ primary_color: r.primary_color, background_color: r.background_color, accent_color: r.accent_color, font: r.font, template: r.template, logo_url: r.logo_url ?? "", cover_url: r.cover_url ?? "", cover_color: r.cover_color ?? "", text_styles: (r.text_styles ?? {}) as TextStyles });
  const [fb, setFb] = useState(() => ({ ...fm, ...((r as { booking_design?: object }).booking_design ?? {}) } as typeof fm));
  const f = target === "menu" ? fm : fb;
  const setF = target === "menu" ? setFm : setFb;
  const sections = TEXT_SECTIONS.filter((x) => (target === "menu" ? MENU_SECTIONS : BOOKING_SECTIONS).includes(x.id));
  const [busy, setBusy] = useState(false);
  const [showText, setShowText] = useState(false);

  async function up(k: "logo_url" | "cover_url", file?: File) {
    if (!file) return;
    try { setBusy(true); const url = await uploadImage(r.id, file); setF((p) => ({ ...p, [k]: url })); } catch { toast.error(t("common.error")); } finally { setBusy(false); }
  }
  async function save() {
    if (target === "reservas") {
      const { error } = await supabase.from("restaurants").update({ booking_design: fb as never }).eq("id", r.id);
      if (error) return toast.error(t("common.error"));
      toast.success(t("common.saved")); return refresh();
    }
    const { error } = await supabase.from("restaurants").update({ ...f, logo_url: f.logo_url || null, cover_url: f.cover_url || null, cover_color: f.cover_color || null, text_styles: f.text_styles as never }).eq("id", r.id);
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved")); refresh();
  }
  const font = FONTS.find((x) => x.id === f.font)?.css;
  const setTS = (id: string, patch: Partial<TextStyle>) => setF((p) => ({ ...p, text_styles: { ...p.text_styles, [id]: { ...(p.text_styles as Record<string, TextStyle>)[id], ...patch } } }));
  const resetTS = (id: string) => setF((p) => { const n = { ...p.text_styles } as Record<string, TextStyle>; delete n[id]; return { ...p, text_styles: n }; });
  return (
    <div>
      <PageTitle title={t("design.title")} action={<Button onClick={save} disabled={busy}>{t("common.save")}</Button>} />
      <div className="mb-5 flex justify-center">
        <div className="inline-flex rounded-full border bg-card p-1" role="tablist">
          <button role="tab" aria-selected={target === "menu"} onClick={() => setTarget("menu")} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${target === "menu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{lang === "pt" ? "Menu digital" : "Digital menu"}</button>
          <button role="tab" aria-selected={target === "reservas"} onClick={() => setTarget("reservas")} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${target === "reservas" ? "bg-bordeaux text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{lang === "pt" ? "Página de reservas" : "Booking page"}</button>
        </div>
      </div>
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
              <div><Label>{t("f.logo")}</Label><div className="mt-1"><ImageUploadField value={f.logo_url || undefined} contain disabled={busy} onFile={(files) => up("logo_url", files?.[0])} onRemove={() => setF({ ...f, logo_url: "" })} /></div></div>
              <div><Label>{t("f.cover")}</Label><div className="mt-1"><ImageUploadField value={f.cover_url || undefined} disabled={busy} onFile={(files) => up("cover_url", files?.[0])} onRemove={() => setF({ ...f, cover_url: "" })} /></div></div>
            </div>
            {!f.cover_url && (
              <div className="mt-4"><Label>{lang === "pt" ? "Cor de fundo da capa" : "Cover background colour"}</Label>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setF({ ...f, cover_color: "" })} className={`rounded border px-3 py-1.5 text-sm ${!f.cover_color ? "border-primary bg-secondary" : ""}`}>{lang === "pt" ? "Sem cor / transparente" : "No colour / transparent"}</button>
                  <input type="color" value={f.cover_color || "#18352b"} onChange={(e) => setF({ ...f, cover_color: e.target.value })} className="h-9 w-12 rounded border" aria-label={lang === "pt" ? "Escolher cor" : "Pick colour"} />
                  {f.cover_color && <span className="text-sm text-muted-foreground">{f.cover_color}</span>}
                </div>
              </div>
            )}
          </Panel>
          <Panel>
            <button type="button" onClick={() => setShowText((v) => !v)} className="flex w-full items-center justify-between gap-2 text-left">
              <span className="font-sans text-sm font-semibold">{lang === "pt" ? "Personalizar texto por secção" : "Text per section"}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showText ? "rotate-180" : ""}`} />
            </button>
            {showText && (
            <div className="mt-4 space-y-3">
              {sections.map((sec) => {
                const v = (f.text_styles as Record<string, TextStyle>)[sec.id] ?? {};
                return (
                  <div key={sec.id} className="rounded border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold" style={textStyle(f.text_styles, sec.id)}>{sec[lang]}</p>
                      {f.text_styles[sec.id] && <button type="button" onClick={() => resetTS(sec.id)} className="text-xs text-muted-foreground underline">{lang === "pt" ? "Repor" : "Reset"}</button>}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <select value={v.font ?? ""} onChange={(e) => setTS(sec.id, { font: e.target.value || undefined })} className="h-9 rounded border bg-background px-2 text-sm">
                        <option value="">{lang === "pt" ? "Letra padrão" : "Default font"}</option>
                        {FONTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                      <div className="flex items-center gap-1">
                        <input type="color" value={v.color ?? f.primary_color} onChange={(e) => setTS(sec.id, { color: e.target.value })} className="h-9 w-10 rounded border" aria-label={lang === "pt" ? "Cor" : "Colour"} />
                        {v.color && <button type="button" onClick={() => setTS(sec.id, { color: undefined })} className="text-xs text-muted-foreground underline">{lang === "pt" ? "padrão" : "default"}</button>}
                      </div>
                      <select value={v.size ?? ""} onChange={(e) => setTS(sec.id, { size: e.target.value ? Number(e.target.value) : undefined })} className="h-9 rounded border bg-background px-2 text-sm">
                        <option value="">{lang === "pt" ? "Tamanho padrão" : "Default size"}</option>
                        {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36].map((n) => <option key={n} value={n}>{n} px</option>)}
                      </select>
                      <select value={v.upper === undefined ? "" : v.upper ? "1" : "0"} onChange={(e) => setTS(sec.id, { upper: e.target.value === "" ? undefined : e.target.value === "1" })} className="h-9 rounded border bg-background px-2 text-sm">
                        <option value="">{lang === "pt" ? "Maiúsculas: padrão" : "Case: default"}</option>
                        <option value="1">{lang === "pt" ? "MAIÚSCULAS" : "UPPERCASE"}</option>
                        <option value="0">{lang === "pt" ? "Normal" : "Normal"}</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </Panel>
        </div>
        {target === "reservas" ? (
          <div className="sticky top-6 h-fit overflow-hidden rounded-md border" style={{ background: f.background_color, color: f.primary_color, fontFamily: font }}>
            <div className="flex h-28 items-center justify-center bg-cover bg-center" style={{ backgroundImage: f.cover_url ? `url(${f.cover_url})` : undefined, backgroundColor: f.cover_url ? undefined : f.cover_color || undefined }}>
              {f.logo_url ? <img src={f.logo_url} alt="" className="h-20 w-auto max-w-[80%] object-contain" /> : <p className="text-2xl" style={textStyle(f.text_styles, "name")}>{r.name}</p>}
            </div>
            <div className="p-4">
              <p className="text-center text-sm opacity-70" style={textStyle(f.text_styles, "bk_title")}>Reservar mesa</p>
              <div className="mt-3 rounded-lg border bg-card p-4 text-card-foreground">
                <p className="text-sm font-medium" style={textStyle(f.text_styles, "bk_label")}>Quantas pessoas?</p>
                <div className="mt-2 rounded border py-2 text-center text-xl">2</div>
                <button type="button" className="mt-3 w-full rounded py-2 text-sm text-primary-foreground" style={{ background: f.accent_color || f.primary_color, ...textStyle(f.text_styles, "bk_button") }}>Ver horários</button>
              </div>
            </div>
          </div>
        ) : (
        <div className="sticky top-6 h-fit overflow-hidden rounded-md border" style={{ background: f.background_color, color: f.primary_color }}>
          {f.logo_url ? (
            <div className="flex h-28 items-center justify-center bg-cover bg-center" style={{ backgroundImage: f.cover_url ? `url(${f.cover_url})` : undefined, backgroundColor: f.cover_url ? undefined : f.cover_color || undefined }}>
              <img src={f.logo_url} alt="" className="h-20 w-auto max-w-[80%] object-contain" />
            </div>
          ) : f.cover_url ? <img src={f.cover_url} alt="" className="h-28 w-full object-cover" /> : f.cover_color ? <div className="h-14" style={{ background: f.cover_color }} /> : null}
          <div className="p-4">
            {!f.logo_url && <p className="text-2xl" style={{ fontFamily: font, ...textStyle(f.text_styles, "name") }}>{r.name}</p>}
            <p className="mt-3 text-xs font-semibold uppercase tracking-widest" style={{ color: f.accent_color, ...textStyle(f.text_styles, "featured") }}>{lang === "pt" ? "Recomendados" : "Recommended"}</p>
            <div className="mt-2 grid grid-cols-2 gap-3">{[1, 2].map((i) => <div key={i}><div className="aspect-square rounded" style={{ background: f.primary_color, opacity: 0.12 }} /><p className="mt-1 text-sm font-semibold" style={textStyle(f.text_styles, "dish")}>Prato {i}</p><p className="text-xs opacity-70" style={textStyle(f.text_styles, "description")}>Descrição</p><p className="text-sm" style={textStyle(f.text_styles, "price")}>12,00</p></div>)}</div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
