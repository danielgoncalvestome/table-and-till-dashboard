import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { usernameSchema, usernameEmail, realAccountEmail } from "@/lib/account-rules";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const signInWithUsername = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: usernameSchema, password: z.string().min(1).max(128) }))
  .handler(async ({ data }) => {
    // No email is returned, even for an existing username. Auth rate-limits password attempts.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: email } = await supabaseAdmin.rpc("account_login_email", { _username: data.username });
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("Authentication unavailable");
    const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: result, error } = await client.auth.signInWithPassword({ email: email ?? usernameEmail(data.username), password: data.password });
    if (error || !result.session) return { error: "credentials" as const };
    return { session: { access_token: result.session.access_token, refresh_token: result.session.refresh_token } };
  });

export const acknowledgeInternalEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ email: z.string().trim().email().max(254) }))
  .handler(async ({ data, context }) => {
    const { data: { user }, error } = await context.supabase.auth.getUser();
    if (error || !user?.email || realAccountEmail(user.email) || user.new_email !== data.email) throw new Error("Invalid email change");
    // Confirm only the unreachable internal address. The real address still requires its emailed link.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({ type: "email_change_current", email: user.email, newEmail: data.email });
    if (linkError || !link.properties?.hashed_token) throw new Error("Email confirmation unavailable");
    const { error: verifyError } = await supabaseAdmin.auth.verifyOtp({ token_hash: link.properties.hashed_token, type: "email_change" });
    if (verifyError) throw verifyError;
    return { ok: true };
  });