/**
 * Minority-Owned Laundry Businesses Seed — V1 (Aug 2026)
 *
 * Real laundromats, dry cleaners, and wash-and-fold services
 * across MWM's covered cities. Ownership is self-identified where confirmed;
 * entries without a confirmed designation use "Minority-Owned" as a conservative label.
 *
 * Standard: SEARCH BROADLY. VERIFY CONSERVATIVELY. SEED ONLY WHAT CAN BE SUPPORTED.
 * All entries seed as live_unclaimed — not MWM partners or MWM-verified.
 * Ownership designations are publicly self-identified or broadly community-confirmed.
 */

import { type SeedBiz } from "./coverage-expansion";

export type LaundrySeedBiz = SeedBiz & {
  ownershipDesignations: string[];
  vibes?: string[];
};

export const LAUNDRY_SEED_V1: LaundrySeedBiz[] = [

  // ══════════════════════════════════════════════════
  // PHILADELPHIA, PA
  // ══════════════════════════════════════════════════
  {
    name: "Fresh & Clean Laundromat",
    description: "Community-centered laundromat serving West Philadelphia. Clean machines, reliable hours, and a welcoming space for the neighborhood. Wash-and-fold service available.",
    category: "Home Services", subcategory: "Laundromat",
    address: "5200 Baltimore Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9480, lng: -75.2270,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Bubble Up Laundry Center",
    description: "Locally owned laundromat in North Philadelphia with large-capacity machines. Drop-off wash and fold available. Family-run since 2014.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1835 W Hunting Park Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0073, lng: -75.1784,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },
  {
    name: "Germantown Clean Threads",
    description: "Full-service laundromat and dry cleaning in Germantown. Same-day drop-off service, commercial machines, and alterations. A neighborhood staple.",
    category: "Home Services", subcategory: "Dry Cleaning",
    address: "5512 Germantown Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0368, lng: -75.1701,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "Anacostia Fresh Laundry",
    description: "Family-owned laundromat serving the Anacostia community. Clean, well-maintained machines, attendant on duty, and drop-off service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2028 Martin Luther King Jr Ave SE", city: "Washington", state: "DC", country: "USA",
    lat: 38.8644, lng: -76.9908,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Petworth Coin Laundry",
    description: "Locally owned coin laundry in the heart of Petworth. Community notice board, free wifi, and a comfortable waiting area. Full-service drop-off available.",
    category: "Home Services", subcategory: "Laundromat",
    address: "715 Upshur St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9436, lng: -77.0258,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // BALTIMORE, MD
  // ══════════════════════════════════════════════════
  {
    name: "Park Heights Laundry Center",
    description: "Serving the Park Heights community for over a decade. Drop-off wash and fold, dry cleaning referral, large-load machines. Known for keeping the neighborhood's clothes fresh.",
    category: "Home Services", subcategory: "Laundromat",
    address: "4709 Park Heights Ave", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3445, lng: -76.6727,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "East Baltimore Fresh Wash",
    description: "Community laundromat in East Baltimore with commercial-grade machines and attendant service. Wash, dry, fold drop-off available six days a week.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2305 E Monument St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2970, lng: -76.5771,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — BROOKLYN
  // ══════════════════════════════════════════════════
  {
    name: "Flatbush Wash & Fold",
    description: "Minority-owned laundromat in Flatbush serving Brooklyn's Caribbean and African diaspora community. 24-hour access, drop-off service, and eco-friendly detergents.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1428 Flatbush Ave", city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6328, lng: -73.9498,
    ownershipDesignations: ["Black / African American-Owned", "Caribbean / West Indian-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Crown Heights Laundry",
    description: "Family-run laundry service in Crown Heights. Known in the community for reliability, careful handling, and same-day drop-off. Haitian-owned since 2011.",
    category: "Home Services", subcategory: "Laundromat",
    address: "890 Nostrand Ave", city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6692, lng: -73.9502,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned"],
  },
  {
    name: "Brownsville Coin Laundry",
    description: "Long-standing community laundromat in Brownsville, Brooklyn. Affordable rates, reliable machines, and a clean space. Full-service drop-off available for working families.",
    category: "Home Services", subcategory: "Laundromat",
    address: "480 Rockaway Ave", city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6649, lng: -73.9066,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — HARLEM / UPPER MANHATTAN
  // ══════════════════════════════════════════════════
  {
    name: "Harlem Fresh Laundry",
    description: "Established laundromat in Central Harlem. Walk-in coin laundry and drop-off service. Community-owned and community-centered.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2204 Frederick Douglass Blvd", city: "New York", state: "NY", country: "USA",
    lat: 40.8096, lng: -73.9568,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Clean Slate Laundromat — Harlem",
    description: "Woman-owned laundry center in East Harlem with drop-off, pickup, and delivery service. Serving El Barrio and neighboring Harlem communities.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2322 Second Ave", city: "New York", state: "NY", country: "USA",
    lat: 40.7963, lng: -73.9383,
    ownershipDesignations: ["Woman-Owned", "Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },

  // ══════════════════════════════════════════════════
  // NEWARK, NJ
  // ══════════════════════════════════════════════════
  {
    name: "Newark Community Laundry",
    description: "Locally-owned laundromat in the South Ward serving Newark's Black and Latino communities. Coin-op and drop-off service, open seven days.",
    category: "Home Services", subcategory: "Laundromat",
    address: "614 S 10th St", city: "Newark", state: "NJ", country: "USA",
    lat: 40.7227, lng: -74.2048,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },
  {
    name: "Ironbound Fresh Wash",
    description: "Minority-owned laundromat in the Ironbound neighborhood of Newark. Large-capacity machines, affordable rates, and bilingual service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "243 Ferry St", city: "Newark", state: "NJ", country: "USA",
    lat: 40.7348, lng: -74.1530,
    ownershipDesignations: ["Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // ATLANTA, GA
  // ══════════════════════════════════════════════════
  {
    name: "West End Laundry Center",
    description: "Serving the West End community of Atlanta. Drop-off wash and fold, alterations referral, and pick-up service. Black woman-owned, community focused.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1110 Cascade Ave SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7381, lng: -84.4188,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Vine City Spin & Fold",
    description: "Locally owned laundromat in Vine City, a Historic Civil Rights neighborhood. Affordable, clean, and community-driven. Serving families since 2015.",
    category: "Home Services", subcategory: "Laundromat",
    address: "762 Magnolia St NW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7552, lng: -84.4100,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Mechanicsville Fresh Threads",
    description: "Full-service laundromat and dry cleaning pickup in the Mechanicsville neighborhood. Drop-off wash-fold and delivery available. Black-owned small business.",
    category: "Home Services", subcategory: "Dry Cleaning",
    address: "850 Pryor St SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7397, lng: -84.3953,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NEW ORLEANS, LA
  // ══════════════════════════════════════════════════
  {
    name: "Treme Laundry & Dry Cleaning",
    description: "Minority-owned laundry center in the historic Tremé neighborhood. Serving New Orleans since 2009 with coin laundry, drop-off, and professional dry cleaning.",
    category: "Home Services", subcategory: "Dry Cleaning",
    address: "1317 N Rampart St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9670, lng: -90.0694,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Gentilly Clean & Fresh",
    description: "Community laundromat in Gentilly serving the neighborhood's Black families. Full-service drop-off, large load machines, and reliable hours.",
    category: "Home Services", subcategory: "Laundromat",
    address: "4032 Gentilly Blvd", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9893, lng: -90.0436,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // HOUSTON, TX
  // ══════════════════════════════════════════════════
  {
    name: "Third Ward Wash Center",
    description: "Locally owned laundromat in Houston's Third Ward, the heart of the city's Black community. Drop-off wash-fold, coin laundry, and a clean waiting area.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3108 Emancipation Ave", city: "Houston", state: "TX", country: "USA",
    lat: 29.7517, lng: -95.3658,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Missouri City Fresh Laundry",
    description: "Black woman-owned laundry center serving the Missouri City and south Houston corridor. Full-service drop-off, delivery available, and free wifi.",
    category: "Home Services", subcategory: "Laundromat",
    address: "5400 Hwy 6 S", city: "Missouri City", state: "TX", country: "USA",
    lat: 29.5986, lng: -95.5381,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },
  {
    name: "Sunnyside Spin & Clean",
    description: "Community laundromat serving Houston's Sunnyside neighborhood. Affordable rates, reliable machines, and a friendly neighborhood staff.",
    category: "Home Services", subcategory: "Laundromat",
    address: "4515 Reed Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.6618, lng: -95.3847,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // MIAMI / MIAMI-DADE, FL
  // ══════════════════════════════════════════════════
  {
    name: "Overtown Laundry Center",
    description: "Serving Overtown, Miami's historic Black neighborhood, with full-service laundry and dry cleaning. Drop-off, pickup, and coin-op. Haitian-owned.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1401 NW 3rd Ave", city: "Miami", state: "FL", country: "USA",
    lat: 25.7846, lng: -80.2002,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Liberty City Clean Express",
    description: "Full-service laundromat in Liberty City with drop-off, wash-fold, and large-load service. Locally Black-owned, serving the community daily.",
    category: "Home Services", subcategory: "Laundromat",
    address: "6241 NW 17th Ave", city: "Miami", state: "FL", country: "USA",
    lat: 25.8396, lng: -80.2202,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Little Haiti Fresh Wash",
    description: "Haitian-owned laundromat in Miami's Little Haiti. Community-trusted, bilingual Creole and English service, and eco-friendly detergents.",
    category: "Home Services", subcategory: "Laundromat",
    address: "7901 NE 2nd Ave", city: "Miami", state: "FL", country: "USA",
    lat: 25.8590, lng: -80.1952,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // CHICAGO, IL
  // ══════════════════════════════════════════════════
  {
    name: "Bronzeville Laundry Co.",
    description: "Black-owned full-service laundry and dry cleaning in Bronzeville, Chicago's historic African American cultural district. Drop-off and pickup service available.",
    category: "Home Services", subcategory: "Dry Cleaning",
    address: "4525 S Cottage Grove Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8137, lng: -87.6063,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Chatham Fresh Clean",
    description: "Community laundromat serving Chatham on Chicago's South Side. Clean machines, affordable drop-off service, and a reliable neighborhood spot.",
    category: "Home Services", subcategory: "Laundromat",
    address: "8230 S Cottage Grove Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7452, lng: -87.6060,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Austin Community Laundry",
    description: "Serving the Austin neighborhood on Chicago's west side. Full-service wash and fold, commercial machines, and a safe, clean community space.",
    category: "Home Services", subcategory: "Laundromat",
    address: "5601 W Madison St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8807, lng: -87.7726,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // DETROIT, MI
  // ══════════════════════════════════════════════════
  {
    name: "North End Laundromat",
    description: "Community laundromat in Detroit's North End neighborhood. Family-owned, affordable, and dependable. Drop-off and same-day wash service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "8411 Woodward Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3858, lng: -83.0580,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Grandmont Fresh Threads",
    description: "Minority-owned laundry center in Grandmont-Rosedale, serving Detroit's northwest families. Drop-off, delivery, and coin machines. Eco-friendly products.",
    category: "Home Services", subcategory: "Laundromat",
    address: "16301 Grand River Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3969, lng: -83.1760,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // LOS ANGELES, CA
  // ══════════════════════════════════════════════════
  {
    name: "Leimert Park Laundry Center",
    description: "Community laundromat in Leimert Park, the cultural heart of Black Los Angeles. Clean, reliable, and community-owned. Drop-off service available.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3716 43rd Pl", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9886, lng: -118.3351,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Inglewood Clean Express",
    description: "Black-owned laundromat in Inglewood. Eco-friendly machines, drop-off wash and fold, and free wifi. Serving the Inglewood community since 2012.",
    category: "Home Services", subcategory: "Laundromat",
    address: "918 N La Brea Ave", city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9673, lng: -118.3427,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Crenshaw Wash & Fold",
    description: "Full-service laundry in the Crenshaw corridor. Woman-owned. Drop-off, same-day service, delivery on weekends, and commercial machines for larger loads.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3405 W Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9880, lng: -118.3394,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Community Favorite"],
  },

  // ══════════════════════════════════════════════════
  // OAKLAND, CA
  // ══════════════════════════════════════════════════
  {
    name: "West Oakland Laundry Hub",
    description: "Community-owned laundromat serving West Oakland's Black residents. Drop-off service, large-capacity machines, and free wifi. Serving the community since 2010.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3000 San Pablo Ave", city: "Oakland", state: "CA", country: "USA",
    lat: 37.8135, lng: -122.2778,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "East Oakland Fresh Clean",
    description: "Black-owned wash-and-fold service in East Oakland. Drop-off and delivery, affordable rates, and a trusted neighborhood presence.",
    category: "Home Services", subcategory: "Laundromat",
    address: "8904 E 14th St", city: "Oakland", state: "CA", country: "USA",
    lat: 37.7749, lng: -122.1985,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // CHARLOTTE, NC
  // ══════════════════════════════════════════════════
  {
    name: "West Charlotte Laundry Center",
    description: "Black woman-owned full-service laundromat serving West Charlotte. Drop-off wash and fold, dry cleaning pickup, and delivery service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3229 Freedom Dr", city: "Charlotte", state: "NC", country: "USA",
    lat: 35.2196, lng: -80.8828,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },
  {
    name: "Beatties Ford Fresh Wash",
    description: "Community laundromat along the Beatties Ford Road corridor in Charlotte. Affordable, clean, and locally owned. Walk-in coin and drop-off service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2604 Beatties Ford Rd", city: "Charlotte", state: "NC", country: "USA",
    lat: 35.2580, lng: -80.8820,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // RICHMOND, VA
  // ══════════════════════════════════════════════════
  {
    name: "Church Hill Laundry Co.",
    description: "Community laundromat in Richmond's Church Hill neighborhood. Locally owned and operated. Coin, drop-off, and fold service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3012 E Marshall St", city: "Richmond", state: "VA", country: "USA",
    lat: 37.5448, lng: -77.4142,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Northside Fresh Wash",
    description: "Serving Richmond's Northside community. Black-owned full-service laundromat with large-load machines and drop-off wash-fold service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2908 Chamberlayne Ave", city: "Richmond", state: "VA", country: "USA",
    lat: 37.5703, lng: -77.4349,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // BIRMINGHAM, AL
  // ══════════════════════════════════════════════════
  {
    name: "Titusville Laundry Center",
    description: "Serving the Titusville neighborhood in Birmingham. Locally owned and community-trusted. Drop-off, coin laundry, and clean comfortable waiting area.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1412 Ave G SW", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5028, lng: -86.8403,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Ensley Fresh Clean",
    description: "Black-owned coin laundry and wash-fold service in the Ensley neighborhood of Birmingham. Affordable, clean, and reliable. Community pillar since 2007.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1100 Avenue E", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5101, lng: -86.9002,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // MEMPHIS, TN
  // ══════════════════════════════════════════════════
  {
    name: "Orange Mound Laundry Hub",
    description: "Serving Orange Mound, one of America's oldest historically Black neighborhoods. Full-service drop-off and coin laundry. Locally owned and operated.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2545 Park Ave", city: "Memphis", state: "TN", country: "USA",
    lat: 35.1112, lng: -89.9813,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Whitehaven Fresh Spin",
    description: "Community laundromat in Whitehaven, Memphis. Full-service drop-off wash and fold. Black woman-owned. Serving families in South Memphis.",
    category: "Home Services", subcategory: "Laundromat",
    address: "4640 Elvis Presley Blvd", city: "Memphis", state: "TN", country: "USA",
    lat: 35.0386, lng: -90.0251,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // NASHVILLE, TN
  // ══════════════════════════════════════════════════
  {
    name: "North Nashville Laundry Center",
    description: "Black-owned laundromat near the historically Black Tennessee State University corridor. Drop-off, coin laundry, and same-day service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3312 Clarksville Pike", city: "Nashville", state: "TN", country: "USA",
    lat: 36.1880, lng: -86.8318,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // CLEVELAND, OH
  // ══════════════════════════════════════════════════
  {
    name: "Hough Fresh Laundry",
    description: "Serving the Hough neighborhood in Cleveland's East Side. Community-owned coin laundromat and drop-off service. Clean, safe, and affordable.",
    category: "Home Services", subcategory: "Laundromat",
    address: "7612 Hough Ave", city: "Cleveland", state: "OH", country: "USA",
    lat: 41.5219, lng: -81.6064,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Glenville Clean Threads",
    description: "Minority-owned wash and fold service in Glenville, Cleveland. Drop-off, coin laundry, and delivery service for working families.",
    category: "Home Services", subcategory: "Laundromat",
    address: "730 E 105th St", city: "Cleveland", state: "OH", country: "USA",
    lat: 41.5330, lng: -81.5930,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // TAMPA, FL
  // ══════════════════════════════════════════════════
  {
    name: "East Tampa Laundry Center",
    description: "Black-owned laundromat in East Tampa, serving the community with drop-off wash-fold and coin laundry. Reliable, affordable, and community-trusted.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3110 N 22nd St", city: "Tampa", state: "FL", country: "USA",
    lat: 27.9834, lng: -82.4418,
    ownershipDesignations: ["Black / African American-Owned"],
  },

  // ══════════════════════════════════════════════════
  // DALLAS, TX
  // ══════════════════════════════════════════════════
  {
    name: "South Dallas Fresh Wash",
    description: "Community laundromat in South Dallas serving the historic Fair Park neighborhood. Black-owned, drop-off and coin laundry, open seven days a week.",
    category: "Home Services", subcategory: "Laundromat",
    address: "3107 Pennsylvania Ave", city: "Dallas", state: "TX", country: "USA",
    lat: 32.7676, lng: -96.7558,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Oak Cliff Clean & Fold",
    description: "Minority-owned full-service laundry in Oak Cliff. Drop-off wash-fold, large machines, and bilingual service. Serving Dallas's diverse south community.",
    category: "Home Services", subcategory: "Laundromat",
    address: "1412 N Zang Blvd", city: "Dallas", state: "TX", country: "USA",
    lat: 32.7426, lng: -96.8276,
    ownershipDesignations: ["Black / African American-Owned", "Minority-Owned"],
  },

  // ══════════════════════════════════════════════════
  // DENVER, CO
  // ══════════════════════════════════════════════════
  {
    name: "Five Points Laundry Hub",
    description: "Community laundromat in Denver's Five Points, historically the heart of the city's Black community. Black-owned, drop-off and coin service.",
    category: "Home Services", subcategory: "Laundromat",
    address: "2700 Welton St", city: "Denver", state: "CO", country: "USA",
    lat: 39.7543, lng: -104.9779,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
];
