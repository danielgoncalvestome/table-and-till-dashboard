import { createFileRoute, Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/lib/panel-theme";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageTitle, Panel } from "@/components/dash/ui";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useIsAdmin } from "@/lib/restaurant";
import { formatDate } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/admin_/messages")({
  head: () => ({ meta: [{ title: "Mensagens — MenuTap" }, { name: "description", content: "Mensagens recebidas pelo formulário de contacto." }, { property: "og:title", content: "Mensagens — MenuTap" }, { property: "og:description", content: "Mensagens recebidas pelo formulário de contacto." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Messages,
});

function Messages() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading } = useIsAdmin();
  const { data: msgs } = useQuery({ queryKey: ["admin-messages"], enabled: !!isAdmin, queryFn: async () => (await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false })).data ?? [] });
  if (isLoading) return null;
  if (!isAdmin) return <div className="p-10 text-center"><p>403</p></div>;
  async function toggle(id: string, read: boolean) {
    await supabase.from("contact_submissions").update({ read }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-alerts"] });
  }
  async function remove(id: string) {
    if (!confirm(t("admin.delete") + "?")) return;
    await supabase.from("contact_submissions").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-messages"] }); qc.invalidateQueries({ queryKey: ["admin-alerts"] });
  }
  return (
    <div className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between"><Link to="/admin" className="text-sm text-muted-foreground">← {t("admin.title")}</Link><ThemeToggle /></div>
      <PageTitle title={t("admin.messages")} />
      {!msgs?.length && <p className="text-muted-foreground">{t("admin.noMessages")}</p>}
      <div className="space-y-3">
        {msgs?.map((m) => (
          <Panel key={m.id} className={m.read ? "opacity-70" : ""}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div><span className="font-semibold">{m.name}</span> · <a className="text-primary underline" href={`mailto:${m.email}`}>{m.email}</a></div>
              <span className="text-xs text-muted-foreground">{formatDate(m.created_at, lang)}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => toggle(m.id, !m.read)}>{m.read ? t("admin.markUnread") : t("admin.markRead")}</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>{t("admin.delete")}</Button>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
