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
import {
  canEditComment,
  getCommentCountForThread,
  getCommentsForThread,
  getCurrentUser,
  validateCommentMessage,
  DEFAULT_COMMENT_CATEGORY,
} from "@/lib/comment-utils";
import {
  createComment as createCommentDb,
  deleteComment as deleteCommentDb,
  getComments,
  mapCommentRow,
  updateComment as updateCommentDb,
} from "@/lib/comments-db";
import { createClient } from "@/utils/supabase/client";
import type {
  Comment,
  CommentCategory,
  CommentInput,
  CommentParentType,
} from "@/types/comment";

type MutationResult =
  | { ok: true }
  | { ok: false; error: string };

type CommentsContextValue = {
  comments: Comment[];
  isLoaded: boolean;
  loadError: string | null;
  currentUserId: string | null;
  getThreadComments: (
    parentType: CommentParentType,
    parentId: string
  ) => Comment[];
  getCommentCount: (
    parentType: CommentParentType,
    parentId: string
  ) => number;
  createComment: (input: CommentInput) => Promise<MutationResult>;
  updateComment: (
    id: string,
    message: string,
    category?: CommentCategory
  ) => Promise<MutationResult>;
  deleteComment: (id: string) => Promise<void>;
  refreshComments: () => Promise<void>;
};

const CommentsContext = createContext<CommentsContextValue | null>(null);

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const { users, currentUserId, isLoaded: workspaceLoaded } = useWorkspace();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!workspaceLoaded || !currentUserId) return;

    setLoadError(null);

    try {
      const supabase = createClient();
      const rows = await getComments(supabase);
      setComments(rows.map((row) => mapCommentRow(row, users)));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load comments."
      );
    } finally {
      setIsLoaded(true);
    }
  }, [workspaceLoaded, currentUserId, users]);

  useEffect(() => {
    if (!workspaceLoaded) return;

    if (!currentUserId) {
      loadedUserIdRef.current = null;
      queueMicrotask(() => {
        setComments([]);
        setIsLoaded(true);
      });
      return;
    }

    if (loadedUserIdRef.current === currentUserId) return;

    loadedUserIdRef.current = currentUserId;
    queueMicrotask(() => {
      setIsLoaded(false);
      void loadComments();
    });
  }, [workspaceLoaded, currentUserId, loadComments]);

  const getThreadComments = useCallback(
    (parentType: CommentParentType, parentId: string) => {
      if (!isLoaded) return [];
      return getCommentsForThread(comments, parentType, parentId).map(
        (comment) => {
          const author = users.find((user) => user.id === comment.authorId);
          if (!author) return comment;
          return {
            ...comment,
            authorName: author.displayName.trim() || author.name,
            authorInitials: author.initials,
          };
        }
      );
    },
    [comments, isLoaded, users]
  );

  const getCommentCount = useCallback(
    (parentType: CommentParentType, parentId: string) => {
      if (!isLoaded) return 0;
      return getCommentCountForThread(comments, parentType, parentId);
    },
    [comments, isLoaded]
  );

  const refreshComments = useCallback(async () => {
    loadedUserIdRef.current = currentUserId;
    await loadComments();
  }, [currentUserId, loadComments]);

  const createComment = useCallback(
    async (input: CommentInput): Promise<MutationResult> => {
      const validation = validateCommentMessage(input.message);
      if (!validation.valid) {
        return { ok: false, error: validation.error ?? "Invalid comment." };
      }

      if (input.parentType === "team") {
        return {
          ok: false,
          error: "Team comments are not available yet.",
        };
      }

      const author = getCurrentUser(users, currentUserId);
      if (!author || !currentUserId) {
        return { ok: false, error: "You must be signed in to post comments." };
      }

      try {
        const supabase = createClient();
        const row = await createCommentDb(supabase, input, currentUserId);
        const comment = mapCommentRow(row, users);
        setComments((current) => [comment, ...current]);
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error ? error.message : "Unable to post comment.",
        };
      }
    },
    [currentUserId, users]
  );

  const updateComment = useCallback(
    async (
      id: string,
      message: string,
      category?: CommentCategory
    ): Promise<MutationResult> => {
      const validation = validateCommentMessage(message);
      if (!validation.valid) {
        return { ok: false, error: validation.error ?? "Invalid comment." };
      }

      const existing = comments.find((comment) => comment.id === id);
      if (!existing || !canEditComment(existing, currentUserId)) {
        return { ok: false, error: "You can only edit your own comments." };
      }

      try {
        const supabase = createClient();
        const row = await updateCommentDb(supabase, id, message, category);
        const updated = mapCommentRow(row, users);
        setComments((current) =>
          current.map((comment) => (comment.id === id ? updated : comment))
        );
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error:
            error instanceof Error ? error.message : "Unable to update comment.",
        };
      }
    },
    [comments, currentUserId, users]
  );

  const deleteCommentById = useCallback(
    async (id: string): Promise<void> => {
      const existing = comments.find((comment) => comment.id === id);
      if (!existing || !canEditComment(existing, currentUserId)) {
        throw new Error("You can only delete your own comments.");
      }

      const supabase = createClient();
      await deleteCommentDb(supabase, id);
      setComments((current) => current.filter((comment) => comment.id !== id));
    },
    [comments, currentUserId]
  );

  const value = useMemo<CommentsContextValue>(
    () => ({
      comments,
      isLoaded,
      loadError,
      currentUserId,
      getThreadComments,
      getCommentCount,
      createComment,
      updateComment,
      deleteComment: deleteCommentById,
      refreshComments,
    }),
    [
      comments,
      isLoaded,
      loadError,
      currentUserId,
      getThreadComments,
      getCommentCount,
      createComment,
      updateComment,
      deleteCommentById,
      refreshComments,
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
