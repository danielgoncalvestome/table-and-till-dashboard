import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Phone, Instagram, Star, Search, X, MapPin, Clock, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Lang } from "@/lib/i18n";
import { ALLERGENS, DIETARY, FONTS, formatPrice, getRaterId, isMenuActive, labelOf, track, tr } from "@/lib/menu";
import logoDark from "@/assets/menutap-logo.png.asset.json";
import logoLight from "@/assets/menutap-logo-light.png.asset.json";

const HERO_H = 140;

export const Route = createFileRoute("/r/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Menu — ${params.slug} · MenuTap` },
      { name: "description", content: "Menu digital no MenuTap." },
      { property: "og:title", content: `Menu digital · MenuTap` },
      { property: "og:description", content: "Veja o menu, preços, alergénios e recomendações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PublicMenu,
});

const UI = {
  pt: { search: "Pesquisar no menu", featured: "Recomendados", allergens: "Alergénios", pairs: "Sugestões", sold: "Esgotado", hours: "Horário", rate: "A sua avaliação", ratings: "avaliações", thanks: "Obrigado!", none: "Sem resultados.", demo: "Restaurante de demonstração — conteúdo fictício", note: "Informação fornecida pelo restaurante. Em caso de alergia, confirme com a equipa.", unverified: "Alergénios por confirmar com o restaurante", notFound: "Menu não encontrado ou não publicado.", prep: "min", call: "Ligar", reviews: "Avaliações Google" },
  en: { search: "Search the menu", featured: "Recommended", allergens: "Allergens", pairs: "Suggestions", sold: "Sold out", hours: "Opening hours", rate: "Your rating", ratings: "ratings", thanks: "Thank you!", none: "No results.", demo: "Demo restaurant — fictional content", note: "Information provided by the restaurant. If you have an allergy, please check with staff.", unverified: "Allergens to be confirmed with the restaurant", notFound: "Menu not found or not published.", prep: "min", call: "Call", reviews: "Google reviews" },
};

async function loadMenu(slug: string) {
  const { data: r } = await supabase.from("restaurants").select("*").eq("slug", slug).maybeSingle(); // RLS: anon sees published only; members can preview drafts
  if (!r) return null;
  const [menus, cats, dishes, recs, ratings] = await Promise.all([
    supabase.from("menus").select("*").eq("restaurant_id", r.id).eq("published", true).order("position"),
    supabase.from("categories").select("*").eq("restaurant_id", r.id).order("position"),
    supabase.from("dishes").select("*").eq("restaurant_id", r.id).eq("archived", false).order("position"),
    supabase.from("recommendations").select("*").eq("restaurant_id", r.id),
    supabase.rpc("dish_rating_summary", { _restaurant_id: r.id }),
  ]);
  return { r, menus: menus.data ?? [], cats: cats.data ?? [], dishes: dishes.data ?? [], recs: recs.data ?? [], ratings: ratings.data ?? [] };
}
type Data = NonNullable<Awaited<ReturnType<typeof loadMenu>>>;
type Dish = Data["dishes"][number];

function isDarkColor(hex?: string | null) {
  const h = (hex ?? "").replace("#", "");
  if (h.length < 6) return false;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.45;
}

function GoogleG() {
  return <span className="text-sm font-bold">G</span>;
}

