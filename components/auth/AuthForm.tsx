"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { APP_NAME, AI_ASSISTANT_NAME } from "@/lib/constants";
import {
  mapAuthErrorMessage,
  normalizeGithubHandle,
  validateSignInInput,
  validateSignUpInput,
} from "@/lib/auth-validation";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

type AuthMode = "sign_in" | "sign_up";

const CALLBACK_ERROR_MESSAGE =
  "We couldn't complete sign-in from your email link. Please try again.";

export function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [githubHandle, setGithubHandle] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const callbackError =
    searchParams.get("error") === "auth_callback_error"
      ? CALLBACK_ERROR_MESSAGE
      : null;
  const visibleError = formError ?? callbackError;

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrors({});
    setFormError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const supabase = createClient();

    if (mode === "sign_in") {
      const validation = validateSignInInput({ email, password });
      setErrors(validation.errors);
      if (!validation.valid) return;

      setIsSubmitting(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      setIsSubmitting(false);

      if (error) {
        setFormError(mapAuthErrorMessage(error.message));
        return;
      }

      const next = searchParams.get("next");
      router.push(next?.startsWith("/") ? next : "/");
      router.refresh();
      return;
    }

    const validation = validateSignUpInput({
      email,
      password,
      displayName,
      githubHandle,
    });
    setErrors(validation.errors);
    if (!validation.valid) return;

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          github_handle: normalizeGithubHandle(githubHandle),
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsSubmitting(false);

    if (error) {
      setFormError(mapAuthErrorMessage(error.message));
      return;
    }

    if (data.session) {
      router.push("/");
      router.refresh();
      return;
    }

    setSuccessMessage(
      "Account created! Check your email to confirm your address, then sign in."
    );
    switchMode("sign_in");
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            A
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome to {APP_NAME}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue with {AI_ASSISTANT_NAME} and your workspace.
          </p>
        </div>

        <Card>
          <div
            className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign_in"}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                mode === "sign_in"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchMode("sign_in")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "sign_up"}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                mode === "sign_up"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchMode("sign_up")}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {visibleError ? (
              <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {visibleError}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success" role="status">
                {successMessage}
              </p>
            ) : null}

            {mode === "sign_up" ? (
              <>
                <Input
                  label="Display name"
                  name="displayName"
                  autoComplete="name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  error={errors.displayName}
                  required
                />
                <Input
                  label="GitHub handle"
                  name="githubHandle"
                  autoComplete="username"
                  placeholder="your-username"
                  value={githubHandle}
                  onChange={(event) => setGithubHandle(event.target.value)}
                  error={errors.githubHandle}
                  required
                />
              </>
            ) : null}

            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={mode === "sign_up" ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              required
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting
                ? mode === "sign_in"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "sign_in"
                  ? "Sign in"
                  : "Create account"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
