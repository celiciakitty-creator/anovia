import type { Comment, CommentCategory, CommentParentType } from "@/types/comment";
import { COMMENT_CATEGORIES, COMMENT_MAX_LENGTH } from "@/types/comment";

export const COMMENTS_STORAGE_KEY = "anovia-comments";

const PARENT_TYPES: CommentParentType[] = ["project", "task", "team"];

function isCommentCategory(value: unknown): value is CommentCategory {
  return (
    typeof value === "string" &&
    (COMMENT_CATEGORIES as readonly string[]).includes(value)
  );
}

function isParentType(value: unknown): value is CommentParentType {
  return typeof value === "string" && PARENT_TYPES.includes(value as CommentParentType);
}

function normalizeComment(value: unknown): Comment | null {
  if (!value || typeof value !== "object") return null;

  const item = value as Partial<Comment>;
  if (
    typeof item.id !== "string" ||
    !isParentType(item.parentType) ||
    typeof item.parentId !== "string" ||
    typeof item.authorId !== "string" ||
    typeof item.authorName !== "string" ||
    typeof item.authorInitials !== "string" ||
    typeof item.message !== "string" ||
    !isCommentCategory(item.category) ||
    typeof item.createdAt !== "string" ||
    typeof item.updatedAt !== "string" ||
    typeof item.edited !== "boolean"
  ) {
    return null;
  }

  const message = item.message.trim().slice(0, COMMENT_MAX_LENGTH);
  if (!message) return null;

  return {
    id: item.id,
    parentType: item.parentType,
    parentId: item.parentId,
    authorId: item.authorId,
    authorName: item.authorName.trim(),
    authorInitials: item.authorInitials.trim().slice(0, 4),
    message,
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    edited: item.edited,
  };
}

function normalizeComments(value: unknown): Comment[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(normalizeComment)
    .filter((comment): comment is Comment => comment !== null);
}

export function readComments(): Comment[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    const comments = normalizeComments(parsed);
    if (comments.length !== (Array.isArray(parsed) ? parsed.length : 0)) {
      writeComments(comments);
    }
    return comments;
  } catch {
    writeComments([]);
    return [];
  }
}

export function writeComments(comments: Comment[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
}
