/** Comment thread parent — project, task, or team discussion. */
export type CommentParentType = "project" | "task" | "team";

export type CommentCategory =
  | "discussion"
  | "idea"
  | "question"
  | "blocked"
  | "update"
  | "review";

export type Comment = {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  message: string;
  category: CommentCategory;
  createdAt: string;
  updatedAt: string;
  edited: boolean;
};

export type CommentInput = {
  parentType: CommentParentType;
  parentId: string;
  message: string;
  category: CommentCategory;
};

export const COMMENT_CATEGORIES: CommentCategory[] = [
  "discussion",
  "idea",
  "question",
  "blocked",
  "update",
  "review",
];

export const COMMENT_CATEGORY_LABELS: Record<CommentCategory, string> = {
  discussion: "Discussion",
  idea: "Idea",
  question: "Question",
  blocked: "Blocked",
  update: "Update",
  review: "Review",
};

export const COMMENT_CATEGORY_STYLES: Record<CommentCategory, string> = {
  discussion: "border-border bg-muted/40 text-foreground",
  idea: "border-accent/30 bg-accent/10 text-accent",
  question: "border-warning/30 bg-warning/10 text-warning",
  blocked: "border-danger/30 bg-danger/10 text-danger",
  update: "border-success/30 bg-success/10 text-success",
  review: "border-primary/30 bg-primary/10 text-primary",
};

export const COMMENT_MAX_LENGTH = 2000;

/** Stable id for the general team discussion thread. */
export const TEAM_GENERAL_THREAD_ID = "team-general";
