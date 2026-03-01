import rake from "rake-js";
import type { PrismaClient } from "../generated/prisma/client";
import type { RetrievalResult, StoredChunk } from "./types";

const DEFAULT_TOP_K = 5;

/**
 * Score a chunk against query keywords.
 * Uses keyword overlap: counts how many query keywords appear in the chunk's
 * stored keywords or raw content (case-insensitive).
 */
function scoreChunk(
  chunkKeywords: string[],
  chunkContent: string,
  queryKeywords: string[],
): { score: number; matchedKeywords: string[] } {
  const contentLower = chunkContent.toLowerCase();
  const chunkKeywordSet = new Set(chunkKeywords);
  const matched: string[] = [];

  for (const qk of queryKeywords) {
    const qkLower = qk.toLowerCase();
    if (chunkKeywordSet.has(qkLower) || contentLower.includes(qkLower)) {
      matched.push(qk);
    }
  }

  const score =
    queryKeywords.length > 0 ? matched.length / queryKeywords.length : 0;
  return { score, matchedKeywords: matched };
}

/**
 * Retrieve the most relevant document chunks for a query.
 * Extracts keywords from the query with RAKE, then scores all chunks
 * by keyword overlap and returns the top K results.
 */
export async function retrieve(
  prisma: PrismaClient,
  query: string,
  topK: number = DEFAULT_TOP_K,
): Promise<RetrievalResult[]> {
  const queryKeywords = (rake(query) as string[])
    .slice(0, 15)
    .map((k) => k.toLowerCase());

  if (queryKeywords.length === 0) return [];

  // Find chunks whose content contains any query keyword
  const allChunks = await prisma.documentChunk.findMany({
    where: {
      OR: queryKeywords.map((kw) => ({
        content: { contains: kw },
      })),
    },
  });

  const scored: RetrievalResult[] = allChunks.map((row) => {
    const storedKeywords: string[] = JSON.parse(row.embedding);
    const { score, matchedKeywords } = scoreChunk(
      storedKeywords,
      row.content,
      queryKeywords,
    );

    const chunk: StoredChunk = {
      id: row.id,
      sourceFile: row.source_file,
      sectionTitle: row.section_title,
      content: row.content,
      tokenCount: row.token_count,
      keywords: storedKeywords,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: row.created_at,
    };

    return { chunk, score, matchedKeywords };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
