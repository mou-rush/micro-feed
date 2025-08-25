"use client";

import { useState, useRef } from "react";
import { createPost } from "@/lib/actions";
import { Send } from "lucide-react";

interface ComposerProps {
  onOptimisticAdd?: (post: {
    content: string;
    author_id: string;
    profiles: { username: string };
  }) => void;
  currentUser?: { id: string; username: string };
}

export function Composer({ onOptimisticAdd, currentUser }: ComposerProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (formData: FormData) => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (onOptimisticAdd && currentUser) {
        onOptimisticAdd({
          content: content.trim(),
          author_id: currentUser.id,
          profiles: { username: currentUser.username },
        });
      }

      const contentToSubmit = content.trim();
      setContent("");
      formRef.current?.reset();

      const result = await createPost(formData);

      console.log("Create post result:", result);

      if (result && !result.success) {
        /* If creation failed, restore the content and show error */
        setContent(contentToSubmit);
        const errorMessage = result.error || "Unknown error occurred";
        console.error("Failed to create post:", errorMessage);
        alert(`Failed to create post: ${errorMessage}`);
      } else if (!result) {
        /* If result is undefined, there was an error */
        setContent(contentToSubmit);
        console.error("Create post returned undefined");
        alert("Failed to create post: Server error");
      } else {
        console.log("Post created successfully:", result.data);
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
      /* Restore content on error */
      const originalContent = formData.get("content") as string;
      if (originalContent) {
        setContent(originalContent);
      }
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
