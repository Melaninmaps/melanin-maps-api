import type { KinfolkTaskMode } from "./semantic-turn-planner";
import { canonicalizeContextualUrl } from "./contextual-url";

export type KinfolkStructuredContent =
  | { kind: "recipe_options"; options: Array<{ title: string; description: string; keyIngredients: string[]; timeLabel: string | null }> }
  | { kind: "recipe_instructions"; title: string; ingredients: string[]; steps: string[]; foodSafety: string[] }
  | { kind: "cultural_consensus"; subject: string; conclusion: string; criteria: string[]; evidenceFor: string[]; otherDefensibleViews: string[]; asOf: string | null }
  | { kind: "ranked_perspectives"; criteria: string[]; entries: Array<{ name: string; reason: string; evidenceSummary: string }> }
  | { kind: "entity_explorer"; canonicalName: string; overview: string; pathways: Array<{ label: string; description: string; libraryHref: string | null }> };
export type KinfolkMediaLink = { title: string; creator: string | null; platform: string; url: string; reason: string };
export type KinfolkRelatedConnection = { title: string; relationship: string; reason: string; href: string | null; evidenceUrl: string | null };

const text = (value: unknown, max = 300): string => typeof value === "string" ? value.trim().slice(0, max) : "";
const strings = (value: unknown, max = 8, length = 180): string[] => Array.isArray(value)
  ? value.map((entry) => text(entry, length)).filter(Boolean).slice(0, max)
  : [];
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value)
  ? value as Record<string, unknown>
  : null;

