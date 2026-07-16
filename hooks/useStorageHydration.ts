"use client";

import { useEffect, useRef, useState } from "react";
import { useHydrated } from "./useHydrated";

/**
 * Loads browser storage once after hydration. Returns false on server and during
 * the first client render so UI can show deterministic defaults.
 */
export function useStorageHydration(): boolean {
  const mounted = useHydrated();
  const [storageReady, setStorageReady] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!mounted || startedRef.current) return;
    startedRef.current = true;
    setStorageReady(true);
  }, [mounted]);

  return storageReady;
}
