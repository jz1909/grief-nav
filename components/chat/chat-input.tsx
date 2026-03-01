"use client";

import { useState, useCallback, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SendHorizontal } from "lucide-react";

interface ChatInputProps {
  /** Called with the trimmed message text when the user submits. */
  onSend: (content: string) => void;
  /** When true, disables the input and send button. */
  disabled?: boolean;
  /** Placeholder text for the textarea. */
  placeholder?: string;
}

/**
 * Chat input bar with a textarea and send button.
 * Enter sends the message; Shift+Enter inserts a newline.
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type a message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }, [value, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex items-end gap-2 border-t px-4 py-3">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="min-h-[40px] max-h-[120px] resize-none"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
      >
        <SendHorizontal className="size-4" />
      </Button>
    </div>
  );
}
