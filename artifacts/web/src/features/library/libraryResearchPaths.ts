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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

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

export async function loadLibraryResearchPathManifest(
  signal?: AbortSignal,
): Promise<LibraryResearchPathManifest> {
  const response = await fetch(`${BASE}/api/library/research-paths`, {
    credentials: "include",
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

export function governedLibraryResearchHref(question: string): string {
  return `/library/search?q=${encodeURIComponent(question.trim())}&research=true`;
}
