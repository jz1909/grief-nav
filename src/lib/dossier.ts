import { prisma } from "./prisma";
import Rake from "rake-js";

export interface ContactDossier {
  contactId: string;
  email: string;
  domain: string;
  displayName: string | null;
  messageCount: number;
  lastSeenDaysAgo: number;
  snippets: string[];
  signatureHints: string[];
  topicKeywords: string[];
}

export async function buildContactDossier(
  userId: string,
  contactId: string
): Promise<ContactDossier | null> {
  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact || contact.userId !== userId) return null;

  // Get emails involving this contact (last 25)
  const emails = await prisma.emailMessage.findMany({
    where: {
      userId,
      OR: [
        { fromEmail: contact.primaryEmail },
        { toEmails: { contains: contact.primaryEmail } },
        { ccEmails: { contains: contact.primaryEmail } },
      ],
    },
    orderBy: { date: "desc" },
    take: 25,
  });

  const messageCount = emails.length;
  const lastSeenDaysAgo =
    emails.length > 0
      ? Math.floor(
          (Date.now() - emails[0].date.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 999;

  // Extract snippets and signature hints
  const snippets: string[] = [];
  const signatureHints: string[] = [];
  const allText: string[] = [];

  for (const email of emails.slice(0, 10)) {
    if (email.bodyText) {
      const snippet = extractSnippet(email.bodyText);
      if (snippet) snippets.push(snippet);

      const hints = extractSignatureHints(email.bodyText);
      signatureHints.push(...hints);

      allText.push(email.bodyText);
    }
  }

  // Extract keywords
  const topicKeywords = extractKeywords(allText);

  return {
    contactId: contact.id,
    email: contact.primaryEmail,
    domain: contact.domain,
    displayName: contact.displayName,
    messageCount,
    lastSeenDaysAgo,
    snippets: snippets.slice(0, 5),
    signatureHints: [...new Set(signatureHints)].slice(0, 5),
    topicKeywords: topicKeywords.slice(0, 10),
  };
}

function extractSnippet(bodyText: string): string | null {
  // Skip common greetings
  const lines = bodyText.split("\n").filter((line) => {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.length < 10) return false;
    if (trimmed.startsWith("hi ")) return false;
    if (trimmed.startsWith("hello ")) return false;
    if (trimmed.startsWith("hope you")) return false;
    if (trimmed.startsWith("i hope")) return false;
    return true;
  });

  const snippet = lines.slice(0, 3).join(" ").substring(0, 200);
  return snippet.length > 20 ? snippet : null;
}

function extractSignatureHints(bodyText: string): string[] {
  const hints: string[] = [];

  // Look for signature patterns
  const signaturePatterns = [
    /Best,?\s*\n\s*([A-Z][a-z]+ [A-Z][a-z]+)/,
    /([A-Z][a-z]+)\s*\|\s*([A-Z][^|]+)/,
    /([A-Z][a-z]+ [A-Z][a-z]+)\s*\n\s*([A-Z][^,\n]+)/,
    /(CEO|CTO|VP|Director|Manager|Engineer|Developer|Designer)[^,\n]{0,50}/i,
  ];

  for (const pattern of signaturePatterns) {
    const match = bodyText.match(pattern);
    if (match) {
      hints.push(match[0].trim().substring(0, 100));
    }
  }

  return hints;
}

function extractKeywords(texts: string[]): string[] {
  const combined = texts.join(" ");
  if (combined.length < 50) return [];

  try {
    const keywords = Rake(combined, { language: "english" });
    return keywords
      .filter((kw: string) => kw.length > 3 && kw.length < 50)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function buildAllDossiers(userId: string) {
  const contacts = await prisma.contact.findMany({
    where: { userId },
  });

  const dossiers: ContactDossier[] = [];

  for (const contact of contacts) {
    const dossier = await buildContactDossier(userId, contact.id);
    if (dossier) {
      dossiers.push(dossier);
    }
  }

  return { dossiers };
}

export async function getDossiersForClassification(
  userId: string,
  batchSize: number = 25
) {
  const { dossiers } = await buildAllDossiers(userId);

  // Filter to contacts with messages
  const withMessages = dossiers.filter((d) => d.messageCount > 0);

  // Split into batches
  const batches: ContactDossier[][] = [];
  for (let i = 0; i < withMessages.length; i += batchSize) {
    batches.push(withMessages.slice(i, i + batchSize));
  }

  return { batches, totalContacts: withMessages.length };
}
