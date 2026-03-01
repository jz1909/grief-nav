import { google } from "googleapis";
import { prisma } from "./prisma";
import { getGoogleAccessToken } from "./auth";

interface ImportResult {
  messagesImported: number;
  contactsCreated: number;
  error?: string;
}

export async function importGmailMessages(userId: string): Promise<ImportResult> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    return { messagesImported: 0, contactsCreated: 0, error: "No access token" };
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });

  // Get emails from last 90 days
  const ninetyDaysAgo = Math.floor(
    (Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000
  );
  const query = `after:${ninetyDaysAgo}`;

  let messagesImported = 0;
  const allEmails = new Set<string>();
  let pageToken: string | undefined;

  try {
    do {
      const listResponse = await gmail.users.messages.list({
        userId: "me",
        q: query,
        maxResults: 100,
        pageToken,
      });

      const messages = listResponse.data.messages || [];

      for (const msg of messages) {
        if (!msg.id) continue;

        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: msg.id,
          format: "full",
        });

        const headers = fullMessage.data.payload?.headers || [];
        const fromHeader = getHeader(headers, "From");
        const toHeader = getHeader(headers, "To");
        const ccHeader = getHeader(headers, "Cc");
        const dateHeader = getHeader(headers, "Date");
        const subjectHeader = getHeader(headers, "Subject");

        const fromEmail = parseEmailAddress(fromHeader);
        const toEmails = parseEmailAddresses(toHeader);
        const ccEmails = parseEmailAddresses(ccHeader);

        // Collect all email addresses
        if (fromEmail) allEmails.add(fromEmail.toLowerCase());
        toEmails.forEach((e) => allEmails.add(e.toLowerCase()));
        ccEmails.forEach((e) => allEmails.add(e.toLowerCase()));

        // Extract body text
        let bodyText = extractPlainText(fullMessage.data.payload);
        if (bodyText && bodyText.length > 5000) {
          bodyText = bodyText.substring(0, 5000);
        }

        // Upsert email message
        await prisma.emailMessage.upsert({
          where: {
            userId_gmailMessageId: {
              userId,
              gmailMessageId: msg.id,
            },
          },
          create: {
            userId,
            gmailMessageId: msg.id,
            threadId: fullMessage.data.threadId || null,
            date: dateHeader ? new Date(dateHeader) : new Date(),
            fromEmail: fromEmail || "",
            toEmails: JSON.stringify(toEmails),
            ccEmails: ccEmails.length > 0 ? JSON.stringify(ccEmails) : null,
            subject: subjectHeader || null,
            bodyText: bodyText || null,
          },
          update: {
            subject: subjectHeader || null,
            bodyText: bodyText || null,
          },
        });

        messagesImported++;
      }

      pageToken = listResponse.data.nextPageToken || undefined;

      // Rate limiting delay
      if (pageToken) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } while (pageToken);

    // Create contacts for all unique emails
    let contactsCreated = 0;
    for (const email of allEmails) {
      const domain = getDomain(email);

      const existing = await prisma.contact.findUnique({
        where: {
          userId_primaryEmail: { userId, primaryEmail: email },
        },
      });

      if (!existing) {
        await prisma.contact.create({
          data: {
            userId,
            primaryEmail: email,
            domain,
          },
        });
        contactsCreated++;
      }
    }

    return { messagesImported, contactsCreated };
  } catch (error) {
    console.error("Gmail import error:", error);
    return {
      messagesImported,
      contactsCreated: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getHeader(
  headers: Array<{ name?: string | null; value?: string | null }>,
  name: string
): string {
  const header = headers.find(
    (h) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return header?.value || "";
}

function parseEmailAddress(header: string): string | null {
  const match = header.match(/<([^>]+)>/) || header.match(/([^\s<>]+@[^\s<>]+)/);
  return match ? match[1] : null;
}

function parseEmailAddresses(header: string): string[] {
  if (!header) return [];
  const emails: string[] = [];
  const regex = /<([^>]+)>|([^\s,<>]+@[^\s,<>]+)/g;
  let match;
  while ((match = regex.exec(header)) !== null) {
    emails.push(match[1] || match[2]);
  }
  return emails;
}

function getDomain(email: string): string {
  const parts = email.split("@");
  return parts.length > 1 ? parts[1].toLowerCase() : "";
}

function extractPlainText(payload: any): string | null {
  if (!payload) return null;

  // Direct plain text
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // Check parts recursively
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    // Fallback to HTML stripped
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return stripHtml(decodeBase64(part.body.data));
      }
    }
    // Check nested parts
    for (const part of payload.parts) {
      const nested = extractPlainText(part);
      if (nested) return nested;
    }
  }

  return null;
}

function decodeBase64(data: string): string {
  // Gmail uses URL-safe base64
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(base64, "base64").toString("utf-8");
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function getImportStats(userId: string) {
  const [messageCount, contactCount, lastMessage] = await Promise.all([
    prisma.emailMessage.count({ where: { userId } }),
    prisma.contact.count({ where: { userId } }),
    prisma.emailMessage.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);

  return {
    messageCount,
    contactCount,
    lastImportDate: lastMessage?.createdAt || null,
  };
}

export async function getContacts(userId: string) {
  return prisma.contact.findMany({
    where: { userId },
    orderBy: { primaryEmail: "asc" },
  });
}
