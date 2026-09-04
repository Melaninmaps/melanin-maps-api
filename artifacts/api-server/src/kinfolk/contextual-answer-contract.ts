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
const text = (x: unknown, n = 300) => typeof x === "string" ? x.trim().slice(0, n) : "";
const strings = (x: unknown, max = 8, n = 180) => Array.isArray(x) ? x.map(v => text(v, n)).filter(Boolean).slice(0, max) : [];
export const isSafeContextualUrl = (x: unknown): x is string => {
  if (typeof x !== "string" || x.length > 2048) return false;
  try { return new URL(x).protocol === "https:"; } catch { return false; }
};
const url = (x: unknown) => isSafeContextualUrl(x) ? x : null;

/** Strictly parses only additive presentation data; callers retain their existing reply fallback. */
export function parseKinfolkStructuredContent(value: unknown): KinfolkStructuredContent | null {
  if (!value || typeof value !== "object") return null;
  const x = value as Record<string, unknown>;
  if (x.kind === "recipe_options") {
    const options = Array.isArray(x.options) ? x.options.slice(0, 6).map(o => {
      const y = o as Record<string, unknown>; return { title: text(y.title, 120), description: text(y.description), keyIngredients: strings(y.keyIngredients, 12), timeLabel: text(y.timeLabel, 80) || null };
    }).filter(o => o.title && o.description) : [];
    return options.length ? { kind: "recipe_options", options } : null;
  }
  if (x.kind === "recipe_instructions") { const title = text(x.title, 140); const steps = strings(x.steps, 12); return title && steps.length ? { kind: x.kind, title, ingredients: strings(x.ingredients, 24), steps, foodSafety: strings(x.foodSafety, 6) } : null; }
  if (x.kind === "cultural_consensus") { const subject = text(x.subject, 140), conclusion = text(x.conclusion); return subject && conclusion ? { kind: x.kind, subject, conclusion, criteria: strings(x.criteria), evidenceFor: strings(x.evidenceFor), otherDefensibleViews: strings(x.otherDefensibleViews), asOf: text(x.asOf, 60) || null } : null; }
  if (x.kind === "ranked_perspectives") { const entries = Array.isArray(x.entries) ? x.entries.slice(0, 10).map(v => { const y=v as Record<string,unknown>; return { name:text(y.name,140),reason:text(y.reason),evidenceSummary:text(y.evidenceSummary) }; }).filter(v=>v.name&&v.reason) : []; return entries.length ? {kind:x.kind,criteria:strings(x.criteria),entries} : null; }
  if (x.kind === "entity_explorer") { const canonicalName=text(x.canonicalName,140), overview=text(x.overview); const pathways=Array.isArray(x.pathways)?x.pathways.slice(0,8).map(v=>{const y=v as Record<string,unknown>;return {label:text(y.label,100),description:text(y.description),libraryHref:url(y.libraryHref)}}).filter(v=>v.label&&v.description):[]; return canonicalName&&overview?{kind:x.kind,canonicalName,overview,pathways}:null; }
  return null;
}
export function parseKinfolkMediaLinks(value: unknown): KinfolkMediaLink[] { return Array.isArray(value) ? value.slice(0, 6).map(v => { const x=v as Record<string,unknown>; return { title:text(x.title,160), creator:text(x.creator,120)||null, platform:text(x.platform,80), url:url(x.url), reason:text(x.reason) }; }).filter((v): v is KinfolkMediaLink => !!v.title && !!v.platform && !!v.url && !!v.reason) : []; }
export function parseKinfolkRelatedConnections(value: unknown): KinfolkRelatedConnection[] { return Array.isArray(value) ? value.slice(0, 8).map(v => { const x=v as Record<string,unknown>; return {title:text(x.title,160),relationship:text(x.relationship,120),reason:text(x.reason),href:url(x.href),evidenceUrl:url(x.evidenceUrl)}; }).filter(v=>v.title&&v.relationship&&v.reason) : []; }
/** Pure final-boundary check used to keep model-proposed links tied to retrieved evidence. */
export function bindContextualLinksToEvidence(input: {
  mediaLinks: readonly KinfolkMediaLink[];
  relatedConnections: readonly KinfolkRelatedConnection[];
  evidenceUrls: readonly string[];
}): {
  mediaLinks: KinfolkMediaLink[];
  relatedConnections: KinfolkRelatedConnection[];
} {
  const permitted = new Set(input.evidenceUrls.map(canonicalizeContextualUrl).filter((value): value is string => Boolean(value)));
  return {
    mediaLinks: input.mediaLinks.filter((link) => {
      const canonical = canonicalizeContextualUrl(link.url);
      return canonical !== null && permitted.has(canonical);
    }),
    relatedConnections: input.relatedConnections.filter(
      (connection) => {
        const canonical = connection.evidenceUrl ? canonicalizeContextualUrl(connection.evidenceUrl) : null;
        return canonical !== null && permitted.has(canonical);
      },
    ),
  };
}
export type KinfolkContextualAdditions = { answerMode?: KinfolkTaskMode; structuredContent?: KinfolkStructuredContent | null; mediaLinks?: KinfolkMediaLink[]; relatedConnections?: KinfolkRelatedConnection[]; researchStatus?: { usedInternal: boolean; usedLiveWeb: boolean; degraded: boolean; asOf: string } };
export const validateKinfolkStructuredContent = parseKinfolkStructuredContent;