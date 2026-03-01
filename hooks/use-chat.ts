"use client";

import { useState, useCallback } from "react";
import {
  MOCK_CHAT_MESSAGES,
  MOCK_RESPONSES,
  type ChatMessage,
} from "@/lib/data/chat-mock";

interface UseChatReturn {
  /** Current list of messages in the conversation. */
  messages: ChatMessage[];
  /** Whether the AI is currently generating a response. */
  isLoading: boolean;
  /** Send a new user message; triggers a mock AI response after a delay. */
  sendMessage: (content: string) => void;
}

/**
 * Manages local chat state with mock AI responses.
 * Internals can be swapped to a real API call (useMutation + fetch) later
 * without changing the return signature or any consuming components.
 */
export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_CHAT_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(
    (content: string) => {
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Simulate AI thinking delay (1.2–2 seconds)
      setTimeout(() => {
        const responseText =
          MOCK_RESPONSES[messages.length % MOCK_RESPONSES.length];
        const aiMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1200 + Math.random() * 800);
    },
    [messages.length]
  );

  return { messages, isLoading, sendMessage };
}
