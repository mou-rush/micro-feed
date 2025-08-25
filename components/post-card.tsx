"use client";

import { useState } from "react";
import { PostWithDetails } from "@/types/post";
import { Heart, MessageSquare, Edit, Trash2, Save, X } from "lucide-react";
import { deletePost, updatePost } from "@/lib/actions";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: PostWithDetails;
  currentUserId?: string;
  onToggleLike: (postId: string, isLiked: boolean) => void;
}

export function PostCard({ post, currentUserId, onToggleLike }: PostCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const isOwner = currentUserId === post.author_id;
  const createdAt = new Date(post.created_at);
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    setIsDeleting(true);
    try {
      const result = await deletePost(post.id);
      if (result && !result.success) {
        alert(`Failed to delete post: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editContent.trim() || editContent === post.content) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updatePost(post.id, formData);
      if (result?.success) {
        setIsEditing(false);
      } else {
        alert(`Failed to update post: ${result?.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

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
            <textarea
              name="content"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="textarea w-full min-h-[80px]"
              maxLength={280}
              disabled={isUpdating}
            />
            <div className="flex items-center justify-between">
              <span
                className={`text-sm ${
                  editContent.length > 280 ? "text-red-600" : "text-gray-500"
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
                  disabled={
                    !editContent.trim() ||
                    editContent.length > 280 ||
                    isUpdating
                  }
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
              onClick={() => onToggleLike(post.id, post.is_liked)}
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
