export type BadgeId =
  | "community_welcomed"
  | "respect_in_action"
  | "community_favorite"
  | "accessibility_champion"
  | "family_friendly"
  | "inclusive_workplace"
  | "community_connector";

export interface BadgeDef {
  id: BadgeId;
  emoji: string;
  label: string;
  description: string;
  tags: string[];
  threshold: number;
}

export const RECOGNITION_TAGS: { tag: string; badgeId: BadgeId | null }[] = [
  { tag: "Made me feel welcome", badgeId: "community_welcomed" },
  { tag: "A comfortable, familiar space", badgeId: "community_welcomed" },
  { tag: "Inclusive and welcoming environment", badgeId: "community_welcomed" },
  { tag: "Exceptional service from the team", badgeId: "respect_in_action" },
  { tag: "Created a truly positive experience", badgeId: "respect_in_action" },
  { tag: "I'd happily recommend this business", badgeId: "community_favorite" },
  { tag: "Thank you for supporting our community", badgeId: "community_connector" },
  { tag: "Excellent accessibility and accommodations", badgeId: "accessibility_champion" },
  { tag: "Great place for families", badgeId: "family_friendly" },
  { tag: "Great place for solo visitors", badgeId: null },
  { tag: "Great place to work", badgeId: "inclusive_workplace" },
  { tag: "Actively supports local events and orgs", badgeId: "community_connector" },
];

export const ENCOURAGEMENT_TAGS: string[] = [
  "I have an idea that could improve the experience",
  "I'd like to suggest an accessibility improvement",
  "I'd like to suggest a service improvement",
  "I'd like to suggest additional products or services",
  "I'd like to recognize an employee",
];

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "community_welcomed",
    emoji: "🏆",
    label: "Community Welcomed",
    description: "Consistently reported as a welcoming environment.",
    tags: ["Made me feel welcome", "A comfortable, familiar space", "Inclusive and welcoming environment"],
    threshold: 3,
  },
  {
    id: "respect_in_action",
    emoji: "🤝",
    label: "Respect in Action",
    description: "Frequently recognized for respectful customer service.",
    tags: ["Exceptional service from the team", "Created a truly positive experience"],
    threshold: 3,
  },
  {
    id: "community_favorite",
    emoji: "🌟",
    label: "Community Favorite",
    description: "Highly recommended by community members.",
    tags: ["I'd happily recommend this business"],
    threshold: 3,
  },
  {
    id: "accessibility_champion",
    emoji: "♿",
    label: "Accessibility Champion",
    description: "Frequently praised for accessibility and accommodations.",
    tags: ["Excellent accessibility and accommodations"],
    threshold: 3,
  },
  {
    id: "family_friendly",
    emoji: "👨‍👩‍👧",
    label: "Family Friendly",
    description: "Consistently recognized by families.",
    tags: ["Great place for families"],
    threshold: 3,
  },
  {
    id: "inclusive_workplace",
    emoji: "💼",
    label: "Inclusive Workplace",
    description: "Based on employee feedback over time.",
    tags: ["Great place to work"],
    threshold: 3,
  },
  {
    id: "community_connector",
    emoji: "🌍",
    label: "Community Connector",
    description: "Frequently supports local events and organizations.",
    tags: ["Thank you for supporting our community", "Actively supports local events and orgs"],
    threshold: 3,
  },
];

export function getBadgeDef(id: string): BadgeDef | undefined {
  return BADGE_DEFS.find((b) => b.id === id);
}
