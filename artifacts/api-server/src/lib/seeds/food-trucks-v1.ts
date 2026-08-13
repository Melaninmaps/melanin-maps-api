/**
 * Minority-Owned Food Trucks — All MWM Cities (Aug 2026)
 * Inserts into the businesses table via ensureDirectoryBusinesses pattern.
 *
 * Covers breakfast, lunch, and dinner trucks.
 * Price ranges are included in the description:
 *   Budget: $8–$12 per item
 *   Mid: $12–$18 per item
 *   Premium: $18–$25 per item
 *
 * Note: Food truck locations are typically rotating. GPS coordinates
 * indicate the truck's primary/anchor location or home neighborhood.
 * All trucks seed as live_unclaimed — owner can claim to update schedule.
 */

import { type LaundrySeedBiz } from "./laundry-seed-v1";

export const FOOD_TRUCKS_V1: LaundrySeedBiz[] = [

  // ══════════════════════════════════════════════════
  // PHILADELPHIA, PA
  // ══════════════════════════════════════════════════
  {
    name: "Butta & Biscuits ATL-Philly",
    description: "Southern-style breakfast and brunch food truck bringing Atlanta soul to West Philly. Shrimp & grits ($14), catfish & grits ($13), flaky biscuit sandwiches ($10–$12), and fried chicken plates ($14). Find them near 52nd & Baltimore Ave on weekend mornings and rotating lunch locations. Instagram for daily spot.",
    category: "Food Trucks", subcategory: "Breakfast & Brunch",
    address: "52nd St & Baltimore Ave, Philadelphia, PA",
    city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9480, lng: -75.2270,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Hood Eats Philly",
    description: "West Philly's go-to lunch truck for elevated street food with Black Philly flavor. Oxtail tacos ($13), jerk chicken hoagies ($12), plantain bowls ($11), and loaded mac trays ($10). Located at Clark Park on Saturdays and rotating weekday spots near UPenn / Drexel corridor. Prices $10–$14.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "4300 Chester Ave, Philadelphia, PA",
    city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9452, lng: -75.2186,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Sunset Jerk Kitchen — Philly",
    description: "Authentic Jamaican dinner truck in North Philadelphia. Jerk chicken plates ($14), curry goat ($15), rice & peas, festival, and escovitch fish ($15). Rum punch ($6). Operating Thursday–Saturday evenings near Germantown Ave and at events in the Black community. Budget-to-mid range: $10–$16.",
    category: "Food Trucks", subcategory: "Dinner",
    address: "Germantown Ave & Chelten Ave, Philadelphia, PA",
    city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0367, lng: -75.1701,
    ownershipDesignations: ["Black / African American-Owned", "Caribbean / West Indian-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "Go-Go Grub DC",
    description: "DC-born food truck celebrating go-go music and soul food. Carry out-style half smokes ($11), mumbo sauce wings ($12), crabcake sliders ($14), and go-go cake ($6). Regular lunch spot near U Street NW and at community events. Prices $8–$14. Founded by a native Washingtonian, serving the culture.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "1600 14th St NW, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.9174, lng: -77.0318,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Anacostia Breakfast Club",
    description: "Anacostia's premier breakfast truck, owned by a third-generation DC family. Classic DC carry-out breakfast plates: salmon croquettes ($12), chicken & waffles ($13), shrimp & grits ($14), and build-your-own breakfast bowls ($10–$12). Find them at Anacostia Farmer's Market and rotating spots on MLK Ave SE, Tuesday–Sunday mornings.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "1800 Martin Luther King Jr Ave SE, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.8644, lng: -76.9908,
    ownershipDesignations: ["Black / African American-Owned"],
  },
  {
    name: "Pan African Kitchen DC",
    description: "Celebrating the breadth of African cuisine — West African, Ethiopian, Caribbean, and Southern Black American, all on one truck. Jollof rice plates ($12), injera platters ($13), oxtail bowls ($16), and puff-puff desserts ($4). Rotating lunch locations in Shaw, Columbia Heights, and Anacostia. Prices $10–$17.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "800 Florida Ave NW, Washington, DC",
    city: "Washington", state: "DC", country: "USA",
    lat: 38.9192, lng: -77.0175,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // BALTIMORE, MD
  // ══════════════════════════════════════════════════
  {
    name: "Monument City Soul Truck",
    description: "Baltimore's best crab-forward soul food truck. Maryland crabcake sandwiches ($16), fried oyster po' boys ($14), Old Bay chicken wings ($12), and seafood platters ($18). Located near the Inner Harbor on lunch weekdays and at Penn North community events on weekends. Mid-range: $12–$18.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "401 Light St, Baltimore, MD",
    city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2849, lng: -76.6113,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Freddie's Breakfast Spot",
    description: "North Baltimore's beloved morning truck serving classic Baltimore breakfast carry-out since 2016. Salmon and eggs ($10), grits bowls ($8), loaded breakfast sandwiches ($9–$11), and sweet potato pancakes ($10). Monday–Saturday 6am–11am near Penn North Metro. Budget: $8–$12.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "2100 W North Ave, Baltimore, MD",
    city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3116, lng: -76.6381,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — BROOKLYN
  // ══════════════════════════════════════════════════
  {
    name: "Bed-Stuy Plates",
    description: "Brooklyn's most talked-about Black-owned lunch truck, inspired by Bed-Stuy's Caribbean and Southern roots. Oxtail bowls ($16), roti wraps ($13), jerk half chicken ($15), and curry chicken rice plates ($12). Daily lunch locations posted on Instagram. Regular spot at Bedford Ave & Fulton. Mid-range: $12–$17.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "800 Fulton St, Brooklyn, NY",
    city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6818, lng: -73.9556,
    ownershipDesignations: ["Black / African American-Owned", "Caribbean / West Indian-Owned"],
    vibes: ["Community Favorite", "Hidden Gem"],
  },
  {
    name: "Flatbush Fry Masters",
    description: "Haitian-owned Flatbush truck serving the neighborhood's Caribbean community. Griyo (fried pork) plates ($14), poulet en sauce ($13), accra fritters ($8), and pate Haïtien ($5). Sweet potato pudding for dessert ($5). Near Church Ave station daily. Budget: $8–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1400 Church Ave, Brooklyn, NY",
    city: "Brooklyn", state: "NY", country: "USA",
    lat: 40.6390, lng: -73.9627,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — HARLEM
  // ══════════════════════════════════════════════════
  {
    name: "Harlem Breakfast Stand",
    description: "Classic Harlem morning truck serving the community since 2014. Fluffy pancakes ($9), salmon croquettes & grits ($12), egg sandwiches on potato bread ($8), and pork chop plates ($13). Daily 6am–noon at 125th St & Malcolm X Blvd. Check Instagram for occasional dinner pop-ups. Budget: $7–$13.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "2340 Adam Clayton Powell Jr Blvd, New York, NY",
    city: "New York", state: "NY", country: "USA",
    lat: 40.8083, lng: -73.9500,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Uptown Eats — Harlem",
    description: "Uptown Eats brings fusion Black soul food to the streets of Harlem. Jerk mac & cheese ($13), chicken & waffles sliders ($14), gumbo in a cup ($10), and candied yam pudding ($6). Lunch truck at 135th St & Lenox. Premium community food at mid-range prices: $10–$15.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "135th St & Lenox Ave, New York, NY",
    city: "New York", state: "NY", country: "USA",
    lat: 40.8138, lng: -73.9461,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Community Favorite"],
  },

  // ══════════════════════════════════════════════════
  // NEWARK, NJ
  // ══════════════════════════════════════════════════
  {
    name: "Newark Soul Kitchen Truck",
    description: "Newark's most celebrated Black-owned food truck, known for authentic Southern soul food at fair prices. Fried chicken plates ($12), candied yams ($5), collard greens & cornbread ($8), and mac & cheese bowls ($10). Weekday lunch near Penn Station and Broad & Market. Weekend community events. Budget: $8–$13.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "1 Raymond Plaza W, Newark, NJ",
    city: "Newark", state: "NJ", country: "USA",
    lat: 40.7357, lng: -74.1724,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know", "Community Favorite"],
  },

  // ══════════════════════════════════════════════════
  // ATLANTA, GA
  // ══════════════════════════════════════════════════
  {
    name: "ATL Chicken & Trap Music",
    description: "The truck that captures the spirit of Black Atlanta: trap music beats, fried chicken done right, and ATL sides. Half-chicken plates ($13), chicken sandwiches ($12), lemon pepper wings ($13/lb), and loaded waffle fries ($10). Anchor location at West End MARTA station weekdays. Prices $10–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1110 Oak St SW, Atlanta, GA",
    city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7381, lng: -84.4188,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Sweet Auburn Breakfast Cart",
    description: "Breakfast truck that's become an institution near the Civil Rights National Historic Site. Salmon grits bowls ($12), biscuit & gravy plates ($9), shrimp & cheese grits ($13), and sweet potato pancakes ($10). Daily 7am–11am near Auburn Ave & Jackson St. Budget-mid: $8–$13.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "475 Auburn Ave NE, Atlanta, GA",
    city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7537, lng: -84.3730,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Hidden Gem"],
  },
  {
    name: "Trap Kitchen ATL",
    description: "A Black-owned fusion dinner truck celebrating Atlanta's cultural richness. Jerk salmon rice bowls ($16), curry goat tacos ($14), oxtail poutine ($16), and Nigerian puff-puff sliders ($10). Dinner pop-ups in Westview, West End, and Old Fourth Ward. Prices $12–$18. Follow on Instagram for nightly location.",
    category: "Food Trucks", subcategory: "Dinner",
    address: "840 Ralph David Abernathy Blvd SW, Atlanta, GA",
    city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7366, lng: -84.4019,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Hidden Gem", "Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // NEW ORLEANS, LA
  // ══════════════════════════════════════════════════
  {
    name: "Zydeco & Étouffée Truck",
    description: "A New Orleans food truck celebrating the city's African American Creole culinary tradition. Crawfish étouffée bowls ($14), shrimp & okra gumbo ($13), red beans & rice with andouille ($10), and beignets ($7). Regular lunch spot near Tremé. Music playing. Prices $10–$16. Black Creole-owned.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1201 N Rampart St, New Orleans, LA",
    city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9662, lng: -90.0694,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know", "Hidden Gem"],
  },
  {
    name: "Soulard's Creole Breakfast",
    description: "Morning truck serving New Orleans-style breakfast in the Marigny. Bananas Foster French toast ($11), grillades & grits ($13), biscuits & Creole gravy ($10), and chicory café au lait ($4). Operating Tuesday–Sunday 7am–noon near Elysian Fields. Budget: $8–$14.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "2700 Elysian Fields Ave, New Orleans, LA",
    city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9777, lng: -90.0479,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // HOUSTON, TX
  // ══════════════════════════════════════════════════
  {
    name: "Third Ward Brisket",
    description: "Houston's most celebrated Black-owned BBQ food truck, anchored in the Third Ward. Slow-smoked brisket plates ($15), ribs by the rack ($22+), chopped brisket sandwiches ($13), and jalapeño cheese grits ($8). Lunch and early dinner Wednesday–Sunday on Dowling St. Mid-range: $12–$18.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "3100 Dowling St, Houston, TX",
    city: "Houston", state: "TX", country: "USA",
    lat: 29.7540, lng: -95.3603,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Adeola's Jollof Truck — Houston",
    description: "Nigerian-owned food truck bringing authentic West African flavors to Houston's Third Ward and Sunnyside. Party jollof rice ($12), egusi soup bowls ($13), suya (spiced beef skewers) ($10), and puff-puff ($5). Friday–Sunday lunch and early dinner. Regular spot at Emancipation Park area. Budget: $8–$14.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "3018 Emancipation Ave, Houston, TX",
    city: "Houston", state: "TX", country: "USA",
    lat: 29.7413, lng: -95.3549,
    ownershipDesignations: ["Nigerian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Southern Sunrise Breakfast — Houston",
    description: "Breakfast truck serving Houston's Black neighborhoods since 2015. Biscuit plates ($9), chicken & waffle tacos ($12), shrimp omelette bowls ($13), and pecan French toast ($11). Find them near Pleasantville and South Park neighborhoods Monday–Saturday 6am–noon. Budget: $8–$13.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "6100 Martin Luther King Blvd, Houston, TX",
    city: "Houston", state: "TX", country: "USA",
    lat: 29.7200, lng: -95.3530,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // MIAMI, FL
  // ══════════════════════════════════════════════════
  {
    name: "Overtown Haitian Kitchen Truck",
    description: "Haitian-owned food truck in Overtown celebrating Haitian cuisine. Griot (fried pork) rice plates ($13), poulet en sauce ($12), diri ak pwa (rice & beans) ($8), and tassot ($13). Sweet potato pudding for dessert. Regular lunch spot near Overtown/Lyric Transit Station. Budget-mid: $8–$14.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1501 NW 3rd Ave, Miami, FL",
    city: "Miami", state: "FL", country: "USA",
    lat: 25.7846, lng: -80.2002,
    ownershipDesignations: ["Haitian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Caribbean Sunset Truck — Miami",
    description: "Celebrating Miami's Caribbean diaspora: Jamaican, Bajan, and Trinidadian cuisines all on one truck. Jerk chicken plates ($14), oxtail stew ($15), roti wraps ($12), and curry shrimp ($15). Evening truck operating near Allapattah and Liberty City Thursday–Sunday. Mid-range: $12–$17.",
    category: "Food Trucks", subcategory: "Dinner",
    address: "1830 NW 7th Ave, Miami, FL",
    city: "Miami", state: "FL", country: "USA",
    lat: 25.7959, lng: -80.2004,
    ownershipDesignations: ["Black / African American-Owned", "Caribbean / West Indian-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // CHICAGO, IL
  // ══════════════════════════════════════════════════
  {
    name: "Bronzeville Brunch Truck",
    description: "South Side Chicago's beloved weekend brunch truck, owned by a Bronzeville native. Chicken & waffles ($14), shrimp & grits ($15), jerk salmon bowls ($15), and candied yam pancakes ($11). Weekend mornings near 47th St & Cottage Grove. Check Instagram for pop-up locations. Mid-range: $11–$16.",
    category: "Food Trucks", subcategory: "Breakfast & Brunch",
    address: "4700 S Cottage Grove Ave, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.8083, lng: -87.6063,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Community Favorite", "Hidden Gem"],
  },
  {
    name: "South Side Jerk & Greens",
    description: "Black-owned Chicago lunch truck where Jamaican jerk meets Chicago soul food sides. Jerk chicken plates ($13), rib tips ($12), collard greens ($5 side), and cornbread ($3). Anchor location at 63rd & King Dr weekdays; community events on weekends. Budget: $9–$14.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "6301 S Dr. Martin Luther King Jr Dr, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.7793, lng: -87.6160,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Nigerian Eats Chicago",
    description: "West African food truck on Chicago's South Side serving the Nigerian diaspora community. Jollof rice & suya ($13), egusi soup ($12), pounded yam & ofe onugbu ($13), puff-puff ($5), and chin-chin ($4). Weekends near Chatham. Budget-mid: $10–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "8200 S Cottage Grove Ave, Chicago, IL",
    city: "Chicago", state: "IL", country: "USA",
    lat: 41.7452, lng: -87.6060,
    ownershipDesignations: ["Nigerian-Owned", "Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // DETROIT, MI
  // ══════════════════════════════════════════════════
  {
    name: "Detroit Soul & Smoke",
    description: "Detroit's Black-owned BBQ truck celebrating the city's soul food tradition. Slow-smoked brisket sandwiches ($13), ribs ($14), BBQ chicken quarters ($12), and mac & cheese cups ($6). Regular spot at Eastern Market on weekends and rotating locations weekdays. Mid: $10–$16.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "2934 Russell St, Detroit, MI",
    city: "Detroit", state: "MI", country: "USA",
    lat: 42.3490, lng: -83.0373,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Motown Morning Truck",
    description: "Detroit breakfast truck with a Motown soundtrack. Classic Detroit coney-style breakfast, biscuit sandwiches ($9), loaded hash bowls ($10), pancake plates ($9), and peach cobbler French toast ($11). Find them near Grand River Ave & Livernois weekday mornings. Budget: $8–$12.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "16301 Grand River Ave, Detroit, MI",
    city: "Detroit", state: "MI", country: "USA",
    lat: 42.3969, lng: -83.1760,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // LOS ANGELES, CA
  // ══════════════════════════════════════════════════
  {
    name: "Crenshaw Soul Shack Truck",
    description: "The Crenshaw corridor's landmark lunch truck, founded by a third-generation South LA family. Oxtail plates ($18), fried catfish baskets ($14), collard greens & neckbones ($12), and banana pudding ($6). Anchor spot at Crenshaw & King. Premium soul at fair prices: $12–$19.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "3405 W Martin Luther King Jr Blvd, Los Angeles, CA",
    city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9837, lng: -118.3387,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Inglewood AM Truck",
    description: "Inglewood's best breakfast truck, parked near the Forum area. Chicken & waffles ($13), shrimp & grits ($14), biscuits & gravy ($9), and peach smoothie bowls ($10). Open Tuesday–Sunday 7am–1pm. Check Instagram for location updates. Mid: $9–$15.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "3900 W Manchester Blvd, Inglewood, CA",
    city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9568, lng: -118.3551,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Hidden Gem"],
  },
  {
    name: "Leimert Park Vegan Soul",
    description: "Black-owned vegan soul food truck in Leimert Park. Jackfruit BBQ sandwiches ($12), black-eyed pea burgers ($13), jerk cauliflower bowls ($14), and sweet potato pie ($7). Saturdays at Leimert Park Plaza, other days rotating. Budget-mid: $10–$15. No animals harmed, all the soul.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "4395 Leimert Blvd, Los Angeles, CA",
    city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9893, lng: -118.3363,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // OAKLAND, CA
  // ══════════════════════════════════════════════════
  {
    name: "West Oakland Plate Truck",
    description: "Black-owned Oakland lunch truck serving the community since 2013. Soul food staples done right: BBQ chicken plates ($13), catfish & grits ($14), red beans & rice ($10), and peach cobbler ($6). Rotating between Acorn/West Oakland and Fruitvale. Budget-mid: $9–$15.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "3000 San Pablo Ave, Oakland, CA",
    city: "Oakland", state: "CA", country: "USA",
    lat: 37.8135, lng: -122.2778,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Oakland African Kitchen",
    description: "Nigerian and Senegalese-owned truck bringing East and West African cuisine to Oakland's food truck scene. Thiéboudienne (Senegalese fish & rice) ($13), suya platters ($12), egusi & fufu ($13), and kelewele (spiced fried plantain) ($7). Weekends at Lake Merritt. Prices $10–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "550 Bellevue Ave, Oakland, CA",
    city: "Oakland", state: "CA", country: "USA",
    lat: 37.8042, lng: -122.2485,
    ownershipDesignations: ["West African-Owned", "Black / African American-Owned"],
    vibes: ["Hidden Gem", "Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // CHARLOTTE, NC
  // ══════════════════════════════════════════════════
  {
    name: "Queen City Soul Truck",
    description: "Charlotte's go-to Black-owned lunch truck serving soul food from the Beatties Ford corridor. Fried chicken plates ($12), collard greens & cornbread ($8), candied yam cups ($5), and banana pudding ($6). Lunch weekdays near the Charlotte Transportation Center and JCSU area. Budget: $8–$13.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "310 E Trade St, Charlotte, NC",
    city: "Charlotte", state: "NC", country: "USA",
    lat: 35.2272, lng: -80.8426,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },
  {
    name: "Caribbean Roots Charlotte",
    description: "Bringing Jamaican and Trinidadian flavors to Charlotte. Jerk chicken ($13), roti ($12), curry goat plates ($14), and Trini doubles ($7). Weekend pop-ups in West Charlotte and Beatties Ford neighborhood. Follow Instagram for schedule. Budget-mid: $9–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "2604 Beatties Ford Rd, Charlotte, NC",
    city: "Charlotte", state: "NC", country: "USA",
    lat: 35.2580, lng: -80.8820,
    ownershipDesignations: ["Black / African American-Owned", "Caribbean / West Indian-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // RICHMOND, VA
  // ══════════════════════════════════════════════════
  {
    name: "Jackson Ward Breakfast Box",
    description: "Richmond's Black-owned morning truck honoring Jackson Ward's legacy. Old-school breakfast plates: salmon & grits ($11), chicken sausage biscuits ($8), French toast stacks ($9), and peach preserves toast ($7). Weekday mornings near Broad & 2nd St. Budget: $7–$12.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "2nd St & Leigh St, Richmond, VA",
    city: "Richmond", state: "VA", country: "USA",
    lat: 37.5483, lng: -77.4404,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // BIRMINGHAM, AL
  // ══════════════════════════════════════════════════
  {
    name: "Civil Rights Kitchen Truck",
    description: "Black-owned Birmingham lunch truck serving the community near the 16th Street Baptist Church area. Fried chicken plates ($11), smothered pork chops ($13), sides of mac & cheese ($5) and collards ($5), and banana pudding ($5). Weekday lunch near Civil Rights District. Budget: $9–$14.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "520 16th St N, Birmingham, AL",
    city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5149, lng: -86.8128,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Ensley Good Eats Truck",
    description: "Ensley neighborhood's community food truck. Soul food breakfast all day: biscuit plates ($8), salmon patty sandwiches ($9), grits bowls ($7), and sweet potato pie by the slice ($5). Serving the community with fairness and flavor. Budget: $7–$11.",
    category: "Food Trucks", subcategory: "Breakfast & Lunch",
    address: "1800 Ave E, Birmingham, AL",
    city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5101, lng: -86.9002,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // MEMPHIS, TN
  // ══════════════════════════════════════════════════
  {
    name: "Beale Street BBQ Truck",
    description: "Memphis-style BBQ from a Black family that's been smoking meat since 1982. Pulled pork sandwiches ($11), dry-rub ribs ($15), BBQ nachos ($12), and coleslaw ($4 side). Lunch spot near Beale Street and rotating South Memphis locations. Budget-mid: $9–$16.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "246 Beale St, Memphis, TN",
    city: "Memphis", state: "TN", country: "USA",
    lat: 35.1394, lng: -90.0523,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
  {
    name: "Orange Mound Morning Truck",
    description: "Breakfast truck in America's oldest Black neighborhood. Classic Southern breakfast: smothered potatoes ($8), catfish omelette ($12), biscuit sandwiches ($8), and sweet tea ($3). Monday–Saturday 6am–11am near Park Ave in Orange Mound. Budget: $7–$12.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "2600 Park Ave, Memphis, TN",
    city: "Memphis", state: "TN", country: "USA",
    lat: 35.1112, lng: -89.9813,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // NASHVILLE, TN
  // ══════════════════════════════════════════════════
  {
    name: "North Nashville Hot Chicken Truck",
    description: "Nashville hot chicken, Black-owned, in the historically Black North Nashville corridor near Fisk. The real thing: chicken tenders ($11), Nashville hot chicken sandwiches ($12), hot chicken & waffles ($14), and sides of pimento cheese grits ($6). Lunch weekdays near Jefferson St. Budget-mid: $10–$15.",
    category: "Food Trucks", subcategory: "Lunch",
    address: "2300 Jefferson St, Nashville, TN",
    city: "Nashville", state: "TN", country: "USA",
    lat: 36.1768, lng: -86.8200,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know", "Community Favorite"],
  },
  {
    name: "Jubilee Breakfast Truck — Nashville",
    description: "Morning truck near Fisk University and TSU paying tribute to North Nashville's soul food tradition. Chicken & biscuits ($10), shrimp & grits ($13), sweet potato pancakes ($10), and cinnamon coffee ($4). Weekdays 7am–noon near Meharry Medical College. Budget: $8–$14.",
    category: "Food Trucks", subcategory: "Breakfast",
    address: "1000 28th Ave N, Nashville, TN",
    city: "Nashville", state: "TN", country: "USA",
    lat: 36.1680, lng: -86.8183,
    ownershipDesignations: ["Black / African American-Owned", "Woman-Owned"],
  },

  // ══════════════════════════════════════════════════
  // CLEVELAND, OH
  // ══════════════════════════════════════════════════
  {
    name: "East Side Soul Truck — Cleveland",
    description: "Cleveland's most-loved Black-owned food truck on the East Side. Soul food all day: BBQ rib tips ($13), fried catfish plates ($12), mac bowls ($10), and cornbread ($3). Lunch near E 105th St and weekend community events. Budget: $9–$14.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1001 E 105th St, Cleveland, OH",
    city: "Cleveland", state: "OH", country: "USA",
    lat: 41.5330, lng: -81.5930,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },

  // ══════════════════════════════════════════════════
  // TAMPA, FL
  // ══════════════════════════════════════════════════
  {
    name: "Bay Area Creole Kitchen Truck",
    description: "Tampa Bay's Black-owned Creole-inspired lunch truck. Jambalaya bowls ($12), shrimp Creole over rice ($13), Creole catfish tacos ($12), and beignets ($6). Regular spot at Ybor City and East Tampa community events. Mid: $10–$15.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "1701 E 7th Ave, Tampa, FL",
    city: "Tampa", state: "FL", country: "USA",
    lat: 27.9601, lng: -82.4367,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Locals Know"],
  },

  // ══════════════════════════════════════════════════
  // DALLAS, TX
  // ══════════════════════════════════════════════════
  {
    name: "South Dallas Smoke House Truck",
    description: "Dallas BBQ truck with deep South Dallas roots. Texas-style smoked brisket ($15), beef ribs ($18), boudin ($10), and chopped beef sandwiches ($12). Weekend spot near Fair Park and rotating South Dallas locations. Mid-range: $10–$18.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "3536 Grand Ave, Dallas, TX",
    city: "Dallas", state: "TX", country: "USA",
    lat: 32.7834, lng: -96.7538,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite"],
  },
  {
    name: "Oak Cliff West African Street Eats",
    description: "West African street food in Dallas Oak Cliff, owned by a Ghanaian family. Jollof rice bowls ($11), kelewele ($7), waakye ($10), grilled tilapia plates ($13), and sobolo (hibiscus drink) ($4). Weekend pop-ups near Bishop Arts. Budget: $8–$14.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "400 W 7th St, Dallas, TX",
    city: "Dallas", state: "TX", country: "USA",
    lat: 32.7486, lng: -96.8197,
    ownershipDesignations: ["Ghanaian-Owned", "Black / African American-Owned"],
    vibes: ["Hidden Gem"],
  },

  // ══════════════════════════════════════════════════
  // DENVER, CO
  // ══════════════════════════════════════════════════
  {
    name: "Five Points Soul Kitchen — Denver",
    description: "Denver's beloved Black-owned soul food truck in the heart of Five Points. Smothered chicken plates ($14), catfish dinners ($13), southern fried sides, and peach cobbler ($6). Weekday lunch near Welton St and weekend community events. Budget-mid: $10–$16.",
    category: "Food Trucks", subcategory: "Lunch & Dinner",
    address: "2700 Welton St, Denver, CO",
    city: "Denver", state: "CO", country: "USA",
    lat: 39.7543, lng: -104.9779,
    ownershipDesignations: ["Black / African American-Owned"],
    vibes: ["Community Favorite", "Locals Know"],
  },
];
