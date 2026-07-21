"use client";

import { useState } from "react";
import { Badge, Button, DeleteConfirmModal } from "@/components/ui";
import { CommentComposer } from "@/components/comments/CommentComposer";
import { useComments } from "@/components/comments/CommentsProvider";
import {
  canEditComment,
  formatCommentTimestamp,
} from "@/lib/comment-utils";
import {
  COMMENT_CATEGORY_LABELS,
  COMMENT_CATEGORY_STYLES,
  type Comment,
} from "@/types/comment";
import { cn } from "@/lib/utils";

type CommentItemProps = {
  comment: Comment;
};

export function CommentItem({ comment }: CommentItemProps) {
  const { currentUserId, updateComment, deleteComment } = useComments();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const isOwn = canEditComment(comment, currentUserId);

  const handleUpdate = async (
    message: string,
    category: typeof comment.category
  ) => {
    if (isSaving) return;
    setIsSaving(true);
    setError(undefined);
    try {
      const result = await updateComment(comment.id, message, category);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <li className="rounded-lg border border-border bg-card p-3 sm:p-4">
      <div className="flex items-start gap-3">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground"
          aria-hidden
        >
          {comment.authorInitials}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-medium text-foreground">
              {comment.authorName}
            </p>
            <time
              className="text-xs text-muted-foreground"
              dateTime={comment.createdAt}
              title={new Date(comment.createdAt).toLocaleString()}
            >
              {formatCommentTimestamp(comment.updatedAt)}
            </time>
            {comment.edited ? (
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Edited
              </span>
            ) : null}
            <Badge
              className={cn(
                "border text-[10px]",
                COMMENT_CATEGORY_STYLES[comment.category]
              )}
            >
              {COMMENT_CATEGORY_LABELS[comment.category]}
            </Badge>
          </div>

          {isEditing ? (
            <div className="mt-3">
              <CommentComposer
                initialMessage={comment.message}
                initialCategory={comment.category}
                submitLabel={isSaving ? "Saving…" : "Save changes"}
                isSubmitting={isSaving}
                onCancel={() => {
                  if (isSaving) return;
                  setIsEditing(false);
                  setError(undefined);
                }}
                onSubmit={handleUpdate}
                autoFocus
              />
              {error ? (
                <p className="mt-2 text-xs text-danger" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {comment.message}
            </p>
          )}

          {isOwn && !isEditing ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteComment(comment.id);
        }}
        title="Delete comment"
        description="This comment will be permanently removed."
      />
    </li>
  );
}
