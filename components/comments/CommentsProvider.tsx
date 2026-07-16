"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWorkspace } from "@/components/workspace";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import {
  canEditComment,
  getCommentCountForThread,
  getCommentsForThread,
  getCurrentUser,
  validateCommentMessage,
  CURRENT_USER_ID,
  DEFAULT_COMMENT_CATEGORY,
} from "@/lib/comment-utils";
import { readComments, writeComments } from "@/lib/comments-storage";
import { generateId } from "@/lib/id";
import type {
  Comment,
  CommentCategory,
  CommentInput,
  CommentParentType,
} from "@/types/comment";

type CommentsContextValue = {
  comments: Comment[];
  isLoaded: boolean;
  currentUserId: string;
  getThreadComments: (
    parentType: CommentParentType,
    parentId: string
  ) => Comment[];
  getCommentCount: (
    parentType: CommentParentType,
    parentId: string
  ) => number;
  createComment: (input: CommentInput) => { ok: true } | { ok: false; error: string };
  updateComment: (
    id: string,
    message: string,
    category?: CommentCategory
  ) => { ok: true } | { ok: false; error: string };
  deleteComment: (id: string) => void;
};

const CommentsContext = createContext<CommentsContextValue | null>(null);

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const { users } = useWorkspace();
  const storageReady = useStorageHydration();
  const [comments, setComments] = useState<Comment[]>([]);
  const commentsLoadedRef = useRef(false);

  useEffect(() => {
    if (!storageReady || commentsLoadedRef.current) return;
    commentsLoadedRef.current = true;
    setComments(readComments());
  }, [storageReady]);

  const persist = useCallback((next: Comment[]) => {
    setComments(next);
    writeComments(next);
  }, []);

  const getThreadComments = useCallback(
    (parentType: CommentParentType, parentId: string) => {
      if (!storageReady) return [];
      return getCommentsForThread(comments, parentType, parentId);
    },
    [comments, storageReady]
  );

  const getCommentCount = useCallback(
    (parentType: CommentParentType, parentId: string) => {
      if (!storageReady) return 0;
      return getCommentCountForThread(comments, parentType, parentId);
    },
    [comments, storageReady]
  );

  const createComment = useCallback(
    (input: CommentInput) => {
      const validation = validateCommentMessage(input.message);
      if (!validation.valid) {
        return { ok: false as const, error: validation.error ?? "Invalid comment." };
      }

      const author = getCurrentUser(users);
      if (!author) {
        return { ok: false as const, error: "Unable to resolve current user." };
      }

      const now = new Date().toISOString();
      const comment: Comment = {
        id: generateId("comment"),
        parentType: input.parentType,
        parentId: input.parentId,
        authorId: author.id,
        authorName: author.name,
        authorInitials: author.initials,
        message: input.message.trim(),
        category: input.category,
        createdAt: now,
        updatedAt: now,
        edited: false,
      };

      persist([comment, ...comments]);
      return { ok: true as const };
    },
    [comments, persist, users]
  );

  const updateComment = useCallback(
    (id: string, message: string, category?: CommentCategory) => {
      const validation = validateCommentMessage(message);
      if (!validation.valid) {
        return { ok: false as const, error: validation.error ?? "Invalid comment." };
      }

      const existing = comments.find((comment) => comment.id === id);
      if (!existing || !canEditComment(existing, CURRENT_USER_ID)) {
        return { ok: false as const, error: "You can only edit your own comments." };
      }

      const now = new Date().toISOString();
      persist(
        comments.map((comment) =>
          comment.id === id
            ? {
                ...comment,
                message: message.trim(),
                category: category ?? comment.category,
                updatedAt: now,
                edited: true,
              }
            : comment
        )
      );
      return { ok: true as const };
    },
    [comments, persist]
  );

  const deleteComment = useCallback(
    (id: string) => {
      const existing = comments.find((comment) => comment.id === id);
      if (!existing || !canEditComment(existing, CURRENT_USER_ID)) return;
      persist(comments.filter((comment) => comment.id !== id));
    },
    [comments, persist]
  );

  const value = useMemo(
    () => ({
      comments,
      isLoaded: storageReady,
      currentUserId: CURRENT_USER_ID,
      getThreadComments,
      getCommentCount,
      createComment,
      updateComment,
      deleteComment,
    }),
    [
      comments,
      storageReady,
      getThreadComments,
      getCommentCount,
      createComment,
      updateComment,
      deleteComment,
    ]
  );

  return (
    <CommentsContext.Provider value={value}>{children}</CommentsContext.Provider>
  );
}

export function useComments() {
  const context = useContext(CommentsContext);
  if (!context) {
    throw new Error("useComments must be used within CommentsProvider");
  }
  return context;
}

export function useCommentCount(
  parentType: CommentParentType,
  parentId: string
): number {
  const { getCommentCount } = useComments();
  return getCommentCount(parentType, parentId);
}

export { DEFAULT_COMMENT_CATEGORY };
