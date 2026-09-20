/**
 * Mapping With Melanin™ — Master VIBES taxonomy.
 *
 * Generated from the approved `Vibe Reference` worksheet. A VIBE
 * describes the atmosphere or visit experience, not a category, an
 * ownership designation, or a quality claim. Endorsement-only categories
 * are intentionally absent from this map.
 */

export interface VibeLabel {
  label: string;
  helperText: string;
}

export const VIBES_BY_CATEGORY: Record<string, VibeLabel[]> = {
  "Food & Drink": [
    { label: "Date Night", helperText: "Worth getting cute for" },
    { label: "Hood Classic", helperText: "Been here forever, still hits" },
    { label: "Bougie Treat", helperText: "Payday / splurge spot" },
    { label: "Family Reunion Energy", helperText: "Loud, warm, everybody's welcome" },
    { label: "Sunday Best", helperText: "After-church energy" },
    { label: "Late Night Vibes", helperText: "Open when you need it" },
    { label: "Turn Up", helperText: "Music up, energy high" },
    { label: "Cookout Approved", helperText: "Passes the family test" },
    { label: "Like Home", helperText: "Familiar, comfortable, somebody's-kitchen energy" },
    { label: "Auntie Energy", helperText: "Warm service; somebody is making sure you're good" },
    { label: "Tía Energy", helperText: "Warm, familiar, lovingly involved" },
    { label: "Abuela Approved Energy", helperText: "Traditional, comforting, multigenerational" },
    { label: "Soft Life", helperText: "Relaxed, comfortable, treat-yourself energy" },
    { label: "Take Somebody From Out of Town", helperText: "A place you would proudly show visitors" },
    { label: "Locals Know", helperText: "Community favorite without needing the hype" },
    { label: "Passport Energy", helperText: "Feels culturally transporting" },
    { label: "Pop Out Pics", helperText: "Photo-ready food, setting, or presentation" },
  ],
  "Beauty & Personal Care": [
    { label: "Soft Life", helperText: "Pampering, ease, recharge" },
    { label: "Auntie Energy", helperText: "Warm, attentive, you will be taken care of" },
    { label: "Tía Energy", helperText: "Familiar care and loving honesty" },
    { label: "Main Character Energy", helperText: "You leave feeling seen and photo-ready" },
    { label: "Sunday Best", helperText: "Polished, occasion-ready" },
    { label: "Chill & Restore", helperText: "Low-stress self-care" },
    { label: "Come As You Are", helperText: "Welcoming without judgment" },
    { label: "For The Culture", helperText: "Culture is understood, not performed" },
    { label: "Neighborhood Love", helperText: "Deep local connection" },
    { label: "Luxury Without The Attitude", helperText: "Elevated service that still feels welcoming" },
  ],
  "Health & Wellness": [
    { label: "Chill & Restore", helperText: "You leave more grounded than you arrived" },
    { label: "Peaceful Energy", helperText: "Quiet, calm, restorative" },
    { label: "Come As You Are", helperText: "Low judgment; meet-you-where-you-are energy" },
    { label: "Auntie Energy", helperText: "Warm, caring, attentive" },
    { label: "Family Care", helperText: "Feels safe to recommend across generations" },
    { label: "Wellness Reset", helperText: "Balance, healing, recharge" },
  ],
  "Shopping & Retail": [
    { label: "Hood Classic", helperText: "Neighborhood institution status" },
    { label: "Locals Know", helperText: "A real local favorite" },
    { label: "Hidden Gem", helperText: "Underrated and worth discovering" },
    { label: "Bougie Treat", helperText: "Special purchase / elevated browsing" },
    { label: "Chill & Create", helperText: "Slow browsing, creative energy" },
    { label: "Bring The Cousins", helperText: "Fun to shop together" },
    { label: "For The Culture", helperText: "Culture is visible in product and experience" },
    { label: "Take Somebody From Out of Town", helperText: "A store you would proudly show visitors" },
  ],
  "Travel & Hospitality": [
    { label: "Romantic Escape", helperText: "Just the two of you" },
    { label: "Family Reunion Energy", helperText: "Bring everybody" },
    { label: "Solo Traveler Comfortable", helperText: "Community-reported ease traveling alone" },
    { label: "Bougie Treat", helperText: "Splurge stay" },
    { label: "Chill & Restore", helperText: "You came back rested" },
    { label: "Girls Trip Ready", helperText: "Built for the group chat" },
    { label: "Grand Rising", helperText: "Mornings here are beautiful" },
    { label: "Bring The Cousins", helperText: "Room for the whole crew" },
    { label: "Passport Energy", helperText: "The stay itself feels culturally transporting" },
    { label: "Take Somebody From Out of Town", helperText: "A proud recommendation for visitors" },
    { label: "Luxury Without The Attitude", helperText: "Elevated but warm" },
    { label: "Locals Know", helperText: "Not the tourist-trap version of the city" },
  ],
  "Arts, Culture & Entertainment": [
    { label: "Date Night", helperText: "Romance-friendly" },
    { label: "Turn Up", helperText: "High energy" },
    { label: "Grown & Sexy", helperText: "Adults, no chaos" },
    { label: "Hood Classic", helperText: "Institution status" },
    { label: "Chill & Create", helperText: "You can think and make here" },
    { label: "Late Night Vibes", helperText: "The night keeps going" },
    { label: "Family Reunion Energy", helperText: "All ages welcome" },
    { label: "Sunday Best", helperText: "Dress-up occasion" },
    { label: "History Lives Here", helperText: "Heritage feels tangible" },
    { label: "Culture On The Walls", helperText: "Visual environment celebrates culture/history" },
    { label: "Teach The Kids", helperText: "Worth bringing young people for the learning" },
    { label: "Creative Scene", helperText: "Art, music, culture, expression" },
  ],
  "Events & Celebrations": [
    { label: "Family Reunion Energy", helperText: "Built for big families" },
    { label: "Sunday Best", helperText: "Formal-ready" },
    { label: "Turn Up", helperText: "The party can go" },
    { label: "Grown & Sexy", helperText: "Adult celebration" },
    { label: "Bougie Treat", helperText: "Upscale feel" },
    { label: "Kid Chaos Friendly", helperText: "Children can be children" },
    { label: "Late Night Vibes", helperText: "No hard early cutoff" },
    { label: "Cookout Approved", helperText: "Comfortable, familiar, ours" },
    { label: "Made For Memories", helperText: "Milestones, photos and celebrations" },
    { label: "Bring The Cousins", helperText: "Room for everybody" },
    { label: "Luxury Without The Attitude", helperText: "Elevated without stiffness" },
  ],
  "Education & Learning": [
    { label: "Teach The Kids", helperText: "Learning feels alive and culturally relevant" },
    { label: "Come As You Are", helperText: "Students feel welcomed as themselves" },
    { label: "Creative Energy", helperText: "Curious, expressive, hands-on" },
    { label: "Community Classroom", helperText: "Learning connected to people and place" },
  ],
  "Children & Family": [
    { label: "Kid Chaos Friendly", helperText: "Nobody side-eyes a loud toddler" },
    { label: "Family Reunion Energy", helperText: "Big groups work here" },
    { label: "Rainy Day Rescue", helperText: "Saves the whole afternoon" },
    { label: "Toddler Safe", helperText: "Soft, gated, watched" },
    { label: "Big Kid Approved", helperText: "Tweens actually enjoy it" },
    { label: "Parents Can Breathe", helperText: "You get to sit down" },
    { label: "Birthday Party Ready", helperText: "Celebration-friendly" },
    { label: "Bring The Cousins", helperText: "Room for everybody's kids" },
    { label: "Teach The Kids", helperText: "Fun with something meaningful to learn" },
    { label: "Like Home", helperText: "Comfortable for the whole family" },
  ],
  "Community & Nonprofit": [
    { label: "Neighborhood Love", helperText: "Deeply rooted in the neighborhood" },
    { label: "For The Culture", helperText: "Community purpose is visible" },
    { label: "Come As You Are", helperText: "Welcoming without hoops or judgment" },
    { label: "Everybody Knows Somebody", helperText: "Connected, relational, familiar" },
    { label: "Family Reunion Energy", helperText: "Multigenerational community gathering" },
    { label: "History Lives Here", helperText: "Legacy and community memory matter here" },
  ],
  "Faith & Spirituality": [
    { label: "Sunday Best", helperText: "Dress-up tradition here" },
    { label: "Come As You Are", helperText: "Jeans are fine" },
    { label: "Quiet & Prayerful", helperText: "Stillness is kept" },
    { label: "Praise Break Energy", helperText: "Expressive worship" },
    { label: "Family Worship", helperText: "Children in the room, welcomed" },
    { label: "Young Adult Friendly", helperText: "Twenties and thirties are present" },
    { label: "Auntie Energy", helperText: "Warm, watchful, caring community" },
    { label: "Everybody Knows Somebody", helperText: "Relational congregation/community" },
  ],
  "Media & Creative Services": [
    { label: "Creative Scene", helperText: "Art, music, culture, expression" },
    { label: "Chill & Create", helperText: "You can think and make here" },
    { label: "Main Character Energy", helperText: "Strong visual / personal-brand energy" },
    { label: "For The Culture", helperText: "Cultural storytelling is understood" },
    { label: "Grown & Sexy", helperText: "Polished adult creative atmosphere" },
  ],
  "Sports & Recreation": [
    { label: "Turn Up", helperText: "Crowd brings energy" },
    { label: "Family Reunion Energy", helperText: "Families in the stands" },
    { label: "Chill & Move", helperText: "Low-pressure movement" },
    { label: "Early Bird Energy", helperText: "Morning crowd is right" },
    { label: "Kid Chaos Friendly", helperText: "Kids can run" },
    { label: "Adventure Ready", helperText: "Active, explorative, outdoors" },
    { label: "Bring The Cousins", helperText: "Group-friendly activity" },
  ],
  "Agriculture & Specialty Producers": [
    { label: "Grand Rising", helperText: "Beautiful early morning" },
    { label: "Family Reunion Energy", helperText: "Neighbors everywhere" },
    { label: "Chill & Create", helperText: "Slow, pleasant browsing" },
    { label: "Bring The Cousins", helperText: "Make it an outing" },
    { label: "Hood Classic", helperText: "The market everybody knows" },
    { label: "Cookout Approved", helperText: "Where you shop before the cookout" },
    { label: "Locals Know", helperText: "Community-grown favorite" },
    { label: "Teach The Kids", helperText: "Great for learning where food comes from" },
  ],
};

/** Flat list of every explicit VIBE label, for cross-client validation. */
export const ALL_VIBE_LABELS: string[] = [
  ...new Set(Object.values(VIBES_BY_CATEGORY).flatMap((vibes) => vibes.map((vibe) => vibe.label))),
];

/** Categories with approved VIBES; all other categories use endorsements only. */
export const VIBE_ELIGIBLE_CATEGORIES: string[] = Object.keys(VIBES_BY_CATEGORY);

export function isVibeEligible(category: string): boolean {
  return VIBE_ELIGIBLE_CATEGORIES.includes(category);
}
