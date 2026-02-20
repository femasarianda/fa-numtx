import { supabase } from "@/integrations/supabase/client";

const AUTH_KEY = "fa_numtx_user";

export interface AuthUser {
  id: string;
  username: string;
  full_name: string | null;
  role: string | null;
  is_active: boolean | null;
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(AUTH_KEY);
}

export async function loginUser(username: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, full_name, role, is_active")
    .eq("username", username)
    .eq("password", password)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    throw new Error("Username atau password salah");
  }

  const user: AuthUser = data;
  storeUser(user);
  return user;
}
