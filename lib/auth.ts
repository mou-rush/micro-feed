import { createServerSupabaseClient } from "./supabase-server";
import { redirect } from "next/navigation";

export async function getUser() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireAuth() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }

  return profile;
}

export async function getOrCreateProfile(user: any) {
  let profile = await getUserProfile(user.id);

  if (!profile) {
    /* Create profile if it doesn't exist */
    const username =
      user.user_metadata?.username ||
      user.email?.split("@")[0] ||
      `user_${user.id.slice(0, 8)}`;

    const supabase = await createServerSupabaseClient();

    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert([
        {
          id: user.id,
          username,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      /*  Return a fallback profile */
      return {
        id: user.id,
        username,
        created_at: new Date().toISOString(),
      };
    }

    profile = newProfile;
  }

  return profile;
}
