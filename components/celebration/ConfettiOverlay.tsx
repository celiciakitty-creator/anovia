"use client";

import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

type ConfettiOverlayProps = {
  active: boolean;
};

const PARTICLE_COUNT = 28;

export function ConfettiOverlay({ active }: ConfettiOverlayProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (!active || prefersReducedMotion) return null;

  return (
    <div
      className="confetti-overlay pointer-events-none fixed inset-0 z-[100] overflow-hidden"
      aria-hidden
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn("confetti-particle", `confetti-particle--${index % 6}`)}
          style={
            {
              "--confetti-delay": `${index * 45}ms`,
              "--confetti-left": `${(index * 17) % 100}%`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
