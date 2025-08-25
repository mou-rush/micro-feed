"use client";

import { useState, useRef } from "react";
import { createPost } from "@/lib/actions";
import { Send } from "lucide-react";
import { toast } from "react-toastify";
import { PostWithDetails } from "@/types/post";

interface ComposerProps {
  currentUser: { id: string; username: string };
  onPostCreated?: (post: PostWithDetails) => void;
}

export function Composer({ currentUser, onPostCreated }: ComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const contentToSubmit = content.trim();

    try {
      setContent("");
      formRef.current?.reset();

      const result = await createPost(formData);

      if (result?.success && result.data) {
        const fullPost: PostWithDetails = {
          ...result.data,
          profiles: {
            id: currentUser.id,
            username: currentUser.username,
            created_at: new Date().toISOString(),
          },
          like_count: 0,
          is_liked: false,
        };

        if (onPostCreated) {
          onPostCreated(fullPost);
        }
      } else if (result && !result.success) {
        setContent(contentToSubmit);
        toast.error(result.error || "Failed to create post");
      } else {
        setContent(contentToSubmit);
        toast.error("Failed to create post: Server error");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Failed to create post. Please try again.");
      setContent(contentToSubmit);
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingChars = 280 - content.length;
  const isOverLimit = remainingChars < 0;

  return (
    <div className="card p-4 mb-6">
      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <div>
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="textarea min-h-[100px]"
            disabled={isSubmitting}
            maxLength={300}
          />
          <div className="flex items-center justify-between mt-2">
            <span
              className={`text-sm ${
                isOverLimit
                  ? "text-red-600 dark:text-red-400"
                  : remainingChars <= 20
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {remainingChars} characters remaining
            </span>
            <button
              type="submit"
              disabled={!content.trim() || isOverLimit || isSubmitting}
              className="btn btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? "Posting..." : "Post"}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