export const isSafeContextualUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || value.length > 2048) return false;
  try { return new URL(value).protocol === "https:"; } catch { return false; }
};
const externalUrl = (value: unknown): string | null => isSafeContextualUrl(value) ? value : null;
const libraryPath = (value: unknown): string | null => typeof value === "string"
  && value.length <= 512
  && /^\/library\/topics\/[A-Za-z0-9._~%-]+(?:#[A-Za-z0-9._~%-]+)?$/.test(value)
  ? value
  : null;

/** Strictly parses only additive presentation data; callers retain their existing reply fallback. */
export function parseKinfolkStructuredContent(value: unknown): KinfolkStructuredContent | null {
  const item = record(value);
  if (!item) return null;

  if (item.kind === "recipe_options") {
    const options = Array.isArray(item.options) ? item.options.slice(0, 6).flatMap((entry) => {
      const option = record(entry);
      if (!option) return [];
      const title = text(option.title, 120);
      const description = text(option.description);
      return title && description ? [{ title, description, keyIngredients: strings(option.keyIngredients, 12), timeLabel: text(option.timeLabel, 80) || null }] : [];
    }) : [];
    return options.length ? { kind: "recipe_options", options } : null;
  }

  if (item.kind === "recipe_instructions") {
    const title = text(item.title, 140);
    const steps = strings(item.steps, 12);
    return title && steps.length ? { kind: item.kind, title, ingredients: strings(item.ingredients, 24), steps, foodSafety: strings(item.foodSafety, 6) } : null;
  }

  if (item.kind === "cultural_consensus") {
    const subject = text(item.subject, 140);
    const conclusion = text(item.conclusion);
    return subject && conclusion ? { kind: item.kind, subject, conclusion, criteria: strings(item.criteria), evidenceFor: strings(item.evidenceFor), otherDefensibleViews: strings(item.otherDefensibleViews), asOf: text(item.asOf, 60) || null } : null;
  }

  if (item.kind === "ranked_perspectives") {
    const entries = Array.isArray(item.entries) ? item.entries.slice(0, 10).flatMap((entry) => {
      const perspective = record(entry);
      if (!perspective) return [];
      const name = text(perspective.name, 140);
      const reason = text(perspective.reason);
      return name && reason ? [{ name, reason, evidenceSummary: text(perspective.evidenceSummary) }] : [];
    }) : [];
    return entries.length ? { kind: item.kind, criteria: strings(item.criteria), entries } : null;
  }

  if (item.kind === "entity_explorer") {
    const canonicalName = text(item.canonicalName, 140);
    const overview = text(item.overview);
    const pathways = Array.isArray(item.pathways) ? item.pathways.slice(0, 8).flatMap((entry) => {
      const pathway = record(entry);
      if (!pathway) return [];
      const label = text(pathway.label, 100);
      const description = text(pathway.description);
      return label && description ? [{ label, description, libraryHref: libraryPath(pathway.libraryHref) }] : [];
    }) : [];
    return canonicalName && overview ? { kind: item.kind, canonicalName, overview, pathways } : null;
  }

  return null;
}

export function parseKinfolkMediaLinks(value: unknown): KinfolkMediaLink[] {
  return Array.isArray(value) ? value.slice(0, 6).flatMap((entry) => {
    const item = record(entry);
    if (!item) return [];
    const title = text(item.title, 160);
    const platform = text(item.platform, 80);
    const url = externalUrl(item.url);
    const reason = text(item.reason);
    return title && platform && url && reason ? [{ title, creator: text(item.creator, 120) || null, platform, url, reason }] : [];
  }) : [];
}

export function parseKinfolkRelatedConnections(value: unknown): KinfolkRelatedConnection[] {
  return Array.isArray(value) ? value.slice(0, 8).flatMap((entry) => {
    const item = record(entry);
    if (!item) return [];
    const title = text(item.title, 160);
    const relationship = text(item.relationship, 120);
    const reason = text(item.reason);
    return title && relationship && reason ? [{
      title,
      relationship,
      reason,
      href: libraryPath(item.href),
      evidenceUrl: externalUrl(item.evidenceUrl),
    }] : [];
  }) : [];
}

function bindStructuredLibraryPaths(
  structuredContent: KinfolkStructuredContent | null,
  permittedLibraryPaths: ReadonlySet<string>,
): KinfolkStructuredContent | null {
  if (structuredContent?.kind !== "entity_explorer") return structuredContent;
  return {
    ...structuredContent,
    pathways: structuredContent.pathways.map((pathway) => ({
      ...pathway,
      libraryHref: pathway.libraryHref && permittedLibraryPaths.has(pathway.libraryHref) ? pathway.libraryHref : null,
    })),
  };
}

/** Final response-boundary binding for every model-proposed destination. */
export function bindContextualLinksToEvidence(input: {
  structuredContent?: KinfolkStructuredContent | null;
  mediaLinks: readonly KinfolkMediaLink[];
  relatedConnections: readonly KinfolkRelatedConnection[];
  evidenceUrls: readonly string[];
  mediaEvidence?: ReadonlyArray<{ url: string; title: string; publisher: string | null; supports?: readonly string[] }>;
  libraryPaths?: readonly string[];
}): {
  structuredContent: KinfolkStructuredContent | null;
  mediaLinks: KinfolkMediaLink[];
  relatedConnections: KinfolkRelatedConnection[];
} {
  const permittedEvidence = new Set(input.evidenceUrls.map(canonicalizeContextualUrl).filter((value): value is string => Boolean(value)));
  const permittedMedia = new Map((input.mediaEvidence ?? []).flatMap((item) => {
    const canonical = canonicalizeContextualUrl(item.url);
    return canonical ? [[canonical, item] as const] : [];
  }));
  const permittedLibraryPaths = new Set((input.libraryPaths ?? []).map(libraryPath).filter((value): value is string => Boolean(value)));
  return {
    structuredContent: bindStructuredLibraryPaths(input.structuredContent ?? null, permittedLibraryPaths),
    mediaLinks: input.mediaLinks.flatMap((link) => {
      const canonical = canonicalizeContextualUrl(link.url);
      const evidence = canonical ? permittedMedia.get(canonical) : null;
      if (!canonical || !evidence) return [];
      return [{
        ...link,
        title: text(evidence.title, 160) || link.title,
        creator: text(evidence.publisher, 120) || null,
        platform: new URL(canonical).hostname.replace(/^www\./, ""),
        url: canonical,
        reason: text(evidence.supports?.[0], 300) || link.reason,
      }];
    }),
    relatedConnections: input.relatedConnections.flatMap((connection) => {
      const evidenceUrl = connection.evidenceUrl ? canonicalizeContextualUrl(connection.evidenceUrl) : null;
      if (!evidenceUrl || !permittedEvidence.has(evidenceUrl)) return [];
      const href = connection.href && permittedLibraryPaths.has(connection.href) ? connection.href : null;
      return [{ ...connection, href, evidenceUrl }];
    }),
  };
}

export type KinfolkContextualAdditions = {
  answerMode?: KinfolkTaskMode;
  structuredContent?: KinfolkStructuredContent | null;
  mediaLinks?: KinfolkMediaLink[];
  relatedConnections?: KinfolkRelatedConnection[];
  researchStatus?: { usedInternal: boolean; usedLiveWeb: boolean; degraded: boolean; asOf: string };
};
export const validateKinfolkStructuredContent = parseKinfolkStructuredContent;
