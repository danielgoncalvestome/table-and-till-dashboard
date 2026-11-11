import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { realAccountEmail, passwordChangeSchema } from "@/lib/account-rules";
import { acknowledgeInternalEmail } from "@/utils/account.functions";

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
  return <section className="mt-8 border-t pt-8">
    <h2 className="text-2xl">{t("account.title")}</h2>
    {account?.username && <p className="mt-2 text-sm text-muted-foreground">{t("auth.username")}: {account.username}</p>}
    <div className="mt-5 grid gap-8 md:grid-cols-2">
      <form onSubmit={associateEmail} className="space-y-4">
        <p className="break-all text-sm">{t("account.email")}: {account?.email ?? t("account.noEmail")}</p>
        {!account?.email && <p className="text-sm text-muted-foreground">{t("auth.noEmailWarning")}</p>}
        {(pending || account?.pendingEmail) && <p role="status" className="text-sm text-muted-foreground">{t("account.emailPending")}</p>}
        <div><Label htmlFor="account-email">{t("account.email")}</Label><Input id="account-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <Button disabled={busy || !account}>{t("account.emailAdd")}</Button>
      </form>
      <form onSubmit={changePassword} className="space-y-4">
        <div><Label htmlFor="account-current-password">{t("account.currentPassword")}</Label><Input id="account-current-password" type="password" autoComplete="current-password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
        <div><Label htmlFor="account-new-password">{t("auth.newPassword")}</Label><Input id="account-new-password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
        <div><Label htmlFor="account-confirm-password">{t("account.confirmPassword")}</Label><Input id="account-confirm-password" type="password" autoComplete="new-password" required value={confirmation} onChange={(e) => setConfirmation(e.target.value)} /></div>
        <Button disabled={busy}>{t("account.changePassword")}</Button>
      </form>
    </div>
  </section>;
}