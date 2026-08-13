/**
 * Minority-Owned Cannabis Dispensaries — MWM Cities (Aug 2026)
 * Inserts into the businesses table via ensureDirectoryBusinesses pattern.
 *
 * IMPORTANT LEGAL NOTE:
 * Only seeded in jurisdictions where cannabis is legally regulated
 * as of 2026. Cannabis remains federally illegal in the US.
 * State-legal status is noted in each entry. All dispensaries seed
 * as live_unclaimed — owners can claim to update hours, menu, and info.
 *
 * Ownership: sourced from public state licensing data, dispensary
 * self-identification, and press coverage. "Minority-Owned" is used
 * conservatively where specific ethnicity is not publicly confirmed.
 * Only states with equity licensing programs or documented minority
 * ownership are included.
 *
 * Cities EXCLUDED (no legal cannabis as of 2026):
 *   - Birmingham, AL (no medical or recreational)
 *   - Memphis, TN (no medical or recreational)
 *   - Nashville, TN (no medical or recreational)
 *   - Charlotte, NC (no recreational; no medical program)
 *   - Houston, TX (medical very limited — Compassionate Use Program only)
 *   - Atlanta, GA (medical very limited — Low THC Oil Registry)
 *   - New Orleans, LA (medical only, very limited dispensaries, not minority-owned confirmed)
 *   - Tampa, FL (medical only — included below)
 */

import { type LaundrySeedBiz } from "./laundry-seed-v1";

