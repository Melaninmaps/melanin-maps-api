export type LibraryResearchPath = Readonly<{
  id: string;
  title: string;
  question: string;
}>;

export type LibraryResearchCollection = Readonly<{
  slug: string;
  title: string;
  summary: string;
  iconKey: string;
  mobileIcon: string;
  defaultQuestion: string;
  paths: readonly LibraryResearchPath[];
}>;

/**
 * Canonical Library navigation-to-research contract. Web and mobile consume this
 * manifest through GET /api/library/research-paths so a collection activation
 * always carries an intentional question into the same approved-first,
 * source-governed research path without asking the member to type it again.
 */
export const LIBRARY_RESEARCH_PATH_MANIFEST: Readonly<{
  collections: readonly LibraryResearchCollection[];
}> = {
  collections: [
    {
      slug: "culture-history-identity",
      title: "Culture, History & Identity",
      summary: "Diaspora histories, local Black history, HBCU traditions, heritage sites, language, family stories, and cultural movements.",
      iconKey: "landmark",
      mobileIcon: "🏛️",
      defaultQuestion: "Culture, History & Identity",
      paths: [
        { id: "history-of-the-diaspora", title: "History of the Diaspora", question: "Black diaspora history" },
        { id: "foundational-black-american-history", title: "Foundational Black American History", question: "African American history" },
        { id: "african-caribbean-afro-latino-cultures", title: "African, Caribbean & Afro-Latino Cultures", question: "African Caribbean Afro-Latino cultures" },
        { id: "local-black-history-by-city", title: "Local Black History by City", question: "local Black history" },
        { id: "hbcus-alumni-traditions", title: "HBCUs & Alumni Traditions", question: "HBCU traditions" },
        { id: "historic-neighborhoods-heritage-sites", title: "Historic Neighborhoods & Heritage Sites", question: "historic neighborhoods heritage sites" },
        { id: "genealogy-family-history", title: "Genealogy & Family History", question: "genealogy family history" },
        { id: "black-inventors-leaders-movements", title: "Black Inventors, Leaders & Movements", question: "Black inventors leaders movements" },
      ],
    },
    {
      slug: "food-music-culture",
      title: "Food, Music & Culture",
      summary: "Regional food traditions, African and Afro-Latino cuisines, books, film, fashion, art, music, and cultural celebrations.",
      iconKey: "music",
      mobileIcon: "🎶",
      defaultQuestion: "Food, Music & Culture",
      paths: [
        { id: "regional-black-food-traditions", title: "Regional Black Food Traditions", question: "regional Black food traditions" },
        { id: "african-caribbean-afro-latino-cuisines", title: "African, Caribbean & Afro-Latino Cuisines", question: "African Caribbean Afro-Latino cuisines" },
        { id: "recipes-stories", title: "Recipes & the Stories Behind Them", question: "food history recipes" },
        { id: "black-music-history", title: "Black Music History", question: "Black music history" },
        { id: "hip-hop-jazz-gospel-r-and-b", title: "Hip-Hop, Jazz, Gospel & R&B", question: "hip hop jazz gospel R&B history" },
        { id: "books-films-podcasts-documentaries", title: "Books, Films, Podcasts & Documentaries", question: "Black books films documentaries" },
        { id: "fashion-beauty-design", title: "Fashion, Beauty & Design", question: "Black fashion beauty design history" },
        { id: "festivals-cultural-celebrations", title: "Festivals & Cultural Celebrations", question: "cultural festivals celebrations" },
      ],
    },
    {
      slug: "travel-the-diaspora",
      title: "Travel the Diaspora",
      summary: "City orientation, cultural etiquette, travel preparation, multigenerational trips, and places that help people feel represented.",
      iconKey: "plane",
      mobileIcon: "✈️",
      defaultQuestion: "Travel the Diaspora",
      paths: [
        { id: "diaspora-travel-destinations", title: "Diaspora Travel Destinations", question: "diaspora travel destinations" },
        { id: "city-guides-real-life", title: "City Guides Built Around Real Life", question: "city orientation moving travel" },
        { id: "traveling-while-black-or-brown", title: "Traveling While Black or Brown", question: "travel rights safety preparation" },
        { id: "accessible-multigenerational-travel", title: "Accessible & Multigenerational Travel", question: "accessible multigenerational travel" },
        { id: "solo-travel", title: "Solo Travel", question: "solo travel preparation" },
        { id: "black-owned-hotels-travel-services", title: "Black-Owned Hotels & Travel Services", question: "Black owned travel services" },
        { id: "international-customs-cultural-connections", title: "International Customs & Cultural Connections", question: "international customs cultural connections" },
      ],
    },
    {
      slug: "money-business-ownership",
      title: "Money, Business & Ownership",
      summary: "Banking, credit, homeownership, investing, entrepreneurship, intellectual property, contracts, and generational wealth.",
      iconKey: "briefcase-business",
      mobileIcon: "📈",
      defaultQuestion: "Money, Business & Ownership",
      paths: [
        { id: "starting-growing-business", title: "Starting & Growing a Business", question: "starting growing business" },
        { id: "grants-funding-capital", title: "Grants, Funding & Capital", question: "business grants funding capital" },
        { id: "business-credit", title: "Business Credit", question: "building business credit" },
        { id: "homeownership", title: "Homeownership", question: "buying a home mortgages" },
        { id: "saving-investing", title: "Saving & Investing", question: "saving investing basics" },
        { id: "estate-planning-generational-wealth", title: "Estate Planning & Generational Wealth", question: "estate planning generational wealth" },
        { id: "intellectual-property", title: "Intellectual Property", question: "intellectual property copyright trademark" },
        { id: "contracting-government-opportunities", title: "Contracting & Government Opportunities", question: "government contracting small business" },
      ],
    },
    {
      slug: "health-wellness-care",
      title: "Health & Wellness",
      summary: "Culturally responsive care, reproductive health, mental wellness, nutrition, movement, hair and skin care, disability, and advocacy.",
      iconKey: "heart-pulse",
      mobileIcon: "💛",
      defaultQuestion: "Health & Wellness",
      paths: [
        { id: "culturally-responsive-doctors", title: "Culturally Responsive Doctors", question: "culturally responsive health care" },
        { id: "maternal-reproductive-health", title: "Maternal & Reproductive Health", question: "Black maternal reproductive health" },
        { id: "mental-health-therapy", title: "Mental Health & Therapy", question: "mental health therapy" },
        { id: "mens-health", title: "Men’s Health", question: "men health" },
        { id: "childrens-family-health", title: "Children’s & Family Health", question: "children family health" },
        { id: "disability-access", title: "Disability & Access", question: "disability health access" },
        { id: "nutrition-movement", title: "Nutrition & Movement", question: "nutrition movement" },
        { id: "hair-skin-health", title: "Hair & Skin Health", question: "hair skin health" },
      ],
    },
    {
      slug: "education-careers",
      title: "Education & Careers",
      summary: "HBCUs, scholarships, trade schools, certifications, career pathways, technology skills, mentorship, and workplace growth.",
      iconKey: "graduation-cap",
      mobileIcon: "🎓",
      defaultQuestion: "Education & Careers",
      paths: [
        { id: "scholarships-financial-aid", title: "Scholarships & Financial Aid", question: "scholarships financial aid FAFSA" },
        { id: "hbcus-colleges-trade-schools", title: "HBCUs, Colleges & Trade Schools", question: "HBCU college trade school" },
        { id: "career-pathways-certifications", title: "Career Pathways & Certifications", question: "career pathways certifications" },
        { id: "technology-ai-skills", title: "Technology & AI Skills", question: "technology AI skills careers" },
        { id: "mentorship-professional-networks", title: "Mentorship & Professional Networks", question: "mentorship professional networks" },
        { id: "internships-youth-opportunities", title: "Internships & Youth Opportunities", question: "internships youth opportunities" },
        { id: "career-changes-returning-school", title: "Career Changes & Returning to School", question: "career change returning school" },
      ],
    },
    {
      slug: "family-love-community",
      title: "Family, Love & Community",
      summary: "Parenting, relationships, faith, LGBTQ+ life, elder care, friendship, identity, and building community after moving.",
      iconKey: "users",
      mobileIcon: "🤝",
      defaultQuestion: "Family, Love & Community",
      paths: [
        { id: "parenting-across-generations", title: "Parenting Across Generations", question: "parenting family" },
        { id: "dating-relationships-communication", title: "Dating, Relationships & Communication", question: "healthy relationships communication" },
        { id: "caring-aging-family", title: "Caring for Aging Family Members", question: "family caregiving aging" },
        { id: "faith-spiritual-communities", title: "Faith & Spiritual Communities", question: "faith spiritual communities" },
        { id: "lgbtq-community-resources", title: "LGBTQ+ Community Resources", question: "LGBTQ community resources" },
        { id: "building-community-after-moving", title: "Building Community After Moving", question: "building community after moving" },
        { id: "conflict-boundaries-emotional-wellness", title: "Conflict, Boundaries & Emotional Wellness", question: "boundaries emotional wellness" },
      ],
    },
    {
      slug: "entertainment-whats-happening",
      title: "Entertainment & What’s Happening",
      summary: "Festivals, homecomings, nightlife, concerts, exhibits, family activities, and community gatherings.",
      iconKey: "sparkles",
      mobileIcon: "✨",
      defaultQuestion: "Entertainment & What’s Happening",
      paths: [
        { id: "festivals-homecomings", title: "Festivals & Homecomings", question: "festivals homecomings" },
        { id: "concerts-exhibits-cultural-programs", title: "Concerts, Exhibits & Cultural Programs", question: "concerts exhibits cultural programs" },
        { id: "family-activities", title: "Family Activities", question: "family activities" },
        { id: "nightlife-entertainment", title: "Nightlife & Entertainment", question: "nightlife entertainment" },
        { id: "artists-creators-cultural-icons", title: "Artists, Creators & Cultural Icons", question: "artists creators cultural icons" },
      ],
    },
    {
      slug: "life-in-your-city",
      title: "Life in Your City",
      summary: "Local history, cultural neighborhoods, organizations, traditions, practical orientation, and guides shaped by real life.",
      iconKey: "map-pin",
      mobileIcon: "📍",
      defaultQuestion: "Life in Your City",
      paths: [
        { id: "whats-happening-city", title: "What’s Happening in Your City", question: "city current events culture" },
        { id: "local-history-cultural-neighborhoods", title: "Local History & Cultural Neighborhoods", question: "local history cultural neighborhoods" },
        { id: "community-organizations", title: "Community Organizations", question: "community organizations" },
        { id: "volunteer-public-participation", title: "Volunteer & Public Participation", question: "volunteer public participation" },
        { id: "professional-social-groups", title: "Professional & Social Groups", question: "professional social groups" },
        { id: "family-life-new-city", title: "Family Life in a New City", question: "moving new city family" },
      ],
    },
    {
      slug: "technology-future",
      title: "Technology & the Future",
      summary: "AI, digital skills, online safety, Black innovators, technology careers, and tools for building businesses.",
      iconKey: "cpu",
      mobileIcon: "💻",
      defaultQuestion: "Technology & the Future",
      paths: [
        { id: "ai-skills-responsible-use", title: "AI Skills & Responsible Use", question: "AI responsible use" },
        { id: "digital-privacy-online-safety", title: "Digital Privacy & Online Safety", question: "digital privacy online safety" },
        { id: "technology-careers-training", title: "Technology Careers & Training", question: "technology careers training" },
        { id: "black-innovators-technology", title: "Black Innovators in Technology", question: "Black innovators technology" },
        { id: "digital-tools-business", title: "Digital Tools for Business", question: "digital tools small business" },
      ],
    },
    {
      slug: "know-your-rights",
      title: "Know Your Rights",
      summary: "Clear, source-cited information about discrimination, consumer protection, education, healthcare, work, and public-space rights.",
      iconKey: "scale",
      mobileIcon: "⚖️",
      defaultQuestion: "Know Your Rights",
      paths: [
        { id: "recognizing-reporting-discrimination", title: "Recognizing & Reporting Discrimination", question: "report discrimination civil rights" },
        { id: "workplace-rights", title: "Workplace Rights", question: "workplace rights" },
        { id: "health-care-advocacy", title: "Health-Care Advocacy", question: "health care advocacy rights" },
        { id: "school-education-rights", title: "School & Education Rights", question: "school education rights" },
        { id: "consumer-protection", title: "Consumer Protection", question: "consumer protection" },
        { id: "rights-digital-privacy-online-safety", title: "Digital Privacy & Online Safety", question: "digital privacy online safety" },
      ],
    },
    {
      slug: "resources-support",
      title: "Resources & Support",
      summary: "Housing, utility, food, recovery, and urgent resources remain easy to find without defining the Library’s opening identity.",
      iconKey: "lifebuoy",
      mobileIcon: "🧭",
      defaultQuestion: "Resources & Support",
      paths: [
        { id: "housing-utility-support", title: "Housing & Utility Support", question: "housing utility support" },
        { id: "food-family-resources", title: "Food & Family Resources", question: "food family resources" },
        { id: "disaster-recovery", title: "Disaster Recovery", question: "disaster recovery assistance" },
        { id: "emergency-crisis-resources", title: "Emergency & Crisis Resources", question: "emergency crisis resources" },
      ],
    },
  ],
};

export function libraryResearchCollection(
  slug: string,
): LibraryResearchCollection | null {
  return LIBRARY_RESEARCH_PATH_MANIFEST.collections.find(
    (collection) => collection.slug === slug,
  ) ?? null;
}
