import { supabase } from "@/integrations/supabase/client";

/** Where a freshly signed-in user lands: platform admins open the admin area first. */
export async function homeRoute(): Promise<"/admin" | "/dashboard"> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return "/dashboard";
  const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  return data ? "/admin" : "/dashboard";
}
