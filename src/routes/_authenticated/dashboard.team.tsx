import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Trash2, UserPlus, KeyRound, Crown } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { PERMISSIONS, PERM_LABELS, type PermMap } from "@/lib/team-rules";
import { listTeam, createTeamMember, updateTeamMember, removeTeamMember } from "@/utils/team.functions";

export const Route = createFileRoute("/_authenticated/dashboard/team")({ head: () => ({ meta: [{ title: "Equipa e locais — MenuTap" }, { name: "description", content: "Gira a equipa e os locais do restaurante." }, { property: "og:title", content: "Equipa e locais — MenuTap" }, { property: "og:description", content: "Gira a equipa e os locais do restaurante." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }), component: Team });

function PermGrid({ value, onChange, lang }: { value: PermMap; onChange: (v: PermMap) => void; lang: string }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
    {PERMISSIONS.map((p) => <label key={p} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${value[p] ? "border-primary bg-primary/10" : ""}`}>
      <input type="checkbox" checked={!!value[p]} onChange={(e) => onChange({ ...value, [p]: e.target.checked })} className="accent-[hsl(var(--primary))]" />
      {lang === "pt" ? PERM_LABELS[p].pt : PERM_LABELS[p].en}
    </label>)}
  </div>;
}

function Team() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const qc = useQueryClient();
  const list = useServerFn(listTeam), create = useServerFn(createTeamMember), update = useServerFn(updateTeamMember), remove = useServerFn(removeTeamMember);
  const { data: hasPlan } = useQuery({ queryKey: ["orders-plan", r.id], queryFn: async () => (await supabase.rpc("has_orders_plan", { _restaurant_id: r.id })).data ?? false });
  const { data: members } = useQuery({ queryKey: ["team", r.id], queryFn: () => list({ data: { restaurantId: r.id } }) });
  const { data: locs } = useQuery({ queryKey: ["locations", r.id], queryFn: async () => (await supabase.from("locations").select("*").eq("restaurant_id", r.id)).data ?? [] });
  const [f, setF] = useState({ name: "", username: "", password: "" });
  const [perms, setPerms] = useState<PermMap>({ reservations: true, orders: true });
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(""); const [addr, setAddr] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["team", r.id] });

  async function add(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const res = await create({ data: { restaurantId: r.id, ...f, username: f.username.trim().toLowerCase(), permissions: perms } });
      if ("error" in res) toast.error(res.error === "taken" ? "Este username já existe." : res.error === "plan" ? "Disponível só no plano Gestão e Reservas." : t("common.error"));
      else { toast.success("Membro criado. Já pode entrar com o username e a password."); setF({ name: "", username: "", password: "" }); refresh(); }
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageTitle title={t("dash.team")} sub={t("team.sub")} />
      <Panel title={t("team.title")}>
        {hasPlan === false ? <div className="rounded-md border border-dashed p-5 text-sm">
          <p>Criar contas para funcionários, com permissões por página, está disponível no plano <b>Gestão e Reservas</b>.</p>
          <Button asChild size="sm" className="mt-3"><Link to="/dashboard/subscription">Ver planos</Link></Button>
        </div> : <>
          <ul className="space-y-3">
            {members?.map((m) => <MemberRow key={m.id} m={m} lang={lang} onSave={async (p, pw) => { try { await update({ data: { restaurantId: r.id, memberId: m.id, permissions: p, password: pw || undefined } }); toast.success(t("auth.updated")); refresh(); } catch (e) { toast.error((e as Error).message); } }} onRemove={async () => { if (!confirm("Remover este membro? A conta deixa de ter acesso.")) return; await remove({ data: { restaurantId: r.id, memberId: m.id } }); refresh(); }} />)}
          </ul>
          <form onSubmit={add} className="mt-6 space-y-3 border-t pt-5">
            <p className="flex items-center gap-2 text-sm font-semibold"><UserPlus className="h-4 w-4" />Adicionar membro</p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><Label htmlFor="tm-name">Nome</Label><Input id="tm-name" required maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
              <div><Label htmlFor="tm-user">{t("auth.username")}</Label><Input id="tm-user" required pattern="[A-Za-z0-9_]{3,30}" title="3–30 letras, números ou _" value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
              <div><Label htmlFor="tm-pass">Password inicial</Label><Input id="tm-pass" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
            </div>
            <p className="text-xs text-muted-foreground">Páginas a que tem acesso (a Visão Geral e a Ajuda estão sempre disponíveis; Equipa e Subscrição só para o proprietário):</p>
            <PermGrid value={perms} onChange={setPerms} lang={lang} />
            <Button disabled={busy}>Criar membro</Button>
          </form>
        </>}
      </Panel>
      <Panel title={t("team.locations")} className="mt-4">
        <form className="flex flex-wrap gap-2" onSubmit={async (e) => { e.preventDefault(); if (!name) return; await supabase.from("locations").insert({ restaurant_id: r.id, name, address: addr }); setName(""); setAddr(""); qc.invalidateQueries({ queryKey: ["locations", r.id] }); }}>
          <Input placeholder={t("f.name")} value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
          <Input placeholder={t("f.address")} value={addr} onChange={(e) => setAddr(e.target.value)} className="max-w-sm" />
          <Button>{t("team.addLocation")}</Button>
        </form>
        <ul className="mt-4 divide-y text-sm">
          {locs?.map((l) => <li key={l.id} className="flex items-center justify-between py-2"><span>{l.name} <span className="text-muted-foreground">{l.address}</span></span><Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={async () => { await supabase.from("locations").delete().eq("id", l.id); qc.invalidateQueries({ queryKey: ["locations", r.id] }); }}><Trash2 /></Button></li>)}
        </ul>
      </Panel>
    </div>
  );
}

type Member = { id: string; role: string; permissions: Record<string, boolean>; username: string | null; name: string | null; isMe: boolean };
function MemberRow({ m, lang, onSave, onRemove }: { m: Member; lang: string; onSave: (p: PermMap, pw: string) => Promise<void>; onRemove: () => void }) {
  const [p, setP] = useState<PermMap>(m.permissions);
  const [pw, setPw] = useState("");
  const [open, setOpen] = useState(false);
  const owner = m.role === "owner" || m.role === "manager";
  return <li className="rounded-md border p-3">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0"><p className="truncate font-medium">{m.name ?? m.username}{m.isMe && " (eu)"}</p><p className="text-xs text-muted-foreground">{m.username ? `@${m.username}` : ""}</p></div>
      {owner ? <span className="flex items-center gap-1 text-xs text-muted-foreground"><Crown className="h-3.5 w-3.5" />{m.role === "owner" ? "Proprietário" : "Gerente"} · acesso total</span>
        : <div className="flex gap-1"><Button size="sm" variant="outline" onClick={() => setOpen(!open)}>Permissões</Button><Button size="icon" variant="ghost" aria-label="Remover" onClick={onRemove}><Trash2 /></Button></div>}
    </div>
    {open && !owner && <div className="mt-3 space-y-3">
      <PermGrid value={p} onChange={setP} lang={lang} />
      <div className="flex flex-wrap items-end gap-2"><div><Label htmlFor={`pw-${m.id}`} className="flex items-center gap-1"><KeyRound className="h-3.5 w-3.5" />Nova password (opcional)</Label><Input id={`pw-${m.id}`} type="password" minLength={8} maxLength={128} autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <Button size="sm" onClick={async () => { if (pw && pw.length < 8) return; await onSave(p, pw); setPw(""); }}>Guardar</Button></div>
    </div>}
  </li>;
}
