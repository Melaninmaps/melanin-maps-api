export type LibraryResearchPath = {
  id: string;
  title: string;
  question: string;
};

export type LibraryResearchCollection = {
  slug: string;
  title: string;
  summary: string;
  iconKey: string;
  mobileIcon: string;
  defaultQuestion: string;
  paths: LibraryResearchPath[];
};

export type LibraryResearchPathManifest = {
  collections: LibraryResearchCollection[];
};

function isResearchCollection(value: unknown): value is LibraryResearchCollection {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LibraryResearchCollection>;
  return typeof candidate.slug === "string"
    && typeof candidate.title === "string"
    && typeof candidate.summary === "string"
    && typeof candidate.iconKey === "string"
    && typeof candidate.mobileIcon === "string"
    && typeof candidate.defaultQuestion === "string"
    && Array.isArray(candidate.paths)
    && candidate.paths.every((path) => Boolean(path)
      && typeof path.id === "string"
      && typeof path.title === "string"
      && typeof path.question === "string");
}

/** Mobile consumes the same canonical server manifest as web. */
export async function loadLibraryResearchPathManifest(
  apiBase: string,
  signal?: AbortSignal,
): Promise<LibraryResearchPathManifest> {
  const response = await fetch(`${apiBase}/api/library/research-paths`, {
    headers: { Accept: "application/json" },
    signal,
  });
  if (!response.ok) throw new Error("LIBRARY_RESEARCH_PATHS_UNAVAILABLE");
  const body = await response.json() as Partial<LibraryResearchPathManifest>;
  if (!Array.isArray(body.collections) || !body.collections.every(isResearchCollection)) {
    throw new Error("LIBRARY_RESEARCH_PATHS_INVALID");
  }
  return { collections: body.collections };
}

/**
 * A collection or subject carries an intentional, prefilled question into the
 * approved-first route. It never starts fresh provider research by navigation.
 */
export function libraryCollectionResearchParams(question: string): {
  question: string;
} {
  return { question: question.normalize("NFKC").trim() };
}
