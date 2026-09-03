import type { ResearchDomain, SourceTier } from "./researchPolicy";

export type ResearchProviderName = "internal" | "openai" | "tavily" | "none";
export type ResearchProviderStatus = "available" | "degraded";
export type LibraryPublicationStatus = "published" | "pending";

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
  relatedQuestions: string[];
  publicationStatus: LibraryPublicationStatus;
  provider: ResearchProviderName;
  createdAt: Date;
  refreshedAt: Date;
};

export type LibraryTopicSearchResult = {
  kind: "topic";
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconKey: string | null;
  entryCount: number;
};

export type LibraryEntrySearchResult = {
  kind: "entry";
  id: string;
  title: string;
  summary: string;
  body: string;
  topicSlug: string;
  topicTitle: string;
  sourceCount: number;
  sources: Array<Pick<KnowledgeSource, "url" | "title" | "publisher">>;
  refreshedAt: Date;
};

export type LibrarySearchResult = LibraryTopicSearchResult | LibraryEntrySearchResult;

export type LibrarySearchPage = {
  results: LibrarySearchResult[];
  total: number;
};

export type ResearchDocument = {
  url: string;
  title: string;
  content: string;
  publisher: string | null;
  publishedAt: Date | null;
};

export type ResearchProviderResult = {
  documents: ResearchDocument[];
  provider: Exclude<ResearchProviderName, "internal" | "none">;
  status: ResearchProviderStatus;
};

export type SaveLibraryEntryInput = Omit<
  LibraryEntry,
  "id" | "topicId" | "createdAt" | "refreshedAt" | "publicationStatus"
> & { topicSlug: string };

export interface LibraryRepository {
  findReusableEntry(input: {
    normalizedQuestion: string;
    domain: ResearchDomain;
    communityLens: string;
    locationLabel: string | null;
    currentAfter: Date;
  }): Promise<LibraryEntry | null>;
  saveEntry(input: SaveLibraryEntryInput): Promise<LibraryEntry>;
  recordCoverageSignal(input: {
    queryFingerprint: string;
    domain: ResearchDomain;
    topicSlug: string;
    internalResultCount: number;
    usedLiveResearch: boolean;
    outcome: "internal" | "researched" | "insufficient" | "provider_unavailable";
  }): Promise<void>;
  listTopics(input: {
    search: string | null;
    domain: ResearchDomain | null;
    memberId: string | null;
  }): Promise<LibraryTopic[]>;
  searchPublishedContent(input: {
    normalizedQuery: string;
    searchTerms: string[];
    patterns: string[];
    preferredTopicSlugs: string[];
    limit: number;
    offset: number;
  }): Promise<LibrarySearchPage>;
  findTopicBySlug(slug: string): Promise<LibraryTopic | null>;
  listTopicEntries(input: { topicId: string; limit: number; cursor: string | null }): Promise<LibraryEntry[]>;
  setTopicFollow(input: { topicId: string; memberId: string; following: boolean }): Promise<void>;
}

export interface ExternalResearchProvider {
  readonly name: ResearchProviderName;
  search(input: {
    query: string;
    allowedDomains: string[];
    maxResults: number;
  }): Promise<ResearchProviderResult>;
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
    relatedQuestions: string[];
  }>;
}
