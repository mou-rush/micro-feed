"use client";

import { useState, useEffect } from "react";
import { getPosts } from "@/lib/actions";
import { PostWithDetails } from "@/types/post";
import { Composer } from "./composer";
import { PostCard } from "./post-card";
import { LoadingSpinner } from "./loading-spinner";
import { useOptimisticLikes, useOptimisticPosts } from "@/hooks/use-optimistic";

interface FeedContentProps {
  searchParams: {
    query?: string;
    cursor?: string;
    filter?: "all" | "mine";
  };
  currentUser: { id: string; username: string };
}

export function FeedContent({ searchParams, currentUser }: FeedContentProps) {
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const { optimisticPosts: optimisticPostsList, addPost } =
    useOptimisticPosts(posts);
  const { optimisticPosts, handleToggleLike } =
    useOptimisticLikes(optimisticPostsList);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        const newPosts = await getPosts({
          query: searchParams.query,
          filter: searchParams.filter || "all",
        });
        setPosts(newPosts);
        setHasMore(newPosts.length === 10);
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [searchParams.query, searchParams.filter]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const lastPost = posts[posts.length - 1];
      const morePosts = await getPosts({
        query: searchParams.query,
        filter: searchParams.filter || "all",
        cursor: lastPost?.created_at,
      });

      if (morePosts.length > 0) {
        setPosts((prev) => [...prev, ...morePosts]);
        setHasMore(morePosts.length === 10);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error loading more posts:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOptimisticAdd = (newPost: any) => {
    addPost({
      ...newPost,
      profiles: {
        id: currentUser.id,
        username: currentUser.username,
        created_at: new Date().toISOString(),
      },
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div>
      <Composer
        onOptimisticAdd={handleOptimisticAdd}
        currentUser={currentUser}
      />

      <div className="space-y-4">
        {optimisticPosts.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searchParams.query || searchParams.filter === "mine"
                ? "No posts found matching your criteria."
                : "No posts yet. Be the first to share something!"}
            </p>
          </div>
        ) : (
          optimisticPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              onToggleLike={handleToggleLike}
            />
          ))
        )}

        {hasMore && posts.length > 0 && (
          <div className="flex justify-center pt-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn btn-secondary"
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        )}

        {!hasMore && posts.length > 0 && (
          <div className="text-center pt-4">
            <p className="text-gray-500 dark:text-gray-400">
              You&apos;ve reached the end!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
