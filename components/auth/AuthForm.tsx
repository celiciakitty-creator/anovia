"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { APP_NAME, AI_ASSISTANT_NAME } from "@/lib/constants";
import {
  logAuthError,
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

const SIGN_IN_FIELD_ORDER = ["email", "password"] as const;
const SIGN_UP_FIELD_ORDER = [
  "displayName",
  "githubHandle",
  "email",
  "password",
] as const;

function focusFirstInvalidField(
  errors: Record<string, string>,
  fieldOrder: readonly string[]
) {
  const firstInvalid = fieldOrder.find((field) => errors[field]);
  if (!firstInvalid) return;

  requestAnimationFrame(() => {
    const element = document.getElementById(firstInvalid);
    if (!element) return;

    element.scrollIntoView({ behavior: "smooth", block: "center" });
    element.focus({ preventScroll: true });
  });
}

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
  const submitInFlightRef = useRef(false);
  const signInTabRef = useRef<HTMLButtonElement>(null);
  const signUpTabRef = useRef<HTMLButtonElement>(null);

  const callbackError =
    searchParams.get("error") === "auth_callback_error"
      ? CALLBACK_ERROR_MESSAGE
      : null;
  const visibleError = formError ?? callbackError;

  const switchMode = (nextMode: AuthMode, options?: { focusTab?: boolean }) => {
    setMode(nextMode);
    setErrors({});
    setFormError(null);
    setSuccessMessage(null);

    if (options?.focusTab) {
      requestAnimationFrame(() => {
        const tab =
          nextMode === "sign_in" ? signInTabRef.current : signUpTabRef.current;
        tab?.focus();
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitInFlightRef.current || isSubmitting) return;

    setFormError(null);
    setSuccessMessage(null);

    const supabase = createClient();

    if (mode === "sign_in") {
      const validation = validateSignInInput({ email, password });
      setErrors(validation.errors);
      if (!validation.valid) {
        focusFirstInvalidField(validation.errors, SIGN_IN_FIELD_ORDER);
        return;
      }

      submitInFlightRef.current = true;
      setIsSubmitting(true);

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          logAuthError("sign_in", error);
          setFormError(mapAuthErrorMessage(error, "sign_in"));
          return;
        }

        const next = searchParams.get("next");
        router.push(next?.startsWith("/") ? next : "/");
        router.refresh();
      } finally {
        submitInFlightRef.current = false;
        setIsSubmitting(false);
      }

      return;
    }

    const validation = validateSignUpInput({
      email,
      password,
      displayName,
      githubHandle,
    });
    setErrors(validation.errors);
    if (!validation.valid) {
      focusFirstInvalidField(validation.errors, SIGN_UP_FIELD_ORDER);
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
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

      if (error) {
        logAuthError("sign_up", error);
        setFormError(mapAuthErrorMessage(error, "sign_up"));
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
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
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
            {mode === "sign_up"
              ? `Create your account to get started with ${AI_ASSISTANT_NAME}.`
              : `Sign in to continue with ${AI_ASSISTANT_NAME} and your workspace.`}
          </p>
        </div>

        <Card>
          <div
            className="mb-6 grid grid-cols-2 gap-1 rounded-lg border border-border bg-muted/40 p-1"
            role="tablist"
            aria-label="Authentication mode"
          >
            <button
              ref={signUpTabRef}
              id="auth-tab-sign-up"
              type="button"
              role="tab"
              aria-selected={mode === "sign_up"}
              aria-controls="auth-panel"
              tabIndex={mode === "sign_up" ? 0 : -1}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                mode === "sign_up"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-primary ring-1 ring-primary/25 hover:bg-primary/10 hover:text-primary"
              )}
              onClick={() => switchMode("sign_up")}
            >
              Sign up
            </button>
            <button
              ref={signInTabRef}
              id="auth-tab-sign-in"
              type="button"
              role="tab"
              aria-selected={mode === "sign_in"}
              aria-controls="auth-panel"
              tabIndex={mode === "sign_in" ? 0 : -1}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                mode === "sign_in"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => switchMode("sign_in")}
            >
              Sign in
            </button>
          </div>

          <form
            id="auth-panel"
            role="tabpanel"
            aria-labelledby={mode === "sign_up" ? "auth-tab-sign-up" : "auth-tab-sign-in"}
            onSubmit={handleSubmit}
            className="space-y-4"
            noValidate
          >
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

            <p className="text-xs text-muted-foreground">
              <span aria-hidden="true" className="text-danger">
                *
              </span>{" "}
              Required fields
            </p>

            {mode === "sign_up" ? (
              <>
                <Input
                  label="Display Name"
                  name="displayName"
                  autoComplete="name"
                  placeholder="Enter your display name"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  error={errors.displayName}
                  required
                />
                <Input
                  label="GitHub Handle"
                  name="githubHandle"
                  autoComplete="username"
                  placeholder="e.g. celiciakitty-creator"
                  hint="This is required for cohort identification."
                  value={githubHandle}
                  onChange={(event) => setGithubHandle(event.target.value)}
                  error={errors.githubHandle}
                  required
                />
              </>
            ) : null}

            <Input
              label="Email Address"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
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
              placeholder={
                mode === "sign_up"
                  ? "Create a secure password"
                  : "Enter your password"
              }
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {mode === "sign_in" ? (
              <>
                New to {APP_NAME}?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
                  onClick={() => switchMode("sign_up", { focusTab: true })}
                >
                  Create an account
                </button>
                .
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-sm"
                  onClick={() => switchMode("sign_in", { focusTab: true })}
                >
                  Sign in
                </button>
                .
              </>
            )}
          </p>
        </Card>
      </div>
    </div>
  );
}
