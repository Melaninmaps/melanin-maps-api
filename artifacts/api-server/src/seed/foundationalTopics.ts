export type FoundationalTopicSeed = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  iconKey: string;
  featured: boolean;
  sortOrder: number;
  domain: string;
};

// This file is the recoverable source of truth.
// The database is the runtime copy. Never let an empty Library reach production.
// domain must match the NOT NULL library_topics.domain column (legacy values: medical, legal, financial, education, stem, history, general)
type TopicRow = readonly [slug: string, title: string, summary: string, iconKey: string, featured: boolean, domain: string];

const TOPIC_ROWS: TopicRow[] = [
  ["housing-home",                            "Housing & Home",                                "Renting, homeownership, neighborhoods, home services, and housing rights.",                              "housing",     true,  "general"],
  ["education-learning",                      "Education & Learning",                          "Schools, HBCUs, scholarships, adult learning, and pathways forward.",                                    "education",   true,  "education"],
  ["trades-skills-certifications",            "Trades, Skills & Certifications",               "Apprenticeships, skilled trades, certifications, and career pathways.",                                  "home-services", true, "education"],
  ["health-wellness",                         "Health & Wellness",                             "Culturally responsive health information, care, wellness, and support.",                                 "health",      true,  "medical"],
  ["money-economic-mobility",                 "Money & Economic Mobility",                     "Credit, banking, ownership, financial literacy, and wealth-building.",                                   "money",       true,  "financial"],
  ["careers-professional-life",               "Careers & Professional Life",                   "Workplace life, advancement, mentorship, and professional development.",                                 "career",      true,  "general"],
  ["business-entrepreneurship",               "Business & Entrepreneurship",                   "Starting, operating, funding, growing, and sustaining community businesses.",                            "business",    true,  "financial"],
  ["community-resources-help",                "Community Resources & Help",                    "Local assistance, mutual aid, grants, legal aid, transportation, and childcare.",                        "community",   true,  "general"],
  ["culture-heritage",                        "Culture & Heritage",                            "Traditions, identity, diaspora, cultural preservation, and shared history.",                             "culture",     false, "history"],
  ["places-our-history",                      "Places & Our History",                          "Historic sites, neighborhoods, HBCUs, migration routes, and living landmarks.",                          "culture",     false, "history"],
  ["travel-exploration",                      "Travel & Exploration",                          "Cultural travel, safety, etiquette, local discovery, and meaningful journeys.",                          "travel",      false, "general"],
  ["living-relocation",                       "Living & Relocation",                           "Moving, community fit, local culture, transportation, schools, and daily life.",                         "housing",     false, "general"],
  ["family-relationships",                    "Family & Relationships",                        "Parenting, caregiving, elders, chosen family, and multigenerational life.",                              "community",   false, "general"],
  ["beauty-hair-personal-care",               "Beauty, Hair & Personal Care",                  "Hair, skin, grooming, traditions, specialists, and product education.",                                  "beauty",      false, "medical"],
  ["food-culinary-culture",                   "Food & Culinary Culture",                       "Food history, restaurants, recipes, traditions, and culinary businesses.",                               "food",        false, "history"],
  ["faith-spirituality-community-institutions","Faith, Spirituality & Community Institutions", "Faith communities, spiritual traditions, service organizations, and history.",                            "community",   false, "history"],
  ["arts-music-creative-culture",             "Arts, Music & Creative Culture",                "Music, visual art, literature, fashion, film, dance, and cultural movements.",                           "culture",     false, "history"],
  ["entertainment-social-life",               "Entertainment & Social Life",                   "Nightlife, festivals, celebrations, social spaces, and community events.",                               "travel",      false, "general"],
  ["community-connection",                    "Community & Connection",                        "Organizations, networks, mutual aid, volunteering, and affinity groups.",                                "community",   false, "general"],
  ["safety-navigating-world",                 "Safety & Navigating the World",                 "Travel safety, neighborhood awareness, digital safety, and emergency resources.",                        "safety",      false, "general"],
  ["rights-advocacy-civic-life",              "Rights, Advocacy & Civic Life",                 "Civil rights, voting, consumer rights, discrimination information, and advocacy.",                       "legal",       false, "legal"],
  ["legal-information-resources",             "Legal Information & Resources",                 "General legal education, common processes, legal aid, and finding counsel.",                             "legal",       false, "legal"],
  ["parenting-youth-future-generations",      "Parenting, Youth & Future Generations",         "Youth programs, mentoring, identity, safety, and college preparation.",                                  "education",   false, "education"],
  ["lgbtqia-life-community",                  "LGBTQIA+ Life & Community",                     "Resources, history, family, health, travel, businesses, and community life.",                            "community",   false, "general"],
  ["disability-accessibility",                "Disability & Accessibility",                    "Accessible places, travel, work, rights, and community resources.",                                      "safety",      false, "general"],
  ["immigration-migration-diaspora-life",     "Immigration, Migration & Diaspora Life",        "Migration histories, adaptation, diaspora connections, and community resources.",                        "travel",      false, "history"],
  ["people-stories-living-memory",            "People, Stories & Living Memory",               "Oral histories, elders, leaders, alumni stories, memorials, and living memory.",                        "culture",     false, "history"],
  ["current-issues-community-conversations",  "Current Issues & Community Conversations",      "Current community issues, context, resources, and continuing conversation.",                             "community",   false, "general"],
];

export const FOUNDATIONAL_TOPICS: FoundationalTopicSeed[] = TOPIC_ROWS.map(
  ([slug, title, summary, iconKey, featured, domain], index) => ({
    id: `10000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    slug,
    title,
    summary,
    iconKey,
    featured,
    sortOrder: (index + 1) * 10,
    domain,
  }),
);

export const FOUNDATION_SEED_VERSION = "2026-08-18.1";

export const REQUIRED_FEATURED_SLUGS = [
  "housing-home",
  "education-learning",
  "trades-skills-certifications",
  "health-wellness",
  "money-economic-mobility",
  "careers-professional-life",
  "business-entrepreneurship",
  "community-resources-help",
];
