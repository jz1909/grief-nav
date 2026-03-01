import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../prisma";
import { retrieve } from "../../../../../lib/rag/retriever";
import {
  checklistSystemPrompt,
  checklistUserPrompt,
} from "../../../../../lib/rag/prompts";
import type { DeceasedProfileInput } from "../../../../../lib/rag/types";

const anthropic = new Anthropic();

interface ChecklistItemFromAI {
  title: string;
  description: string;
  category: string;
  priority: string;
}

export async function GET(request: NextRequest) {
  try {
    const profileId = request.nextUrl.searchParams.get("profile_id");

    if (!profileId) {
      return NextResponse.json(
        { error: "profile_id query parameter is required" },
        { status: 400 },
      );
    }

    const items = await prisma.checklistItem.findMany({
      where: { deceased_profile_id: profileId },
      orderBy: { created_at: "asc" },
    });

    return NextResponse.json({ profile_id: profileId, checklist: items });
  } catch (error) {
    console.error("Checklist fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch checklist" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      full_name,
      date_of_death,
      state,
      marital_status,
      has_children,
      has_property,
      has_retirement_accounts,
      has_life_insurance,
      additional_info,
    } = body as Record<string, unknown>;

    if (!full_name || !date_of_death || !state || !marital_status) {
      return NextResponse.json(
        {
          error:
            "full_name, date_of_death, state, and marital_status are required",
        },
        { status: 400 },
      );
    }

    // Save the deceased profile
    const profile = await prisma.deceasedProfile.create({
      data: {
        full_name: full_name as string,
        date_of_death: new Date(date_of_death as string),
        state: state as string,
        marital_status: marital_status as string,
        has_children: Boolean(has_children),
        has_property: Boolean(has_property),
        has_retirement_accounts: Boolean(has_retirement_accounts),
        has_life_insurance: Boolean(has_life_insurance),
        additional_info: (additional_info as string) ?? null,
      },
    });

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

    // Retrieve relevant legal context to augment the prompt
    const contextQuery = `after death checklist ${profile.state} ${profile.marital_status} ${profile.has_property ? "property" : ""} ${profile.has_life_insurance ? "life insurance" : ""} probate`;
    const chunks = await retrieve(prisma, contextQuery);

    let userPrompt = checklistUserPrompt(profileInput);
    if (chunks.length > 0) {
      const contextBlock = chunks
        .map((r, i) => {
          const source = r.chunk.sectionTitle
            ? `${r.chunk.sourceFile} — ${r.chunk.sectionTitle}`
            : r.chunk.sourceFile;
          return `--- Reference ${i + 1} (${source}) ---\n${r.chunk.content}`;
        })
        .join("\n\n");
      userPrompt += `\n\nHere is relevant legal reference material to inform your checklist:\n\n${contextBlock}`;
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: checklistSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 },
      );
    }

    // Parse the JSON response — handle both raw JSON and markdown-fenced JSON
    let rawJson = textBlock.text.trim();
    const fenceMatch = rawJson.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      rawJson = fenceMatch[1].trim();
    }

    let items: ChecklistItemFromAI[];
    try {
      items = JSON.parse(rawJson);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: textBlock.text },
        { status: 502 },
      );
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: "AI response is not an array", raw: textBlock.text },
        { status: 502 },
      );
    }

    // Save checklist items to DB
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

    return NextResponse.json({
      profile_id: profile.id,
      checklist: saved,
    });
  } catch (error) {
    console.error("Checklist generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate checklist" },
      { status: 500 },
    );
  }
}
