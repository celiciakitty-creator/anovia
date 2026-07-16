import type {
  Comment,
  CommentCategory,
  CommentParentType,
} from "@/types/comment";
import { COMMENT_MAX_LENGTH } from "@/types/comment";
import type { User } from "@/types/user";

/** Mock current user until authentication is added. */
export const CURRENT_USER_ID = "user_1";

export function getCurrentUser(users: User[]): User | undefined {
  return users.find((user) => user.id === CURRENT_USER_ID) ?? users[0];
}

export function validateCommentMessage(message: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = message.trim();
  if (!trimmed) {
    return { valid: false, error: "Comment cannot be empty." };
  }
  if (trimmed.length > COMMENT_MAX_LENGTH) {
    return {
      valid: false,
      error: `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`,
    };
  }
  return { valid: true };
}

export function getCommentsForThread(
  comments: Comment[],
  parentType: CommentParentType,
  parentId: string
): Comment[] {
  return comments
    .filter(
      (comment) =>
        comment.parentType === parentType && comment.parentId === parentId
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
}

export function getCommentCountForThread(
  comments: Comment[],
  parentType: CommentParentType,
  parentId: string
): number {
  return comments.filter(
    (comment) =>
      comment.parentType === parentType && comment.parentId === parentId
  ).length;
}

export function formatCommentTimestamp(
  iso: string,
  reference = new Date()
): string {
  const date = new Date(iso);
  const diffMs = reference.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== reference.getFullYear() ? "numeric" : undefined,
  });
}

export function canEditComment(comment: Comment, userId: string): boolean {
  return comment.authorId === userId;
}

export const DEFAULT_COMMENT_CATEGORY: CommentCategory = "discussion";
