import type { SupabaseClient } from "@supabase/supabase-js";

import { generateInitials } from "@/lib/auth-utils";
import { resolveTaskCompletionFields } from "@/lib/completion-utils";
import type { Project, ProjectInput, ProjectStatus } from "@/types/project";
import type { Priority, Task, TaskInput, TaskStatus } from "@/types/task";
import type { User } from "@/types/user";

type DbProjectRow = {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  due_date: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
};

type DbTaskRow = {
  id: string;
  title: string;
  description: string;
  project_id: string;
  assignee_id: string | null;
  created_by: string;
  due_date: string | null;
  priority: Priority;
  status: TaskStatus;
  estimated_minutes: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

type DbProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  github_handle: string | null;
  avatar_url: string | null;
};

function mapProjectRow(row: DbProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    dueDate: row.due_date ?? "",
    status: row.status,
    memberIds: row.owner_id ? [row.owner_id] : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTaskRow(row: DbTaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    projectId: row.project_id,
    assigneeId: row.assignee_id,
    dueDate: row.due_date ?? "",
    priority: row.priority,
    status: row.status,
    estimatedMinutes: row.estimated_minutes,
    labelIds: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

function mapProfileRow(row: DbProfileRow): User {
  const displayName = row.display_name?.trim() ?? "";
  const githubHandle = row.github_handle?.trim().replace(/^@/, "") ?? "";
  const name =
    displayName ||
    (githubHandle ? `@${githubHandle}` : "") ||
    row.email ||
    "User";

  return {
    id: row.id,
    name,
    email: row.email ?? "",
    initials: generateInitials(name),
    displayName,
    githubHandle,
    avatarUrl: row.avatar_url?.trim() ?? "",
  };
}

function projectInputToInsert(input: ProjectInput, ownerId: string) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
    due_date: input.dueDate || null,
    owner_id: ownerId,
  };
}

function projectInputToUpdate(input: ProjectInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    status: input.status,
    due_date: input.dueDate || null,
  };
}

function taskInputToInsert(input: TaskInput, createdBy: string) {
  const now = new Date().toISOString();
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    project_id: input.projectId,
    assignee_id: input.assigneeId,
    created_by: createdBy,
    due_date: input.dueDate || null,
    priority: input.priority,
    status: input.status,
    estimated_minutes: input.estimatedMinutes,
    completed_at: input.status === "completed" ? now : null,
  };
}

function taskInputToUpdate(input: TaskInput, existing: Task) {
  const now = new Date().toISOString();
  const completionFields = resolveTaskCompletionFields(
    existing,
    input.status,
    now
  );

  return {
    title: input.title.trim(),
    description: input.description.trim(),
    project_id: input.projectId,
    assignee_id: input.assigneeId,
    due_date: input.dueDate || null,
    priority: input.priority,
    status: input.status,
    estimated_minutes: input.estimatedMinutes,
    completed_at: completionFields.completedAt,
  };
}

type SupabaseMutationError = {
  message: string;
  code?: string;
};

function throwWorkspaceMutationError(
  error: SupabaseMutationError,
  action: string
): never {
  const normalized = error.message.toLowerCase();
  const isPermissionDenied =
    error.code === "42501" ||
    error.code === "PGRST116" ||
    error.code === "PGRST301" ||
    normalized.includes("row-level security") ||
    normalized.includes("permission denied") ||
    normalized.includes("0 rows") ||
    normalized.includes("cannot coerce the result to a single json object");

  if (isPermissionDenied) {
    throw new Error(
      `You don't have permission to ${action}. Only the task creator or project owner can make this change.`
    );
  }

  throw new Error(error.message);
}

const TASK_UPDATE_DENIED_MESSAGE =
  "You don't have permission to update this task. Only the task creator or project owner can make this change.";

export async function getAuthenticatedUserId(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to access workspace data.");
  }

  return user.id;
}

export async function getProfiles(supabase: SupabaseClient): Promise<User[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, github_handle, avatar_url")
    .order("display_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbProfileRow[]).map(mapProfileRow);
}

export async function getProjects(supabase: SupabaseClient): Promise<Project[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbProjectRow[]).map(mapProjectRow);
}

export async function createProject(
  supabase: SupabaseClient,
  input: ProjectInput,
  ownerId: string
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .insert(projectInputToInsert(input, ownerId))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProjectRow(data as DbProjectRow);
}

export async function updateProject(
  supabase: SupabaseClient,
  id: string,
  input: ProjectInput
): Promise<Project> {
  const { data, error } = await supabase
    .from("projects")
    .update(projectInputToUpdate(input))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProjectRow(data as DbProjectRow);
}

export async function deleteProject(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("projects").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}

export async function getTasks(supabase: SupabaseClient): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbTaskRow[]).map(mapTaskRow);
}

export async function createTask(
  supabase: SupabaseClient,
  input: TaskInput,
  createdBy: string
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert(taskInputToInsert(input, createdBy))
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapTaskRow(data as DbTaskRow);
}

export async function updateTask(
  supabase: SupabaseClient,
  id: string,
  input: TaskInput,
  existing: Task
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update(taskInputToUpdate(input, existing))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwWorkspaceMutationError(error, "update this task");
  }

  if (!data) {
    throw new Error(TASK_UPDATE_DENIED_MESSAGE);
  }

  return mapTaskRow(data as DbTaskRow);
}

export async function updateTaskStatus(
  supabase: SupabaseClient,
  id: string,
  status: TaskStatus,
  existing: Task
): Promise<Task> {
  const now = new Date().toISOString();
  const completionFields = resolveTaskCompletionFields(existing, status, now);

  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: completionFields.completedAt,
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throwWorkspaceMutationError(error, "update this task status");
  }

  if (!data) {
    throw new Error(TASK_UPDATE_DENIED_MESSAGE);
  }

  return mapTaskRow(data as DbTaskRow);
}

export async function deleteTask(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
