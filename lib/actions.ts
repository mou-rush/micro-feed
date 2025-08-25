"use server";

import { createServerSupabaseClient } from "./supabase-server";
import { requireAuth } from "./auth";
import { createPostSchema, updatePostSchema } from "./validators";
import { PostWithDetails } from "@/types/post";

export async function createPost(formData: FormData) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const content = formData.get("content") as string;

    if (!content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    const validatedData = createPostSchema.parse({ content: content.trim() });

    const { data, error } = await supabase
      .from("posts")
      .insert([
        {
          author_id: user.id,
          content: validatedData.content,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("createPost: Database error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("createPost: Caught error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function getPosts(
  params: {
    query?: string;
    cursor?: string;
    filter?: "all" | "mine";
    userId?: string;
  } = {}
) {
  try {
    const { query = "", cursor, filter = "all" } = params;

    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    let queryBuilder = supabase
      .from("posts")
      .select("id, author_id, content, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(10);
    if (filter === "mine") {
      queryBuilder = queryBuilder.eq("author_id", user.id);
    }

    if (query && query.trim() !== "") {
      console.log("Applying search query:", query.trim());
      queryBuilder = queryBuilder.ilike("content", `%${query.trim()}%`);
    }

    if (cursor) {
      queryBuilder = queryBuilder.lt("created_at", cursor);
    }

    const { data: posts, error: postsError } = await queryBuilder;

    if (postsError) {
      console.error("getPosts: Posts query error:", postsError);
      throw new Error(postsError.message);
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    const authorIds = [...new Set(posts.map((post) => post.author_id))];

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, created_at")
      .in("id", authorIds);

    if (profilesError) {
      console.error("getPosts: Profiles query error:", profilesError);
      throw new Error(profilesError.message);
    }

    const postIds = posts.map((post) => post.id);

    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    if (likesError) {
      console.warn("getPosts: Likes query error (non-fatal):", likesError);
    }

    const profilesMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    const postsWithDetails: PostWithDetails[] = posts.map((post) => {
      const postLikes = likes?.filter((like) => like.post_id === post.id) || [];
      const profile = profilesMap.get(post.author_id);

      return {
        ...post,
        profiles: profile || {
          id: post.author_id,
          username: "Unknown User",
          created_at: new Date().toISOString(),
        },
        like_count: postLikes.length,
        is_liked: postLikes.some((like) => like.user_id === user.id),
      };
    });

    return postsWithDetails;
  } catch (error) {
    console.error("getPosts: Error:", error);
    throw error;
  }
}

export async function updatePost(postId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const content = formData.get("content") as string;

    if (!content?.trim()) {
      return { success: false, error: "Content is required" };
    }

    const validatedData = updatePostSchema.parse({ content: content.trim() });

    const { data, error } = await supabase
      .from("posts")
      .update({
        content: validatedData.content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", postId)
      .eq("author_id", user.id)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error("updatePost: Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function deletePost(postId: string) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("author_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("deletePost: Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function toggleLike(postId: string, isLiked: boolean) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();

    if (isLiked) {
      const { error } = await supabase
        .from("likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from("likes")
        .insert([{ post_id: postId, user_id: user.id }]);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("toggleLike: Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
