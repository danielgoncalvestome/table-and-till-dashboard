import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AtSign, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { realAccountEmail, passwordChangeSchema } from "@/lib/account-rules";
import { acknowledgeInternalEmail } from "@/utils/account.functions";

function IconTile({ children }: { children: React.ReactNode }) {
  return <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">{children}</div>;
}

export function AccountSettings() {
  const { t } = useI18n();
  const acknowledge = useServerFn(acknowledgeInternalEmail);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(false);
  const { data: account } = useQuery({ queryKey: ["account-settings"], queryFn: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw error ?? new Error("Authentication required");
    const { data: profile, error: profileError } = await supabase.from("profiles").select("username").eq("id", user.id).single();
    if (profileError) throw profileError;
    return { username: profile.username, email: realAccountEmail(user.email), pendingEmail: user.new_email };
  } });

  async function associateEmail(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: email.trim() }, { emailRedirectTo: `${window.location.origin}/auth` });
      if (error) throw error;
      if (!account?.email) await acknowledge({ data: { email: email.trim() } });
      setPending(true); toast.success(t("account.emailPending"));
    } catch (error) { toast.error((error as Error).message || t("common.error")); }
    finally { setBusy(false); }
  }
  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordChangeSchema.safeParse({ currentPassword, password, confirmation }).success) return toast.error(t("account.passwordMismatch"));
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password, current_password: currentPassword });
      if (error) throw error;
      setCurrentPassword(""); setPassword(""); setConfirmation(""); toast.success(t("auth.updated"));
    } catch (error) { toast.error((error as Error).message || t("common.error")); }
    finally { setBusy(false); }
  }
  return <section className="mt-8 border-t border-border/60 pt-8">
    <div className="flex items-center gap-3">
      <IconTile><ShieldCheck className="h-4.5 w-4.5" /></IconTile>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("account.title")}</h2>
        {account?.username && <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground"><UserRound className="h-3 w-3" />{t("auth.username")}: <span className="font-medium text-foreground">{account.username}</span></p>}
      </div>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <form onSubmit={associateEmail} className="dash-card space-y-4 p-5">
        <div className="flex items-center gap-2.5">
          <IconTile><Mail className="h-4 w-4" /></IconTile>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t("account.email")}</p>
            <p className="truncate text-xs text-muted-foreground">{account?.email ?? t("account.noEmail")}</p>
          </div>
        </div>
        {!account?.email && <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">{t("auth.noEmailWarning")}</p>}
        {(pending || account?.pendingEmail) && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{t("account.emailPending")}</p>}
        <div className="space-y-1.5">
          <Label htmlFor="account-email" className="text-xs">{t("account.email")}</Label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input id="account-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Button disabled={busy || !account} className="w-full sm:w-auto">{t("account.emailAdd")}</Button>
      </form>
      <form onSubmit={changePassword} className="dash-card space-y-4 p-5">
        <div className="flex items-center gap-2.5">
          <IconTile><KeyRound className="h-4 w-4" /></IconTile>
          <p className="text-sm font-medium">{t("account.changePassword")}</p>
        </div>
        <div className="space-y-1.5"><Label htmlFor="account-current-password" className="text-xs">{t("account.currentPassword")}</Label><Input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5"><Label htmlFor="account-new-password" className="text-xs">{t("auth.newPassword")}</Label><Input id="account-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          <div className="space-y-1.5"><Label htmlFor="account-confirm-password" className="text-xs">{t("account.confirmPassword")}</Label><Input id="account-confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></div>
        </div>
        <Button disabled={busy} className="w-full sm:w-auto">{t("account.changePassword")}</Button>
      </form>
    </div>
  </section>;
}