function PublicMenu() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["public-menu", slug], queryFn: () => loadMenu(slug), refetchInterval: 60_000 });
  const [lang, setLang] = useState<Lang>("pt");
  const [menuId, setMenuId] = useState<string | null>(null);
  const heroH = HERO_H;
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Dish | null>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (!data) return;
    const saved = localStorage.getItem("mt-menu-lang");
    const browser = navigator.language.slice(0, 2);
    const pick = (saved && data.r.languages.includes(saved) ? saved : data.r.languages.includes(browser) ? browser : "pt") as Lang;
    setLang(pick === "en" ? "en" : "pt");
    if (!tracked.current) {
      tracked.current = true;
      const src = new URLSearchParams(window.location.search).get("src") ?? undefined;
      track(data.r.id, "menu_view", { lang: pick, source: src });
    }
  }, [data]);

  const activeMenu = useMemo(() => {
    if (!data) return null;
    if (menuId) return data.menus.find((m) => m.id === menuId) ?? null;
    return data.menus.find((m) => isMenuActive(m)) ?? data.menus[0] ?? null;
  }, [data, menuId]);

  useEffect(() => {
    if (!q || !data) return;
    const h = setTimeout(() => track(data.r.id, "search", { query: q, lang }), 900);
    return () => clearTimeout(h);
  }, [q, data, lang]);

  if (isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">…</div>;
  if (!data) return <div className="grid min-h-screen place-items-center px-6 text-center text-muted-foreground">{UI.pt.notFound} / {UI.en.notFound}</div>;

  const { r } = data;
  const u = UI[lang];
  const font = FONTS.find((f) => f.id === r.font)?.css ?? FONTS[0].css;
  const style = { "--m-primary": r.primary_color, "--m-bg": r.background_color, "--m-accent": r.accent_color, "--m-font": font } as React.CSSProperties;
  const ratingOf = (id: string) => data.ratings.find((x) => x.dish_id === id);
  const cats = data.cats.filter((c) => c.menu_id === activeMenu?.id);
  const ql = q.trim().toLowerCase();
  const dishesOf = (cid: string) =>
    data.dishes.filter((d) => d.category_id === cid && (!ql || tr(d.name, d.name_i18n, lang).toLowerCase().includes(ql) || tr(d.description, d.description_i18n, lang).toLowerCase().includes(ql)));
  const featured = data.dishes.filter((d) => d.featured && cats.some((c) => c.id === d.category_id));

  function openDish(d: Dish) {
    setOpen(d);
    track(r.id, "dish_view", { dish_id: d.id, lang });
    data!.recs.filter((x) => x.dish_id === d.id).forEach((x) => track(r.id, "rec_impression", { dish_id: x.recommended_dish_id, lang }));
  }
  function changeLang(l: Lang) {
    setLang(l);
    localStorage.setItem("mt-menu-lang", l);
    track(r.id, "language_change", { lang: l });
  }

  return (
    <div style={style} className="min-h-screen bg-[var(--m-bg)] text-[var(--m-primary)]">
      {r.is_demo && <div className="bg-[var(--m-primary)] py-1.5 text-center text-xs text-[var(--m-bg)]">{u.demo}</div>}
      {r.logo_url && (
        <div className="sticky top-0 z-20 flex items-center justify-center overflow-hidden bg-cover bg-center"
          style={{ height: heroH, backgroundImage: r.cover_url ? `url(${r.cover_url})` : undefined, backgroundColor: r.cover_url ? undefined : (r.cover_color ?? "var(--m-bg)") }}>
          <img src={r.logo_url} alt={r.name} className="w-auto max-w-[80%] object-contain" style={{ height: heroH - 24 }} />
        </div>
      )}
      <header>
        {!r.logo_url && r.cover_url && <img src={r.cover_url} alt="" className="h-48 w-full object-cover md:h-72" />}
        {!r.logo_url && !r.cover_url && r.cover_color && <div className="h-24 w-full" style={{ background: r.cover_color }} />}
        <div className="mx-auto max-w-4xl px-5 pt-5">
          <div className={`flex items-start gap-4 ${r.logo_url ? "justify-end" : "justify-between"}`}>
            {!r.logo_url && <h1 className="text-3xl md:text-4xl" style={{ fontFamily: "var(--m-font)" }}>{r.name}</h1>}
            <div className="flex shrink-0 items-center gap-1 text-xs font-semibold">
              {r.languages.filter((l) => l === "pt" || l === "en").map((l, i) => (
                <span key={l}>{i > 0 && <span className="opacity-40"> | </span>}<button onClick={() => changeLang(l as Lang)} className={lang === l ? "underline underline-offset-4" : "opacity-50"}>{l.toUpperCase()}</button></span>
              ))}
            </div>
          </div>
          {r.description && <p className="mt-3 max-w-2xl text-sm opacity-80">{tr(r.description, r.description_i18n, lang)}</p>}
          {searchOpen && (
            <div className="mt-3 flex items-center gap-2 border-b border-[var(--m-primary)]/30 pb-2">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={u.search} className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-50" />
              {q && <button onClick={() => setQ("")} aria-label="Clear"><X className="h-4 w-4" /></button>}
            </div>
          )}
        </div>
      </header>

      {data.menus.length > 1 && (
        <div className="mx-auto mt-5 flex max-w-4xl gap-2 overflow-x-auto px-5">
          {data.menus.map((m) => (
            <button key={m.id} onClick={() => setMenuId(m.id)} className={`whitespace-nowrap rounded-full border px-3 py-1 text-xs ${activeMenu?.id === m.id ? "border-[var(--m-primary)] bg-[var(--m-primary)] text-[var(--m-bg)]" : "border-[var(--m-primary)]/30"}`}>
              {tr(m.name, m.name_i18n, lang)}
            </button>
          ))}
        </div>
      )}

      <nav style={{ top: r.logo_url ? HERO_H : 0 }} className="sticky z-10 mt-4 border-y border-[var(--m-primary)]/15 bg-[var(--m-bg)]/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-2 px-3 py-2">
          <button aria-label={u.search} onClick={() => setSearchOpen(!searchOpen)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full"><Search className="h-4 w-4" /></button>
          <div className="flex min-w-0 flex-1 gap-5 overflow-x-auto py-1 text-xs font-semibold uppercase tracking-wider">
            {cats.map((c) => (
              <a key={c.id} href={`#c-${c.id}`} onClick={() => track(r.id, "category_view", { category_id: c.id, lang })} className="whitespace-nowrap opacity-70 hover:opacity-100">{tr(c.name, c.name_i18n, lang)}</a>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {r.phone && <a href={`tel:${r.phone}`} aria-label={u.call} onClick={() => track(r.id, "call_click")} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--m-primary)]/30"><Phone className="h-4 w-4" /></a>}
            {r.google_reviews_url && <a href={r.google_reviews_url} target="_blank" rel="noreferrer" aria-label={u.reviews} onClick={() => track(r.id, "reviews_click")} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--m-primary)]/30"><GoogleG /></a>}
            {r.instagram_url && <a href={r.instagram_url} target="_blank" rel="noreferrer" aria-label="Instagram" onClick={() => track(r.id, "instagram_click")} className="grid h-8 w-8 place-items-center rounded-full border border-[var(--m-primary)]/30"><Instagram className="h-4 w-4" /></a>}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-5 pb-16">
        {!ql && featured.length > 0 && (
          <section className="pt-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--m-accent)]">{u.featured}</h2>
            <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {featured.map((d) => (
                <button key={d.id} onClick={() => openDish(d)} className="w-40 shrink-0 text-left">
                  {d.image_url ? <img src={d.image_url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded object-cover" /> : <div className="aspect-[4/3] w-full rounded bg-[var(--m-primary)]/10" />}
                  <p className="mt-1 text-sm font-semibold leading-tight">{tr(d.name, d.name_i18n, lang)}</p>
                </button>
              ))}
            </div>
          </section>
        )}
        {cats.map((c) => {
          const list = dishesOf(c.id);
          if (ql && list.length === 0) return null;
          return (
            <section key={c.id} id={`c-${c.id}`} className="scroll-mt-14 pt-8">
              <h2 className="text-2xl" style={{ fontFamily: "var(--m-font)" }}>{tr(c.name, c.name_i18n, lang)}</h2>
              <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-8">
                {list.map((d) => {
                  const rt = ratingOf(d.id);
                  return (
                    <button key={d.id} onClick={() => openDish(d)} className={`text-left ${!d.available ? "opacity-50" : ""}`}>
                      {d.image_url ? <img src={d.image_url} alt={tr(d.name, d.name_i18n, lang)} loading="lazy" className="aspect-square w-full rounded object-cover" /> : <div className="grid aspect-square w-full place-items-center rounded bg-[var(--m-primary)]/[0.06] text-3xl opacity-40" style={{ fontFamily: "var(--m-font)" }}>{d.name.charAt(0)}</div>}
                      <p className="mt-2 text-sm font-semibold leading-snug">{tr(d.name, d.name_i18n, lang)}</p>
                      {d.description && <p className="mt-0.5 line-clamp-2 text-xs opacity-70">{tr(d.description, d.description_i18n, lang)}</p>}
                      <div className="mt-1 flex items-center justify-between gap-2 text-sm">
                        <span>
                          {d.promo_price != null ? (<><span className="font-semibold text-[var(--m-accent)]">{noEuro(formatPrice(d.promo_price, lang))}</span> <s className="text-xs opacity-50">{noEuro(formatPrice(d.price, lang))}</s></>) : noEuro(formatPrice(d.price, lang))}
                        </span>
                        {!d.available ? <span className="text-[10px] font-semibold uppercase">{u.sold}</span> : rt ? <span className="flex items-center gap-0.5 text-xs opacity-80"><Star className="h-3 w-3 fill-star text-star" />{Number(rt.avg_stars).toFixed(1)}</span> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
        {ql && cats.every((c) => dishesOf(c.id).length === 0) && <p className="pt-10 text-center text-sm opacity-60">{u.none}</p>}

        {(r.opening_hours || r.phone || r.email || r.address) && (
          <footer className="mt-16 border-t border-[var(--m-primary)]/15 pt-6 text-sm opacity-80">
            {r.address && <p className="mb-1 flex items-center gap-2"><MapPin className="h-4 w-4" />{r.address}</p>}
            {r.opening_hours && <p className="flex items-center gap-2"><Clock className="h-4 w-4" />{r.opening_hours}</p>}
            {r.phone && <p className="mt-1">{r.phone}</p>}
            {r.email && <p className="mt-1">{r.email}</p>}
            <img
              src={isDarkColor(r.background_color) ? logoLight.url : logoDark.url}
              alt="MenuTap"
              className="mt-6 h-4 w-auto opacity-60"
            />
          </footer>
        )}
      </main>

      {open && (
        <div style={style} className="fixed inset-0 z-50 overflow-y-auto bg-[var(--m-bg)] text-[var(--m-primary)]" role="dialog" aria-modal="true">
          <DishDetail key={open.id} dish={open} data={data} lang={lang} onClose={() => setOpen(null)} onOpen={(d) => { track(r.id, "rec_click", { dish_id: d.id, lang }); openDish(d); }} onRated={() => qc.invalidateQueries({ queryKey: ["public-menu", slug] })} />
        </div>
      )}
    </div>
  );
}

function DishDetail({ dish: d, data, lang, onOpen, onRated, onClose }: { dish: Dish; data: Data; lang: Lang; onOpen: (d: Dish) => void; onRated: () => void; onClose: () => void }) {
  const u = UI[lang];
  const rt = data.ratings.find((x) => x.dish_id === d.id);
  const [mine, setMine] = useState<number | null>(null);
  const [hover, setHover] = useState(0);
  const [done, setDone] = useState(false);
  const top = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const v = localStorage.getItem(`mt-rate-${d.id}`);
    setMine(v ? Number(v) : null);
    setDone(false);
    top.current?.parentElement?.scrollTo({ top: 0 });
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeRef.current();
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [d.id]);
  const recs = data.recs.filter((x) => x.dish_id === d.id).map((x) => ({ rec: x, dish: data.dishes.find((y) => y.id === x.recommended_dish_id) })).filter((x) => x.dish);
  const desc = tr(d.long_description, d.long_description_i18n, lang) || tr(d.description, d.description_i18n, lang);
  const ingredients = tr(d.ingredients, d.ingredients_i18n, lang);
  const gallery = (d.gallery ?? []).filter(Boolean);

  async function rate(n: number) {
    setMine(n);
    localStorage.setItem(`mt-rate-${d.id}`, String(n));
    const { error } = await supabase.rpc("rate_dish", { _dish_id: d.id, _session_id: getRaterId(), _stars: n });
    if (!error) { setDone(true); onRated(); }
  }

  return (
    <div ref={top}>
      <button onClick={onClose} aria-label="Voltar" className="fixed left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/40 text-white backdrop-blur"><ChevronLeft className="h-5 w-5" /></button>
      <section className="w-full bg-[var(--m-primary)]">
        <div className="mx-auto max-w-3xl px-6 pb-5 pt-16 text-white">
          <h2 className="text-3xl font-bold leading-tight md:text-5xl" style={{ fontFamily: "var(--m-font)" }}>{tr(d.name, d.name_i18n, lang)}</h2>
          <p className="mt-1 text-lg leading-tight">
            {d.promo_price != null ? (<><span className="font-semibold">{noEuro(formatPrice(d.promo_price, lang))}</span> <s className="text-sm opacity-70">{noEuro(formatPrice(d.price, lang))}</s></>) : noEuro(formatPrice(d.price, lang))}
            {!d.available && <span className="ml-2 text-xs font-semibold uppercase">{u.sold}</span>}
          </p>
          {desc && <p className="mt-1.5 max-w-xl whitespace-pre-line text-sm leading-snug opacity-90">{desc}</p>}
          <div className="mt-2.5 flex items-center gap-3">
            <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} aria-label={`${n}`} onMouseEnter={() => setHover(n)} onClick={() => rate(n)}>
                  <Star className={`h-7 w-7 ${(hover || mine || 0) >= n ? "fill-star text-star" : "text-white/60"}`} />
                </button>
              ))}
            </div>
            {rt && <span className="text-xs opacity-90">{Number(rt.avg_stars).toFixed(1)} · {rt.total} {u.ratings}</span>}
          </div>
          {done && <p className="mt-1 text-xs opacity-90">{u.thanks}</p>}
        </div>
      </section>
      {d.image_url && <img src={d.image_url} alt={tr(d.name, d.name_i18n, lang)} className="block h-auto w-full" />}
      {gallery.map((g) => <img key={g} src={g} alt="" loading="lazy" className="block h-auto w-full" />)}

      <div className="mx-auto max-w-3xl px-6 py-10">
        {(d.dietary.length > 0 || d.prep_minutes || d.calories) && (
          <div className="flex flex-wrap gap-1.5">
            {d.dietary.map((x) => <span key={x} className="rounded-full border border-[var(--m-primary)]/25 px-2 py-0.5 text-[11px]">{labelOf(DIETARY, x, lang)}</span>)}
            {d.prep_minutes && <span className="rounded-full border border-[var(--m-primary)]/25 px-2 py-0.5 text-[11px]">{d.prep_minutes} {u.prep}</span>}
            {d.calories && <span className="rounded-full border border-[var(--m-primary)]/25 px-2 py-0.5 text-[11px]">{d.calories} kcal</span>}
          </div>
        )}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{u.allergens}</p>
          {d.allergens_verified ? (
            <p className="mt-1 text-sm">{d.allergens.length ? d.allergens.map((a) => labelOf(ALLERGENS, a, lang)).join(" · ") : "—"}</p>
          ) : (
            <p className="mt-1 text-sm italic opacity-70">{u.unverified}</p>
          )}
          <p className="mt-1 text-[11px] opacity-60">{u.note}</p>
        </div>
        {recs.length > 0 && (
          <div className="mt-6 border-t border-[var(--m-primary)]/15 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-70">{tr(recs[0].rec.label, recs[0].rec.label_i18n, lang) || u.pairs}</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {recs.map(({ dish }) => (
                <button key={dish!.id} onClick={() => onOpen(dish!)} className="flex items-center gap-2 text-left">
                  {dish!.image_url ? <img src={dish!.image_url} alt="" className="h-12 w-12 rounded object-cover" /> : <div className="h-12 w-12 rounded bg-[var(--m-primary)]/10" />}
                  <span className="text-sm leading-tight">{tr(dish!.name, dish!.name_i18n, lang)}<br /><span className="text-xs opacity-70">{noEuro(formatPrice(dish!.promo_price ?? dish!.price, lang))}</span></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {ingredients && (
          <p className="mt-10 text-xs leading-relaxed opacity-50">
            <span className="uppercase tracking-wider">{lang === "pt" ? "Ingredientes" : "Ingredients"}:</span> {ingredients}
          </p>
        )}
      </div>
    </div>
  );
}

const noEuro = (v: string) => v.replace(/\s*€\s*/g, "").trim();
