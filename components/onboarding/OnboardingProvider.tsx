"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  isOnboardingComplete,
  resetOnboarding,
  setOnboardingComplete,
} from "@/lib/onboarding-storage";
import { useStorageHydration } from "@/hooks/useStorageHydration";
import { OnboardingFlow } from "./OnboardingFlow";

type OnboardingContextValue = {
  isVisible: boolean;
  replayOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const storageReady = useStorageHydration();
  const [isVisible, setIsVisible] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    if (!storageReady || onboardingChecked) return;
    queueMicrotask(() => {
      setIsVisible(!isOnboardingComplete());
      setOnboardingChecked(true);
    });
  }, [storageReady, onboardingChecked]);

  useEffect(() => {
    if (!isVisible) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isVisible]);

  const completeOnboarding = useCallback(() => {
    setOnboardingComplete();
    setIsVisible(false);
  }, []);

  const replayOnboarding = useCallback(() => {
    resetOnboarding();
    setIsVisible(true);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      isVisible,
      replayOnboarding,
    }),
    [isVisible, replayOnboarding]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {onboardingChecked && isVisible ? (
        <OnboardingFlow onComplete={completeOnboarding} onSkip={completeOnboarding} />
      ) : null}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
