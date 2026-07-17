import { generateInitials } from "@/lib/auth-utils";
import type { UserProfile, UserProfileInput } from "@/types/profile";

/** Display label: display name, then email, then generic fallback. */
export function getProfileLabel(profile: Pick<UserProfile, "displayName" | "email">): string {
  const displayName = profile.displayName.trim();
  if (displayName) return displayName;

  const email = profile.email.trim();
  if (email) return email;

  return "Account";
}

/** Initials: display name first, then email, then "U". */
export function getProfileInitials(
  profile: Pick<UserProfile, "displayName" | "email">
): string {
  const displayName = profile.displayName.trim();
  if (displayName) return generateInitials(displayName);

  const email = profile.email.trim();
  if (email) return generateInitials(email);

  return "U";
}

export function normalizeGithubHandle(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function profileToFormInput(profile: UserProfile): UserProfileInput {
  return {
    displayName: profile.displayName,
    githubHandle: profile.githubHandle,
    avatarUrl: profile.avatarUrl,
  };
}
