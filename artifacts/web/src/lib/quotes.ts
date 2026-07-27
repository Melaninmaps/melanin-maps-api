export const BRAND_QUOTES = [
  "Connection is our destination.",
  "We're building the community we wish already existed.",
  "Every recommendation is an opportunity to change someone's story.",
  "Helping people find more than a place—helping them find their people.",
  "Because every journey deserves a community.",
  "Connection is the map. Community is the destination.",
  "Building relationships, one recommendation at a time.",
  "Discover more. Belong deeper.",
  "Great communities aren't found. They're built.",
  "Where connection leads, community follows.",
  "We're not just mapping places—we're mapping opportunity, community, and belonging.",
  "Communities thrive when people know where to find one another.",
  "No matter where life takes you, community should never feel out of reach.",
  "Every search is an opportunity. Every recommendation is an act of support.",
  "Wherever you land, we'll help you connect deeper.",
  "Support isn't just something we say—it's something we help people do.",
  "Your supporters become your ambassadors.",
  "Relocation is more than changing your address. It's finding your people.",
  "The best journeys begin with trusted community insight.",
  "When one community grows stronger, we all grow stronger.",
  "Helping businesses discover that people are already looking for them.",
  "Wherever our communities go, connection should follow.",
  "A global community built on local relationships.",
] as const;

export function getRandomQuote(): string {
  return BRAND_QUOTES[Math.floor(Math.random() * BRAND_QUOTES.length)];
}

export function getDailyQuote(): string {
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return BRAND_QUOTES[dayIndex % BRAND_QUOTES.length];
}
