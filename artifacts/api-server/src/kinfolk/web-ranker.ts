/**
 * Kinfolk web result ranker.
 *
 * Adapted from the Manus profile-first web search starter.
 * Scores = credibility 50% + community relevance 40% + personalization 10%.
 * Community relevance cannot override a weak credibility score, so the
 * community-first approach never lowers the factual quality bar.
 */

import type { Lens, MemberProfile } from "./lens-planner.js";
import type { WebResult } from "./web-search.js";

export type RankedResult = WebResult & {
  credibilityScore: number;
  communityScore: number;
  personalizationScore: number;
  finalScore: number;
  reasons: string[];
};

const TRUSTED_DOMAINS = [
  ".gov", ".edu",
  "nih.gov", "cdc.gov", "who.int", "acog.org", "heart.org",
  "nationaleczema.org", "eczemainskinofcolor.org", "skinofcolorsociety.org",
  "plannedparenthood.org", "diabetes.org", "cancer.org", "nami.org",
  "blackmamasmatter.org", "blackwomenshealth.org", "sicklecelldisease.org",
];

function hostOf(url: string): string {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}

function includesTerm(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase());
}

function credibility(result: WebResult): { score: number; reasons: string[] } {
  const host = hostOf(result.url);
  const providerScore = Math.min(Math.max(result.providerScore, 0), 1);
  const trusted = TRUSTED_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  const govOrEdu = host.endsWith(".gov") || host.endsWith(".edu");
  const score = Math.min(1, providerScore * 0.45 + (trusted ? 0.4 : 0) + (govOrEdu ? 0.15 : 0));
  return {
    score,
    reasons: [
      trusted
        ? "Recognized public-health, academic, or reviewed community source."
        : "Live-web source; verify editorial quality.",
    ],
  };
}

function communityRelevance(result: WebResult, lenses: Lens[]): { score: number; reasons: string[] } {
  if (!lenses.length) return { score: 0, reasons: [] };
  const searchable = `${result.title} ${result.content} ${result.sourceQuery.text}`;
  const matchedLabels = lenses
    .filter((lens) => [lens.label, ...lens.searchTerms].some((term) => includesTerm(searchable, term)))
    .map((l) => l.label);
  const primaryTrack = result.sourceQuery.role === "community_primary" || result.sourceQuery.role === "image";
  const score = Math.min(1, (primaryTrack ? 0.6 : 0) + Math.min(0.4, matchedLabels.length * 0.25));
  return {
    score,
    reasons: [
      ...(primaryTrack ? ["Retrieved through the profile-first community search track."] : []),
      ...(matchedLabels.length ? [`Directly matches the active lens: ${matchedLabels.join(", ")}.`] : []),
    ],
  };
}

function personalizedPreference(result: WebResult, profile: MemberProfile): { score: number; reasons: string[] } {
  const host = hostOf(result.url);
  if (profile.preferredDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
    return { score: 1, reasons: ["Matches a member-preferred source domain."] };
  }
  return { score: 0, reasons: [] };
}

export function rankResults(
  results: WebResult[],
  profile: MemberProfile,
  lenses: Lens[],
): RankedResult[] {
  return results
    .filter((r) => {
      const host = hostOf(r.url);
      return !profile.blockedDomains.some((d) => host === d || host.endsWith(`.${d}`));
    })
    .map((r) => {
      const c = credibility(r);
      const cm = communityRelevance(r, lenses);
      const p = personalizedPreference(r, profile);
      const finalScore = c.score * 0.5 + cm.score * 0.4 + p.score * 0.1;
      return {
        ...r,
        credibilityScore: Number(c.score.toFixed(3)),
        communityScore: Number(cm.score.toFixed(3)),
        personalizationScore: Number(p.score.toFixed(3)),
        finalScore: Number(finalScore.toFixed(3)),
        reasons: [...c.reasons, ...cm.reasons, ...p.reasons],
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}


const REPUTABLE_LOCAL_DOMAINS = [
  ".gov", ".edu", ".org", "discoveratlanta.com", "atlanta.net",
  "ajc.com", "atlantamagazine.com", "roughdraftatlanta.com",
];
const DIRECTORY_DOMAINS = ["yelp.com", "tripadvisor.com", "facebook.com", "instagram.com"];

/** Rank local-business findings without claiming that any external result is verified. */
export function rankLocalBusinessResults(results: WebResult[]): WebResult[] {
  return [...results].sort((left, right) => {
    const score = (result: WebResult): number => {
      const host = hostOf(result.url);
      const reputable = REPUTABLE_LOCAL_DOMAINS.some((domain) =>
        domain.startsWith(".") ? host.endsWith(domain) : host === domain || host.endsWith(`.${domain}`),
      );
      const directory = DIRECTORY_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
      const officialSignal = /official|visit|tourism|chamber/i.test(`${result.title} ${result.content}`);
      return Math.min(1, Math.max(0, result.providerScore) * 0.65 + (reputable ? 0.25 : 0) + (officialSignal ? 0.1 : 0) - (directory ? 0.15 : 0));
    };
    return score(right) - score(left);
  });
}
