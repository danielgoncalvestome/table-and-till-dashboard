import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";

export const Route = createFileRoute("/_authenticated/dashboard/team")({ component: Team });

function Team() {
  const { t, lang } = useI18n();
  const { restaurant: r } = useRestaurant();
  const qc = useQueryClient();
  const { data: members } = useQuery({ queryKey: ["members", r.id], queryFn: async () => (await supabase.from("restaurant_members").select("*").eq("restaurant_id", r.id)).data ?? [] });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const { data: locs } = useQuery({ queryKey: ["locations", r.id], queryFn: async () => (await supabase.from("locations").select("*").eq("restaurant_id", r.id)).data ?? [] });
  const [name, setName] = useState("");
  const [addr, setAddr] = useState("");
  return (
    <div>
      <PageTitle title={t("dash.team")} sub={t("team.sub")} />
      <Panel title={t("team.title")}>
        <ul className="divide-y text-sm">
          {members?.map((m) => <li key={m.id} className="flex justify-between py-2"><span>{m.user_id === me?.id ? me.email : m.user_id.slice(0, 8) + "…"}</span><span className="text-muted-foreground">{m.role}</span></li>)}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">{lang === "pt" ? "Convites por email para novos membros da equipa ainda não estão disponíveis." : "Email invitations for new team members are not available yet."}</p>
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
