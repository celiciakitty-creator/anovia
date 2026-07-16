export const ONBOARDING_STORAGE_KEY = "anovia-onboarding-complete";

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function setOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
}

export function resetOnboarding(): void {
  localStorage.removeItem(ONBOARDING_STORAGE_KEY);
}
