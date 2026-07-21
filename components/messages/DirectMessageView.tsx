"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { UserAvatar } from "@/components/profile";
import { MainLayout } from "@/components/layout";
import { Button, Card, EmptyState } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import {
  formatDirectMessageTimestamp,
  getDirectMessages,
  getOrCreateDirectConversation,
  sendDirectMessage,
} from "@/lib/direct-messages-db";
import { createClient } from "@/utils/supabase/client";
import type { DirectMessage } from "@/types/direct-message";
import { DIRECT_MESSAGE_MAX_LENGTH } from "@/types/direct-message";
import type { User } from "@/types/user";
import { cn } from "@/lib/utils";

function memberDisplayName(user: User): string {
  return user.displayName.trim() || user.name;
}

function normalizeGithubHandle(handle: string): string {
  return handle.trim().replace(/^@/, "");
}

function formatGithubHandle(handle: string): string | null {
  const normalized = normalizeGithubHandle(handle);
  return normalized ? `@${normalized}` : null;
}

function githubProfileUrl(handle: string): string | null {
  const normalized = normalizeGithubHandle(handle);
  return normalized ? `https://github.com/${normalized}` : null;
}

type DirectMessageViewProps = {
  recipientId: string;
};

export function DirectMessageView({ recipientId }: DirectMessageViewProps) {
  const { users, currentUserId, isLoaded: workspaceLoaded } = useWorkspace();
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const inputId = useId();
  const bottomRef = useRef<HTMLDivElement>(null);

  const recipient = users.find((user) => user.id === recipientId);
  const isSelf = currentUserId === recipientId;

  const loadConversation = useCallback(
    async (options?: { refresh?: boolean }) => {
      if (!workspaceLoaded || !currentUserId || isSelf) return;

      if (options?.refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setLoadError(null);

      try {
        const supabase = createClient();
        const conversation = await getOrCreateDirectConversation(
          supabase,
          currentUserId,
          recipientId
        );
        const loadedMessages = await getDirectMessages(
          supabase,
          conversation.id
        );
        setConversationId(conversation.id);
        setMessages(loadedMessages);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "Unable to load this conversation."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [workspaceLoaded, currentUserId, recipientId, isSelf]
  );

  useEffect(() => {
    if (!workspaceLoaded || !currentUserId || isSelf) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      void loadConversation();
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceLoaded, currentUserId, recipientId, isSelf, loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleRefresh = () => {
    void loadConversation({ refresh: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!conversationId || !currentUserId || !input.trim() || isSending) return;

    setIsSending(true);
    setSendError(null);

    try {
      const supabase = createClient();
      const message = await sendDirectMessage(
        supabase,
        conversationId,
        currentUserId,
        input
      );
      setMessages((current) => [...current, message]);
      setInput("");
    } catch (error) {
      setSendError(
        error instanceof Error ? error.message : "Unable to send message."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!workspaceLoaded) {
    return (
      <MainLayout subtitle="Team">
        <p className="text-sm text-muted-foreground">Loading workspace…</p>
      </MainLayout>
    );
  }

  if (!currentUserId) {
    return (
      <MainLayout subtitle="Team">
        <EmptyState
          title="Sign in to message teammates"
          description="Direct messages are available after you sign in."
          actionLabel="Go to sign in"
          actionHref="/auth"
          emoji="💬"
        />
      </MainLayout>
    );
  }

  if (isSelf) {
    return (
      <MainLayout subtitle="Team">
        <EmptyState
          title="You cannot message yourself"
          description="Choose a teammate from the directory to start a private conversation."
          actionLabel="Back to Team"
          actionHref="/team"
          emoji="💬"
        />
      </MainLayout>
    );
  }

  if (!recipient) {
    return (
      <MainLayout subtitle="Team">
        <EmptyState
          title="Teammate not found"
          description="This profile is not in your workspace member list."
          actionLabel="Back to Team"
          actionHref="/team"
          emoji="🔍"
        />
      </MainLayout>
    );
  }

  const displayName = memberDisplayName(recipient);
  const githubLabel = formatGithubHandle(recipient.githubHandle);
  const githubUrl = githubProfileUrl(recipient.githubHandle);

  return (
    <MainLayout subtitle="Team">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/team"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-sm"
            >
              ← Back to Team
            </Link>
            <div className="mt-3 flex items-center gap-3">
              <UserAvatar
                profile={{
                  displayName: recipient.displayName || recipient.name,
                  email: recipient.email,
                  avatarUrl: recipient.avatarUrl,
                }}
                size="md"
              />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {displayName}
                </h1>
                {githubUrl && githubLabel ? (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-0.5 inline-block truncate text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {githubLabel}
                  </a>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    No GitHub handle
                  </p>
                )}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            aria-busy={isRefreshing}
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

        <Card className="flex min-h-[28rem] flex-col overflow-hidden p-0 sm:min-h-[32rem]">
          <div
            className="flex-1 overflow-y-auto px-4 py-4 sm:px-5"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            aria-label={`Message history with ${displayName}`}
          >
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading conversation…
              </p>
            ) : loadError ? (
              <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                <p className="text-sm text-danger" role="alert">
                  {loadError}
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={handleRefresh}
                >
                  Try again
                </Button>
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                compact
                title="Start the conversation"
                description={`Say hello to ${displayName}. Your messages are private between the two of you.`}
                emoji="💬"
              />
            ) : (
              <ul className="space-y-4">
                {messages.map((message) => {
                  const isSent = message.senderId === currentUserId;
                  return (
                    <li
                      key={message.id}
                      className={cn(
                        "flex flex-col gap-1",
                        isSent ? "items-end" : "items-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[92%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                          isSent
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-muted/30 text-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{message.body}</p>
                      </div>
                      <time
                        className="text-[10px] text-muted-foreground"
                        dateTime={message.createdAt}
                      >
                        {isSent ? "Sent" : "Received"}{" "}
                        {formatDirectMessageTimestamp(message.createdAt)}
                      </time>
                    </li>
                  );
                })}
              </ul>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border px-4 py-3 sm:px-5">
            {sendError ? (
              <p className="mb-2 text-sm text-danger" role="alert">
                {sendError}
              </p>
            ) : null}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <label className="sr-only" htmlFor={inputId}>
                Message {displayName}
              </label>
              <input
                id={inputId}
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={`Message ${displayName}…`}
                maxLength={DIRECT_MESSAGE_MAX_LENGTH}
                disabled={isLoading || Boolean(loadError) || isSending}
                className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-[var(--input-background)] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                autoComplete="off"
              />
              <Button
                type="submit"
                size="sm"
                disabled={
                  !input.trim() ||
                  isSending ||
                  isLoading ||
                  Boolean(loadError) ||
                  !conversationId
                }
              >
                {isSending ? "Sending…" : "Send"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
