import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../prisma";
import { ingestDocument } from "../../../../lib/rag/embeddings";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source_file, content } = body as {
      source_file?: string;
      content?: string;
    };

    if (!source_file || typeof source_file !== "string") {
      return NextResponse.json(
        { error: "source_file is required" },
        { status: 400 },
      );
    }

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 },
      );
    }

    const chunkCount = await ingestDocument(prisma, source_file, content);

    return NextResponse.json({
      success: true,
      source_file,
      chunks_created: chunkCount,
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return NextResponse.json(
      { error: "Failed to ingest document" },
      { status: 500 },
    );
  }
}
