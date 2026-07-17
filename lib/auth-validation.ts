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

export function mapAuthErrorMessage(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Email or password is incorrect. Please try again.";
  }

  if (normalized.includes("user already registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }

  if (normalized.includes("password should be at least")) {
    return "Password must be at least 8 characters.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (normalized.includes("rate limit")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  return message;
}
