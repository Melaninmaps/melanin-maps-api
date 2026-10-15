import { FOUNDER_TAXONOMY_CONTRACT } from "./founder-taxonomy-vibesnow";

/**
 * Mapping With Melanin™ — founder-approved VIBES vocabulary.
 *
 * The VIBESNOW taxonomy contract owns category eligibility and every selectable
 * label. Helper text is presentation-only; an empty value is intentionally
 * rendered as no description rather than inventing founder wording.
 */
export interface VibeLabel {
  label: string;
  helperText: string;
}

const VIBE_HELPER_TEXT_BY_CATEGORY: Readonly<Record<string, Readonly<Record<string, string>>>> = {
  "Food & Drink": {
    "Date Night": "Worth getting cute for",
    "Hood Classic": "Been here forever, still hits",
    "Bougie Treat": "Payday / splurge spot",
    "Family Reunion Energy": "Loud, warm, everybody's welcome",
    "Sunday Best": "After-church energy",
    "Late Night Vibes": "Open when you need it",
    "Turn Up": "Music up, energy high",
    "Cookout Approved": "Passes the family test",
    "Like Home": "Familiar, comfortable, somebody's-kitchen energy",
    "Auntie Energy": "Warm service; somebody is making sure you're good",
    "Tía Energy": "Warm, familiar, lovingly involved",
    "Abuela Approved Energy": "Traditional, comforting, multigenerational",
    "Soft Life": "Relaxed, comfortable, treat-yourself energy",
    "Take Somebody From Out of Town": "A place you would proudly show visitors",
    "Locals Know": "Community favorite without needing the hype",
    "Passport Energy": "Feels culturally transporting",
    "Pop Out Pics": "Photo-ready food, setting, or presentation"
  },
  "Beauty & Personal Care": {
    "Soft Life": "Pampering, ease, recharge",
    "Auntie Energy": "Warm, attentive, you will be taken care of",
    "Tía Energy": "Familiar care and loving honesty",
    "Main Character Energy": "You leave feeling seen and photo-ready",
    "Sunday Best": "Polished, occasion-ready",
    "Chill & Restore": "Low-stress self-care",
    "Come As You Are": "Welcoming without judgment",
    "For The Culture": "Culture is understood, not performed",
    "Neighborhood Love": "Deep local connection",
    "Luxury Without The Attitude": "Elevated service that still feels welcoming"
  },
  "Health & Wellness": {
    "Chill & Restore": "You leave more grounded than you arrived",
    "Peaceful Energy": "Quiet, calm, restorative",
    "Come As You Are": "Low judgment; meet-you-where-you-are energy",
    "Auntie Energy": "Warm, caring, attentive",
    "Family Care": "Feels safe to recommend across generations",
    "Wellness Reset": "Balance, healing, recharge"
  },
  "Shopping & Retail": {
    "Hood Classic": "Neighborhood institution status",
    "Locals Know": "A real local favorite",
    "Hidden Gem": "Underrated and worth discovering",
    "Bougie Treat": "Special purchase / elevated browsing",
    "Chill & Create": "Slow browsing, creative energy",
    "Bring The Cousins": "Fun to shop together",
    "For The Culture": "Culture is visible in product and experience",
    "Take Somebody From Out of Town": "A store you would proudly show visitors"
  },
  "Travel & Hospitality": {
    "Romantic Escape": "Just the two of you",
    "Family Reunion Energy": "Bring everybody",
    "Solo Traveler Comfortable": "Community-reported ease traveling alone",
    "Bougie Treat": "Splurge stay",
    "Chill & Restore": "You came back rested",
    "Girls Trip Ready": "Built for the group chat",
    "Grand Rising": "Mornings here are beautiful",
    "Bring The Cousins": "Room for the whole crew",
    "Passport Energy": "The stay itself feels culturally transporting",
    "Take Somebody From Out of Town": "A proud recommendation for visitors",
    "Luxury Without The Attitude": "Elevated but warm",
    "Locals Know": "Not the tourist-trap version of the city"
  },
  "Arts, Culture & Entertainment": {
    "Date Night": "Romance-friendly",
    "Turn Up": "High energy",
    "Grown & Sexy": "Adults, no chaos",
    "Hood Classic": "Institution status",
    "Chill & Create": "You can think and make here",
    "Late Night Vibes": "The night keeps going",
    "Family Reunion Energy": "All ages welcome",
    "Sunday Best": "Dress-up occasion",
    "History Lives Here": "Heritage feels tangible",
    "Culture On The Walls": "Visual environment celebrates culture/history",
    "Teach The Kids": "Worth bringing young people for the learning",
    "Creative Scene": "Art, music, culture, expression"
  },
  "Events & Celebrations": {
    "Family Reunion Energy": "Built for big families",
    "Sunday Best": "Formal-ready",
    "Turn Up": "The party can go",
    "Grown & Sexy": "Adult celebration",
    "Bougie Treat": "Upscale feel",
    "Kid Chaos Friendly": "Children can be children",
    "Late Night Vibes": "No hard early cutoff",
    "Cookout Approved": "Comfortable, familiar, ours",
    "Made For Memories": "Milestones, photos and celebrations",
    "Bring The Cousins": "Room for everybody",
    "Luxury Without The Attitude": "Elevated without stiffness"
  },
  "Education & Learning": {
    "Teach The Kids": "Learning feels alive and culturally relevant",
    "Come As You Are": "Students feel welcomed as themselves",
    "Creative Energy": "Curious, expressive, hands-on",
    "Community Classroom": "Learning connected to people and place"
  },
  "Children & Family": {
    "Kid Chaos Friendly": "Nobody side-eyes a loud toddler",
    "Family Reunion Energy": "Big groups work here",
    "Rainy Day Rescue": "Saves the whole afternoon",
    "Toddler Safe": "Soft, gated, watched",
    "Big Kid Approved": "Tweens actually enjoy it",
    "Parents Can Breathe": "You get to sit down",
    "Birthday Party Ready": "Celebration-friendly",
    "Bring The Cousins": "Room for everybody's kids",
    "Teach The Kids": "Fun with something meaningful to learn",
    "Like Home": "Comfortable for the whole family"
  },
  "Community & Nonprofit": {
    "Neighborhood Love": "Deeply rooted in the neighborhood",
    "For The Culture": "Community purpose is visible",
    "Come As You Are": "Welcoming without hoops or judgment",
    "Everybody Knows Somebody": "Connected, relational, familiar",
    "Family Reunion Energy": "Multigenerational community gathering",
    "History Lives Here": "Legacy and community memory matter here"
  },
  "Faith & Spirituality": {
    "Sunday Best": "Dress-up tradition here",
    "Come As You Are": "Jeans are fine",
    "Quiet & Prayerful": "Stillness is kept",
    "Praise Break Energy": "Expressive worship",
    "Family Worship": "Children in the room, welcomed",
    "Young Adult Friendly": "Twenties and thirties are present",
    "Auntie Energy": "Warm, watchful, caring community",
    "Everybody Knows Somebody": "Relational congregation/community"
  },
  "Media & Creative Services": {
    "Creative Scene": "Art, music, culture, expression",
    "Chill & Create": "You can think and make here",
    "Main Character Energy": "Strong visual / personal-brand energy",
    "For The Culture": "Cultural storytelling is understood",
    "Grown & Sexy": "Polished adult creative atmosphere"
  },
  "Sports & Recreation": {
    "Turn Up": "Crowd brings energy",
    "Family Reunion Energy": "Families in the stands",
    "Chill & Move": "Low-pressure movement",
    "Early Bird Energy": "Morning crowd is right",
    "Kid Chaos Friendly": "Kids can run",
    "Adventure Ready": "Active, explorative, outdoors",
    "Bring The Cousins": "Group-friendly activity"
  },
  "Agriculture & Specialty Producers": {
    "Grand Rising": "Beautiful early morning",
    "Family Reunion Energy": "Neighbors everywhere",
    "Chill & Create": "Slow, pleasant browsing",
    "Bring The Cousins": "Make it an outing",
    "Hood Classic": "The market everybody knows",
    "Cookout Approved": "Where you shop before the cookout",
    "Locals Know": "Community-grown favorite",
    "Teach The Kids": "Great for learning where food comes from"
  }
};

export const VIBES_BY_CATEGORY: Record<string, VibeLabel[]> = Object.fromEntries(
  FOUNDER_TAXONOMY_CONTRACT
    .filter((entry) => entry.vibeMode === "vibes")
    .map((entry) => [
      entry.category,
      entry.vibeLabels.map((label) => ({
        label,
        helperText: VIBE_HELPER_TEXT_BY_CATEGORY[entry.category]?.[label] ?? "",
      })),
    ]),
);

/** Flat list of every explicit founder-approved VIBE label. */
export const ALL_VIBE_LABELS: string[] = [
  ...new Set(Object.values(VIBES_BY_CATEGORY).flatMap((vibes) => vibes.map((vibe) => vibe.label))),
];

/** Categories with founder-approved VIBES; every other category uses endorsements only. */
export const VIBE_ELIGIBLE_CATEGORIES: string[] = FOUNDER_TAXONOMY_CONTRACT
  .filter((entry) => entry.vibeMode === "vibes")
  .map((entry) => entry.category);

export function isVibeEligible(category: string | null | undefined): boolean {
  return Boolean(category && VIBE_ELIGIBLE_CATEGORIES.includes(category.trim()));
}
