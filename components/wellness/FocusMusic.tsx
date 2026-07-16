"use client";

import { useState } from "react";
import { Button, Card, CardHeader, Input, Select } from "@/components/ui";
import {
  FOCUS_MUSIC_PRESETS,
  FOCUS_SOUND_ORDER,
  FOCUS_SOUND_SELECT_OPTIONS,
  USER_PLAYLIST_PRESET,
} from "@/data/focus-music-links";
import { getFocusMusicUrl, isValidExternalUrl } from "@/lib/focus-music-utils";
import { cn } from "@/lib/utils";
import type { FocusSoundId } from "@/types/wellness";
import { useWellness } from "./WellnessProvider";

function OpenLinkButton({
  href,
  disabled,
  label = "Open",
}: {
  href: string | null;
  disabled?: boolean;
  label?: string;
}) {
  if (!href || disabled) {
    return (
      <Button size="sm" disabled>
        {label}
      </Button>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex h-8 items-center justify-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      )}
    >
      {label}
    </a>
  );
}

type FocusMusicCardProps = {
  id: FocusSoundId;
  emoji: string;
  label: string;
  description: string;
  href: string | null;
  isPreferred: boolean;
  onPrefer: () => void;
  actions?: React.ReactNode;
};

function FocusMusicCard({
  emoji,
  label,
  description,
  href,
  isPreferred,
  onPrefer,
  actions,
}: FocusMusicCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-xl border border-border bg-muted/20 p-4 transition-colors",
        isPreferred && "border-primary/30 bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground">{label}</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {actions ?? <OpenLinkButton href={href} disabled={!href} />}
        <Button variant="ghost" size="sm" onClick={onPrefer} aria-pressed={isPreferred}>
          {isPreferred ? "Preferred" : "Set preferred"}
        </Button>
      </div>
    </article>
  );
}

export function FocusMusic() {
  const { data, setPreferredFocusSound, setUserPlaylistUrl } = useWellness();
  const { preferredSound, userPlaylistUrl } = data.focusMusic;
  const [editingPlaylist, setEditingPlaylist] = useState(!userPlaylistUrl);
  const [playlistInput, setPlaylistInput] = useState(userPlaylistUrl ?? "");
  const [playlistError, setPlaylistError] = useState("");

  const savePlaylist = () => {
    const trimmed = playlistInput.trim();
    if (!isValidExternalUrl(trimmed)) {
      setPlaylistError("Enter a valid URL starting with http:// or https://");
      return;
    }
    setPlaylistError("");
    setUserPlaylistUrl(trimmed);
    setEditingPlaylist(false);
  };

  const clearPlaylist = () => {
    setUserPlaylistUrl(null);
    setPlaylistInput("");
    setPlaylistError("");
    setEditingPlaylist(true);
    if (preferredSound === "user_playlist") {
      setPreferredFocusSound(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader
        title="Focus Music"
        description="Choose a sound environment that helps you settle into your work."
      />

      <Select
        label="Preferred focus sound"
        name="preferred-focus-sound"
        value={preferredSound ?? ""}
        onChange={(event) => {
          const value = event.target.value as FocusSoundId | "";
          setPreferredFocusSound(value || null);
        }}
        options={[
          { value: "", label: "None selected" },
          ...FOCUS_SOUND_SELECT_OPTIONS,
        ]}
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FOCUS_SOUND_ORDER.map((id) => {
          if (id === "user_playlist") {
            const href = getFocusMusicUrl(id, userPlaylistUrl);
            const hasSaved = Boolean(userPlaylistUrl);

            return (
              <FocusMusicCard
                key={id}
                id={id}
                emoji={USER_PLAYLIST_PRESET.emoji}
                label={USER_PLAYLIST_PRESET.label}
                description={USER_PLAYLIST_PRESET.description}
                href={href}
                isPreferred={preferredSound === id}
                onPrefer={() => setPreferredFocusSound(id)}
                actions={
                  hasSaved && !editingPlaylist ? (
                    <>
                      <OpenLinkButton href={href} label="Open" />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setPlaylistInput(userPlaylistUrl ?? "");
                          setEditingPlaylist(true);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Save a link below to open
                    </span>
                  )
                }
              />
            );
          }

          const preset = FOCUS_MUSIC_PRESETS[id];
          return (
            <FocusMusicCard
              key={id}
              id={id}
              emoji={preset.emoji}
              label={preset.label}
              description={preset.description}
              href={preset.url}
              isPreferred={preferredSound === id}
              onPrefer={() => setPreferredFocusSound(id)}
            />
          );
        })}
      </div>

      {editingPlaylist || !userPlaylistUrl ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/10 p-4">
          <Input
            label="Your playlist URL"
            name="user-playlist-url"
            type="url"
            placeholder="https://open.spotify.com/playlist/..."
            value={playlistInput}
            onChange={(event) => {
              setPlaylistInput(event.target.value);
              if (playlistError) setPlaylistError("");
            }}
            error={playlistError}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={savePlaylist}>
              Save playlist
            </Button>
            {userPlaylistUrl ? (
              <Button variant="ghost" size="sm" onClick={() => setEditingPlaylist(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-4 truncate text-xs text-muted-foreground">
          Saved playlist: {userPlaylistUrl}
          <button
            type="button"
            onClick={clearPlaylist}
            className="ml-2 font-medium text-primary hover:underline"
          >
            Remove
          </button>
        </p>
      )}
    </Card>
  );
}
