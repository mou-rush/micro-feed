import { createServerSupabaseClient } from "@/lib/supabase-server";
import { LogOut, MessageSquare } from "lucide-react";
import { redirect } from "next/navigation";

export async function Header() {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  async function signOut() {
    "use server";
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <header className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Micro Feed</h1>
        </div>

        <div className="flex items-center space-x-2">
          {user && (
            <form action={signOut}>
              <button
                type="submit"
                className="btn btn-ghost p-2"
                title="Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
