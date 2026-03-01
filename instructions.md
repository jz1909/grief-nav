# DeathGPT - Complete Build Instructions

## What This Project Is

**DeathGPT** is a human-in-the-loop AI system that helps people handle the administrative and social coordination required after a death. It focuses on email-based contact grouping and draft communication.

**Core Principle:** The system helps you do difficult things with less friction—it never acts autonomously or sends communications without explicit approval.

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16 with App Router |
| Language | TypeScript |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Font | Bodoni Moda (Google Fonts) |
| Auth | NextAuth v5 with Prisma adapter |
| Database | Prisma ORM (SQLite dev, PostgreSQL prod) |
| AI | Anthropic Claude SDK (`claude-sonnet-4-20250514`) |
| State | TanStack React Query |
| APIs | Gmail API, Google Tasks API |

---

## Part 1: Project Setup

### 1.1 Create Next.js Project

```bash
npx create-next-app@latest app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
cd app
```

### 1.2 Install Dependencies

```bash
# Core dependencies
npm install @anthropic-ai/sdk @auth/prisma-adapter @prisma/client
npm install @tanstack/react-query googleapis next-auth@beta
npm install zod bcryptjs rake-js

# UI dependencies (shadcn/ui)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react @radix-ui/react-label @radix-ui/react-slot
npm install react-hook-form @hookform/resolvers

# Dev dependencies
npm install -D prisma @types/bcryptjs
```

### 1.3 Initialize shadcn/ui

```bash
npx shadcn@latest init
```

Select:
- Style: new-york
- Base color: neutral
- CSS variables: yes

Add components:
```bash
npx shadcn@latest add button card input label textarea form
```

---

## Part 2: Configuration Files

### 2.1 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2.2 `next.config.ts`

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
```

### 2.3 `postcss.config.mjs`

```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### 2.4 `components.json` (shadcn/ui)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 2.5 Environment Variables

Create `.env`:
```env
DATABASE_URL="file:./dev.db"
```

Create `.env.local`:
```env
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_GOOGLE_ID="your-google-oauth-client-id"
AUTH_GOOGLE_SECRET="your-google-oauth-client-secret"
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

---

## Part 3: Database Schema

### 3.1 Initialize Prisma

```bash
npx prisma init --datasource-provider sqlite
```

### 3.2 `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id            String         @id @default(cuid())
  name          String?
  email         String?        @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
  emailMessages EmailMessage[]
  contacts      Contact[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model EmailMessage {
  id             String   @id @default(cuid())
  userId         String
  gmailMessageId String
  threadId       String?
  date           DateTime
  fromEmail      String
  toEmails       String   // JSON array
  ccEmails       String?  // JSON array
  subject        String?
  bodyText       String?  // Truncated to ~5k chars
  createdAt      DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, gmailMessageId])
  @@index([userId])
  @@index([fromEmail])
}

model Contact {
  id           String   @id @default(cuid())
  userId       String
  primaryEmail String
  displayName  String?
  domain       String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Classification fields
  group        String?
  confidence   Float?
  rationale    String?
  isOverridden Boolean  @default(false)

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, primaryEmail])
  @@index([userId])
  @@index([domain])
}
```

### 3.3 Run Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Part 4: Global Styles

### 4.1 `src/app/globals.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
  --chart-1: oklch(0.646 0.222 41.116);
  --chart-2: oklch(0.6 0.118 184.704);
  --chart-3: oklch(0.398 0.07 227.392);
  --chart-4: oklch(0.828 0.189 84.429);
  --chart-5: oklch(0.769 0.188 70.08);
  --sidebar: oklch(0.985 0 0);
  --sidebar-foreground: oklch(0.145 0 0);
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
  --sidebar-border: oklch(0.922 0 0);
  --sidebar-ring: oklch(0.708 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.488 0.243 264.376);
  --chart-2: oklch(0.696 0.17 162.48);
  --chart-3: oklch(0.769 0.188 70.08);
  --chart-4: oklch(0.627 0.265 303.9);
  --chart-5: oklch(0.645 0.246 16.439);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## Part 5: Core Library Files

### 5.1 `src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5.2 `src/lib/prisma.ts`

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

### 5.3 `src/lib/auth.ts`

