import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "./retriever";
import {
  checklistSystemPrompt,
  checklistUserPrompt,
  documentAssistantSystemPrompt,
  documentAssistantUserPrompt,
} from "./prompts";
import type { DeceasedProfileInput } from "./types";

const dbPath =
  process.env.DATABASE_URL?.replace("file:", "").replace("file://", "") ??
  "./prisma/dev.db";

const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });
const anthropic = new Anthropic();

interface ChecklistItemFromAI {
  title: string;
  description: string;
  category: string;
  priority: string;
}

function divider(label: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${label}`);
  console.log(`${"=".repeat(60)}\n`);
}

async function run() {
  // ------------------------------------------------------------------
  // Step 1: Create a sample DeceasedProfile
  // ------------------------------------------------------------------
  divider("STEP 1: Creating deceased profile");

  const profile = await prisma.deceasedProfile.create({
    data: {
      full_name: "Robert J. Martinez",
      date_of_death: new Date("2026-02-15"),
      state: "Illinois",
      marital_status: "married",
      has_children: true,
      has_property: true,
      has_retirement_accounts: true,
      has_life_insurance: false,
      additional_info:
        "Owned a single-family home in Cook County. Had a 401(k) through his employer and a traditional IRA. Two adult children.",
    },
  });

  console.log("Profile created:");
  console.log(`  ID:       ${profile.id}`);
  console.log(`  Name:     ${profile.full_name}`);
  console.log(`  State:    ${profile.state}`);
  console.log(`  Married:  ${profile.marital_status}`);
  console.log(`  Property: ${profile.has_property}`);
  console.log(`  Retirement accounts: ${profile.has_retirement_accounts}`);
  console.log(`  Life insurance: ${profile.has_life_insurance}`);
  console.log(`  Children: ${profile.has_children}`);
  console.log(`  Info:     ${profile.additional_info}`);

  // ------------------------------------------------------------------
  // Step 2: Generate a personalized checklist
  // ------------------------------------------------------------------
  divider("STEP 2: Generating checklist (calling Claude...)");

  const profileInput: DeceasedProfileInput = {
    fullName: profile.full_name,
    dateOfDeath: profile.date_of_death,
    state: profile.state,
    maritalStatus: profile.marital_status,
    hasChildren: profile.has_children,
    hasProperty: profile.has_property,
    hasRetirementAccounts: profile.has_retirement_accounts,
    hasLifeInsurance: profile.has_life_insurance,
    additionalInfo: profile.additional_info ?? undefined,
  };

  // Retrieve relevant context from the knowledge base
  const contextQuery = `after death checklist ${profile.state} ${profile.marital_status} ${profile.has_property ? "property probate" : ""} ${profile.has_retirement_accounts ? "retirement accounts 401k IRA" : ""}`;
  const contextChunks = await retrieve(prisma, contextQuery);

  console.log(
    `Retrieved ${contextChunks.length} context chunks for checklist generation:`,
  );
  for (const c of contextChunks) {
    console.log(
      `  - ${c.chunk.sourceFile} / ${c.chunk.sectionTitle ?? "(no section)"} (score: ${c.score.toFixed(2)})`,
    );
  }

  let userPrompt = checklistUserPrompt(profileInput);
  if (contextChunks.length > 0) {
    const contextBlock = contextChunks
      .map((r, i) => {
        const source = r.chunk.sectionTitle
          ? `${r.chunk.sourceFile} — ${r.chunk.sectionTitle}`
          : r.chunk.sourceFile;
        return `--- Reference ${i + 1} (${source}) ---\n${r.chunk.content}`;
      })
      .join("\n\n");
    userPrompt += `\n\nHere is relevant legal reference material to inform your checklist:\n\n${contextBlock}`;
  }

  const checklistResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: checklistSystemPrompt(),
    messages: [{ role: "user", content: userPrompt }],
  });

  const checklistText = checklistResponse.content.find(
    (b) => b.type === "text",
  );
  if (!checklistText || checklistText.type !== "text") {
    throw new Error("No text response from Claude for checklist");
  }

  // Parse JSON — handle markdown fences
  let rawJson = checklistText.text.trim();
  const fenceMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    rawJson = fenceMatch[1].trim();
  }

  const items: ChecklistItemFromAI[] = JSON.parse(rawJson);
  if (!Array.isArray(items)) {
    throw new Error(`Expected JSON array, got: ${typeof items}`);
  }

  // Save to DB
  const validCategories = new Set([
    "probate",
    "financial",
    "government",
    "insurance",
    "personal",
    "legal",
  ]);
  const validPriorities = new Set(["high", "medium", "low"]);

  const saved = await Promise.all(
    items.map((item) =>
      prisma.checklistItem.create({
        data: {
          deceased_profile_id: profile.id,
          title: item.title,
          description: item.description ?? null,
          category: validCategories.has(item.category)
            ? item.category
            : "legal",
          priority: validPriorities.has(item.priority)
            ? item.priority
            : "medium",
          status: "pending",
        },
      }),
    ),
  );

  console.log(`\nGenerated ${saved.length} checklist items:\n`);
  for (const item of saved) {
    const marker =
      item.priority === "high"
        ? "[!!!]"
        : item.priority === "medium"
          ? "[ ! ]"
          : "[ . ]";
    console.log(`  ${marker} ${item.title}`);
    console.log(`        Category: ${item.category} | Priority: ${item.priority}`);
    if (item.description) {
      console.log(`        ${item.description}`);
    }
    console.log();
  }

  // ------------------------------------------------------------------
  // Step 3: Query for help on the first checklist item
  // ------------------------------------------------------------------
  divider("STEP 3: Querying for detailed help on first checklist item");

  const firstItem = saved[0];
  const question = `How do I complete this task: "${firstItem.title}"? ${firstItem.description ?? ""} Please give me step-by-step instructions specific to Illinois.`;

  console.log(`Question: ${question}\n`);

  const queryChunks = await retrieve(prisma, question);

  console.log(`Retrieved ${queryChunks.length} chunks for query:`);
  for (const c of queryChunks) {
    console.log(
      `  - ${c.chunk.sourceFile} / ${c.chunk.sectionTitle ?? "(no section)"} (score: ${c.score.toFixed(2)})`,
    );
  }

  const profileContext = [
    `Deceased: ${profile.full_name}`,
    `State: ${profile.state}`,
    `Marital status: ${profile.marital_status}`,
    `Has children: ${profile.has_children ? "yes" : "no"}`,
    `Has property: ${profile.has_property ? "yes" : "no"}`,
    `Has retirement accounts: ${profile.has_retirement_accounts ? "yes" : "no"}`,
    `Has life insurance: ${profile.has_life_insurance ? "yes" : "no"}`,
    profile.additional_info
      ? `Additional info: ${profile.additional_info}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const fullQuestion = `Profile of the deceased:\n${profileContext}\n\nQuestion: ${question}`;
  const queryUserPrompt = documentAssistantUserPrompt(fullQuestion, queryChunks);

  const queryResponse = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: documentAssistantSystemPrompt(),
    messages: [{ role: "user", content: queryUserPrompt }],
  });

  const queryText = queryResponse.content.find((b) => b.type === "text");
  if (!queryText || queryText.type !== "text") {
    throw new Error("No text response from Claude for query");
  }

  console.log(`\nClaude's response:\n`);
  console.log(queryText.text);

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  divider("DONE");
  console.log(`Profile ID:       ${profile.id}`);
  console.log(`Checklist items:  ${saved.length}`);
  console.log(`First item:       "${firstItem.title}"`);
  console.log(`Query chunks:     ${queryChunks.length}`);
  console.log(`\nPipeline completed successfully.`);
}

run()
  .catch((err) => {
    console.error("\nTest flow failed:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
