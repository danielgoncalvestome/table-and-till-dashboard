import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useRestaurant } from "@/lib/restaurant";
import { useCatalog } from "@/lib/use-catalog";

export const Route = createFileRoute("/_authenticated/dashboard/recommendations")({ component: Recs });

function Recs() {
  const { t } = useI18n();
  const { restaurant: r } = useRestaurant();
  const qc = useQueryClient();
  const { data: cat } = useCatalog(r.id);
  const { data: recs } = useQuery({ queryKey: ["recs", r.id], queryFn: async () => (await supabase.from("recommendations").select("*").eq("restaurant_id", r.id)).data ?? [] });
  const [f, setF] = useState({ dish: "", rec: "", label: "Combina bem com", en: "Pairs well with" });
  const dishes = (cat?.dishes ?? []).filter((d) => !d.archived);
  const name = (id: string) => dishes.find((d) => d.id === id)?.name ?? "—";
  const reload = () => qc.invalidateQueries({ queryKey: ["recs", r.id] });

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.dish || !f.rec || f.dish === f.rec) return toast.error(t("common.error"));
    const { error } = await supabase.from("recommendations").insert({ restaurant_id: r.id, dish_id: f.dish, recommended_dish_id: f.rec, label: f.label, label_i18n: { en: f.en } });
    if (error) return toast.error(error.code === "23505" ? "✓" : t("common.error"));
    toast.success(t("common.saved")); reload();
  }
  const sel = (v: string, on: (v: string) => void) => (
    <select className="h-9 w-full rounded-md border bg-card px-2 text-sm" value={v} onChange={(e) => on(e.target.value)}>
      <option value="">—</option>{dishes.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
    </select>
  );
  return (
    <div>
      <PageTitle title={t("rec.title")} sub={t("rec.sub")} />
      <Panel>
        <form onSubmit={add} className="grid items-end gap-3 md:grid-cols-5">
          <div><Label>{t("rec.dish")}</Label>{sel(f.dish, (v) => setF({ ...f, dish: v }))}</div>
          <div><Label>{t("rec.suggest")}</Label>{sel(f.rec, (v) => setF({ ...f, rec: v }))}</div>
          <div><Label>{t("rec.label")} (PT)</Label><Input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></div>
          <div><Label>{t("rec.label")} (EN)</Label><Input value={f.en} onChange={(e) => setF({ ...f, en: e.target.value })} /></div>
          <Button>{t("common.add")}</Button>
        </form>
      </Panel>
      <Panel className="mt-4">
        {recs?.length ? (
          <ul className="divide-y text-sm">
            {recs.map((x) => (
              <li key={x.id} className="flex items-center justify-between py-2">
                <span>{name(x.dish_id)} → <strong>{name(x.recommended_dish_id)}</strong> <span className="text-muted-foreground">· {x.label}</span></span>
                <Button size="icon" variant="ghost" aria-label={t("common.delete")} onClick={async () => { await supabase.from("recommendations").delete().eq("id", x.id); reload(); }}><Trash2 /></Button>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">{t("common.empty")}</p>}
      </Panel>
    </div>
  );
}
