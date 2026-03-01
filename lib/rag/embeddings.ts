import rake from "rake-js";
import type { PrismaClient } from "../generated/prisma/client";
import type { Chunk } from "./types";

const TARGET_TOKENS = 500;
const CHARS_PER_TOKEN = 4; // rough approximation
const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN;

/**
 * Split text into chunks by section headers (lines starting with #).
 * Chunks that exceed ~500 tokens get split further at paragraph boundaries.
 */
export function chunkBySection(text: string, sourceFile: string): Chunk[] {
  const lines = text.split("\n");
  const sections: { title: string | null; lines: string[] }[] = [];
  let current: { title: string | null; lines: string[] } = {
    title: null,
    lines: [],
  };

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,6}\s+(.+)/);
    if (headerMatch) {
      if (current.lines.length > 0) {
        sections.push(current);
      }
      current = { title: headerMatch[1].trim(), lines: [] };
    } else {
      current.lines.push(line);
    }
  }
  if (current.lines.length > 0) {
    sections.push(current);
  }

  const chunks: Chunk[] = [];

  for (const section of sections) {
    const sectionText = section.lines.join("\n").trim();
    if (!sectionText) continue;

    const subTexts = splitToTargetSize(sectionText);

    for (const sub of subTexts) {
      const tokenCount = Math.ceil(sub.length / CHARS_PER_TOKEN);
      const keywords = extractKeywords(sub);
      chunks.push({
        sourceFile,
        sectionTitle: section.title,
        content: sub,
        tokenCount,
        keywords,
      });
    }
  }

  return chunks;
}

/**
 * Split text into pieces of roughly TARGET_CHARS at paragraph boundaries.
 */
function splitToTargetSize(text: string): string[] {
  if (text.length <= TARGET_CHARS) return [text];

  const paragraphs = text.split(/\n\s*\n/);
  const pieces: string[] = [];
  let buffer = "";

  for (const para of paragraphs) {
    if (buffer.length + para.length > TARGET_CHARS && buffer.length > 0) {
      pieces.push(buffer.trim());
      buffer = "";
    }
    buffer += (buffer ? "\n\n" : "") + para;
  }
  if (buffer.trim()) {
    pieces.push(buffer.trim());
  }

  return pieces;
}

/**
 * Extract keywords from text using RAKE algorithm.
 */
export function extractKeywords(text: string): string[] {
  const keywords = rake(text) as string[];
  // rake-js returns keywords sorted by score descending; take top 20
  return keywords.slice(0, 20).map((k) => k.toLowerCase());
}

/**
 * Chunk a document and store all chunks in the database.
 * Returns the number of chunks created.
 */
export async function ingestDocument(
  prisma: PrismaClient,
  sourceFile: string,
  text: string,
  metadata?: Record<string, unknown>,
): Promise<number> {
  const chunks = chunkBySection(text, sourceFile);

  // Delete existing chunks for this source file to allow re-ingestion
  await prisma.documentChunk.deleteMany({
    where: { source_file: sourceFile },
  });

  const records = chunks.map((chunk) => ({
    source_file: chunk.sourceFile,
    section_title: chunk.sectionTitle,
    content: chunk.content,
    embedding: JSON.stringify(chunk.keywords),
    token_count: chunk.tokenCount,
    metadata: metadata ? JSON.stringify(metadata) : null,
  }));

  await prisma.documentChunk.createMany({ data: records });

  return chunks.length;
}
