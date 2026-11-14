import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { usernameSchema, usernameEmail } from "@/lib/account-rules";
import { PERMISSIONS, cleanPerms } from "@/lib/team-rules";

const permsSchema = z.object(Object.fromEntries(PERMISSIONS.map((p) => [p, z.boolean().optional()])));
type Ctx = { supabase: any; userId: string };

async function assertOwner(ctx: Ctx, restaurantId: string) {
  const { data } = await ctx.supabase.from("restaurant_members").select("role").eq("restaurant_id", restaurantId).eq("user_id", ctx.userId).maybeSingle();
  if (data?.role !== "owner") throw new Error("Apenas o proprietário pode gerir a equipa");
}
async function staffMember(restaurantId: string, memberId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("restaurant_members").select("user_id, role").eq("id", memberId).eq("restaurant_id", restaurantId).maybeSingle();
  if (!data || data.role === "owner") throw new Error("Membro inválido");
  return { supabaseAdmin, userId: data.user_id };
}

export const listTeam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ restaurantId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.restaurantId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin.from("restaurant_members").select("id, user_id, role, permissions").eq("restaurant_id", data.restaurantId).order("created_at");
    const ids = (rows ?? []).map((r) => r.user_id);
    const { data: profiles } = await supabaseAdmin.from("profiles").select("id, username, display_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    return (rows ?? []).map((r) => {
      const p = profiles?.find((x) => x.id === r.user_id);
      return { id: r.id, role: r.role as string, permissions: (r.permissions ?? {}) as Record<string, boolean>, username: p?.username ?? null, name: p?.display_name ?? null, isMe: r.user_id === context.userId };
    });
  });

export const createTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ restaurantId: z.string().uuid(), name: z.string().trim().min(1).max(80), username: usernameSchema, password: z.string().min(8).max(128), permissions: permsSchema }))
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.restaurantId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: free } = await supabaseAdmin.rpc("username_available", { _username: data.username });
    if (!free) return { error: "taken" as const };
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({ email: usernameEmail(data.username), password: data.password, email_confirm: true, user_metadata: { username: data.username, display_name: data.name } });
    if (error || !created.user) return { error: "failed" as const };
    const { error: mErr } = await supabaseAdmin.from("restaurant_members").insert({ restaurant_id: data.restaurantId, user_id: created.user.id, role: "staff", permissions: cleanPerms(data.permissions) });
    if (mErr) { await supabaseAdmin.auth.admin.deleteUser(created.user.id); return { error: "failed" as const }; }
    return { ok: true as const };
  });

export const updateTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ restaurantId: z.string().uuid(), memberId: z.string().uuid(), permissions: permsSchema.optional(), password: z.string().min(8).max(128).optional() }))
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.restaurantId);
    const { supabaseAdmin, userId } = await staffMember(data.restaurantId, data.memberId);
    if (data.permissions) await supabaseAdmin.from("restaurant_members").update({ permissions: cleanPerms(data.permissions) }).eq("id", data.memberId);
    if (data.password) { const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password }); if (error) throw new Error("Não foi possível mudar a password"); }
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ restaurantId: z.string().uuid(), memberId: z.string().uuid() }))
  .handler(async ({ data, context }) => {
    await assertOwner(context, data.restaurantId);
    const { supabaseAdmin, userId } = await staffMember(data.restaurantId, data.memberId);
    await supabaseAdmin.from("restaurant_members").delete().eq("id", data.memberId);
    const { count } = await supabaseAdmin.from("restaurant_members").select("id", { count: "exact", head: true }).eq("user_id", userId);
    if (!count) await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: true };
  });
