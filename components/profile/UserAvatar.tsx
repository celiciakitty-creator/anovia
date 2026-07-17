"use client";

import { getProfileInitials } from "@/lib/profile-utils";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/profile";

type UserAvatarProps = {
  profile: Pick<UserProfile, "displayName" | "email" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeStyles = {
  sm: "h-9 w-9 text-xs",
  md: "h-16 w-16 text-lg",
  lg: "h-24 w-24 text-2xl",
};

export function UserAvatar({ profile, size = "sm", className }: UserAvatarProps) {
  const initials = getProfileInitials(profile);
  const avatarUrl = profile.avatarUrl.trim();

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- user-provided avatar URLs
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizeStyles[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground",
        sizeStyles[size],
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
