"use client";

import { useState, useCallback } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const GREETING_MESSAGE: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Hello. I can help you understand the paperwork and legal steps ahead. Ask me about any document or task on your checklist.",
};

const MOCK_RESPONSES = [
  "I can help with that. Could you provide more details?",
  "That's a common question after a loss. Here's what I'd suggest…",
  "Let me look into that for you.",
];

function mockResponse(): string {
  return MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
}

export function useChat(deceasedProfileId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        if (!deceasedProfileId) {
          // Fall back to mock behaviour when no profile is provided
          await new Promise((resolve) => setTimeout(resolve, 800));
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: mockResponse(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          return;
        }

        const res = await fetch("/api/rag/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: content,
            deceased_profile_id: deceasedProfileId,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? `Request failed (${res.status})`);
        }

        const data = await res.json();

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "Sorry, something went wrong. Please try again in a moment.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        console.error("Chat error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [deceasedProfileId],
  );

  return { messages, isLoading, sendMessage };
}
