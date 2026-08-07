/**
 * Manus Tour Guide — Pass 2 Extraction
 * data_source: "manus_tour_guide_pass_2"
 *
 * Covers all remaining entities from all three Manus AI tour guide PDFs.
 * Upserts on LOWER(name) + LOWER(city) — safe to run multiple times.
 * Philadelphia → listing_status: "live_unclaimed"
 * All other cities → listing_status: "staged"
 */

import { Pool } from "pg";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Entity {
  name: string;
  description: string;
  category: string;
  heritage_category?: string;
  subcategory?: string;
  ethnic_community?: string;
  city: string;
  state: string;
  address?: string;
  era?: string;
  significance?: string;
  is_accessible?: boolean;
  is_family_friendly?: boolean;
  admission_free?: boolean;
  year_established?: number;
  external_url?: string;
  pin_type: string;
  visit_tip?: string;
  content_note?: string;
  practical_tips?: string;
  listing_status: string;
}

// ─── City centre coordinates (used when no address geocode is available) ──────
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Philadelphia PA": { lat: 39.9526, lng: -75.1652 },
  "Washington DC": { lat: 38.9072, lng: -77.0369 },
  "Richmond VA": { lat: 37.5407, lng: -77.436 },
  "Raleigh NC": { lat: 35.7796, lng: -78.6382 },
  "Durham NC": { lat: 35.994, lng: -78.8986 },
  "Charlotte NC": { lat: 35.2271, lng: -80.8431 },
  "Columbia SC": { lat: 34.0007, lng: -81.0348 },
  "Atlanta GA": { lat: 33.749, lng: -84.388 },
  "Montgomery AL": { lat: 32.3617, lng: -86.2792 },
  "Birmingham AL": { lat: 33.5186, lng: -86.8104 },
  "Mobile AL": { lat: 30.6954, lng: -88.0399 },
  "Tuskegee AL": { lat: 32.4257, lng: -85.6944 },
  "Baton Rouge LA": { lat: 30.4515, lng: -91.1871 },
  "New Orleans LA": { lat: 29.9511, lng: -90.0715 },
  "Houston TX": { lat: 29.7604, lng: -95.3698 },
  "Dallas TX": { lat: 32.7767, lng: -96.797 },
  "Fort Worth TX": { lat: 32.7555, lng: -97.3308 },
  "San Antonio TX": { lat: 29.4241, lng: -98.4936 },
  "New York NY": { lat: 40.7128, lng: -74.006 },
  "Newark NJ": { lat: 40.7357, lng: -74.1724 },
  "Allentown PA": { lat: 40.6084, lng: -75.4902 },
  "Willow Grove PA": { lat: 40.1454, lng: -75.1196 },
  "Harrisburg PA": { lat: 40.2732, lng: -76.8867 },
  "Baltimore MD": { lat: 39.2904, lng: -76.6122 },
  "Boston MA": { lat: 42.3601, lng: -71.0589 },
  "Hartford CT": { lat: 41.7658, lng: -72.6851 },
  "Jacksonville FL": { lat: 30.3322, lng: -81.6557 },
  "Miami FL": { lat: 25.7617, lng: -80.1918 },
  "Orlando FL": { lat: 28.5383, lng: -81.3792 },
  "Tampa FL": { lat: 27.9506, lng: -82.4572 },
  "Savannah GA": { lat: 32.0835, lng: -81.0998 },
  "Charleston SC": { lat: 32.7765, lng: -79.9311 },
  "Nashville TN": { lat: 36.1627, lng: -86.7816 },
  "Memphis TN": { lat: 35.1495, lng: -90.0489 },
  "Detroit MI": { lat: 42.3314, lng: -83.0458 },
  "Dearborn MI": { lat: 42.3223, lng: -83.1763 },
  "Cleveland OH": { lat: 41.4993, lng: -81.6944 },
  "Columbus OH": { lat: 39.9612, lng: -82.9988 },
  "Cincinnati OH": { lat: 39.1031, lng: -84.512 },
  "St. Louis MO": { lat: 38.627, lng: -90.1994 },
  "Kansas City MO": { lat: 39.0997, lng: -94.5786 },
  "Indianapolis IN": { lat: 39.7684, lng: -86.1581 },
  "Milwaukee WI": { lat: 43.0389, lng: -87.9065 },
  "Minneapolis MN": { lat: 44.9778, lng: -93.265 },
  "Tulsa OK": { lat: 36.154, lng: -95.9928 },
  "Jackson MS": { lat: 32.2988, lng: -90.1848 },
  "Los Angeles CA": { lat: 34.0522, lng: -118.2437 },
  "Oakland CA": { lat: 37.8044, lng: -122.2712 },
  "San Francisco CA": { lat: 37.7749, lng: -122.4194 },
  "Denver CO": { lat: 39.7392, lng: -104.9903 },
  "Phoenix AZ": { lat: 33.4484, lng: -112.074 },
  "Las Vegas NV": { lat: 36.1699, lng: -115.1398 },
  "Seattle WA": { lat: 47.6062, lng: -122.3321 },
  "Portland OR": { lat: 45.5051, lng: -122.675 },
  "Chicago IL": { lat: 41.8781, lng: -87.6298 },
};

function resolveCoords(e: Entity): { lat: number; lng: number; approx: boolean } {
  const key = `${e.city} ${e.state}`;
  const c = CITY_CENTERS[key];
  if (c) return { lat: c.lat, lng: c.lng, approx: true };
  return { lat: 0, lng: 0, approx: true };
}

