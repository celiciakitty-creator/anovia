"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useKizunaReminders } from "./KizunaReminderProvider";
import { useWellness } from "@/components/wellness";
import { useWorkspace } from "@/components/workspace";
import { generateKizunaChatResponse } from "@/lib/kizuna-chat-engine";
import { generateId } from "@/lib/id";
import type { KizunaChatMessage } from "@/types/kizuna-chat";
import { KIZUNA_CHAT_MAX_MESSAGES } from "@/types/kizuna-chat";
import { KizunaChatPanel } from "./KizunaChatPanel";

type KizunaChatContextValue = {
  isOpen: boolean;
  messages: KizunaChatMessage[];
  isLoaded: boolean;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string) => void;
  clearConversation: () => void;
};

const KizunaChatContext = createContext<KizunaChatContextValue | null>(null);

export function KizunaChatProvider({ children }: { children: React.ReactNode }) {
  const { raw, projects, currentUserId, isLoaded: workspaceLoaded } =
    useWorkspace();
  const { data: wellness } = useWellness();
  const { reminders } = useKizunaReminders();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<KizunaChatMessage[]>([]);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const userMessage: KizunaChatMessage = {
        id: generateId("chat"),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const reply = generateKizunaChatResponse(trimmed, {
        workspace: raw,
        projects,
        wellness,
        reminders,
        currentUserId,
      });

      const assistantMessage: KizunaChatMessage = {
        id: generateId("chat"),
        role: "assistant",
        content: reply,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) =>
        [...current, userMessage, assistantMessage].slice(-KIZUNA_CHAT_MAX_MESSAGES)
      );
    },
    [projects, raw, reminders, wellness, currentUserId]
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  const value = useMemo<KizunaChatContextValue>(
    () => ({
      isOpen,
      messages,
      isLoaded: workspaceLoaded,
      openChat,
      closeChat,
      sendMessage,
      clearConversation,
    }),
    [
      isOpen,
      messages,
      workspaceLoaded,
      openChat,
      closeChat,
      sendMessage,
      clearConversation,
    ]
  );

  return (
    <KizunaChatContext.Provider value={value}>
      {children}
      <KizunaChatPanel />
    </KizunaChatContext.Provider>
  );
}

export function useKizunaChat() {
  const context = useContext(KizunaChatContext);
  if (!context) {
    throw new Error("useKizunaChat must be used within a KizunaChatProvider");
  }
  return context;
}
