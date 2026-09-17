import { VIBES_BY_CATEGORY } from "./vibe-labels";
import { normalizeOwnerExperienceKey } from "./business-experience";

const PLAIN_LANGUAGE_VIBE_ALIASES: Record<string, string[]> = {
  romantic: ["Date Night", "Romantic Escape", "Grown & Sexy"],
  romance: ["Date Night", "Romantic Escape", "Grown & Sexy"],
  "date night": ["Date Night", "Romantic Escape", "Grown & Sexy"],
  nightlife: ["Late Night Vibes", "Turn Up", "Grown & Sexy"],
  "late night": ["Late Night Vibes"],
  family: ["Family Reunion Energy", "Kid Chaos Friendly", "Family Care"],
  kids: ["Kid Chaos Friendly", "Toddler Safe", "Big Kid Approved", "Teach The Kids"],
  relaxing: ["Soft Life", "Chill & Restore", "Peaceful Energy"],
  relaxed: ["Soft Life", "Chill & Restore", "Peaceful Energy"],
  creative: ["Creative Scene", "Creative Energy", "Chill & Create"],
};

function tokens(value: string): string[] {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) ?? [];
}

/**
 * Maps a member's atmosphere words to explicit approved VIBES. This only
 * recognizes a VIBE from its approved label or helper text; it never infers a
 * VIBE from business ownership, image, city, or category.
 */
export function findVibeKeysForSearch(query: string): string[] {
  const queryTokens = tokens(query).filter((token) => token.length >= 3);
  if (!queryTokens.length) return [];
  const matched = new Set<string>();
  const normalizedQuery = query.trim().toLowerCase();

  for (const [phrase, labels] of Object.entries(PLAIN_LANGUAGE_VIBE_ALIASES)) {
    if (!normalizedQuery.includes(phrase)) continue;
    for (const label of labels) matched.add(normalizeOwnerExperienceKey(label));
  }

  for (const vibes of Object.values(VIBES_BY_CATEGORY)) {
    for (const vibe of vibes) {
      const candidateTokens = tokens(`${vibe.label} ${vibe.helperText}`);
      const directLabel = vibe.label.toLowerCase().includes(normalizedQuery);
      const tokenMatch = queryTokens.some((queryToken) =>
        candidateTokens.some((candidate) =>
          candidate === queryToken ||
          (queryToken.length >= 5 && candidate.startsWith(queryToken.slice(0, 5))) ||
          (candidate.length >= 5 && queryToken.startsWith(candidate.slice(0, 5))),
        ),
      );
      if (directLabel || tokenMatch) matched.add(normalizeOwnerExperienceKey(vibe.label));
    }
  }
  return [...matched];
}
