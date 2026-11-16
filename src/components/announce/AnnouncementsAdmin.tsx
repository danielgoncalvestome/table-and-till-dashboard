import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Megaphone, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type R = { id: string; name: string };
const card = "rounded-2xl border bg-card p-4 shadow-[var(--shadow-card)] sm:p-5";

export function AnnouncementsAdmin({ restaurants }: { restaurants: R[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [body, setBody] = useState("");
  const [all, setAll] = useState(true);
  const [sel, setSel] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const { data: list } = useQuery({ queryKey: ["admin-announcements"], queryFn: async () => (await supabase.from("announcements").select("*, announcement_reads(user_id)").order("created_at", { ascending: false })).data ?? [] });

  async function send() {
    if (!title.trim()) return toast.error("Escreva um título.");
    if (!all && !sel.length) return toast.error("Escolha pelo menos um restaurante.");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert({ title: title.trim(), subtitle: subtitle.trim() || null, body: body.trim() || null, target_all: all, restaurant_ids: all ? [] : sel, created_by: u.user?.id });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Mensagem enviada. Aparece no próximo acesso ao painel.");
    setTitle(""); setSubtitle(""); setBody(""); setSel([]); setAll(true);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  }
  async function remove(id: string) {
    if (!confirm("Apagar esta mensagem?")) return;
    await supabase.from("announcements").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-announcements"] });
  }
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className={`${card} space-y-4`}>
        <div className="space-y-1.5"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Novidade no MenuTap" /></div>
        <div className="space-y-1.5"><Label>Subtítulo</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Opcional" /></div>
        <div className="space-y-1.5"><Label>Descrição</Label><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Opcional" /></div>
        <div className="space-y-2">
          <Label>Enviar para</Label>
          <div className="inline-flex rounded-full border bg-muted/40 p-1 text-sm">
            {[true, false].map((v) => <button key={String(v)} onClick={() => setAll(v)} className={`rounded-full px-3 py-1 ${all === v ? "bg-card font-medium shadow-sm" : "text-muted-foreground"}`}>{v ? "Todos os restaurantes" : "Escolher"}</button>)}
          </div>
          {!all && <div className="flex max-h-52 flex-wrap gap-1.5 overflow-auto rounded-xl border p-2">
            {restaurants.map((r) => { const on = sel.includes(r.id); return <button key={r.id} onClick={() => toggle(r.id)} className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"}`}>{on && <Check className="h-3 w-3" />}{r.name}</button>; })}
          </div>}
        </div>
        <Button onClick={send} disabled={busy}><Send />Enviar mensagem</Button>
        <p className="text-xs text-muted-foreground">Cada utilizador vê a mensagem uma única vez, ao entrar no painel.</p>
      </div>
      <div className={card}>
        <p className="mb-3 text-sm font-semibold">Enviadas</p>
        {list?.length ? <ul className="space-y-2">{list.map((a) => <li key={a.id} className="flex items-start gap-2 rounded-xl border p-2.5">
          <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{a.title}</p><p className="text-xs text-muted-foreground">{a.target_all ? "Todos" : `${a.restaurant_ids.length} restaurante(s)`} · vista por {a.announcement_reads?.length ?? 0}</p></div>
          <button onClick={() => remove(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
        </li>)}</ul> : <p className="text-sm text-muted-foreground">Nenhuma mensagem enviada.</p>}
      </div>
    </div>
  );
}