```typescript
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/tasks",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });

        if (!user || !user.password) return null;

        const isValid = await bcrypt.compare(
          parsed.data.password,
          user.password
        );
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = request.nextUrl.pathname.startsWith("/dashboard");
      const isOnMailAutomation = request.nextUrl.pathname.startsWith("/mailautomation");

      if (isOnDashboard || isOnMailAutomation) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account?.provider === "google") {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
});

export async function getGoogleAccessToken(
  userId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account) return null;

  // Check if token is expired
  if (account.expires_at && account.expires_at * 1000 < Date.now()) {
    // Refresh the token
    if (!account.refresh_token) return null;

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.AUTH_GOOGLE_ID!,
          client_secret: process.env.AUTH_GOOGLE_SECRET!,
          refresh_token: account.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await response.json();

      if (!response.ok) {
        console.error("Failed to refresh token:", tokens);
        return null;
      }

      // Update the account with new tokens
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: tokens.access_token,
          expires_at: Math.floor(Date.now() / 1000) + tokens.expires_in,
        },
      });

      return tokens.access_token;
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  }

  return account.access_token;
}
```

### 5.4 `src/lib/anthropic.ts`

```typescript
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
```

### 5.5 `src/lib/gmail.ts`

```typescript
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
  headers: Array<{ name?: string; value?: string }>,
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
```

### 5.6 `src/lib/dossier.ts`

```typescript
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
```

### 5.7 `src/lib/classifier.ts`

```typescript
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
```

### 5.8 `src/lib/agents/email.ts`

