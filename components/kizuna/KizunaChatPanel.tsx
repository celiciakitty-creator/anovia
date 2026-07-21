"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui";
import { AI_ASSISTANT_NAME } from "@/lib/constants";
import { formatChatTimestamp } from "@/lib/kizuna-chat-engine";
import { KIZUNA_SUGGESTED_QUESTIONS } from "@/types/kizuna-chat";
import { cn } from "@/lib/utils";
import { useKizunaChat } from "./KizunaChatProvider";

export function KizunaChatPanel() {
  const {
    isOpen,
    messages,
    isLoaded,
    closeChat,
    sendMessage,
    clearConversation,
  } = useKizunaChat();
  const [input, setInput] = useState("");
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, closeChat]);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-overlay"
        onClick={closeChat}
        aria-label="Close Ask Kizuna panel"
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "kizuna-chat-panel relative flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-[var(--card-shadow)] focus:outline-none"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Ask {AI_ASSISTANT_NAME}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Kizuna uses workspace rules and data — not a generative AI model.
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              disabled={messages.length === 0}
            >
              Clear
            </Button>
            <Button variant="ghost" size="sm" onClick={closeChat} aria-label="Close">
              ✕
            </Button>
          </div>
        </header>

        <div
          className="flex-1 overflow-y-auto px-4 py-4 sm:px-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {!isLoaded ? (
            <p className="text-sm text-muted-foreground">Loading workspace…</p>
          ) : messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-muted/20 px-4 py-5">
              <p className="text-sm text-foreground">
                Hi — I can answer questions about your tasks, projects, and
                progress using live workspace data.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Pick a suggested question below, or type your own. Conversations
                stay in this session only.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1",
                    message.role === "user" ? "items-end" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[92%] rounded-xl px-3 py-2.5 text-sm leading-relaxed",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-muted/30 text-foreground"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                  <time
                    className="text-[10px] text-muted-foreground"
                    dateTime={message.createdAt}
                  >
                    {formatChatTimestamp(message.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="shrink-0 border-t border-border px-4 py-3 sm:px-5">
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Suggested questions
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {KIZUNA_SUGGESTED_QUESTIONS.map((question) => (
              <button
                key={question.id}
                type="button"
                onClick={() => sendMessage(question.text)}
                className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {question.text}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <label className="sr-only" htmlFor="kizuna-chat-input">
              Message {AI_ASSISTANT_NAME}
            </label>
            <input
              ref={inputRef}
              id="kizuna-chat-input"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={`Ask ${AI_ASSISTANT_NAME}…`}
              className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-[var(--input-background)] px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              autoComplete="off"
            />
            <Button type="submit" size="sm" disabled={!input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </aside>
    </div>
  );
}
