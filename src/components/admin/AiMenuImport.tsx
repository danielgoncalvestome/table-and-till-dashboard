import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImagePlus, Loader2, Sparkles, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { analyzeMenuImages, createImportedMenu, type ImportedMenu } from "@/utils/menu-import.functions";

async function toDataUrl(file: File, max = 1600): Promise<string> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.82);
}

export function AiMenuImport({ restaurants }: { restaurants: { id: string; name: string }[] }) {
  const analyze = useServerFn(analyzeMenuImages);
  const create = useServerFn(createImportedMenu);
  const qc = useQueryClient();
  const [rid, setRid] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [menu, setMenu] = useState<ImportedMenu | null>(null);
  const [busy, setBusy] = useState<"" | "read" | "save">("");
  const [drag, setDrag] = useState(false);

  async function add(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    const urls = await Promise.all(list.map((f) => toDataUrl(f)));
    setImages((p) => [...p, ...urls].slice(0, 20)); setMenu(null);
  }
  async function run() {
    setBusy("read");
    try { setMenu(await analyze({ data: { images } })); } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  }
  async function save() {
    if (!menu || !rid) return;
    setBusy("save");
    try {
      const r = await create({ data: { restaurantId: rid, menu, images } });
      toast.success(`Menu criado com ${r.dishes} pratos`);
      setImages([]); setMenu(null); qc.invalidateQueries();
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(""); }
  }
  const upd = (fn: (m: ImportedMenu) => void) => setMenu((m) => { if (!m) return m; const c = structuredClone(m); fn(c); return c; });
  const total = menu?.categories.reduce((a, c) => a + c.dishes.length, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Gerar menu com IA</h2>
        <p className="mb-4 text-xs text-muted-foreground">Envia fotos do menu (com preços) e fotos dos pratos. A IA segue os preços tabelados e junta as fotos do mesmo prato como imagens secundárias.</p>
        <Label htmlFor="ai-rest">Restaurante</Label>
        <select id="ai-rest" value={rid} onChange={(e) => setRid(e.target.value)} className="mt-1 mb-4 h-10 w-full rounded-md border bg-background px-3 text-sm">
          <option value="">Escolher restaurante…</option>
          {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <label onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center text-sm transition ${drag ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"}`}>
          <ImagePlus className="h-6 w-6 text-muted-foreground" />
          <span>Arrasta as imagens ou clica para escolher (até 20)</span>
          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && add(e.target.files)} />
        </label>
        {images.length > 0 && <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((src, i) => <div key={i} className="relative aspect-square overflow-hidden rounded-xl border">
            <img src={src} alt={`Imagem ${i + 1}`} className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded bg-background/80 px-1 text-[10px] font-bold">{i + 1}</span>
            <button aria-label="Remover imagem" onClick={() => { setImages((p) => p.filter((_, k) => k !== i)); setMenu(null); }} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-background/90"><X className="h-3 w-3" /></button>
          </div>)}
        </div>}
        <Button className="mt-4" disabled={!images.length || !!busy} onClick={run}>{busy === "read" ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy === "read" ? "A ler imagens…" : "Ler com IA"}</Button>
      </div>

      {menu && <div className="rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5">
        <div className="mb-3 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1"><Label>Nome do menu</Label><Input value={menu.menuName} onChange={(e) => upd((m) => { m.menuName = e.target.value; })} /></div>
          <span className="text-xs text-muted-foreground">{menu.categories.length} categorias · {total} pratos</span>
        </div>
        <div className="space-y-4">
          {menu.categories.map((c, ci) => <div key={ci} className="rounded-xl border p-3">
            <Input className="mb-2 font-semibold" value={c.name} onChange={(e) => upd((m) => { m.categories[ci].name = e.target.value; })} />
            <ul className="space-y-2">
              {c.dishes.map((d, di) => <li key={di} className="grid grid-cols-[auto_1fr_auto_auto] items-start gap-2">
                <div className="flex w-14 flex-wrap gap-0.5">
                  {d.images.length ? d.images.map((ix, k) => <img key={ix} src={images[ix]} alt="" className={`${k === 0 ? "h-14 w-14" : "h-6 w-6"} rounded-md object-cover`} />) : <div className="h-14 w-14 rounded-md bg-muted" />}
                </div>
                <div className="min-w-0 space-y-1">
                  <Input value={d.name} onChange={(e) => upd((m) => { m.categories[ci].dishes[di].name = e.target.value; })} />
                  <Input value={d.description} placeholder="Descrição" className="text-xs" onChange={(e) => upd((m) => { m.categories[ci].dishes[di].description = e.target.value; })} />
                </div>
                <Input type="number" step="0.01" min="0" className="w-24" aria-label="Preço" value={d.price} onChange={(e) => upd((m) => { m.categories[ci].dishes[di].price = Number(e.target.value); })} />
                <button aria-label="Remover prato" onClick={() => upd((m) => { m.categories[ci].dishes.splice(di, 1); })} className="mt-2 text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </li>)}
            </ul>
          </div>)}
        </div>
        <Button className="mt-4" disabled={!rid || !!busy || !total} onClick={save}>{busy === "save" && <Loader2 className="animate-spin" />}{rid ? "Criar menu no restaurante" : "Escolhe um restaurante"}</Button>
      </div>}
    </div>
  );
}
