# DeathGPT Architecture Guide

This document provides a comprehensive overview of the DeathGPT codebase for new contributors.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Core Concepts](#core-concepts)
5. [Data Flow](#data-flow)
6. [Key Features & Implementation](#key-features--implementation)
7. [Database Schema](#database-schema)
8. [API Routes](#api-routes)
9. [Frontend Patterns](#frontend-patterns)
10. [AI Integration](#ai-integration)
11. [Development Workflow](#development-workflow)

---

## Project Overview

**DeathGPT** is a human-in-the-loop AI system that helps people handle administrative and social coordination after a death. The core principle is **coordination, clarity, and consent** — the AI assists but never acts autonomously.

### What It Does
- Imports Gmail contacts from the last 90 days
- Analyzes email patterns to build contact "dossiers"
- Uses AI to classify contacts into relationship groups (relatives, friends, coworkers, etc.)
- Allows manual drag-and-drop reassignment
- (Planned) Drafts group-specific notification emails for user approval

### What It Does NOT Do
- Send emails without explicit user confirmation
- Make legal or financial decisions
- Act autonomously in the background
- Impersonate the user

---

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| **Framework** | Next.js 16 (App Router) | Server components + API routes |
| **Language** | TypeScript | Strict typing throughout |
| **Styling** | Tailwind CSS 4 + shadcn/ui | Utility-first CSS with pre-built components |
| **Authentication** | NextAuth v5 | Google OAuth with Gmail/Tasks scopes |
| **Database** | SQLite + Prisma ORM | Simple setup, easy to swap to Postgres |
| **AI** | Anthropic Claude SDK | Claude Sonnet for classification |
| **State Management** | TanStack React Query | Server state caching and mutations |
| **Keyword Extraction** | rake-js | RAKE algorithm for topic extraction |

---

## Project Structure

```
app/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   └── mail/          # Mail automation endpoints
│   │   │       ├── import/    # Gmail import
│   │   │       ├── contacts/  # Contact listing
│   │   │       ├── dossiers/  # Dossier building
│   │   │       └── classify/  # AI classification
│   │   ├── auth/signin/       # Sign-in page
│   │   ├── dashboard/         # Main dashboard
│   │   ├── mailautomation/    # Email workflow page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── mail/              # Mail feature components
│   │       ├── import-panel.tsx
│   │       ├── contacts-panel.tsx
│   │       ├── dossiers-panel.tsx
│   │       ├── category-manager.tsx
│   │       └── classification-panel.tsx
│   ├── hooks/                 # React Query hooks
│   │   └── use-mail-import.ts # All mail-related hooks
│   ├── lib/                   # Core business logic
│   │   ├── auth.ts            # NextAuth config + token refresh
│   │   ├── prisma.ts          # Prisma client singleton
│   │   ├── gmail.ts           # Gmail API integration
│   │   ├── dossier.ts         # Contact dossier builder
│   │   └── classifier.ts      # AI classification service
│   ├── providers/             # React context providers
│   └── types/                 # TypeScript definitions
└── scripts/
    └── clear-db.js            # Database cleanup utility
```

---

## Core Concepts

### 1. Human-in-the-Loop Architecture

Every AI decision requires human confirmation:

```
[AI Suggestion] → [Human Review] → [Human Approval] → [Action]
```

The AI outputs **plans and drafts only**. Execution is always triggered by deterministic backend code after explicit user consent.

### 2. Pipeline-Based Workflow

The mail automation feature follows a strict pipeline:

```
Step 1: Import Emails     → Fetch 90 days of Gmail messages
Step 2: Extract Contacts  → Normalize unique email addresses
Step 3: Build Dossiers    → Analyze patterns, keywords, signatures
Step 4: Classify          → AI categorizes with confidence scores
Step 5: Review & Override → User drag-and-drop reassignment
Step 6: Draft & Send      → (Planned) Generate and approve emails
```

### 3. Dossiers (Not Raw Data to LLM)

**Critical Pattern**: Never send raw inbox data to the LLM.

Instead, we build compact per-contact "dossiers" on the server:

```typescript
interface ContactDossier {
  email: string;
  domain: string;
  messageCount: number;
  lastSeenDaysAgo: number;
  snippets: string[];        // Opening lines of key emails
  signatureHints: string[];  // Job titles, companies from signatures
  topicKeywords: string[];   // RAKE-extracted keywords
}
```

This reduces token usage, improves classification accuracy, and maintains privacy.

---

## Data Flow

### Gmail Import Flow

```
User clicks "Import"
       ↓
POST /api/mail/import
       ↓
lib/gmail.ts::importGmailMessages()
       ↓
Gmail API (messages.list + messages.get)
       ↓
Parse headers, extract body text
       ↓
Upsert to EmailMessage table
       ↓
Extract unique addresses → Contact table
```

### Classification Flow

```
User clicks "Classify"
       ↓
POST /api/mail/classify
       ↓
lib/dossier.ts::buildAllDossiers()
       ↓
For each contact:
  - Select up to 25 emails
  - Extract snippets (opening lines)
  - Extract keywords (RAKE algorithm)
  - Extract signature hints (regex)
       ↓
lib/classifier.ts::classifyAllContacts()
       ↓
Batch dossiers (25 at a time)
       ↓
Claude API with structured prompt
       ↓
Parse JSON response
       ↓
Update Contact.group, confidence, rationale
```

---

## Key Features & Implementation

### 1. Gmail Integration (`lib/gmail.ts`)

- Uses Google OAuth with offline access for token refresh
- Fetches messages with `format=full` to get headers + body
- Rate-limited: 50 messages per page, 100ms delay between fetches
- Extracts plain text, falls back to HTML → text conversion
- Truncates body to 5000 chars

Key functions:
- `importGmailMessages(userId)` - Main import function
- `getImportStats(userId)` - Message/contact counts
- `deleteOldEmails(userId)` - 90-day retention cleanup

### 2. Dossier Builder (`lib/dossier.ts`)

Keyword extraction using RAKE algorithm:
```typescript
import rake from "rake-js";
const keywords = rake(combinedText);
```

Signature extraction using regex patterns:
```typescript
// Matches: "John Smith | VP of Engineering"
// Matches: job titles like CEO, Manager, Director
// Extracts from last 500 chars of email
```

Snippet extraction:
- Skips greetings ("Hi John,")
- Takes first 1-2 sentences
- Deduplicates across emails

### 3. AI Classifier (`lib/classifier.ts`)

Prompt structure:
```
System: You are a relationship classifier...
        Categories: relatives, friends, coworkers, ...

User:   Contact 1: jane@example.com
        - Domain: example.com
        - Keywords: project, deadline, quarterly
        - Snippets: "Attached the Q3 report..."

        Respond with JSON array...
```

Output parsing handles both raw JSON and markdown code blocks.

Custom categories supported — users can add "neighbors", "church_group", etc.

### 4. Drag-and-Drop UI (`components/mail/classification-panel.tsx`)

Uses native HTML5 drag-and-drop:
```tsx
<div
  draggable
  onDragStart={(e) => e.dataTransfer.setData("contactId", id)}
/>

<div
  onDragOver={(e) => e.preventDefault()}
  onDrop={(e) => {
    const contactId = e.dataTransfer.getData("contactId");
    handleMoveContact(contactId, newGroup);
  }}
/>
```

Manual overrides set `isOverridden: true` and won't be changed by re-classification.

---

## Database Schema

### User & Auth (NextAuth standard)
- `User` - Core user record
- `Account` - OAuth provider tokens (Google)
- `Session` - Session management

### Email Data
```prisma
model EmailMessage {
  id             String   @id
  userId         String
  gmailMessageId String   // Gmail's message ID
  threadId       String?
  date           DateTime
  fromEmail      String
  toEmails       String   // JSON array
  subject        String?
  bodyText       String?  // Truncated to 5k chars
}
```

### Contacts
```prisma
model Contact {
  id           String   @id
  userId       String
  primaryEmail String
  displayName  String?
  domain       String

  // Classification
  group        String?  // Category name
  confidence   Float?   // 0-1 from AI
  rationale    String?  // AI explanation
  isOverridden Boolean  // User manually set
}
```

---

## API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| `POST` | `/api/mail/import` | Import Gmail messages |
| `GET` | `/api/mail/import` | Get import stats |
| `GET` | `/api/mail/contacts` | List contacts |
| `GET` | `/api/mail/dossiers` | Build and return dossiers |
| `POST` | `/api/mail/classify` | Run AI classification |
| `GET` | `/api/mail/classify` | Get classification status |
| `PATCH` | `/api/mail/classify` | Override single contact |
| `DELETE` | `/api/mail/classify` | Reset all classifications |

All routes check `auth()` for session and user ID.

---

## Frontend Patterns

### React Query Hooks

All server state is managed through TanStack Query:

```typescript
// Fetching
const { data, isLoading } = useContacts();

// Mutations with cache invalidation
const { mutate, isPending } = useClassifyContacts();
mutate({ categories }, {
  onSuccess: () => {
    queryClient.invalidateQueries(["contacts"]);
  }
});
```

Hooks are centralized in `hooks/use-mail-import.ts`.

### Component Structure

Feature components follow this pattern:
```tsx
export function FeaturePanel() {
  // 1. Hooks at top
  const { data, isLoading } = useFeatureData();
  const { mutate, isPending } = useFeatureMutation();

  // 2. Loading state
  if (isLoading) return <Skeleton />;

  // 3. Empty state
  if (!data) return <EmptyState />;

  // 4. Main render
  return <div>...</div>;
}
```

### shadcn/ui Usage

Components are in `components/ui/`. Import like:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
```

Use `cn()` for conditional classes:
```tsx
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class")} />
```

---

## AI Integration

### Anthropic SDK Setup (`lib/anthropic.ts`)

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const response = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 4096,
  messages: [{ role: "user", content: prompt }],
});
```

### Classification Prompt Engineering

Key techniques:
1. **Structured output**: Request JSON array, not prose
2. **Confidence scores**: 0-1 scale for UI color coding
3. **Rationale**: 1-2 sentence explanation for user review
4. **Conservative default**: "other" category when uncertain

---

## Development Workflow

### Setup

```bash
cd app
npm install
cp .env.example .env  # Fill in values
npx prisma migrate dev
npm run dev
```

### Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret"
ANTHROPIC_API_KEY="sk-ant-..."
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="xxx"
```

### Common Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npx prisma studio        # Database GUI
npx prisma migrate dev   # Create migration
node scripts/clear-db.js # Clear EmailMessage & Contact tables
```

### Adding a New Feature

1. **Schema**: Add models to `prisma/schema.prisma`
2. **Migrate**: `npx prisma migrate dev --name feature-name`
3. **Service**: Create `lib/feature.ts` with business logic
4. **API**: Add route in `app/api/feature/route.ts`
5. **Hook**: Add to `hooks/use-feature.ts`
6. **UI**: Create `components/feature/panel.tsx`
7. **Page**: Import component into page

### Code Conventions

- **No silent automation**: Always show what's happening
- **Confidence indicators**: Show AI certainty levels
- **Manual override**: Users can always change AI decisions
- **Audit trail**: Keep rationale for all classifications
- **Graceful degradation**: Handle API failures cleanly


---

## Questions?

Check `CLAUDE.md` for the core design philosophy and safety rules.
Check `app/src/app/mailautomation/CLAUDE.md` for detailed email workflow specs.
