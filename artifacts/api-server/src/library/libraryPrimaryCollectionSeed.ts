import type { LibraryStarterTopic } from "./libraryStarterTopicSeed";

/**
 * The Library's opening shelf represents whole lives: history, culture, joy,
 * opportunity, health, family, and rights. Each collection creates a linked,
 * source-governed long-form entry; urgent support stays easy to find without
 * defining the first experience.
 */
export const LIBRARY_PRIMARY_COLLECTION_TOPICS: readonly LibraryStarterTopic[] = [
  {
    slug: "culture-history-identity", title: "Culture, History & Identity", domain: "history", iconKey: "landmark", sortOrder: -12, isFeatured: true,
    summary: "Explore Black, African, Caribbean, Afro-Latino, and other diaspora histories; local memory; HBCU traditions; heritage sites; family stories; and cultural movements.",
    sourceStandard: "Use archives, museums, libraries, universities, and recognized cultural institutions. Separate documented history from interpretation and link the underlying collection or scholarship.",
    safetyNotes: "Do not flatten distinct communities into one story, infer a member's identity, or present a contested interpretation as settled fact.",
    candidateSources: [
      { url: "https://www.archives.gov/news/topics/african-american-history", publisher: "U.S. National Archives", purpose: "archival research pathways and primary records documenting African American history." },
      { url: "https://nmaahc.si.edu/", publisher: "Smithsonian National Museum of African American History and Culture", purpose: "museum collections, exhibitions, and learning resources for documented history and culture." },
    ],
    nextBricks: [
      { title: "Local Black history by city", reason: "moves from a broad history question to a place-specific inquiry." },
      { title: "HBCUs and alumni traditions", reason: "connects institutional history with student, alumni, and community learning." },
      { title: "Genealogy and family history", reason: "supports a documented family-history search." },
    ],
  },
  {
    slug: "food-music-culture", title: "Food, Music & Culture", domain: "history", iconKey: "music", sortOrder: -11, isFeatured: true,
    summary: "Explore regional foodways, African, Caribbean, and Afro-Latino cuisines, music, books, film, fashion, art, and celebrations with history, credit, and context.",
    sourceStandard: "Use museums, libraries, cultural institutions, artist archives, university collections, and credited creator sources. Preserve attribution for recipes, recordings, images, and stories.",
    safetyNotes: "Do not treat cuisine, accent, neighborhood, or imagery as proof of a person’s identity or a business’s ownership.",
    candidateSources: [
      { url: "https://folkways.si.edu/", publisher: "Smithsonian Folkways Recordings", purpose: "curated recordings, essays, and educational materials about music and culture." },
      { url: "https://www.loc.gov/collections/", publisher: "Library of Congress", purpose: "primary collections for music, literature, film, and cultural history." },
    ],
    nextBricks: [
      { title: "Regional food traditions", reason: "helps explore a region and credited sources in more depth." },
      { title: "Music history and cultural movements", reason: "builds from a genre or artist question to documented archives." },
      { title: "Books, films, podcasts, and documentaries", reason: "supports a researched watch, read, or listen path." },
    ],
  },
  {
    slug: "travel-the-diaspora", title: "Travel the Diaspora", domain: "general", iconKey: "plane", sortOrder: -10, isFeatured: true,
    summary: "Plan travel with cultural context, accessibility and multigenerational considerations, official travel information, and room for a member’s own interests and comfort.",
    sourceStandard: "Use current government travel advisories, transportation and accessibility sources, destination cultural institutions, and reliable local public information. Date-check time-sensitive material.",
    safetyNotes: "Do not guarantee that a destination, business, route, or lodging is safe, welcoming, accessible, affordable, or available.",
    candidateSources: [
      { url: "https://travel.state.gov/content/travel/en/international-travel.html", publisher: "U.S. Department of State", purpose: "official international travel preparation and advisory information." },
      { url: "https://www.transportation.gov/individuals/aviation-consumer-protection", publisher: "U.S. Department of Transportation", purpose: "consumer information for air travel and accessibility-related questions." },
    ],
    nextBricks: [
      { title: "Accessible and multigenerational travel", reason: "helps plan for mobility, age, and support needs without assuming them." },
      { title: "Local culture, heritage, and city orientation", reason: "connects a trip to locally grounded history and context." },
      { title: "International customs and cultural connections", reason: "supports preparation for a specific country or community." },
    ],
  },
  {
    slug: "money-business-ownership", title: "Money, Business & Ownership", domain: "financial", iconKey: "briefcase-business", sortOrder: -9, isFeatured: true,
    summary: "Start with banking, credit, homeownership, investing, entrepreneurship, intellectual property, contracts, procurement, and long-term wealth-building questions.",
    sourceStandard: "Prioritize official consumer-finance, tax, business, procurement, and intellectual-property sources. Explain concepts without selecting an investment, loan, entity, tax treatment, legal strategy, or provider.",
    safetyNotes: "This is educational information, not individualized financial, tax, investment, or legal advice. Do not promise funding, approval, a return, or a business outcome.",
    candidateSources: [
      { url: "https://www.consumerfinance.gov/consumer-tools/", publisher: "Consumer Financial Protection Bureau", purpose: "official consumer tools for banking, credit, lending, and financial decisions." },
      { url: "https://www.sba.gov/business-guide", publisher: "U.S. Small Business Administration", purpose: "official starting points for planning, launching, managing, and growing a business." },
      { url: "https://www.uspto.gov/", publisher: "U.S. Patent and Trademark Office", purpose: "official intellectual-property information and filing pathways." },
    ],
    nextBricks: [
      { title: "Building business credit", reason: "separates business-credit education from personal credit decisions." },
      { title: "Finding grants and funding", reason: "helps assess funding sources without promising eligibility." },
      { title: "Contracting and government opportunities", reason: "opens a research path for procurement and business growth." },
    ],
  },
  {
    slug: "health-wellness-care", title: "Health & Wellness", domain: "medical", iconKey: "heart-pulse", sortOrder: -8, isFeatured: true,
    summary: "Find source-cited information on culturally responsive care, reproductive health, mental wellness, family health, disability, nutrition, movement, hair and skin care, and self-advocacy.",
    sourceStandard: "Use public-health agencies, peer-reviewed research, accredited medical institutions, and recognized clinical guidance. Link sources and distinguish general education from diagnosis or treatment.",
    safetyNotes: "This is not medical advice or emergency care. Do not diagnose, recommend medication changes, delay urgent evaluation, or claim a provider is safe without documented evidence.",
    candidateSources: [
      { url: "https://www.hhs.gov/black-history-month/reading-list/index.html", publisher: "U.S. Department of Health and Human Services", purpose: "health-literacy and culturally appropriate-care reading materials focused on Black and African American communities." },
      { url: "https://www.cdc.gov/health-equity/", publisher: "Centers for Disease Control and Prevention", purpose: "public-health information about health equity and the conditions that shape health." },
    ],
    nextBricks: [
      { title: "Preparing for a health-care appointment", reason: "helps prepare questions, records, and communication goals." },
      { title: "Maternal and reproductive health", reason: "opens a carefully sourced topic-specific research path." },
      { title: "Mental wellness and therapy", reason: "supports an evidence-guided mental-health information search." },
    ],
  },
  {
    slug: "education-careers", title: "Education & Careers", domain: "education", iconKey: "graduation-cap", sortOrder: -7, isFeatured: true,
    summary: "Explore HBCUs, scholarships, trade schools, certifications, career pathways, technology skills, mentorship, workplace growth, internships, and returning to school.",
    sourceStandard: "Use official education, workforce, accreditation, institution, and program sources. Verify deadlines, eligibility, program status, and cost from the relevant current provider before presenting them.",
    safetyNotes: "Do not promise admission, aid, credential recognition, employment, salary, or program quality. Material facts require a current source or a clarification.",
    candidateSources: [
      { url: "https://studentaid.gov/", publisher: "Federal Student Aid", purpose: "official federal information for college planning, grants, loans, and financial aid." },
      { url: "https://www.careeronestop.org/", publisher: "CareerOneStop", purpose: "U.S. Department of Labor-supported career, training, and occupation research." },
    ],
    nextBricks: [
      { title: "HBCU planning", reason: "helps a student or family build a school-specific research path." },
      { title: "Trade schools and apprenticeships", reason: "separates skill pathways, credentials, and work-based learning questions." },
      { title: "Mentorship and professional networks", reason: "connects a career goal to relationship-building and next steps." },
    ],
  },
  {
    slug: "family-love-community", title: "Family, Love & Community", domain: "general", iconKey: "users", sortOrder: -6, isFeatured: true,
    summary: "Explore parenting, relationships, faith, LGBTQ+ life, elder care, friendship, identity, and building community after a move through reliable information and member-controlled context.",
    sourceStandard: "Use public-service sources, recognized nonprofits, peer-reviewed research, and accredited institutions. Keep advice boundaries clear, and route urgent safety concerns to appropriate immediate support.",
    safetyNotes: "Do not decide whether a relationship, family, or community is safe; do not diagnose a person; and do not pressure a member to disclose identity, faith, or family history.",
    candidateSources: [
      { url: "https://www.childwelfare.gov/", publisher: "Child Welfare Information Gateway", purpose: "federal information about child and family well-being, parenting, and family support." },
      { url: "https://acl.gov/", publisher: "Administration for Community Living", purpose: "federal information on aging, disability, caregiving, and community living." },
    ],
    nextBricks: [
      { title: "Parenting across generations", reason: "connects a family question to child and caregiver resources." },
      { title: "Caring for aging family members", reason: "supports planning and information for family caregiving." },
      { title: "Building community after moving", reason: "helps turn a new-city question into local connection research." },
    ],
  },
  {
    slug: "entertainment-whats-happening", title: "Entertainment & What’s Happening", domain: "general", iconKey: "sparkles", sortOrder: -5, isFeatured: true,
    summary: "Use the Library to understand festivals, homecomings, concerts, exhibits, family activities, nightlife, and community gatherings alongside their historical and cultural context.",
    sourceStandard: "Use official venue, public-agency, museum, university, artist, and organizer sources for time-sensitive listings. Preserve the difference between a verified event fact and a member’s personal recommendation.",
    safetyNotes: "Do not promise event availability, cost, safety, accessibility, age eligibility, or an experience. Current details must be linked to the organizer or venue.",
    candidateSources: [
      { url: "https://www.arts.gov/", publisher: "National Endowment for the Arts", purpose: "federal arts information and resources for cultural participation." },
      { url: "https://www.si.edu/visit", publisher: "Smithsonian Institution", purpose: "official museum and cultural-program information." },
    ],
    nextBricks: [
      { title: "Festivals and cultural celebrations", reason: "supports a current, organizer-linked event search." },
      { title: "Museums, monuments, and heritage sites", reason: "connects leisure plans to cultural and historical learning." },
      { title: "Family activities", reason: "helps a member clarify ages, access, budget, and location." },
    ],
  },
  {
    slug: "life-in-your-city", title: "Life in Your City", domain: "general", iconKey: "map-pin", sortOrder: -4, isFeatured: true,
    summary: "Learn a city through local history, cultural neighborhoods, organizations, traditions, practical orientation, and connections that support everyday life—not generic travel copy.",
    sourceStandard: "Use municipal agencies, public libraries, historical societies, cultural institutions, transportation agencies, universities, and named local organizations. Date-check local services and events.",
    safetyNotes: "Do not claim that a neighborhood, business, route, or institution is safe, welcoming, affordable, or suitable without evidence and context.",
    candidateSources: [
      { url: "https://www.loc.gov/local-history/", publisher: "Library of Congress", purpose: "guidance and collections that support local-history research." },
      { url: "https://www.usa.gov/local-governments", publisher: "USAGov", purpose: "official pathways to state and local government information." },
    ],
    nextBricks: [
      { title: "Moving to a new city", reason: "builds a practical orientation checklist." },
      { title: "Local history and cultural neighborhoods", reason: "narrows a city question to documented place-based context." },
      { title: "Community organizations and public participation", reason: "connects a place to civic and community life." },
    ],
  },
  {
    slug: "technology-future", title: "Technology & the Future", domain: "stem", iconKey: "cpu", sortOrder: -3, isFeatured: true,
    summary: "Explore AI, digital skills, online privacy, Black innovators, technology careers, and responsible tools for learning, work, and business creation.",
    sourceStandard: "Use government standards bodies, public-interest digital-safety sources, accredited education providers, and primary documentation. Distinguish current capability from future speculation.",
    safetyNotes: "Do not claim an automated tool is unbiased, private, accurate, safe, or appropriate for high-stakes decisions without evidence. Do not request sensitive information unnecessarily.",
    candidateSources: [
      { url: "https://www.nist.gov/itl/ai-risk-management-framework", publisher: "National Institute of Standards and Technology", purpose: "a federal framework for understanding and managing AI risks." },
      { url: "https://consumer.ftc.gov/articles/protecting-your-personal-information", publisher: "Federal Trade Commission", purpose: "consumer guidance for protecting personal information online." },
    ],
    nextBricks: [
      { title: "AI skills and responsible use", reason: "helps distinguish learning, experimentation, and high-stakes limits." },
      { title: "Digital privacy and online safety", reason: "connects a technology question to practical privacy education." },
      { title: "Technology careers and training", reason: "turns interest into an education and workforce research path." },
    ],
  },
  {
    slug: "know-your-rights", title: "Know Your Rights", domain: "legal", iconKey: "scale", sortOrder: -2, isFeatured: true,
    summary: "Find clear, source-cited starting points for discrimination, education, healthcare, work, consumer, housing, and public-space rights without replacing local legal advice.",
    sourceStandard: "Use current official agency, court, civil-rights, and consumer-protection sources. Treat procedure, deadline, and jurisdiction questions as location-specific and current.",
    safetyNotes: "This is legal information, not legal advice. Do not decide that conduct was unlawful, predict an outcome, or tell a member which legal action to take.",
    candidateSources: [
      { url: "https://www.justice.gov/crt", publisher: "U.S. Department of Justice Civil Rights Division", purpose: "official civil-rights information and enforcement pathways." },
      { url: "https://consumer.ftc.gov/", publisher: "Federal Trade Commission", purpose: "official consumer-protection information and reporting pathways." },
    ],
    nextBricks: [
      { title: "Workplace rights and career questions", reason: "separates employment issues from a general rights question." },
      { title: "Health-care advocacy", reason: "supports communication and complaint-pathway research without medical advice." },
      { title: "Documenting an incident", reason: "helps a member understand evidence-preservation questions through current sources." },
    ],
  },
  {
    slug: "resources-support", title: "Resources & Support", domain: "general", iconKey: "lifebuoy", sortOrder: -1, isFeatured: true,
    summary: "Keep housing, utility, food, disaster recovery, and urgent-service navigation available as practical support—without making crisis the definition of the community.",
    sourceStandard: "Use official government, public-benefit, and established nonprofit sources. Verify local eligibility, capacity, cost, and deadlines with the provider before presenting a current result.",
    safetyNotes: "Do not promise eligibility, benefit availability, housing, food, safety, or crisis resolution. Direct immediate emergencies to local emergency services when appropriate.",
    candidateSources: [
      { url: "https://www.usa.gov/benefits", publisher: "USAGov", purpose: "official entry point for government benefit and assistance information." },
      { url: "https://www.211.org/", publisher: "211", purpose: "community-resource navigation for local support needs." },
    ],
    nextBricks: [
      { title: "Housing and home", reason: "narrows support navigation to official housing pathways." },
      { title: "Food and family support", reason: "connects an immediate need to verified local resources." },
      { title: "Emergency and crisis resources", reason: "offers a time-sensitive route when a member identifies urgency." },
    ],
  },
] as const;
