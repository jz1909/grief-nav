"use client";

import { useState } from "react";
import { useChat } from "@/hooks/use-chat";

// Hardcoded for testing — will be made dynamic later
const TEST_PROFILE_ID = "test-profile-id";

export function DashboardChatClient() {
  const { messages, isLoading, sendMessage } = useChat(TEST_PROFILE_ID);
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-primary-foreground"
                : "mr-auto max-w-[80%] rounded-lg bg-muted p-3"
            }
          >
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto max-w-[80%] rounded-lg bg-muted p-3 text-muted-foreground">
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-4">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about a document or task…"
          className="flex-1 rounded-md border px-3 py-2 text-sm"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
