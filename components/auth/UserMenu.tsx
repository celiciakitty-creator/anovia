"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/profile";
import { Button } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";
import { ensureOwnProfile } from "@/lib/profile-db";
import { getProfileLabel } from "@/lib/profile-utils";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/profile";

export function UserMenu() {
  const router = useRouter();
  const isHydrated = useHydrated();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  const loadProfile = useCallback(async () => {
    try {
      const supabase = createClient();
      const loaded = await ensureOwnProfile(supabase);
      setProfile(loaded);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        session?.user &&
        (event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "USER_UPDATED")
      ) {
        void loadProfile();
      } else if (event === "SIGNED_OUT") {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated, loadProfile]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        profileButtonRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/auth");
  };

  const displayName = profile ? getProfileLabel(profile) : "Account";
  const email = profile?.email ?? "";
  const ariaLabel = profile
    ? `Signed in as ${displayName}`
    : isLoading
      ? "Loading account"
      : "Account menu";

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={profileButtonRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isLoading && "opacity-70",
          !profile?.avatarUrl && "bg-primary text-xs font-semibold text-primary-foreground"
        )}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isSigningOut}
      >
        {isLoading || !isHydrated ? (
          "…"
        ) : profile ? (
          <UserAvatar profile={profile} size="sm" className="h-9 w-9" />
        ) : (
          "U"
        )}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border border-border bg-card p-3 shadow-[var(--card-shadow)]"
          role="menu"
          aria-label="Account menu"
        >
          <div className="mb-3 border-b border-border pb-3">
            <p className="truncate text-sm font-medium text-foreground">
              {displayName}
            </p>
            {email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {email}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Link
              href="/profile"
              role="menuitem"
              className="flex w-full items-center rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              onClick={() => setIsOpen(false)}
            >
              Profile
            </Link>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleSignOut}
              disabled={isSigningOut}
              role="menuitem"
            >
              {isSigningOut ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