// ─── Pass 2 Entity Data ───────────────────────────────────────────────────────
const GUIDE_ENTITIES_PASS2: Entity[] = [

  // ════════════════════════════════════════════════════════════════════
  // PHILADELPHIA PA (live_unclaimed) — additional businesses from guide
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Hakim's Bookstore",
    description: "A legendary Philadelphia Black-owned bookstore and cultural institution in West Philadelphia — one of the oldest Black bookstores in the United States, a gathering place for community learning and Black literary culture for generations.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Philadelphia", state: "PA",
    address: "210 S 52nd St, Philadelphia, PA 19139",
    pin_type: "business_retail", listing_status: "live_unclaimed",
    visit_tip: "One of the longest-running Black bookstores in America — every purchase here is an investment in a living institution that has sustained Black Philadelphia's literary and intellectual life for decades.",
    content_note: "Community anchor; oldest Black bookstore in the city.",
  },
  {
    name: "Harriett's Bookshop",
    description: "A Philadelphia Black-owned feminist bookshop in Fishtown celebrating women writers, particularly women of color — a cultural hub named for Harriet Tubman offering books, gifts, and community events centered on justice and liberation.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Philadelphia", state: "PA",
    address: "258 E Girard Ave, Philadelphia, PA 19125",
    pin_type: "business_retail", listing_status: "live_unclaimed",
    visit_tip: "Harriett's curates with intention — every shelf is a statement about whose stories matter. The selection of Black women's literature, paired with community events, makes this as much a cultural organization as a bookstore.",
  },
  {
    name: "Kilimandjaro Restaurant",
    description: "A Philadelphia West African restaurant offering traditional dishes from across the continent — an authentic taste of West African culinary heritage in one of the city's most culturally diverse neighborhoods.",
    category: "restaurant", ethnic_community: "West African",
    city: "Philadelphia", state: "PA",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "West African cuisine in Philadelphia often goes under-celebrated — Kilimandjaro offers an authentic window into the food traditions that connect Philadelphia's African immigrant community to the continent.",
  },
  {
    name: "South Philly Barbacoa",
    description: "A Philadelphia Mexican-owned restaurant serving authentic lamb barbacoa and Mexican street food by Mexican immigrant cook Cristina Martinez — a James Beard nominee and community pillar who built her business from a food cart into a beloved restaurant.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Philadelphia", state: "PA",
    address: "1703 S 11th St, Philadelphia, PA 19148",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "Cristina Martinez's story — from undocumented immigrant and food cart cook to James Beard nominee — is as powerful as the barbacoa she serves. The weekend-only lamb is worth planning your trip around.",
  },
  {
    name: "Taller Puertorriqueño",
    description: "A Philadelphia Puerto Rican cultural center in Kensington that is one of the oldest Latino arts organizations in the region — offering exhibitions, theater, youth programs, and the preservation of Puerto Rican cultural heritage in North Philadelphia.",
    category: "cultural_organization", ethnic_community: "Puerto Rican",
    city: "Philadelphia", state: "PA",
    address: "2600 N 5th St, Philadelphia, PA 19133",
    pin_type: "cultural_site", listing_status: "live_unclaimed",
    visit_tip: "Taller is the cultural anchor of North Philadelphia's Puerto Rican community — the storefront murals, exhibitions, and youth programs represent decades of work to ensure that Puerto Rican culture thrives in Kensington despite poverty and displacement.",
  },
  {
    name: "Suraya Philadelphia",
    description: "A Philadelphia Lebanese-owned restaurant in Fishtown serving modern Lebanese cuisine with locally-sourced ingredients — a James Beard Award winner celebrating Lebanese culinary heritage through wood-fired cooking and traditional mezes.",
    category: "restaurant", ethnic_community: "Lebanese",
    city: "Philadelphia", state: "PA",
    address: "1528 Frankford Ave, Philadelphia, PA 19125",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "Suraya's wood-fired mezze and Lebanese wine selection represent the intersection of tradition and sophistication — the restaurant honors the Haddad family's Lebanese heritage while sourcing ingredients from Pennsylvania farms.",
  },
  {
    name: "Tierra Colombiana Restaurant",
    description: "A Philadelphia Colombian restaurant serving traditional Colombian dishes in the heart of North Philadelphia — a multi-generational institution celebrating Colombian culinary heritage with bandeja paisa, arepas, and homemade empanadas.",
    category: "restaurant", ethnic_community: "Colombian",
    city: "Philadelphia", state: "PA",
    address: "4535 N 5th St, Philadelphia, PA 19140",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "One of the oldest Colombian restaurants in Philadelphia, Tierra Colombiana represents the deep roots of the Colombian diaspora in North Philly — the bandeja paisa is a feast that tells the story of Colombian abundance and generosity.",
  },
  {
    name: "Càphê Roasters",
    description: "A Philadelphia Vietnamese-owned specialty coffee shop celebrating Vietnamese coffee culture — roasting beans in-house and serving traditional Vietnamese drip coffee alongside contemporary cafe beverages in a space that honors diaspora identity.",
    category: "cafe", ethnic_community: "Vietnamese",
    city: "Philadelphia", state: "PA",
    pin_type: "business_cafe", listing_status: "live_unclaimed",
    visit_tip: "Vietnamese coffee culture — from the slow drip of cà phê sữa đá to the ritual of phin brewing — is one of the world's great coffee traditions. Càphê Roasters brings that tradition to Philadelphia with beans roasted in-house.",
  },
  {
    name: "Sisterfriend Jewelry Philadelphia",
    description: "A Philadelphia Black-owned jewelry and accessories boutique celebrating African-inspired design and Black artisanship — a creative business honoring the aesthetic traditions of the African diaspora through handcrafted wearable art.",
    category: "retail", ethnic_community: "Black / African American",
    city: "Philadelphia", state: "PA",
    pin_type: "business_retail", listing_status: "live_unclaimed",
    visit_tip: "African-inspired jewelry is a form of cultural storytelling — each piece at Sisterfriend carries design traditions that connect Black American aesthetics to the continent's rich history of adornment and self-expression.",
  },
  {
    name: "Malooga Palestinian Restaurant",
    description: "A Philadelphia Palestinian-owned restaurant bringing the layered flavors of Palestinian cuisine to the city — serving traditional dishes like maqluba, musakhan, and knafeh in a space that celebrates Palestinian food culture and diaspora community.",
    category: "restaurant", ethnic_community: "Palestinian",
    city: "Philadelphia", state: "PA",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "Palestinian cuisine is a profound expression of cultural identity — every dish at Malooga carries the weight of heritage and the determination to preserve culinary traditions across displacement and distance.",
  },

  // ════════════════════════════════════════════════════════════════════
  // WASHINGTON DC — additional businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "MahoganyBooks DC",
    description: "A Washington DC Black-owned bookstore on The Wharf celebrating literature by and for the African diaspora — the only Black-owned brick-and-mortar bookstore on The Wharf, curating titles that center Black voices, history, and culture.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Washington", state: "DC",
    address: "1231 Good Hope Rd SE, Washington, DC 20020",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "MahoganyBooks carries titles you won't find at chain stores — the curation is intentional, centering Black authors across all genres and age groups, making every purchase a direct investment in Black literary culture.",
  },
  {
    name: "The Spice Suite DC",
    description: "A Washington DC Black-owned specialty spice shop and community gathering space — offering hundreds of global spice blends, including African, Caribbean, and Latin American seasonings, with a mission to celebrate diaspora food cultures through flavor.",
    category: "retail", ethnic_community: "Black / African American",
    city: "Washington", state: "DC",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "The Spice Suite's selection of African and diaspora spice blends tells the story of global flavor migration — from North African ras el hanout to West Indian green seasoning, the shop is a world tour through smell and taste.",
  },
  {
    name: "Dukem Ethiopian Restaurant DC",
    description: "A Washington DC Ethiopian restaurant in the U Street Corridor offering traditional Ethiopian cuisine with generous communal platters and rich injera — a long-standing institution in DC's vibrant Little Ethiopia.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Washington", state: "DC",
    address: "1114 U St NW, Washington, DC 20009",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "DC's U Street has one of the highest concentrations of Ethiopian restaurants outside Addis Ababa — Dukem is among the most established, offering the communal injera platter experience that makes Ethiopian dining a shared cultural act.",
  },
  {
    name: "Chercher Ethiopian Restaurant DC",
    description: "A Washington DC Ethiopian restaurant and market celebrating the cuisine of Ethiopia — named for a town in the Oromia region, offering traditional dishes and imported Ethiopian ingredients in DC's thriving East African community corridor.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Washington", state: "DC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ethiopian cuisine's communal eating tradition — where multiple dishes are served on a single injera for everyone to share — embodies a cultural value of togetherness that makes every meal at Chercher a social and culinary experience.",
  },
  {
    name: "Arepa Zone DC",
    description: "A Washington DC Venezuelan-owned restaurant serving authentic Venezuelan arepas with a wide variety of fillings — bringing the beloved national bread of Venezuela to DC through a fast-casual concept celebrating Venezuelan street food culture.",
    category: "restaurant", ethnic_community: "Venezuelan",
    city: "Washington", state: "DC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The arepa is Venezuela's most essential food — a simple corn cake that serves as the base for endless variations of fillings that reflect the country's regional and culinary diversity. Arepa Zone honors this tradition in DC.",
  },
  {
    name: "Maketto DC",
    description: "A Washington DC Cambodian and Taiwanese-owned restaurant, cafe, and retail space celebrating Southeast and East Asian creative cultures — a multi-concept space blending food, fashion, and community in a converted row house on H Street.",
    category: "restaurant", ethnic_community: "Cambodian / Taiwanese",
    city: "Washington", state: "DC",
    address: "1351 H St NE, Washington, DC 20002",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Maketto's concept — combining Cambodian and Taiwanese cuisine with a retail boutique — reflects the multicultural creativity of its owners and the H Street corridor, where diaspora cultures have found space to thrive and innovate.",
  },
  {
    name: "Purple Patch DC",
    description: "A Washington DC Filipino-owned restaurant celebrating Filipino-American cuisine with dishes that blend traditional Filipino flavors with American influences — a love letter to the Filipino diaspora experience in the DMV area.",
    category: "restaurant", ethnic_community: "Filipino",
    city: "Washington", state: "DC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Filipino cuisine reflects centuries of Indigenous, Spanish, Chinese, and American influence — Purple Patch honors this complexity while adding the Filipino-American diaspora experience to create food that is uniquely rooted and uniquely evolving.",
  },
  {
    name: "Cane DC",
    description: "A Washington DC Caribbean-owned rum bar and restaurant celebrating Caribbean cocktail culture and island cuisine — a gathering space honoring the flavors and spirits of the Caribbean diaspora in Washington's growing food scene.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Washington", state: "DC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Caribbean rum culture is one of the world's great spirits traditions — distilled from sugarcane across dozens of islands, each with its own style. Cane celebrates this diversity through a rum selection that makes the Caribbean's regional distinctions tangible.",
  },
  {
    name: "Mitsitam Native Foods Cafe DC",
    description: "A Washington DC Indigenous-owned cafe inside the National Museum of the American Indian — serving traditional Native American cuisine from five culinary regions of the Western Hemisphere, making Indigenous foodways accessible to museum visitors.",
    category: "cafe", ethnic_community: "Indigenous / Native American",
    city: "Washington", state: "DC",
    address: "4th St & Independence Ave SW, Washington, DC 20560",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Mitsitam means 'let's eat' in the language of the Piscataway and Delaware peoples — the cafe's menu organized by Native culinary regions (Northern Woodlands, Great Plains, etc.) offers a genuine education in Indigenous foodways alongside the museum's exhibits.",
  },
  {
    name: "Appioo African Bar & Grill DC",
    description: "A Washington DC West African restaurant bringing Ghanaian and West African cuisine to the DMV area — serving traditional dishes like jollof rice, fufu, kelewele, and grilled tilapia in a lively setting celebrating West African culture.",
    category: "restaurant", ethnic_community: "West African / Ghanaian",
    city: "Washington", state: "DC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "West African cuisine remains among the most underrepresented globally despite its influence on Southern US, Caribbean, and Brazilian foodways — Appioo offers DC a window into the original culinary traditions that traveled across the Atlantic.",
  },

  // ════════════════════════════════════════════════════════════════════
  // RICHMOND VA — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Addis Ethiopian Restaurant Richmond",
    description: "A Richmond Ethiopian restaurant offering traditional East African cuisine in the heart of Virginia's capital — serving injera-based communal platters and Ethiopian coffee ceremony experiences to the Richmond diaspora community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Richmond", state: "VA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Richmond's Ethiopian community has created a small but vibrant culinary corridor — Addis represents the Ethiopian tradition of hospitality where the preparation and sharing of food is itself an act of community.",
  },
  {
    name: "Mama J's Kitchen Richmond",
    description: "A Richmond Black-owned soul food restaurant serving Southern comfort classics — fried chicken, catfish, collard greens, and mac and cheese — in a family-operated setting that has become a beloved institution of Black Richmond food culture.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Richmond", state: "VA",
    address: "415 N 1st St, Richmond, VA 23219",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mama J's represents the soul food tradition as both nourishment and cultural preservation — the recipes, passed through generations, carry the story of Black Southern cooking from necessity and creativity to celebration and identity.",
  },
  {
    name: "Curry's Caribbean Restaurant Richmond",
    description: "A Richmond Caribbean restaurant serving authentic island cuisine including Jamaican and Trinidad-inspired dishes — a cultural anchor for Richmond's Caribbean community bringing jerk flavors, curry goat, and island hospitality to Virginia.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Richmond", state: "VA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Caribbean cuisine in Richmond represents the lived connections between Virginia's Black community and island diaspora — the jerk chicken and curry traditions carry cultural memory across the ocean.",
  },
  {
    name: "Keffiyeh Cafe Richmond",
    description: "A Richmond Palestinian and Middle Eastern cafe serving traditional breakfast dishes, mezze, and Arabic coffee — a gathering space celebrating Palestinian food culture and providing community connection for Richmond's Middle Eastern diaspora.",
    category: "cafe", ethnic_community: "Palestinian / Middle Eastern",
    city: "Richmond", state: "VA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Palestinian breakfast culture — with labneh, za'atar, olive oil, and fresh bread — is one of the most distinctive and nourishing meal traditions in the world. Keffiyeh Cafe preserves this tradition in Richmond.",
  },
  {
    name: "Buna Kurs Ethiopian Cafe Richmond",
    description: "A Richmond Ethiopian cafe offering authentic Ethiopian coffee ceremony experience alongside traditional pastries and light bites — named for 'coffee' (buna) and 'class/gathering' (kurs) in Amharic, celebrating Ethiopian coffee's cultural centrality.",
    category: "cafe", ethnic_community: "Ethiopian",
    city: "Richmond", state: "VA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Ethiopia is the birthplace of coffee — the traditional Ethiopian coffee ceremony with three rounds of coffee and frankincense smoke is one of the world's great hospitality traditions. Buna Kurs preserves this ritual in Richmond.",
  },
  {
    name: "La Sabrosita Bakery Richmond",
    description: "A Richmond Latino-owned bakery offering authentic Mexican and Latin American pan dulce, pastries, and cakes — a cultural institution bringing the sweet traditions of Latin American baking to Virginia's capital.",
    category: "bakery", ethnic_community: "Mexican / Latino",
    city: "Richmond", state: "VA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pan dulce — the sweet bread tradition of Mexico — is an everyday cultural ritual where the selection of pastries at the counter is its own form of cultural literacy. La Sabrosita keeps this tradition alive in Richmond.",
  },

  // ════════════════════════════════════════════════════════════════════
  // RALEIGH / DURHAM NC — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Liberation Station Bookstore",
    description: "A Raleigh Black-owned bookstore celebrating African American literature, history, and culture — a community gathering space offering books, gifts, and events that center Black intellectual and creative traditions in the Triangle.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Raleigh", state: "NC",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Black bookstores are cultural institutions as much as retail spaces — Liberation Station curates titles that mainstream chains overlook, ensuring that Black voices in literature, history, and thought are accessible to the Raleigh community.",
  },
  {
    name: "Boricua Soul Durham",
    description: "A Durham Puerto Rican and soul food fusion restaurant celebrating the intersection of African American and Puerto Rican culinary traditions — a beloved Triangle institution that honors the shared African roots of both cuisines.",
    category: "restaurant", ethnic_community: "Puerto Rican / Black American",
    city: "Durham", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The fusion of Puerto Rican and soul food is not arbitrary — both cuisines share deep African roots through the transatlantic slave trade. Boricua Soul makes that connection explicit through dishes that honor both traditions simultaneously.",
  },
  {
    name: "Awaze Ethiopian Restaurant Raleigh",
    description: "A Raleigh Ethiopian and Eritrean restaurant serving traditional East African cuisine — offering rich stews, fresh injera, and the communal dining experience that defines Horn of Africa food culture in the Triangle area.",
    category: "restaurant", ethnic_community: "Ethiopian / Eritrean",
    city: "Raleigh", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Awaze is a traditional Ethiopian spice blend that gives many dishes their signature heat and depth — the restaurant named for this spice captures the essence of Ethiopian cuisine's bold, complex flavor tradition.",
  },
  {
    name: "Brewery Bhavana Durham",
    description: "A Durham Asian American-owned craft brewery, bookstore, flower shop, and dim sum restaurant — a multi-concept gathering space celebrating Vietnamese and Southeast Asian culture through food, literature, and community.",
    category: "restaurant", ethnic_community: "Vietnamese / Asian American",
    city: "Durham", state: "NC",
    address: "218 S Blount St, Raleigh, NC 27601",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Brewery Bhavana's combination of craft beer, dim sum, flowers, and books reflects the Asian American creative entrepreneurship that refuses to fit into single-category businesses — it is at once a restaurant, bookstore, florist, and brewery.",
  },
  {
    name: "Golden Krust Caribbean Restaurant Raleigh",
    description: "A Raleigh Caribbean franchise restaurant offering authentic Jamaican patties, jerk chicken, and Caribbean baked goods — bringing the iconic Jamaican bakery tradition of the Bronx to the Triangle's Caribbean community.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Raleigh", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Golden Krust's Jamaican beef patty is a diaspora icon that migrated from Jamaica to the Bronx and then across America — each patty carries the flavor memory of Jamaican bakery culture.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CHARLOTTE NC — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Mert's Heart and Soul Charlotte",
    description: "A Charlotte Black-owned soul food restaurant in Uptown serving traditional Southern comfort classics — fried chicken, collard greens, yams, and black-eyed peas — a longtime institution celebrating Black Southern culinary heritage.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Charlotte", state: "NC",
    address: "214 N College St, Charlotte, NC 28202",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mert's has sustained Black culinary culture in Uptown Charlotte for decades — in a city center that has gentrified dramatically, this restaurant's presence represents the persistence of Black community even in changing urban landscapes.",
  },
  {
    name: "Urban Reader Bookstore Charlotte",
    description: "A Charlotte Black-owned independent bookstore celebrating African American literature and diaspora voices — a community cultural hub offering curated books, hosting author events, and nurturing Charlotte's literary community.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Charlotte", state: "NC",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Independent Black bookstores are anchors of intellectual community — Urban Reader's curation ensures that Black Charlotte has access to literature that centers their experience, history, and imagination.",
  },
  {
    name: "Enat Ethiopian Restaurant Charlotte",
    description: "A Charlotte Ethiopian restaurant serving traditional East African cuisine — named 'mother' (enat) in Amharic, the restaurant celebrates the maternal tradition of Ethiopian home cooking with rich stews, fresh injera, and warm hospitality.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Charlotte", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ethiopian cuisine is the food of hospitality — the word 'enat' (mother) names the tradition where a mother's cooking is the deepest expression of love and care. This restaurant honors that maternal culinary tradition.",
  },
  {
    name: "Sabor Latin Street Grill Charlotte",
    description: "A Charlotte Latin American street food restaurant serving tacos, arepas, and Caribbean dishes — celebrating the culinary diversity of Latin America through accessible street food that honors multiple regional traditions.",
    category: "restaurant", ethnic_community: "Latino",
    city: "Charlotte", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Charlotte's Latino community has grown dramatically in recent decades — Sabor Latin Street Grill reflects the culinary diversity of Latin American immigration to the Carolinas, where Mexican, Colombian, Puerto Rican, and Venezuelan traditions intersect.",
  },
  {
    name: "Caribbean Hut Charlotte",
    description: "A Charlotte Caribbean restaurant serving authentic island cuisine from Jamaica and the broader Caribbean — offering jerk chicken, oxtail, patties, and plantains in a welcoming space celebrating Caribbean culture and community.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Charlotte", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Caribbean food in Charlotte serves the growing West Indian community while also connecting to the shared African heritage that links Caribbean cuisine to Black American soul food — the plantains and oxtail tell that story.",
  },

  // ════════════════════════════════════════════════════════════════════
  // COLUMBIA SC — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Railroad BBQ Columbia",
    description: "A Columbia Black-owned barbecue restaurant serving traditional South Carolina-style smoked meats and soul food sides — a community gathering spot celebrating the African American heritage that created American barbecue.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "South Carolina barbecue — with its distinctive mustard-based sauce tradition developed by German and African American communities — is one of America's most unique regional food cultures. Railroad BBQ carries this tradition.",
  },
  {
    name: "All Good Books Columbia",
    description: "A Columbia independent bookstore celebrating diverse voices and community literature — a gathering space for readers that centers underrepresented authors and community-building through the shared love of books.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Columbia", state: "SC",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Independent bookstores that center diverse voices are essential community infrastructure — All Good Books creates a space where Columbia readers can find literature that reflects the full breadth of human experience.",
  },
  {
    name: "Real Mexico Restaurant Y Tienda Columbia",
    description: "A Columbia Mexican restaurant and tienda (store) offering authentic Mexican cuisine alongside imported Mexican grocery items — a dual-purpose establishment serving Columbia's growing Mexican community with both prepared food and cultural products.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The restaurant-and-tienda model serves diaspora communities doubly — offering authentic meals while also providing the imported ingredients families need to cook traditional dishes at home.",
  },
  {
    name: "Mary's Arepas Columbia",
    description: "A Columbia Venezuelan-owned restaurant serving authentic Venezuelan arepas and traditional dishes — bringing the flavors of Venezuela to South Carolina's capital through freshly made corn cakes with a variety of traditional fillings.",
    category: "restaurant", ethnic_community: "Venezuelan",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Arepas are Venezuela's daily bread — eaten at breakfast, lunch, and dinner, they are the culinary constant of Venezuelan life. Mary's Arepas preserves this tradition for Columbia's Venezuelan community.",
  },
  {
    name: "Harambe Ethiopian Restaurant Columbia",
    description: "A Columbia Ethiopian restaurant offering traditional East African cuisine — serving vegetarian and meat stews on fresh injera in a welcoming setting that introduces South Carolinians to the flavors and hospitality of Ethiopia.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Harambe (a Swahili word meaning 'pulling together') evokes the collective spirit that defines East African community — the restaurant's communal injera platters embody this philosophy of sharing.",
  },
  {
    name: "Calabash Caribbean Grill Columbia",
    description: "A Columbia Caribbean restaurant serving authentic island cuisine — offering jerk chicken, oxtail, plantains, and Caribbean cocktails in a setting that celebrates the culinary richness of the West Indian diaspora in the Carolinas.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Caribbean cuisine in the Carolinas reflects the historical connections between the Sea Islands and the West Indies — enslaved Africans brought to South Carolina's rice plantations came largely from the same regions of West Africa as those taken to the Caribbean.",
  },
  {
    name: "Pho Viet Restaurant Columbia",
    description: "A Columbia Vietnamese restaurant serving traditional pho and Vietnamese noodle dishes — offering the slow-simmered bone broth soups and fresh rice paper rolls that define Vietnamese culinary heritage to South Carolina's growing Asian community.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pho is more than soup — it is Vietnam's culinary gift to the world, a broth simmered for hours that carries the depth of Vietnamese cooking philosophy. Every bowl at Pho Viet represents that tradition.",
  },
  {
    name: "Arabesque on Devine Columbia",
    description: "A Columbia Middle Eastern restaurant serving Lebanese and Mediterranean cuisine on Devine Street — offering hummus, shawarma, and traditional mezze in a setting that celebrates the culinary heritage of the Levant.",
    category: "restaurant", ethnic_community: "Middle Eastern / Lebanese",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Lebanese mezze culture — where a meal is composed of many small dishes shared among the table — is one of the world's great social eating traditions. Arabesque on Devine brings this convivial dining philosophy to Columbia.",
  },
  {
    name: "Braza Do Sul Brazilian Steakhouse Columbia",
    description: "A Columbia Brazilian churrascaria offering traditional rodízio-style grilled meats — where servers bring skewers of fire-roasted meats tableside in the Brazilian steakhouse tradition, celebrating South American churrasco culture.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Brazilian churrasco — the tradition of slow-roasting meats over open fire on long skewers — comes from the gaucho culture of southern Brazil. The rodízio format, where servers circulate with skewers, makes every meal a celebration.",
  },

  // ════════════════════════════════════════════════════════════════════
  // ATLANTA GA — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Busy Bee Cafe Atlanta",
    description: "An Atlanta historic soul food institution in the Vine City neighborhood, open since 1947, serving traditional Southern classics including fried chicken, smothered pork chops, and mac and cheese — one of the oldest Black-owned restaurants in Atlanta.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Atlanta", state: "GA",
    address: "810 Martin Luther King Jr Dr SW, Atlanta, GA 30314",
    pin_type: "business_restaurant", listing_status: "staged",
    year_established: 1947,
    visit_tip: "The Busy Bee has fed Atlanta's civil rights leaders and everyday community members for nearly 80 years — dining here is an act of cultural communion with Atlanta's Black history. Martin Luther King Jr. ate here.",
  },
  {
    name: "For Keeps Books Atlanta",
    description: "An Atlanta Black-owned bookstore and cultural space in the West End celebrating literature by authors of the African diaspora — a community gathering place offering curated books, hosting community events, and nurturing Black literary culture in Atlanta.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Atlanta", state: "GA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "For Keeps Books embodies the West End's tradition as Atlanta's Black cultural hub — the curated selection of diaspora literature ensures that readers find books that center their experience, history, and imagination.",
  },
  {
    name: "ZuCot Gallery Atlanta",
    description: "An Atlanta Black-owned art gallery in the West End celebrating contemporary African American and African diaspora visual art — a cornerstone institution of Atlanta's Black arts community offering exhibitions, artist residencies, and cultural programming.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Atlanta", state: "GA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "ZuCot anchors the West End's Black arts ecosystem — the gallery's commitment to contemporary African American artists ensures that Black visual culture in Atlanta has dedicated institutional support and market.",
  },
  {
    name: "Arepa Mia Atlanta",
    description: "An Atlanta Venezuelan-owned restaurant serving authentic Venezuelan arepas and traditional dishes — a beloved Brookhaven institution celebrating Venezuelan culinary heritage through the national dish that has become Atlanta's diaspora favorite.",
    category: "restaurant", ethnic_community: "Venezuelan",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Atlanta's Venezuelan community is one of the largest and most established in the US — Arepa Mia has become a gathering place where Venezuelans maintain cultural connection through the food that most defines home.",
  },
  {
    name: "Addis Ababa Ethiopian Grocery Atlanta",
    description: "An Atlanta Ethiopian grocery store and cafe in Clarkston serving the East African community with imported goods, fresh injera, and prepared Ethiopian dishes — a cultural lifeline for one of Atlanta's most vibrant immigrant communities.",
    category: "market", ethnic_community: "Ethiopian",
    city: "Atlanta", state: "GA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Clarkston is known as 'the most ethnically diverse square mile in America' — Addis Ababa Grocery is a key institution in the East African corridor that makes this small Atlanta suburb a global culinary destination.",
  },
  {
    name: "Talat Market Atlanta",
    description: "An Atlanta Thai-owned restaurant in Summerhill serving modern Southeast Asian cuisine rooted in Thai culinary traditions — a critically acclaimed restaurant celebrating Thai diaspora creativity through seasonal, market-driven cooking.",
    category: "restaurant", ethnic_community: "Thai",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Talat Market represents the new generation of diaspora chefs who honor their culinary heritage while creating something genuinely new — Thai flavors meet American seasonal cooking in a restaurant that is both deeply rooted and boldly innovative.",
  },
  {
    name: "El Super Pan Atlanta",
    description: "An Atlanta Latin American-owned bakery and restaurant in Ponce City Market celebrating the pan de bono and pan de yuca traditions of Colombia — a celebrated spot offering Colombian-inspired baked goods and Latin comfort food.",
    category: "bakery", ethnic_community: "Colombian",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pan de bono — the cheesy Colombian yuca bread — is one of the most addictive baked goods in Latin America. El Super Pan has made these Colombian baking traditions beloved in Atlanta's food community.",
  },
  {
    name: "No Mas Hacienda Atlanta",
    description: "An Atlanta Mexican and Latin American-owned restaurant and cantina in the Castleberry Hill arts district — celebrating Mexican folk art, regional cuisine, and mezcal culture in a visually stunning space that honors traditional Mexican aesthetics.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "No Mas Hacienda's commitment to Mexican folk art and regional cuisine makes it both a restaurant and a cultural education — the collection of Mexican handicrafts that adorns the space tells the story of Mexico's indigenous artistic traditions.",
  },

  // ════════════════════════════════════════════════════════════════════
  // MONTGOMERY AL — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Brenda's Bar-Be-Que Pit Montgomery",
    description: "A Montgomery Black-owned barbecue institution serving traditional Alabama-style smoked meats — a beloved community gathering place celebrating the African American heritage at the heart of Alabama's barbecue tradition.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Alabama barbecue — with its tradition of white sauce (a tangy, mayonnaise-based sauce unique to the state) alongside smoked chicken — represents an African American culinary innovation that defines the state's food culture.",
  },
  {
    name: "La Taquiza Mexican Restaurant Montgomery",
    description: "A Montgomery Mexican-owned restaurant serving authentic Mexican street food including tacos, burritos, and fresh salsas — serving the growing Hispanic community in Alabama's capital while introducing Mexican culinary culture to the broader city.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Alabama's Latino population has grown significantly in recent decades — La Taquiza serves the Mexican community with the authentic street food traditions that maintain cultural connection to home.",
  },
  {
    name: "Plant Bae Montgomery",
    description: "A Montgomery plant-based restaurant celebrating vegan soul food and healthy Black culinary traditions — offering plant-based versions of soul food classics that honor the African American culinary heritage while promoting wellness.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The plant-based soul food movement reclaims the original agricultural wisdom of African American cooking — before industrial food culture, Black Southern cooking was deeply rooted in vegetables, legumes, and plant-based proteins.",
  },
  {
    name: "Brin's Wings Montgomery",
    description: "A Montgomery Black-owned chicken wing restaurant offering creative wing flavors and Southern-style sides — a community favorite celebrating the Black culinary entrepreneurship that has made chicken wings an enduring American cultural food.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The chicken wing's journey from an unwanted cut to a celebrated American cultural food is inseparable from Black culinary creativity — Montgomery's Black-owned wing restaurants are part of this ongoing story.",
  },
  {
    name: "Tienda Los Hermanos Montgomery",
    description: "A Montgomery Mexican market and tienda serving the Hispanic community with authentic Mexican products, fresh produce, and prepared foods — a cultural anchor providing the ingredients and flavors that connect Montgomery's Mexican community to home.",
    category: "market", ethnic_community: "Mexican",
    city: "Montgomery", state: "AL",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Mexican tiendas are cultural embassies in diaspora communities — they stock the specific chiles, spices, and products that make authentic Mexican cooking possible far from home.",
  },

  // ════════════════════════════════════════════════════════════════════
  // BIRMINGHAM AL — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Yo' Mama's Restaurant Birmingham",
    description: "A Birmingham Black-owned soul food restaurant serving traditional Southern comfort food with the warmth and generosity that defines Black Southern hospitality — fried chicken, catfish, and homemade sides in a family-style setting.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Soul food's name captures its essence — food that nourishes the soul as much as the body. Yo' Mama's embodies the Black Southern tradition of cooking as care, where generous portions and homemade sides express love.",
  },
  {
    name: "Eugene's Hot Chicken Birmingham",
    description: "A Birmingham Black-owned Nashville hot chicken restaurant bringing the spicy, crispy tradition of Nashville hot chicken to Alabama — a celebrated spot that honors the African American culinary innovation that made hot chicken a national phenomenon.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nashville hot chicken originated in the Black community as a dish of fire and pride — the cayenne-laden spice paste applied to crispy fried chicken is both a culinary achievement and a cultural statement. Eugene's brings that tradition to Birmingham.",
  },
  {
    name: "Memory Lane Birmingham",
    description: "A Birmingham Black-owned restaurant and gathering space in the historic 4th Avenue District — a nostalgic celebration of Black Birmingham's culinary and cultural heritage, serving soul food classics in the heart of the civil rights district.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The 4th Avenue District was Birmingham's Black Main Street — eating at Memory Lane in this historic corridor connects the present to the era when Black Birmingham built a self-sustaining economy under segregation.",
  },
  {
    name: "La Tía Paisa Taco Shop Birmingham",
    description: "A Birmingham Mexican-owned taco shop serving authentic Mexican tacos and street food — bringing the flavors of Mexican street food culture to Alabama while serving the growing Hispanic community in Birmingham.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The taco's simplicity — corn tortilla, protein, salsa, cilantro, onion — contains multitudes of regional variation across Mexico. La Tía Paisa honors the regional taco traditions that reflect Mexico's culinary diversity.",
  },
  {
    name: "Red Sea Ethiopian Restaurant Birmingham",
    description: "A Birmingham Ethiopian and Mediterranean restaurant serving traditional East African cuisine — bringing the rich stew tradition of Ethiopian cooking to Alabama alongside the shared Mediterranean flavors that connect these culinary cultures.",
    category: "restaurant", ethnic_community: "Ethiopian / Mediterranean",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Birmingham's Ethiopian community has grown significantly as the city has diversified — Red Sea offers a cultural window into East African culinary traditions that are new to many Alabama residents.",
  },
  {
    name: "Ghion Cultural Hall Birmingham",
    description: "A Birmingham Ethiopian cultural center and gathering space celebrating East African culture through events, food, and community programming — named for the Ghion River mentioned in Genesis, honoring the Ethiopian tradition of connecting geography to spiritual meaning.",
    category: "cultural_organization", ethnic_community: "Ethiopian",
    city: "Birmingham", state: "AL",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Ghion is one of the four rivers described in Genesis that flowed from Eden — Ethiopia's use of this name reflects its ancient Christian tradition that claims biblical heritage. The cultural hall preserves Ethiopian cultural and spiritual traditions in Alabama.",
  },
  {
    name: "K&J's Elegant Pastries Birmingham",
    description: "A Birmingham Black-owned bakery offering elegant custom cakes and pastries — a creative business celebrating the tradition of Black baking excellence that has made celebration cakes and desserts an art form in African American communities.",
    category: "bakery", ethnic_community: "Black / African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Black baking traditions — from the elaborate wedding cakes to the sweet potato pies that anchor holiday tables — represent centuries of culinary artistry. K&J's Elegant Pastries carries this tradition into contemporary custom cake design.",
  },

  // ════════════════════════════════════════════════════════════════════
  // MOBILE AL — businesses and additional sites
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Africatown Heritage House Mobile",
    description: "A Mobile cultural center celebrating the Africatown community founded by the last enslaved Africans brought to the United States on the Clotilda — preserving the heritage of those who maintained African cultural practices and built a free community in Alabama.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Mobile", state: "AL",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1868,
    visit_tip: "Africatown's founders arrived on the Clotilda in 1860 — 50 years after the international slave trade was banned. They were stolen illegally, yet they refused to be destroyed. They built a community, maintained their Yoruba language and customs, and created one of the most remarkable stories of African American cultural persistence.",
  },
  {
    name: "Stone Street Baptist Church Mobile",
    description: "A Mobile historic African American church that served as a civil rights organizing center — one of the oldest Black churches in Mobile, representing the foundational role of the Black church in organizing community resistance and celebrating cultural identity.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Mobile", state: "AL",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Black church in the South was the one institution that belonged entirely to the community — Stone Street Baptist represents the organizing tradition of Black churches that made the Civil Rights Movement possible.",
  },
  {
    name: "Los Rancheros Mexican Restaurant Mobile",
    description: "A Mobile Mexican restaurant serving authentic Mexican cuisine to the growing Hispanic community in Alabama's Port City — offering traditional dishes that maintain cultural connection for Mobile's Mexican immigrant families.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Mobile", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mobile's proximity to the Gulf Coast has created a unique culinary landscape where Mexican seafood traditions blend with Gulf Coast cooking — the shrimp and fish dishes at Mobile's Mexican restaurants reflect this coastal convergence.",
  },
  {
    name: "Sam's Banh Mi Cafe Mobile",
    description: "A Mobile Vietnamese-owned banh mi cafe serving authentic Vietnamese sandwiches and traditional Southeast Asian dishes — bringing the beloved Vietnamese sandwich tradition to Alabama's Gulf Coast.",
    category: "cafe", ethnic_community: "Vietnamese",
    city: "Mobile", state: "AL",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "The banh mi is a perfect symbol of colonial culinary exchange — the French baguette filled with Vietnamese ingredients creates something entirely new and entirely Vietnamese. Mobile's Vietnamese community preserves this tradition.",
  },
  {
    name: "Pot Au Pho Vietnamese Restaurant Mobile",
    description: "A Mobile Vietnamese restaurant serving traditional pho and Vietnamese noodle dishes — offering the slow-simmered broths and fresh accompaniments that define Vietnamese soup culture to Mobile's growing Asian community.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Mobile", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pho's broth requires hours of careful simmering with star anise, cloves, ginger, and bone — a practice of patience and intention that produces the complex, aromatic soup that has become one of the world's beloved comfort foods.",
  },

  // ════════════════════════════════════════════════════════════════════
  // TUSKEGEE AL — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Tuskegee Airmen National Historic Site",
    description: "A Tuskegee national historic site at Moton Field honoring the first African American military pilots in the US Armed Forces — the 'Red Tails' who overcame racial discrimination to prove Black excellence in combat during World War II.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    address: "1616 Chappie James Ave, Tuskegee, AL 36083",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1942,
    is_accessible: true, is_family_friendly: true, admission_free: false,
    visit_tip: "The Tuskegee Airmen flew over 15,000 sorties and never lost a bomber to enemy aircraft in escort missions — a record of excellence that demolished white supremacist myths about Black capability. Their fight was dual: against fascism abroad and segregation at home.",
  },
  {
    name: "Tuskegee University",
    description: "A Tuskegee HBCU founded in 1881 by Booker T. Washington — a Registered National Historic Landmark whose campus tells the history of Black educational aspiration, from the buildings students constructed themselves to the laboratories where George Washington Carver revolutionized Southern agriculture.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    address: "1200 W Montgomery Rd, Tuskegee, AL 36088",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1881,
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The original Tuskegee buildings were constructed by students who made their own bricks — Booker T. Washington's philosophy that education must produce both intellectual and practical capacity created an institution that literally built itself.",
  },
  {
    name: "The Oaks Home of Booker T. Washington",
    description: "A Tuskegee historic house museum preserving the Victorian home of Booker T. Washington — the beautifully maintained residence of Tuskegee's founder reflects the era's Black middle-class aspiration and Washington's philosophy of self-sufficiency and dignity.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    address: "1212 Old Montgomery Rd, Tuskegee, AL 36088",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Washington's home embodies his belief that Black Americans could achieve dignity and respect through excellence and self-improvement — the gracious Victorian residence challenged racist stereotypes about Black domestic life during an era of brutal repression.",
  },
  {
    name: "George Washington Carver Museum Tuskegee",
    description: "A Tuskegee museum dedicated to the agricultural genius who taught at Tuskegee University for nearly 50 years — documenting Carver's revolutionary work with peanuts, sweet potatoes, and soil conservation that transformed Southern agriculture.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    address: "1212 Old Montgomery Rd, Tuskegee, AL 36088",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Carver developed over 300 products from peanuts and 100 from sweet potatoes — his agricultural research at Tuskegee was motivated by his desire to liberate Black Southern farmers from their dependence on a single crop (cotton) and provide economic independence.",
  },
  {
    name: "Tuskegee History Center",
    description: "A Tuskegee multicultural museum presenting the human and civil rights history of the region — including honest examination of the infamous Tuskegee Syphilis Study alongside the city's extraordinary legacy of Black achievement and civil rights activism.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    address: "104 S Main St, Tuskegee, AL 36083",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Tuskegee Syphilis Study — where Black men with syphilis were deliberately left untreated for 40 years — must be understood alongside Tuskegee's extraordinary legacy of Black achievement. The History Center holds both truths simultaneously.",
  },
  {
    name: "Blue Seas 2 Restaurant Tuskegee",
    description: "A Tuskegee Black-owned seafood and soul food restaurant — a local favorite serving fresh seafood and Southern comfort classics that bring the community together around shared culinary traditions.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Tuskegee's community restaurants carry the tradition of feeding Black students, faculty, and families who built the town around the university — every meal here connects to 140 years of Black educational and community history.",
  },
  {
    name: "Vibezz Restaurant Lounge Tuskegee",
    description: "A Tuskegee upscale dining experience offering a sophisticated restaurant and lounge — bringing elevated dining to a small-town setting and demonstrating that Black communities deserve and create spaces of excellence and ambition.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Vibezz challenges the assumption that small-town Black communities only want casual dining — the restaurant brings sophistication and celebration to Tuskegee, honoring the high ambitions that Tuskegee University instilled in generations of students.",
  },
  {
    name: "Tiger Pause Cafe Tuskegee",
    description: "A Tuskegee university-area cafe serving the Tuskegee University community — a gathering spot for students, faculty, and locals where the energy of HBCU campus life meets the warmth of community coffee culture.",
    category: "cafe", ethnic_community: "Black / African American",
    city: "Tuskegee", state: "AL",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "HBCU campus cafes are windows into a unique American educational culture — Tuskegee University's legacy as a center of Black excellence gives every campus gathering space a historical weight that transforms ordinary coffee into something more significant.",
  },
  {
    name: "El Mariachi Mexican Restaurant Tuskegee",
    description: "A Tuskegee Mexican restaurant serving authentic Mexican cuisine — reflecting the growing Hispanic presence in Alabama's rural communities and offering the culinary traditions of Mexico to a predominantly African American small town.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Tuskegee", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The presence of a Mexican restaurant in historic Tuskegee reflects Alabama's demographic transformation — Latino families have become part of communities across the Deep South, creating new cultural intersections in historically Black towns.",
  },

  // ════════════════════════════════════════════════════════════════════
  // BATON ROUGE LA — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "The Chicken Shack Baton Rouge",
    description: "A Baton Rouge Black-owned fried chicken restaurant serving the community since the era of segregation — a culinary institution that preserved soul food traditions when Black-owned restaurants were the only spaces available to African Americans.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The fried chicken shack is an institution of Black Southern food culture — created during segregation when Black cooks transformed restricted ingredients and constrained resources into something celebrated worldwide.",
  },
  {
    name: "Monarch Books Baton Rouge",
    description: "A Baton Rouge independent bookstore celebrating diverse voices — a community cultural space offering curated literature, hosting author events, and nurturing literary culture in Louisiana's capital city.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Independent bookstores that center diverse voices are increasingly rare and increasingly essential — Monarch Books ensures that Baton Rouge readers have access to literature that reflects the full spectrum of Louisiana's multicultural heritage.",
  },
  {
    name: "Mestizo Louisiana Mexican Cuisine Baton Rouge",
    description: "A Baton Rouge Mexican restaurant celebrating the unique fusion of Louisiana and Mexican culinary traditions — where the French-Creole influence on Louisiana cooking meets the bold flavors of Mexican cuisine in dishes that reflect both cultures.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Louisiana and Mexico share culinary ancestors — both cuisines carry indigenous, African, and European influences. Mestizo Louisiana Mexican Cuisine makes these connections explicit through dishes that honor both food cultures simultaneously.",
  },
  {
    name: "Sazon Latin Grill Baton Rouge",
    description: "A Baton Rouge Latin American restaurant serving Cuban, Colombian, and Caribbean-inspired dishes — celebrating the culinary diversity of the Latin American diaspora in Louisiana's capital through bold, authentic flavors.",
    category: "restaurant", ethnic_community: "Latino",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Louisiana's proximity to the Caribbean and its French colonial history created natural connections to Cuban and Caribbean cultures long before modern immigration — Sazon honors these historical connections through contemporary Latin cooking.",
  },
  {
    name: "Alliance Brazilian Supermarket Baton Rouge",
    description: "A Baton Rouge Brazilian grocery store and deli serving the South American diaspora — offering authentic Brazilian products, fresh pastéis, coxinhas, and prepared foods that maintain cultural connection for Baton Rouge's Brazilian community.",
    category: "market", ethnic_community: "Brazilian",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Brazilian saudade — the deep longing for home — can be soothed by the right ingredients. Alliance Brazilian Supermarket stocks the specific products that allow Brazilian families to recreate the flavors of home in Louisiana.",
  },
  {
    name: "Dang's Vietnamese Restaurant Baton Rouge",
    description: "A Baton Rouge Vietnamese restaurant serving traditional Vietnamese pho, banh mi, and rice dishes — part of Louisiana's significant Vietnamese community that arrived as refugees after 1975 and built thriving communities across the Gulf Coast.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Louisiana's Vietnamese community — concentrated in New Orleans and Baton Rouge — arrived after the fall of Saigon and found the Gulf Coast's fishing culture familiar. Vietnamese and Cajun culinary traditions have influenced each other across 50 years of shared geography.",
  },
  {
    name: "Al Shami Baton Rouge",
    description: "A Baton Rouge Middle Eastern restaurant serving authentic Syrian and Levantine cuisine — offering hummus, falafel, and traditional mezze that represent the culinary heritage of the Syrian diaspora community in Louisiana.",
    category: "restaurant", ethnic_community: "Syrian / Middle Eastern",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Syrian cuisine is one of the ancient culinary traditions of the world — the mezze culture, the flatbreads, the slow-cooked stews all reflect thousands of years of agricultural abundance in the Fertile Crescent.",
  },
  {
    name: "Yori African Restaurant Baton Rouge",
    description: "A Baton Rouge West African restaurant serving traditional dishes from Nigeria and West Africa — bringing the bold flavors of West African cuisine, including jollof rice, egusi soup, and fried plantains, to Louisiana's capital.",
    category: "restaurant", ethnic_community: "West African / Nigerian",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "West African cuisine is the direct ancestor of soul food, Creole cooking, and Caribbean cuisine — eating at Yori connects Louisiana's culinary heritage to its West African source in the most direct way possible.",
  },

  // ════════════════════════════════════════════════════════════════════
  // NEW ORLEANS LA — additional entities
  // ════════════════════════════════════════════════════════════════════
  {
    name: "New Orleans African American Museum",
    description: "A New Orleans museum in the Tremé celebrating the history of Africa's people in New Orleans and the world — located in the Tremé, the oldest African American neighborhood in the country, the museum preserves 300 years of Black New Orleans cultural history.",
    category: "museum", ethnic_community: "Black / African American",
    city: "New Orleans", state: "LA",
    address: "1418 Governor Nicholls St, New Orleans, LA 70116",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1999,
    visit_tip: "The Tremé is where free people of color in antebellum New Orleans built America's first urban Black culture — the music, food, and cultural institutions that define New Orleans were incubated in this neighborhood. NOAAM preserves that story.",
  },
  {
    name: "Backstreet Cultural Museum New Orleans",
    description: "A New Orleans museum in the Tremé dedicated to preserving the African American cultural heritage of Mardi Gras Indians, second lines, jazz funerals, and social aid and pleasure clubs — guarding the most sacred cultural expressions of Black New Orleans.",
    category: "museum", ethnic_community: "Black / African American",
    city: "New Orleans", state: "LA",
    address: "1116 Henriette Delille St, New Orleans, LA 70116",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Mardi Gras Indians — Black New Orleanians who mask as Native Americans each Carnival — create some of the most elaborately beautiful handmade suits in the world. The Backstreet Cultural Museum preserves this tradition that takes a full year to prepare for one day of masking.",
  },
  {
    name: "Studio BE New Orleans",
    description: "A New Orleans Black-owned immersive art experience in the Bywater created by artist Brandan 'BMike' Odums — a massive gallery space where Black voices, stories, and struggles come alive through large-scale murals celebrating Black excellence and resilience.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "New Orleans", state: "LA",
    address: "2941 Chartres St, New Orleans, LA 70117",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "BMike's murals tell the story of Black New Orleans with the scale and power the subject deserves — the massive warehouse space transforms into a cathedral of Black cultural memory where every wall is a chapter in an ongoing story of survival and joy.",
  },
  {
    name: "Dooky Chase's Restaurant New Orleans",
    description: "A New Orleans iconic Creole restaurant in the Tremé that served as a secret meeting place for civil rights leaders including Martin Luther King Jr. and Thurgood Marshall — owned by the legendary Leah Chase, the 'Queen of Creole Cuisine,' for over 70 years.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "New Orleans", state: "LA",
    address: "2301 Orleans Ave, New Orleans, LA 70119",
    pin_type: "business_restaurant", listing_status: "staged",
    year_established: 1941,
    visit_tip: "Leah Chase served Creole food to civil rights leaders planning strategies in a segregated city — the restaurant was both a cultural institution and a safe house. Her gumbo z'herbes has been called the most important dish in New Orleans history.",
  },
  {
    name: "Louisiana Civil Rights Museum New Orleans",
    description: "A New Orleans museum celebrating the history of the civil rights movement in Louisiana — honoring the activists who dismantled legal segregation in one of the most deeply entrenched systems of racial oppression in America.",
    category: "museum", ethnic_community: "Black / African American",
    city: "New Orleans", state: "LA",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Louisiana's civil rights movement had unique dimensions shaped by the state's French-Creole heritage, its distinction between 'free people of color' and enslaved people, and the particular brutality of its plantation culture — the museum captures this complexity.",
  },

  // ════════════════════════════════════════════════════════════════════
  // HOUSTON TX — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Buffalo Soldiers National Museum Houston",
    description: "A Houston museum and the only institution in the United States dedicated to the history of Black soldiers — telling their stories and contributions from the Civil War through modern conflicts, celebrating the African American military heritage that has been systematically erased from popular culture.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "3816 Caroline St, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The Buffalo Soldiers — Black cavalry and infantry regiments formed after the Civil War — were named by the Native Americans they fought, who said their hair resembled a buffalo's mane. Their history is inseparable from the complex story of America's western expansion.",
  },
  {
    name: "Houston Museum of African American Culture",
    description: "A Houston cultural hub dedicated to collecting and exhibiting the material and intellectual culture of Africans and African Americans in Houston and the Southwest — one of the most comprehensive collections of African American cultural heritage in Texas.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "4807 Caroline St, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Houston's African American cultural institutions are concentrated along the Caroline Street corridor — the HMAAC anchors this cultural district while documenting the unique Black Texas experience shaped by Juneteenth, the Buffalo Soldiers, and Third Ward's historic community.",
  },
  {
    name: "Freedmen's Town Houston",
    description: "A Houston historic district founded after 1865 by freed enslaved people in the Fourth Ward — the oldest African American district in the city, where formerly enslaved people built a thriving community with its own businesses, churches, and schools on the traditional land of freed people.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "Bounded by I-45, Kirby, Montrose and Gray, Houston, TX",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1865,
    visit_tip: "Freedmen's Town brick streets — laid by African Americans during Reconstruction — are still visible in parts of the Fourth Ward. Walking these streets is walking on the literal foundation of freedom that formerly enslaved people built with their own hands.",
  },
  {
    name: "Project Row Houses Houston",
    description: "A Houston community arts organization in the Third Ward that revitalized historic shotgun houses as art studios, exhibition spaces, and community resources — a model of community-led cultural preservation that transformed neglected structures into a living cultural campus.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "2521 Holman St, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1993,
    visit_tip: "Project Row Houses transformed 22 historic shotgun houses into a community arts campus that has resisted gentrification for 30 years — it proves that cultural institutions rooted in community can preserve both the physical neighborhood and its living culture.",
  },
  {
    name: "Emancipation Park Houston",
    description: "A Houston historic park established in 1872 when freed Black Houstonians pooled money to buy 10 acres for Juneteenth celebrations — the oldest park in Houston and the birthplace of organized Juneteenth celebrations that eventually became a national holiday.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "3018 Emancipation Ave, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1872,
    admission_free: true,
    visit_tip: "Formerly enslaved people purchased this land themselves to celebrate freedom — Emancipation Park is the literal ground where Juneteenth was institutionalized. The community's decision to buy land for celebration was a powerful act of self-determination.",
  },
  {
    name: "Texas Southern University Houston",
    description: "A Houston HBCU and one of the largest in the country — TSU has a rich history of civil rights activism, with its students organizing Houston's first lunch counter sit-ins in 1960, and is home to the legendary Ocean of Soul marching band.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "3100 Cleburne St, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1947,
    is_family_friendly: true,
    visit_tip: "TSU students organized Houston's first sit-ins in 1960, months before the nationally publicized Greensboro sit-ins — the HBCU's role in Texas civil rights history is often overlooked. The Ocean of Soul marching band is one of the great HBCU performance traditions.",
  },
  {
    name: "Antioch Missionary Baptist Church Houston",
    description: "A Houston church founded in 1866 as the first African American Baptist Church in Houston — a pillar of Black Houston's educational, civil rights, and community life during Reconstruction and beyond, with historic hand-carved pews.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "500 Clay St, Houston, TX 77002",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1866,
    visit_tip: "Founded one year after emancipation, Antioch Missionary Baptist Church immediately became a center for Black education and community organization — the hand-carved pews are historical artifacts that connect present-day worshippers to the freed people who built this institution.",
  },
  {
    name: "Eldorado Ballroom Houston",
    description: "A Houston historic venue in the Third Ward built in 1939 by Black businesswoman Anna Dupree — a premier entertainment hub that hosted B.B. King, Ray Charles, and other legends for Black Houston during the era when segregation made this the only place the community could hear great music.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "2310 Elgin St, Houston, TX 77004",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1939,
    visit_tip: "The Eldorado Ballroom was Houston's Black equivalent of Harlem's Apollo Theater — a place where the community created its own entertainment ecosystem in response to segregation. The building's survival is a testament to Third Ward's determination to preserve its cultural heritage.",
  },
  {
    name: "The Greasy Spoon Houston",
    description: "A Houston popular soul food restaurant known for elevated comfort food including oxtails, mac and cheese, and greens — a community staple with a story of resilience and culinary excellence in North Houston.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "636 Cypress Station Dr, Houston, TX 77090",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Oxtail — once considered an unwanted cut — became a centerpiece of Black diaspora cooking across the Caribbean and American South through the creativity of cooks who transformed overlooked ingredients into celebrated dishes.",
  },
  {
    name: "Kindred Stories Houston",
    description: "A Houston independent bookstore in the Third Ward celebrating Black authors and creators — an independent bookstore in the historic heart of Black Houston promoting literacy and amplifying Black voices in the community that gave America Juneteenth.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Houston", state: "TX",
    address: "2304 Stuart St, Houston, TX 77004",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Kindred Stories is located in the Third Ward — the historic heart of Black Houston. The bookstore's name evokes the connections between stories, between people, and between the present community and the ancestors who built this neighborhood.",
  },
  {
    name: "ChopnBlok Houston",
    description: "A Houston fast-casual West African restaurant at POST Houston offering contemporary West African cuisine including jollof rice and plantains — making West African food accessible in a modern food hall setting while honoring the culinary traditions of West Africa.",
    category: "restaurant", ethnic_community: "West African",
    city: "Houston", state: "TX",
    address: "401 Franklin St, Houston, TX 77201",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "ChopnBlok's modern West African approach introduces Houston's diverse population to the jollof rice, suya, and plantain traditions that influenced Gulf Coast and Creole cooking — making the connection between West Africa and American Southern food explicit and delicious.",
  },
  {
    name: "Afrikiko Restaurant Houston",
    description: "A Houston traditional Ghanaian and West African restaurant in Southwest Houston serving authentic dishes like fufu, waakye, and peanut soup — a deeply authentic gathering place for Houston's West African diaspora community.",
    category: "restaurant", ethnic_community: "West African / Ghanaian",
    city: "Houston", state: "TX",
    address: "9625 Bissonnet St, Houston, TX 77036",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Waakye — the Ghanaian rice and beans dish cooked with dried sorghum leaves — is one of West Africa's great street foods. Afrikiko brings this authentic Ghanaian tradition to Southwest Houston's diverse corridor.",
  },
  {
    name: "Lucy Ethiopian Restaurant Houston",
    description: "A Houston Ethiopian restaurant in Sharpstown offering traditional Ethiopian cuisine served on injera with a welcoming lounge atmosphere — one of the most established Ethiopian restaurants in Houston, serving the city's growing East African community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Houston", state: "TX",
    address: "6800 Southwest Fwy, Houston, TX 77074",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Named for the famous ancient hominid discovered in Ethiopia, Lucy Restaurant evokes the country's identity as the cradle of humanity — the restaurant serves as both a culinary and cultural gathering place for Houston's Ethiopian community.",
  },
  {
    name: "Reggae Hut Houston",
    description: "A Houston long-standing Jamaican restaurant in the Third Ward serving classic Jamaican dishes like jerk chicken, patties, and plantains — a historic and beloved institution in Houston's Caribbean community offering authentic island flavors.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Houston", state: "TX",
    address: "4814 Almeda Rd, Houston, TX 77004",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Reggae Hut has been serving Third Ward since the era when Jamaica's musical and culinary exports transformed Black American culture — the jerk tradition, carried by Jamaican immigrants, has become a cornerstone of Black Houston's food culture.",
  },
  {
    name: "Cielito Cafe Houston",
    description: "A Houston cozy Mexican-owned cafe in Montrose offering authentic Mexican breakfast and brunch items — chilaquiles, cafe de olla, and traditional antojitos in a charming setting celebrating Mexican culinary heritage.",
    category: "cafe", ethnic_community: "Mexican",
    city: "Houston", state: "TX",
    address: "1915 Dunlavy St, Houston, TX 77006",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Chilaquiles — crispy tortilla chips simmered in salsa and topped with eggs, cheese, and cream — is Mexico's great breakfast comfort food. Cielito's authentic preparation honors the Mexican morning meal tradition.",
  },
  {
    name: "Phoenicia Specialty Foods Houston",
    description: "A Houston iconic Lebanese-owned international market in Downtown — a massive specialty grocery offering a vast array of Middle Eastern and global foods with an in-house bakery and deli, serving Houston's extraordinarily diverse population.",
    category: "market", ethnic_community: "Lebanese / Middle Eastern",
    city: "Houston", state: "TX",
    address: "1001 Austin St, Houston, TX 77010",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Houston's extraordinary diversity is reflected in Phoenicia's inventory — the store stocks ingredients for cuisines from dozens of countries, serving the most ethnically diverse large city in America with the global flavors that make home possible.",
  },
  {
    name: "Emporio Brazilian Grill Houston",
    description: "A Houston authentic Brazilian grill and market in Westchase offering traditional churrasco, baked goods, and imported Brazilian products — a one-stop destination for Brazilian culture combining restaurant, bakery, and specialty grocery.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Houston", state: "TX",
    address: "12288 Westheimer Rd, Houston, TX 77077",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Houston has one of the largest Brazilian communities in the US — Emporio's combination of restaurant, bakery, and Brazilian grocery reflects how immigrant communities create complete cultural ecosystems that make living abroad feel less like exile.",
  },
  {
    name: "Day 6 Coffee Co Houston",
    description: "A Houston coffee shop in Downtown blending Vietnamese coffee traditions with an inclusive modern community vibe — a beautiful representation of diaspora creativity where Vietnamese coffee culture meets contemporary Houston's spirit.",
    category: "cafe", ethnic_community: "Asian / Black (Mixed Diaspora)",
    city: "Houston", state: "TX",
    address: "910 Prairie St, Houston, TX 77002",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Vietnamese coffee — slow-dripped through a phin filter, mixed with sweetened condensed milk — is one of the world's great coffee traditions. Day 6 honors this tradition while creating a space that welcomes all of Houston's diverse communities.",
  },
  {
    name: "Al Aseel Grill and Cafe Houston",
    description: "A Houston popular Palestinian and Middle Eastern restaurant in Westchase known for its authentic fried chicken and mansaf — a beloved community fixture offering incredible Palestinian flavors in a welcoming atmosphere.",
    category: "restaurant", ethnic_community: "Palestinian / Middle Eastern",
    city: "Houston", state: "TX",
    address: "8619 Richmond Ave, Houston, TX 77063",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mansaf — Jordan and Palestine's national celebration dish of lamb in fermented yogurt sauce served over rice — is one of the most important foods in Levantine culture. Al Aseel Grill brings this dish of hospitality and celebration to Houston.",
  },
  {
    name: "Ishtia Restaurant Kemah",
    description: "A Houston area restaurant in Kemah offering modern interpretations of indigenous Choctaw cuisine — a rare and exceptional representation of Native American culinary traditions, led by a Choctaw chef who creates a profound cultural and educational dining experience.",
    category: "restaurant", ethnic_community: "Indigenous / Choctaw",
    city: "Houston", state: "TX",
    address: "609 Bradford Ave, Kemah, TX 77565",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Indigenous foodways — the culinary traditions of Native Americans before colonization — are among the most sustainable and ecologically sophisticated food systems ever developed. Ishtia's Choctaw chef reclaims and reinterprets these traditions for modern dining.",
  },

  // ════════════════════════════════════════════════════════════════════
  // DALLAS / FORT WORTH TX
  // ════════════════════════════════════════════════════════════════════
  {
    name: "African American Museum of Dallas",
    description: "A Dallas museum in historic Fair Park dedicated to the preservation of African American artistic, cultural, and historical materials — housing one of the largest collections of African American folk art in the United States.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    address: "3536 Grand Ave, Dallas, TX 75210",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1974,
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Fair Park — the museum's location — was the site of the 1936 Texas Centennial Exposition where Black Texans were initially excluded. The museum's presence in this space is a powerful reclamation of a site of historical exclusion.",
  },
  {
    name: "Deep Ellum Historic District Dallas",
    description: "A Dallas historic district established by freed people after the Civil War — the legendary hub where Blind Lemon Jefferson, Leadbelly, and blues pioneers performed in the 1920s, creating a musical tradition that would influence rock and roll, now an arts and entertainment district.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1870,
    visit_tip: "Deep Ellum's blues legacy is inseparable from the African American musicians who defined American popular music there — the murals throughout the district honor this heritage, connecting Deep Ellum's Black musical past to its current identity.",
  },
  {
    name: "Freedman's Cemetery Memorial Dallas",
    description: "A Dallas pre-Civil War burial ground for early African Americans — a memorial site honoring the thousands of Black pioneers buried there after nearly being lost to highway expansion, with archaeological excavations revealing the remains of over 1,500 individuals.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    address: "2525 N Washington Ave, Dallas, TX 75204",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The fight to preserve Freedman's Cemetery from highway expansion is a recurring American story — Black burial grounds threatened by 'progress.' Community activism saved this site, and the archaeological discoveries there rehumanized people history sought to erase.",
  },
  {
    name: "The Black Academy of Arts and Letters Dallas",
    description: "A Dallas multi-discipline arts institution founded in 1977 — nurturing Black artistic talent in Dallas through performance space, educational programming, and community engagement, celebrating African, African American, and Caribbean arts for nearly 50 years.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    address: "1309 Canton St, Dallas, TX 75201",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1977,
    visit_tip: "TBAAL has sustained Black arts in Dallas for nearly 50 years — its programming nurtures artists, educates audiences, and ensures that Black cultural expression has dedicated institutional support in a city whose cultural landscape has often overlooked Black creativity.",
  },
  {
    name: "Latino Cultural Center Dallas",
    description: "A Dallas multidisciplinary arts center designed by renowned Mexican architect Ricardo Legorreta — dedicated to the preservation and promotion of Latino and Hispanic arts and culture through visual arts, performing arts, and literary events.",
    category: "arts_culture", ethnic_community: "Latino / Hispanic",
    city: "Dallas", state: "TX",
    address: "2600 Live Oak St, Dallas, TX 75204",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Ricardo Legorreta's bold geometric forms and vivid colors reflect Mexican architectural traditions that trace back to pre-Columbian design. The building itself is a cultural statement — the form honors the communities whose art fills it.",
  },
  {
    name: "Paul Quinn College Dallas",
    description: "A Dallas HBCU and the oldest historically Black college in Texas — known for its innovative 'WE over ME' urban farm that transformed an abandoned football field into an organic farm addressing the local food desert.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    address: "3837 Simpson Stuart Rd, Dallas, TX 75241",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1872,
    visit_tip: "Paul Quinn's urban farm is a 21st-century expression of the HBCU tradition of practical service — Tuskegee had Carver's agricultural research, Paul Quinn has an organic farm serving a food desert. The WE over ME philosophy makes community service inseparable from education.",
  },
  {
    name: "Dallas Black Dance Theatre",
    description: "A Dallas dance company founded in 1976 — the oldest continuously operating professional dance company in Dallas, featuring contemporary modern dance by diverse performers that has reached over 3.5 million people worldwide.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    address: "2700 Ann Williams Way, Dallas, TX 75201",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1976,
    visit_tip: "DBDT's 50-year legacy proves that Black dance companies can achieve global artistic excellence while remaining rooted in community service — Ann Williams built an institution that has brought the power of contemporary dance to audiences worldwide.",
  },
  {
    name: "Fort Worth Stockyards Bill Pickett Statue",
    description: "A Fort Worth bronze statue honoring Bill Pickett — a legendary African American cowboy and rodeo performer who invented the bulldogging technique, placing a Black cowboy at the center of Texas's most iconic Western heritage site.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Fort Worth", state: "TX",
    address: "131 E Exchange Ave, Fort Worth, TX 76164",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "An estimated one in four cowboys in the American West was Black — yet popular culture has nearly erased this history. The Bill Pickett statue at Fort Worth's most famous Western attraction corrects this erasure by placing a Black cowboy where he belongs: at the center of Texas history.",
  },
  {
    name: "Smoke-A-Holics BBQ Fort Worth",
    description: "A Fort Worth popular Black-owned craft barbecue joint known for its 'TexSoul' cuisine — blending traditional Texas BBQ techniques with soulful Southern sides in a restaurant that represents the intersection of two great American culinary traditions.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Fort Worth", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "TexSoul — the fusion of Texas barbecue and African American soul food — is not a gimmick but a historical truth. The pitmasters who built Texas BBQ were largely Black, and the sides that complete the plate come directly from Black Southern cooking traditions.",
  },
  {
    name: "Soiree Coffee Bar Dallas",
    description: "A Dallas chic Black-owned coffee shop and jazz lounge in Trinity Groves — combining the coffeehouse tradition with jazz lounge culture to create a sophisticated multi-purpose gathering space that celebrates Black creativity through both beverage and music.",
    category: "cafe", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "The combination of coffee and jazz honors two of Black America's greatest cultural contributions — the coffeehouse tradition and the jazz tradition both emerged from communities using gathering, conversation, and art to build culture.",
  },
  {
    name: "Pan-African Connection Bookstore Dallas",
    description: "A Dallas Pan-African bookstore, art gallery, and resource center in South Dallas — a vital community institution offering books, art, clothing, and educational programs focused on the African diaspora, serving as a cultural anchor for decades.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Pan-African bookstores are among the rarest and most essential cultural institutions in Black communities — Pan-African Connection has served South Dallas for decades as a place where the full scope of African diaspora literature, art, and thought is accessible.",
  },
  {
    name: "Desta Ethiopian Restaurant Dallas",
    description: "A Dallas beloved Ethiopian restaurant in Lake Highlands serving authentic cuisine with rich stews, fresh injera, and a welcoming atmosphere — serving Dallas's large Ethiopian community, one of the biggest in the United States.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Dallas-Fort Worth has one of the largest Ethiopian populations in America — centered around Richardson and Garland, this community has created a vibrant culinary scene. Desta has been welcoming both the diaspora and curious Dallasites to Ethiopian culture.",
  },
  {
    name: "Ngon Vietnamese Kitchen Dallas",
    description: "A Dallas Vietnamese restaurant in Lower Greenville serving authentic Vietnamese street food and family recipes — founded by a passionate chef dedicated to sharing her heritage through the bold, fresh flavors of Vietnamese cooking.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Vietnamese street food culture — built around herbs, rice papers, noodles, and broth — reflects a culinary philosophy of freshness and balance that is among the world's most sophisticated approaches to everyday eating.",
  },
  {
    name: "Tacos La Banqueta Dallas",
    description: "A Dallas legendary East Dallas taqueria famous for authentic street-style tacos — no-frills, uncompromisingly authentic, and devoted to the suadero and pastor traditions that define Mexican taco culture at its purest.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Suadero — the Mexican taco filling made from the flank or underbelly cut of beef, braised slowly until silky — is one of Mexico City's greatest contributions to taco culture. Tacos La Banqueta honors this tradition in its purest form.",
  },
  {
    name: "Brunchaholics Dallas",
    description: "A Dallas popular Black-owned brunch restaurant in Cherrywood offering decadent and creative brunch offerings — a weekend staple that has carved out a niche through creative over-the-top dishes that make every brunch feel like a celebration.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Black brunch culture — where weekend mornings become extended social gatherings over creative food — is one of the most vibrant and joyful expressions of Black social life in American cities. Brunchaholics has mastered this cultural form.",
  },

  // ════════════════════════════════════════════════════════════════════
  // SAN ANTONIO TX
  // ════════════════════════════════════════════════════════════════════
  {
    name: "San Antonio African American Community Archive and Museum",
    description: "A San Antonio digital archive and museum in La Villita dedicated to preserving the history of African Americans in the San Antonio region — filling a crucial gap by documenting Black history in a city where the Hispanic majority often overshadows other minority narratives.",
    category: "museum", ethnic_community: "Black / African American",
    city: "San Antonio", state: "TX",
    address: "218 S Presa St, San Antonio, TX 78205",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "San Antonio's African American history is less known than its Mexican-American story, but equally significant — SAAACAM ensures that the Black San Antonians who built this city, organized for civil rights, and shaped its culture are remembered and celebrated.",
  },
  {
    name: "Guadalupe Cultural Arts Center San Antonio",
    description: "A San Antonio cultural center in the historic Westside dedicated to cultivating and preserving Chicano, Latino, and Native American arts — the cultural heart of San Antonio's Mexican-American community for over four decades.",
    category: "arts_culture", ethnic_community: "Chicano / Latino",
    city: "San Antonio", state: "TX",
    address: "723 S Brazos St, San Antonio, TX 78207",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1980,
    visit_tip: "The Guadalupe's iconic murals and programming represent the Chicano arts movement that emerged from the civil rights era — art as cultural affirmation, community building, and political expression. The murals on campus alone are worth the visit.",
  },
  {
    name: "Carver Community Cultural Center San Antonio",
    description: "A San Antonio cultural center that was originally the colored library branch during segregation — now transformed into a premier hub for diverse arts celebrating African American heritage, representing the community's power to reclaim spaces of exclusion.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "San Antonio", state: "TX",
    address: "226 N Hackberry St, San Antonio, TX 78202",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Carver's transformation from a segregation-era 'colored' branch into a celebrated cultural center is one of San Antonio's great stories of community reclamation — the building that once limited Black access now celebrates Black excellence.",
  },
  {
    name: "Historic Market Square El Mercado San Antonio",
    description: "A San Antonio three-block outdoor plaza and the largest Mexican market in the United States — with over 100 locally owned shops celebrating Hispanic culture through handmade crafts, traditional clothing, authentic food, and live mariachi.",
    category: "landmark", ethnic_community: "Mexican / Hispanic",
    city: "San Antonio", state: "TX",
    address: "514 W Commerce St, San Antonio, TX 78207",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "El Mercado has been the commercial and cultural gathering place of San Antonio's Mexican-American community for generations — every shop, every vendor, every mariachi performance represents the living continuation of Mexican cultural traditions in Texas.",
  },
  {
    name: "St Philip's College San Antonio",
    description: "A San Antonio historic community college with the unique distinction of being both an HBCU and a Hispanic Serving Institution — founded in 1898, educating generations of Black and Hispanic San Antonians who were historically excluded from other institutions.",
    category: "landmark", ethnic_community: "Black / African American / Hispanic",
    city: "San Antonio", state: "TX",
    address: "1801 Martin Luther King Dr, San Antonio, TX 78203",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1898,
    is_family_friendly: true,
    visit_tip: "St. Philip's dual designation as HBCU and HSI reflects San Antonio's unique demographics — a city where Black and Hispanic communities share the experience of historical exclusion, and this institution has served both communities for over 125 years.",
  },
  {
    name: "Casa Navarro State Historic Site San Antonio",
    description: "A San Antonio historic home of José Antonio Navarro — a prominent Tejano leader and one of only two native-born Texans to sign the Texas Declaration of Independence, preserving 19th-century Tejano life in preserved adobe and limestone buildings.",
    category: "landmark", ethnic_community: "Tejano / Mexican American",
    city: "San Antonio", state: "TX",
    address: "228 S Laredo St, San Antonio, TX 78207",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "José Antonio Navarro signed the Texas Declaration of Independence while maintaining his Mexican heritage — his story challenges the simplified narrative of Texas history by showing that Tejanos were among the republic's founders, not just its subjects.",
  },
  {
    name: "Mark's Outing San Antonio",
    description: "A San Antonio beloved East Side Black-owned institution known for its famous thick burgers and complimentary beans — a no-frills community gathering spot where everyone knows your name, representing decades of Black entrepreneurship on the historic East Side.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mark's Outing represents the most essential form of Black business — the neighborhood spot where community gathers, where the food is consistent and honest, and where going for a burger is an act of community support.",
  },
  {
    name: "Sweet Yams San Antonio",
    description: "A San Antonio organic takeout restaurant on the historic East Side — the first organic takeout restaurant in San Antonio, offering healthy, soulful, and vegan-friendly options that address food justice issues in the Black community through healthy food access.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Sweet Yams brings healthy eating to a historically underserved community — the organic, vegan-friendly approach honors the pre-industrial Black farming tradition where vegetables and plant foods were the foundation of the diet.",
  },
  {
    name: "Rosario's Mexican Restaurant San Antonio",
    description: "A San Antonio vibrant award-winning restaurant in the historic Southtown neighborhood celebrating traditional and contemporary Mexican cuisine — one of the city's most beloved restaurants honoring Mexican culinary traditions with creative innovation.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "San Antonio is the city where Texas Mexican food (Tex-Mex) was invented — Rosario's honors both this regional tradition and the deeper Mexican culinary heritage that underlies it, creating food that is simultaneously local and globally significant.",
  },
  {
    name: "La Panadería San Antonio",
    description: "A San Antonio popular bakery honoring a mother's baking legacy — founded by brothers elevating traditional Mexican pan dulce and street food into a sophisticated bakery that transforms humble culinary traditions into elevated experiences.",
    category: "bakery", ethnic_community: "Mexican",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pan dulce — Mexico's diverse tradition of sweet breads — is a cultural institution as much as a food category. La Panadería elevates these everyday breads into artisan experiences while honoring their working-class cultural roots.",
  },
  {
    name: "African Village Ethiopian Restaurant San Antonio",
    description: "A San Antonio Ethiopian restaurant offering an authentic dining experience in North Central San Antonio — serving traditional injera and wot dishes, bringing East African flavors and culture to the city while providing the diaspora with a taste of home.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ethiopian dining is a communal act — the large shared injera platter that everyone eats from without utensils embodies the Ubuntu philosophy of community and togetherness. African Village brings this tradition of shared meals to San Antonio.",
  },
  {
    name: "Barrio Barista San Antonio",
    description: "A San Antonio family-owned coffeehouse in the heart of the historic West Side — a community pillar celebrating Mexican-American culture while serving specialty coffee to the Westside neighborhood that has been the heart of San Antonio's Hispanic community for generations.",
    category: "cafe", ethnic_community: "Mexican American",
    city: "San Antonio", state: "TX",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Barrio Barista combines the contemporary specialty coffee movement with the neighborhood cafe tradition that has sustained Latino communities — it is both a third place for gathering and a cultural statement about who belongs in the specialty coffee world.",
  },
  {
    name: "Momma Luv's Soul Caribbean Food San Antonio",
    description: "A San Antonio restaurant offering a fusion of comforting soul food and flavorful Caribbean dishes — celebrating the connections between Southern Black American and Caribbean culinary traditions that share deep African roots.",
    category: "restaurant", ethnic_community: "Black / Caribbean",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Soul food and Caribbean cuisine are cousin traditions — both emerged from the same West African cooking heritage, adapted to different ingredients and environments in the American South and the Caribbean islands. Momma Luv's makes that connection explicit.",
  },

  // ════════════════════════════════════════════════════════════════════
  // ALLENTOWN PA — satellite city entities
  // ════════════════════════════════════════════════════════════════════
  {
    name: "This Life Forever Distillery Allentown",
    description: "An Allentown Black-owned distillery recognized as Pennsylvania's first Black-owned distillery — producing vodka and making national moves in the spirits industry, representing a historic milestone for Black entrepreneurship in Pennsylvania.",
    category: "retail", ethnic_community: "Black / African American",
    city: "Allentown", state: "PA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Pennsylvania's first Black-owned distillery represents the growing Black entrepreneurship in premium spirits — an industry historically dominated by white-owned corporations, where Black ownership is a form of economic claim-staking and cultural expression.",
  },
  {
    name: "Las Palmas Restaurant Allentown",
    description: "An Allentown Hispanic-owned restaurant serving authentic Latin American cuisine — owned by Ana & Santiago Pena, a local favorite spotlighted during Hispanic Heritage Month celebrating the culinary traditions of the Lehigh Valley's majority-Latino community.",
    category: "restaurant", ethnic_community: "Latino / Hispanic",
    city: "Allentown", state: "PA",
    address: "959 W Turner St, Allentown, PA 18102",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Allentown is a majority-Latino city — over 54% Hispanic — making it one of the few cities in Pennsylvania where Latin American culture is not a minority experience but the dominant community character. Las Palmas honors this with authentic cooking.",
  },
  {
    name: "GQ's Soul Kitchen Allentown",
    description: "An Allentown Black-owned soul food restaurant and food stand offering soul food classics — a highly-rated community spot contributing to the diverse culinary scene in a city where Black and Latino communities have built vibrant parallel cultural institutions.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Allentown", state: "PA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Soul food in Allentown serves as a bridge between the city's Black and Latino communities — the African American culinary tradition intersects with Afro-Latino cooking in ways that celebrate shared heritage across communities.",
  },
  {
    name: "Ayat Palestinian Restaurant Allentown",
    description: "An Allentown Michelin Guide-featured Palestinian restaurant offering authentic Middle Eastern cuisine — a critically acclaimed establishment that has expanded to Allentown, bringing Palestinian culinary excellence to Pennsylvania's Lehigh Valley.",
    category: "restaurant", ethnic_community: "Palestinian / Middle Eastern",
    city: "Allentown", state: "PA",
    address: "1243 W Tilghman Street, Allentown, PA 18102",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ayat's Michelin recognition brings international culinary prestige to Palestinian cuisine — a powerful statement that Palestinian food, culture, and creativity deserve the highest recognition despite the political marginalization of the Palestinian people.",
  },
  {
    name: "Seventh Street Business District Allentown",
    description: "An Allentown thriving commercial corridor of Latino-owned businesses — markets, bakeries, and services that serve the local community and function as a cultural and economic anchor in the heart of Allentown's majority-Latino neighborhood.",
    category: "landmark", ethnic_community: "Latino / Hispanic",
    city: "Allentown", state: "PA",
    address: "7th Street, Allentown, PA",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Seventh Street corridor is where Allentown's Latino majority becomes most visible — the storefronts, bakeries, and markets represent the economic self-sufficiency that Latino communities have built in a city that gave them limited institutional support.",
  },
  {
    name: "Allentown Art Museum",
    description: "An Allentown premier cultural institution in the Lehigh Valley — offering diverse exhibitions that celebrate American and global artistic voices, serving as a hub for cultural engagement and education for the Lehigh Valley's diverse communities.",
    category: "museum",
    city: "Allentown", state: "PA",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The Allentown Art Museum's commitment to diverse programming makes it accessible and relevant to the Lehigh Valley's majority-minority population — the exhibitions connect global artistic traditions to the lived experiences of Allentown's communities.",
  },

  // ════════════════════════════════════════════════════════════════════
  // WILLOW GROVE / ABINGTON PA — satellite city entities
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Philly Shared Willow Grove",
    description: "A Willow Grove shared retail showroom founded by minority women entrepreneurs — providing a storefront for various minority-owned small businesses including natural hair care and clothing brands, operating as a collective retail space celebrating Black and minority entrepreneurship.",
    category: "retail", ethnic_community: "Black / Minority-owned",
    city: "Willow Grove", state: "PA",
    address: "Willow Grove Park Mall, 2500 W Moreland Rd, Willow Grove, PA 19090",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Philly Shared's collective retail model — multiple minority-owned businesses sharing one storefront — lowers the barrier to brick-and-mortar retail for entrepreneurs who couldn't individually afford the overhead. This is economic solidarity made practical.",
  },
  {
    name: "I SAW Visions Willow Grove",
    description: "A Willow Grove arts and culture boutique featuring products from over 60 artisans and artists — with 95% being minority-owned, offering all-natural hair care, crocheted dolls, multicultural artwork, and products that celebrate diverse cultural identities.",
    category: "retail", ethnic_community: "Black / Minority-owned",
    city: "Willow Grove", state: "PA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "I SAW Visions amplifies over 60 minority artisans under one roof — shopping here is an act of distributed community support, with every purchase directly sustaining a different creative entrepreneur from the community.",
  },

  // ════════════════════════════════════════════════════════════════════
  // HARRISBURG PA — satellite city entities
  // ════════════════════════════════════════════════════════════════════
  {
    name: "A Gathering at the Crossroads Monument Harrisburg",
    description: "A Harrisburg monument on the former site of the Old Eighth Ward — erected in 2020 honoring the 15th and 19th Amendments with statues of four prominent African American activists from Harrisburg, on land where a vibrant Black neighborhood was demolished to expand the State Capitol.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Harrisburg", state: "PA",
    address: "Irvis Equality Circle, South Lawn of PA State Capitol, Harrisburg, PA",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "The Old Eighth Ward was demolished in the 1910s to expand the Capitol — over 1,000 residents displaced to serve the state's architectural ambition. The monument stands on that lost neighborhood's ground, a permanent act of cultural memory and political accountability.",
  },
  {
    name: "Broad Street Market Harrisburg",
    description: "A Harrisburg historic public market founded in 1860 — one of the oldest continuously operating farmers markets in the United States and a major hub for minority-owned food vendors and community gathering in Pennsylvania's capital.",
    category: "landmark",
    city: "Harrisburg", state: "PA",
    address: "1233 N 3rd St, Harrisburg, PA 17102",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1860,
    admission_free: true,
    is_family_friendly: true,
    visit_tip: "Broad Street Market has fed Harrisburg for 160 years — the minority-owned vendors here represent the economic integration of immigrant and diaspora communities into one of America's oldest continuously operating public markets.",
  },
  {
    name: "National Civil War Museum Harrisburg",
    description: "A Harrisburg museum and one of the largest dedicated to the Civil War — featuring specific exhibits on the abolition of slavery and the United States Colored Troops (USCT), telling the story of how Black Americans fought for their own freedom.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Harrisburg", state: "PA",
    address: "1 Lincoln Circle at Reservoir Park, Harrisburg, PA 17103",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The USCT — United States Colored Troops — were the 180,000 Black soldiers who fought for the Union. Their participation was decisive in winning the Civil War and they demanded freedom not as a gift but as a right they were willing to die for.",
  },

  // ════════════════════════════════════════════════════════════════════
  // NEW YORK NY — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Sylvia's Restaurant New York",
    description: "A New York legendary Harlem soul food restaurant serving Southern comfort classics since 1962 — the 'Queen of Soul Food,' founded by Sylvia Woods, who built a Harlem institution that has hosted civil rights leaders, musicians, and presidents.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "New York", state: "NY",
    address: "328 Lenox Ave, New York, NY 10027",
    pin_type: "business_restaurant", listing_status: "staged",
    year_established: 1962,
    visit_tip: "Sylvia's is where you eat the history of Harlem — the same restaurant that fed the civil rights generation, the Black Power generation, and the hip-hop generation is still serving the same soul food that Sylvia Woods brought from her South Carolina roots.",
  },
  {
    name: "The Lit. Bar New York",
    description: "A New York Black-owned bookstore and wine bar in the South Bronx — the only bookstore in the South Bronx, founded to give a literary community access to books in a borough that has been systematically underserved by major retail institutions.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "New York", state: "NY",
    address: "131 Alexander Ave, Bronx, NY 10454",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "The Lit. Bar is the only bookstore in the South Bronx — a borough of 1.5 million people. Its existence is a statement about literacy, community investment, and the determination to bring cultural infrastructure to historically underserved neighborhoods.",
  },
  {
    name: "Bunna Cafe New York",
    description: "A New York Ethiopian vegan cafe in Bushwick serving traditional Ethiopian plant-based cuisine — celebrating the naturally vegan tradition within Ethiopian food culture through a welcoming space that honors East African culinary heritage in Brooklyn.",
    category: "cafe", ethnic_community: "Ethiopian",
    city: "New York", state: "NY",
    address: "1084 Flushing Ave, Brooklyn, NY 11237",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Ethiopian fasting food — the plant-based tradition observed by Orthodox Ethiopian Christians for over 200 fasting days per year — is one of the world's great vegan cuisines, developed not by trend but by religious practice. Bunna Cafe celebrates this ancient vegan tradition.",
  },
  {
    name: "Africa Kine New York",
    description: "A New York Senegalese restaurant in Harlem serving traditional West African cuisine — offering thieboudienne (the national dish of Senegal), yassa chicken, and mafe in a space that celebrates Senegalese culinary traditions in the heart of Black New York.",
    category: "restaurant", ethnic_community: "Senegalese / West African",
    city: "New York", state: "NY",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Thieboudienne — Senegal's national dish of fish with rice cooked in tomato-based broth — is one of West Africa's greatest culinary achievements and the dish from which America's 'red rice' traditions directly descend. Africa Kine brings this foundation of diaspora food to Harlem.",
  },
  {
    name: "Kokomo New York",
    description: "A New York Caribbean-owned rum bar and Caribbean food spot in Brooklyn — celebrating the flavors and spirits of the Caribbean diaspora through craft cocktails, Caribbean snacks, and a warm atmosphere that makes the islands feel close.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "New York", state: "NY",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Caribbean rum culture reflects 400 years of island agricultural history — each island's rum tells the story of its specific sugar production, distillation tradition, and cultural identity. Kokomo makes the Caribbean's rum diversity accessible and celebratory.",
  },
  {
    name: "Safari Restaurant New York",
    description: "A New York East African restaurant in Harlem serving Ethiopian and Somali cuisine — celebrating the culinary traditions of the Horn of Africa in a Harlem that has welcomed successive waves of African immigrants since the Great Migration.",
    category: "restaurant", ethnic_community: "Ethiopian / Somali",
    city: "New York", state: "NY",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Harlem's transformation from African American cultural capital to pan-African cultural hub is reflected in restaurants like Safari — where Ethiopian and Somali traditions now sit alongside the soul food legacy of the neighborhood's original Black residents.",
  },

  // ════════════════════════════════════════════════════════════════════
  // NEWARK NJ — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Sabor Unido Newark",
    description: "A Newark Ironbound restaurant serving homemade Brazilian and Portuguese cuisine — representing the deep Lusophone diaspora culinary traditions that have made the Ironbound one of the best immigrant food neighborhoods on the East Coast.",
    category: "restaurant", ethnic_community: "Brazilian / Portuguese",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Ironbound's Brazilian-Portuguese food corridor reflects the shared Lusophone culture that connects these communities — the feijoada and bacalhau represent the two culinary pillars of Lusophone diaspora cooking in Newark.",
  },
  {
    name: "Walia Ethiopian Restaurant Newark",
    description: "A Newark Ethiopian restaurant serving traditional East African cuisine — bringing the rich injera and stew tradition of Ethiopian cooking to New Jersey's most culturally diverse city, honoring Newark's African immigrant community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Named for the endangered Walia ibex native to Ethiopia's Simien Mountains, the restaurant connects Newark's Ethiopian diaspora to the ecological and cultural heritage of their homeland.",
  },
  {
    name: "Cornbread Restaurant Newark",
    description: "A Newark Black-owned soul food restaurant celebrating traditional Southern cooking — serving the African American community and the broader Newark population with the comfort food traditions that sustained Black communities through generations of challenge.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cornbread — the simple bread made from the corn that sustained both Indigenous and enslaved African communities — is the soul of Southern cooking. A restaurant named for this humble staple honors the foundational ingredient of African American culinary culture.",
  },
  {
    name: "Fernandes Steakhouse Newark",
    description: "A Newark Ironbound Portuguese steakhouse serving traditional grilled meats — a highly-rated institution representing the established Portuguese immigrant business tradition that defines the Ironbound as one of America's great immigrant food neighborhoods.",
    category: "restaurant", ethnic_community: "Portuguese",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Ironbound's Portuguese grilling tradition — piri-piri chicken, espetada on bay laurel skewers — is distinct from Brazilian churrasco, reflecting the different grilling traditions that evolved on both sides of the Atlantic from shared Lusophone heritage.",
  },
  {
    name: "The Green Chicpea Newark",
    description: "A Newark Israeli-owned vegan and vegetarian restaurant offering Mediterranean plant-based cuisine — celebrating the Mediterranean tradition of vegetable-forward cooking through dishes that make plant-based eating delicious and culturally resonant.",
    category: "restaurant", ethnic_community: "Israeli / Middle Eastern",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mediterranean plant-based cooking — rooted in the vegetables, legumes, and olive oils of the region — is one of the world's healthiest and most delicious dietary traditions. The Green Chicpea makes this ancient tradition accessible and contemporary.",
  },

  // ════════════════════════════════════════════════════════════════════
  // BOSTON MA — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Frugal Bookstore Boston",
    description: "A Boston Black-owned bookstore in Roxbury celebrating African American literature — the only Black-owned bookstore in Greater Boston, serving as a cultural anchor for the community and ensuring that Black voices in literature are accessible to Roxbury's residents.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Boston", state: "MA",
    address: "37 Martin Luther King Jr Blvd, Boston, MA 02119",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Frugal Bookstore is the only Black-owned bookstore in Greater Boston — a city of over 600,000 people, home to Harvard and MIT and dozens of universities. Its existence is a cultural necessity, not a commercial luxury.",
  },
  {
    name: "Comfort Kitchen Boston",
    description: "A Boston Black-owned restaurant in Dorchester celebrating global diaspora cuisine through comfort food from around the world — offering dishes that honor the diverse immigrant and diaspora communities that make Dorchester one of Boston's most culturally rich neighborhoods.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Dorchester's transformation into one of America's most diverse neighborhoods — with large Vietnamese, Haitian, Caribbean, and African communities — is reflected in Comfort Kitchen's global menu of diaspora comfort foods.",
  },
  {
    name: "Gourmet Kreyol Boston",
    description: "A Boston Haitian-owned restaurant celebrating Haitian Creole cuisine — offering traditional dishes like griot (fried pork), diri ak djon djon (black mushroom rice), and pikliz (spicy pickled vegetables) that represent Haiti's extraordinarily rich culinary heritage.",
    category: "restaurant", ethnic_community: "Haitian",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Haitian cuisine reflects the first Black republic's unique history — indigenous Taíno ingredients, West African cooking techniques, and French culinary influence created a cuisine that is entirely its own. Gourmet Kreyol brings this extraordinary tradition to Boston.",
  },
  {
    name: "Fasika Cafe Boston",
    description: "A Boston Ethiopian cafe serving traditional Ethiopian coffee and cuisine — named for the Ethiopian Easter celebration (Fasika), honoring the deeply spiritual relationship between Ethiopian Orthodox Christianity and the culinary traditions of the country.",
    category: "cafe", ethnic_community: "Ethiopian",
    city: "Boston", state: "MA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Fasika — the Ethiopian Orthodox Easter — is the most sacred celebration in Ethiopian Christianity, following a 55-day fast. The cafe named for this celebration honors the inseparable connection between Ethiopian faith, fasting, and the feast foods that break it.",
  },
  {
    name: "Doña Habana Restaurant Boston",
    description: "A Boston Cuban-owned restaurant celebrating Cuban cuisine in the Dorchester community — offering traditional Cuban dishes like ropa vieja, lechón, and Cuban sandwiches that preserve the culinary heritage of the Cuban diaspora in New England.",
    category: "restaurant", ethnic_community: "Cuban",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cuban cuisine's blend of Spanish, African, and Caribbean ingredients reflects the island's multicultural history — the ropa vieja (shredded beef stew) and black beans represent the African culinary influence that defines Cuban cooking.",
  },
  {
    name: "Alma Gaucha Brazilian Steakhouse Boston",
    description: "A Boston Brazilian churrascaria serving rodízio-style grilled meats — celebrating Brazilian gaucho culture and the South American tradition of fire-roasted meats in a sophisticated steakhouse that honors the cultural heritage of Brazil's pampas region.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The gaucho tradition of southern Brazil — cattle ranchers who developed the churrasco method of open-fire cooking on long skewers — gave the world one of its most celebratory dining experiences. Alma Gaucha brings this tradition to Boston.",
  },

  // ════════════════════════════════════════════════════════════════════
  // HARTFORD CT — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "The Russell Hartford",
    description: "A Hartford Black-owned creative space and restaurant celebrating Black entrepreneurship and cultural community — a gathering place where the arts, food, and commerce intersect to create the kind of cultural hub that Black Hartford has long needed.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Hartford", state: "CT",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Hartford's Black community has a long history of civil rights organizing and cultural institution building — The Russell continues this tradition by creating a contemporary gathering space that celebrates Black creativity and entrepreneurship.",
  },
  {
    name: "Island Fish Head Jamaican Restaurant Hartford",
    description: "A Hartford Jamaican restaurant serving authentic island cuisine — bringing the bold flavors of Jamaican cooking to Connecticut's capital city for the Caribbean diaspora community that has made Hartford one of New England's most Caribbean cities.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Hartford", state: "CT",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Hartford's Caribbean community is one of the oldest and most established in New England — Jamaican restaurants here serve not just as dining spots but as cultural gathering places where the community maintains connection to island traditions.",
  },
  {
    name: "Soulbaila Hartford",
    description: "A Hartford restaurant celebrating the intersection of soul food and Caribbean cuisine — honoring the shared African roots of both culinary traditions through dishes that make the connections between Black American and Caribbean cooking explicit and delicious.",
    category: "restaurant", ethnic_community: "Black / Caribbean",
    city: "Hartford", state: "CT",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The name 'Soulbaila' merges soul food with baila (Spanish for dance/party) — reflecting Hartford's intersection of African American and Caribbean Latino cultures in a city where these communities share neighborhoods and cultural spaces.",
  },
  {
    name: "Story and Soil Coffee Hartford",
    description: "A Hartford Black-owned specialty coffee shop celebrating the stories behind the coffee — a community gathering space honoring the agricultural traditions and cultures of the coffee-growing regions that supply Hartford's favorite morning beverage.",
    category: "cafe", ethnic_community: "Black / African American",
    city: "Hartford", state: "CT",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Coffee's roots are in Ethiopia — and the coffee supply chain connects Ethiopian, Guatemalan, Colombian, and Kenyan farmers to the cup. Story and Soil honors these origins by centering the stories of the people who grow the coffee.",
  },
  {
    name: "Coracora Original Hartford",
    description: "A Hartford Pacific Islander-owned restaurant serving traditional island cuisine — celebrating the foodways of Pacific Island communities through dishes that bring the flavors of Polynesia and Micronesia to New England.",
    category: "restaurant", ethnic_community: "Pacific Islander",
    city: "Hartford", state: "CT",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pacific Islander communities in New England are often invisible to mainstream culture — Coracora Original makes the food traditions of Pacific Island cultures visible and accessible in Hartford.",
  },

  // ════════════════════════════════════════════════════════════════════
  // JACKSONVILLE FL — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Irie Diner Jacksonville",
    description: "A Jacksonville Caribbean restaurant serving authentic Jamaican cuisine — bringing the irie spirit of Jamaica to Northeast Florida through jerk chicken, oxtail, and island hospitality that makes every meal a celebration.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Irie — the Jamaican expression of feeling at peace and in harmony — captures the spirit of this restaurant. Caribbean food culture is deeply tied to a philosophy of enjoyment and togetherness that transforms a meal into a mood.",
  },
  {
    name: "Pink Salt Restaurant Jacksonville",
    description: "A Jacksonville Black-owned upscale restaurant offering creative American cuisine with global influences — a sophisticated dining destination celebrating Black culinary creativity and elevating Jacksonville's Black-owned restaurant scene.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Pink Salt represents the growing luxury dining segment of Black entrepreneurship — Black-owned restaurants that offer elevated cuisine challenge the stereotype that Black businesses occupy only casual dining categories.",
  },
  {
    name: "Sweet Mama's Southern Homestyle Cookin Jacksonville",
    description: "A Jacksonville Black-owned soul food restaurant serving traditional Southern homestyle cooking — fried chicken, collard greens, and sweet potato pie in the tradition of Black Southern cooking that nourishes both body and community.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Jacksonville's African American community has deep roots in Florida's Black history — restaurants like Sweet Mama's preserve the culinary traditions that sustained this community through the long era of Florida's Jim Crow laws and into the present.",
  },
  {
    name: "Latin House Grill Jax Jacksonville",
    description: "A Jacksonville Latin American restaurant celebrating the culinary diversity of Latin America — serving tacos, arepas, and Latin street food to Jacksonville's growing Hispanic community and the broader city.",
    category: "restaurant", ethnic_community: "Latino",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Jacksonville's Latino population has grown significantly in recent decades — Latin House Grill reflects the culinary diversity of Latin American immigration to Northeast Florida, where Cuban, Puerto Rican, and Central American traditions intersect.",
  },
  {
    name: "Lalibela Ethiopian Restaurant Jacksonville",
    description: "A Jacksonville Ethiopian restaurant serving traditional East African cuisine — named after Ethiopia's famous rock-hewn churches, the restaurant celebrates the spiritual and culinary heritage of Ethiopia in Northeast Florida.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Lalibela's rock-hewn churches — carved directly from volcanic rock in the 12th and 13th centuries — are UNESCO World Heritage Sites and a symbol of Ethiopian civilizational achievement. Naming a restaurant after them connects the everyday act of eating to Ethiopia's magnificent history.",
  },
  {
    name: "Vagabond Korean Steakhouse Jacksonville",
    description: "A Jacksonville Korean barbecue restaurant celebrating Korean grill culture — offering tableside Korean barbecue and traditional Korean dishes that introduce Jacksonville to the communal grilling tradition at the heart of Korean food culture.",
    category: "restaurant", ethnic_community: "Korean",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Korean barbecue's communal grilling experience — where diners cook their own meat at the table while sharing banchan side dishes — is one of the world's great social eating traditions, transforming a meal into a collaborative act.",
  },

  // ════════════════════════════════════════════════════════════════════
  // ORLANDO FL — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Selam Ethiopian Restaurant Orlando",
    description: "An Orlando Ethiopian and Eritrean restaurant offering authentic East African cuisine — serving the Horn of Africa diaspora community in Central Florida through traditional injera-based communal platters and Ethiopian coffee ceremony experiences.",
    category: "restaurant", ethnic_community: "Ethiopian / Eritrean",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Selam means 'peace' in Amharic and Tigrinya — a greeting that also expresses a cultural philosophy of harmony and community. The restaurant embodies this spirit through the communal eating tradition of Ethiopian cuisine.",
  },
  {
    name: "Authentic Books Orlando",
    description: "An Orlando Black-owned bookstore celebrating authentic stories by and for the African diaspora — a community cultural hub offering literature that centers Black voices in a city where Black culture is often eclipsed by the tourism industry.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Orlando", state: "FL",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "In a city dominated by entertainment tourism, Authentic Books creates a space for Black Orlando's intellectual and literary life — celebrating the stories that belong to the community rather than the stories manufactured for tourist consumption.",
  },
  {
    name: "Anh Hong Vietnamese Restaurant Orlando",
    description: "An Orlando Vietnamese restaurant serving traditional Vietnamese cuisine in the Mills 50 District — part of Orlando's Little Vietnam community, offering authentic pho, bun bo Hue, and Vietnamese home-cooking traditions.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Orlando's Mills 50 District is a Vietnamese cultural corridor that developed as refugees resettled in Central Florida after 1975 — the concentration of Vietnamese restaurants, markets, and cultural organizations makes it a genuine community anchor.",
  },
  {
    name: "Tony's Brazilian Grill Orlando",
    description: "An Orlando Brazilian restaurant serving traditional Brazilian churrasco and comfort food — celebrating the culinary traditions of Brazil's diverse regional cuisines for Central Florida's growing Brazilian community.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Brazil's culinary diversity is enormous — from the moqueca (fish stew) of Bahia to the churrasco of Rio Grande do Sul. The Orlando area has a significant Brazilian community, and Tony's connects them to these diverse regional traditions.",
  },
  {
    name: "Kalalou Bar and Lounge Orlando",
    description: "An Orlando Caribbean and Haitian-owned bar and lounge serving island-inspired food and cocktails — celebrating Caribbean culture through music, cocktails, and cuisine in a vibrant gathering space for Central Florida's Caribbean diaspora.",
    category: "restaurant", ethnic_community: "Caribbean / Haitian",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Kalalou (also spelled callaloo) is a leafy green found across the Caribbean that appears in different forms in different island cuisines — it represents the unity within Caribbean culinary diversity that the lounge celebrates.",
  },

  // ════════════════════════════════════════════════════════════════════
  // TAMPA FL — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Queen of Sheba Ethiopian Restaurant Tampa",
    description: "A Tampa family-owned Ethiopian restaurant in Temple Terrace serving traditional dishes with fresh ingredients — bringing authentic Ethiopian flavors to Tampa's diverse food landscape through the communal dining traditions of East Africa.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Tampa", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Queen of Sheba is a figure shared across Ethiopian, Yemeni, and Judaic traditions — a symbol of powerful, wise, and beautiful Black womanhood. The restaurant named for her claims this legacy of Black female excellence for Tampa's Ethiopian community.",
  },
  {
    name: "Madame Fortune Caribbean Restaurant Tampa",
    description: "A Tampa Caribbean-inspired restaurant in Ybor City featuring signature dishes, craft cocktails, and live-music ambiance — celebrating Caribbean culture in Tampa's historic Ybor City, blending island flavors with the neighborhood's rich Latin heritage.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Tampa", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ybor City was built by Cuban and Spanish cigar workers in the 1890s — its streets carry layers of Caribbean and Latin heritage. Madame Fortune adds Caribbean island culture to this already rich multicultural neighborhood.",
  },
  {
    name: "La Segunda Bakery Tampa",
    description: "A Tampa historic Cuban bakery in Ybor City serving Cuban bread and pastries since 1915 — one of the oldest Cuban bakeries in the country, producing the famous Cuban bread that has defined Tampa's sandwich culture for over a century.",
    category: "bakery", ethnic_community: "Cuban",
    city: "Tampa", state: "FL",
    address: "2512 N 15th St, Tampa, FL 33605",
    pin_type: "business_restaurant", listing_status: "staged",
    year_established: 1915,
    visit_tip: "Tampa's Cuban sandwich — distinct from the Miami version in using salami — was invented by Ybor City's Cuban workers. La Segunda's Cuban bread, with its palmetto leaf impression on top, is the essential ingredient that makes Tampa's Cuban sandwich possible.",
  },
  {
    name: "Jerk Hut Island Grille Tampa",
    description: "A Tampa Black-owned Caribbean restaurant featuring jerk chicken, oxtail, and other Caribbean favorites — bringing island cooking traditions and the warmth of Caribbean hospitality to Tampa Bay's diverse dining scene.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Tampa", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Jerk seasoning — the Jamaican spice blend of scotch bonnet peppers, allspice, thyme, and ginger — was developed by the Maroons, escaped enslaved Africans who preserved their freedom in Jamaica's Blue Mountains. Every jerk dish carries this history of resistance.",
  },

  // ════════════════════════════════════════════════════════════════════
  // SAVANNAH GA — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Geneva's Famous Chicken Savannah",
    description: "A Savannah beloved Black-owned fried chicken and cornbread institution — a community staple serving the classic Southern combination that has defined Savannah's Black culinary heritage for generations.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Savannah", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Savannah's Black culinary tradition is shaped by Gullah Geechee influences — the rice-growing culture and West African foodways of the Sea Islands run through the city's Black cooking traditions in ways that make Savannah food distinct from other Southern cities.",
  },
  {
    name: "The Grey Savannah",
    description: "A Savannah James Beard Award-winning restaurant in a restored 1938 Greyhound bus terminal — celebrating the culinary heritage of the South through the lens of African American history, with a menu that honors the contributions of Black cooks to Southern food culture.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Savannah", state: "GA",
    address: "109 Martin Luther King Jr Blvd, Savannah, GA 31401",
    pin_type: "business_restaurant", listing_status: "staged",
    year_established: 2014,
    visit_tip: "The building was a Greyhound terminal during the era of the Green Book — when Black travelers used bus stations as safe travel hubs because they weren't welcome in most hotels. The Grey's transformation of this space honors that history while creating something new.",
  },
  {
    name: "Sisters of the New South Savannah",
    description: "A Savannah Black-owned soul food restaurant serving traditional Southern cooking — a community gathering place celebrating the culinary traditions of African American women who created the foundational recipes of Southern cuisine.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Savannah", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The 'Sisters' in this restaurant's name honors the Black women who created Southern cuisine — enslaved and free Black women whose culinary genius transformed limited ingredients into the food traditions that define an entire American region.",
  },
  {
    name: "Latin Chicks Restaurant Savannah",
    description: "A Savannah Latin American restaurant serving Cuban and Caribbean-inspired dishes — celebrating the Latin diaspora's culinary contributions to coastal Georgia through bold flavors and island hospitality.",
    category: "restaurant", ethnic_community: "Latino / Cuban",
    city: "Savannah", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Savannah's coastal location has historically connected it to the Caribbean — the Latin American culinary presence in the city continues a centuries-old connection between the Georgia coast and the islands of the Atlantic.",
  },
  {
    name: "First African Baptist Church Savannah",
    description: "A Savannah historic church established in 1773 — the oldest Black church in North America, founded by enslaved people who maintained a congregation despite laws against Black assembly, preserving faith and community under the most oppressive conditions.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Savannah", state: "GA",
    address: "23 Montgomery St, Savannah, GA 31401",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1773,
    visit_tip: "Founded in 1773 — before American independence — First African Baptist is the oldest continuous Black congregation in North America. The church's sanctuary contains quilt patterns in the floorboards that were Underground Railroad signals, hiding a crawl space that sheltered freedom seekers.",
  },
  {
    name: "Ralph Mark Gilbert Civil Rights Museum Savannah",
    description: "A Savannah museum celebrating the civil rights movement in Georgia — honoring Ralph Mark Gilbert, who led the Savannah NAACP and organized the largest civil rights movement in the state's history, making Savannah one of the South's most successful desegregation stories.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Savannah", state: "GA",
    address: "460 Martin Luther King Jr Blvd, Savannah, GA 31401",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Savannah achieved desegregation more peacefully than most Southern cities through strategic, organized nonviolent resistance — the Gilbert Museum documents the sophisticated civil rights organizing that made Savannah's movement a model of effective community action.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CHARLESTON SC — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "International African American Museum Charleston",
    description: "A Charleston museum on historic Gadsden's Wharf — where an estimated 100,000 enslaved Africans first set foot in North America, now a powerful museum documenting the journey of the African diaspora with the African Ancestors Memorial Garden and immersive exhibits.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Charleston", state: "SC",
    address: "14 Wharfside St, Charleston, SC 29401",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 2023,
    is_accessible: true,
    visit_tip: "Gadsden's Wharf is one of the most significant sites in African American history — approximately 40% of all enslaved Africans brought to North America arrived through this port. Standing on this ground requires the same gravity as visiting any memorial to mass human suffering.",
  },
  {
    name: "Mother Emanuel AME Church Charleston",
    description: "A Charleston historic church founded in 1816 — the oldest AME church in the South, known for its rich history, activism, and resilience, having survived arson, earthquake, and the 2015 mass shooting that killed nine parishioners while remaining a beacon of faith and community.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Charleston", state: "SC",
    address: "110 Calhoun St, Charleston, SC 29401",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1816,
    visit_tip: "Mother Emanuel's 200-year history of survival — against arson in 1822, earthquakes in 1886, and the 2015 massacre — makes it one of the most resilient institutions in American history. The response of the congregation to the shooting, offering forgiveness, was one of the most profound moral acts of the 21st century.",
  },
  {
    name: "Avery Research Center Charleston",
    description: "A Charleston museum at the College of Charleston collecting and preserving the unique history and culture of the African diaspora in the Lowcountry — housing irreplaceable documents and oral histories of Gullah Geechee culture and Black life in coastal South Carolina.",
    category: "museum", ethnic_community: "Black / Gullah Geechee",
    city: "Charleston", state: "SC",
    address: "125 Bull St, Charleston, SC 29424",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true,
    visit_tip: "Gullah Geechee culture — the distinct African American culture of the Sea Islands — preserved more of West African language, food, and spiritual traditions than any other community in the United States. The Avery Center's archives are among the most important records of this cultural heritage.",
  },
  {
    name: "McLeod Plantation Historic Site Charleston",
    description: "A Charleston former plantation that now focuses on the stories of the enslaved people who lived and worked there — offering a rare museum experience that centers enslaved people's perspectives and the transition to freedom on the plantation grounds.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Charleston", state: "SC",
    address: "325 Country Club Dr, Charleston, SC 29412",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Unlike plantation museums that center the enslaver's story, McLeod focuses on the enslaved — their labor, their community, and their transition to freedom. Visiting here with this framing transforms the experience from a tour of a historic home to an act of witness.",
  },
  {
    name: "Hannibal's Kitchen Charleston",
    description: "A Charleston family-owned soul food and Gullah cuisine restaurant on the East Side for over 40 years — serving authentic Gullah dishes like crab and shrimp rice, preserving the culinary heritage of the Lowcountry in one of Charleston's oldest African American neighborhoods.",
    category: "restaurant", ethnic_community: "Black / Gullah Geechee",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Gullah cooking — the culinary tradition of the Sea Island people — is one of the most distinctive regional cuisines in America. Dishes like crab rice, okra soup, and rice and gravy directly preserve West African foodways that arrived on this coast 300 years ago.",
  },
  {
    name: "Bintü Atelier Charleston",
    description: "A Charleston intimate West African restaurant on the East Side offering authentic dishes like jollof rice, fufu, and mafe — connecting Charleston's African American community to their West African roots through the food of the ancestors who were brought to this shore.",
    category: "restaurant", ethnic_community: "West African",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "In the city where 40% of enslaved Africans entered North America, a West African restaurant on the East Side creates a profound connection — the food of the ancestors, served in the neighborhood their descendants built, is an act of cultural restoration.",
  },
  {
    name: "Taste of the Islands Charleston",
    description: "A Charleston Caribbean restaurant in West Ashley serving Jamaican ackee sautés, curried goat, and jerk wings — bringing authentic Caribbean cooking traditions to the South Carolina Lowcountry and celebrating the connections between Gullah and Caribbean cultures.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Gullah Geechee and Caribbean cultures share West African ancestry — enslaved Africans in coastal South Carolina and in the Caribbean islands came largely from the same regions of West Africa. Caribbean cuisine here is a culinary homecoming.",
  },
  {
    name: "Phuong Vietnamese Restaurant Charleston",
    description: "A Charleston Vietnamese restaurant in North Charleston serving authentic pho and spring rolls — part of the growing Vietnamese community in the Carolina Lowcountry, offering traditional dishes that maintain cultural connection for South Carolina's Vietnamese diaspora.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Vietnamese communities in the Carolinas arrived largely as refugees after 1975 — their presence in coastal communities like Charleston reflects the fishing culture connections between Vietnam's coastal communities and the Lowcountry's seafood traditions.",
  },
  {
    name: "El Molino Supermarket Charleston",
    description: "A Charleston Latin American supermarket in West Ashley offering a wide variety of Latin American groceries, fresh produce, and authentic prepared foods — serving as a cultural hub for Charleston's growing Hispanic community.",
    category: "market", ethnic_community: "Latino / Hispanic",
    city: "Charleston", state: "SC",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Latin American grocery stores provide cultural continuity for diaspora communities — the specific chiles, spices, and products that make authentic cooking possible are what allow families to maintain their food traditions across generations.",
  },

  // ════════════════════════════════════════════════════════════════════
  // NASHVILLE TN — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Slim and Husky's Pizza Beeria Nashville",
    description: "A Nashville Black-owned pizza restaurant celebrating African American creativity in the pizza tradition — offering artisan pies with unexpected flavor combinations in a lively setting that has become a Nashville institution celebrating Black entrepreneurship.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Nashville", state: "TN",
    address: "911 Buchanan St, Nashville, TN 37208",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Slim & Husky's has become a Nashville institution not just for pizza but for what it represents — Black entrepreneurship transforming a traditionally Italian-American food category through creativity, community investment, and cultural pride.",
  },
  {
    name: "Alkebu-Lan Images Nashville",
    description: "A Nashville Black-owned gallery and cultural space celebrating African and African American art — one of the oldest Black art galleries in Nashville, providing a platform for artists of the diaspora and preserving cultural heritage through visual art.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Nashville", state: "TN",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Alkebu-lan is an ancient Arabic name for Africa — the gallery's name connects Nashville's Black artistic community to a continental cultural identity. In a city famous for country music, this space insists on the breadth of African American cultural production.",
  },
  {
    name: "Edessa Restaurant Nashville",
    description: "A Nashville Ethiopian restaurant serving traditional East African cuisine — named for the ancient city of Edessa, whose history intersects with Ethiopian Orthodox Christianity, honoring the deep historical roots of Ethiopian culture.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Nashville", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Edessa was one of the first cities to adopt Christianity in the 2nd century, with strong ties to the Ethiopian Orthodox tradition — the restaurant named for it honors Nashville's Ethiopian community's deep connection to this ancient faith and its cultural expressions.",
  },
  {
    name: "Awash Ethiopian Restaurant Nashville",
    description: "A Nashville Ethiopian restaurant celebrating the culinary heritage of Ethiopia — named for the Awash River, one of Ethiopia's most important waterways, the restaurant provides authentic East African dining for Nashville's growing East African community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Nashville", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Awash River valley is one of the most significant locations in human evolutionary history — the fossils of Lucy and other early hominids were found there. The restaurant named for this river connects its cuisine to the very origins of human food culture.",
  },
  {
    name: "Plaza Mariachi Nashville",
    description: "A Nashville Mexican cultural center and marketplace — a vibrant indoor mercado celebrating Mexican culture through mariachi music, authentic restaurants, and artisan shops, creating a Mexican cultural destination in Music City.",
    category: "landmark", ethnic_community: "Mexican / Latino",
    city: "Nashville", state: "TN",
    address: "3955 Nolensville Pike, Nashville, TN 37211",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Plaza Mariachi makes Mexican culture impossible to ignore in Nashville — the mariachi performances, authentic food vendors, and artisan shops create a full cultural immersion that challenges the assumption that Music City's music is only country.",
  },
  {
    name: "Jamaicaway Restaurant Nashville",
    description: "A Nashville Jamaican restaurant serving authentic island cuisine — bringing Jamaican jerk tradition, oxtail, and island hospitality to Tennessee while serving the Caribbean diaspora community that has made Nashville one of the South's most diverse cities.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Nashville", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nashville's diversity is often overlooked in the city's country music narrative — Jamaicaway and similar diaspora restaurants represent the real Nashville, a city of immigrants and migrants from across the globe who have made it their home.",
  },

  // ════════════════════════════════════════════════════════════════════
  // DETROIT MI — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Baobab Fare Detroit",
    description: "A Detroit Burundian-owned restaurant serving traditional East African cuisine — founded by refugees from Burundi, offering authentic East African dishes while creating employment for other refugees and celebrating the culinary heritage of Central-East Africa.",
    category: "restaurant", ethnic_community: "East African / Burundian",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Baobab Fare's founding story — Burundian refugees building a restaurant that creates jobs for other refugees — embodies the community resilience that defines immigrant entrepreneurship. The baobab tree's deep roots and ability to survive drought mirrors this resilience.",
  },
  {
    name: "Source Booksellers Detroit",
    description: "A Detroit Black-owned independent bookstore in Midtown celebrating African American literature — a community cultural anchor offering carefully curated books that center the African American intellectual tradition in one of Black America's most historically significant cities.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Detroit", state: "MI",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Detroit's Black intellectual tradition — from the civil rights organizing of the NAACP's founding to the revolutionary politics of the League of Revolutionary Black Workers — makes Source Booksellers an essential institution for understanding how Detroit's Black community has thought and organized.",
  },
  {
    name: "Good Cakes and Bakes Detroit",
    description: "A Detroit Black-owned bakery and cafe offering artisan pastries and baked goods — celebrating Black baking excellence and creating a welcoming community gathering space in Detroit's resurgent urban landscape.",
    category: "bakery", ethnic_community: "Black / African American",
    city: "Detroit", state: "MI",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Detroit's bakery scene is part of the city's broader cultural renaissance — Good Cakes and Bakes represents the Black entrepreneurship that is rebuilding Detroit's neighborhoods through quality, creativity, and community investment.",
  },
  {
    name: "Kuzzo's Chicken and Waffles Detroit",
    description: "A Detroit Black-owned chicken and waffles restaurant celebrating the beloved African American brunch tradition — a community gathering place honoring the soul food heritage that has defined Black social eating in Detroit and across the diaspora.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Chicken and waffles — the combination of savory fried chicken and sweet waffles that became an iconic Black American brunch dish — has roots in Harlem's jazz clubs of the 1930s. The dish represents the creative genius of Black culinary fusion.",
  },
  {
    name: "Shatila Bakery Dearborn",
    description: "A Dearborn Lebanese bakery and sweet shop in the heart of Arab America — serving traditional Middle Eastern pastries, baklava, and ice cream for decades in the community that is the largest Arab American population center in the United States.",
    category: "bakery", ethnic_community: "Lebanese / Arab American",
    city: "Dearborn", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Dearborn has the largest concentration of Arab Americans in the United States — Shatila Bakery has fed this community for decades with the Middle Eastern sweets that mark celebrations, mourn losses, and maintain cultural connection across generations.",
  },
  {
    name: "Yemen Cafe Hamtramck",
    description: "A Hamtramck Yemeni restaurant serving traditional Yemeni cuisine — representing the extraordinary concentration of Yemeni immigrants in Hamtramck, a city where the Muslim community now forms a majority and Yemeni food traditions define the local culinary landscape.",
    category: "restaurant", ethnic_community: "Yemeni / Arab",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Hamtramck elected America's first Muslim-majority city council in 2021 — and Yemeni immigrants are a major part of this community. Yemen Cafe serves dishes like saltah (the national soup), mandi (slow-cooked meat and rice), and bint al-sahn (honey bread) that define Yemeni culinary identity.",
  },
  {
    name: "Honey Bee Market La Colmena Detroit",
    description: "A Detroit Mexican market and tienda serving the Latino community — providing authentic Mexican and Latin American groceries, prepared foods, and cultural products that maintain culinary connections for Detroit's Mexican immigrant community.",
    category: "market", ethnic_community: "Mexican / Latino",
    city: "Detroit", state: "MI",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Detroit's Mexican community has deep roots in the automotive industry — Mexican workers came to work in Ford and GM plants in the early 20th century, establishing a community whose culinary traditions have been maintained through markets like Honey Bee.",
  },
  {
    name: "Ima Noodles Detroit",
    description: "A Detroit Japanese-owned noodle restaurant celebrating Japanese ramen and noodle traditions — offering handcrafted noodles and house-made broths in a setting that celebrates Japanese culinary craftsmanship in Detroit's resurgent food scene.",
    category: "restaurant", ethnic_community: "Japanese",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ramen's elevation from instant noodle to artisan craft food reflects the Japanese culinary philosophy of deep specialization — spending years perfecting a single dish. Ima Noodles brings this philosophy to Detroit, where craftsmanship is a cultural value.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CLEVELAND OH — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "ThirdSpace Reading Room Cleveland",
    description: "A Cleveland Black-owned bookstore and community gathering space — offering carefully curated literature centering African American and diaspora voices in a welcoming third space where the community can read, gather, and build cultural connections.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Cleveland", state: "OH",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "A 'third space' — neither home nor work — is where community is built through casual, voluntary association. ThirdSpace Reading Room creates this essential community infrastructure through books, making literacy and cultural connection inseparable.",
  },
  {
    name: "Zoma Ethiopian Restaurant Cleveland",
    description: "A Cleveland Ethiopian restaurant serving traditional East African cuisine — offering the communal injera platter experience that defines Ethiopian food culture for Cleveland's growing East African diaspora community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cleveland's Ethiopian community has grown significantly in recent decades — Zoma provides both authentic cuisine and cultural gathering space for this community while introducing Clevelanders to one of the world's great food traditions.",
  },
  {
    name: "Empress Taytu Ethiopian Restaurant Cleveland",
    description: "A Cleveland Ethiopian restaurant named for Empress Taytu Betul — the wife of Emperor Menelik II who helped design the Ethiopian flag and found the capital Addis Ababa, honoring the extraordinary legacy of Ethiopian women leaders.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Empress Taytu was one of the most powerful women of 19th century Africa — she commanded troops at the Battle of Adwa that defeated Italian colonizers in 1896. A restaurant named for her carries the legacy of Ethiopian women's leadership into everyday community life.",
  },
  {
    name: "Superior Pho Cleveland",
    description: "A Cleveland Vietnamese restaurant serving traditional pho and Southeast Asian noodle dishes — part of Cleveland's Asian American community that has established restaurants along the Superior Avenue corridor in Cleveland's Asian Town.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cleveland's AsiaTown on the near-east side is one of the Midwest's most vibrant Asian American commercial corridors — Superior Pho is part of this ecosystem of Vietnamese, Chinese, and Cambodian restaurants that have made AsiaTown a culinary destination.",
  },
  {
    name: "Irie Jamaican Kitchen Cleveland",
    description: "A Cleveland Jamaican restaurant serving authentic island cuisine — bringing the bold flavors of Jamaica's jerk tradition, oxtail, and curry goat to Northeast Ohio for the Caribbean diaspora community and adventurous Cleveland diners.",
    category: "restaurant", ethnic_community: "Caribbean / Jamaican",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cleveland's Caribbean community includes significant Jamaican, Puerto Rican, and Trinidad populations — Irie Jamaican Kitchen serves this diaspora while also making Caribbean culinary traditions accessible to Cleveland's broader community.",
  },
  {
    name: "Batuqui Brazilian Restaurant Cleveland",
    description: "A Cleveland Brazilian restaurant celebrating the diverse culinary traditions of Brazil — offering traditional Brazilian dishes in a setting that celebrates the culture and community of Cleveland's Brazilian diaspora.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Batuqui is a traditional Brazilian drumming style from Bahia with African roots — the restaurant named for this rhythmic tradition honors the African heritage that infuses Brazilian food, music, and culture.",
  },
  {
    name: "CentroVilla25 Cleveland",
    description: "A Cleveland Latin American community center and gathering space — serving Cleveland's Hispanic community through cultural programming, community events, and the kind of institutional support that allows diaspora communities to maintain their cultural identity.",
    category: "cultural_organization", ethnic_community: "Latino / Hispanic",
    city: "Cleveland", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Cleveland's Latino community — including significant Puerto Rican, Mexican, and Central American populations — has built cultural institutions that transform individual immigrant experience into community cultural life. CentroVilla25 is central to this ecosystem.",
  },

  // ════════════════════════════════════════════════════════════════════
  // COLUMBUS OH — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "King Arts Complex Columbus",
    description: "A Columbus cultural center on the Near East Side that preserves and fosters the contributions of African Americans through the arts — providing gallery space, performance venues, and educational programming that nurture Black artistic expression and community engagement.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Columbus", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Near East Side was Columbus's historic Black neighborhood — the King Arts Complex preserves this cultural geography by making Black arts central to the neighborhood's identity even as the broader area has changed.",
  },
  {
    name: "Bronzeville Neighborhood Columbus",
    description: "A Columbus Near East Side neighborhood with deep African American roots — Columbus's Bronzeville predates many other Black communities in America, documenting the long history of African American settlement and community-building in Ohio's capital.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Columbus", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Bronzeville — the name used for major Black neighborhoods in multiple Northern cities — reflects the Great Migration's transformation of Northern urban centers. Columbus's version has its own distinct history that parallels the better-known Chicago and New York Bronzevilles.",
  },
  {
    name: "Somali Community Association of Ohio Columbus",
    description: "A Columbus community center established in 1996 serving the second-largest Somali community in the United States — offering language classes, job training, and cultural programming that helps Somali refugees build new lives while maintaining cultural identity.",
    category: "cultural_organization", ethnic_community: "Somali",
    city: "Columbus", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1996,
    visit_tip: "Columbus has the second-largest Somali refugee community in America — this community has transformed neighborhoods like Northland into thriving Somali cultural districts with mosques, restaurants, markets, and institutions that make refugee resettlement a story of cultural flourishing, not just survival.",
  },
  {
    name: "Hoyo's Kitchen Columbus",
    description: "A Columbus Somali restaurant at North Market offering authentic Somali cuisine — named for the Somali word for mother, celebrating the maternal tradition of Somali home cooking through dishes that maintain cultural connection for Ohio's large Somali diaspora.",
    category: "restaurant", ethnic_community: "Somali / East African",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Somali cuisine reflects the nomadic pastoral traditions of East Africa — the rice and meat dishes, the tea traditions, the generous hospitality — that developed among communities who moved across the Horn of Africa's vast landscapes.",
  },
  {
    name: "Addis Restaurant Columbus",
    description: "A Columbus Ethiopian restaurant in Northeast Columbus offering authentic traditional Ethiopian cuisine — serving the Ethiopian diaspora community with the injera and stew traditions that connect Columbus's East African residents to their homeland.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Columbus's Ethiopian and Somali communities represent the two largest East African populations in Ohio — restaurants like Addis serve as cultural embassies where these communities maintain food traditions that are central to their identity.",
  },
  {
    name: "Lalibela Restaurant Columbus",
    description: "A Columbus Ethiopian restaurant and bar in Eastmoor offering vegetarian dishes, sandwiches, and traditional Ethiopian fare — named for Ethiopia's famous 12th-century rock-hewn churches, honoring the country's extraordinary architectural and spiritual heritage.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Lalibela's rock-hewn churches — carved from solid volcanic rock in the mountains of Amhara — are considered by many to be the 8th wonder of the ancient world. A restaurant named for them carries this legacy of Ethiopian civilizational achievement into everyday communal eating.",
  },
  {
    name: "Buckeye Pho Columbus",
    description: "A Columbus Vietnamese restaurant serving traditional pho and Vietnamese noodle dishes — offering the slow-simmered broths and fresh accompaniments of Vietnamese soup culture to Ohio's capital city.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Columbus's Vietnamese community settled largely in the north side, creating a modest but vibrant cultural presence. Buckeye Pho combines local Ohio identity with Vietnamese culinary heritage in a name that reflects the community's dual belonging.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CINCINNATI OH — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "National Underground Railroad Freedom Center Cincinnati",
    description: "A Cincinnati museum on the Ohio River perched at the historical boundary between slavery and freedom — exploring the struggle and perseverance of Freedom Fighters, rooted in the stories of the Underground Railroad that carried thousands across this river to liberty.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    address: "50 East Freedom Way, Cincinnati, OH 45202",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The Ohio River was the line between slavery and freedom — people risked death crossing it to reach Cincinnati and the North. The Freedom Center's riverside location makes this historical reality visceral, connecting the museum's story to the actual geography of liberation.",
  },
  {
    name: "Harriet Beecher Stowe House Cincinnati",
    description: "A Cincinnati historic home in Walnut Hills where the famous abolitionist author lived — it was in Cincinnati that Stowe witnessed the realities of slavery across the river in Kentucky, inspiring her to write Uncle Tom's Cabin.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    address: "2950 Gilbert Avenue, Cincinnati, OH 45206",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Stowe's time in Cincinnati — watching enslaved people across the river in Kentucky and encountering freedom seekers on the Underground Railroad — transformed her from a writer into an abolitionist. The book she wrote there helped precipitate the Civil War.",
  },
  {
    name: "King Records Studio Building Cincinnati",
    description: "A Cincinnati studio building that recorded James Brown, Bootsy Collins, and legends across R&B, funk, and soul — one of the first racially integrated businesses in Cincinnati, where Black and white musicians worked side by side during strict segregation.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    address: "1540 Brewster Ave, Cincinnati, OH 45207",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1944,
    visit_tip: "James Brown's most influential early recordings were made at King Records — the studio that would become the birthplace of funk. More remarkable is that King Records was racially integrated in 1944 Cincinnati, an act of moral courage that produced some of the most influential music in American history.",
  },
  {
    name: "Black Music Walk of Fame Cincinnati",
    description: "A Cincinnati outdoor interactive exhibit at the Banks District celebrating the city's rich Black music heritage — honoring legendary Cincinnati musicians like Bootsy Collins and Hi-Tek through installations that make the city's Black musical contributions permanent public memory.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "Cincinnati produced Bootsy Collins, whose bass innovations with James Brown and Parliament-Funkadelic defined funk music globally — the city's Black musical legacy is vastly underappreciated relative to its actual influence on American popular music.",
  },
  {
    name: "Nolia Kitchen Cincinnati",
    description: "A Cincinnati acclaimed restaurant in Over-the-Rhine by Chef Jeff Harris — serving exquisite Southern comfort food inspired by New Orleans in a vibrant, welcoming setting that honors the African American culinary tradition of transforming humble ingredients into celebrated cuisine.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nolia Kitchen's New Orleans inspiration in Cincinnati connects two great American cities shaped by the Mississippi River system — both cities have African American communities whose culinary traditions were formed in the same cultural geography.",
  },
  {
    name: "blaCk Coffee Lounge Cincinnati",
    description: "A Cincinnati Black-owned coffee shop and community space in downtown — decked with Black art, hosting lectures and live music, creating a multifaceted community gathering place that is simultaneously a cafe, gallery, and cultural venue.",
    category: "cafe", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "BlaCk Coffee Lounge's combination of specialty coffee, Black art, and live programming reflects the tradition of Black cultural spaces that serve multiple community functions simultaneously — the cafe as salon, gallery, and performance space.",
  },
  {
    name: "Tome Books and Novelteas Cincinnati",
    description: "A Cincinnati Black-owned bookstore and tea shop — combining the intellectual nourishment of carefully curated books with the comfort of tea ceremony culture in a unique dual-concept space celebrating Black entrepreneurial creativity.",
    category: "bookstore", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "The bookstore-and-tea-shop combination honors two of the world's great intellectual traditions — the library/bookshop as a place of learning and the tea ceremony as a practice of mindful presence. Together they create a space for slow, intentional cultural engagement.",
  },
  {
    name: "Esoteric Brewing Cincinnati",
    description: "A Cincinnati minority-owned craft brewery in Walnut Hills in a historic building — bringing craft beer culture to a historically Black neighborhood while maintaining commitment to community and diversity in an industry historically dominated by white male ownership.",
    category: "retail", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Craft brewing is one of the most rapidly diversifying sectors of American food and beverage — Esoteric Brewing's presence in Walnut Hills connects the neighborhood's African American heritage to the contemporary craft beer movement.",
  },

  // ════════════════════════════════════════════════════════════════════
  // ST. LOUIS MO — businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "SweetArt Bakery St. Louis",
    description: "A St. Louis Black-owned bakery and cafe offering artisan pastries, cakes, and comfort food — a creative business celebrating Black baking excellence and community gathering in St. Louis's resurgent neighborhood food scene.",
    category: "bakery", ethnic_community: "Black / African American",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "St. Louis's Black culinary tradition is shaped by the Great Migration — families who moved from the Mississippi Delta and Deep South brought their food traditions north, creating the unique St. Louis soul food and BBQ style.",
  },
  {
    name: "Balkan Treat Box St. Louis",
    description: "A St. Louis Bosnian-owned restaurant serving traditional Bosnian and Balkan cuisine — celebrating the culinary heritage of the Bosnian community that settled in St. Louis after the 1990s Balkan Wars, making the city home to the largest Bosnian diaspora outside Europe.",
    category: "restaurant", ethnic_community: "Bosnian / Balkan",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "St. Louis has the largest Bosnian diaspora community outside Europe — refugees who arrived after the Balkan Wars of the 1990s built a thriving community in the Bevo neighborhood. Balkan Treat Box's food is both cultural preservation and cultural celebration.",
  },
  {
    name: "King and I Thai Cuisine St. Louis",
    description: "A St. Louis Thai-owned restaurant serving traditional Thai cuisine — a long-standing institution celebrating Thai culinary traditions in the Gateway City, offering authentic Thai cooking to a diverse St. Louis community.",
    category: "restaurant", ethnic_community: "Thai",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Thai cuisine's balance of sweet, sour, salty, spicy, and umami reflects one of the world's most sophisticated culinary philosophies. King and I Thai has brought this balanced culinary tradition to St. Louis for decades.",
  },
  {
    name: "Eat Today East African Cuisine St. Louis",
    description: "A St. Louis East African restaurant serving Ethiopian and Somali cuisine — representing St. Louis's growing East African diaspora community through authentic dishes that maintain cultural traditions in the Midwest.",
    category: "restaurant", ethnic_community: "Ethiopian / Somali",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "St. Louis's East African community has grown significantly in recent decades — Eat Today brings the communal dining traditions of the Horn of Africa to the Gateway City, connecting St. Louis to a culinary heritage thousands of miles away.",
  },
  {
    name: "Havana's Cuisine St. Louis",
    description: "A St. Louis Cuban restaurant celebrating Cuban culinary heritage — offering traditional Cuban dishes including ropa vieja, lechón asado, and Cuban sandwiches that honor the culinary traditions of the Cuban diaspora in the Midwest.",
    category: "restaurant", ethnic_community: "Cuban",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Cuban cuisine reflects 500 years of cultural exchange — Spanish, African, Caribbean, and American influences blended into a distinctive national cuisine. Havana's brings this rich culinary heritage to St. Louis's diverse food community.",
  },
  {
    name: "Left Bank Books St. Louis",
    description: "A St. Louis progressive independent bookstore in the heart of the Central West End — celebrating diverse voices in literature and community activism through curated books, author events, and a commitment to the communities that have historically been excluded from mainstream publishing.",
    category: "bookstore",
    city: "St. Louis", state: "MO",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Independent bookstores are anchors of neighborhood cultural life — Left Bank Books has maintained a community space for progressive literature and diverse voices in St. Louis for decades, making it a cultural institution as much as a retail establishment.",
  },

  // ════════════════════════════════════════════════════════════════════
  // LAS VEGAS NV — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Moulin Rouge Hotel Las Vegas",
    description: "A Las Vegas landmark as the first racially integrated hotel-casino in Nevada — opened in 1955, it was where Black entertainers like Nat King Cole and Sammy Davis Jr. could stay while performing for white audiences at segregated Strip casinos, and where the first integrated labor agreement was signed.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1955,
    visit_tip: "The Moulin Rouge allowed integration because it was in the Historic Westside, outside the Strip's jurisdiction — Black and white entertainers and gamblers mixed here in 1955, more than 10 years before the Civil Rights Act. The building is in disrepair but its history remains one of Las Vegas's most important civil rights stories.",
  },
  {
    name: "Historic Westside School Las Vegas",
    description: "A Las Vegas historic school that was the first school built in Clark County specifically for Black children during segregation — a landmark of both educational deprivation and Black community determination to educate their children despite systemic exclusion.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Historic Westside School represents the dual reality of segregation — while it was built because Black children were excluded from white schools, the community that built and taught at this school created an institution of genuine educational commitment.",
  },
  {
    name: "Berkley Square Las Vegas",
    description: "A Las Vegas historic neighborhood designed by pioneering Black architect Paul R. Williams in 1954 — the first subdivision in Nevada built specifically for the Black community, created by an architect who designed homes for Hollywood stars while being barred from living in many such neighborhoods himself.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    address: "D Street and Byass Avenue, Las Vegas, NV 89106",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1954,
    visit_tip: "Paul R. Williams — called 'Architect to the Stars' — designed Hollywood mansions and hotels while being unable to eat in many of the restaurants his clients patronized. Berkley Square is where he created homes for a community denied access to the neighborhoods he built for others.",
  },
  {
    name: "Filipino Town Cultural District Las Vegas",
    description: "A Las Vegas officially designated Filipino cultural district on Maryland Parkway — a 1.2-mile corridor designated in 2025 anchored by the Boulevard Mall and Seafood City, celebrating the thriving Filipino community that is the fastest-growing Asian community in Nevada.",
    category: "landmark", ethnic_community: "Filipino",
    city: "Las Vegas", state: "NV",
    address: "Maryland Parkway between Flamingo and Desert Inn Rd, Las Vegas, NV",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 2025,
    visit_tip: "Nevada's Filipino population is the fastest-growing Asian community in the state — the official designation of Filipino Town recognizes how this community has transformed a commercial corridor into a cultural district. The designation is both recognition and protection.",
  },
  {
    name: "Left of Center Art Gallery Las Vegas",
    description: "A North Las Vegas art gallery and studio directed by Vicki Richardson — offering a spectrum of arts and culture experiences including the Museum Collection of African Art, murals, and sculptures celebrating diverse artists and African diaspora cultural heritage.",
    category: "arts_culture", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    address: "2207 W Gowan Rd, North Las Vegas, NV 89032",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "In a city defined by commercial entertainment, Left of Center Art Gallery represents the authentic cultural life of Las Vegas's Black community — the African art collection connects Las Vegas's diaspora community to the continent's artistic traditions.",
  },
  {
    name: "Seafood City Las Vegas",
    description: "A Las Vegas Filipino supermarket in Filipino Town serving the community with Philippines-based chains Jollibee and Red Ribbon Bakeshop — functioning as the cultural center of Filipino Las Vegas, providing food, community, and cultural connection while doubling as a polling place.",
    category: "market", ethnic_community: "Filipino",
    city: "Las Vegas", state: "NV",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Seafood City's role as both supermarket and community gathering place — hosting Philippine Independence Day celebrations and serving as a polling place — reflects how Filipino American institutions create complete cultural ecosystems in diaspora communities.",
  },
  {
    name: "Nigerian Cuisine by MJ Las Vegas",
    description: "A Las Vegas West African restaurant on Maryland Parkway serving sit-down Nigerian cuisine — featuring rice dishes, meat stews, plantains, and yams that represent the bold, complex flavors of Nigerian cooking for Las Vegas's growing West African community.",
    category: "restaurant", ethnic_community: "Nigerian / West African",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nigerian cuisine — with its complex pepper-based stews, fermented locust beans, and diverse use of proteins from dried fish to goat — is one of the world's most underrepresented great cuisines. Nigerian Cuisine by MJ makes these traditions visible in Las Vegas.",
  },
  {
    name: "Calabash African Kitchen Las Vegas",
    description: "A Las Vegas Senegambian restaurant in East Las Vegas — owned by Oulay Ceesay Fisher, bringing Senegalese and Gambian food featuring authentic dishes like Oxtail Stew and Jollof Rice to Nevada for the city's West African community.",
    category: "restaurant", ethnic_community: "Senegalese / Gambian",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Senegambian cuisine — from Senegal and Gambia — is built around thieboudienne (fish and rice) and yassa (citrus-marinated chicken) that reflect the coastal and agricultural traditions of this West African subregion. Calabash African Kitchen brings these traditions to Las Vegas.",
  },
  {
    name: "Echo Vinyl Lounge Las Vegas",
    description: "A Las Vegas bar and vinyl listening lounge in Downtown curated by Chef Natalie Young — serving bold small plates like caviar truffle chips paired with expertly crafted cocktails in a nostalgic atmosphere of curated vinyl records celebrating Black music culture.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The vinyl record listening bar concept honors the history of Black music through physical media — at a time when streaming has made music disposable, Echo creates space to hear music the way it was meant to be heard: intentionally, communally, and with attention.",
  },
  {
    name: "Simply Pure Las Vegas",
    description: "A Las Vegas vegan restaurant and food truck in Downtown's Container Park — where Chef Stacey Dougan offers premium plant-based dishes that nourish body, mind, and soul, including vegan ramen bowls and 'crab cake' sliders.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Simply Pure represents the growing Black vegan movement that reclaims African American health through plant-based eating — rooted in the awareness that traditional Black diets were plant-forward before the industrial food system introduced processed foods.",
  },
  {
    name: "Classic Jewel Cocktail Lounge Las Vegas",
    description: "A Las Vegas swanky cocktail lounge in Downtown founded by Black entrepreneurs — celebrating the cocktail hour 1950s style with plush seating, delightful drinks, and a menu that honors the golden age of Black nightlife and social elegance.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Classic Jewel pays homage to the era of Black social sophistication — the supper clubs, lounges, and jazz venues where Black Americans created spaces of elegance and joy despite the surrounding racism. The 1950s aesthetic honors this cultural legacy.",
  },
  {
    name: "Lucy Ethiopian Restaurant Las Vegas",
    description: "A Las Vegas Ethiopian restaurant in West Las Vegas serving authentic home-cooked Ethiopian food — offering traditional dishes at accessible prices in a pleasant setting that makes Ethiopian cuisine approachable for all of Las Vegas's diverse community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Las Vegas's Ethiopian restaurant scene is an underappreciated window into the city's immigrant communities — beyond the Strip's spectacle, restaurants like Lucy serve the everyday needs of the diaspora communities that make Las Vegas function.",
  },
  {
    name: "Casa Don Juan Las Vegas",
    description: "A Las Vegas beloved family-owned Mexican restaurant in Downtown's Arts District — offering authentic Mexican cuisine and a vibrant atmosphere that celebrates Mexican culture and heritage for the Mexican-American community in the Nevada desert.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nevada's connection to Mexico predates the United States — the state's Spanish colonial history makes Mexican culture not an immigrant addition but a foundational layer. Casa Don Juan honors this deep cultural presence in the arts district.",
  },

  // ════════════════════════════════════════════════════════════════════
  // SEATTLE WA — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Northwest African American Museum Seattle",
    description: "A Seattle museum in a historic school building in the Central District — dedicated to preserving the connections between the Pacific Northwest and people of African descent, telling the unique story of Black life in the Pacific Northwest from early pioneers to present.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Seattle", state: "WA",
    address: "2300 S Massachusetts St, Seattle, WA 98144",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Seattle's Central District was home to Quincy Jones and Jimi Hendrix — the NAAM tells the story of a neighborhood that produced two of the 20th century's most influential musicians, both shaped by the tight-knit Black community of the C.D. before gentrification.",
  },
  {
    name: "Wing Luke Museum Seattle",
    description: "A Seattle Smithsonian-affiliated museum in the International District focusing on Asian Pacific American culture, art, and history — using community-curated exhibits and neighborhood tours to tell the stories of Asian immigrants who built Seattle despite exclusion and internment.",
    category: "museum", ethnic_community: "Asian Pacific American",
    city: "Seattle", state: "WA",
    address: "719 S King St, Seattle, WA 98104",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "Wing Luke's community-curated model — where the communities themselves define what stories are told and how — makes it one of the most authentic ethnic heritage museums in America. The Filipino Hotel exhibit and the Japanese internment exhibits are particularly powerful.",
  },
  {
    name: "Jimi Hendrix Park Seattle",
    description: "A Seattle park dedicated to the legendary guitarist who was born and raised in the Central District — featuring artistic installations inspired by his music and celebrating one of the most influential musicians in history, a Black man from Seattle's historic Black neighborhood.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Seattle", state: "WA",
    address: "2400 S Massachusetts St, Seattle, WA 98144",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "Jimi Hendrix grew up blocks from this park in Seattle's Central District — the same neighborhood where Quincy Jones grew up. The C.D.'s rich Black cultural environment produced two transformative artists. The park's proximity to NAAM creates a cultural district honoring this legacy.",
  },
  {
    name: "Seattle Chinatown International District",
    description: "A Seattle historic neighborhood that has been the cultural hub for Chinese, Japanese, Filipino, and Vietnamese communities since the late 19th century — uniquely encompassing multiple Asian communities in a single pan-Asian neighborhood with distinct sub-areas.",
    category: "landmark", ethnic_community: "Asian Pacific American",
    city: "Seattle", state: "WA",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The International District's unique pan-Asian character — where Chinese, Japanese, Filipino, and Vietnamese communities share a neighborhood — reflects the history of exclusion that pushed all Asian groups into the same restricted geographic area, creating unexpected solidarity.",
  },
  {
    name: "Kubota Garden Seattle",
    description: "A Seattle stunning 20-acre Japanese garden created by Fujitaro Kubota beginning in 1928 — blending Japanese landscaping with native Northwest plants, maintained by Kubota even during his family's internment during World War II, a testament to resilience and the persistence of beauty.",
    category: "landmark", ethnic_community: "Japanese American",
    city: "Seattle", state: "WA",
    address: "9817 55th Ave S, Seattle, WA 98118",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1928,
    admission_free: true,
    is_family_friendly: true,
    visit_tip: "Kubota maintained his garden in his mind during internment and returned to tend it after — the garden is a living monument to the Japanese American determination that racism would not destroy what they had built. Every spring cherry blossom is an act of cultural persistence.",
  },
  {
    name: "Communion Restaurant Seattle",
    description: "A Seattle celebrated soul food restaurant in the Central District by Chef Kristi Brown — honoring the culinary traditions of the C.D. and the Black diaspora through elevated soul food in a neighborhood fighting to maintain its cultural identity against gentrification.",
    category: "restaurant", ethnic_community: "Black / African American",
    city: "Seattle", state: "WA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Communion's name evokes the religious and communal traditions of the Black church, where shared eating is sacred. Chef Kristi Brown's elevated soul food honors the C.D.'s Black culinary heritage at a moment when gentrification threatens to erase the community that created it.",
  },
  {
    name: "Amy's Merkato Seattle",
    description: "A Seattle long-standing Ethiopian and Eritrean restaurant and market in Hillman City/Rainier Valley — owned by Filli Abdulkadir and Yodit Seyoum, offering authentic cuisine, spices, and injera to the large East African community in South Seattle.",
    category: "restaurant", ethnic_community: "Ethiopian / Eritrean",
    city: "Seattle", state: "WA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "South Seattle's Rainier Valley has one of the largest East African communities on the West Coast — Amy's Merkato serves as both restaurant and market, providing the ingredients and prepared foods that allow Ethiopian and Eritrean families to maintain their food traditions.",
  },
  {
    name: "Ahadu Coffee Shop Seattle",
    description: "A Seattle Ethiopian-owned coffee shop in Pinehurst that roasts its own beans and serves traditional Ethiopian coffee — acting as a community hub for the local East African community while bringing Ethiopian coffee culture to Seattle's specialty coffee scene.",
    category: "cafe", ethnic_community: "Ethiopian",
    city: "Seattle", state: "WA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Ethiopian coffee ceremony — the three-round coffee ritual with frankincense and ceremony — is the birthplace of the global coffee culture. Ahadu brings Seattle's specialty coffee obsession back to its African origins through authentic Ethiopian roasting and brewing traditions.",
  },
  {
    name: "Uwajimaya Asian Grocery Seattle",
    description: "A Seattle historic Asian supermarket in the Chinatown-International District since 1928 — a family-owned institution that has grown from a small fish cake shop into a major Asian supermarket, serving multiple Asian communities for nearly a century.",
    category: "market", ethnic_community: "Asian Pacific American / Japanese",
    city: "Seattle", state: "WA",
    address: "600 5th Ave S, Seattle, WA 98104",
    pin_type: "business_retail", listing_status: "staged",
    year_established: 1928,
    visit_tip: "Uwajimaya has served Seattle's Asian communities through the internment era, the Vietnam War refugee resettlement, and the growth of pan-Asian immigration — nearly 100 years of Asian American entrepreneurship concentrated in a single family-owned business.",
  },
  {
    name: "Hood Famous Cafe Seattle",
    description: "A Seattle Filipino American cafe in the Chinatown-International District known for its ube cheesecake and Filipino-inspired pastries — bringing Filipino flavors, particularly the beloved purple yam (ube), into mainstream Seattle food culture.",
    category: "cafe", ethnic_community: "Filipino American",
    city: "Seattle", state: "WA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Ube — the Philippine purple yam — has become a global food trend, but Hood Famous was celebrating it before it was trendy. The bright purple color and subtly sweet flavor of ube represent Filipino baking traditions that Hood Famous has introduced to Seattle and beyond.",
  },
  {
    name: "Pam's Kitchen Seattle",
    description: "A Seattle beloved Trinidadian Caribbean restaurant in Wallingford known for its roti and curries — bringing authentic Trinidad and Caribbean flavors to the Pacific Northwest for a community that has traveled far from island home.",
    category: "restaurant", ethnic_community: "Caribbean / Trinidadian",
    city: "Seattle", state: "WA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Trinidadian roti — the soft flatbread that serves as both edible plate and utensil for curries — reflects the East Indian indentured labor that followed slavery in Trinidad. The dish represents the complex cultural layering of Caribbean identity.",
  },
  {
    name: "Off the Rez Native Foods Seattle",
    description: "A Seattle Indigenous-owned cafe in the University District at the Burke Museum — the first Native food truck turned cafe in Seattle, offering traditional and contemporary Indigenous cuisine including frybread tacos, celebrating and reclaiming Indigenous culinary identity.",
    category: "cafe", ethnic_community: "Indigenous / Native American",
    city: "Seattle", state: "WA",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Frybread — the deep-fried dough that has become an iconic Native American food — was created out of necessity when reservation rations provided flour, salt, and lard but nothing else. Off the Rez honors this food while acknowledging its complex history as a food of both survival and cultural celebration.",
  },

  // ════════════════════════════════════════════════════════════════════
  // PORTLAND OR — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Billy Webb Elks Lodge Portland",
    description: "A Portland historic African American lodge in Albina that served as a civil rights gathering place and NAACP headquarters during segregation — one of the few spaces where Black residents could socialize and organize in a city with some of the most restrictive racial covenants in the country.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Portland", state: "OR",
    address: "6 N Tillamook St, Portland, OR 97227",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Oregon was the only state admitted to the Union with an exclusion law banning Black residents — yet Black Portlanders built community in Albina anyway. The Billy Webb Elks Lodge was their organizing center, proving that community persists even against legal suppression.",
  },
  {
    name: "Denorval Unthank City Park Portland",
    description: "A Portland park named for Dr. DeNorval Unthank — a pioneering Black physician and civil rights leader who served the Black community when white doctors refused to treat them and fought against housing discrimination in one of America's most racially restricted cities.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Portland", state: "OR",
    address: "510 N Shaver St, Portland, OR 97227",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "Dr. Unthank's story represents the impossible position of Black professionals in mid-20th century Portland — qualified and dedicated, serving a community that needed him desperately, while facing discrimination that would have destroyed lesser people. His park honors that perseverance.",
  },
  {
    name: "Japanese American Historical Plaza Portland",
    description: "A Portland memorial plaza along the waterfront dedicated to Japanese Americans in Oregon — particularly those interned during World War II, featuring poetry stones with haiku written by internees that give voice to the community's experience of state-sponsored racism.",
    category: "landmark", ethnic_community: "Japanese American",
    city: "Portland", state: "OR",
    address: "NW Naito Pkwy and NW Couch St, Portland, OR 97209",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "The haiku stones at the Japanese American Historical Plaza were written by Oregonians who were stripped of their property, businesses, and rights and imprisoned in internment camps. Reading their poetry is an act of witness — they condensed immense suffering into seventeen syllables.",
  },
  {
    name: "Portland Indigenous Marketplace",
    description: "A Portland barrier-free marketplace supporting Indigenous artists and entrepreneurs — a rotating marketplace creating economic opportunity for Native American artisans while educating the broader community about Indigenous artistic traditions and contemporary Native creativity.",
    category: "cultural_organization", ethnic_community: "Indigenous / Native American",
    city: "Portland", state: "OR",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "Portland sits on the traditional lands of the Chinook and Multnomah peoples — the Indigenous Marketplace honors the living cultures of these and other Native American nations by creating economic space for Indigenous artists in the city built on their land.",
  },
  {
    name: "Above Grnd Coffee Portland",
    description: "A Portland Somali-owned late night coffee shop in Old Town — created by three second-generation Somali immigrants to build community, representing the second generation's creative entrepreneurship that honors their heritage while reflecting their American identity.",
    category: "cafe", ethnic_community: "Somali",
    city: "Portland", state: "OR",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "Above Grnd is Portland's first Somali-owned coffee shop — and the second generation's choice to open a coffee shop reflects their dual identity as Somali Americans who have made the Pacific Northwest's coffee culture their own while maintaining Somali community values.",
  },
  {
    name: "Kismayo Restaurant Portland",
    description: "A Portland Somali restaurant in Southwest where six sisters serve family recipes recreating a Somali living room — an intimate dining experience reflecting the Somali tradition of generous hospitality and communal eating that makes family the center of social life.",
    category: "restaurant", ethnic_community: "Somali",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Kismayo is a coastal city in southern Somalia — the restaurant named for it honors the specific regional culinary tradition of the sisters' hometown while creating a space of Somali hospitality in Portland.",
  },
  {
    name: "Bison Coffeehouse Portland",
    description: "A Portland Native-owned coffeehouse in Cully — the only Indigenous-owned coffeehouse in Portland, serving as a community gathering space and featuring locally roasted beans, creating a welcoming space rooted in Native American hospitality.",
    category: "cafe", ethnic_community: "Indigenous / Native American",
    city: "Portland", state: "OR",
    pin_type: "business_cafe", listing_status: "staged",
    visit_tip: "The bison is a symbol of Indigenous cultural survival — nearly hunted to extinction alongside the suppression of Native culture, the bison's return parallels Indigenous cultural renaissance. Bison Coffeehouse carries this symbolism into everyday community gathering.",
  },
  {
    name: "Mis Tacones Portland",
    description: "A Portland queer, Latinx-owned vegan taqueria in Piedmont — providing a safe space for the LGBTQ+ and Latino communities while serving delicious plant-based Mexican food, celebrating the intersection of multiple marginalized identities through food and community.",
    category: "restaurant", ethnic_community: "Latino / Queer",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mis Tacones ('my high heels' in Spanish) embraces queer Latino identity through its name and concept — the vegan taqueria format makes Mexican culinary tradition accessible to a wide community while creating a genuinely safe space for LGBTQ+ and Latino people.",
  },
  {
    name: "Akati West African Restaurant Portland",
    description: "A Portland West African restaurant in Northeast serving dishes from Côte d'Ivoire — the restaurant's name means 'tasty' in Bambara, offering authentic flavors from the Ivory Coast and surrounding West African region to Portland's diverse community.",
    category: "restaurant", ethnic_community: "West African / Ivorian",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Ivorian cuisine — built around plantains, cassava, fish stew (kedjenou), and peanut sauce — reflects Côte d'Ivoire's agricultural abundance and diverse ethnic groups. Akati brings these traditions to Portland, connecting the Pacific Northwest to West Africa.",
  },
  {
    name: "Mama Pauline's African Market Portland",
    description: "A Portland West African grocery store and market in Northeast — a cultural lifeline for African immigrants providing the authentic ingredients, spices, and products needed to maintain culinary traditions and cultural connections far from home.",
    category: "market", ethnic_community: "West African",
    city: "Portland", state: "OR",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "African grocery stores are community cultural centers as much as retail spaces — Mama Pauline's stocks the specific ingredients that allow West African families to cook the dishes that connect them to home, community, and ancestral identity.",
  },
  {
    name: "La Arepa Food Cart Portland",
    description: "A Portland Venezuelan food cart in Southeast serving authentic Venezuelan arepas and street food — representing the growing South American diaspora in Portland's famous food cart culture, offering traditional corn cake sandwiches in the city's outdoor markets.",
    category: "restaurant", ethnic_community: "Venezuelan",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Portland's food cart culture has made immigrant street food central to the city's culinary identity — La Arepa's Venezuelan arepas in Portland's cart pods represent how food carts lower barriers for immigrant entrepreneurs to enter the food economy.",
  },
  {
    name: "Tap Tap Haitian Restaurant Portland",
    description: "A Portland Haitian restaurant bringing the vibrant flavors and culture of the Caribbean to the Pacific Northwest — celebrating Haitian culinary heritage through griot, pikliz, and the bold spice traditions of the Western Hemisphere's first Black republic.",
    category: "restaurant", ethnic_community: "Caribbean / Haitian",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Haiti's cuisine reflects its extraordinary history — the only nation founded by a successful slave revolution. Haitian food carries this defiance in its bold spices and resourceful cooking, transforming difficult circumstances into culinary excellence.",
  },

  // ════════════════════════════════════════════════════════════════════
  // LOS ANGELES CA — cultural sites and businesses
  // ════════════════════════════════════════════════════════════════════
  {
    name: "California African American Museum Los Angeles",
    description: "A Los Angeles museum in Exposition Park dedicated to the history, art, and culture of African Americans in California — free admission ensures the museum's collections documenting Black California history from early pioneers through the Great Migration are accessible to all.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Los Angeles", state: "CA",
    address: "600 State Dr, Los Angeles, CA 90037",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true, admission_free: true,
    visit_tip: "CAAM's free admission is a statement about accessibility — the museum's commitment to telling Black California history belongs to the community it celebrates, not just to those who can afford museum admission. The West Coast Black experience is distinct from the East Coast narrative and deserves its own institution.",
  },
  {
    name: "Leimert Park Village Plaza Los Angeles",
    description: "A Los Angeles cultural hub for African Americans — called the 'Black Greenwich Village' for its concentration of art galleries, performance spaces, jazz clubs, and Black-owned businesses, the plaza serves as a community gathering place for drum circles and cultural celebrations.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Los Angeles", state: "CA",
    address: "4395 Leimert Blvd, Los Angeles, CA 90008",
    pin_type: "cultural_site", listing_status: "staged",
    is_family_friendly: true, admission_free: true,
    visit_tip: "Leimert Park has maintained its Black cultural identity against enormous gentrification pressure — the weekend drum circles and community events are acts of cultural preservation as much as celebration. Visiting on a Sunday means encountering the living culture of Black LA.",
  },
  {
    name: "El Pueblo de Los Angeles Historical Monument",
    description: "A Los Angeles historic monument celebrating the city's founding by Native American, African, and Spanish peoples — the original 44 settlers of Los Angeles in 1781 included people of African, Indigenous, and mixed-race heritage, challenging the whitewashed narrative of the city's founding.",
    category: "landmark",
    city: "Los Angeles", state: "CA",
    address: "125 Paseo De La Plaza, Los Angeles, CA 90012",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true, admission_free: true,
    visit_tip: "The original 44 founders of Los Angeles were primarily of African and Indigenous ancestry — 26 of the 44 had African heritage. Olvera Street and the historic buildings preserve this multicultural origin story that has been systematically erased from popular Los Angeles history.",
  },
  {
    name: "Japanese American National Museum Los Angeles",
    description: "A Los Angeles museum in Little Tokyo dedicated to the history and culture of Japanese Americans — particularly the internment experience during World War II, serving both as memorial to injustice and celebration of Japanese American resilience.",
    category: "museum", ethnic_community: "Japanese American",
    city: "Los Angeles", state: "CA",
    address: "100 N Central Ave, Los Angeles, CA 90012",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The JANM's collection includes family photographs and personal items from internment camps — the humanity of these personal artifacts makes the abstract injustice of internment concrete and impossible to dismiss as distant history.",
  },
  {
    name: "Biddy Mason Memorial Park Los Angeles",
    description: "A Los Angeles mini-park honoring Bridget 'Biddy' Mason — a former enslaved woman who won her freedom in court, built a real estate empire, and became one of the wealthiest Black women in Los Angeles, using her wealth to found schools, churches, and charitable organizations.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Los Angeles", state: "CA",
    address: "333 S Spring St, Los Angeles, CA 90013",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "Biddy Mason walked behind her enslaver's wagon train from Mississippi to California, won her freedom in a California court in 1856, and built a real estate empire in what became downtown Los Angeles. The timeline wall in the park compresses this extraordinary life into a public monument.",
  },
  {
    name: "Watts Towers Los Angeles",
    description: "A Los Angeles collection of 17 interconnected sculptural towers in Watts built by Italian immigrant Simon Rodia over 33 years — now inseparable from the identity of the predominantly Black and Latino Watts community as a symbol of the artistic spirit that thrives even in underserved neighborhoods.",
    category: "landmark",
    city: "Los Angeles", state: "CA",
    address: "1765 E 107th St, Los Angeles, CA 90002",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: false,
    visit_tip: "Though built by an Italian immigrant, the Watts Towers have been claimed by the Black and Latino community as their own — a symbol of creativity and resilience in an area devastated by the 1965 uprising. The community's claiming of this art as their own is itself a cultural act.",
  },
  {
    name: "LA Plaza de Cultura y Artes Los Angeles",
    description: "A Los Angeles museum and cultural center in the historic center celebrating the Latinx history and culture of Los Angeles — telling the story of Mexican and Latino communities through immersive exhibits, oral histories, and cultural programming.",
    category: "museum", ethnic_community: "Latino / Mexican American",
    city: "Los Angeles", state: "CA",
    address: "501 N Main St, Los Angeles, CA 90012",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "LA Plaza sits blocks from where the original Pueblo de Los Angeles was founded — the museum connects the living Latinx culture of modern Los Angeles to the deep Mexican and Indigenous roots of the city's founding, creating a 250-year narrative of Latino presence in California.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CHARLESTON SC — additional
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Ko Cha Korean Restaurant Charleston",
    description: "A Charleston Korean restaurant in West Ashley serving authentic Korean cuisine — often considered a hidden gem, offering traditional Korean dishes including the bold, fermented, and grilled flavors that define Korean food culture.",
    category: "restaurant", ethnic_community: "Korean",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Korean cuisine's emphasis on fermented foods — kimchi, doenjang, gochujang — reflects a centuries-old food preservation tradition that also happens to produce some of the world's most probiotic-rich and complex flavors.",
  },
  {
    name: "Mazal Mediterranean Street Food Charleston",
    description: "A Charleston Middle Eastern and Mediterranean street food restaurant in West Ashley — offering fresh, flavorful dishes that bring the accessible street food traditions of the Mediterranean to the South Carolina Lowcountry.",
    category: "restaurant", ethnic_community: "Middle Eastern / Mediterranean",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Mediterranean street food — falafel, shawarma, mezze — represents a culinary philosophy of fresh ingredients, bold spices, and accessible hospitality that has made these foods beloved worldwide. Mazal brings this tradition to Charleston.",
  },

  // ════════════════════════════════════════════════════════════════════
  // COLUMBUS OH — additional
  // ════════════════════════════════════════════════════════════════════
  {
    name: "National Afro-American Museum Columbus",
    description: "A museum near Columbus in Wilberforce — home to one of the nation's largest collections of African American materials with over 10,000 artifacts and artworks, providing a comprehensive look at the African American experience through centuries of Black life in America.",
    category: "museum", ethnic_community: "Black / African American",
    city: "Columbus", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    is_accessible: true, is_family_friendly: true,
    visit_tip: "The National Afro-American Museum's collection of over 10,000 artifacts represents the full depth of African American material culture — objects that document everyday life, resistance, creativity, and achievement across four centuries of Black American history.",
  },
  {
    name: "Lincoln Theatre Columbus",
    description: "A Columbus historic theatre in the King-Lincoln Bronzeville neighborhood that was a center of cultural and commercial life for the African American community in the mid-20th century — having hosted legendary performers during the segregation era when it served as the entertainment anchor of Columbus's Black community.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Columbus", state: "OH",
    pin_type: "cultural_site", listing_status: "staged",
    visit_tip: "The Lincoln Theatre's survival as a cultural anchor in Columbus's historically Black Bronzeville neighborhood represents the community's commitment to preserving the spaces that sustained their cultural life during segregation.",
  },

  // ════════════════════════════════════════════════════════════════════
  // CINCINNATI OH — additional
  // ════════════════════════════════════════════════════════════════════
  {
    name: "Allen Temple AME Church Cincinnati",
    description: "A Cincinnati historic church — the oldest operating African American church in the Cincinnati area, founded in 1824, providing nearly 200 years of spiritual home and community anchor for Black Cincinnati through slavery, the Civil War, the Great Migration, and the present.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    address: "7080 Reading Road, Cincinnati, OH 45237",
    pin_type: "cultural_site", listing_status: "staged",
    year_established: 1824,
    visit_tip: "Founded two years before the Erie Canal transformed American commerce, Allen Temple AME has witnessed 200 years of Black Cincinnati history — from the antebellum era when Cincinnati sat on the border with slavery to the present. Its 200-year continuity is itself a statement of Black institutional resilience.",
  },
  {
    name: "Ezzard Charles Statue Cincinnati",
    description: "A Cincinnati bronze statue in the West End commemorating Heavyweight Champion Ezzard Charles — a world champion who grew up in Cincinnati's West End and remained rooted in his community, representing the tradition of Black athletic excellence connected to neighborhood identity.",
    category: "landmark", ethnic_community: "Black / African American",
    city: "Cincinnati", state: "OH",
    address: "500 Ezzard Charles Drive, Cincinnati, OH 45214",
    pin_type: "cultural_site", listing_status: "staged",
    admission_free: true,
    visit_tip: "Ezzard Charles defeated Joe Louis to claim the heavyweight title in 1949 — one of the greatest victories in boxing history. His statue in the West End honors not just his athletic achievement but his identity as a neighborhood man who never forgot where he came from.",
  },
];

