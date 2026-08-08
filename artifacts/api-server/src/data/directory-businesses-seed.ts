/**
 * Mapping With Melanin™ — Initial Directory Business Seed
 *
 * Source: Mapping_With_Melanin_MASTER_Business_Directory.xlsx → Business Intake tab
 * These are community-submitted businesses. Listing status: live_unclaimed.
 * Profile status: community_listed.
 *
 * Ownership designations are self-identified only — never inferred.
 */

export interface DirectoryBusinessSeed {
  name: string;
  city: string;
  state: string;
  address: string;
  zipCode?: string;
  category: string;
  subcategory: string;
  description: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  primarySocialPlatform?: string;
  ownershipDesignations: string[];
  vibes: string[];
  notes?: string;
  latitude: number;
  longitude: number;
}

/** Known city centroids for coordinate assignment */
const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  "Philadelphia_PA": { latitude: 39.9526, longitude: -75.1652 },
  "Darby_PA":        { latitude: 39.9168, longitude: -75.2593 },
  "Silver Spring_MD":{ latitude: 38.9907, longitude: -77.0261 },
  "Santa Clara_CA":  { latitude: 37.3541, longitude: -121.9552 },
  "New York_NY":     { latitude: 40.7128, longitude: -74.0060  },
};

function coords(city: string, state: string) {
  return CITY_COORDS[`${city}_${state}`] ?? { latitude: 39.9526, longitude: -75.1652 };
}

export const DIRECTORY_BUSINESSES_SEED: DirectoryBusinessSeed[] = [
  {
    name: "The Nail Jawns",
    city: "Philadelphia",
    state: "PA",
    address: "429 N. 64th St",
    zipCode: "19151",
    category: "Beauty & Personal Care",
    subcategory: "Nail Salons & Nail Artists",
    description: "Community-recommended nail salon serving Philadelphia's West side. Walk-ins welcomed, appointments preferred.",
    tiktok: "@the.nail.jawns",
    website: "https://www.tiktok.com/@the.nail.jawns",
    primarySocialPlatform: "tiktok",
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: [],
    notes: "Walk-ins Welcomed, Appointments preferred.",
    ...coords("Philadelphia", "PA"),
  },
  {
    name: "Cherished Beauty Supply",
    city: "Darby",
    state: "PA",
    address: "526 Main St",
    zipCode: "19023",
    category: "Beauty & Personal Care",
    subcategory: "Beauty Supply",
    description: "Plant-Based Hair & Skin Care. Black-Owned Beauty Supply. Willing to ship!",
    tiktok: "@cherishedbeautysupply",
    website: "https://www.tiktok.com/@cherishedbeautysupply",
    primarySocialPlatform: "tiktok",
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: [],
    notes: "Willing to Ship!",
    ...coords("Darby", "PA"),
  },
  {
    name: "Angie's Eats",
    city: "Philadelphia",
    state: "PA",
    address: "Philadelphia, PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    description: "Latin Soul Food in Philadelphia. The Shrimp Alfredo with 6 wings combo is a must-try.",
    tiktok: "@angieslne",
    website: "https://www.tiktok.com/@angieslne",
    primarySocialPlatform: "tiktok",
    ownershipDesignations: ["Latino / Hispanic-Owned"],
    vibes: ["Auntie Energy", "Locals Know"],
    notes: "The Shrimp Alfredo with 6 wings combo is FIRE",
    ...coords("Philadelphia", "PA"),
  },
  {
    name: "ISSAAESTHETICS Beauty Salon & Barbershop",
    city: "Silver Spring",
    state: "MD",
    address: "11409 Amherst Ave Unit A",
    zipCode: "20902",
    category: "Beauty & Personal Care",
    subcategory: "Hair Salons",
    description: "Full-service beauty salon and barbershop in Silver Spring, MD. Specializing in Laser Hair Removal, Blow Outs, Chemical Peels and More. Se Habla Español.",
    instagram: "@issaaestheticsbeauty",
    website: "https://www.instagram.com/issaaestheticsbeauty",
    primarySocialPlatform: "instagram",
    ownershipDesignations: ["Dominican-Owned"],
    vibes: ["Luxury Without The Attitude"],
    notes: "Se Habla Espanol",
    ...coords("Silver Spring", "MD"),
  },
  {
    name: "Candy Clouds By Cass",
    city: "Santa Clara",
    state: "CA",
    address: "Serving the Bay Area",
    category: "Food & Drink",
    subcategory: "Desserts & Sweets",
    description: "Sweet Clouds for Every Celebration! Serving the Bay Area.",
    instagram: "@candycloudsbycass",
    website: "https://www.instagram.com/candycloudsbycass",
    primarySocialPlatform: "instagram",
    ownershipDesignations: ["Minority-Owned (general / legacy)"],
    vibes: [],
    ...coords("Santa Clara", "CA"),
  },
  {
    name: "Little Essentials",
    city: "New York",
    state: "NY",
    address: "63 Flushing Avenue, Bldg 131, Ste 205",
    zipCode: "11205",
    category: "Children & Family",
    subcategory: "Children's Retail",
    description: "Little Essentials offers at-risk families living in poverty urgently needed children's supplies and parenting education to promote the health, well-being, and safety of their children ages 0–5.",
    website: "https://www.littleessentials.org",
    ownershipDesignations: ["Minority-Owned (general / legacy)"],
    vibes: [],
    ...coords("New York", "NY"),
  },
  {
    name: "Philly Barber Studios",
    city: "Philadelphia",
    state: "PA",
    address: "7938 Oxford Ave",
    zipCode: "19111",
    category: "Beauty & Personal Care",
    subcategory: "Barbershops",
    description: "From precision fade haircuts to straight razor shaving — cutting and trimming to perfection. Shampoo, conditioner, hot towel, and neck shave. Good with kids.",
    instagram: "@phillybarberstudios",
    website: "https://www.instagram.com/phillybarberstudios/",
    primarySocialPlatform: "instagram",
    ownershipDesignations: ["Minority-Owned (general / legacy)"],
    vibes: ["Neighborhood Love", "For The Culture"],
    notes: "Good for kids, book appointment",
    ...coords("Philadelphia", "PA"),
  },
  {
    name: "AMINA",
    city: "Philadelphia",
    state: "PA",
    address: "1102 Germantown Ave",
    zipCode: "19123",
    category: "Food & Drink",
    subcategory: "Restaurants",
    description: "American Southern cuisine in NoLibs Philadelphia. Owner Felicia Wilson and Chef Partner Darryl Harmon are innovators in the Southern cuisine space. Saturday Brunch books fast — make a reservation.",
    website: "https://www.aminaphilly.com",
    primarySocialPlatform: "website",
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Date Night", "Locals Know", "Take Somebody From Out of Town"],
    notes: "Saturday Brunch books Fast so make a reservation",
    ...coords("Philadelphia", "PA"),
  },
  {
    name: "SOUTH",
    city: "Philadelphia",
    state: "PA",
    address: "600 N Broad St",
    zipCode: "19130",
    category: "Food & Drink",
    subcategory: "Restaurants",
    description: "Since 2015, SOUTH has served up elevated comfort food rooted in the food of the south. America's original music meets southern heritage cuisine in Philadelphia's Spring Garden neighborhood. Dressy and business casual attire preferred.",
    website: "https://www.southjazzkitchen.com",
    primarySocialPlatform: "website",
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Date Night", "Late Night Vibes", "Locals Know"],
    notes: "Dressy and business casual attire are preferred.",
    ...coords("Philadelphia", "PA"),
  },
];
