import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

/** Shows each targeted announcement once per user, then records it as read. */
export function AnnouncementPopup() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["announcement-unread"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      if (!uid) return null;
      const [{ data: list }, { data: reads }] = await Promise.all([
        supabase.from("announcements").select("*").order("created_at", { ascending: true }),
        supabase.from("announcement_reads").select("announcement_id").eq("user_id", uid),
      ]);
      const seen = new Set((reads ?? []).map((r) => r.announcement_id));
      const next = (list ?? []).find((a) => !seen.has(a.id));
      return next ? { a: next, uid } : null;
    },
  });
  if (!data) return null;
  const { a, uid } = data;
  async function close() {
    await supabase.from("announcement_reads").insert({ announcement_id: a.id, user_id: uid });
    qc.invalidateQueries({ queryKey: ["announcement-unread"] });
  }
  return (
    <Dialog open onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-md rounded-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Megaphone className="h-5 w-5" /></div>
        <DialogTitle className="text-xl">{a.title}</DialogTitle>
        {a.subtitle && <p className="-mt-2 text-sm font-medium text-muted-foreground">{a.subtitle}</p>}
        {a.body ? <DialogDescription className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">{a.body}</DialogDescription> : <DialogDescription className="sr-only">{a.title}</DialogDescription>}
        <Button onClick={close} className="mt-2 w-full">OK</Button>
      </DialogContent>
    </Dialog>
  );
}
