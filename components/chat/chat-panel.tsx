"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Loader2 } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/data/chat-mock";

interface ChatPanelProps {
  /** Ordered list of chat messages. */
  messages: ChatMessageType[];
  /** Whether the AI is generating a response. */
  isLoading: boolean;
  /** Called when the user sends a message. */
  onSendMessage: (content: string) => void;
  /** Title displayed in the panel header. */
  title?: string;
}

/**
 * Composable chat panel with message list, auto-scroll, loading indicator, and input.
 * Receives all data and callbacks via props — domain-specific wiring belongs in the parent.
 */
export function ChatPanel({
  messages,
  isLoading,
  onSendMessage,
  title = "AI Assistant",
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  /** Auto-scroll to bottom when messages change or loading state flips. */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isLoading]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>

      {/* Message list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 py-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 px-4">
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
              <span className="text-muted-foreground text-sm">Thinking...</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </div>
  );
}
