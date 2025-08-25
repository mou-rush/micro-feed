import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getOrCreateProfile } from "@/lib/auth";
import { Header } from "@/components/header";
import { SearchFilter } from "@/components/search-filter";
import { FeedContent } from "@/components/feed-content";
import { LoadingSpinner } from "@/components/loading-spinner";

interface PageProps {
  searchParams: Promise<{
    query?: string;
    cursor?: string;
    filter?: "all" | "mine";
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const profile = await getOrCreateProfile(user);

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <SearchFilter />

        <Suspense fallback={<LoadingSpinner />}>
          <FeedContent
            searchParams={resolvedSearchParams}
            currentUser={{ id: user.id, username: profile.username }}
          />
        </Suspense>
      </main>
    </div>
  );
}
