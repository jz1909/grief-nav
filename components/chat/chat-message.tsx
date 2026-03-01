import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/data/chat-mock";

interface ChatMessageProps {
  /** The message to render. */
  message: ChatMessageType;
}

/**
 * Renders a single chat message bubble with an avatar indicator.
 * User messages align right with primary color; assistant messages align left with muted bg.
 */
export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback
          className={cn(
            "text-xs",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
