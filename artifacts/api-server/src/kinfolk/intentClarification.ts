import type { SearchSubject, TopicDomain } from "./diasporaFirstResearchPolicy";

export type ClarificationOption = { value: string; label: string };

export type ClarificationStep = {
  id: string;
  question: string;
  explanation?: string;
  options: ClarificationOption[];
  skippable: boolean;
  /** Temporary context expires in 24 h. Member memory requires explicit "remember" consent. */
  persistence: "temporary" | "optional_member_memory";
};

export function identifyTopicDomain(question: string): TopicDomain {
  const q = question.toLowerCase();
  if (/(heart|blood pressure|disease|symptom|pregnan|alopecia|hair loss|medical|health)/.test(q))
    return "health";
  if (/(travel|flight|hotel|destination|solo)/.test(q)) return "travel";
  if (/(tenant|legal|attorney|rights|court)/.test(q)) return "legal";
  if (/(rent|mortgage|home|housing|neighborhood)/.test(q)) return "housing";
  if (/(job|career|workplace|employment)/.test(q)) return "career";
  return "general";
}

/**
 * Returns the clarification steps relevant to this question and subject.
 * The steps are an offer to improve relevance — never a gate that withholds
 * general information. Every step is skippable.
 */
export function clarificationPlan(
  question: string,
  subject: SearchSubject,
): ClarificationStep[] {
  const domain = identifyTopicDomain(question);
  const plan: ClarificationStep[] = [];

  if (["health", "travel"].includes(domain) && subject === "unknown") {
    return [
      {
        id: "subject",
        question: "Is this information for you, someone else, or general research?",
        options: [
          { value: "me", label: "Me" },
          { value: "someone_else", label: "Someone else" },
          { value: "general_research", label: "Just researching" },
        ],
        skippable: true,
        persistence: "temporary",
      },
    ];
  }

  if (domain === "health" && subject !== "general_research") {
    plan.push({
      id: "personalize-health",
      question:
        "Want to make this more relevant to the person you are researching? Some symptoms, screening guidance, and risks can differ by age, sex, medical history, and other factors.",
      options: [
        { value: "yes", label: "Personalize" },
        { value: "no", label: "Keep it general" },
      ],
      skippable: true,
      persistence: "temporary",
    });
  }

  if (domain === "travel" && subject !== "general_research") {
    plan.push({
      id: "personalize-travel",
      question:
        "Safety considerations can differ depending on who is traveling and the trip plan. Want tips tailored to this trip?",
      options: [
        { value: "yes", label: "Personalize" },
        { value: "no", label: "Keep it general" },
      ],
      skippable: true,
      persistence: "temporary",
    });
  }

  return plan;
}

export function minimumContextQuestions(domain: TopicDomain): ClarificationStep[] {
  if (domain === "health") {
    return [
      {
        id: "health-age-range",
        question: "What age range is most relevant?",
        options: [
          { value: "under-18", label: "Under 18" },
          { value: "18-39", label: "18–39" },
          { value: "40-64", label: "40–64" },
          { value: "65-plus", label: "65+" },
          { value: "skip", label: "Prefer not to say" },
        ],
        skippable: true,
        persistence: "temporary",
      },
      {
        id: "health-sex-context",
        question:
          "Some symptoms can present differently by sex. Would you like to share a relevant sex or pregnancy context?",
        explanation: "You can share as much or as little as you like.",
        options: [
          { value: "female", label: "Female" },
          { value: "male", label: "Male" },
          { value: "pregnancy-postpartum", label: "Pregnancy or postpartum" },
          { value: "skip", label: "Prefer not to say" },
        ],
        skippable: true,
        persistence: "temporary",
      },
      {
        id: "health-background-context",
        question:
          "Background can sometimes affect prevalence, screening guidance, or lived disparities. Would you like to add any context?",
        explanation: "This is optional and is not required for helpful information.",
        options: [
          { value: "add-context", label: "Add context" },
          { value: "skip", label: "Prefer not to say" },
        ],
        skippable: true,
        persistence: "temporary",
      },
    ];
  }

  if (domain === "travel") {
    return [
      {
        id: "travel-plan",
        question: "What kind of trip is this?",
        options: [
          { value: "solo", label: "Solo" },
          { value: "group", label: "With others" },
          { value: "family", label: "Family" },
          { value: "skip", label: "Prefer not to say" },
        ],
        skippable: true,
        persistence: "temporary",
      },
    ];
  }

  return [];
}

// Never ask a demographic question because a member searched a cultural or accessibility term.
// Search intent can shape retrieval, but it cannot become member identity.
