"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  syncDeadlineNotifications,
} from "@/lib/notifications-db";
import { createClient } from "@/utils/supabase/client";
import type { Notification } from "@/types/notification";

type NotificationContextValue = {
  notifications: Notification[];
  unreadCount: number;
  isLoaded: boolean;
  isSyncing: boolean;
  loadError: string | null;
  refreshNotifications: () => Promise<void>;
  markRead: (notificationId: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadNotifications = useCallback(async () => {
    setIsSyncing(true);
    setLoadError(null);

    try {
      const supabase = createClient();
      await syncDeadlineNotifications(supabase);
      const [items, count] = await Promise.all([
        getNotifications(supabase),
        getUnreadNotificationCount(supabase),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load notifications."
      );
    } finally {
      setIsSyncing(false);
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id;

      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        if (userId && loadedUserIdRef.current !== userId) {
          loadedUserIdRef.current = userId;
          queueMicrotask(() => {
            void loadNotifications();
          });
        } else if (!userId) {
          loadedUserIdRef.current = null;
          setNotifications([]);
          setUnreadCount(0);
          setIsLoaded(true);
        }
        return;
      }

      if (event === "SIGNED_OUT") {
        loadedUserIdRef.current = null;
        setNotifications([]);
        setUnreadCount(0);
        setIsLoaded(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadNotifications]);

  const refreshNotifications = useCallback(async () => {
    if (!loadedUserIdRef.current) return;
    await loadNotifications();
  }, [loadNotifications]);

  const markRead = useCallback(async (notificationId: string) => {
    const supabase = createClient();
    await markNotificationRead(supabase, notificationId);
    setNotifications((current) => {
      const target = current.find((item) => item.id === notificationId);
      if (!target || target.isRead) {
        return current;
      }

      setUnreadCount((count) => Math.max(0, count - 1));
      return current.map((item) =>
        item.id === notificationId
          ? {
              ...item,
              isRead: true,
              readAt: new Date().toISOString(),
            }
          : item
      );
    });
  }, []);

  const markAllRead = useCallback(async () => {
    const supabase = createClient();
    await markAllNotificationsRead(supabase);
    const now = new Date().toISOString();
    setNotifications((current) =>
      current.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt ?? now,
      }))
    );
    setUnreadCount(0);
  }, []);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      isLoaded,
      isSyncing,
      loadError,
      refreshNotifications,
      markRead,
      markAllRead,
    }),
    [
      notifications,
      unreadCount,
      isLoaded,
      isSyncing,
      loadError,
      refreshNotifications,
      markRead,
      markAllRead,
    ]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
