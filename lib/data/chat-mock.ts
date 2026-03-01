// ── Types ────────────────────────────────────────────────────────────────────

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
}

// ── Mock Data ────────────────────────────────────────────────────────────────

export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hello. I'm here to help you coordinate notifications and handle the administrative tasks ahead. What would you like to start with?",
    timestamp: new Date("2026-03-01T10:00:00"),
  },
  {
    id: "2",
    role: "user",
    content: "I just imported my Gmail. What should I do next?",
    timestamp: new Date("2026-03-01T10:01:00"),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "Now that your emails are imported, the next step is to build contact dossiers. This will analyze email patterns — frequency, topics, signatures — to prepare for classification. Would you like me to walk you through that, or should I start building the dossiers?",
    timestamp: new Date("2026-03-01T10:01:30"),
  },
];

/** Rotating canned responses used by the mock chat hook. */
export const MOCK_RESPONSES: string[] = [
  "I understand. Let me look into that for you. Based on the email patterns I've seen so far, I'd recommend starting with your closest contacts first.",
  "That's a good question. The classification process groups contacts by relationship type — family, friends, coworkers — using signals from email frequency, subject lines, and signature blocks.",
  "I'll make a note of that. Remember, you can always drag contacts between groups if the AI classification doesn't match your preference.",
  "Of course. Take your time with this process. There's no rush, and every step requires your explicit approval before anything is sent.",
];
