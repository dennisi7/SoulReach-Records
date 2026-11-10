import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getApprovedAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { supabase: null, user: null, approved: false };
  }
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, approved: false };

  const { data: admin } = await supabase.from("approved_admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return { supabase, user, approved: Boolean(admin) };
}
