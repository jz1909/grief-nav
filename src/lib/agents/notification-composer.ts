import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../prisma";
import type { ContactDossier } from "../dossier";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface NotificationDraft {
  contactId: string;
  email: string;
  group: string;
  subject: string;
  body: string;
  tone: string;
}

export interface NotificationResult {
  drafts: NotificationDraft[];
  byGroup: Record<string, NotificationDraft[]>;
  errors: string[];
}

interface GroupedContacts {
  group: string;
  contacts: Array<{
    id: string;
    email: string;
    displayName: string | null;
    dossier?: ContactDossier;
  }>;
}

function buildNotificationSystemPrompt(
  deceasedName: string,
  senderName: string
): string {
  return `You are a compassionate assistant helping someone notify contacts about a death in the family.

The deceased person is: ${deceasedName}
The sender is: ${senderName}

Your task is to compose sincere, heartfelt notification emails that are appropriate for different relationship types. The emails should:

1. Be warm, genuine, and respectful
2. Acknowledge the relationship appropriately (more personal for family/friends, more formal for professional contacts)
3. Include the essential information without being overly detailed
4. Express gratitude for their relationship with the deceased when appropriate
5. Provide a way to reach out if they wish to connect
6. Be concise but not cold

Adapt the tone based on the relationship category:
- relatives: Deeply personal, acknowledging shared grief
- friends: Warm and personal, acknowledging their friendship
- coworkers: Professional but warm, acknowledging working relationship
- professional_services: Brief and factual, focused on necessary information
- other: Neutral but respectful

Return a JSON array of email drafts:
[
  {
    "contactId": "...",
    "email": "...",
    "group": "...",
    "subject": "...",
    "body": "...",
    "tone": "personal|warm|professional|formal"
  }
]`;
}

function buildNotificationUserPrompt(
  groupedContacts: GroupedContacts,
  deceasedName: string
): string {
  const contactList = groupedContacts.contacts
    .map((c) => {
      const name = c.displayName || c.email.split("@")[0];
      const context = c.dossier
        ? `Keywords: ${c.dossier.topicKeywords.slice(0, 5).join(", ") || "none"}, Last contact: ${c.dossier.lastSeenDaysAgo} days ago`
        : "No additional context";
      return `- ${name} (${c.email}): ${context}`;
    })
    .join("\n");

  return `Please compose notification emails for the following ${groupedContacts.group} contacts about ${deceasedName}'s passing:

${contactList}

Generate a thoughtful, sincere email for each contact. The email should be appropriate for the "${groupedContacts.group}" relationship category.`;
}

export async function composeNotificationEmails(
  userId: string,
  deceasedName: string,
  senderName: string,
  dossiers: ContactDossier[]
): Promise<NotificationResult> {
  const drafts: NotificationDraft[] = [];
  const byGroup: Record<string, NotificationDraft[]> = {};
  const errors: string[] = [];

  // Get classified contacts
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      group: { not: null },
    },
  });

  // Create dossier lookup
  const dossierMap = new Map(dossiers.map((d) => [d.contactId, d]));

  // Group contacts by category
  const grouped = new Map<string, GroupedContacts>();

  for (const contact of contacts) {
    if (!contact.group) continue;

    if (!grouped.has(contact.group)) {
      grouped.set(contact.group, { group: contact.group, contacts: [] });
    }

    grouped.get(contact.group)!.contacts.push({
      id: contact.id,
      email: contact.primaryEmail,
      displayName: contact.displayName,
      dossier: dossierMap.get(contact.id),
    });
  }

  // Process each group
  for (const [group, groupData] of grouped) {
    // Skip professional_services and other by default (can be configured)
    if (group === "professional_services") {
      continue;
    }

    try {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: buildNotificationSystemPrompt(deceasedName, senderName),
        messages: [
          {
            role: "user",
            content: buildNotificationUserPrompt(groupData, deceasedName),
          },
        ],
      });

      const text =
        response.content[0].type === "text" ? response.content[0].text : "";

      // Extract JSON array from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const groupDrafts: NotificationDraft[] = JSON.parse(jsonMatch[0]);
        drafts.push(...groupDrafts);
        byGroup[group] = groupDrafts;
      }
    } catch (error) {
      errors.push(
        `Failed to compose emails for ${group}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  return { drafts, byGroup, errors };
}

export async function saveNotificationDrafts(
  userId: string,
  drafts: NotificationDraft[]
): Promise<number> {
  let saved = 0;

  for (const draft of drafts) {
    await prisma.notificationDraft.upsert({
      where: {
        userId_contactId: {
          userId,
          contactId: draft.contactId,
        },
      },
      create: {
        userId,
        contactId: draft.contactId,
        email: draft.email,
        group: draft.group,
        subject: draft.subject,
        body: draft.body,
        tone: draft.tone,
        status: "draft",
      },
      update: {
        subject: draft.subject,
        body: draft.body,
        tone: draft.tone,
        updatedAt: new Date(),
      },
    });
    saved++;
  }

  return saved;
}

export async function getNotificationDrafts(userId: string) {
  return prisma.notificationDraft.findMany({
    where: { userId },
    orderBy: [{ group: "asc" }, { createdAt: "desc" }],
  });
}

export async function updateDraftStatus(
  draftId: string,
  userId: string,
  status: "draft" | "approved" | "sent" | "skipped"
) {
  return prisma.notificationDraft.update({
    where: { id: draftId, userId },
    data: {
      status,
      sentAt: status === "sent" ? new Date() : undefined,
    },
  });
}

export async function sendApprovedNotifications(
  userId: string,
  accessToken: string
): Promise<{ sent: number; errors: string[] }> {
  const { sendEmail } = await import("./email");

  const approvedDrafts = await prisma.notificationDraft.findMany({
    where: { userId, status: "approved" },
  });

  let sent = 0;
  const errors: string[] = [];

  for (const draft of approvedDrafts) {
    const result = await sendEmail(accessToken, {
      to: draft.email,
      subject: draft.subject,
      body: draft.body,
    });

    if (result.success) {
      await updateDraftStatus(draft.id, userId, "sent");
      sent++;
    } else {
      errors.push(`Failed to send to ${draft.email}: ${result.message}`);
    }
  }

  return { sent, errors };
}