```typescript
import { google } from "googleapis";
import type { AgentResult } from "@/types/coordinator";

interface EmailParams {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail(
  accessToken: string,
  params: EmailParams
): Promise<AgentResult> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Create email in RFC 2822 format
    const email = [
      `To: ${params.to}`,
      `Subject: ${params.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      "",
      params.body,
    ].join("\n");

    // Encode to base64url
    const encodedMessage = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      agent: "email",
      success: true,
      message: `Email sent to ${params.to}`,
    };
  } catch (error) {
    return {
      agent: "email",
      success: false,
      message: `Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
```

### 5.9 `src/lib/agents/tasks.ts`

```typescript
import { google } from "googleapis";
import type { AgentResult } from "@/types/coordinator";

interface TaskParams {
  action: "create" | "list" | "complete" | "delete";
  title?: string;
  notes?: string;
  due?: string;
  taskId?: string;
}

export async function handleTasks(
  accessToken: string,
  params: TaskParams
): Promise<AgentResult> {
  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const tasks = google.tasks({ version: "v1", auth: oauth2Client });

    // Get default task list
    const taskLists = await tasks.tasklists.list();
    const defaultList = taskLists.data.items?.[0];

    if (!defaultList?.id) {
      return {
        agent: "tasks",
        success: false,
        message: "No task list found",
      };
    }

    switch (params.action) {
      case "create": {
        const result = await tasks.tasks.insert({
          tasklist: defaultList.id,
          requestBody: {
            title: params.title,
            notes: params.notes,
            due: params.due,
          },
        });
        return {
          agent: "tasks",
          success: true,
          message: `Task created: ${params.title}`,
          data: result.data,
        };
      }

      case "list": {
        const result = await tasks.tasks.list({
          tasklist: defaultList.id,
          maxResults: 10,
        });
        return {
          agent: "tasks",
          success: true,
          message: `Found ${result.data.items?.length || 0} tasks`,
          data: result.data.items,
        };
      }

      case "complete": {
        await tasks.tasks.update({
          tasklist: defaultList.id,
          task: params.taskId!,
          requestBody: { status: "completed" },
        });
        return {
          agent: "tasks",
          success: true,
          message: "Task marked as completed",
        };
      }

      case "delete": {
        await tasks.tasks.delete({
          tasklist: defaultList.id,
          task: params.taskId!,
        });
        return {
          agent: "tasks",
          success: true,
          message: "Task deleted",
        };
      }

      default:
        return {
          agent: "tasks",
          success: false,
          message: `Unknown action: ${params.action}`,
        };
    }
  } catch (error) {
    return {
      agent: "tasks",
      success: false,
      message: `Task operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
```

---

## Part 6: Type Definitions

### 6.1 `src/types/coordinator.ts`

```typescript
export interface CoordinatorRequest {
  input: string;
}

export interface CoordinatorResponse {
  success: boolean;
  results: AgentResult[];
  error?: string;
  message?: string;
}

export interface AgentResult {
  agent: "email" | "tasks";
  success: boolean;
  message: string;
  data?: unknown;
}

export interface ParsedIntent {
  agents: AgentAction[];
}

export type AgentAction = EmailAction | TaskAction;

export interface EmailAction {
  type: "email";
  params: {
    to: string;
    subject: string;
    body: string;
  };
}

export interface TaskAction {
  type: "tasks";
  params: {
    action: "create" | "list" | "complete" | "delete";
    title?: string;
    notes?: string;
    due?: string;
    taskId?: string;
  };
}
```

### 6.2 `src/types/next-auth.d.ts`

```typescript
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
```

### 6.3 `src/types/rake-js.d.ts`

```typescript
declare module "rake-js" {
  interface RakeOptions {
    language?: string;
    delimiters?: string[];
  }

  function Rake(text: string, options?: RakeOptions): string[];
  export = Rake;
}
```

---

## Part 7: API Routes

### 7.1 `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### 7.2 `src/app/api/coordinator/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth, getGoogleAccessToken } from "@/lib/auth";
import { parseUserIntent } from "@/lib/anthropic";
import { sendEmail } from "@/lib/agents/email";
import { handleTasks } from "@/lib/agents/tasks";
import type {
  CoordinatorRequest,
  CoordinatorResponse,
  AgentResult,
} from "@/types/coordinator";

export async function POST(request: NextRequest): Promise<NextResponse<CoordinatorResponse>> {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, results: [], error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body: CoordinatorRequest = await request.json();

  if (!body.input?.trim()) {
    return NextResponse.json(
      { success: false, results: [], error: "No input provided" },
      { status: 400 }
    );
  }

  // Get access token for Google APIs
  const accessToken = await getGoogleAccessToken(session.user.id);

  if (!accessToken) {
    return NextResponse.json(
      {
        success: false,
        results: [],
        error: "No Google account linked",
      },
      { status: 400 }
    );
  }

  // Parse user intent
  const intent = await parseUserIntent(body.input);

  if (intent.agents.length === 0) {
    return NextResponse.json({
      success: true,
      results: [],
      message: "No actionable intent detected",
    });
  }

  // Execute agents
  const results: AgentResult[] = [];

  for (const agent of intent.agents) {
    let result: AgentResult;

    switch (agent.type) {
      case "email":
        result = await sendEmail(accessToken, agent.params);
        break;
      case "tasks":
        result = await handleTasks(accessToken, agent.params);
        break;
      default:
        result = {
          agent: "email",
          success: false,
          message: `Unknown agent type`,
        };
    }

    results.push(result);
  }

  return NextResponse.json({
    success: results.every((r) => r.success),
    results,
  });
}
```

### 7.3 `src/app/api/mail/import/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { importGmailMessages, getImportStats } from "@/lib/gmail";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await importGmailMessages(session.user.id);

  return NextResponse.json({
    success: !result.error,
    messagesImported: result.messagesImported,
    contactsCreated: result.contactsCreated,
    error: result.error,
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await getImportStats(session.user.id);

  return NextResponse.json(stats);
}
```

### 7.4 `src/app/api/mail/contacts/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getContacts } from "@/lib/gmail";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contacts = await getContacts(session.user.id);

  return NextResponse.json({ contacts });
}
```

### 7.5 `src/app/api/mail/dossiers/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAllDossiers, getDossiersForClassification } from "@/lib/dossier";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const forClassification = searchParams.get("forClassification") === "true";
  const batchSize = parseInt(searchParams.get("batchSize") || "25");

  if (forClassification) {
    const result = await getDossiersForClassification(
      session.user.id,
      batchSize
    );
    return NextResponse.json(result);
  }

  const result = await buildAllDossiers(session.user.id);
  return NextResponse.json(result);
}
```

### 7.6 `src/app/api/mail/classify/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDossiersForClassification } from "@/lib/dossier";
import {
  classifyAllContacts,
  getClassificationStatus,
  overrideContactClassification,
  resetClassifications,
  DEFAULT_CATEGORIES,
} from "@/lib/classifier";

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const categories = body.categories || DEFAULT_CATEGORIES;
  const batchSize = body.batchSize || 25;

  // Get dossiers
  const { batches, totalContacts } = await getDossiersForClassification(
    session.user.id,
    batchSize
  );

  // Flatten batches for classification
  const allDossiers = batches.flat();

  // Classify
  const result = await classifyAllContacts(
    session.user.id,
    allDossiers,
    categories,
    batchSize
  );

  return NextResponse.json({
    success: result.errors.length === 0,
    classified: result.results.length,
    updated: result.updated,
    errors: result.errors,
  });
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getClassificationStatus(session.user.id);
  return NextResponse.json(status);
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { contactId, group, rationale } = body;

  if (!contactId || !group) {
    return NextResponse.json(
      { error: "contactId and group required" },
      { status: 400 }
    );
  }

  const updated = await overrideContactClassification(
    contactId,
    session.user.id,
    group,
    rationale
  );

  return NextResponse.json({ success: true, contact: updated });
}

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await resetClassifications(session.user.id);
  return NextResponse.json({ success: true, reset: count });
}
```

---

## Part 8: Providers

### 8.1 `src/providers/index.tsx`

```typescript
"use client";

