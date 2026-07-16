"use client";

import { useSyncExternalStore } from "react";

let hydrated = false;
const hydrationListeners = new Set<() => void>();

function subscribeHydration(onStoreChange: () => void) {
  hydrationListeners.add(onStoreChange);

  if (typeof window !== "undefined" && !hydrated) {
    hydrated = true;
    queueMicrotask(() => {
      hydrationListeners.forEach((listener) => listener());
    });
  }

  return () => {
    hydrationListeners.delete(onStoreChange);
  };
}

function getHydrationSnapshot() {
  return hydrated;
}

function getServerHydrationSnapshot() {
  return false;
}

/** True after the client has mounted — false on server and during hydration. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );
}
