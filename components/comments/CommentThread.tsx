"use client";

import { useMemo, useRef } from "react";
import { Card, CardHeader, EmptyState } from "@/components/ui";
import { CommentComposerConnected } from "@/components/comments/CommentComposer";
import { CommentItem } from "@/components/comments/CommentItem";
import { useComments } from "@/components/comments/CommentsProvider";
import { PAGE_EMPTY_STATES, type EmptyStateCopy } from "@/data/empty-states";
import type { CommentParentType } from "@/types/comment";
import { cn } from "@/lib/utils";

type CommentThreadProps = {
  parentType: CommentParentType;
  parentId: string;
  title?: string;
  description?: string;
  /** When true, renders without Card wrapper (e.g. inside a modal). */
  embedded?: boolean;
  className?: string;
};

const EMPTY_COPY_BY_PARENT: Record<CommentParentType, EmptyStateCopy> = {
  project: PAGE_EMPTY_STATES.commentsProject,
  task: PAGE_EMPTY_STATES.commentsTask,
  team: PAGE_EMPTY_STATES.commentsTeam,
};

export function CommentThread({
  parentType,
  parentId,
  title = "Discussion",
  description = "Comments are saved locally in your browser — not real-time collaboration.",
  embedded = false,
  className,
}: CommentThreadProps) {
  const { getThreadComments, isLoaded } = useComments();
  const composerRef = useRef<HTMLDivElement>(null);
  const threadComments = useMemo(
    () => getThreadComments(parentType, parentId),
    [getThreadComments, parentType, parentId]
  );
  const emptyCopy = EMPTY_COPY_BY_PARENT[parentType];

  const focusComposer = () => {
    composerRef.current?.querySelector("textarea")?.focus();
  };

  const body = (
    <div className={cn("space-y-4", className)}>
      <div ref={composerRef}>
        <CommentComposerConnected
          parentType={parentType}
          parentId={parentId}
          submitLabel={
            parentType === "team" ? "Post to team" : "Post comment"
          }
        />
      </div>

      {!isLoaded ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : threadComments.length === 0 ? (
        <EmptyState
          compact
          title={emptyCopy.title}
          description={emptyCopy.description}
          kizunaMessage={emptyCopy.kizunaMessage}
          emoji={emptyCopy.emoji}
          actionLabel={emptyCopy.actionLabel}
          onAction={focusComposer}
        />
      ) : (
        <div>
          <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {threadComments.length} comment
            {threadComments.length !== 1 ? "s" : ""} · Newest first
          </p>
          <ul className="space-y-3" aria-label={`${title} comments`}>
            {threadComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return (
      <section aria-label={title} className={className}>
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
        {body}
      </section>
    );
  }

  return (
    <Card className={className}>
      <CardHeader title={title} description={description} />
      {body}
    </Card>
  );
}
