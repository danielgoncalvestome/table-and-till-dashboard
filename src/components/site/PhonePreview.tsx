import { Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/menu";
import omeletAsset from "@/assets/omelet-avocado-square.jpg.asset.json";
import eggsAsset from "@/assets/eggs-benedict-square.jpg.asset.json";

/** Static product illustration of the demo menu (Casa do Largo). */
export function PhonePreview() {
  const { lang } = useI18n();
  const dishes = [
    { img: omeletAsset.url, n: lang === "pt" ? "Tosta de abacate e ovo" : "Avocado toast & egg", p: 9.5 },
    { img: eggsAsset.url, n: lang === "pt" ? "Ovos Benedict" : "Eggs Benedict", p: 8.5 },
    { img: "/images/demo/nata.jpg", n: lang === "pt" ? "Croissant" : "Custard tart", p: 2.2 },
    { img: "/images/demo/cover.jpg", n: lang === "pt" ? "Vinho verde" : "Vinho verde", p: 4.5 },
  ];
  return (
    <div className="mx-auto w-[300px] rounded-[2.2rem] border-8 border-charcoal bg-cream shadow-2xl">
      <div className="overflow-hidden rounded-[1.6rem]">
        <img src="/images/demo/cover.jpg" alt="" width={1600} height={912} className="h-28 w-full object-cover" />
        <div className="px-4 pb-5 pt-3">
          <p className="font-display text-xl text-primary">Casa do Largo</p>
          <div className="mt-2 flex gap-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="text-primary">{lang === "pt" ? "Petiscos" : "Small plates"}</span>
            <span>{lang === "pt" ? "Pratos" : "Mains"}</span>
            <span>{lang === "pt" ? "Sobremesas" : "Desserts"}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {dishes.map((d) => (
              <div key={d.n}>
                <img src={d.img} alt="" width={816} height={816} className="aspect-square w-full rounded object-cover" />
                <p className="mt-1 text-[11px] font-semibold leading-tight">{d.n}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-primary">{formatPrice(d.p, lang)}</span>
                  <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Star className="h-2.5 w-2.5 fill-star text-star" />4.8</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
