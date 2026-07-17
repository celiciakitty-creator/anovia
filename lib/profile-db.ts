import type { SupabaseClient, User } from "@supabase/supabase-js";

import { normalizeGithubHandle } from "@/lib/profile-utils";
import type { UserProfile, UserProfileInput } from "@/types/profile";

type DbProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  github_handle: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

function readMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
): string | null {
  const value = metadata?.[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapProfileRow(row: DbProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email ?? "",
    displayName: row.display_name ?? "",
    githubHandle: row.github_handle ?? "",
    avatarUrl: row.avatar_url ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function profileInputToUpdate(input: UserProfileInput) {
  const displayName = input.displayName.trim();
  const githubHandle = normalizeGithubHandle(input.githubHandle);
  const avatarUrl = input.avatarUrl.trim();

  return {
    display_name: displayName || null,
    github_handle: githubHandle || null,
    avatar_url: avatarUrl || null,
  };
}

export async function getAuthenticatedUser(
  supabase: SupabaseClient
): Promise<User> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in to view your profile.");
  }

  return user;
}

export async function getProfileById(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapProfileRow(data as DbProfileRow) : null;
}

/** Load the signed-in user's profile, creating the row if it is missing. */
export async function ensureOwnProfile(
  supabase: SupabaseClient
): Promise<UserProfile> {
  const user = await getAuthenticatedUser(supabase);
  const existing = await getProfileById(supabase, user.id);

  if (existing) {
    return existing;
  }

  const displayName = readMetadataString(user.user_metadata, "display_name");
  const githubHandle = readMetadataString(user.user_metadata, "github_handle");

  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      email: user.email ?? null,
      display_name: displayName,
      github_handle: githubHandle,
      avatar_url: null,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfileRow(data as DbProfileRow);
}

export async function updateOwnProfile(
  supabase: SupabaseClient,
  userId: string,
  input: UserProfileInput
): Promise<UserProfile> {
  const { data, error } = await supabase
    .from("profiles")
    .update(profileInputToUpdate(input))
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapProfileRow(data as DbProfileRow);
}
