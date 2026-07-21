"use client";

import { useState } from "react";
import { Button, Select, Textarea } from "@/components/ui";
import {
  DEFAULT_COMMENT_CATEGORY,
  useComments,
} from "@/components/comments/CommentsProvider";
import { validateCommentMessage } from "@/lib/comment-utils";
import {
  COMMENT_CATEGORIES,
  COMMENT_CATEGORY_LABELS,
  COMMENT_MAX_LENGTH,
  type CommentCategory,
  type CommentParentType,
} from "@/types/comment";

type CommentComposerProps = {
  onSubmit: (message: string, category: CommentCategory) => void | Promise<void>;
  submitLabel?: string;
  initialMessage?: string;
  initialCategory?: CommentCategory;
  onCancel?: () => void;
  autoFocus?: boolean;
  isSubmitting?: boolean;
};

export function CommentComposer({
  onSubmit,
  submitLabel = "Post comment",
  initialMessage = "",
  initialCategory = DEFAULT_COMMENT_CATEGORY,
  onCancel,
  autoFocus = false,
  isSubmitting = false,
}: CommentComposerProps) {
  const [message, setMessage] = useState(initialMessage);
  const [category, setCategory] = useState<CommentCategory>(initialCategory);
  const [error, setError] = useState<string | undefined>();

  const categoryOptions = COMMENT_CATEGORIES.map((value) => ({
    value,
    label: COMMENT_CATEGORY_LABELS[value],
  }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const result = validateCommentMessage(message);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError(undefined);
    await onSubmit(message.trim(), category);
    if (!onCancel) {
      setMessage("");
      setCategory(DEFAULT_COMMENT_CATEGORY);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select
        label="Category"
        name="commentCategory"
        value={category}
        onChange={(event) => setCategory(event.target.value as CommentCategory)}
        options={categoryOptions}
        disabled={isSubmitting}
      />
      <div className="space-y-1.5">
        <Textarea
          label="Message"
          name="commentMessage"
          value={message}
          onChange={(event) => {
            setMessage(event.target.value);
            if (error) setError(undefined);
          }}
          placeholder="Share an update, question, or idea…"
          maxLength={COMMENT_MAX_LENGTH}
          rows={3}
          autoFocus={autoFocus}
          error={error}
          disabled={isSubmitting}
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {message.trim().length}/{COMMENT_MAX_LENGTH}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Posting…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

type CommentComposerConnectedProps = {
  parentType: CommentParentType;
  parentId: string;
  submitLabel?: string;
};

export function CommentComposerConnected({
  parentType,
  parentId,
  submitLabel,
}: CommentComposerConnectedProps) {
  const { createComment } = useComments();
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div>
      <CommentComposer
        submitLabel={submitLabel}
        isSubmitting={isSubmitting}
        onSubmit={async (message, category) => {
          if (isSubmitting) return;
          setIsSubmitting(true);
          setError(undefined);
          try {
            const result = await createComment({
              parentType,
              parentId,
              message,
              category,
            });
            if (!result.ok) setError(result.error);
          } finally {
            setIsSubmitting(false);
          }
        }}
      />
      {error ? (
        <p className="mt-2 text-xs text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
