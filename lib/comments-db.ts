import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  Comment,
  CommentCategory,
  CommentInput,
  CommentParentType,
} from "@/types/comment";
import { COMMENT_MAX_LENGTH } from "@/types/comment";
import type { User } from "@/types/user";

type DbCommentRow = {
  id: string;
  author_id: string;
  project_id: string | null;
  task_id: string | null;
  body: string;
  category: CommentCategory;
  created_at: string;
  updated_at: string;
};

export function mapCommentRow(row: DbCommentRow, users: User[]): Comment {
  const author = users.find((user) => user.id === row.author_id);
  const displayName = author?.displayName.trim() || author?.name || "User";

  return {
    id: row.id,
    parentType: row.project_id ? "project" : "task",
    parentId: row.project_id ?? row.task_id ?? "",
    authorId: row.author_id,
    authorName: displayName,
    authorInitials: author?.initials ?? "U",
    message: row.body,
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    edited: row.updated_at !== row.created_at,
  };
}

function validateCommentTarget(input: CommentInput): void {
  if (input.parentType === "team") {
    throw new Error("Team comments are not supported.");
  }

  if (input.parentType === "project" && !input.parentId) {
    throw new Error("Project comments require a project id.");
  }

  if (input.parentType === "task" && !input.parentId) {
    throw new Error("Task comments require a task id.");
  }
}

function commentInputToInsert(input: CommentInput, authorId: string) {
  validateCommentTarget(input);

  const body = input.message.trim();
  if (!body) {
    throw new Error("Comment cannot be empty.");
  }
  if (body.length > COMMENT_MAX_LENGTH) {
    throw new Error(`Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`);
  }

  return {
    author_id: authorId,
    project_id: input.parentType === "project" ? input.parentId : null,
    task_id: input.parentType === "task" ? input.parentId : null,
    body,
    category: input.category,
  };
}

export async function getComments(
  supabase: SupabaseClient
): Promise<DbCommentRow[]> {
  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data as DbCommentRow[];
}

export async function createComment(
  supabase: SupabaseClient,
  input: CommentInput,
  authorId: string
): Promise<DbCommentRow> {
  const { data, error } = await supabase
    .from("comments")
    .insert(commentInputToInsert(input, authorId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as DbCommentRow;
}

export async function updateComment(
  supabase: SupabaseClient,
  id: string,
  message: string,
  category?: CommentCategory
): Promise<DbCommentRow> {
  const body = message.trim();
  if (!body) {
    throw new Error("Comment cannot be empty.");
  }
  if (body.length > COMMENT_MAX_LENGTH) {
    throw new Error(`Comment must be ${COMMENT_MAX_LENGTH} characters or fewer.`);
  }

  const { data, error } = await supabase
    .from("comments")
    .update({
      body,
      ...(category ? { category } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Unable to update this comment.");
  }

  return data as DbCommentRow;
}

export async function deleteComment(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("comments").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export function toCommentParentType(
  parentType: CommentParentType
): "project" | "task" {
  if (parentType === "task") return "task";
  if (parentType === "project") return "project";
  throw new Error("Unsupported comment parent type.");
}
