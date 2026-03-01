import type { DeceasedProfileInput, RetrievalResult } from "./types";

export function checklistSystemPrompt(): string {
  return `You are a compassionate administrative assistant helping someone handle affairs after a death. Your job is to generate a prioritized checklist of tasks they need to complete.

Rules:
- Be thorough but not overwhelming. Group tasks by category.
- Categories are: "probate", "financial", "government", "insurance", "personal", "legal".
- Priority levels are: "high" (do within 1-2 weeks), "medium" (do within 1-2 months), "low" (can wait longer).
- Tailor the checklist to the specific circumstances provided (state, marital status, assets, etc.).
- For each item provide a short title and a 1-2 sentence description of what to do and why.
- Do NOT give legal advice. Frame items as "consider consulting an attorney" when appropriate.

Respond with a JSON array of objects with these fields:
- title: string
- description: string
- category: "probate" | "financial" | "government" | "insurance" | "personal" | "legal"
- priority: "high" | "medium" | "low"

Return ONLY the JSON array, no markdown fences or extra text.`;
}

export function checklistUserPrompt(profile: DeceasedProfileInput): string {
  const lines = [
    `Deceased: ${profile.fullName}`,
    `Date of death: ${profile.dateOfDeath.toISOString().split("T")[0]}`,
    `State: ${profile.state}`,
    `Marital status: ${profile.maritalStatus}`,
    `Has children: ${profile.hasChildren ? "yes" : "no"}`,
    `Has property: ${profile.hasProperty ? "yes" : "no"}`,
    `Has retirement accounts: ${profile.hasRetirementAccounts ? "yes" : "no"}`,
    `Has life insurance: ${profile.hasLifeInsurance ? "yes" : "no"}`,
  ];

  if (profile.additionalInfo) {
    lines.push(`Additional info: ${profile.additionalInfo}`);
  }

  return `Generate a checklist for handling the affairs of this deceased person:\n\n${lines.join("\n")}`;
}

export function documentAssistantSystemPrompt(): string {
  return `You are a compassionate assistant helping someone fill out a legal or administrative document after a death. You have been provided with relevant reference material from official guides.

Rules:
- Use the provided context to give accurate, specific guidance for each field or section of the document.
- If the context does not cover a specific question, say so honestly rather than guessing.
- Do NOT give legal advice. Suggest consulting a professional when the situation is complex.
- Be clear and direct. The user is likely under stress — avoid unnecessary jargon.
- Reference the source material when it supports your answer.`;
}

export function documentAssistantUserPrompt(
  query: string,
  retrievedChunks: RetrievalResult[],
): string {
  const contextBlock = retrievedChunks
    .map((r, i) => {
      const source = r.chunk.sectionTitle
        ? `${r.chunk.sourceFile} — ${r.chunk.sectionTitle}`
        : r.chunk.sourceFile;
      return `--- Context ${i + 1} (from: ${source}) ---\n${r.chunk.content}`;
    })
    .join("\n\n");

  return `Here is relevant reference material:\n\n${contextBlock}\n\n---\n\nUser question: ${query}`;
}
