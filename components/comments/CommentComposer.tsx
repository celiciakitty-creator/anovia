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
  onSubmit: (message: string, category: CommentCategory) => void;
  submitLabel?: string;
  initialMessage?: string;
  initialCategory?: CommentCategory;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function CommentComposer({
  onSubmit,
  submitLabel = "Post comment",
  initialMessage = "",
  initialCategory = DEFAULT_COMMENT_CATEGORY,
  onCancel,
  autoFocus = false,
}: CommentComposerProps) {
  const [message, setMessage] = useState(initialMessage);
  const [category, setCategory] = useState<CommentCategory>(initialCategory);
  const [error, setError] = useState<string | undefined>();

  const categoryOptions = COMMENT_CATEGORIES.map((value) => ({
    value,
    label: COMMENT_CATEGORY_LABELS[value],
  }));

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const result = validateCommentMessage(message);
    if (!result.valid) {
      setError(result.error);
      return;
    }
    setError(undefined);
    onSubmit(message.trim(), category);
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
        />
        <p className="text-right text-[11px] text-muted-foreground">
          {message.trim().length}/{COMMENT_MAX_LENGTH}
        </p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" size="sm">
          {submitLabel}
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

  return (
    <div>
      <CommentComposer
        submitLabel={submitLabel}
        onSubmit={(message, category) => {
          const result = createComment({ parentType, parentId, message, category });
          if (!result.ok) setError(result.error);
          else setError(undefined);
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
