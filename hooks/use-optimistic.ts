"use client";

import { useOptimistic, useTransition } from "react";
import { PostWithDetails } from "@/types/post";
import { toggleLike } from "@/lib/actions";

export function useOptimisticLikes(posts: PostWithDetails[]) {
  const [optimisticPosts, addOptimisticUpdate] = useOptimistic(
    posts,
    (
      state: PostWithDetails[],
      { postId, isLiked }: { postId: string; isLiked: boolean }
    ) => {
      return state.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            is_liked: !isLiked,
            like_count: isLiked ? post.like_count - 1 : post.like_count + 1,
          };
        }
        return post;
      });
    }
  );

  const [isPending, startTransition] = useTransition();

  const handleToggleLike = async (postId: string, isLiked: boolean) => {
    startTransition(async () => {
      addOptimisticUpdate({ postId, isLiked });

      try {
        const result = await toggleLike(postId, isLiked);
        if (result && !result.success) {
          console.error("Error toggling like:", result.error);
          /* The optimistic update will be reverted automatically */
        }
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    });
  };

  return {
    optimisticPosts,
    handleToggleLike,
    isPending,
  };
}
