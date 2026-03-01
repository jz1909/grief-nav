import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import type { ContactDossier } from "./dossier";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface CategoryDefinition {
  name: string;
  description: string;
  examples?: string[];
}

export interface ClassificationResult {
  contactId: string;
  email: string;
  group: string;
  confidence: number;
  rationale: string;
}

export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  {
    name: "relatives",
    description:
      "Family members including parents, siblings, grandparents, in-laws, cousins",
  },
  {
    name: "friends",
    description:
      "Social connections outside work, neighbors, hobby buddies, college friends",
  },
  {
    name: "coworkers",
    description:
      "Current or former colleagues, business partners, managers, direct reports",
  },
  {
    name: "professional_services",
    description:
      "Doctors, lawyers, accountants, banks, subscriptions, automated emails",
  },
  {
    name: "other",
    description: "Unclear relationship or insufficient information",
  },
];

function buildClassifierSystemPrompt(
  customCategories?: CategoryDefinition[]
): string {
  const categories = customCategories || DEFAULT_CATEGORIES;
  const categoryList = categories
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  return `You are a contact classifier. Given information about email interactions, classify the relationship.

Available categories:
${categoryList}

Be conservative. If uncertain, use "other". Base classification on evidence, not assumptions.

Return JSON array:
[
  {
    "contactId": "...",
    "email": "...",
    "group": "category_name",
    "confidence": 0.0-1.0,
    "rationale": "1-2 sentence explanation"
  }
]`;
}

function buildClassifierUserPrompt(
  dossiers: ContactDossier[],
  customCategories?: CategoryDefinition[]
): string {
  const categories = customCategories || DEFAULT_CATEGORIES;
  const categoryNames = categories.map((c) => c.name).join(", ");

  const dossierText = dossiers
    .map(
      (d) => `
Contact ID: ${d.contactId}
Email: ${d.email}
Domain: ${d.domain}
Messages: ${d.messageCount}
Last seen: ${d.lastSeenDaysAgo} days ago
Signature hints: ${d.signatureHints.join("; ") || "none"}
Keywords: ${d.topicKeywords.join(", ") || "none"}
Sample snippets: ${d.snippets.join(" | ").substring(0, 500) || "none"}
`
    )
    .join("\n---\n");

  return `Classify these contacts into: ${categoryNames}

${dossierText}

Return a JSON array with classification for each contact.`;
}

export async function classifyContactsBatch(
  dossiers: ContactDossier[],
  customCategories?: CategoryDefinition[]
): Promise<ClassificationResult[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: buildClassifierSystemPrompt(customCategories),
    messages: [
      {
        role: "user",
        content: buildClassifierUserPrompt(dossiers, customCategories),
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON array from response
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return [];
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function classifyAllContacts(
  userId: string,
  dossiers: ContactDossier[],
  customCategories?: CategoryDefinition[],
  batchSize: number = 25
) {
  const results: ClassificationResult[] = [];
  let updated = 0;
  const errors: string[] = [];

  // Process in batches
  for (let i = 0; i < dossiers.length; i += batchSize) {
    const batch = dossiers.slice(i, i + batchSize);

    try {
      const batchResults = await classifyContactsBatch(batch, customCategories);
      results.push(...batchResults);

      // Update database
      for (const result of batchResults) {
        await prisma.contact.update({
          where: { id: result.contactId },
          data: {
            group: result.group,
            confidence: result.confidence,
            rationale: result.rationale,
          },
        });
        updated++;
      }
    } catch (error) {
      errors.push(`Batch ${i / batchSize + 1} failed: ${error}`);
    }
  }

  return { results, updated, errors };
}

export async function getClassificationStatus(userId: string) {
  const [total, classified] = await Promise.all([
    prisma.contact.count({ where: { userId } }),
    prisma.contact.count({ where: { userId, group: { not: null } } }),
  ]);

  const byGroup = await prisma.contact.groupBy({
    by: ["group"],
    where: { userId, group: { not: null } },
    _count: true,
  });

  return {
    total,
    classified,
    unclassified: total - classified,
    byGroup: byGroup.map((g) => ({ group: g.group!, count: g._count })),
    defaultCategories: DEFAULT_CATEGORIES,
  };
}

export async function overrideContactClassification(
  contactId: string,
  userId: string,
  group: string,
  rationale?: string
) {
  return prisma.contact.update({
    where: { id: contactId, userId },
    data: {
      group,
      confidence: 1.0,
      rationale: rationale || "User override",
      isOverridden: true,
    },
  });
}

export async function resetClassifications(userId: string) {
  const result = await prisma.contact.updateMany({
    where: { userId, isOverridden: false },
    data: {
      group: null,
      confidence: null,
      rationale: null,
    },
  });

  return result.count;
}
