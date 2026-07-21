"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ToggleSwitch } from "@/components/wellness/ToggleSwitch";
import { useWorkspace } from "@/components/workspace";
import { Button, Card, CardHeader, Input } from "@/components/ui";
import { useHydrated } from "@/hooks/useHydrated";
import {
  ensureOwnProfile,
  updateLeaderboardOptIn,
  updateOwnProfile,
} from "@/lib/profile-db";
import { getProfileLabel, profileToFormInput } from "@/lib/profile-utils";
import { createClient } from "@/utils/supabase/client";
import type { UserProfile, UserProfileInput } from "@/types/profile";

type SaveState = "idle" | "saving" | "success" | "error";
type OptInSaveState = "idle" | "saving" | "error";

export function ProfilePageContent() {
  const isHydrated = useHydrated();
  const { refreshUsers } = useWorkspace();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<UserProfileInput>({
    displayName: "",
    githubHandle: "",
    avatarUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [optInSaveState, setOptInSaveState] = useState<OptInSaveState>("idle");
  const [optInError, setOptInError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      const loaded = await ensureOwnProfile(supabase);
      setProfile(loaded);
      setForm(profileToFormInput(loaded));
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "Unable to load profile."
      );
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
        (event === "INITIAL_SESSION" || event === "SIGNED_IN")
      ) {
        void loadProfile();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isHydrated, loadProfile]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    setSaveState("saving");
    setSaveError(null);

    try {
      const supabase = createClient();
      const updated = await updateOwnProfile(supabase, profile.id, form);
      setProfile(updated);
      setForm(profileToFormInput(updated));
      setSaveState("success");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (error) {
      setSaveState("error");
      setSaveError(
        error instanceof Error ? error.message : "Unable to save profile."
      );
    }
  };

  const handleLeaderboardOptInChange = async (checked: boolean) => {
    if (!profile) return;

    setOptInSaveState("saving");
    setOptInError(null);

    try {
      const supabase = createClient();
      const updated = await updateLeaderboardOptIn(
        supabase,
        profile.id,
        checked
      );
      setProfile(updated);
      await refreshUsers();
      setOptInSaveState("idle");
    } catch (error) {
      setOptInSaveState("error");
      setOptInError(
        error instanceof Error
          ? error.message
          : "Unable to update leaderboard preference."
      );
    }
  };

  const previewProfile: Pick<UserProfile, "displayName" | "email" | "avatarUrl"> =
    {
      displayName: form.displayName,
      email: profile?.email ?? "",
      avatarUrl: form.avatarUrl,
    };

  if (!isHydrated || isLoading) {
    return <p className="text-sm text-muted-foreground">Loading profile…</p>;
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
        {loadError}
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="text-sm text-muted-foreground">No profile data available.</p>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Your profile"
          description="Manage how you appear across Anovia."
        />

        <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <UserAvatar profile={previewProfile} size="lg" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {getProfileLabel(previewProfile)}
            </p>
            <p className="text-xs text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <Input
          label="Email"
          name="email"
          value={profile.email}
          readOnly
          disabled
          className="opacity-80"
        />

        <Input
          label="Display name"
          name="displayName"
          value={form.displayName}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              displayName: event.target.value,
            }))
          }
          placeholder="How your name appears in the app"
        />

        <Input
          label="GitHub handle"
          name="githubHandle"
          value={form.githubHandle}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              githubHandle: event.target.value,
            }))
          }
          placeholder="username (without @)"
        />

        <Input
          label="Avatar URL"
          name="avatarUrl"
          type="url"
          value={form.avatarUrl}
          onChange={(event) =>
            setForm((current) => ({
              ...current,
              avatarUrl: event.target.value,
            }))
          }
          placeholder="https://example.com/avatar.jpg"
        />

        {saveError ? (
          <p className="text-sm text-danger" role="alert">
            {saveError}
          </p>
        ) : null}

        {saveState === "success" ? (
          <p className="text-sm text-success" role="status">
            Profile saved successfully.
          </p>
        ) : null}

        <div className="flex justify-end">
          <Button type="submit" disabled={saveState === "saving"}>
            {saveState === "saving" ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
      </Card>

      <Card>
        <CardHeader
          title="Team visibility"
          description="Choose whether your progress appears on the opt-in Team Leaderboard."
        />
        <ToggleSwitch
          id="leaderboard-opt-in"
          label="Appear on Team Leaderboard"
          description="Share your weekly completions, streak, and garden stage with teammates who also opt in. You can turn this off anytime — your stats stay private when opted out."
          checked={profile.leaderboardOptIn}
          onChange={handleLeaderboardOptInChange}
        />
        {optInError ? (
          <p className="mt-3 text-sm text-danger" role="alert">
            {optInError}
          </p>
        ) : null}
        {optInSaveState === "saving" ? (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            Saving preference…
          </p>
        ) : null}
        <p className="mt-4 text-xs text-muted-foreground">
          View the{" "}
          <Link
            href="/leaderboard"
            className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
          >
            Team Leaderboard
          </Link>{" "}
          to see who is sharing progress.
        </p>
      </Card>
    </div>
  );
}
