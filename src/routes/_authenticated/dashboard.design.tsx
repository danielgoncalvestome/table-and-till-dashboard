import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Palette as PaletteIcon, LayoutTemplate, Droplet, Type, ImageIcon, TextCursorInput, Check, RotateCcw, Upload, X, Smartphone, UtensilsCrossed, CalendarDays, Loader2, Ban, Search, Phone, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { FONTS, TEMPLATES, uploadImage } from "@/lib/menu";
import { BOOKING_SECTIONS, MENU_SECTIONS, TEXT_SECTIONS, textStyle, type TextStyles, type TextStyle } from "@/lib/text-styles";

export const Route = createFileRoute("/_authenticated/dashboard/design")({ head: () => ({ meta: [{ title: "Aparência — Crumb" }, { name: "description", content: "Personalize a aparência do seu menu digital." }, { property: "og:title", content: "Aparência — Crumb" }, { property: "og:description", content: "Personalize a aparência do seu menu digital." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Design });

type Sec = "style" | "colors" | "type" | "images" | "text";

function Design() {
  const { t, lang } = useI18n();
  const pt = lang === "pt";
  const { restaurant: r, refresh } = useRestaurant();
  const [target, setTarget] = useState<"menu" | "reservas">("menu");
  const initM = useMemo(() => ({ primary_color: r.primary_color, background_color: r.background_color, accent_color: r.accent_color, font: r.font, template: r.template, logo_url: r.logo_url ?? "", cover_url: r.cover_url ?? "", cover_color: r.cover_color ?? "", text_styles: (r.text_styles ?? {}) as TextStyles }), [r]);
  const initB = useMemo(() => ({ ...initM, ...((r as { booking_design?: object }).booking_design ?? {}) } as typeof initM), [r, initM]);
  const [fm, setFm] = useState(initM);
  const [fb, setFb] = useState(initB);
  const f = target === "menu" ? fm : fb;
  const setF = target === "menu" ? setFm : setFb;
  const init = target === "menu" ? initM : initB;
  const dirty = JSON.stringify(f) !== JSON.stringify(init);
  const sections = TEXT_SECTIONS.filter((x) => (target === "menu" ? MENU_SECTIONS : BOOKING_SECTIONS).includes(x.id));
  const [busy, setBusy] = useState<"" | "logo_url" | "cover_url" | "save">("");
  const [sec, setSec] = useState<Sec>("style");
  const [openTS, setOpenTS] = useState<string | null>(null);

  async function up(k: "logo_url" | "cover_url", file?: File) {
    if (!file) return;
    try { setBusy(k); const url = await uploadImage(r.id, file); setF((p) => ({ ...p, [k]: url })); } catch { toast.error(t("common.error")); } finally { setBusy(""); }
  }
  async function save() {
    setBusy("save");
    const { error } = target === "reservas"
      ? await supabase.from("restaurants").update({ booking_design: fb as never }).eq("id", r.id)
      : await supabase.from("restaurants").update({ ...f, logo_url: f.logo_url || null, cover_url: f.cover_url || null, cover_color: f.cover_color || null, text_styles: f.text_styles as never }).eq("id", r.id);
    setBusy("");
    if (error) return toast.error(t("common.error"));
    toast.success(t("common.saved")); refresh();
  }
  const setTS = (id: string, patch: Partial<TextStyle>) => setF((p) => ({ ...p, text_styles: { ...p.text_styles, [id]: { ...(p.text_styles as Record<string, TextStyle>)[id], ...patch } } }));
  const resetTS = (id: string) => setF((p) => { const n = { ...p.text_styles } as Record<string, TextStyle>; delete n[id]; return { ...p, text_styles: n }; });

  const NAV: { id: Sec; icon: typeof PaletteIcon; label: string; desc: string }[] = [
    { id: "style", icon: LayoutTemplate, label: pt ? "Estilo" : "Style", desc: pt ? "Modelos prontos" : "Ready-made looks" },
    { id: "colors", icon: Droplet, label: pt ? "Cores" : "Colours", desc: pt ? "Principal, fundo, destaque" : "Main, background, accent" },
    { id: "type", icon: Type, label: pt ? "Tipografia" : "Typography", desc: pt ? "Letra do menu" : "Menu font" },
    { id: "images", icon: ImageIcon, label: pt ? "Imagens" : "Images", desc: pt ? "Logótipo e capa" : "Logo and cover" },
    { id: "text", icon: TextCursorInput, label: pt ? "Texto" : "Text", desc: pt ? "Ajustes por secção" : "Per-section tweaks" },
  ];
  const cur = NAV.find((n) => n.id === sec)!;

  return (
    <div>
      <PageTitle icon={PaletteIcon} title={t("design.title")} action={
        <div className="flex items-center gap-2">
          {dirty && <Button variant="ghost" size="sm" onClick={() => setF(init)} className="gap-1.5 text-muted-foreground"><RotateCcw className="h-3.5 w-3.5" />{pt ? "Descartar" : "Discard"}</Button>}
          <Button size="sm" onClick={save} disabled={!!busy || !dirty} className="gap-1.5">{busy === "save" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}{t("common.save")}</Button>
        </div>} />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border bg-card p-1 shadow-sm" role="tablist">
          {([["menu", UtensilsCrossed, pt ? "Menu digital" : "Digital menu"], ["reservas", CalendarDays, pt ? "Página de reservas" : "Booking page"]] as const).map(([id, Ic, l]) => (
            <button key={id} role="tab" aria-selected={target === id} onClick={() => setTarget(id)} className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${target === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Ic className="h-4 w-4" />{l}</button>
          ))}
        </div>
        {dirty && <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />{pt ? "Alterações por guardar" : "Unsaved changes"}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[200px_1fr_300px]">
        <nav className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => setSec(n.id)} className={`group flex shrink-0 items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${sec === n.id ? "border-primary/30 bg-card shadow-sm" : "border-transparent hover:bg-card/70"}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors ${sec === n.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}><n.icon className="h-4 w-4" /></span>
              <span className="min-w-0"><span className="block text-sm font-medium">{n.label}</span><span className="hidden truncate text-[11px] text-muted-foreground lg:block">{n.desc}</span></span>
            </button>
          ))}
        </nav>

        <section key={sec + target} className="dash-card animate-in fade-in-0 slide-in-from-bottom-1 rounded-2xl border bg-card p-5 duration-300">
          <div className="mb-4 flex items-center gap-2.5 border-b pb-3">
            <cur.icon className="h-4 w-4 text-primary" />
            <div><h2 className="text-sm font-semibold">{cur.label}</h2><p className="text-xs text-muted-foreground">{cur.desc}</p></div>
          </div>

          {sec === "style" && (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {TEMPLATES.map((tp) => {
                const on = f.template === tp.id;
                return (
                  <button key={tp.id} onClick={() => setF({ ...f, template: tp.id, primary_color: tp.primary, background_color: tp.bg, accent_color: tp.accent, font: tp.font })} className={`group relative overflow-hidden rounded-xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${on ? "border-primary ring-2 ring-primary/20" : ""}`}>
                    <div className="flex h-20 flex-col justify-end gap-1 p-3" style={{ background: tp.bg, color: tp.primary, fontFamily: FONTS.find((x) => x.id === tp.font)?.css }}>
                      <span className="text-lg leading-none">Aa</span>
                      <span className="h-1 w-10 rounded-full" style={{ background: tp.accent }} />
                    </div>
                    <div className="flex items-center justify-between border-t px-3 py-2">
                      <span className="text-sm font-medium">{tp[lang]}</span>
                      {on ? <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3 w-3" /></span> : <span className="flex -space-x-1">{[tp.primary, tp.bg, tp.accent].map((c, i) => <span key={i} className="h-3.5 w-3.5 rounded-full border-2 border-card" style={{ background: c }} />)}</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {sec === "colors" && (
            <div className="space-y-2.5">
              {([["primary_color", t("design.primary"), pt ? "Texto e títulos" : "Text and titles"], ["background_color", t("design.bg"), pt ? "Fundo da página" : "Page background"], ["accent_color", t("design.accent"), pt ? "Botões e realces" : "Buttons and highlights"]] as const).map(([k, l, d]) => (
                <ColorRow key={k} label={l} desc={d} value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} />
              ))}
            </div>
          )}

          {sec === "type" && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONTS.map((x) => {
                const on = f.font === x.id;
                return (
                  <button key={x.id} onClick={() => setF({ ...f, font: x.id })} className={`relative rounded-xl border px-3 py-3 text-left transition-all hover:border-primary/40 ${on ? "border-primary bg-secondary/60 ring-2 ring-primary/15" : ""}`}>
                    <span className="block text-2xl leading-none" style={{ fontFamily: x.css }}>Aa</span>
                    <span className="mt-1.5 block text-xs text-muted-foreground">{x.label}</span>
                    {on && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {sec === "images" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Upload2 label={t("f.logo")} hint="PNG · SVG" value={f.logo_url} contain loading={busy === "logo_url"} onFile={(fl) => up("logo_url", fl)} onRemove={() => setF({ ...f, logo_url: "" })} />
                <Upload2 label={t("f.cover")} hint="JPG · 1600×600" value={f.cover_url} loading={busy === "cover_url"} onFile={(fl) => up("cover_url", fl)} onRemove={() => setF({ ...f, cover_url: "" })} />
              </div>
              {!f.cover_url && (
                <div className="rounded-xl border p-3">
                  <p className="text-sm font-medium">{pt ? "Cor de fundo da capa" : "Cover background colour"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => setF({ ...f, cover_color: "" })} title={pt ? "Sem cor" : "No colour"} className={`grid h-8 w-8 place-items-center rounded-full border text-muted-foreground ${!f.cover_color ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}><Ban className="h-4 w-4" /></button>
                    {[f.primary_color, f.accent_color, f.background_color].map((c, i) => (
                      <button key={i} type="button" onClick={() => setF({ ...f, cover_color: c })} className={`h-8 w-8 rounded-full border ${f.cover_color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`} style={{ background: c }} />
                    ))}
                    <label className="relative grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full border bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]" title={pt ? "Personalizada" : "Custom"}>
                      <input type="color" value={f.cover_color || "#18352b"} onChange={(e) => setF({ ...f, cover_color: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
                    </label>
                    {f.cover_color && <span className="font-mono text-xs text-muted-foreground">{f.cover_color}</span>}
                  </div>
                </div>
              )}
            </div>
          )}

          {sec === "text" && (
            <div className="divide-y rounded-xl border">
              {sections.map((s) => {
                const v = (f.text_styles as Record<string, TextStyle>)[s.id] ?? {};
                const open = openTS === s.id;
                const custom = !!f.text_styles[s.id];
                return (
                  <div key={s.id}>
                    <button type="button" onClick={() => setOpenTS(open ? null : s.id)} className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-muted/40">
                      <span className="flex items-center gap-2 text-sm" style={textStyle(f.text_styles, s.id)}>{s[lang]}</span>
                      <span className="flex items-center gap-2">{custom && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">{pt ? "personalizado" : "custom"}</span>}<span className={`text-muted-foreground transition-transform ${open ? "rotate-45" : ""}`}>+</span></span>
                    </button>
                    {open && (
                      <div className="grid animate-in fade-in-0 grid-cols-2 gap-2 px-3 pb-3 sm:grid-cols-4">
                        <select value={v.font ?? ""} onChange={(e) => setTS(s.id, { font: e.target.value || undefined })} className="h-9 rounded-lg border bg-background px-2 text-sm">
                          <option value="">{pt ? "Letra padrão" : "Default font"}</option>
                          {FONTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                        </select>
                        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border px-2 text-sm">
                          <span className="relative h-5 w-5 overflow-hidden rounded-full border" style={{ background: v.color ?? f.primary_color }}><input type="color" value={v.color ?? f.primary_color} onChange={(e) => setTS(s.id, { color: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" /></span>
                          <span className="text-xs text-muted-foreground">{v.color ?? (pt ? "Cor padrão" : "Default")}</span>
                        </label>
                        <select value={v.size ?? ""} onChange={(e) => setTS(s.id, { size: e.target.value ? Number(e.target.value) : undefined })} className="h-9 rounded-lg border bg-background px-2 text-sm">
                          <option value="">{pt ? "Tamanho padrão" : "Default size"}</option>
                          {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36].map((n) => <option key={n} value={n}>{n} px</option>)}
                        </select>
                        <div className="flex h-9 overflow-hidden rounded-lg border text-xs">
                          {([["", "—"], ["1", "AA"], ["0", "Aa"]] as const).map(([val, l]) => {
                            const curV = v.upper === undefined ? "" : v.upper ? "1" : "0";
                            return <button key={val} type="button" onClick={() => setTS(s.id, { upper: val === "" ? undefined : val === "1" })} className={`flex-1 ${curV === val ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{l}</button>;
                          })}
                        </div>
                        {custom && <button type="button" onClick={() => resetTS(s.id)} className="col-span-full flex items-center gap-1 justify-self-start text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="h-3 w-3" />{pt ? "Repor padrão" : "Reset"}</button>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="lg:sticky lg:top-6 lg:h-fit">
          <p className="mb-2 flex items-center justify-center gap-1.5 text-xs text-muted-foreground"><Smartphone className="h-3.5 w-3.5" />{pt ? "Pré-visualização em tempo real" : "Live preview"}</p>
          <div className="mx-auto w-full max-w-[280px] rounded-[2.2rem] border-[6px] border-foreground/85 bg-foreground/85 shadow-xl">
            <div className="relative h-[520px] overflow-y-auto rounded-[1.7rem] transition-colors duration-300" style={{ background: f.background_color, color: f.primary_color, fontFamily: FONTS.find((x) => x.id === f.font)?.css }}>
              <div className="absolute left-1/2 top-1.5 z-10 h-4 w-16 -translate-x-1/2 rounded-full bg-foreground/85" />
              {target === "reservas" ? <BookingPreview f={f} name={r.name} pt={pt} /> : <MenuPreview f={f} name={r.name} pt={pt} />}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

type F = { primary_color: string; background_color: string; accent_color: string; logo_url: string; cover_url: string; cover_color: string; text_styles: TextStyles };

function Cover({ f, name }: { f: F; name: string }) {
  return (
    <div className="flex h-32 items-center justify-center bg-cover bg-center transition-all" style={{ backgroundImage: f.cover_url ? `url(${f.cover_url})` : undefined, backgroundColor: f.cover_url ? undefined : f.cover_color || undefined }}>
      {f.logo_url ? <img src={f.logo_url} alt="" className="h-16 w-auto max-w-[70%] object-contain" /> : <p className="px-4 pt-4 text-center text-2xl" style={textStyle(f.text_styles, "name")}>{name}</p>}
    </div>
  );
}

function MenuPreview({ f, name, pt }: { f: F; name: string; pt: boolean }) {
  const s = (id: Parameters<typeof textStyle>[1]) => textStyle(f.text_styles, id);
  const P = f.primary_color, B = f.background_color, A = f.accent_color;
  const line = (o: number) => `color-mix(in srgb, ${P} ${o}%, transparent)`;
  const cats = pt ? ["Entradas", "Pratos", "Sobremesas"] : ["Starters", "Mains", "Desserts"];
  const dishes = pt ? [["Bruschetta", "Tomate, manjericão e azeite"], ["Burrata", "Rúcula e pesto"], ["Polvo", "Batata a murro"], ["Croquetes", "Com mostarda"]] : [["Bruschetta", "Tomato, basil, olive oil"], ["Burrata", "Rocket and pesto"], ["Octopus", "Crushed potatoes"], ["Croquettes", "With mustard"]];
  return (
    <div>
      {f.logo_url ? <Cover f={f} name={name} /> : f.cover_url ? <img src={f.cover_url} alt="" className="h-28 w-full object-cover" /> : f.cover_color ? <div className="h-14" style={{ background: f.cover_color }} /> : <div className="h-6" />}
      <div className="px-4 pt-3">
        <div className={`flex items-start gap-2 ${f.logo_url ? "justify-end" : "justify-between"}`}>
          {!f.logo_url && <p className="text-2xl leading-tight" style={s("name")}>{name}</p>}
          <span className="shrink-0 pt-1 text-[10px] font-semibold">PT <span className="opacity-40">|</span> <span className="opacity-50">EN</span></span>
        </div>
        <div className="mt-3 flex gap-1.5" style={s("menus")}>
          <span className="rounded-full border px-2.5 py-0.5 text-[10px]" style={{ background: P, borderColor: P, color: B }}>{pt ? "Almoço" : "Lunch"}</span>
          <span className="rounded-full border px-2.5 py-0.5 text-[10px]" style={{ borderColor: line(30) }}>{pt ? "Jantar" : "Dinner"}</span>
        </div>
      </div>
      <div className="sticky top-0 z-[5] mt-3 flex items-center gap-2 border-y px-2 py-1.5 backdrop-blur" style={{ borderColor: line(15), background: `color-mix(in srgb, ${B} 95%, transparent)` }}>
        <Search className="h-3.5 w-3.5 shrink-0" />
        <div className="flex min-w-0 flex-1 gap-3 overflow-hidden text-[9px] font-semibold uppercase tracking-wider" style={s("nav")}>{cats.map((c) => <span key={c} className="opacity-70">{c}</span>)}</div>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border" style={{ borderColor: line(30) }}><CalendarDays className="h-3 w-3" /></span>
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border" style={{ borderColor: line(30) }}><Phone className="h-3 w-3" /></span>
      </div>
      <div className="px-4 pb-6">
        <p className="pt-4 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: A, ...s("featured") }}>{pt ? "Recomendados" : "Recommended"}</p>
        <div className="mt-2 flex gap-2 overflow-hidden">{dishes.slice(0, 3).map(([n]) => <div key={n} className="w-24 shrink-0"><div className="aspect-[4/3] w-full rounded" style={{ background: line(10) }} /><p className="mt-1 text-[11px] font-semibold leading-tight">{n}</p></div>)}</div>
        <p className="pt-5 text-lg" style={s("category")}>{cats[0]}</p>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-5">
          {dishes.map(([n, d], i) => (
            <div key={n}>
              <div className="grid aspect-square w-full place-items-center rounded text-2xl" style={{ background: line(6) }}><span className="opacity-40">{n.charAt(0)}</span></div>
              <p className="mt-1.5 text-xs font-semibold leading-snug" style={s("dish")}>{n}</p>
              <p className="mt-0.5 line-clamp-2 text-[10px] opacity-70" style={s("description")}>{d}</p>
              <div className="mt-1 flex items-center justify-between text-xs" style={s("price")}>
                {i === 1 ? <span><span className="font-semibold" style={{ color: A }}>9,50</span> <span className="text-[10px] line-through opacity-50">11,00</span></span> : <span>{7 + i},50</span>}
                <span className="grid h-5 w-5 place-items-center rounded-full" style={{ background: A, color: B }}><Plus className="h-3 w-3" /></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BookingPreview({ f, name, pt }: { f: F; name: string; pt: boolean }) {
  const s = (id: Parameters<typeof textStyle>[1]) => textStyle(f.text_styles, id);
  const btn = { background: f.accent_color || f.primary_color, color: f.background_color, ...s("bk_button") };
  return (
    <div>
      <Cover f={f} name={name} />
      <div className="p-4">
        <p className="text-center text-sm opacity-80" style={s("bk_title")}>{pt ? "Reservar mesa" : "Book a table"}</p>
        <div className="mt-3 space-y-3 rounded-xl border p-3" style={{ borderColor: f.primary_color + "22" }}>
          <p className="text-xs font-medium" style={s("bk_label")}>{pt ? "Quantas pessoas?" : "How many people?"}</p>
          <div className="grid grid-cols-4 gap-1.5">{[1, 2, 3, 4].map((n) => <span key={n} className="rounded-lg border py-1.5 text-center text-sm" style={n === 2 ? btn : { borderColor: f.primary_color + "33" }}>{n}</span>)}</div>
          <p className="text-xs font-medium" style={s("bk_label")}>{pt ? "Hora" : "Time"}</p>
          <div className="grid grid-cols-3 gap-1.5">{["19:30", "20:00", "20:30"].map((h, i) => <span key={h} className="rounded-lg border py-1.5 text-center text-xs" style={i === 1 ? btn : { borderColor: f.primary_color + "33" }}>{h}</span>)}</div>
          <div className="rounded-lg py-2 text-center text-sm" style={btn}>{pt ? "Ver horários" : "See times"}</div>
        </div>
      </div>
    </div>
  );
}

function ColorRow({ label, desc, value, onChange }: { label: string; desc: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border p-2.5 transition-colors hover:border-primary/30">
      <label className="relative h-10 w-10 shrink-0 cursor-pointer overflow-hidden rounded-lg border shadow-inner" style={{ background: value }}>
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" aria-label={label} />
      </label>
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{desc}</p></div>
      <input value={value} onChange={(e) => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} className="h-8 w-24 rounded-lg border bg-background px-2 text-center font-mono text-xs uppercase" />
    </div>
  );
}

function Upload2({ label, hint, value, contain, loading, onFile, onRemove }: { label: string; hint: string; value: string; contain?: boolean; loading: boolean; onFile: (f?: File) => void; onRemove: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = (fl?: FileList | null) => { onFile(fl?.[0]); if (ref.current) ref.current.value = ""; };
  let body: ReactNode;
  if (loading) body = <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  else if (value) body = <img src={value} alt="" className={`h-full w-full ${contain ? "object-contain p-3" : "object-cover"}`} />;
  else body = <><span className="grid h-9 w-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground"><Upload className="h-4 w-4" /></span><span className="text-[11px] text-muted-foreground">{hint}</span></>;
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="group relative">
        <button type="button" disabled={loading} onClick={() => ref.current?.click()} onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files); }}
          className={`flex h-28 w-full flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl border transition-all ${value ? "bg-muted/30" : "border-dashed hover:border-primary/50 hover:bg-muted/30"} ${drag ? "border-primary bg-secondary" : ""}`}>
          {body}
        </button>
        {value && !loading && (
          <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
            <button type="button" onClick={() => ref.current?.click()} className="grid h-7 w-7 place-items-center rounded-full border bg-card shadow-sm hover:text-primary" aria-label="Substituir"><Upload className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-full border bg-card shadow-sm hover:text-destructive" aria-label="Remover"><X className="h-3.5 w-3.5" /></button>
          </div>
        )}
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files)} />
      </div>
    </div>
  );
}