// ─── City center resolution ───────────────────────────────────────────────────
function resolveCity(e: Entity): { lat: number; lng: number; approx: boolean } {
  const key = `${e.city} ${e.state}`;
  const c = CITY_CENTERS[key];
  if (c) return { lat: c.lat, lng: c.lng, approx: true };
  return { lat: 0, lng: 0, approx: true };
}

// ─── Exported seeder (used by admin endpoint) ─────────────────────────────────
export interface PoolLike2 {
  query(sql: string, params?: unknown[]): Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>;
}

export async function seedManusEntitiesPass2(
  p: PoolLike2,
  opts: { dryRun?: boolean } = {}
): Promise<{ inserted: number; updated: number; errors: number; total: number }> {
  if (opts.dryRun) {
    return { inserted: 0, updated: 0, errors: 0, total: GUIDE_ENTITIES_PASS2.length };
  }
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const entity of GUIDE_ENTITIES_PASS2) {
    const { lat, lng, approx } = resolveCity(entity);
    const approxFinal = approx || entity.address === undefined;
    try {
      const existingRes = await p.query(
        `SELECT id FROM cultural_sites WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) LIMIT 1`,
        [entity.name, entity.city]
      );
      if (existingRes.rowCount && existingRes.rowCount > 0) {
        await p.query(
          `UPDATE cultural_sites SET
            description = COALESCE(NULLIF($1,''), description),
            category = COALESCE($2, category),
            heritage_category = COALESCE($3, heritage_category),
            ethnic_community = COALESCE($4, ethnic_community),
            address = COALESCE($5, address),
            latitude = COALESCE($6, latitude),
            longitude = COALESCE($7, longitude),
            pin_type = $8,
            visit_tip = COALESCE($9, visit_tip),
            listing_status = $10,
            data_source = 'manus_tour_guide_pass_2',
            approximate_location = $11,
            content_note = COALESCE($12, content_note),
            practical_tips = COALESCE($13, practical_tips)
           WHERE LOWER(name) = LOWER($14) AND LOWER(city) = LOWER($15)`,
          [
            entity.description, entity.category, entity.heritage_category ?? null,
            entity.ethnic_community ?? null, entity.address ?? null, lat, lng,
            entity.pin_type, entity.visit_tip ?? null, entity.listing_status,
            approxFinal,
            entity.content_note ?? null, entity.practical_tips ?? null,
            entity.name, entity.city,
          ]
        );
        updated++;
      } else {
        await p.query(
          `INSERT INTO cultural_sites (
            name, description, category, heritage_category, subcategory,
            ethnic_community, city, state, address, latitude, longitude,
            era, significance, is_verified, year_established,
            is_accessible, is_family_friendly, admission_free,
            pin_type, visit_tip, listing_status, data_source, approximate_location,
            content_note, practical_tips,
            country, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,$14,$15,$16,$17,$18,$19,$20,'manus_tour_guide_pass_2',$21,$22,$23,'US',NOW())`,
          [
            entity.name, entity.description, entity.category,
            entity.heritage_category ?? null, entity.subcategory ?? null,
            entity.ethnic_community ?? null, entity.city, entity.state,
            entity.address ?? null, lat, lng,
            entity.era ?? null, entity.significance ?? null,
            entity.year_established ?? null,
            entity.is_accessible ?? true, entity.is_family_friendly ?? true,
            entity.admission_free ?? null,
            entity.pin_type, entity.visit_tip ?? null,
            entity.listing_status, approxFinal,
            entity.content_note ?? null, entity.practical_tips ?? null,
          ]
        );
        inserted++;
      }
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Pass-2 seed error on "${entity.name}" (${entity.city}): ${msg}`);
    }
  }
  return { inserted, updated, errors, total: inserted + updated };
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────
async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  console.log(`\n🌍 Manus Pass-2 Seeder — ${GUIDE_ENTITIES_PASS2.length} entities\n`);
  let ins = 0; let upd = 0; let err = 0;
  for (const entity of GUIDE_ENTITIES_PASS2) {
    const { lat, lng, approx } = resolveCity(entity);
    const approxFinal = approx || entity.address === undefined;
    try {
      const r = await pool.query(
        `SELECT id FROM cultural_sites WHERE LOWER(name)=LOWER($1) AND LOWER(city)=LOWER($2) LIMIT 1`,
        [entity.name, entity.city]
      );
      if (r.rowCount && r.rowCount > 0) {
        await pool.query(
          `UPDATE cultural_sites SET description=COALESCE(NULLIF($1,''),description),category=COALESCE($2,category),heritage_category=COALESCE($3,heritage_category),ethnic_community=COALESCE($4,ethnic_community),address=COALESCE($5,address),latitude=COALESCE($6,latitude),longitude=COALESCE($7,longitude),pin_type=$8,visit_tip=COALESCE($9,visit_tip),listing_status=$10,data_source='manus_tour_guide_pass_2',approximate_location=$11,content_note=COALESCE($12,content_note),practical_tips=COALESCE($13,practical_tips) WHERE LOWER(name)=LOWER($14) AND LOWER(city)=LOWER($15)`,
          [entity.description,entity.category,entity.heritage_category??null,entity.ethnic_community??null,entity.address??null,lat,lng,entity.pin_type,entity.visit_tip??null,entity.listing_status,approxFinal,entity.content_note??null,entity.practical_tips??null,entity.name,entity.city]
        );
        upd++; process.stdout.write("u");
      } else {
        await pool.query(
          `INSERT INTO cultural_sites(name,description,category,heritage_category,subcategory,ethnic_community,city,state,address,latitude,longitude,era,significance,is_verified,year_established,is_accessible,is_family_friendly,admission_free,pin_type,visit_tip,listing_status,data_source,approximate_location,content_note,practical_tips,country,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,$14,$15,$16,$17,$18,$19,$20,'manus_tour_guide_pass_2',$21,$22,$23,'US',NOW())`,
          [entity.name,entity.description,entity.category,entity.heritage_category??null,entity.subcategory??null,entity.ethnic_community??null,entity.city,entity.state,entity.address??null,lat,lng,entity.era??null,entity.significance??null,entity.year_established??null,entity.is_accessible??true,entity.is_family_friendly??true,entity.admission_free??null,entity.pin_type,entity.visit_tip??null,entity.listing_status,approxFinal,entity.content_note??null,entity.practical_tips??null]
        );
        ins++; process.stdout.write(".");
      }
    } catch (e: unknown) {
      err++; process.stdout.write("E");
      console.error(`\n❌ "${entity.name}" (${entity.city}): ${e instanceof Error ? e.message : e}`);
    }
  }
  console.log(`\n\n✅ Done.\n   Inserted: ${ins}  Updated: ${upd}  Errors: ${err}  Total: ${ins+upd}`);
  await pool.end();
}

main().catch(e => { console.error("Fatal:", e); process.exit(1); });
