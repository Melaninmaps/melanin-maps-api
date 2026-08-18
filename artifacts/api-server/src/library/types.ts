import type { ResearchDomain, SourceTier } from "./researchPolicy";

export type KnowledgeSource = {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  excerpt: string;
  sourceTier: SourceTier;
  publishedAt: Date | null;
  retrievedAt: Date;
};

export type LibraryTopic = {
  id: string;
  slug: string;
  title: string;
  domain: ResearchDomain;
  communityLens: string;
  locationLabel: string | null;
  isFollowed: boolean;
  entryCount: number;
  newestEntryAt: Date | null;
};

export type LibraryEntry = {
  id: string;
  topicId: string;
  question: string;
  normalizedQuestion: string;
  title: string;
  summary: string;
  body: string;
  domain: ResearchDomain;
  communityLens: string;
  locationLabel: string | null;
  disclaimer: string | null;
  sourceCount: number;
  sources: KnowledgeSource[];
  createdAt: Date;
  refreshedAt: Date;
};

export type ResearchDocument = {
  url: string;
  title: string;
  content: string;
  publisher: string | null;
  publishedAt: Date | null;
};

export interface LibraryRepository {
  findReusableEntry(input: {
    normalizedQuestion: string;
    domain: ResearchDomain;
    communityLens: string;
    locationLabel: string | null;
    currentAfter: Date;
  }): Promise<LibraryEntry | null>;
  saveEntry(
    input: Omit<LibraryEntry, "id" | "topicId" | "createdAt" | "refreshedAt"> & { topicSlug: string },
  ): Promise<LibraryEntry>;
  listTopics(input: {
    search: string | null;
    domain: ResearchDomain | null;
    memberId: string | null;
  }): Promise<LibraryTopic[]>;
  findTopicBySlug(slug: string): Promise<LibraryTopic | null>;
  listTopicEntries(input: { topicId: string; limit: number; cursor: string | null }): Promise<LibraryEntry[]>;
  setTopicFollow(input: { topicId: string; memberId: string; following: boolean }): Promise<void>;
}

export interface ExternalResearchProvider {
  search(input: {
    query: string;
    allowedDomains: string[];
    maxResults: number;
  }): Promise<ResearchDocument[]>;
}

export interface LibrarySynthesisWriter {
  writeStructured(input: {
    question: string;
    domain: ResearchDomain;
    communityLens: string;
    locationLabel: string | null;
    disclaimer: string | null;
    sources: Array<Pick<ResearchDocument, "url" | "title" | "content" | "publisher" | "publishedAt">>;
  }): Promise<{
    title: string;
    summary: string;
    body: string;
    citedSourceIndexes: number[];
  }>;
}
