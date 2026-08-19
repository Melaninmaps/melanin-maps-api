export type OutcomeScene = {
  id: string;
  eyebrow: string;
  headline: string;
  supporting: string;
  outcome: string;
  visual: "nearby" | "community" | "business" | "culture" | "knowledge";
  durationMs: number;
};

// Demonstration-only content. This preview intentionally makes no API, map,
// search, location, storage, or Kinfolk request.
export const OUTCOME_PREVIEW_SCENES: OutcomeScene[] = [
  {
    id: "need-to-nearby",
    eyebrow: "WHEN YOU NEED SOMETHING CLOSE",
    headline: "The right places rise to the surface.",
    supporting: "A local view settles on two nearby bookstores, with the distance and the next step already clear.",
    outcome: "Find who you need, where you are.",
    visual: "nearby",
    durationMs: 6600,
  },
  {
    id: "voice-to-context",
    eyebrow: "WHEN COMMUNITY KNOWLEDGE MATTERS",
    headline: "A lived experience becomes useful context.",
    supporting: "A recommendation, practical note, or local observation becomes a visible signal people can use—not a comment that disappears.",
    outcome: "Put your people on.",
    visual: "community",
    durationMs: 6600,
  },
  {
    id: "business-to-discovery",
    eyebrow: "WHEN A GOOD BUSINESS DESERVES TO BE FOUND",
    headline: "The people doing the work become discoverable.",
    supporting: "A business story, services, location, and photos become a real local presence that the right community can reach.",
    outcome: "Make your work easier to find.",
    visual: "business",
    durationMs: 6600,
  },
  {
    id: "culture-to-trail",
    eyebrow: "WHEN A PLACE HAS A STORY",
    headline: "Culture becomes a path worth following.",
    supporting: "A cultural highlight connects to nearby places, living history, and local experiences that visitors and neighbors can carry with them.",
    outcome: "See more than a destination.",
    visual: "culture",
    durationMs: 6600,
  },
  {
    id: "research-to-library",
    eyebrow: "WHEN A QUESTION SHOULD NOT BE LOST",
    headline: "Useful knowledge stays within reach.",
    supporting: "Source-cited research becomes a Living Library entry, ready for the next person who needs a way forward.",
    outcome: "Keep what matters close.",
    visual: "knowledge",
    durationMs: 6600,
  },
];