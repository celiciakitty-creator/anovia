import type { User } from "@supabase/supabase-js";

export type AuthProfile = {
  email: string;
  displayName: string | null;
  githubHandle: string | null;
  /** Primary label for navigation (display name → GitHub → email). */
  label: string;
  initials: string;
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

export function generateInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  if (parts.length === 1) {
    const word = parts[0];
    if (word.includes("@")) {
      return word.slice(0, 2).toUpperCase();
    }
    return word.slice(0, 2).toUpperCase();
  }

  return "?";
}

export function getAuthProfile(user: User): AuthProfile {
  const email = user.email ?? "";
  const displayName = readMetadataString(user.user_metadata, "display_name");
  const githubHandle = readMetadataString(user.user_metadata, "github_handle");

  const label =
    displayName ??
    (githubHandle ? `@${githubHandle.replace(/^@/, "")}` : null) ??
    email;

  return {
    email,
    displayName,
    githubHandle,
    label,
    initials: generateInitials(displayName ?? githubHandle ?? email),
  };
}

export function isPublicAuthPath(pathname: string): boolean {
  return pathname === "/auth" || pathname.startsWith("/auth/callback");
}
