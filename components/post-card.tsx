"use client";

import { useState } from "react";
import { PostWithDetails } from "@/types/post";
import { Heart, MessageSquare, Edit, Trash2, Save, X } from "lucide-react";
import { deletePost, updatePost } from "@/lib/actions";
import { formatDistanceToNow } from "date-fns";
import { toast } from "react-toastify";
import { validateField, clientUpdatePostSchema } from "@/lib/client-validation";

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: string;
  onToggleLike: (postId: string, isLiked: boolean) => void;
  onPostUpdated?: (post: PostWithDetails) => void;
  onPostDeleted?: (postId: string) => void;
}

export function PostCard({
  post,
  currentUserId,
  onToggleLike,
  onPostUpdated,
  onPostDeleted,
}: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);

  const isOwner = currentUserId === post.author_id;
  const createdAt = new Date(post.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (result?.success) {
        onPostDeleted?.(post.id);
      } else {
        toast.error(result?.error || "Failed to delete post");
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    const content = editContent.trim();

    const error = validateField(clientUpdatePostSchema, "content", content);
    if (error) {
      setContentError(error);
      return;
    }

    if (content === post.content) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updatePost(post.id, formData);
      if (result?.success && result.data) {
        setIsEditing(false);
        setContentError(null);

        if (onPostUpdated) {
          const updatedPost: PostWithDetails = {
            ...post,
            ...result.data,
            profiles: post.profiles,
            like_count: post.like_count,
            is_liked: post.is_liked,
          };
          onPostUpdated(updatedPost);
        }
      } else {
        toast.error(result?.error || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleContentChange = (value: string) => {
    setEditContent(value);

    const error = validateField(
      clientUpdatePostSchema,
      "content",
      value.trim()
    );
    setContentError(error);
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setContentError(null);
    setIsEditing(false);
  };

  const handleLikeClick = () => {
    try {
      onToggleLike(post.id, post.is_liked);
      toast.success(post.is_liked ? "Post unliked" : "Post liked!");
    } catch (error) {
      toast.error("Failed to update like");
    }
  };

  const isUpdateDisabled =
    !editContent.trim() ||
    contentError !== null ||
    editContent.length > 280 ||
    isUpdating;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-light text-sm font-medium">
              {post.profiles.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium">{post.profiles.username}</p>
            <p className="text-sm text-gray-500">{timeAgo}</p>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-ghost p-1"
              title="Edit post"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="btn btn-ghost p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              title="Delete post"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="ml-10">
        {isEditing ? (
          <form action={handleUpdate} className="space-y-2">
            <div>
              <textarea
                name="content"
                value={editContent}
                onChange={(e) => handleContentChange(e.target.value)}
                className={`textarea w-full min-h-[80px] ${
                  contentError ? "border-red-500 focus:border-red-500" : ""
                }`}
                maxLength={300}
                disabled={isUpdating}
              />
              {contentError && (
                <p className="text-sm text-red-600 mt-1">{contentError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  editContent.length > 280
                    ? "text-red-600"
                    : editContent.length > 240
                    ? "text-yellow-600"
                    : "text-gray-500"
                }`}
              >
                {280 - editContent.length} characters remaining
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-ghost flex items-center space-x-1"
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  type="submit"
                  disabled={isUpdateDisabled}
                  className="btn btn-primary flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>{isUpdating ? "Saving..." : "Save"}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
            {post.content}
          </p>
        )}

        {!isEditing && (
          <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 transition-colors ${
                post.is_liked
                  ? "text-red-600"
                  : "text-gray-500 hover:text-red-600"
              }`}
            >
              <Heart
                className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`}
              />
              <span className="text-sm">{post.like_count}</span>
            </button>

            <div className="flex items-center space-x-1 text-gray-500">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Reply</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
