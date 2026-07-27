export const UNIVERSAL_CAPTIONS: string[] = [
  "Above & Beyond",
  "Hidden Gem",
  "Community Favorite",
  "Worth Every Visit",
  "Exceptional Service",
  "Highly Recommend",
  "Family Friendly",
  "Solo Friendly",
  "Safe Space",
  "Five-Star Experience",
  "Black Excellence",
  "I'll Be Back",
  "Must Visit",
  "Truly Welcoming",
];

const FOOD_CAPTIONS: string[] = [
  "Must Support",
  "It's a Vibe",
  "Worth the Wait",
  "Date Night Approved",
  "Family Favorite",
  "Brunch Goals",
  "Comfort Food Done Right",
  "Portions Don't Disappoint",
  "Save Room for Dessert",
  "Great Hospitality",
  "Great for Solo Dining",
];

const BEAUTY_CAPTIONS: string[] = [
  "Left Feeling Amazing",
  "Book Them Now",
  "They Understood the Assignment",
  "Hair Goals Achieved",
  "Patient & Professional",
  "Gentle Hands",
  "Natural Hair Friendly",
  "Luxury Experience",
  "Attention to Detail",
  "Worth Every Penny",
];

const HEALTH_CAPTIONS: string[] = [
  "Truly Listened",
  "Compassionate Care",
  "Made Me Feel Comfortable",
  "Explained Everything Clearly",
  "Respectful & Professional",
  "Didn't Feel Rushed",
  "Great Bedside Manner",
  "Easy to Schedule",
  "I Trust This Provider",
  "Gentle Care",
  "Anxiety-Friendly",
  "Kid Approved",
  "Pain-Free Experience",
  "Thorough Cleaning",
  "Explained Every Step",
  "Modern Office",
  "Positive Energy",
  "Motivating Coach",
  "Inclusive Environment",
  "Beginner Friendly",
  "Challenging in the Best Way",
  "Worth Every Session",
  "Great Community",
];

const LEGAL_CAPTIONS: string[] = [
  "Explained Everything Clearly",
  "Professional Representation",
  "Responsive",
  "Honest Advice",
  "Kept Me Informed",
  "Highly Knowledgeable",
  "Compassionate",
  "Results Driven",
];

const FINANCE_CAPTIONS: string[] = [
  "Built My Confidence",
  "Explained It Clearly",
  "Trustworthy",
  "Patient Teacher",
  "Helped Me Plan Ahead",
  "Responsive",
];

const RETAIL_CAPTIONS: string[] = [
  "Great Selection",
  "Excellent Customer Service",
  "Will Definitely Return",
  "Unique Finds",
  "Shop Local",
  "Great Prices",
  "Clean & Organized",
  "Hidden Treasure",
  "Stress-Free Experience",
  "Local Expert",
  "Great Communicator",
  "Found Exactly What I Needed",
  "Went Above and Beyond",
  "Community Knowledge",
  "Highly Responsive",
  "Trusted Advisor",
];

const HOME_SERVICES_CAPTIONS: string[] = [
  "Showed Up On Time",
  "Honest Pricing",
  "Quality Work",
  "Clean & Professional",
  "Problem Solved",
  "Reliable",
  "Highly Skilled",
  "Would Hire Again",
];

export const EMPLOYER_CAPTIONS: string[] = [
  "Great Leadership",
  "Growth Opportunities",
  "Inclusive Workplace",
  "Supportive Team",
  "Great Work-Life Balance",
  "Career Builder",
  "Employee Focused",
  "Would Work Here Again",
  "Transparent Management",
  "Mentorship Available",
];

const CATEGORY_MAP: Record<string, string[]> = {
  Food: FOOD_CAPTIONS,
  Beauty: BEAUTY_CAPTIONS,
  Health: HEALTH_CAPTIONS,
  Legal: LEGAL_CAPTIONS,
  Finance: FINANCE_CAPTIONS,
  Retail: RETAIL_CAPTIONS,
  Tech: HOME_SERVICES_CAPTIONS,
  Services: HOME_SERVICES_CAPTIONS,
};

export function getCaptionsForBusiness(category: string, isEmployerReview = false): string[] {
  const specific = isEmployerReview ? EMPLOYER_CAPTIONS : (CATEGORY_MAP[category] ?? []);
  const combined = [...specific];
  for (const c of UNIVERSAL_CAPTIONS) {
    if (!combined.includes(c)) combined.push(c);
  }
  return combined;
}
