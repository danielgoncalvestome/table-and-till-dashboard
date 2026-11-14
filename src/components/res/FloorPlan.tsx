import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Circle, Square, RectangleHorizontal, RotateCw, Copy, Trash2, Undo2, Redo2, ZoomIn, ZoomOut, Save, Users, Clock, Grid3x3, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/lib/restaurant";
import { canAccess } from "@/lib/team-rules";
import { useResData } from "./data";
import { hhmm, tableState, type ResStatus } from "@/lib/reservations";

type Item = { id: string; kind: "table" | "decor"; type: string; label: string; seats: number; x: number; y: number; w: number; h: number; rotation: number; color: string | null };
const DECOR = [["wall", "Parede", 200, 12], ["door", "Porta", 70, 12], ["window", "Janela", 100, 8], ["bar", "Balcão", 220, 50], ["pillar", "Pilar", 30, 30], ["plant", "Planta", 36, 36]] as const;
const STATE_BG = { free: "var(--st-free)", reserved: "var(--st-reserved)", seated: "var(--st-seated)", late: "var(--st-reserved)" } as const;
const STATE_LABEL = { free: "Livre", reserved: "Reservada", seated: "Ocupada", late: "Atrasada" } as const;

export function FloorPlan({ date, live: operational, onBook }: { date: string; live: boolean; onBook: (tableId: string) => void }) {
  const { restaurant } = useRestaurant();
  const canEditRoom = canAccess(restaurant.role, restaurant.permissions, "room_edit");
  const live = operational || !canEditRoom;
  const { r, zones, tables, res } = useResData(date);
  const qc = useQueryClient();
  const [zoneId, setZoneId] = useState<string>("");
  const zone = zones.find((z) => z.id === zoneId) ?? zones[0];
  const [items, setItems] = useState<Item[]>([]);
  const [size, setSize] = useState({ w: 1000, h: 700 });
  const [hist, setHist] = useState<{ past: Item[][]; future: Item[][] }>({ past: [], future: [] });
  const [sel, setSel] = useState<string[]>([]);
  const [zoom, setZoom] = useState(0.8);
  const [snap, setSnap] = useState(true);
  const [statusColors, setStatusColors] = useState(false);
  const [deleted, setDeleted] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const drag = useRef<{ mode: "move" | "resize"; sx: number; sy: number; orig: Item[] } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!zone || dirty) return;
    const t: Item[] = tables.filter((t) => t.zone_id === zone.id).map((t) => ({ id: t.id, kind: "table", type: t.shape, label: t.label, seats: t.seats, x: t.x, y: t.y, w: t.w, h: t.h, rotation: t.rotation, color: t.color }));
    const d = (Array.isArray(zone.decor) ? zone.decor : []) as Item[];
    setItems([...t, ...d.map((x) => ({ ...x, kind: "decor" as const }))]);
    setSize({ w: zone.width, h: zone.height });
  }, [zone?.id, zone?.decor, tables, dirty]);

  // fit to width on mount
  useEffect(() => { const w = box.current?.clientWidth; if (w && zone) setZoom(Math.min(1, Math.max(0.3, (w - 8) / zone.width))); }, [zone?.id]);

  if (!zones.length) return <p className="rounded-md border bg-card p-5 text-sm text-muted-foreground">Crie primeiro uma sala no separador «Mesas e zonas» para desenhar a planta.</p>;

  const commit = (next: Item[]) => { setHist((h) => ({ past: [...h.past.slice(-50), items], future: [] })); setItems(next); setDirty(true); };
  const undo = () => { const p = hist.past.at(-1); if (!p) return; setHist({ past: hist.past.slice(0, -1), future: [items, ...hist.future] }); setItems(p); };
  const redo = () => { const f = hist.future[0]; if (!f) return; setHist({ past: [...hist.past, items], future: hist.future.slice(1) }); setItems(f); };
  const g = (v: number) => (snap ? Math.round(v / 10) * 10 : Math.round(v));
  const selected = items.filter((i) => sel.includes(i.id));
  const update = (patch: Partial<Item>) => commit(items.map((i) => (sel.includes(i.id) ? { ...i, ...patch } : i)));

  function addTable(shape: string) {
    const n = items.filter((i) => i.kind === "table").length + 1;
    const w = shape === "rect" ? 140 : 80;
    commit([...items, { id: `new-${crypto.randomUUID()}`, kind: "table", type: shape, label: String(tables.length + n), seats: shape === "rect" ? 6 : 4, x: 40, y: 40, w, h: 80, rotation: 0, color: null }]);
  }
  function addDecor(type: string, w: number, h: number, label: string) {
    commit([...items, { id: crypto.randomUUID(), kind: "decor", type, label, seats: 0, x: 60, y: 60, w, h, rotation: 0, color: null }]);
  }
  function duplicate() {
    const copies = selected.map((i) => ({ ...i, id: i.kind === "table" ? `new-${crypto.randomUUID()}` : crypto.randomUUID(), x: i.x + 20, y: i.y + 20, label: i.kind === "table" ? `${i.label}b` : i.label }));
    commit([...items, ...copies]); setSel(copies.map((c) => c.id));
  }
  function remove() {
    setDeleted([...deleted, ...selected.filter((i) => i.kind === "table" && !i.id.startsWith("new-")).map((i) => i.id)]);
    commit(items.filter((i) => !sel.includes(i.id))); setSel([]);
  }
  async function save() {
    if (!zone || live) return;
    const ts = items.filter((i) => i.kind === "table");
    for (const t of ts) {
      const row = { label: t.label, seats: t.seats, max_seats: Math.max(t.seats, tables.find((x) => x.id === t.id)?.max_seats ?? t.seats), shape: t.type, x: t.x, y: t.y, w: t.w, h: t.h, rotation: t.rotation, color: t.color, zone_id: zone.id };
      const { error } = t.id.startsWith("new-")
        ? await supabase.from("dining_tables").insert({ ...row, restaurant_id: r.id, min_seats: 1 })
        : await supabase.from("dining_tables").update(row).eq("id", t.id);
      if (error) return toast.error(error.message);
    }
    if (deleted.length) {
      const { error } = await supabase.from("dining_tables").delete().in("id", deleted);
      if (error) return toast.error(error.message);
    }
    const decor = items.filter((i) => i.kind === "decor").map(({ kind: _k, ...d }) => d);
    const { error } = await supabase.from("zones").update({ decor, width: size.w, height: size.h }).eq("id", zone.id);
    if (error) return toast.error(error.message);
    setDeleted([]); setDirty(false); setHist({ past: [], future: [] });
    qc.invalidateQueries({ queryKey: ["zones", r.id] }); qc.invalidateQueries({ queryKey: ["tables", r.id] });
    toast.success("Planta guardada");
  }

  function down(e: React.PointerEvent, it: Item, mode: "move" | "resize") {
    e.stopPropagation();
    if (live) { setSel([it.id]); return; }
    const ids = e.shiftKey ? (sel.includes(it.id) ? sel : [...sel, it.id]) : sel.includes(it.id) ? sel : [it.id];
    setSel(ids);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { mode, sx: e.clientX, sy: e.clientY, orig: items };
  }
  function move(e: React.PointerEvent) {
    const d = drag.current; if (!d || live) return;
    const dx = (e.clientX - d.sx) / zoom, dy = (e.clientY - d.sy) / zoom;
    setItems(d.orig.map((i) => {
      if (!sel.includes(i.id)) return i;
      if (d.mode === "resize") return { ...i, w: Math.max(20, g(i.w + dx)), h: Math.max(8, g(i.h + dy)) };
      return { ...i, x: Math.min(size.w - 10, Math.max(0, g(i.x + dx))), y: Math.min(size.h - 10, Math.max(0, g(i.y + dy))) };
    }));
  }
  function up() {
    const d = drag.current; if (!d) return; drag.current = null;
    if (d.orig !== items) { setHist((h) => ({ past: [...h.past.slice(-50), d.orig], future: [] })); setDirty(true); }
  }

  const info = live && selected[0]?.kind === "table" ? selected[0] : null;
  const infoState = info ? tableState(info.id, res, r.late_tolerance_minutes) : null;
  const POP_W = 250;
  const popLeft = info ? ((info.x + info.w) * zoom + 10 + POP_W <= size.w * zoom ? (info.x + info.w) * zoom + 10 : Math.max(0, info.x * zoom - POP_W - 10)) : 0;
  const popTop = info ? Math.max(0, Math.min(info.y * zoom, size.h * zoom - 190)) : 0;
  async function setStatus(id: string, status: ResStatus) {
    await supabase.from("reservations").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reservations", r.id] });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {zones.map((z) => <button key={z.id} onClick={() => { if (dirty && !confirm("Descartar alterações não guardadas?")) return; setDirty(false); setSel([]); setZoneId(z.id); }} className={`rounded-full border px-3 py-1 text-xs ${zone?.id === z.id ? "bg-foreground text-background" : ""}`}>{z.name}</button>)}
        <div className="ml-auto flex items-center gap-1">
          {live && <Button size="sm" variant="outline" onClick={() => setStatusColors((v) => !v)}><span className="h-3 w-3 rounded-full" style={{ background: statusColors ? STATE_BG.free : "var(--secondary)", border: "1px solid var(--border)" }} />{statusColors ? "Disponibilidade" : "Cores da planta"}</Button>}
          <Button size="icon" variant="ghost" aria-label="Diminuir zoom" onClick={() => setZoom((z) => Math.max(0.3, z / 1.2))}><ZoomOut className="h-4 w-4" /></Button>
          <span className="w-10 text-center text-xs">{Math.round(zoom * 100)}%</span>
          <Button size="icon" variant="ghost" aria-label="Aumentar zoom" onClick={() => setZoom((z) => Math.min(2, z * 1.2))}><ZoomIn className="h-4 w-4" /></Button>
        </div>
      </div>

      {!live && (
        <>
          <p className="rounded-md bg-muted p-2 text-xs text-muted-foreground md:hidden">Para desenhar a planta recomendamos um tablet ou computador.</p>
          <div className="flex flex-wrap items-center gap-1 rounded-md border bg-card p-2">
            <Button size="sm" variant="outline" onClick={() => addTable("round")}><Circle className="h-4 w-4" />Redonda</Button>
            <Button size="sm" variant="outline" onClick={() => addTable("square")}><Square className="h-4 w-4" />Quadrada</Button>
            <Button size="sm" variant="outline" onClick={() => addTable("rect")}><RectangleHorizontal className="h-4 w-4" />Retangular</Button>
            <select className="h-8 rounded-md border bg-card px-2 text-xs" value="" onChange={(e) => { const d = DECOR.find((x) => x[0] === e.target.value); if (d) addDecor(d[0], d[2], d[3], d[1]); }}>
              <option value="">+ Elemento…</option>{DECOR.map((d) => <option key={d[0]} value={d[0]}>{d[1]}</option>)}
            </select>
            <span className="mx-1 h-6 w-px bg-border" />
            <Button size="icon" variant="ghost" aria-label="Desfazer" disabled={!hist.past.length} onClick={undo}><Undo2 className="h-4 w-4" /></Button>
            <Button size="icon" variant="ghost" aria-label="Refazer" disabled={!hist.future.length} onClick={redo}><Redo2 className="h-4 w-4" /></Button>
            <Button size="icon" variant={snap ? "secondary" : "ghost"} aria-label="Grelha" title="Alinhar à grelha" onClick={() => setSnap(!snap)}><Grid3x3 className="h-4 w-4" /></Button>
            <label className="flex items-center gap-1 text-xs">Sala<Input type="number" className="h-8 w-16" value={size.w} onChange={(e) => { setSize({ ...size, w: Math.max(300, Number(e.target.value)) }); setDirty(true); }} />×<Input type="number" className="h-8 w-16" value={size.h} onChange={(e) => { setSize({ ...size, h: Math.max(200, Number(e.target.value)) }); setDirty(true); }} /></label>
            <Button size="sm" className="ml-auto" disabled={!dirty} onClick={save}><Save className="h-4 w-4" />Guardar</Button>
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border bg-card p-2 text-xs">
              <span className="font-medium">{selected.length} selecionado(s)</span>
              {selected.length === 1 && selected[0].kind === "table" && <>
                <label className="flex items-center gap-1">Nº<Input className="h-7 w-14" value={selected[0].label} onChange={(e) => update({ label: e.target.value })} /></label>
                <label className="flex items-center gap-1">Lugares<Input type="number" min={1} className="h-7 w-14" value={selected[0].seats} onChange={(e) => update({ seats: Number(e.target.value) })} /></label>
                <select className="h-7 rounded border bg-card px-1" value={selected[0].type} onChange={(e) => update({ type: e.target.value })}><option value="round">Redonda</option><option value="square">Quadrada</option><option value="rect">Retangular</option></select>
              </>}
              <label className="flex items-center gap-1">Cor<input type="color" value={selected[0].color ?? "#d9d4c7"} onChange={(e) => update({ color: e.target.value })} /></label>
              <Button size="sm" variant="ghost" onClick={() => update({ rotation: ((selected[0].rotation ?? 0) + 15) % 360 })}><RotateCw className="h-4 w-4" />Rodar</Button>
              <Button size="sm" variant="ghost" onClick={duplicate}><Copy className="h-4 w-4" />Duplicar</Button>
              <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" />Eliminar</Button>
            </div>
          )}
        </>
      )}

      <div ref={box} className="overflow-auto rounded-md border bg-card" onPointerDown={() => setSel([])}>
        <div className="relative touch-none" style={{ width: size.w * zoom, height: size.h * zoom }} onPointerMove={move} onPointerUp={up}>
          <div className="absolute left-0 top-0 origin-top-left" style={{ width: size.w, height: size.h, transform: `scale(${zoom})`, backgroundImage: live ? "none" : "linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            {items.map((it) => {
              const st = it.kind === "table" && live ? tableState(it.id, res, r.late_tolerance_minutes) : null;
              const isSel = sel.includes(it.id);
              const full = !!st && statusColors;
              const bg = full ? STATE_BG[st.state] : it.color ?? (it.kind === "decor" ? "var(--muted-foreground)" : "var(--secondary)");
              return (
                <div key={it.id} onPointerDown={(e) => down(e, it, "move")}
                  className={`absolute flex select-none flex-col items-center justify-center text-center ${live ? "cursor-pointer" : "cursor-move"} ${isSel ? "ring-2 ring-primary ring-offset-2" : ""} ${st?.state === "late" ? "animate-pulse" : ""} ${it.type === "round" || it.type === "plant" ? "rounded-full" : it.kind === "table" ? "rounded-md" : "rounded-sm"}`}
                  style={{ left: it.x, top: it.y, width: it.w, height: it.h, transform: `rotate(${it.rotation}deg)`, background: bg, color: full ? "var(--primary-foreground)" : "var(--foreground)", opacity: it.kind === "decor" ? 0.55 : 1, border: it.kind === "table" ? "1px solid var(--border)" : undefined }}>
                  {it.kind === "table" && <><span className="text-sm font-bold leading-none">{it.label}</span><span className="text-[10px] opacity-80">{it.seats}p{st?.next && st.state !== "seated" ? ` · ${hhmm(st.next.starts_at)}` : st?.seated ? ` · ${hhmm(st.seated.ends_at)}` : ""}</span></>}
                  {st && !full && <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-1 ring-card" style={{ background: STATE_BG[st.state] }} />}
                  {!live && isSel && sel.length === 1 && <span onPointerDown={(e) => down(e, it, "resize")} className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border bg-card" />}
                </div>
              );
            })}
          </div>
          {info && infoState && (
            <div className="absolute z-10 rounded-md border bg-card p-4 text-sm shadow-lg" style={{ left: popLeft, top: popTop, width: POP_W }} onPointerDown={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-xl">Mesa {info.label}</p>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{info.seats}</span>
                  <button type="button" aria-label="Fechar" onClick={() => setSel([])} className="rounded-full p-0.5 hover:bg-muted"><X className="h-4 w-4" /></button>
                </span>
              </div>
              <p className="mt-1 text-muted-foreground">{STATE_LABEL[infoState.state]}</p>
              {infoState.seated && <p className="mt-1">{infoState.seated.name} ({infoState.seated.party}) · liberta {hhmm(infoState.seated.ends_at)}</p>}
              {infoState.next && <p className="mt-1 flex items-center gap-1"><Clock className="h-3 w-3" />{hhmm(infoState.next.starts_at)} · {infoState.next.name} ({infoState.next.party})</p>}
              <div className="mt-3 flex gap-2">
                {infoState.seated ? <Button size="sm" variant="outline" onClick={() => setStatus(infoState.seated!.id, "completed")}>Libertar</Button>
                  : infoState.next ? <><Button size="sm" onClick={() => setStatus(infoState.next!.id, "seated")}>Sentar</Button>{infoState.state === "late" && <Button size="sm" variant="outline" onClick={() => setStatus(infoState.next!.id, "no_show")}>No-show</Button>}</>
                  : <Button size="sm" variant="outline" onClick={() => onBook(info.id)}>Reservar / sentar</Button>}
              </div>
            </div>
          )}
        </div>
      </div>

      {live && (
        <div className="flex flex-wrap gap-3 text-xs">{(["free", "reserved", "seated"] as const).map((s) => <span key={s} className="flex items-center gap-1"><span className="h-3 w-3 rounded-full" style={{ background: STATE_BG[s] }} />{STATE_LABEL[s]}</span>)}</div>
      )}
    </div>
  );
}
