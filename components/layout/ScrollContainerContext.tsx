"use client";

import { createContext, useContext } from "react";

const ScrollContainerContext = createContext<HTMLElement | null>(null);

export function ScrollContainerProvider({
  scrollRoot,
  children,
}: {
  scrollRoot: HTMLElement | null;
  children: React.ReactNode;
}) {
  return (
    <ScrollContainerContext.Provider value={scrollRoot}>
      {children}
    </ScrollContainerContext.Provider>
  );
}

/** Returns the scrollable main content element, if available. */
export function useScrollContainer(): HTMLElement | null {
  return useContext(ScrollContainerContext);
}
