"use client";

import { useRef } from "react";
import { useIntersectionReveal } from "@/hooks/useIntersectionReveal";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useScrollContainer } from "@/components/layout/ScrollContainerContext";
import { cn } from "@/lib/utils";

type RevealOnScrollProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger delay in milliseconds before the reveal transition starts. */
  delay?: number;
  /** Skip animation — content is shown immediately (e.g. interactive controls). */
  disabled?: boolean;
};

export function RevealOnScroll({
  children,
  className,
  delay = 0,
  disabled = false,
}: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRoot = useScrollContainer();
  const prefersReducedMotion = usePrefersReducedMotion();
  const skipAnimation = disabled || prefersReducedMotion;
  const isVisible = useIntersectionReveal(ref, {
    once: true,
    disabled: skipAnimation,
    root: scrollRoot,
    enabled: scrollRoot !== null,
  });

  return (
    <div
      ref={ref}
      className={cn(
        "reveal-on-scroll",
        isVisible ? "is-visible" : "is-hidden",
        className
      )}
      style={!skipAnimation && delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
