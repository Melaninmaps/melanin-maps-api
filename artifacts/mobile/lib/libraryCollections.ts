export const LIBRARY_COLLECTION_SHELVES = [
  { title: "Culture, History & Identity", icon: "🏛️", subtopics: ["History of the Diaspora", "Foundational Black American History", "African, Caribbean & Afro-Latino Cultures", "Local Black History by City", "HBCUs & Alumni Traditions", "Genealogy & Family History"] },
  { title: "Food, Music & Culture", icon: "🎶", subtopics: ["Regional Black Food Traditions", "African, Caribbean & Afro-Latino Cuisines", "Black Music History", "Books, Films, Podcasts & Documentaries", "Fashion, Beauty & Design"] },
  { title: "Travel the Diaspora", icon: "✈️", subtopics: ["Diaspora Travel Destinations", "City Guides Built Around Real Life", "Accessible & Multigenerational Travel", "Solo Travel", "International Customs & Cultural Connections"] },
  { title: "Money, Business & Ownership", icon: "📈", subtopics: ["Starting & Growing a Business", "Grants, Funding & Capital", "Business Credit", "Homeownership", "Saving & Investing", "Intellectual Property"] },
  { title: "Health & Wellness", icon: "💛", subtopics: ["Culturally Responsive Care", "Maternal & Reproductive Health", "Mental Health & Therapy", "Men’s Health", "Children’s & Family Health", "Nutrition & Movement"] },
  { title: "Education & Careers", icon: "🎓", subtopics: ["Scholarships & Financial Aid", "HBCUs, Colleges & Trade Schools", "Career Pathways & Certifications", "Technology & AI Skills", "Mentorship & Professional Networks"] },
  { title: "Family, Love & Community", icon: "🤝", subtopics: ["Parenting Across Generations", "Dating, Relationships & Communication", "Caring for Aging Family Members", "Faith & Spiritual Communities", "LGBTQ+ Community Resources"] },
  { title: "Entertainment & What’s Happening", icon: "✨", subtopics: ["Festivals & Homecomings", "Concerts, Exhibits & Cultural Programs", "Family Activities", "Nightlife & Entertainment", "Artists, Creators & Cultural Icons"] },
  { title: "Life in Your City", icon: "📍", subtopics: ["What’s Happening in Your City", "Local History & Cultural Neighborhoods", "Community Organizations", "Professional & Social Groups"] },
  { title: "Technology & the Future", icon: "💻", subtopics: ["AI Skills & Responsible Use", "Digital Privacy & Online Safety", "Technology Careers & Training", "Black Innovators in Technology"] },
  { title: "Know Your Rights", icon: "⚖️", subtopics: ["Recognizing & Reporting Discrimination", "Workplace Rights", "Health-Care Advocacy", "School & Education Rights", "Consumer Protection"] },
  { title: "Resources & Support", icon: "🧭", subtopics: ["Housing & Utility Support", "Food & Family Resources", "Disaster Recovery", "Emergency & Crisis Resources"] },
] as const;

/**
 * A collection subject is an intentional, prefilled research question. The
 * target screen first searches approved Library material and then requests a
 * governed, current brief when the approved coverage is sparse.
 */
export function libraryCollectionResearchParams(question: string): {
  question: string;
  research: "true";
} {
  return { question, research: "true" };
}

export const LIBRARY_COLLECTION_SUBTOPICS = LIBRARY_COLLECTION_SHELVES.flatMap(
  (collection) => collection.subtopics,
);
