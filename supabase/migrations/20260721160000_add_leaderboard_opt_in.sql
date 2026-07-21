-- Add opt-in flag for Team Leaderboard visibility.
-- Safe to run once in Supabase SQL Editor.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS leaderboard_opt_in boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.leaderboard_opt_in IS
  'When true, the member appears on the opt-in Team Leaderboard.';
