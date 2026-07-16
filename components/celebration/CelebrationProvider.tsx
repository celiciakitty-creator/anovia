"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { ConfettiOverlay } from "./ConfettiOverlay";
import {
  CelebrationToastStack,
  type CelebrationToastItem,
} from "./CelebrationToastStack";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { generateId } from "@/lib/id";

type TaskCompletionPayload = {
  taskTitle: string;
  isFirstEver: boolean;
};

type ProjectCompletionPayload = {
  projectName: string;
};

type CelebrationContextValue = {
  triggerTaskCompletion: (payload: TaskCompletionPayload) => void;
  triggerProjectCompletion: (payload: ProjectCompletionPayload) => void;
};

const CelebrationContext = createContext<CelebrationContextValue | null>(null);

const TOAST_DURATION_MS = 4200;
const CONFETTI_DURATION_MS = 2600;

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [confettiActive, setConfettiActive] = useState(false);
  const [toasts, setToasts] = useState<CelebrationToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, message: string, variant: CelebrationToastItem["variant"]) => {
      const id = generateId("toast");
      setToasts((current) => [...current, { id, title, message, variant }]);
      window.setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
    },
    [dismissToast]
  );

  const triggerTaskCompletion = useCallback(
    ({ taskTitle, isFirstEver }: TaskCompletionPayload) => {
      showToast(
        "Task completed!",
        `"${taskTitle}" — nice work! Keep the momentum going.`,
        "task"
      );

      if (isFirstEver && !prefersReducedMotion) {
        setConfettiActive(true);
        window.setTimeout(() => setConfettiActive(false), CONFETTI_DURATION_MS);
      }
    },
    [prefersReducedMotion, showToast]
  );

  const triggerProjectCompletion = useCallback(
    ({ projectName }: ProjectCompletionPayload) => {
      showToast(
        "Project complete!",
        `"${projectName}" reached 100% — time to celebrate!`,
        "project"
      );
    },
    [showToast]
  );

  const value = useMemo(
    () => ({ triggerTaskCompletion, triggerProjectCompletion }),
    [triggerTaskCompletion, triggerProjectCompletion]
  );

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <ConfettiOverlay active={confettiActive} />
      <CelebrationToastStack toasts={toasts} />
    </CelebrationContext.Provider>
  );
}

export function useCelebration() {
  const context = useContext(CelebrationContext);
  if (!context) {
    throw new Error("useCelebration must be used within a CelebrationProvider");
  }
  return context;
}
