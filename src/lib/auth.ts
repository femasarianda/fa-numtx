import { supabase } from "@/integrations/supabase/client";

export interface AuthProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: "admin" | "operator" | null;
}

export async function loginUser(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

export async function fetchUserProfile(userId: string): Promise<{
  full_name: string | null;
  role: "admin" | "operator" | null;
}> {
  const [profileRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
  ]);

  const role =
    rolesRes.data?.find((r) => r.role === "admin")?.role ??
    rolesRes.data?.[0]?.role ??
    null;

  return {
    full_name: profileRes.data?.full_name ?? null,
    role: (role as "admin" | "operator" | null) ?? null,
  };
}
