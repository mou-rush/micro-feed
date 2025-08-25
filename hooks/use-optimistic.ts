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
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        /* The UI will revert automatically since we're using server actions with revalidatePath */
      }
    });
  };

  return {
    optimisticPosts,
    handleToggleLike,
    isPending,
  };
}

export function useOptimisticPosts(initialPosts: PostWithDetails[]) {
  const [optimisticPosts, addOptimisticPost] = useOptimistic(
    initialPosts,
    (state: PostWithDetails[], newPost: Partial<PostWithDetails>) => {
      const optimisticPost: PostWithDetails = {
        id: "temp-" + Date.now(),
        author_id: newPost.author_id || "",
        content: newPost.content || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profiles: newPost.profiles || { id: "", username: "", created_at: "" },
        like_count: 0,
        is_liked: false,
      };

      return [optimisticPost, ...state];
    }
  );

  const [isPending, startTransition] = useTransition();

  const addPost = (newPost: Partial<PostWithDetails>) => {
    startTransition(() => {
      addOptimisticPost(newPost);
    });
  };

  return {
    optimisticPosts,
    addPost,
    isPending,
  };
}