import { SessionProvider } from "./session-provider";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
}
```

### 8.2 `src/providers/session-provider.tsx`

```typescript
"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### 8.3 `src/providers/query-provider.tsx`

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
```

---

## Part 9: React Hooks

### 9.1 `src/hooks/use-mail-import.ts`

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useImportStats() {
  return useQuery({
    queryKey: ["mail-import-stats"],
    queryFn: async () => {
      const res = await fetch("/api/mail/import");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useImportEmails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mail/import", { method: "POST" });
      if (!res.ok) throw new Error("Import failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mail-import-stats"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useContacts() {
  return useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const res = await fetch("/api/mail/contacts");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      return res.json();
    },
  });
}

export function useDossiersForClassification(batchSize = 25) {
  return useQuery({
    queryKey: ["dossiers-classification", batchSize],
    queryFn: async () => {
      const res = await fetch(
        `/api/mail/dossiers?forClassification=true&batchSize=${batchSize}`
      );
      if (!res.ok) throw new Error("Failed to fetch dossiers");
      return res.json();
    },
    enabled: false, // Manual trigger
  });
}

export function useClassificationStatus() {
  return useQuery({
    queryKey: ["classification-status"],
    queryFn: async () => {
      const res = await fetch("/api/mail/classify");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
  });
}

export function useClassifyContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options?: { categories?: unknown[]; batchSize?: number }) => {
      const res = await fetch("/api/mail/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(options || {}),
      });
      if (!res.ok) throw new Error("Classification failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useOverrideClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      contactId: string;
      group: string;
      rationale?: string;
    }) => {
      const res = await fetch("/api/mail/classify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Override failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useResetClassifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/mail/classify", { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classification-status"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
```

### 9.2 `src/hooks/use-coordinator.ts`

```typescript
import { useMutation } from "@tanstack/react-query";
import type { CoordinatorResponse } from "@/types/coordinator";

export function useCoordinator() {
  return useMutation({
    mutationFn: async (input: string): Promise<CoordinatorResponse> => {
      const res = await fetch("/api/coordinator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Request failed");
      }
      return res.json();
    },
  });
}
```

---

## Part 10: Root Layout

### `src/app/layout.tsx`

```typescript
import type { Metadata } from "next";
import { Bodoni_Moda, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeathGPT",
  description: "The service for handling when you're grieving",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bodoniModa.variable} font-[family-name:var(--font-bodoni-moda)] antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

---

## Part 11: Pages

### 11.1 Landing Page (`src/app/page.tsx`)

```typescript
import { Button } from "@/components/ui/button";
import { SignInButton } from "@/components/sign-in-button";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative h-[70vh] flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center px-4">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
            DeathGPT
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl mx-auto">
            The service for handling when you&apos;re grieving
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
            Helping you manage administrative tasks and coordinate
            communications during difficult times
          </p>
          <SignInButton />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect your email</h3>
              <p className="text-gray-600">
                Securely link your Gmail to understand your relationships
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Review contacts</h3>
              <p className="text-gray-600">
                AI groups your contacts by relationship type
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Draft & send</h3>
              <p className="text-gray-600">
                Generate appropriate messages with full approval control
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 11.2 Sign In Page (`src/app/auth/signin/page.tsx`)

