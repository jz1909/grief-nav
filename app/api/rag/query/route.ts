import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../prisma";
import { retrieve } from "@/lib/rag/retriever";
import {
  documentAssistantSystemPrompt,
  documentAssistantUserPrompt,
} from "@/lib/rag/prompts";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { question, deceased_profile_id } = body as {
      question?: string;
      deceased_profile_id?: string;
    };

    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "question is required" },
        { status: 400 },
      );
    }

    if (!deceased_profile_id || typeof deceased_profile_id !== "string") {
      return NextResponse.json(
        { error: "deceased_profile_id is required" },
        { status: 400 },
      );
    }

    // Load the profile for context
    const profile = await prisma.deceasedProfile.findUnique({
      where: { id: deceased_profile_id },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Deceased profile not found" },
        { status: 404 },
      );
    }

    // Retrieve relevant document chunks
    const chunks = await retrieve(prisma, question);

    // Build profile context to prepend to the user message
    const profileContext = [
      `Deceased: ${profile.full_name}`,
      `State: ${profile.state}`,
      `Marital status: ${profile.marital_status}`,
      `Has children: ${profile.has_children ? "yes" : "no"}`,
      `Has property: ${profile.has_property ? "yes" : "no"}`,
      `Has retirement accounts: ${profile.has_retirement_accounts ? "yes" : "no"}`,
      `Has life insurance: ${profile.has_life_insurance ? "yes" : "no"}`,
      profile.additional_info ? `Additional info: ${profile.additional_info}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const fullQuestion = `Profile of the deceased:\n${profileContext}\n\nQuestion: ${question}`;
    const userPrompt = documentAssistantUserPrompt(fullQuestion, chunks);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: documentAssistantSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      answer: textBlock.text,
      sources: chunks.map((r) => ({
        source_file: r.chunk.sourceFile,
        section_title: r.chunk.sectionTitle,
        score: r.score,
        matched_keywords: r.matchedKeywords,
      })),
      profile_id: deceased_profile_id,
    });
  } catch (error) {
    console.error("Query error:", error);
    return NextResponse.json(
      { error: "Failed to process query" },
      { status: 500 },
    );
  }
}
