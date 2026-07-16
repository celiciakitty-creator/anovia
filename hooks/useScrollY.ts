"use client";

import { useEffect, useState } from "react";

/** Tracks whether a scroll container has scrolled past a threshold. */
export function useScrollY(
  threshold = 12,
  scrollRoot: HTMLElement | null = null
): boolean {
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const target: HTMLElement | Window = scrollRoot ?? window;

    const update = () => {
      const scrollTop = scrollRoot ? scrollRoot.scrollTop : window.scrollY;
      setHasScrolled(scrollTop > threshold);
    };

    update();
    target.addEventListener("scroll", update, { passive: true });
    return () => target.removeEventListener("scroll", update);
  }, [threshold, scrollRoot]);

  return hasScrolled;
}
