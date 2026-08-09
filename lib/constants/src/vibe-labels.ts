/**
 * Mapping With Melanin™ — Master Vibe Label System
 *
 * PERMANENT SOURCE OF TRUTH — version-controlled, never stored in agent memory.
 * 131 vibe labels organized by category.
 *
 * Key rule: A vibe describes the ATMOSPHERE or type of visit — not whether
 * the business was good. Endorsements/quick reviews handle quality.
 *
 * Vibe-eligible categories: Food & Drink, Travel & Hospitality,
 * Arts Culture & Entertainment, Events & Celebrations, Children & Family,
 * Sports & Recreation, Beauty & Personal Care, Shopping & Retail.
 * Professional services (plumbers, attorneys, etc.) use endorsements only.
 *
 * Sourced from: Mapping_With_Melanin_MASTER_Business_Directory.xlsx → Vibe Reference tab
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
    { label: "Girls Trip Ready", helperText: "Perfect for the crew" },
    { label: "Grown & Sexy", helperText: "Classy, low-key, adults only energy" },
    { label: "Bring The Cousins", helperText: "Big table, big plates, big fun" },
    { label: "Soft Life", helperText: "No rushing, no noise — pure comfort" },
    { label: "Passport Energy", helperText: "Feels like you left the country" },
    { label: "Locals Know", helperText: "Not on the tourist trail yet" },
    { label: "Take Somebody From Out of Town", helperText: "The spot you show off" },
    { label: "Stay Awhile", helperText: "No rush — settle in and enjoy" },
    { label: "Tourist Who?", helperText: "Only the community knows this one" },
    { label: "Bring Your People", helperText: "The one you bring everyone to" },
    { label: "Chill Spot", helperText: "Low key, good energy, no pressure" },
    { label: "Good Music, Good Energy", helperText: "The playlist and the vibe are right" },
  ],
  "Beauty & Personal Care": [
    { label: "Soft Life", helperText: "Pure pampering, no stress" },
    { label: "Auntie Energy", helperText: "You're being taken care of" },
    { label: "Girls Trip Ready", helperText: "Group bookings welcome" },
    { label: "Sunday Best", helperText: "Come out looking right for church" },
    { label: "Grown & Sexy", helperText: "Elevated, polished, professional" },
    { label: "Luxury Without The Attitude", helperText: "High quality, no pretension" },
    { label: "Neighborhood Love", helperText: "The shop your block knows" },
    { label: "Chill & Restore", helperText: "Relaxing from start to finish" },
    { label: "Main Character Energy", helperText: "You leave feeling like yourself, but better" },
    { label: "For The Culture", helperText: "Built by and for us" },
    { label: "They Get It", helperText: "No explaining your hair, skin, or style" },
    { label: "Come As You Are", helperText: "Bonnet, sweats, work clothes — just come get what you need" },
    { label: "Judgment-Free Beauty", helperText: "No side-eye, hovering, or making you uncomfortable" },
    { label: "Hair Emergency Ready", helperText: "The place you think of when you need something right now" },
    { label: "Quick Run Approved", helperText: "Easy to get in, grab it, and go" },
    { label: "Beauty Girl Playground", helperText: "You came for one thing and now you're looking at everything" },
    { label: "For Us, For Real", helperText: "The selection actually reflects our beauty needs" },
    { label: "Every Texture Welcome", helperText: "Products aren't centered around one hair type" },
    { label: "Protective Style Headquarters", helperText: "Braids, locs, twists, wigs, crochet — the options are there" },
    { label: "Natural Hair Haven", helperText: "Strong selection for curls, coils, locs and natural hair care" },
    { label: "Wig Girl Ready", helperText: "Wigs, lace, caps, adhesive, styling tools — the whole situation" },
    { label: "Braiding Day Ready", helperText: "You can realistically get what you need for the entire style" },
    { label: "Last-Minute Lifesaver", helperText: "Saved you when somewhere else didn't have it" },
    { label: "Auntie Knows What You Need", helperText: "Helpful, familiar, experienced energy" },
    { label: "Beauty On A Budget", helperText: "Plenty of useful options without everything feeling expensive" },
    { label: "Stocked & Ready", helperText: "Feels dependable rather than picked-over" },
    { label: "Try Something New", helperText: "Enough variety to discover brands and products you haven't used" },
    { label: "Neighborhood Beauty Staple", helperText: "The store people have relied on for years" },
    { label: "The One We Go To", helperText: "The default beauty supply in the community" },
    { label: "Don't Need Another Store", helperText: "Broad enough selection that one stop usually does it" },
    { label: "Worth The Beauty Run", helperText: "Worth going out of your way for" },
  ],
  "Health & Wellness": [
    { label: "Chill & Restore", helperText: "Recovery and reset energy" },
    { label: "Peaceful Energy", helperText: "Quiet, intentional, no rush" },
    { label: "Soft Life", helperText: "Restorative, comfortable, calming" },
    { label: "Community Healing", helperText: "Feels like it was built for us" },
  ],
  "Shopping & Retail": [
    { label: "Hood Classic", helperText: "The spot that's always been there" },
    { label: "Locals Know", helperText: "Hidden from the mainstream" },
    { label: "Bougie Treat", helperText: "Worth the splurge" },
    { label: "Neighborhood Love", helperText: "Community staple" },
    { label: "Culture On The Walls", helperText: "Art, history, identity everywhere you look" },
    { label: "Luxury Without The Attitude", helperText: "Premium quality, community prices" },
    { label: "Take Somebody From Out of Town", helperText: "The unique spot you show off" },
    { label: "Teach The Kids", helperText: "Educational and culturally grounding" },
  ],
  "Travel & Hospitality": [
    { label: "Romantic Escape", helperText: "Perfect for couples" },
    { label: "Family Reunion Energy", helperText: "Room for everyone" },
    { label: "Girls Trip Ready", helperText: "Built for the crew" },
    { label: "Bougie Treat", helperText: "Worth every dollar" },
    { label: "Passport Energy", helperText: "World-class, culturally rich" },
    { label: "Soft Life", helperText: "Pure relaxation and comfort" },
    { label: "Luxury Without The Attitude", helperText: "Five-star feel, human service" },
    { label: "Take Somebody From Out of Town", helperText: "The property you're proud to book" },
    { label: "Passport Ready", helperText: "Makes you want to book the trip" },
    { label: "Stress-Free Travel", helperText: "They handle the details so you can enjoy the trip" },
    { label: "Adventure Ready", helperText: "Great for travelers who want to explore and do things" },
    { label: "Couples Getaway", helperText: "Strong for romantic travel and anniversaries" },
    { label: "Culture First", helperText: "Prioritizes local culture and meaningful experiences" },
    { label: "First Passport Friendly", helperText: "Comfortable for inexperienced international travelers" },
    { label: "Come Back Rested", helperText: "Understands that vacation should actually feel like vacation" },
  ],
  "Arts, Culture & Entertainment": [
    { label: "Date Night", helperText: "Worth getting dressed up for" },
    { label: "Turn Up", helperText: "High energy, unforgettable" },
    { label: "History Lives Here", helperText: "Grounded in real legacy and story" },
    { label: "Culture On The Walls", helperText: "Representation everywhere you look" },
    { label: "Teach The Kids", helperText: "Educational, identity-affirming" },
    { label: "Family Reunion Energy", helperText: "All generations welcome" },
    { label: "Soft Life", helperText: "Peaceful, contemplative, healing" },
    { label: "Take Somebody From Out of Town", helperText: "The cultural experience you show off" },
  ],
  "Events & Celebrations": [
    { label: "Sunday Best", helperText: "Everybody comes dressed" },
    { label: "Family Reunion Energy", helperText: "Multi-generational warmth" },
    { label: "Turn Up", helperText: "Energy is all the way up" },
    { label: "Grown & Sexy", helperText: "Elevated, curated, adult energy" },
    { label: "Girls Trip Ready", helperText: "Built for the crew" },
    { label: "Kid Chaos Friendly", helperText: "Children are expected and welcome" },
    { label: "Praise Break Energy", helperText: "The spirit might move you" },
    { label: "Cookout Approved", helperText: "Casual, community, fire food" },
    { label: "Made For Memories", helperText: "The event you'll talk about for years" },
    { label: "Main Character Energy", helperText: "Everything was built around the person being celebrated" },
    { label: "For The Culture", helperText: "Honors who we are and where we come from" },
    { label: "Bring Your People", helperText: "The kind of event you invite everyone to" },
    { label: "Soft Life Celebration", helperText: "Ease, elegance, and comfort — the celebration you deserved" },
  ],
  "Education & Learning": [
    { label: "Teach The Kids", helperText: "Identity-affirming and culturally grounded" },
    { label: "History Lives Here", helperText: "Legacy and scholarship honored here" },
    { label: "Community Healing", helperText: "Nurturing, supportive learning space" },
    { label: "Neighborhood Love", helperText: "Built by and for this community" },
  ],
  "Children & Family": [
    { label: "Kid Chaos Friendly", helperText: "Children are expected and celebrated" },
    { label: "Family Reunion Energy", helperText: "Room for everyone, all ages" },
    { label: "Teach The Kids", helperText: "Educational, identity-building" },
    { label: "Neighborhood Love", helperText: "The family spot the block trusts" },
    { label: "Sunday Best", helperText: "After-church approved" },
  ],
  "Sports & Recreation": [
    { label: "Turn Up", helperText: "High energy, competitive" },
    { label: "Cookout Approved", helperText: "Community game-day energy" },
    { label: "Family Reunion Energy", helperText: "All ages, everyone plays" },
    { label: "Neighborhood Love", helperText: "The courts / fields your block runs" },
  ],
  "Media & Creative Services": [
    { label: "Main Character Energy", helperText: "You leave looking and feeling like yourself, but seen" },
    { label: "Creative Energy", helperText: "A unique artistic vision that shows in every shot" },
    { label: "Come As You Are", helperText: "No pretense — they capture you, not a version of you" },
    { label: "For The Culture", helperText: "Understands how to tell our stories with dignity" },
    { label: "Made For Memories", helperText: "The work you'll cherish decades from now" },
    { label: "Soft Life", helperText: "Beautiful, intentional, no rush" },
    { label: "Grown & Sexy", helperText: "Polished, elevated, artistic" },
  ],
  "Faith & Spirituality": [
    { label: "Sunday Best", helperText: "Come as you are, your best" },
    { label: "Praise Break Energy", helperText: "The spirit is active here" },
    { label: "Community Healing", helperText: "A house of restoration" },
    { label: "Family Reunion Energy", helperText: "Multigenerational, welcoming" },
    { label: "History Lives Here", helperText: "Decades of community legacy" },
  ],
};

/** Flat list of every vibe label across all categories — for validation */
export const ALL_VIBE_LABELS: string[] = [
  ...new Set(Object.values(VIBES_BY_CATEGORY).flatMap((v) => v.map((x) => x.label))),
];

/** Categories where vibes are shown. Professional service categories use endorsements only. */
export const VIBE_ELIGIBLE_CATEGORIES: string[] = [
  "Food & Drink",
  "Beauty & Personal Care",
  "Health & Wellness",
  "Shopping & Retail",
  "Travel & Hospitality",
  "Arts, Culture & Entertainment",
  "Events & Celebrations",
  "Education & Learning",
  "Children & Family",
  "Sports & Recreation",
  "Faith & Spirituality",
  "Agriculture & Specialty Producers",
  "Media & Creative Services",
];

/** Returns true if the given category supports vibe tagging */
export function isVibeEligible(category: string): boolean {
  return VIBE_ELIGIBLE_CATEGORIES.includes(category);
}
