// Founder-curated businesses from FINALIZED BUSINESS UPDATE MASTER LIST
// Sourced directly from the founder's master spreadsheet — each record was
// hand-selected, described, and tagged by the founder.
// listing_status: live_unclaimed (community-listed, not yet claimed by owner)

export interface FounderCuratedBusiness {
  name: string;
  city: string;
  state: string;
  category: string;
  subcategory: string;
  address: string | null;
  zip: string | null;
  description: string | null;
  website: string | null;
  ownershipDesignations: string[];
  blackOwned: boolean;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
}

export const FOUNDER_CURATED_BUSINESSES_SEED: FounderCuratedBusiness[] = [
  // ── Philadelphia, PA ────────────────────────────────────────────────────
  {
    name: "Honey Suckle",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "631 N Broad St",
    zip: "19123",
    description: "A cultural preservation space that redefines the limits of a restaurant. By Cybille St.Aude-Tate & Omar Tate",
    website: "https://www.instagram.com/honeysuckle_restaurant/",
    ownershipDesignations: ["black-owned", "woman-owned"],
    blackOwned: true,
    latitude: 39.9651,
    longitude: -75.1561,
    notes: "That Black Caesar Salad is worth every penny by itself",
  },
  {
    name: "Booker Restaurant & Bar",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "5021 Baltimore Ave",
    zip: "19143",
    description: "We do the simple things right. Booker's Restaurant and Bar — come for the food, stay for the vibe.",
    website: "https://www.instagram.com/bookers.westphilly/",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 39.9436,
    longitude: -75.2186,
    notes: "Hours: Brunch daily 10am–2:30pm, Dinner daily 5–9:30pm, Happy Hour Mon–Fri 5–7pm",
  },
  {
    name: "The Pink Plate Café",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "1525 E. Wadsworth Ave",
    zip: "19150",
    description: "Upscale Soul Food and Catering. We Pinky Promise Upscale Experiences.",
    website: "https://www.instagram.com/thee.pink.plate.cafe/",
    ownershipDesignations: ["black-owned", "woman-owned"],
    blackOwned: true,
    latitude: 40.0604,
    longitude: -75.1558,
    notes: "Tue–Fri 12–9pm, Sat 12–9pm, Sun 10am–4pm. Catering available.",
  },
  {
    name: "South Jazz Kitchen",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "600 N Broad St",
    zip: "19130",
    description: "Elevated Southern Cuisine. Dinner and live jazz Thursday through Sunday.",
    website: "https://www.instagram.com/southjazzkitchen/",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 39.9526,
    longitude: -75.1652,
    notes: null,
  },
  {
    name: "Two Street Crab House",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "604 S 2nd St",
    zip: "19147",
    description: "Black-owned seafood spot in South Philly.",
    website: "https://www.instagram.com/twostreetcrabhouse/",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 39.9378,
    longitude: -75.1444,
    notes: null,
  },
  {
    name: "Black Dragon Take Out",
    city: "Philadelphia",
    state: "PA",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "5260 Rodman St",
    zip: "19143",
    description: "Black American Chinese food. Dine in, take out, delivery and catering.",
    website: "https://www.instagram.com/blackdragontakeout/",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 39.9452,
    longitude: -75.2249,
    notes: "Open every day 11:00am–8:00pm",
  },
  {
    name: "Platinum Getaways Travel Agency",
    city: "Philadelphia",
    state: "PA",
    category: "Travel & Hospitality",
    subcategory: "Travel Experiences",
    address: "Elkins Park, PA (Virtual Agency)",
    zip: "19027",
    description: "Caribbean Destination Specialist. All-inclusive, luxury and family vacations, and more.",
    website: "https://www.instagram.com/platinumgetawaysta/",
    ownershipDesignations: ["black-owned", "woman-owned"],
    blackOwned: true,
    latitude: 39.9526,
    longitude: -75.1652,
    notes: "Travelpreneur. Caribbean Destination Specialist.",
  },

  // ── East Orange, NJ ────────────────────────────────────────────────────
  {
    name: "Systahood Beauty Supplies",
    city: "East Orange",
    state: "NJ",
    category: "Beauty & Personal Care",
    subcategory: "Beauty Supply",
    address: "61 Central Ave",
    zip: null,
    description: "Black-Owned Since 1999.",
    website: "https://www.tiktok.com/@systahoodbeautysupplies",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 40.7676,
    longitude: -74.2049,
    notes: "Open Late Until 10PM Thu–Sat. Uber Carrier Pickup Available.",
  },

  // ── Somerdale, NJ ──────────────────────────────────────────────────────
  {
    name: "Phenom Muse",
    city: "Somerdale",
    state: "NJ",
    category: "Beauty & Personal Care",
    subcategory: "Hair Salons",
    address: "112 N White Horse Pike",
    zip: "08083",
    description: "The healthy hair headquarters. Inspired hair, transformative growth. Everything here is designed to inspire growth — of your hair, your confidence, and your self care routine.",
    website: "https://www.phenommuse.com",
    ownershipDesignations: ["black-owned", "woman-owned"],
    blackOwned: true,
    latitude: 39.8445,
    longitude: -74.9891,
    notes: "South Jersey's Hair Care & Repair Expert & Educator.",
  },

  // ── North Plainfield, NJ ───────────────────────────────────────────────
  {
    name: "N Plainfield Barber",
    city: "North Plainfield",
    state: "NJ",
    category: "Beauty & Personal Care",
    subcategory: "Barbershops",
    address: "North Plainfield, NJ",
    zip: null,
    description: "Barbershop serving North Plainfield, NJ.",
    website: null,
    ownershipDesignations: [],
    blackOwned: false,
    latitude: 40.6259,
    longitude: -74.4357,
    notes: null,
  },

  // ── Montclair, NJ ──────────────────────────────────────────────────────
  {
    name: "Mesob Restaurant",
    city: "Montclair",
    state: "NJ",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "515 Bloomfield Ave",
    zip: "07042",
    description: "Voted #1 in NJ. Authentic Ethiopian cuisine. Vegan & meat lovers welcome.",
    website: null,
    ownershipDesignations: ["ethiopian-owned", "black-owned"],
    blackOwned: true,
    latitude: 40.8257,
    longitude: -74.2085,
    notes: null,
  },

  // ── Hillside, NJ ───────────────────────────────────────────────────────
  {
    name: "Blackstonez Nail Bar",
    city: "Hillside",
    state: "NJ",
    category: "Beauty & Personal Care",
    subcategory: "Nail Salons & Nail Artists",
    address: "Hillside, NJ",
    zip: null,
    description: "Where beauty meets luxury. Polygel Nail and Toe Technicians.",
    website: "https://www.instagram.com/blackstoneznailbar/",
    ownershipDesignations: ["black-owned", "woman-owned"],
    blackOwned: true,
    latitude: 40.6940,
    longitude: -74.2282,
    notes: null,
  },

  // ── Raleigh, NC ────────────────────────────────────────────────────────
  {
    name: "Morena's Dominican Hair Salon",
    city: "Raleigh",
    state: "NC",
    category: "Beauty & Personal Care",
    subcategory: "Hair Salons",
    address: "6350 Plantation Center Dr",
    zip: null,
    description: "Dominican hair salon serving Raleigh, NC.",
    website: "https://www.instagram.com/dominican.hair.salon/",
    ownershipDesignations: ["dominican-owned", "woman-owned"],
    blackOwned: false,
    latitude: 35.7796,
    longitude: -78.6382,
    notes: null,
  },

  // ── Washington, DC ─────────────────────────────────────────────────────
  {
    name: "Silk Lounge DC",
    city: "Washington",
    state: "DC",
    category: "Food & Drink",
    subcategory: "Restaurants",
    address: "1503 9th St. NW",
    zip: "20001",
    description: "Experience the Epitome of Luxury Dining. Hookah | Cocktails | Food.",
    website: "https://www.instagram.com/silkloungedc/",
    ownershipDesignations: ["black-owned"],
    blackOwned: true,
    latitude: 38.9152,
    longitude: -77.0224,
    notes: "Happy Hour Mon–Fri 5–7pm. Brunch Sat–Sun 12–4pm.",
  },
];
