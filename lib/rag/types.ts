export interface Chunk {
  sourceFile: string;
  sectionTitle: string | null;
  content: string;
  tokenCount: number;
  keywords: string[];
  metadata?: Record<string, unknown>;
}

export interface StoredChunk extends Chunk {
  id: string;
  createdAt: Date;
}

export interface RetrievalResult {
  chunk: StoredChunk;
  score: number;
  matchedKeywords: string[];
}

export interface QueryInput {
  query: string;
  topK?: number;
}

export interface DeceasedProfileInput {
  fullName: string;
  dateOfDeath: Date;
  state: string;
  maritalStatus: string;
  hasChildren: boolean;
  hasProperty: boolean;
  hasRetirementAccounts: boolean;
  hasLifeInsurance: boolean;
  additionalInfo?: string;
}
