"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";
import { getAuthProfile, type AuthProfile } from "@/lib/auth-utils";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const isHydrated = useHydrated();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isHydrated) return;

    const supabase = createClient();

    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setProfile(data.user ? getAuthProfile(data.user) : null);
      setIsLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(session?.user ? getAuthProfile(session.user) : null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
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
    window.location.href = "/auth";
  };

  const initials = isLoading || !isHydrated ? "…" : (profile?.initials ?? "?");
  const ariaLabel =
    profile?.label != null
      ? `Signed in as ${profile.label}`
      : isLoading
        ? "Loading account"
        : "Account menu";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isLoading && "opacity-70"
        )}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        disabled={isSigningOut}
      >
        {initials}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-xl border border-border bg-card p-3 shadow-[var(--card-shadow)]"
          role="menu"
          aria-label="Account menu"
        >
          <div className="mb-3 border-b border-border pb-3">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.label ?? "Account"}
            </p>
            {profile?.email ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {profile.email}
              </p>
            ) : null}
          </div>
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
      ) : null}
    </div>
  );
}
