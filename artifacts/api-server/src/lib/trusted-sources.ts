export interface TrustedSource {
  name: string;
  url: string;
  type: "government" | "academic" | "editorial" | "community" | "industry";
  emoji: string;
  forCommunity?: boolean; // specifically serves Black/melanated audiences
  rssUrl?: string;        // placeholder for future live feed integration
}

const SOURCES: Record<string, TrustedSource[]> = {
  health: [
    { name: "World Health Organization", url: "https://www.who.int", type: "government", emoji: "🌍" },
    { name: "CDC", url: "https://www.cdc.gov", type: "government", emoji: "🏛️", rssUrl: "https://tools.cdc.gov/api/v2/resources/media/132608.rss" },
    { name: "NIH", url: "https://www.nih.gov", type: "government", emoji: "🏛️" },
    { name: "Mayo Clinic", url: "https://www.mayoclinic.org", type: "academic", emoji: "🎓" },
    { name: "Cleveland Clinic", url: "https://my.clevelandclinic.org", type: "academic", emoji: "🎓" },
    { name: "Johns Hopkins Medicine", url: "https://www.hopkinsmedicine.org", type: "academic", emoji: "🎓" },
    { name: "American Heart Association", url: "https://www.heart.org", type: "academic", emoji: "❤️" },
    { name: "American Diabetes Association", url: "https://www.diabetes.org", type: "academic", emoji: "🎓" },
    { name: "American Cancer Society", url: "https://www.cancer.org", type: "academic", emoji: "🎓" },
    { name: "National Kidney Foundation", url: "https://www.kidney.org", type: "academic", emoji: "🎓" },
    { name: "Alzheimer's Association", url: "https://www.alz.org", type: "academic", emoji: "🎓" },
    { name: "BlackDoctor.org", url: "https://www.blackdoctor.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Medical Association", url: "https://www.nmanet.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Association of Black Cardiologists", url: "https://www.abcardio.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Black Women's Health Imperative", url: "https://bwhi.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "HealthyWomen", url: "https://www.healthywomen.org", type: "editorial", emoji: "✍️" },
  ],
  travel: [
    { name: "U.S. State Department Travel", url: "https://travel.state.gov", type: "government", emoji: "🏛️" },
    { name: "TSA", url: "https://www.tsa.gov", type: "government", emoji: "🏛️" },
    { name: "CDC Travel Health", url: "https://wwwnc.cdc.gov/travel", type: "government", emoji: "🏛️" },
    { name: "IATA", url: "https://www.iata.org", type: "industry", emoji: "✈️" },
    { name: "National Park Service", url: "https://www.nps.gov", type: "government", emoji: "🌲" },
    { name: "Visit Jamaica", url: "https://www.visitjamaica.com", type: "government", emoji: "🇯🇲" },
    { name: "South African Tourism", url: "https://www.southafrica.net", type: "government", emoji: "🇿🇦" },
    { name: "Ghana Tourism Authority", url: "https://www.ghana.travel", type: "government", emoji: "🇬🇭" },
    { name: "Nigeria Tourism", url: "https://www.tourism.gov.ng", type: "government", emoji: "🇳🇬" },
    { name: "Visit Brasil", url: "https://visitbrasil.com", type: "government", emoji: "🇧🇷" },
    { name: "Visit Mexico", url: "https://www.visitmexico.com", type: "government", emoji: "🇲🇽" },
    { name: "Japan National Tourism Org", url: "https://www.japan.travel", type: "government", emoji: "🇯🇵" },
    { name: "Global Entry (CBP)", url: "https://www.cbp.gov/travel/trusted-traveler-programs/global-entry", type: "government", emoji: "🏛️" },
    { name: "The Melanated Traveler", url: "https://themelanatedtraveler.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Travel Noire", url: "https://travelnoire.com", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
  finance: [
    { name: "IRS", url: "https://www.irs.gov", type: "government", emoji: "🏛️" },
    { name: "CFPB", url: "https://www.consumerfinance.gov", type: "government", emoji: "🏛️" },
    { name: "Federal Reserve", url: "https://www.federalreserve.gov", type: "government", emoji: "🏛️" },
    { name: "SEC", url: "https://www.sec.gov", type: "government", emoji: "🏛️" },
    { name: "FINRA", url: "https://www.finra.org", type: "government", emoji: "🏛️" },
    { name: "NerdWallet", url: "https://www.nerdwallet.com", type: "editorial", emoji: "✍️" },
    { name: "Investopedia", url: "https://www.investopedia.com", type: "editorial", emoji: "✍️" },
    { name: "Consumer Reports", url: "https://www.consumerreports.org", type: "editorial", emoji: "✍️" },
    { name: "Black Enterprise", url: "https://www.blackenterprise.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Black MBA Association", url: "https://www.nbmbaa.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Minority Business Dev. Agency", url: "https://www.mbda.gov", type: "government", emoji: "🏛️", forCommunity: true },
  ],
  real_estate: [
    { name: "HUD", url: "https://www.hud.gov", type: "government", emoji: "🏛️" },
    { name: "FHA", url: "https://www.hud.gov/program_offices/housing/fhahistory", type: "government", emoji: "🏛️" },
    { name: "National Association of REALTORS®", url: "https://www.nar.realtor", type: "industry", emoji: "🏠" },
    { name: "Freddie Mac", url: "https://www.freddiemac.com", type: "government", emoji: "🏛️" },
    { name: "Fannie Mae", url: "https://www.fanniemae.com", type: "government", emoji: "🏛️" },
    { name: "CFPB", url: "https://www.consumerfinance.gov", type: "government", emoji: "🏛️" },
  ],
  automotive: [
    { name: "Kelley Blue Book", url: "https://www.kbb.com", type: "editorial", emoji: "✍️" },
    { name: "NHTSA", url: "https://www.nhtsa.gov", type: "government", emoji: "🏛️" },
    { name: "IIHS", url: "https://www.iihs.org", type: "academic", emoji: "🎓" },
    { name: "Consumer Reports", url: "https://www.consumerreports.org", type: "editorial", emoji: "✍️" },
    { name: "Hagerty (Classic Cars)", url: "https://www.hagerty.com", type: "industry", emoji: "🚗" },
    { name: "SEMA", url: "https://www.sema.org", type: "industry", emoji: "🔧" },
    { name: "AAA", url: "https://www.aaa.com", type: "industry", emoji: "🛣️" },
  ],
  education: [
    { name: "U.S. Dept. of Education", url: "https://www.ed.gov", type: "government", emoji: "🏛️" },
    { name: "College Board", url: "https://www.collegeboard.org", type: "academic", emoji: "🎓" },
    { name: "FAFSA", url: "https://studentaid.gov/h/apply-for-aid/fafsa", type: "government", emoji: "🏛️" },
    { name: "Khan Academy", url: "https://www.khanacademy.org", type: "academic", emoji: "🎓" },
    { name: "Smithsonian", url: "https://www.smithsonianmag.com", type: "academic", emoji: "🏛️" },
    { name: "Library of Congress", url: "https://www.loc.gov", type: "government", emoji: "📚" },
    { name: "UNCF", url: "https://uncf.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "HBCU Connect", url: "https://hbcuconnect.com", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
  careers: [
    { name: "Dept. of Labor", url: "https://www.dol.gov", type: "government", emoji: "🏛️" },
    { name: "LinkedIn News", url: "https://www.linkedin.com/news", type: "editorial", emoji: "✍️" },
    { name: "Indeed Career Guide", url: "https://www.indeed.com/career-advice", type: "editorial", emoji: "✍️" },
    { name: "Glassdoor", url: "https://www.glassdoor.com", type: "editorial", emoji: "✍️" },
    { name: "SHRM", url: "https://www.shrm.org", type: "industry", emoji: "💼" },
    { name: "National Urban League", url: "https://nul.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "AfroTech", url: "https://afrotech.com", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
  minority_business: [
    { name: "U.S. Black Chambers", url: "https://usblackchambers.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Minority Business Dev. Agency", url: "https://www.mbda.gov", type: "government", emoji: "🏛️", forCommunity: true },
    { name: "NMSDC", url: "https://nmsdc.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Urban League", url: "https://nul.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Black MBA Assoc.", url: "https://www.nbmbaa.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Women's Business Council", url: "https://www.nwbc.gov", type: "government", emoji: "🏛️" },
    { name: "National LGBT Chamber", url: "https://nglcc.org", type: "community", emoji: "🌈" },
    { name: "SBA", url: "https://www.sba.gov", type: "government", emoji: "🏛️" },
    { name: "Black Enterprise", url: "https://www.blackenterprise.com", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
  news: [
    { name: "Associated Press", url: "https://apnews.com", type: "editorial", emoji: "✍️" },
    { name: "Reuters", url: "https://www.reuters.com", type: "editorial", emoji: "✍️" },
    { name: "NPR", url: "https://www.npr.org", type: "editorial", emoji: "📻" },
    { name: "PBS", url: "https://www.pbs.org", type: "editorial", emoji: "📺" },
    { name: "BBC", url: "https://www.bbc.com", type: "editorial", emoji: "🌍" },
    { name: "ProPublica", url: "https://www.propublica.org", type: "editorial", emoji: "✍️" },
    { name: "The Root", url: "https://www.theroot.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Capital B News", url: "https://capitalbnews.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Black Enterprise", url: "https://www.blackenterprise.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Essence", url: "https://www.essence.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Word In Black", url: "https://wordinblack.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "AfroTech", url: "https://afrotech.com", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
  entertainment: [
    { name: "Billboard", url: "https://www.billboard.com", type: "editorial", emoji: "🎵" },
    { name: "Grammy Awards", url: "https://www.grammy.com", type: "industry", emoji: "🏆" },
    { name: "Academy Awards", url: "https://www.oscars.org", type: "industry", emoji: "🏆" },
    { name: "Smithsonian NMAAHC", url: "https://nmaahc.si.edu", type: "government", emoji: "🏛️", forCommunity: true },
    { name: "National Endowment for the Arts", url: "https://www.arts.gov", type: "government", emoji: "🎭" },
    { name: "Shadow and Act", url: "https://shadowandact.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "The Root", url: "https://www.theroot.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Variety", url: "https://variety.com", type: "editorial", emoji: "✍️" },
  ],
  government: [
    { name: "Congress.gov", url: "https://www.congress.gov", type: "government", emoji: "🏛️" },
    { name: "Supreme Court", url: "https://www.supremecourt.gov", type: "government", emoji: "⚖️" },
    { name: "White House", url: "https://www.whitehouse.gov", type: "government", emoji: "🏛️" },
    { name: "USA.gov", url: "https://www.usa.gov", type: "government", emoji: "🏛️" },
  ],
  safety: [
    { name: "FEMA", url: "https://www.fema.gov", type: "government", emoji: "🏛️" },
    { name: "NOAA", url: "https://www.noaa.gov", type: "government", emoji: "🌩️" },
    { name: "National Weather Service", url: "https://www.weather.gov", type: "government", emoji: "🌤️" },
    { name: "FBI", url: "https://www.fbi.gov", type: "government", emoji: "🏛️" },
    { name: "ACLU", url: "https://www.aclu.org", type: "community", emoji: "⚖️", forCommunity: true },
  ],
  community: [
    { name: "The Root", url: "https://www.theroot.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Essence", url: "https://www.essence.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Word In Black", url: "https://wordinblack.com", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "National Urban League", url: "https://nul.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "NAACP", url: "https://www.naacp.org", type: "community", emoji: "✊🏾", forCommunity: true },
    { name: "Movement for Black Lives", url: "https://m4bl.org", type: "community", emoji: "✊🏾", forCommunity: true },
  ],
};

// Category aliases — map platform categories to source categories
const CATEGORY_MAP: Record<string, string[]> = {
  health:             ["health"],
  wellness:           ["health"],
  health_wellness:    ["health"],
  travel:             ["travel"],
  relocation:         ["travel", "real_estate"],
  money:              ["finance"],
  financial:          ["finance"],
  financial_wellness: ["finance"],
  business:           ["minority_business", "finance"],
  careers:            ["careers"],
  employment:         ["careers"],
  education:          ["education"],
  culture:            ["community", "entertainment", "news"],
  community_culture:  ["community", "news"],
  entertainment:      ["entertainment"],
  technology:         ["news", "careers"],
  safety:             ["safety"],
  government:         ["government"],
  giving:             ["community"],
  family:             ["health", "community"],
  food:               ["news"],
  food_lifestyle:     ["news"],
};

export function getSourcesForTopic(
  category: string,
  topicType?: string | null,
  topicName?: string | null,
): TrustedSource[] {
  const sourceKeys = CATEGORY_MAP[category] ?? ["news"];

  // Always include community-relevant sources
  const seen = new Set<string>();
  const results: TrustedSource[] = [];

  // For location topics, always include travel + safety
  const extraKeys: string[] = [];
  if (topicType === "location") extraKeys.push("travel", "safety");
  if (topicType === "medical") extraKeys.push("health");
  if (topicType === "business") extraKeys.push("minority_business");

  const allKeys = [...new Set([...sourceKeys, ...extraKeys])];

  for (const key of allKeys) {
    const bucket = SOURCES[key] ?? [];
    for (const src of bucket) {
      if (!seen.has(src.url)) {
        seen.add(src.url);
        results.push(src);
      }
    }
  }

  // Community-relevant sources first, then government, then others
  return results.sort((a, b) => {
    const aScore = (a.forCommunity ? 2 : 0) + (a.type === "government" ? 1 : 0);
    const bScore = (b.forCommunity ? 2 : 0) + (b.type === "government" ? 1 : 0);
    return bScore - aScore;
  }).slice(0, 12);
}