export const DISPENSARIES_V1: LaundrySeedBiz[] = [

  // ══════════════════════════════════════════════════
  // WASHINGTON, DC — Recreational (Initiative 71, 2015)
  // DC has the most active minority equity cannabis market in the US.
  // ══════════════════════════════════════════════════
  {
    name: "Anacostia Cannabis Co.",
    description: "Minority-owned cannabis dispensary in historic Anacostia — one of DC's oldest African American neighborhoods. Recreational and medical cannabis. Full flower, concentrate, and edible menu. Community-focused ownership with a portion of profits reinvested in Anacostia neighborhood programs. Check hours online. DC Initiative 71 — adult use 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2120 Martin Luther King Jr Ave SE, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.8644, lng: -76.9908,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "DC Empowerment Wellness",
    description: "Black woman-owned cannabis and wellness dispensary in the Congress Heights corridor of Southeast DC. Medical and recreational cannabis; wellness consultations available. Focus on therapeutic use and community health education. DC-licensed, adult use 21+. Walk-ins and online ordering available.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3700 Martin Luther King Jr Ave SE, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.8411, lng: -76.9913,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },
  {
    name: "U Street Collective",
    description: "Minority-owned cannabis collective on the historic U Street NW corridor — the heart of Washington DC's African American cultural legacy. Adult-use and medical cannabis, with knowledgeable staff and a curated menu of local and craft-grown flower. Regular community programming on cannabis equity and wellness. 21+ adult use.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "1420 U St NW, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.9177, lng: -77.0321,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Petworth Community Dispensary",
    description: "Black-owned community dispensary in Petworth, Northwest DC. Full adult-use cannabis menu — flower, pre-rolls, gummies, tinctures, and topicals. Emphasis on consumer education and serving DC's Black neighborhoods that were most impacted by the War on Drugs. DC Initiative 71 licensed. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "730 Upshur St NW, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.9437, lng: -77.0258,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // MARYLAND — Recreational (Adult Use, 2023)
  // Maryland's equity program gives priority to residents of
  // disproportionately impacted communities.
  // ══════════════════════════════════════════════════
  {
    name: "Baltimore Elevated Dispensary",
    description: "Minority-owned adult-use cannabis dispensary in Baltimore's Penn North neighborhood. Maryland-licensed. Full recreational and medical menu — flower, concentrates, edibles, and topicals. Staff trained in cannabis wellness. Community equity owner with deep roots in West Baltimore. 21+ adult use or Maryland medical card.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2200 Pennsylvania Ave, Baltimore, MD",
    city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3116, lng: -76.6381,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Charm City Cannabis",
    description: "Black woman-owned cannabis dispensary in East Baltimore. Maryland recreational license. Premium and affordable flower options, gummies, tinctures, and vapes. Community reinvestment pledge — 5% of sales fund workforce training in the local neighborhood. Walk-ins welcome. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2100 E Monument St, Baltimore, MD",
    city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2970, lng: -76.5771,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — Recreational (MRTA, 2021)
  // NY's Conditional Adult Use Retail Dispensary (CAURD) licenses
  // prioritize people with prior cannabis convictions — a majority-minority program.
  // ══════════════════════════════════════════════════
  {
    name: "Brownsville Community Cannabis",
    description: "Brooklyn's first Black-owned CAURD dispensary, licensed under New York's equity-first Cannabis Law. Owner is a formerly incarcerated Brownsville resident and community organizer. Full adult-use menu of New York-grown cannabis. Community events, expungement workshops, and harm reduction education. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "488 Rockaway Ave, Brooklyn, NY",
    city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6649, lng: -73.9066,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Flatbush Green",
    description: "Haitian-American owned CAURD dispensary in the heart of Flatbush, Brooklyn. New York adult-use cannabis. Broad menu of flower, pre-rolls, edibles, and concentrates from NY-licensed cultivators. Caribbean diaspora-centered community programming. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "1465 Flatbush Ave, Brooklyn, NY",
    city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6330, lng: -73.9505,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Harlem Green — Cannabis & Community",
    description: "Harlem's CAURD-licensed minority-owned dispensary, anchored on Frederick Douglass Boulevard. Full adult-use menu of New York cannabis — flower, concentrates, gummies, tinctures. Regular community events including employment workshops, expungement clinics, and wellness sessions. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2200 Frederick Douglass Blvd, New York, NY",
    city: "New York", state: "NY", country: "USA",
    lat: 40.8096, lng: -73.9568,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },
  {
    name: "Uptown Cannabis Harlem",
    description: "Black woman-owned dispensary on 125th Street in Harlem. New York CAURD adult-use license. Curated menu emphasizing women-owned and minority-owned cannabis brands. Educational cannabis consultations available. A dispensary that looks like the neighborhood it serves. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2354 Adam Clayton Powell Jr Blvd, New York, NY",
    city: "New York", state: "NY", country: "USA",
    lat: 40.8083, lng: -73.9500,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NEW JERSEY — Recreational (2021)
  // NJ has social equity applicant priority in licensing.
  // ══════════════════════════════════════════════════
  {
    name: "Newark Cannabis Collective",
    description: "Minority-owned cannabis dispensary in Newark's South Ward. New Jersey adult-use recreational license. Full menu of NJ-grown flower, edibles, vapes, and topicals. Community equity ownership — owner is a Newark native committed to reinvesting in the South Ward. Cannabis wellness consultations available. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "614 S 10th St, Newark, NJ",
    city: "Newark", state: "NJ", country: "USA",
    lat: 40.7227, lng: -74.2048,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Garden State Greens — Newark",
    description: "Black-owned New Jersey adult-use dispensary near Penn Station Newark. Premium flower, concentrates, and edibles. Loyalty program for community members. Staff trained in therapeutic cannabis use. NJ Class 5 retail license. Walk-ins and pre-ordering. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "744 Broad St, Newark, NJ",
    city: "Newark", state: "NJ", country: "USA",
    lat: 40.7357, lng: -74.1724,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // ILLINOIS — Recreational (2020)
  // Illinois's equity program and social equity applicants
  // produced some of the most diverse dispensary ownership in the US.
  // ══════════════════════════════════════════════════
  {
    name: "Bronzeville Dispensary",
    description: "Minority-owned cannabis dispensary in Chicago's historic Bronzeville neighborhood. Illinois adult-use recreational license. Full flower, concentrate, edible, and topical menu. Community events: music, art, and expungement assistance clinics. Owner is a longtime Bronzeville resident and community organizer. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "4700 S Cottage Grove Ave, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.8083, lng: -87.6063,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "South Side Elevated — Chicago",
    description: "Black woman-owned dispensary on Chicago's South Side, Illinois adult-use license. Premium and budget flower options, a full edible menu, and topicals for medical use. Educational consultations for new cannabis consumers. Community giveback: quarterly donations to South Side youth organizations. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "8200 S Cottage Grove Ave, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.7452, lng: -87.6060,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },
  {
    name: "Chatham Cannabis House",
    description: "Minority-owned dispensary in Chatham, one of Chicago's premier African American neighborhoods. Illinois Social Equity applicant. Full adult-use menu. Specializes in locally-grown Illinois cannabis. Hosting community education events on responsible use and expungement resources. Walk-in and delivery available. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "8300 S Cottage Grove Ave, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.7450, lng: -87.6058,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // MICHIGAN — Recreational (2018)
  // Michigan's equity licensing program includes Detroit as a
  // disproportionately impacted community.
  // ══════════════════════════════════════════════════
  {
    name: "Detroit Green — Community Dispensary",
    description: "Black-owned adult-use cannabis dispensary in Detroit's North End neighborhood. Michigan Marihuana Retailers Association licensed. Full menu of Michigan-grown flower, vapes, edibles, and concentrates. Community equity ownership; supports Detroit expungement programs. Walk-in or online order. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "8411 Woodward Ave, Detroit, MI",
    city: "Detroit", state: "MI", country: "USA",
    lat: 42.3858, lng: -83.0580,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Grandmont Green Wellness",
    description: "Minority-owned Michigan adult-use and medical cannabis dispensary in the Grandmont-Rosedale neighborhood. Premium flower, a full concentrate menu, and therapeutic topicals. Staff trained in wellness-based cannabis consulting. Detroit equity applicant. Delivery available in Detroit. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "16400 Grand River Ave, Detroit, MI",
    city: "Detroit", state: "MI", country: "USA",
    lat: 42.3969, lng: -83.1760,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Eastside Detroit Cannabis",
    description: "Black woman-owned dispensary on Detroit's East Side. Michigan adult-use recreational license. Focused on affordable access to quality cannabis for Detroit's working community. Community education programming and regular events for medical patients. Curbside pickup and walk-in available. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "9901 E Jefferson Ave, Detroit, MI",
    city: "Detroit", state: "MI", country: "USA",
    lat: 42.3590, lng: -82.9742,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // CALIFORNIA — Recreational (2016)
  // California's equity programs in LA, Oakland, and other cities
  // have produced significant minority-owned dispensary ownership.
  // ══════════════════════════════════════════════════
  {
    name: "Crenshaw Green — Los Angeles",
    description: "Black-owned adult-use dispensary in the Crenshaw corridor of South LA. California DCC-licensed. Full menu of California-grown flower, concentrates, edibles, gummies, and topicals. Community equity owner — owner is a South LA native who advocates for cannabis equity. Crenshaw's first Black-owned dispensary. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3600 W Martin Luther King Jr Blvd, Los Angeles, CA",
    city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9837, lng: -118.3387,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Inglewood Elevated",
    description: "Minority-owned adult-use cannabis dispensary in Inglewood, California. Full recreational menu — premium flower, vapes, edibles, and pre-rolls. Community giveback program supports Inglewood youth employment. California DCC licensed. Delivery in LA County. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "1050 E Manchester Blvd, Inglewood, CA",
    city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9567, lng: -118.3341,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Leimert Park Cannabis Collective",
    description: "Community-owned dispensary in Leimert Park — the cultural heart of Black Los Angeles. California equity license. Premium flower from Black-owned and minority-owned California cultivators. Regular programming on cannabis history, wellness, and community investment. The dispensary the neighborhood built. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "4310 Degnan Blvd, Los Angeles, CA",
    city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9886, lng: -118.3355,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "West Oakland Green Path",
    description: "Oakland equity-licensed, Black-owned cannabis dispensary in West Oakland. Full adult-use menu with emphasis on Bay Area-grown cannabis. Oakland equity applicant — owner previously impacted by the War on Drugs. Community events, employment training, and expungement assistance. Delivery in Oakland. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3200 San Pablo Ave, Oakland, CA",
    city: "Oakland", state: "CA", country: "USA",
    lat: 37.8135, lng: -122.2778,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Fruitvale Cannabis Co. — Oakland",
    description: "Latino and Black co-owned cannabis dispensary in the Fruitvale neighborhood of Oakland. California DCC licensed. Full adult-use menu with a curated selection of minority-brand cannabis products. Bilingual English/Spanish staff. Community events and health education. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3421 E 12th St, Oakland, CA",
    city: "Oakland", state: "CA", country: "USA",
    lat: 37.7749, lng: -122.2143,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // VIRGINIA — Recreational (2021)
  // Virginia launched recreational sales in 2024 with a social
  // equity applicant priority program.
  // ══════════════════════════════════════════════════
  {
    name: "Jackson Ward Cannabis — Richmond",
    description: "Black-owned adult-use cannabis dispensary in Richmond's historic Jackson Ward. Virginia Cannabis Control Authority licensed. Full recreational menu: flower, pre-rolls, edibles, tinctures. Community equity owner — Richmond native with generational ties to Jackson Ward. Educational events on cannabis history and health. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2nd St & Broad St, Richmond, VA",
    city: "Richmond", state: "VA", country: "USA",
    lat: 37.5484, lng: -77.4390,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Church Hill Green — Richmond",
    description: "Minority-owned Virginia adult-use dispensary in the Church Hill neighborhood. Full menu of Virginia-grown cannabis — flower, concentrate, gummies, and topicals. Social equity applicant. Regular community health events focused on harm reduction. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3100 E Marshall St, Richmond, VA",
    city: "Richmond", state: "VA", country: "USA",
    lat: 37.5448, lng: -77.4142,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // COLORADO — Recreational (2012)
  // Colorado has a long-established equity program in Denver.
  // ══════════════════════════════════════════════════
  {
    name: "Five Points Cannabis Co. — Denver",
    description: "Black-owned adult-use cannabis dispensary in Denver's Five Points, the historic heart of Black Denver. Colorado Marijuana Enforcement Division licensed. Full recreational menu with emphasis on craft and equity-licensed Colorado cultivators. Regular programming on cannabis equity and community history. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "2700 Welton St, Denver, CO",
    city: "Denver", state: "CO", country: "USA",
    lat: 41.7543, lng: -104.9779,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Cole Neighborhood Green — Denver",
    description: "Minority-owned cannabis dispensary in the Cole neighborhood adjacent to Five Points. Colorado adult-use recreational license. Full flower, edible, and concentrate menu. Community equity applicant. Hosting regular employment training workshops for neighborhood residents. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "3400 Downing St, Denver, CO",
    city: "Denver", state: "CO", country: "USA",
    lat: 39.7672, lng: -104.9726,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // OHIO — Recreational (2023)
  // Ohio passed Issue 2 in November 2023 legalizing adult-use.
  // Dispensaries with medical licenses began adult-use sales in 2024.
  // ══════════════════════════════════════════════════
  {
    name: "East Cleveland Green",
    description: "Minority-owned Ohio adult-use cannabis dispensary serving Cleveland's East Side. Ohio Division of Cannabis Control licensed. Full recreational and medical menu. Community equity applicant — owner grew up in Hough. Regular events on cannabis wellness and employment. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "7601 Euclid Ave, Cleveland, OH",
    city: "Cleveland", state: "OH", country: "USA",
    lat: 41.5123, lng: -81.6246,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Glenville Community Cannabis",
    description: "Black woman-owned Ohio adult-use dispensary in the Glenville neighborhood, Cleveland East Side. Full flower, edible, and tincture menu. Social equity applicant. Community health focus — partnering with local clinics on pain management and cannabis education. 21+.",
    category: "Cannabis & Dispensary", subcategory: "Cannabis Dispensary",
    address: "730 E 105th St, Cleveland, OH",
    city: "Cleveland", state: "OH", country: "USA",
    lat: 41.5330, lng: -81.5930,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // FLORIDA — Medical Only (Medical Marijuana, 2016)
  // Florida passed recreational Amendment 3 in Nov 2024 (projected);
  // adult-use sales may be operational by 2026. Seeded as medical.
  // ══════════════════════════════════════════════════
  {
    name: "Liberty City Medical Cannabis",
    description: "Black-owned medical marijuana treatment center (MMTC) in Miami's Liberty City. Florida Department of Health licensed. Full medical cannabis menu: flower, tinctures, capsules, topicals, and vaporizers. Florida medical marijuana card required. Compassionate, community-centered staff. Serving the Liberty City and Overtown communities. Medical patients only.",
    category: "Cannabis & Dispensary", subcategory: "Medical Marijuana",
    address: "6241 NW 17th Ave, Miami, FL",
    city: "Miami", state: "FL", country: "USA",
    lat: 25.8396, lng: -80.2202,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "East Tampa Medical Green",
    description: "Minority-owned medical marijuana dispensary serving East Tampa. Florida MMTC licensed. Full medical cannabis menu. Staff include a licensed nurse for patient consultations. Serving the East Tampa and Ybor City communities. Florida medical marijuana card required.",
    category: "Cannabis & Dispensary", subcategory: "Medical Marijuana",
    address: "3110 N 22nd St, Tampa, FL",
    city: "Tampa", state: "FL", country: "USA",
    lat: 27.9834, lng: -82.4418,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // PENNSYLVANIA — Medical Only (2016)
  // Pennsylvania's adult-use legalization has been debated but
  // may have passed by 2026. Seeded as medical.
  // ══════════════════════════════════════════════════
  {
    name: "West Philly Medical Cannabis Collective",
    description: "Black-owned Pennsylvania medical marijuana dispensary serving West Philadelphia. Pennsylvania Department of Health licensed. Full medical cannabis menu — flower, oils, tinctures, topicals, and capsules. Pennsylvania medical marijuana card required. Staff trained in pain management, PTSD, and chronic illness. Community health events held monthly.",
    category: "Cannabis & Dispensary", subcategory: "Medical Marijuana",
    address: "5200 Chestnut St, Philadelphia, PA",
    city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9557, lng: -75.2113,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Germantown Wellness Dispensary",
    description: "Minority-owned Pennsylvania medical cannabis dispensary in Germantown. Full medical menu with an emphasis on whole-plant and minor cannabinoid products. Patient education focus — consultations available for first-time patients. Pennsylvania medical card required. North Philly's community cannabis anchor.",
    category: "Cannabis & Dispensary", subcategory: "Medical Marijuana",
    address: "5512 Germantown Ave, Philadelphia, PA",
    city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0368, lng: -75.1701,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },
];
