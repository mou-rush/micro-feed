"use server";

import { createServerSupabaseClient } from "./supabase-server";
import { requireAuth } from "./auth";
import { createPostSchema, updatePostSchema } from "./validators";
import { revalidatePath } from "next/cache";
import { PostWithDetails } from "@/types/post";

export async function createPost(formData: FormData) {
  try {
    console.log("createPost: Starting...");

    const user = await requireAuth();
    console.log("createPost: User authenticated:", user.id);

    const supabase = await createServerSupabaseClient();
    const content = formData.get("content") as string;

    console.log("createPost: Content:", content);

    if (!content || !content.trim()) {
      return { success: false, error: "Content is required" };
    }

    /* Validate input */
    const validatedData = createPostSchema.parse({ content: content.trim() });
    console.log("createPost: Data validated:", validatedData);

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

    console.log("createPost: Success:", data);
    revalidatePath("/");
    return { success: true, data };
  } catch (error) {
    console.error("createPost: Caught error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/* Get posts with pagination and search */
export async function getPosts(
  params: {
    query?: string;
    cursor?: string;
    filter?: "all" | "mine";
  } = {}
) {
  try {
    const { query = "", cursor, filter = "all" } = params;

    console.log("getPosts: Starting with params:", { query, cursor, filter });

    const user = await requireAuth();
    console.log("getPosts: User authenticated:", user.id);

    const supabase = await createServerSupabaseClient();

    let queryBuilder = supabase
      .from("posts")
      .select("id, author_id, content, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(10);

    if (filter === "mine") {
      queryBuilder = queryBuilder.eq("author_id", user.id);
    }

    if (query && query !== "undefined") {
      queryBuilder = queryBuilder.ilike("content", `%${query}%`);
    }

    if (cursor) {
      queryBuilder = queryBuilder.lt("created_at", cursor);
    }

    console.log("getPosts: Executing posts query...");
    const { data: posts, error: postsError } = await queryBuilder;

    if (postsError) {
      console.error("getPosts: Posts query error:", postsError);
      throw new Error(postsError.message);
    }

    if (!posts || posts.length === 0) {
      console.log("getPosts: No posts found");
      return [];
    }

    console.log("getPosts: Found posts:", posts.length);

    const authorIds = [...new Set(posts.map((post) => post.author_id))];
    console.log("getPosts: Fetching profiles for authors:", authorIds);

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", authorIds);

    if (profilesError) {
      console.error("getPosts: Profiles query error:", profilesError);
      throw new Error(profilesError.message);
    }

    console.log("getPosts: Found profiles:", profiles?.length || 0);

    const postIds = posts.map((post) => post.id);
    console.log("getPosts: Fetching likes for posts:", postIds);

    const { data: likes, error: likesError } = await supabase
      .from("likes")
      .select("post_id, user_id")
      .in("post_id", postIds);

    if (likesError) {
      console.warn("getPosts: Likes query error (non-fatal):", likesError);
    }

    console.log("getPosts: Found likes:", likes?.length || 0);

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

    console.log(
      "getPosts: Final result:",
      postsWithDetails.length,
      "posts with details"
    );
    return postsWithDetails;
  } catch (error) {
    console.error("getPosts: Error:", error);
    throw error;
  }
}

/* Update a post (only by the author) */
export async function updatePost(postId: string, formData: FormData) {
  try {
    const user = await requireAuth();
    const supabase = await createServerSupabaseClient();
    const content = formData.get("content") as string;

    if (!content || !content.trim()) {
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

    revalidatePath("/");
    return { success: true, data };
  } catch (error) {
    console.error("updatePost: Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/* Delete a post (only by the author) */
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

    revalidatePath("/");
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

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("toggleLike: Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
