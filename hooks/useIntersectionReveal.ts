"use client";

import { useEffect, useState, type RefObject } from "react";

type UseIntersectionRevealOptions = {
  once?: boolean;
  rootMargin?: string;
  threshold?: number | number[];
  disabled?: boolean;
  /** Scroll container; defaults to the viewport when null. */
  root?: HTMLElement | null;
  /** When false, observation is deferred (e.g. waiting for scroll root ref). */
  enabled?: boolean;
};

/** Reveals content when it enters the viewport (Intersection Observer). */
export function useIntersectionReveal(
  ref: RefObject<Element | null>,
  {
    once = true,
    rootMargin = "0px 0px -6% 0px",
    threshold = 0.12,
    disabled = false,
    root = null,
    enabled = true,
  }: UseIntersectionRevealOptions = {}
): boolean {
  const [isVisible, setIsVisible] = useState(() => disabled);

  useEffect(() => {
    if (disabled || !enabled) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.disconnect();
        }
      },
      { root, rootMargin, threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, once, rootMargin, threshold, disabled, root, enabled]);

  if (disabled) {
    return true;
  }

  return isVisible;
}
