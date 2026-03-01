# RAG — Legal Document Automation

## What this does

This module handles the RAG (retrieval-augmented generation) pipeline for automating post-death legal and administrative documents. When someone dies, their family faces dozens of bureaucratic tasks — closing accounts, filing claims, notifying agencies. This system:

1. Ingests legal document templates + regulatory guidance as a knowledge base
2. Takes in the deceased's circumstances (state, assets, family structure, etc.)
3. Generates a personalized checklist of required tasks
4. Walks users through filling out each document with pre-populated info

## Architecture

```
src/app/api/rag/
├── CLAUDE.md          ← you are here
├── ingest/            ← document ingestion + chunking
│   └── route.ts
├── query/             ← retrieval + generation endpoint
│   └── route.ts
├── checklist/         ← personalized task list generation
│   └── route.ts
└── documents/         ← document auto-fill / form generation
    └── route.ts

lib/
├── rag/               ← core RAG logic (shared, not in api/)
│   ├── embeddings.ts  ← text chunking + embedding
│   ├── retriever.ts   ← similarity search over knowledge base
│   ├── prompts.ts     ← system prompts for legal doc generation
│   └── types.ts       ← shared types for RAG pipeline
```

## Key decisions

- Embeddings stored in SQLite via Prisma (keep it simple for hackathon — no Pinecone/Weaviate)
- Chunking strategy: split legal docs by section headers, ~500 token chunks
- Claude handles generation — send retrieved chunks as context in the system prompt
- rake-js extracts keywords from user input to improve retrieval
- All state-specific logic (probate rules, filing deadlines) comes from the knowledge base, NOT hardcoded

## Working with this code

- Don't modify files outside `src/app/api/rag/` and `lib/rag/` without checking with the team
- Prisma schema changes need team coordination — ping in chat before running `prisma db push`
- API routes follow Next.js App Router conventions: `export async function POST(req: Request)`
- Keep types in `lib/rag/types.ts` so the frontend team can import them