```typescript
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: true,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setError("Invalid credentials");
      }
    } catch {
      setError("Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Sign in to DeathGPT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In */}
          <Button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Credentials Sign In */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 11.3 Dashboard Page (`src/app/dashboard/page.tsx`)

```typescript
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">DeathGPT</h1>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{session.user.email}</span>
          <SignOutButton />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                DeathGPT helps you manage communications during difficult times.
                All actions require your explicit approval.
              </p>
            </CardContent>
          </Card>

          {/* Tools Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/mailautomation">
                <Button className="w-full">Mail Automation</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
```

### 11.4 Mail Automation Page (`src/app/mailautomation/page.tsx`)

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImportPanel } from "@/components/mail/import-panel";
import { ContactsPanel } from "@/components/mail/contacts-panel";
import { DossiersPanel } from "@/components/mail/dossiers-panel";
import { ClassificationPanel } from "@/components/mail/classification-panel";

export default function MailAutomationPage() {
  const [step, setStep] = useState(1);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Mail Automation</h1>

        {/* Step Indicators */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`px-4 py-2 rounded ${
                step === s
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && <ImportPanel onComplete={() => setStep(2)} />}
        {step === 2 && <ContactsPanel onComplete={() => setStep(3)} />}
        {step === 3 && <DossiersPanel onComplete={() => setStep(4)} />}
        {step === 4 && <ClassificationPanel onComplete={() => setStep(5)} />}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Draft & Send</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Coming soon: Draft and send emails to your contact groups.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
```

---

## Part 12: Feature Components

### 12.1 `src/components/sign-in-button.tsx`

```typescript
"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignInButton() {
  return (
    <Button
      variant="outline"
      size="lg"
      onClick={() => signIn()}
    >
      Sign In
    </Button>
  );
}
```

### 12.2 `src/components/sign-out-button.tsx`

```typescript
"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign out
    </Button>
  );
}
```

### 12.3 `src/components/mail/import-panel.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useImportStats, useImportEmails } from "@/hooks/use-mail-import";

interface ImportPanelProps {
  onComplete: () => void;
}

export function ImportPanel({ onComplete }: ImportPanelProps) {
  const { data: stats, isLoading: statsLoading } = useImportStats();
  const importMutation = useImportEmails();

  const handleImport = async () => {
    await importMutation.mutateAsync();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 1: Import Contacts from Gmail</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statsLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            <p>Messages imported: {stats?.messageCount || 0}</p>
            <p>Contacts found: {stats?.contactCount || 0}</p>
            {stats?.lastImportDate && (
              <p className="text-sm text-gray-500">
                Last import: {new Date(stats.lastImportDate).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={importMutation.isPending}
          >
            {importMutation.isPending ? "Importing..." : "Import from Gmail"}
          </Button>

          {(stats?.contactCount || 0) > 0 && (
            <Button variant="outline" onClick={onComplete}>
              Continue
            </Button>
          )}
        </div>

        {importMutation.isError && (
          <p className="text-red-600">
            Import failed: {importMutation.error.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 12.4 `src/components/mail/contacts-panel.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useContacts } from "@/hooks/use-mail-import";

interface ContactsPanelProps {
  onComplete: () => void;
}

export function ContactsPanel({ onComplete }: ContactsPanelProps) {
  const { data, isLoading } = useContacts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">Loading contacts...</CardContent>
      </Card>
    );
  }

  const contacts = data?.contacts || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 2: Review Contacts ({contacts.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 overflow-y-auto space-y-2">
          {contacts.map((contact: any) => (
            <div
              key={contact.id}
              className="p-3 border rounded flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{contact.primaryEmail}</p>
                {contact.displayName && (
                  <p className="text-sm text-gray-500">{contact.displayName}</p>
                )}
              </div>
              {contact.group && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  {contact.group}
                </span>
              )}
            </div>
          ))}
        </div>

        <Button onClick={onComplete}>Continue to Analysis</Button>
      </CardContent>
    </Card>
  );
}
```

### 12.5 `src/components/mail/dossiers-panel.tsx`

```typescript
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDossiersForClassification } from "@/hooks/use-mail-import";

interface DossiersPanelProps {
  onComplete: () => void;
}

export function DossiersPanel({ onComplete }: DossiersPanelProps) {
  const { data, isLoading, refetch, isFetching } = useDossiersForClassification();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleBuild = () => {
    refetch();
  };

  const allDossiers = data?.batches?.flat() || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 3: Build Contact Dossiers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gray-600">
          Analyze email patterns to understand your relationships.
        </p>

        <Button onClick={handleBuild} disabled={isFetching}>
          {isFetching ? "Building..." : "Build Dossiers"}
        </Button>

        {allDossiers.length > 0 && (
          <>
            <p>{allDossiers.length} dossiers built</p>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {allDossiers.slice(0, 20).map((dossier: any) => (
                <div key={dossier.contactId} className="border rounded p-3">
                  <div
                    className="cursor-pointer flex justify-between"
                    onClick={() =>
                      setExpanded(
                        expanded === dossier.contactId ? null : dossier.contactId
                      )
                    }
                  >
                    <span className="font-medium">{dossier.email}</span>
                    <span className="text-gray-500">
                      {dossier.messageCount} messages
                    </span>
                  </div>

                  {expanded === dossier.contactId && (
                    <div className="mt-2 text-sm space-y-1">
                      <p>Domain: {dossier.domain}</p>
                      <p>Last seen: {dossier.lastSeenDaysAgo} days ago</p>
                      {dossier.signatureHints.length > 0 && (
                        <p>Hints: {dossier.signatureHints.join(", ")}</p>
                      )}
                      {dossier.topicKeywords.length > 0 && (
                        <p>Keywords: {dossier.topicKeywords.join(", ")}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={onComplete}>Continue to Classification</Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 12.6 `src/components/mail/classification-panel.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  useClassificationStatus,
  useClassifyContacts,
  useContacts,
  useOverrideClassification,
} from "@/hooks/use-mail-import";

interface ClassificationPanelProps {
  onComplete: () => void;
}

export function ClassificationPanel({ onComplete }: ClassificationPanelProps) {
  const { data: status, isLoading: statusLoading } = useClassificationStatus();
  const { data: contactsData } = useContacts();
  const classifyMutation = useClassifyContacts();
  const overrideMutation = useOverrideClassification();

  const handleClassify = () => {
    classifyMutation.mutate({});
  };

  const handleOverride = (contactId: string, newGroup: string) => {
    overrideMutation.mutate({ contactId, group: newGroup });
  };

  const contacts = contactsData?.contacts || [];
  const groups = status?.byGroup || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Step 4: Classify Contacts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {statusLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="space-y-2">
            <p>Total contacts: {status?.total || 0}</p>
            <p>Classified: {status?.classified || 0}</p>
            <p>Unclassified: {status?.unclassified || 0}</p>
          </div>
        )}

        <Button
          onClick={handleClassify}
          disabled={classifyMutation.isPending}
        >
          {classifyMutation.isPending ? "Classifying..." : "Classify with AI"}
        </Button>

        {groups.length > 0 && (
          <div className="space-y-4">
            {groups.map((g: any) => (
              <div key={g.group}>
                <h4 className="font-semibold capitalize">
                  {g.group} ({g.count})
                </h4>
                <div className="ml-4 space-y-1">
                  {contacts
                    .filter((c: any) => c.group === g.group)
                    .slice(0, 5)
                    .map((c: any) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <span className="text-sm">{c.primaryEmail}</span>
                        <select
                          value={c.group}
                          onChange={(e) => handleOverride(c.id, e.target.value)}
                          className="text-xs border rounded px-1"
                        >
                          {status?.defaultCategories?.map((cat: any) => (
                            <option key={cat.name} value={cat.name}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {(status?.classified || 0) > 0 && (
          <Button onClick={onComplete}>Continue to Draft</Button>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Part 13: Database Utility Script

### `scripts/clear-db.js`

```javascript
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Clearing database...");

  await prisma.emailMessage.deleteMany({});
  console.log("Deleted all email messages");

  await prisma.contact.deleteMany({});
  console.log("Deleted all contacts");

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run with: `node scripts/clear-db.js`

---

## Part 14: Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable APIs:
   - Gmail API
   - Google Tasks API
4. Configure OAuth consent screen:
   - User type: External
   - App name: DeathGPT
   - Scopes: email, profile, openid, gmail.readonly, gmail.send, tasks
5. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://yourdomain.com/api/auth/callback/google` (prod)
6. Copy Client ID and Secret to `.env.local`

---

## Part 15: Build & Run Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint

# Database operations
npx prisma migrate dev     # Run migrations
npx prisma studio          # Open database GUI
npx prisma generate        # Generate Prisma client
```

---

## Summary

This documentation covers the complete implementation of DeathGPT:

1. **Project setup** - Next.js 16 with TypeScript and Tailwind
2. **Database** - Prisma with User, Account, Session, EmailMessage, Contact models
3. **Authentication** - NextAuth v5 with Google OAuth and credentials
4. **Core libraries** - Gmail import, contact dossier building, AI classification
5. **API routes** - Auth, coordinator, mail import/contacts/classify
6. **React hooks** - TanStack Query hooks for all API operations
7. **Components** - Multi-step mail automation workflow

The system follows a human-in-the-loop design where all actions require explicit user approval. The AI classifies contacts and drafts communications, but never acts autonomously.
