import Anthropic from "@anthropic-ai/sdk";
import type { ParsedIntent } from "@/types/coordinator";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function parseUserIntent(input: string): Promise<ParsedIntent> {
  const systemPrompt = `You are a coordinator that parses user intent and extracts structured actions.

Available agents:
1. email - Send emails. Extract: to (email address), subject, body
2. tasks - Manage Google Tasks. Actions: create, list, complete, delete

Return JSON with this structure:
{
  "agents": [
    {
      "type": "email",
      "params": { "to": "...", "subject": "...", "body": "..." }
    },
    {
      "type": "tasks",
      "params": { "action": "create|list|complete|delete", "title": "...", "notes": "...", "due": "...", "taskId": "..." }
    }
  ]
}

Only include agents that are clearly requested. If unclear, return empty agents array.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: input }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { agents: [] };
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return { agents: [] };
  }
}
