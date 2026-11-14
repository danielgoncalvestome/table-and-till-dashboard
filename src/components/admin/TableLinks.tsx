import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { deviceWarnings } from "@/lib/orders";

/** Admin-only: one NFC link per floor-plan table, plus device count tracking. */
export function TableLinks({ restaurantId, slug }: { restaurantId: string; slug: string }) {
  const { data, refetch } = useQuery({ queryKey: ["admin-links", restaurantId], queryFn: async () => {
    const [t, l, d] = await Promise.all([
      supabase.from("dining_tables").select("id,label,active,position").eq("restaurant_id", restaurantId).order("position"),
      supabase.from("table_links").select("*").eq("restaurant_id", restaurantId).order("created_at"),
      supabase.from("restaurant_devices").select("*").eq("restaurant_id", restaurantId).maybeSingle(),
    ]);
    return { tables: t.data ?? [], links: l.data ?? [], dev: d.data };
  } });
  const [devices, setDevices] = useState(0);
  useEffect(() => { setDevices(data?.dev?.devices_count ?? 0); }, [data?.dev?.devices_count]);
  if (!data) return null;
  const active = data.tables.filter((t) => t.active);
  const origin = "https://menutap.pt";
  const url = (token: string) => `${origin}/r/${slug}?t=${token}&src=nfc`;
  const warns = deviceWarnings(active.length, data.dev?.submitted_tables, data.dev?.devices_count ?? 0);

  async function generate() {
    const have = new Set(data!.links.map((l) => l.table_id));
    const rows = active.filter((t) => !have.has(t.id)).map((t) => ({ restaurant_id: restaurantId, table_id: t.id }));
    if (!rows.length) return toast("Todas as mesas já têm link");
    const { error } = await supabase.from("table_links").insert(rows);
    if (error) return toast.error(error.message);
    toast.success(`${rows.length} links criados`); refetch();
  }
  async function assign(id: string, tableId: string) { await supabase.from("table_links").update({ table_id: tableId || null }).eq("id", id); refetch(); }
  async function remove(id: string) { if (!confirm("Eliminar este link? O dispositivo deixa de funcionar.")) return; await supabase.from("table_links").delete().eq("id", id); refetch(); }
  async function saveDev(patch: { devices_count?: number; all_working?: boolean }) {
    const { error } = await supabase.from("restaurant_devices").upsert({ restaurant_id: restaurantId, devices_count: data!.dev?.devices_count ?? 0, all_working: data!.dev?.all_working ?? false, ...patch, updated_at: new Date().toISOString() });
    if (error) return toast.error(error.message);
    refetch();
  }

  return (
    <section className="rounded-2xl border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-sm font-semibold">Links NFC por mesa e dispositivos</h2>
        <Button size="sm" onClick={generate}>Criar links para mesas sem link</Button>
      </div>
      <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-lg border p-3"><p className="text-muted-foreground">Mesas ativas</p><p className="text-2xl font-semibold">{active.length}</p></div>
        <div className="rounded-lg border p-3"><p className="text-muted-foreground">Última planta submetida</p><p className="text-2xl font-semibold">{data.dev?.submitted_tables ?? "—"}</p>{data.dev?.submitted_at && <p className="text-xs text-muted-foreground">{new Date(data.dev.submitted_at).toLocaleDateString("pt-PT")}</p>}</div>
        <div className="rounded-lg border p-3"><p className="text-muted-foreground">Dispositivos enviados</p><div className="mt-1 flex gap-2"><Input type="number" min={0} value={devices} onChange={(e) => setDevices(Number(e.target.value))} className="h-8" /><Button size="sm" variant="outline" onClick={() => saveDev({ devices_count: devices })}>OK</Button></div></div>
      </div>
      {warns.map((w) => <p key={w} className="mb-2 flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm"><AlertTriangle className="h-4 w-4 text-destructive" />{w}</p>)}
      {data.links.length === 0 ? <p className="text-sm text-muted-foreground">Ainda não há links.</p> : (
        <ul className="divide-y text-sm">
          {data.links.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
              <select value={l.table_id ?? ""} onChange={(e) => assign(l.id, e.target.value)} className="h-8 rounded-md border bg-card px-2">
                <option value="">— sem mesa —</option>
                {data.tables.map((t) => <option key={t.id} value={t.id}>Mesa {t.label}{t.active ? "" : " (inativa)"}</option>)}
              </select>
              <code className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{url(l.token)}</code>
              <Button size="sm" variant="ghost" aria-label="Copiar" onClick={() => { navigator.clipboard.writeText(url(l.token)); toast.success("Copiado"); }}><Copy className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(l.id)}>Eliminar</Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
