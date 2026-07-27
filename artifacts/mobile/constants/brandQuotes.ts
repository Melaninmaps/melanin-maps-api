export interface BrandQuote {
  text: string;
  category: QuoteCategory;
}

export type QuoteCategory =
  | "mission"
  | "home"
  | "community"
  | "business"
  | "travel"
  | "safety"
  | "kinfolk"
  | "growth"
  | "diaspora";

export const BRAND_QUOTES: Record<QuoteCategory, BrandQuote[]> = {
  mission: [
    { text: "Map Your Life. Connect Deeper.", category: "mission" },
    { text: "We're not just mapping places—we're mapping opportunity, community, and belonging.", category: "mission" },
    { text: "Helping people discover businesses, build connections, and feel at home wherever life takes them.", category: "mission" },
    { text: "Technology should bring people closer to community, not further from it.", category: "mission" },
    { text: "Connection is our destination.", category: "mission" },
    { text: "Connection is the map. Community is the destination.", category: "mission" },
    { text: "Discover more. Belong deeper.", category: "mission" },
    { text: "Helping people find more than a place—helping them find their people.", category: "mission" },
  ],
  home: [
    { text: "Sometimes we travel to discover new places. Sometimes we simply need something that reminds us of home.", category: "home" },
    { text: "No matter where life takes you, community should never feel out of reach.", category: "home" },
    { text: "Because home isn't always a place. Sometimes it's the people, the culture, and the businesses that make you feel like you belong.", category: "home" },
    { text: "Wherever you land, we'll help you connect deeper.", category: "home" },
    { text: "Because every journey deserves a community.", category: "home" },
  ],
  community: [
    { text: "We're building more than an app—we're building a community that grows stronger every time someone chooses to support one another.", category: "community" },
    { text: "Every search is an opportunity. Every recommendation is an act of support. Every connection strengthens our community.", category: "community" },
    { text: "Communities thrive when people know where to find one another.", category: "community" },
    { text: "Support isn't just something we say—it's something we help people do.", category: "community" },
    { text: "We're building the community we wish already existed.", category: "community" },
    { text: "Every recommendation is an opportunity to change someone's story.", category: "community" },
    { text: "Building relationships, one recommendation at a time.", category: "community" },
    { text: "Great communities aren't found. They're built.", category: "community" },
    { text: "Where connection leads, community follows.", category: "community" },
  ],
  business: [
    { text: "We're not replacing your website or social media. We're helping the right people discover them.", category: "business" },
    { text: "Helping businesses discover that people are already looking for them.", category: "business" },
    { text: "We're not just helping customers find businesses—we're helping businesses find their community.", category: "business" },
    { text: "Your supporters become your ambassadors.", category: "business" },
    { text: "Visibility isn't just about reaching new customers. It's about making it easier for the people who already believe in you to continue supporting you.", category: "business" },
    { text: "Building relationships, one recommendation at a time.", category: "business" },
  ],
  travel: [
    { text: "Know before you go.", category: "travel" },
    { text: "Move with confidence.", category: "travel" },
    { text: "The best journeys begin with trusted community insight.", category: "travel" },
    { text: "Relocation is more than changing your address. It's finding your people.", category: "travel" },
    { text: "Helping you feel at home before you arrive.", category: "travel" },
    { text: "Because every journey deserves a community.", category: "travel" },
  ],
  safety: [
    { text: "Feeling informed creates confidence. Feeling connected creates peace of mind.", category: "safety" },
    { text: "Safety begins with shared experiences.", category: "safety" },
    { text: "Community knowledge helps people make better decisions.", category: "safety" },
    { text: "Your experiences today help someone else tomorrow.", category: "safety" },
  ],
  kinfolk: [
    { text: "Technology should adapt to people—not the other way around.", category: "kinfolk" },
    { text: "Every journey is personal. Your AI experience should be too.", category: "kinfolk" },
    { text: "Sometimes you need guidance. Sometimes you need encouragement. Sometimes you simply need something that feels like home.", category: "kinfolk" },
    { text: "KinfolkAI doesn't just answer questions—it helps you navigate life.", category: "kinfolk" },
  ],
  growth: [
    { text: "Community feedback should inspire growth, not fear.", category: "growth" },
    { text: "Helping businesses become stronger through meaningful community insight.", category: "growth" },
    { text: "We're not collecting reviews. We're creating opportunities for growth.", category: "growth" },
    { text: "Every piece of feedback is an opportunity to build something better.", category: "growth" },
  ],
  diaspora: [
    { text: "Wherever our communities go, connection should follow.", category: "diaspora" },
    { text: "A global community built on local relationships.", category: "diaspora" },
    { text: "Supporting the diaspora means helping people find opportunity, culture, and connection wherever they are.", category: "diaspora" },
    { text: "When one community grows stronger, we all grow stronger.", category: "diaspora" },
    { text: "Helping people feel at home—before they arrive, while they're there, and long after they've settled in.", category: "diaspora" },
  ],
};

export function getDailyQuote(category: QuoteCategory, offset: number = 0): BrandQuote {
  const quotes = BRAND_QUOTES[category];
  const dayIndex = Math.floor(Date.now() / 86_400_000);
  return quotes[(dayIndex + offset) % quotes.length];
}

export function getDailyQuoteText(category: QuoteCategory, offset: number = 0): string {
  return getDailyQuote(category, offset).text;
}
