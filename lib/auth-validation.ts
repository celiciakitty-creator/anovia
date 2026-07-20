import type { AuthError } from "@supabase/supabase-js";

import type { ValidationResult } from "@/lib/validation";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GITHUB_HANDLE_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function validateSignInInput(input: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function validateSignUpInput(input: {
  email: string;
  password: string;
  displayName: string;
  githubHandle: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_PATTERN.test(input.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!input.password) {
    errors.password = "Password is required.";
  } else if (input.password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }

  if (!input.displayName.trim()) {
    errors.displayName = "Display name is required.";
  } else if (input.displayName.trim().length < 2) {
    errors.displayName = "Display name must be at least 2 characters.";
  }

  const handle = input.githubHandle.trim().replace(/^@/, "");
  if (!handle) {
    errors.githubHandle = "GitHub handle is required.";
  } else if (!GITHUB_HANDLE_PATTERN.test(handle)) {
    errors.githubHandle =
      "Use a valid GitHub username (letters, numbers, and hyphens).";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function normalizeGithubHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

/** Logs Supabase auth error details during local development. */
export function logAuthError(context: "sign_in" | "sign_up", error: AuthError): void {
  if (process.env.NODE_ENV !== "development") return;

  console.error(`[auth:${context}]`, {
    status: error.status,
    code: error.code,
    message: error.message,
  });
}

export function mapAuthErrorMessage(
  error: AuthError,
  context: "sign_in" | "sign_up" = "sign_in"
): string {
  const normalized = error.message.toLowerCase();

  if (error.code === "over_request_rate_limit") {
    return "Authentication is temporarily limited because of high activity. Please wait a few minutes and try again.";
  }

  if (error.code === "over_email_send_rate_limit") {
    return "Too many confirmation emails were sent recently. Please wait a few minutes before requesting another.";
  }

  if (error.code === "over_sms_send_rate_limit") {
    return "Too many SMS messages were sent recently. Please wait a few minutes before trying again.";
  }

  if (
    error.code === "invalid_credentials" ||
    normalized.includes("invalid login credentials")
  ) {
    if (context === "sign_in") {
      return "Those credentials could not be verified. If you are new to Anovia, create an account first.";
    }

    return "Email or password is incorrect. Please try again.";
  }

  if (
    error.code === "user_already_exists" ||
    error.code === "email_exists" ||
    normalized.includes("user already registered")
  ) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (
    error.code === "weak_password" ||
    normalized.includes("password should be at least")
  ) {
    return "Password must be at least 8 characters.";
  }

  if (
    error.code === "email_not_confirmed" ||
    normalized.includes("email not confirmed")
  ) {
    return "Please check your inbox and confirm your email address before signing in. If you do not see the message, check your spam folder.";
  }

  if (error.code === "signup_disabled") {
    return "New account registration is currently disabled.";
  }

  return error.message || "Authentication failed. Please try again.";
}
