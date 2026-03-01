"use client";

import { useChat } from "@/hooks/use-chat";
import { ChatPanel } from "@/components/chat/chat-panel";

/**
 * Client boundary that wires the useChat hook into the reusable ChatPanel.
 * This is the only component coupling dashboard context with chat functionality.
 */
export function DashboardChatClient() {
  const { messages, isLoading, sendMessage } = useChat();

  return (
    <ChatPanel
      messages={messages}
      isLoading={isLoading}
      onSendMessage={sendMessage}
      title="DeathGPT Assistant"
    />
  );
}
