/**
 * Seed script: MWM East Coast Tour Cultural Guide — Businesses
 *
 * Sources: Part 1 (Philly, DC, Richmond, Raleigh/Durham, Charlotte) and
 *          Part 2 (Columbia SC, Atlanta, Montgomery, Birmingham, Mobile,
 *                  Baton Rouge, New Orleans, Houston + satellite cities)
 *
 * RULE: launchEnabled = false for Asian & Pacific Islander-owned businesses.
 *       All other diaspora communities: launchEnabled = true.
 *       Run with:  pnpm tsx artifacts/api-server/src/scripts/seed-tour-guide.ts
 */

import { pool } from "@workspace/db";

interface BizRow {
  name: string;
  businessType: string;
  diasporaCommunity: string;
  city: string;
  state: string;
  cityType: "full_feature" | "satellite";
  parentHubCity?: string;
  neighborhood?: string;
  address?: string;
  description: string;
  launchEnabled: boolean;
}

// Helper to flag a community
function isAsianPI(community: string): boolean {
  const lower = community.toLowerCase();
  return (
    lower.includes("vietnamese") ||
    lower.includes("filipino") ||
    lower.includes("korean") ||
    lower.includes("chinese") ||
    lower.includes("japanese") ||
    lower.includes("taiwanese") ||
    lower.includes("thai") ||
    lower.includes("malaysian") ||
    lower.includes("cambodian") ||
    lower.includes("laotian") ||
    lower.includes("indian") ||
    lower.includes("south asian") ||
    lower.includes("pan-asian") ||
    lower.includes("asian-owned") ||
    lower.includes("asian/") ||
    lower.includes("/asian") ||
    lower.includes("asian fusion") ||
    (lower.includes("asian") && !lower.includes("middle eastern")) ||
    lower.includes("pacific islander")
  );
}

function biz(
  name: string,
  businessType: string,
  diasporaCommunity: string,
  city: string,
  state: string,
  cityType: "full_feature" | "satellite",
  neighborhood: string,
  address: string,
  description: string,
  parentHubCity?: string
): BizRow {
  return {
    name,
    businessType,
    diasporaCommunity,
    city,
    state,
    cityType,
    parentHubCity,
    neighborhood,
    address,
    description,
    launchEnabled: !isAsianPI(diasporaCommunity),
  };
}

const BUSINESSES: BizRow[] = [
  // ============================================================
  // PHILADELPHIA, PA — Full Feature
  // ============================================================
  biz("Hakim's Bookstore & Gift Shop", "Bookstore", "Black-owned", "Philadelphia", "PA", "full_feature",
    "West Philadelphia", "210 S 52nd St, Philadelphia, PA 19139",
    "One of the oldest Black-owned bookstores in the country, specializing in African American studies, history, philosophy, and children's books. A community pillar for 60+ years supporting incarcerated readers."),

  biz("Kilimandjaro Restaurant", "Restaurant", "Senegalese-owned", "Philadelphia", "PA", "full_feature",
    "West Philadelphia", "4317 Chestnut St, Philadelphia, PA 19104",
    "The first restaurant in Philadelphia to specialize in Senegalese foods. Renowned for dibi (roasted meat), grilled fish, and fried plantains. An authentic taste of Senegal in a welcoming atmosphere."),

  biz("Abyssinia Ethiopian Restaurant", "Restaurant", "Ethiopian-owned", "Philadelphia", "PA", "full_feature",
    "West Philadelphia", "229 S 45th St, Philadelphia, PA 19104",
    "Beloved spot serving traditional Ethiopian cuisine with flavorful stews and injera in a cozy, unpretentious setting. The communal dining experience is visually appealing and culturally rich."),

  biz("Suya Suya West African Grill", "Restaurant", "Nigerian-owned", "Philadelphia", "PA", "full_feature",
    "Northern Liberties", "400 Fairmount Ave, Philadelphia, PA 19123",
    "Fast-casual Nigerian restaurant specializing in suya (spicy grilled meat skewers) and hearty bowls. Modern, accessible take on traditional Nigerian street food with cultural authenticity."),

  biz("South Philly Barbacoa (Casa México)", "Restaurant", "Mexican-owned", "Philadelphia", "PA", "full_feature",
    "South Philadelphia / Italian Market", "1140 S 9th St, Philadelphia, PA 19147",
    "James Beard Award-winning restaurant. Chef Cristina Martinez is celebrated for authentic slow-cooked lamb barbacoa and advocacy for undocumented workers. A compelling story of resilience and culinary excellence."),

  biz("Taller Puertorriqueño (Julia de Burgos Bookstore)", "Cultural Center / Bookstore", "Puerto Rican-owned", "Philadelphia", "PA", "full_feature",
    "Fairhill / El Centro de Oro", "2600 N 5th St, Philadelphia, PA 19133",
    "The 'Cultural Heart of Latino Philadelphia.' Preserves and promotes Puerto Rican and Latino arts and culture, featuring a bilingual bookstore essential for experiencing the local Puerto Rican diaspora."),

  biz("48th Street Grille", "Restaurant", "Jamaican/Caribbean-owned", "Philadelphia", "PA", "full_feature",
    "West Philadelphia", "310 S 48th St, Philadelphia, PA 19143",
    "Popular Jamaican/Caribbean neighborhood restaurant serving authentic Caribbean and American soul food, including jerk chicken, oxtail, and seafood. Known for warm hospitality."),

  biz("Tierra Colombiana", "Restaurant / Nightclub", "Colombian/Caribbean-owned", "Philadelphia", "PA", "full_feature",
    "North Philadelphia", "4535 N 5th St, Philadelphia, PA 19140",
    "Vibrant, long-standing Colombian/Caribbean establishment serving traditional Latin American and Caribbean flavors. Lively nightlife spot capturing the essence of Colombian and Caribbean culture."),

  biz("Picanha Brazilian Steakhouse", "Restaurant", "Brazilian-owned", "Philadelphia", "PA", "full_feature",
    "Northeast Philadelphia", "6501 Castor Ave, Philadelphia, PA 19149",
    "Authentic Brazilian churrascaria offering a wide variety of grilled meats carved tableside with a robust salad bar. Immersive, visually dynamic dining experience celebrating churrasco culture."),

  biz("Càphê Roasters", "Coffee Shop / Roastery", "Vietnamese-owned", "Philadelphia", "PA", "full_feature",
    "Kensington", "3400 J St G1, Philadelphia, PA 19134",
    "The first and only Vietnamese specialty coffee roastery in Philadelphia. Offers traditional Vietnamese coffee and espresso drinks, a vibrant community hub highlighting rich Vietnamese coffee culture.",
    ),

  biz("Suraya", "Restaurant / Market", "Lebanese-owned", "Philadelphia", "PA", "full_feature",
    "Fishtown", "1528 Frankford Ave, Philadelphia, PA 19125",
    "Sprawling, beautifully designed Lebanese market, cafe, and restaurant. Offers mezze, grilled meats, and fresh pastries in a visually stunning atmosphere showcasing Lebanese hospitality."),

  biz("Sisterfriend Jewelry", "Jewelry / Retail", "Filipino-owned", "Philadelphia", "PA", "full_feature",
    "Online / By Appointment", "Philadelphia, PA",
    "Fine jewelry line created by two daughters of Filipino immigrants. Features spam musubi necklaces, mango pendants, and culturally inspired pieces integrating Filipino heritage into modern wearable art."),

  biz("Malooga", "Restaurant", "Yemeni-owned", "Philadelphia", "PA", "full_feature",
    "Old City", "Philadelphia, PA",
    "Yemeni-owned restaurant serving authentic halal Yemeni and Middle Eastern cuisine. Known for rich, aromatic dishes and traditional hospitality highlighting the distinct culinary traditions of Yemen."),

  biz("YUNS Hardware", "Hardware Store", "Korean American-owned", "Philadelphia", "PA", "full_feature",
    "South Philadelphia / Bok Building", "1901 S 9th St, Philadelphia, PA 19148",
    "Modern Korean American-owned hardware store making DIY projects accessible, especially for people of color. Fresh, inclusive take on a traditional business model that fosters community learning."),

  biz("Harriett's Bookshop", "Bookstore", "Black-owned", "Philadelphia", "PA", "full_feature",
    "Fishtown", "258 E Girard Ave, Philadelphia, PA 19125",
    "Independent Black-owned bookshop named after Harriet Tubman. Celebrates women authors, artists, and activists. A powerful community space with a strong activist mission and literary representation."),

  // ============================================================
  // WASHINGTON, DC — Full Feature
  // ============================================================
  biz("MahoganyBooks", "Bookstore", "Black-owned", "Washington", "DC", "full_feature",
    "Anacostia", "1231 Good Hope Rd SE, Washington, DC 20020",
    "Founded by Ramunda and Derrick Young, specializing in books written for, by, or about people of the African Diaspora. A community pillar connecting people through reading and cultural awareness."),

  biz("The Spice Suite", "Retail / Spice Shop", "Black-owned", "Washington", "DC", "full_feature",
    "Takoma", "6902 4th St NW, Washington, DC 20012",
    "Angel Anderson turned a former nail salon into a sensation offering exquisite, unique spice blends. Also serves as an incubator, hosting hundreds of pop-up shops for local Black-owned businesses."),

  biz("Dukem Ethiopian Restaurant", "Restaurant", "Ethiopian-owned", "Washington", "DC", "full_feature",
    "U Street Corridor / Little Ethiopia", "1114-1118 U St NW, Washington, DC 20009",
    "Legendary establishment in DC's Ethiopian dining scene. Evolved from a carryout to a full-service restaurant serving doro wat, kitfo, and vegetable sambusas, often accompanied by live Ethiopian music."),

  biz("Chercher Ethiopian Restaurant & Mart", "Restaurant / Market", "Ethiopian-owned", "Washington", "DC", "full_feature",
    "Shaw", "1334 9th St NW, Washington, DC 20001",
    "Michelin Bib Gourmand-recognized restaurant named after a region in Ethiopia. Serves sautéed short ribs and ginger-spiked lamb stew in a charming, homey setting. Top-tier culinary authenticity."),

  biz("Arepa Zone", "Restaurant / Food Truck", "Venezuelan-owned", "Washington", "DC", "full_feature",
    "14th Street Corridor", "1121 14th St NW, Washington, DC 20005",
    "Founded by Gabriela Febres and Ali Arellano, started as a food truck and expanded to multiple locations. Brings authentic Venezuelan arepas, cachapas, and tequeños to the DC food scene."),

  biz("Del Sur Cafe", "Restaurant", "South American-owned", "Washington", "DC", "full_feature",
    "Dupont Circle", "2016 P St NW, Washington, DC 20036",
    "Run by best friends Marcos Sosa and Juan Machado, offers a pan-South American menu with authentic recipes from Uruguay, Argentina, Peru, and Colombia, including empanadas and yuca fries."),

  biz("Souk", "Bakery / Market", "Trinidadian-owned", "Washington", "DC", "full_feature",
    "Capitol Hill / Barracks Row", "705 8th St SE, Washington, DC 20003",
    "Globally inspired bakery and market offering sweet and savory treats, exotic spices, and oils. Brings Trinidadian warmth and flavors to Capitol Hill with great visual appeal and community vibe."),

  biz("Cane", "Restaurant", "Trinidadian-owned", "Washington", "DC", "full_feature",
    "H Street Corridor", "403 H St NE, Washington, DC 20002",
    "Chef Peter Prime's acclaimed restaurant celebrating the street food of Trinidad and Tobago. Features cumin-spiced pork belly, jerk wings, and traditional roti. Modern, highly celebrated Caribbean cuisine."),

  biz("Purple Patch", "Restaurant", "Filipino-owned", "Washington", "DC", "full_feature",
    "Mount Pleasant", "3155 Mt Pleasant St NW, Washington, DC 20010",
    "One of the first Filipino restaurants in DC serving classic adobo, lumpia, and ube desserts in a welcoming, vibrant atmosphere. A cultural touchstone and gathering place for the AAPI community."),

  biz("Maketto", "Restaurant / Retail", "Cambodian/Taiwanese-owned", "Washington", "DC", "full_feature",
    "H Street Corridor", "1351 H St NE, Washington, DC 20002",
    "Unique 6,000-sq-ft communal marketplace combining a cafe, retail store, and restaurant serving Cambodian and Taiwanese-inspired dishes including famous fried chicken. Visually stunning, innovative space."),

  biz("Zaytinya", "Restaurant", "Middle Eastern-inspired", "Washington", "DC", "full_feature",
    "Penn Quarter", "701 9th St NW, Washington, DC 20001",
    "José Andrés' restaurant honoring Middle Eastern and Mediterranean diaspora cuisine. Innovative mezze menu in a sleek, modern setting highlighting the rich, shared culinary traditions of the Eastern Mediterranean."),

  biz("Albi", "Restaurant", "Palestinian-owned", "Washington", "DC", "full_feature",
    "Navy Yard", "1346 4th St SE, Washington, DC 20003",
    "Chef Michael Rafidi's Michelin-starred restaurant celebrating his Palestinian roots and Levantine cooking. Features wood-fired dishes, hummus, and modern Middle Eastern flavors. Highest culinary accolades."),

  biz("The Grill From Ipanema", "Restaurant", "Brazilian-owned", "Washington", "DC", "full_feature",
    "Adams Morgan", "1858 Columbia Rd NW, Washington, DC 20009",
    "Family-owned Brazilian restaurant serving authentic cuisine since 1992. Traditional feijoada and pão de queijo reflecting diverse culinary regions of Brazil. A long-standing Adams Morgan neighborhood staple."),

  biz("Mitsitam Native Foods Cafe", "Cafe", "Indigenous-owned", "Washington", "DC", "full_feature",
    "National Mall", "4th St & Independence Ave SW, Washington, DC 20560",
    "Inside the National Museum of the American Indian. 'Let's eat!' in Delaware and Piscataway languages. Features Native-inspired foods from five regions of the Americas including fry bread and bison burgers."),

  biz("Appioo African Bar & Grill", "Restaurant / Bar", "Ghanaian-owned", "Washington", "DC", "full_feature",
    "U Street Corridor / Shaw", "1924 9th St NW, Washington, DC 20001",
    "Lively basement spot offering authentic Ghanaian home cooking — jollof rice, waakye, and red red — often accompanied by live highlife and afrobeats music. Vibrant gathering spot for the diaspora."),

  // ============================================================
  // RICHMOND, VA — Full Feature
  // ============================================================
  biz("Addis Ethiopian Restaurant", "Restaurant", "Ethiopian-owned", "Richmond", "VA", "full_feature",
    "Shockoe Bottom", "9 N 17th St, Richmond, VA 23219",
    "Warm, casual-elegant establishment offering authentic Ethiopian cuisine. Staple in the area known for its cozy vibe, amazing ambiance, and traditional dishes like injera and flavorful stews."),

  biz("Mama J's Kitchen", "Restaurant", "Black-owned", "Richmond", "VA", "full_feature",
    "Jackson Ward", "415 N 1st St, Richmond, VA 23219",
    "Award-winning neighborhood restaurant renowned for unforgettable Southern soul food and genuine hospitality. A beloved community pillar with a great story of family and tradition."),

  biz("Curry's Caribbean Restaurant & Bar", "Restaurant & Bar", "Caribbean-owned", "Richmond", "VA", "full_feature",
    "Jackson Ward", "119 E Leigh St, Richmond, VA 23219",
    "Delivers bold island flavors — stew chicken, fried rice — with Jamaican and Trinidadian influences. Lively atmosphere with indoor and rooftop seating, bringing authentic Caribbean flavors to a historic neighborhood."),

  biz("Bellos Lounge & Restaurant", "Restaurant & Lounge", "African/Caribbean-owned", "Richmond", "VA", "full_feature",
    "Shockoe Bottom", "1712 E Franklin St, Richmond, VA 23223",
    "Vibrant spot offering African and Caribbean flavors — oxtails, jerk, jollof — accompanied by a late-night lounge vibe. Great representation of the intersection of African and Caribbean cultures."),

  biz("Fuzzy's Lounge", "Restaurant & Lounge", "Black-owned", "Richmond", "VA", "full_feature",
    "East End", "2709 Williamsburg Rd, Richmond, VA 23223",
    "Black-owned restaurant and lounge known for great food and welcoming atmosphere. Featuring dishes by Chef Larry Carey, a local favorite with a strong community presence. A great hidden gem."),

  biz("Cheddar Jackson", "Restaurant", "Black-owned", "Richmond", "VA", "full_feature",
    "Jackson Ward", "522 N 2nd St, Richmond, VA 23219",
    "Small, cozy shop specializing in creative grilled cheese paninis and soups. Fun, modern take on comfort food in a historic neighborhood. Great visual appeal for food features."),

  biz("Keffiyeh Cafe", "Cafe", "Palestinian-owned", "Richmond", "VA", "full_feature",
    "North Chesterfield / Midlothian", "316 N Arch Rd Ste B, North Chesterfield, VA 23225",
    "Specialty coffee shop offering creative Palestinian-inspired drinks like Pistachio Lattes and Honey Cinnamon Lattes. Showcases incredible culture and creativity in its menu."),

  biz("Buna Kurs Ethiopian Cafe", "Cafe", "Ethiopian-owned", "Richmond", "VA", "full_feature",
    "Jackson Ward", "402 1/2 N 2nd St Suite A, Richmond, VA 23219",
    "Traditional Ethiopian coffee and food offering a taste of home. Authentic coffee experience adding to the cultural richness of the Jackson Ward neighborhood."),

  biz("La Sabrosita Bakery", "Bakery", "Hispanic/Latino-owned", "Richmond", "VA", "full_feature",
    "Southside", "7730 Midlothian Tpke, Richmond, VA 23225",
    "Family-owned and operated business serving the Richmond community for over 9 years. Expertly decorated cakes and traditional Latin American baked goods. Highlights the vibrant Hispanic community."),

  biz("Joyebells Sweet Potato Pies", "Bakery / Specialty Food", "Black-owned", "Richmond", "VA", "full_feature",
    "Southside", "2601 Maury St Bldg 2, Richmond, VA 23224",
    "Famous for signature, traditional Southern sweet potato pies. A success story of a local family recipe growing into a widely recognized brand, deeply rooted in Southern Black culinary traditions."),

  biz("Lammar Marie's Gourmet Popcorn", "Specialty Food Shop", "Black-owned", "Richmond", "VA", "full_feature",
    "West End", "3047 Lauderdale Dr, Richmond, VA 23233",
    "Specialty food shop offering bold, addictive, and creative popcorn flavors. Unique, fun snack experience perfect for a lively app feature."),

  biz("AlterNatives Boutique", "Boutique / Retail", "Indigenous-owned", "Richmond", "VA", "full_feature",
    "Carytown", "3320 W Cary St, Richmond, VA 23221",
    "Social enterprise carrying Fair Trade, Direct Trade, and meaningfully made products. Indigenous-owned and woman-owned shop empowering artisans with a unique shopping experience."),

  biz("Perception Organic Spa", "Wellness / Spa", "Asian-owned", "Richmond", "VA", "full_feature",
    "The Fan / Carytown", "2605 W Cary St, Richmond, VA 23221",
    "Committed to using in-house made organic products for skin care and wellness treatments. Represents the wellness sector in Richmond, offering a serene, health-focused experience."),

  biz("The Green Kitchen", "Catering", "Minority/Women-owned", "Richmond", "VA", "full_feature",
    "Church Hill", "314 N 25th St, Richmond, VA 23223",
    "Catering company offering services from dinner parties to weekly meal deliveries. Minority-owned and women-owned business highlighting the professional food service side of the community."),

  biz("Metzger Bar and Butchery", "Restaurant & Butchery", "Women-owned (German)", "Richmond", "VA", "full_feature",
    "Union Hill / Church Hill", "801 N 23rd St, Richmond, VA 23223",
    "Contemporary, rustic restaurant offering seasonal, sustainable German-influenced food and drink. Women-owned, representing the European diaspora and adding to Richmond's diverse culinary landscape."),

  // ============================================================
  // RALEIGH / DURHAM, NC — Full Feature
  // ============================================================
  biz("Brothers Crispy Ice Cream & Waffles", "Dessert / Cafe", "Black-owned", "Raleigh", "NC", "full_feature",
    "Raleigh", "430 Hill Street, Raleigh, NC",
    "Black-owned dessert spot bringing creative ice cream and waffle combinations to the Raleigh community."),

  biz("Raleigh Vegan", "Restaurant", "Black-owned", "Raleigh", "NC", "full_feature",
    "East Raleigh", "4551 New Bern Ave Suite 180, Raleigh, NC 27610",
    "Black-owned vegan restaurant serving delicious plant-based comfort food and catering to the growing vegan community in the Triangle area."),

  biz("Cocoa Cinnamon / Fullsteam Brewery Community", "Cafe / Brewery", "Puerto Rican & African American (Afro-Latino)", "Durham", "NC", "full_feature",
    "Durham", "705 Willard St, Durham, NC 27701",
    "Afro-Latino owned cafe and community space celebrating cultural blending. A vibrant gathering place in Durham's creative food scene."),

  biz("El Rodeo", "Restaurant", "Mexican-owned", "Raleigh", "NC", "full_feature",
    "South Raleigh", "3600 Junction Blvd, Raleigh, NC 27603",
    "Authentic Mexican restaurant serving the South Raleigh community with traditional dishes and a welcoming family atmosphere."),

  biz("Don Beto Colombian Grill", "Restaurant", "Colombian-owned", "Raleigh", "NC", "full_feature",
    "North Raleigh", "3105 Capital Blvd, Raleigh, NC 27604",
    "Authentic Colombian restaurant offering traditional dishes like bandeja paisa and arepas. Represents the growing South American diaspora in the Triangle."),

  biz("Island Spice Jamaican Restaurant", "Restaurant", "Jamaican-owned", "Raleigh", "NC", "full_feature",
    "North Raleigh", "6260 Plantation Center Dr, Raleigh, NC 27616",
    "Long-standing Jamaican restaurant serving authentic jerk chicken, oxtail, and curried goat in a welcoming Caribbean atmosphere."),

  biz("Blue Taj Indian Kitchen", "Restaurant", "Caribbean-owned", "Raleigh", "NC", "full_feature",
    "East Raleigh", "1909 Poole Rd, Raleigh, NC 27610",
    "Caribbean-owned restaurant bringing flavorful island-inspired dishes to the East Raleigh community."),

  biz("Baba Legba Ethiopian Restaurant", "Restaurant", "Ethiopian/Eritrean-owned", "Raleigh", "NC", "full_feature",
    "Cary / Greater Raleigh", "904 NE Maynard Rd, Cary, NC 27513",
    "Authentic Ethiopian and Eritrean restaurant serving traditional injera-based meals with communal dining. A cultural anchor for the East African diaspora in the Triangle."),

  biz("Suya Joint", "Restaurant", "West African/Nigerian-owned", "Raleigh", "NC", "full_feature",
    "South Raleigh", "6109 Rock Quarry Rd Suite 105, Raleigh, NC 27610",
    "Authentic West African and Nigerian restaurant specializing in suya, jollof rice, and traditional dishes. A gathering place for the Nigerian diaspora in Raleigh."),

  biz("Tam's Chicken & Waffles", "Restaurant", "West African/Senegalese-owned", "Raleigh", "NC", "full_feature",
    "Downtown Raleigh", "717 E Martin St Suite 199, Raleigh, NC 27601",
    "West African and Senegalese-owned restaurant bringing flavorful West African-influenced soul food to downtown Raleigh."),

  biz("MOFU Shoppe", "Restaurant", "Asian-owned (Pan-Asian)", "Raleigh", "NC", "full_feature",
    "Downtown Raleigh", "321 S Blount St, Raleigh, NC 27601",
    "Pan-Asian restaurant celebrating the diversity of Asian culinary traditions in downtown Raleigh. Offers a modern take on Asian street food and comfort classics."),

  biz("Brewery Bhavana", "Brewery / Restaurant", "Asian-owned (Laotian heritage)", "Raleigh", "NC", "full_feature",
    "Downtown Raleigh", "218 S Blount St, Raleigh, NC 27601",
    "Laotian-heritage brewery, bookstore, flower shop, and dim sum restaurant in one unique space. James Beard Award nominated. One of the most distinctive dining experiences in the South."),

  biz("Zoe's Lebanese Cuisine", "Restaurant", "Lebanese-owned", "Raleigh", "NC", "full_feature",
    "West Raleigh", "3817 Beryl Rd, Raleigh, NC 27607",
    "Lebanese-owned restaurant serving authentic Lebanese cuisine including hummus, shawarma, and traditional mezze. A beloved fixture representing the Middle Eastern diaspora in Raleigh."),

  biz("Bida Manda", "Restaurant", "Middle Eastern/Mediterranean-inspired", "Raleigh", "NC", "full_feature",
    "Downtown Raleigh", "209 Bickett Blvd, Raleigh, NC 27608",
    "Award-winning restaurant offering a globally inspired, community-focused dining experience celebrating diverse culinary traditions in the heart of downtown Raleigh."),

  biz("Guilford Native American Art Gallery", "Gallery / Cultural Organization", "Native American/Indigenous", "Raleigh", "NC", "full_feature",
    "Raleigh", "P.O. Box 26841, Raleigh, NC 27611",
    "Organization preserving and exhibiting Native American art and culture in the Triangle area. Vital representation for approximately 13,000 Tribal Citizens in Wake County."),

  // ============================================================
  // CHARLOTTE, NC — Full Feature
  // ============================================================
  biz("Mert's Heart and Soul", "Restaurant", "Black-owned", "Charlotte", "NC", "full_feature",
    "Uptown", "214 N College St, Charlotte, NC 28202",
    "A staple in Uptown Charlotte offering award-winning Southern, Gullah, and Lowcountry cuisine including famous salmon cakes and soul rolls. A long-standing community pillar."),

  biz("Urban Reader Bookstore", "Bookstore", "Black-owned", "Charlotte", "NC", "full_feature",
    "University City Area", "440 E McCullough Dr Suite A-130, Charlotte, NC 28262",
    "Charlotte's only Black-owned indie bookstore, specializing in African American literature, banned books, and New York bestsellers. Also operates a bookmobile. Amplifying Black voices."),

  biz("Enat Ethiopian Restaurant", "Restaurant", "Ethiopian-owned", "Charlotte", "NC", "full_feature",
    "East Charlotte / Plaza Midwood", "4150 Maney Dr, Charlotte, NC 28205",
    "Known for authentic and flavorful Ethiopian dishes served on traditional injera bread. Communal dining experience with vibrant colors and rich East African cultural representation."),

  biz("Sabor Latin Street Grill", "Restaurant", "Hispanic/Latino-owned (Venezuelan roots)", "Charlotte", "NC", "full_feature",
    "Elizabeth", "415 Hawthorne Ln, Charlotte, NC 28204",
    "Locally owned concept featuring authentic dishes from El Salvador, Dominican Republic, Venezuela, Mexico, and Colombia. Showcases the diversity within the Latin American diaspora."),

  biz("Calle Sol Café & Cevicheria", "Restaurant", "Hispanic/Latino-owned", "Charlotte", "NC", "full_feature",
    "Plaza Midwood", "1205 Thomas Ave, Charlotte, NC 28205",
    "Vibrant spot serving authentic Latin, Peruvian, and Cuban food. Known for bold flavors, ceviche, and lively atmosphere. Specific focus on Peruvian and Cuban cuisine."),

  biz("Mi Tierra Colombian Restaurant", "Restaurant", "Colombian-owned", "Charlotte", "NC", "full_feature",
    "South Charlotte", "10405 Park Rd, Charlotte, NC 28210",
    "Authentic Colombian restaurant offering traditional dishes like Bandeja Paisa, empanadas, and arepas. Deep dive into South American diaspora culture."),

  biz("Caribbean Hut", "Restaurant", "Caribbean-owned", "Charlotte", "NC", "full_feature",
    "University City", "9609 N Tryon St, Charlotte, NC 28262",
    "Serving authentic Caribbean flavors including jerk chicken, oxtail, and curry goat. A beloved spot representing the strong Caribbean diaspora in Charlotte."),

  biz("Lagz Restaurant", "Restaurant", "West African-owned (Nigerian)", "Charlotte", "NC", "full_feature",
    "East Charlotte", "3130 N Tryon St, Charlotte, NC 28206",
    "One of the best Nigerian restaurants in Charlotte serving authentic West African flavors — jollof rice, fufu, and egusi soup — often featuring an unlimited buffet."),

  biz("The Dumpling Lady", "Restaurant / Food Truck", "Asian-owned (Chinese)", "Charlotte", "NC", "full_feature",
    "Optimist Hall / South End", "1115 N Brevard St, Charlotte, NC 28206",
    "Starting as a popular food truck and now a staple in Optimist Hall. Serves authentic, spicy Sichuan-style dumplings and noodles. Massive local success story of authentic regional Chinese street food."),

  biz("Let's Meat Kbbq", "Restaurant", "Asian-owned (Korean)", "Charlotte", "NC", "full_feature",
    "South End", "1400 S Church St, Charlotte, NC 28203",
    "Charlotte's premier all-you-can-eat authentic Korean BBQ experience where diners cook their own meats at the table. Interactive, engaging, and representative of Asian culinary culture."),

  biz("La Shish Kabob", "Restaurant", "Middle Eastern-owned", "Charlotte", "NC", "full_feature",
    "East Charlotte", "3117 N Sharon Amity Rd, Charlotte, NC 28205",
    "Locally owned Middle Eastern restaurant serving fresh, authentic shawarma, falafel, and kabobs. Represents the Middle Eastern diaspora in a neighborhood known for diverse immigrant communities."),

  biz("Zaytuna", "Market / Grocery Store", "Palestinian-owned", "Charlotte", "NC", "full_feature",
    "East Charlotte", "4200 South Blvd, Charlotte, NC 28209",
    "Neighborhood market offering a wide selection of Middle Eastern and Mediterranean groceries, spices, and halal meats. Highlights the ingredients and daily life of the Middle Eastern diaspora."),

  biz("Curio, Craft & Conjure", "Retail / Wellness", "Black-owned", "Charlotte", "NC", "full_feature",
    "NoDa (North Davidson)", "3204 N Davidson St Suite C, Charlotte, NC 28205",
    "Unique shop supplying personalized magickal supplies, herbs, crystals, and spiritual services. Focuses on spiritual wellness and alternative retail within the Black community."),

  biz("Viva Chicken", "Restaurant", "Hispanic/Latino-owned (Peruvian roots)", "Charlotte", "NC", "full_feature",
    "Elizabeth", "1617 Elizabeth Ave, Charlotte, NC 28204",
    "Fast-casual charcoal-fire rotisserie specializing in authentic Peruvian Pollo a la Brasa. A highly successful local chain that introduced many Charlotteans to Peruvian flavors."),

  biz("Nile Grocery and Ethiopian Restaurant", "Market and Restaurant", "Ethiopian-owned", "Charlotte", "NC", "full_feature",
    "East Charlotte", "3113 N Sharon Amity Rd, Charlotte, NC 28205",
    "Dual-purpose business offering a grocery store stocked with East African goods and a restaurant serving traditional Ethiopian meals. Comprehensive look at how the Ethiopian diaspora maintains its culture."),

  // ============================================================
  // COLUMBIA, SC — Full Feature
  // ============================================================
  biz("Railroad BBQ", "Restaurant", "Black-owned", "Columbia", "SC", "full_feature",
    "Hampton Street Area", "2001 Hampton St, Columbia, SC 29204",
    "Beloved local BBQ joint serving authentic slow-smoked meats and classic Southern sides. Known for flavorful ribs and welcoming atmosphere. A true community staple representing the rich history of Black-owned BBQ."),

  biz("Chayz Lounge", "Live Music Venue / Restaurant", "Black-owned", "Columbia", "SC", "full_feature",
    "West Columbia", "607 Meeting St, West Columbia, SC 29169",
    "Elegant, intimate live music venue offering refined dining alongside top-tier jazz and R&B performances. Sophisticated, culturally rich nightlife experience celebrating Black musical heritage."),

  biz("All Good Books", "Bookstore", "Black-owned", "Columbia", "SC", "full_feature",
    "Five Points", "734 Harden St, Columbia, SC 29205",
    "Vibrant independent bookstore co-owned by members of the Black community. Strong focus on Black authors and local writers. Community hub for literature and thought."),

  biz("Real Mexico Restaurant Y Tienda", "Restaurant & Market", "Mexican-owned", "Columbia", "SC", "full_feature",
    "Bush River Road Area", "2421 Bush River Rd, Columbia, SC 29210",
    "Highly rated, authentic Mexican restaurant with a small tienda selling traditional Mexican goods and ingredients. Genuine taste of Mexico beyond Tex-Mex with a great dual restaurant-market cultural story."),

  biz("Mary's Arepas", "Restaurant", "Colombian-owned", "Columbia", "SC", "full_feature",
    "Downtown / Main Street Area", "1731 Main St, Columbia, SC 29201",
    "Authentic Colombian arepas, empanadas, and traditional street foods. Staple at the Soda City Market. Highlights the South American diaspora in the South. Visually engaging food-making process."),

  biz("La Isla Bonita Restaurante", "Restaurant", "Puerto Rican-owned", "Columbia", "SC", "full_feature",
    "Two Notch Road Area", "1701 Two Notch Rd, Columbia, SC 29204",
    "Authentic Puerto Rican cuisine including mofongo, pernil, and traditional Caribbean-Latin flavors. Represents the Afro-Latino and Caribbean-Latino experience in the Midlands."),

  biz("Harambe Ethiopian Restaurant", "Restaurant", "Ethiopian-owned", "Columbia", "SC", "full_feature",
    "Five Points Area", "2006 Senate St, Columbia, SC 29205",
    "Cozy, authentic Ethiopian spot known for rich stews (wots), injera bread, and traditional Ethiopian coffee ceremonies. Incredible visual and cultural storytelling through communal eating."),

  biz("Sophie's Ethiopian", "Restaurant", "Ethiopian-owned", "Columbia", "SC", "full_feature",
    "North Main (NOMA)", "2431 Main St, Columbia, SC 29201",
    "Fresh, flavorful Ethiopian dishes with a focus on both meat and extensive vegan options. Highlights the growing East African community and the cultural significance of plant-based eating in Ethiopian Orthodox traditions."),

  biz("Calabash Caribbean Grill", "Restaurant", "Caribbean-owned (Jamaican)", "Columbia", "SC", "full_feature",
    "St. Andrews", "817 St Andrews Rd Unit 106, Columbia, SC 29210",
    "Family-owned, veteran-led Jamaican restaurant serving jerk chicken, oxtail, and curry goat. Strong veteran-owned story combined with authentic Caribbean flavors, acting as a pillar for the West Indian community."),

  biz("Tati's Island Cuisine", "Restaurant", "Caribbean-owned", "Columbia", "SC", "full_feature",
    "Decker Blvd / International Corridor", "2540 Decker Blvd, Columbia, SC 29206",
    "Authentic Caribbean spices and island-inspired dishes on Columbia's diverse International Corridor. Highlights how different diaspora communities cluster and thrive together."),

  biz("Pho Viet Restaurant", "Restaurant", "Vietnamese-owned", "Columbia", "SC", "full_feature",
    "Devine Street", "2011 Devine St, Columbia, SC 29205",
    "Highly regarded spot for authentic Vietnamese pho, vermicelli bowls, and banh mi. Known for rich broths and fresh ingredients. Great culinary cinematography potential."),

  biz("Kusina Filipina", "Restaurant", "Filipino-owned", "Columbia", "SC", "full_feature",
    "Decker Blvd / International Corridor", "2312 Decker Blvd, Columbia, SC 29206",
    "Hidden gem offering authentic Filipino comfort food including adobo, pancit, and lumpia. Serving the local Asian-American community. Filipino cuisine as a unique blend of Asian and Hispanic influences."),

  biz("Arabesque on Devine", "Restaurant", "Lebanese-owned", "Columbia", "SC", "full_feature",
    "Devine Street", "2930 Devine St, Columbia, SC 29205",
    "Casual fine-dining Lebanese and Middle Eastern restaurant offering shawarma, hummus, and kebabs. Showcases the Levantine diaspora beautifully with elegant plating and rich hospitality."),

  biz("Braza Do Sul Brazilian Steakhouse", "Restaurant (Churrascaria)", "Brazilian-owned", "Columbia", "SC", "full_feature",
    "Harbison", "410 Columbiana Dr, Columbia, SC 29212",
    "Authentic Southern Brazilian-style churrascaria with continuous tableside service of fire-roasted meats and gourmet salad bar. The gaucho culture and visual spectacle make it perfect for video features."),

  biz("X Mart Brazil", "Market / Grocery", "Brazilian-owned", "Columbia", "SC", "full_feature",
    "St. Andrews Area", "1500 Broad River Rd, Columbia, SC 29210",
    "Specialty grocery store providing authentic Brazilian products, snacks, meats, and everyday essentials. Markets are the lifeblood of diaspora communities showing where locals find the tastes of home."),

  // ============================================================
  // ATLANTA, GA — Full Feature
  // ============================================================
  biz("Brush Sushi", "Restaurant", "Japanese-owned / Taiwanese-American-owned", "Atlanta", "GA", "full_feature",
    "Buckhead", "3009 Peachtree Road NE, Atlanta, GA 30305",
    "Led by James Beard-nominated chef Jason Liang. Offers Tokyo-style sushi, sashimi, ramen, and Binchotan grilled fare. One of the first to introduce Edomae-style sushi to Atlanta."),

  biz("Talat Market", "Restaurant", "Thai-owned", "Atlanta", "GA", "full_feature",
    "Summerhill", "112 Ormond St SE, Atlanta, GA 30315",
    "Highly acclaimed MICHELIN Recommended Thai-inspired restaurant with a daily-changing menu. Chefs Parnass Savang and Rod Lassiter were James Beard Award nominated. Authentic Thai flavors with local ingredients."),

  biz("Food Terminal", "Restaurant", "Malaysian-owned", "Atlanta", "GA", "full_feature",
    "West Midtown / Chamblee", "1000 Marietta St NW, Atlanta, GA 30318",
    "Started by Amy Wong, who began selling street noodles in Malaysia at age 15. Reflects Malaysia's diverse cuisine with influences from India and various Chinese provinces. MICHELIN Recommended."),

  biz("44th & 3rd Bookseller", "Bookstore", "Black-owned", "Atlanta", "GA", "full_feature",
    "West End", "451 Lee St SW, Atlanta, GA 30310",
    "Family-owned, multicultural bookstore founded by Warren, Cheryl, and Allyce Lee. Curates books promoting the exchange of ideas, focusing on life, literature, and legacy. A true community pillar."),

  biz("Breakfast at Barney's", "Restaurant", "Black-owned", "Atlanta", "GA", "full_feature",
    "Sweet Auburn / Downtown", "349 Decatur St SE, Atlanta, GA 30312",
    "Owned by Barney Lee Berry Jr., blending Atlanta and Savannah cultures with Southern traditions. Known for 24k gold pancakes and soulful comfort food. Highly visual, trendy, deeply rooted in Black culture."),

  biz("ZuCot Gallery", "Art Gallery", "Black-owned", "Atlanta", "GA", "full_feature",
    "Castleberry Hill", "100 Centennial Olympic Park Dr NW, Atlanta, GA 30313",
    "The largest African-American-owned fine art gallery in the Southeast. Promotes and exhibits original works by living African American artists. A premier cultural institution elevating Black artists."),

  biz("Just 4 Girls Salon", "Hair Salon", "Black-owned", "Atlanta", "GA", "full_feature",
    "East Atlanta", "568 Fayetteville Rd SE, Atlanta, GA 30316",
    "Specializes in the growth and maintenance of healthy, natural hair for girls of all hair types. Promotes self-love and beauty. A heartwarming community business empowering young Black girls."),

  biz("Arepa Mia", "Restaurant", "Venezuelan-owned", "Atlanta", "GA", "full_feature",
    "Avondale Estates", "10 N Clarendon Ave, Avondale Estates, GA 30002",
    "MICHELIN Bib Gourmand awarded eatery. Authentic, naturally gluten-free Venezuelan arepas, patacones, and empanadas. Founded by Chef Lis Hernandez. Beloved local gem with great founder story."),

  biz("Patria Cocina", "Restaurant", "Mexican-owned", "Atlanta", "GA", "full_feature",
    "Grant Park", "1039 Grant St SE, Atlanta, GA 30315",
    "Chef Octavio serves traditional Mexican dishes from his upbringing on a tequila farm in Jalisco. Known for small-batch tequilas and amazing chilaquiles. Deeply authentic family recipes."),

  biz("El Super Pan", "Restaurant", "Puerto Rican-owned", "Atlanta", "GA", "full_feature",
    "Old Fourth Ward / Ponce City Market", "675 Ponce De Leon Ave NE, Atlanta, GA 30308",
    "Owned by Chef Hector Santiago. Incredible Puerto Rican sandwiches, empanadas, and Latin Caribbean flavors in a bustling market setting. Prominent figure bringing vibrant Puerto Rican culture to Atlanta."),

  biz("Las Delicias de la Abuela", "Restaurant", "Colombian-owned", "Atlanta", "GA", "full_feature",
    "Doraville", "5600 Buford Hwy NE, Doraville, GA 30340",
    "Traditional Colombian home cooking — tamales, empanadas, and hearty meals just like 'Abuela' used to make. The comforting, family-oriented side of Colombian culture in Atlanta."),

  biz("Addis Ababa Ethiopian Grocery & Café", "Grocery & Café", "Ethiopian-owned", "Atlanta", "GA", "full_feature",
    "Clarkston / East Atlanta", "Atlanta, GA",
    "Staple for the Ethiopian diaspora offering authentic groceries, spices, and a café that serves as a community gathering space. Essential community hub providing authentic ingredients and cultural connection."),

  biz("The Freakin Incan", "Restaurant", "Peruvian-owned", "Atlanta", "GA", "full_feature",
    "Roswell", "4651 Woodstock Rd Ste 305, Roswell, GA 30075",
    "Authentic Peruvian street food restaurant known for Lomo Saltado and colorful decor. Bringing the taste of the Andes to the metro area. Showcases the unique and diverse flavors of Peruvian cuisine."),

  biz("Hilo Música", "Music Store & Lessons", "Latino-owned", "Atlanta", "GA", "full_feature",
    "Decatur", "604 W College Ave, Decatur, GA 30030",
    "Shop for Latin American instruments — guitars, cajón drums, maracas. Also a cultural gathering spot hosting local musicians. Highlights the musical heritage of Latin America beyond food."),

  biz("The Village Retail", "Retail Market", "Black-owned", "Atlanta", "GA", "full_feature",
    "Old Fourth Ward / Ponce City Market", "675 Ponce De Leon Ave NE Suite 225, Atlanta, GA 30308",
    "Marketplace curating apparel, home goods, and beauty products by local Black business owners and creatives. Founded by Lakeysha Hallmon. Incubator and showcase for multiple Black-owned brands."),

  biz("Tio Lucho's", "Restaurant", "Peruvian-owned", "Atlanta", "GA", "full_feature",
    "Poncey-Highland", "675 N Highland Ave NE Ste 6000, Atlanta, GA 30306",
    "Peruvian restaurant from Chef Arnaldo Castillo inspired by his father. Highlights the coastal flavors of Peru and the unique cultural blend of the region. Sophisticated take on Peruvian coastal cuisine."),

  biz("Xing Fu Tang", "Boba Tea & Desserts", "Taiwanese-owned", "Atlanta", "GA", "full_feature",
    "Duluth", "2476 Pleasant Hill Rd, Duluth, GA 30096",
    "Famous for signature brown sugar boba milk, soft serve, and desserts. Bringing authentic Taiwanese boba culture to the Atlanta metro. Boba is a massive cultural touchstone with highly visual experience."),

  biz("No Mas! Hacienda", "Artisan Market & Restaurant", "Mexican/Latin-inspired", "Atlanta", "GA", "full_feature",
    "Castleberry Hill", "180 Walker St SW, Atlanta, GA 30313",
    "Combines art, design, and culture with Latin-inspired home décor, jewelry, and art sourced from artisans across Latin America alongside a restaurant. Massive, visually stunning space."),

  biz("For Keeps Books", "Bookstore", "Black-owned", "Atlanta", "GA", "full_feature",
    "Sweet Auburn", "171 Auburn Ave NE, Atlanta, GA 30303",
    "Charming shop and reading room curating rare and classic Black literature. Puts readers in conversation with Black history and writers. Located in a historic neighborhood preserving Black literary history."),

  biz("Sandlux Apparel", "Clothing Boutique", "Latina-owned", "Atlanta", "GA", "full_feature",
    "Buford Highway / Plaza Fiesta", "4166 Buford Hwy NE, Atlanta, GA 30345",
    "Owned by Daniela Londono, combining Latin elegance with contemporary flair. Celebrates culture through fashion inside vibrant Plaza Fiesta. Showcases Latina entrepreneurship in fashion."),

  // ============================================================
  // MONTGOMERY, AL — Full Feature
  // ============================================================
  biz("Brenda's Bar-Be-Que Pit", "Restaurant", "Black-owned", "Montgomery", "AL", "full_feature",
    "West Montgomery", "1457 Mobile Rd, Montgomery, AL 36108",
    "Historic, family-owned barbecue joint open since 1942. One of the oldest Black-owned restaurants in the city. Authentic Southern BBQ, ribs, and soul food sides with a multi-generational family story."),

  biz("Island Delight at Dexter", "Restaurant", "Jamaican-owned", "Montgomery", "AL", "full_feature",
    "Downtown", "36 Dexter Ave, Montgomery, AL 36104",
    "Authentic Jamaican eatery on historic Dexter Avenue offering jerk chicken, oxtails, curry goat, and Caribbean sides. Showcases the growing diversity of downtown Montgomery's culinary scene."),

  biz("La Taquiza Mexican Restaurant and Grill", "Restaurant", "Hispanic-owned", "Montgomery", "AL", "full_feature",
    "South Montgomery", "4530 Troy Hwy, Montgomery, AL 36116",
    "Highly-rated authentic Mexican street tacos, tortas, and traditional platters. Represents the vibrant and growing Hispanic community in Montgomery with an authentic, unpretentious dining experience."),

  biz("Pho Life", "Restaurant", "Vietnamese-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "7833 Vaughn Rd, Montgomery, AL 36116",
    "Popular spot for authentic Vietnamese pho, banh mi sandwiches, and fresh spring rolls. Highlights the Asian diaspora in Montgomery with visually appealing fresh, colorful ingredients."),

  biz("India Palace", "Restaurant", "Indian-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "2801 Vaughn Plaza Rd, Montgomery, AL 36116",
    "Culinary gem serving authentic Indian curries, tandoori specialties, and fresh naan since 2012. Consistently voted the best Indian restaurant in the city. Cultural anchor for the South Asian community."),

  biz("Kalim Korean BBQ", "Restaurant", "Korean-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "5806 Woodmere Blvd, Montgomery, AL 36117",
    "Authentic Korean BBQ experience with interactive tableside grilling. Represents the Asian diaspora in Montgomery through the beloved Korean BBQ cultural tradition."),

  biz("Alsham Restaurant", "Restaurant", "Middle Eastern-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "2671 Eastern Blvd, Montgomery, AL 36117",
    "Middle Eastern restaurant serving authentic Levantine cuisine including shawarma, hummus, and traditional dishes. Cultural anchor for the Middle Eastern diaspora in Montgomery."),

  biz("Plant Bae", "Restaurant", "Black-owned", "Montgomery", "AL", "full_feature",
    "Downtown Montgomery", "175 Lee St, Montgomery, AL 36104",
    "Black-owned plant-based restaurant bringing vegan comfort food to downtown Montgomery. Represents the intersection of Black entrepreneurship and wellness culture."),

  biz("Volcano Hot Pot & Korean BBQ", "Restaurant", "Asian-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "2070 Eastern Blvd, Montgomery, AL 36117",
    "Asian-owned hot pot and Korean BBQ restaurant offering an interactive communal dining experience. Represents the broader Asian diaspora community in Montgomery."),

  biz("Brin's Wings", "Restaurant", "Black-owned", "Montgomery", "AL", "full_feature",
    "South Montgomery", "5648 Atlanta Hwy, Montgomery, AL 36117",
    "Popular Black-owned wings restaurant serving flavorful, seasoned wings in various styles. A beloved community spot celebrating Black culinary entrepreneurship in Montgomery."),

  biz("The Whitlow's Barbershop", "Barbershop", "Black-owned", "Montgomery", "AL", "full_feature",
    "Downtown Montgomery", "115 S Court St, Montgomery, AL 36104",
    "Black-owned barbershop in the heart of downtown Montgomery. A community anchor and cultural hub where conversations about history, community, and culture happen daily."),

  biz("Trade N Books", "Bookstore", "Black-owned", "Montgomery", "AL", "full_feature",
    "Downtown Montgomery", "105 South Court Street, Montgomery, AL 36104",
    "Black-owned independent bookstore serving the Montgomery community. A space for Black literature, community gatherings, and cultural conversations in the birthplace of the Civil Rights Movement."),

  biz("CEO Black Chicks", "Professional Services", "Black-owned", "Montgomery", "AL", "full_feature",
    "South Montgomery", "Montgomery, AL 36116",
    "Black-owned professional services organization supporting and empowering Black women entrepreneurs in the Montgomery business community."),

  biz("Tienda Los Hermanos", "Grocery Store", "Hispanic-owned", "Montgomery", "AL", "full_feature",
    "South Montgomery", "5600 Troy Hwy, Montgomery, AL 36116",
    "Hispanic-owned grocery store providing authentic Latin American food products and ingredients for the local Hispanic community. Essential cultural hub for the diaspora."),

  biz("Asian Supermarket", "Grocery Store", "Asian-owned", "Montgomery", "AL", "full_feature",
    "East Montgomery", "3360 Atlanta Hwy, Montgomery, AL 36109",
    "Asian-owned supermarket providing authentic Asian groceries, ingredients, and specialty items. Essential resource for the Asian diaspora community in Montgomery."),

  // ============================================================
  // BIRMINGHAM, AL — Full Feature
  // ============================================================
  biz("Yo' Mama's Restaurant", "Restaurant", "Black-owned", "Birmingham", "AL", "full_feature",
    "Downtown", "2024 4th Ave N, Birmingham, AL 35203",
    "Community staple established in 2014 by Crystal and Denise Peterson. Award-winning restaurant serving chicken and waffles, burgers, and shrimp and grits. Strong family story with visually appealing food."),

  biz("Eugene's Hot Chicken", "Restaurant", "Black-owned", "Birmingham", "AL", "full_feature",
    "Uptown", "2268 9th Ave N, Birmingham, AL 35203",
    "Owned by Zebbie Carney. Nashville-style hot chicken from no heat to 'stupid hot.' Massive local success story starting as a pop-up and food truck before expanding to multiple brick-and-mortar locations."),

  biz("K&J's Elegant Pastries", "Bakery", "Black-owned", "Birmingham", "AL", "full_feature",
    "Downtown", "2260 9th Ave N, Birmingham, AL 35203",
    "Owned by designer chef Kristal Bryant. Famous for 'kollosal milkshakes' and stunning custom cakes. Nationally recognized on Food Network and Travel Channel. Visually explosive desserts perfect for camera."),

  biz("Memory Lane", "Retail", "Black-owned", "Birmingham", "AL", "full_feature",
    "Downtown", "2320 1st Ave N Ste 110, Birmingham, AL 35203",
    "Owned by Chris Smoot and Tanarius Hayes. Sells vintage clothing, streetwear, and highly sought-after sneakers. Taps into urban fashion, sneakerhead culture, and youth entrepreneurship within the Black community."),

  biz("La Tía Paisa Taco Shop", "Restaurant", "Hispanic/Latino-owned", "Birmingham", "AL", "full_feature",
    "Homewood", "406 W Valley Ave, Homewood, AL 35209",
    "Owned by Maria Manzano, who brought California-style Mexican food to Birmingham. Famous for handmade tortillas prepared fresh every morning and authentic California burritos. Compelling heritage story."),

  biz("Dos Hermanos Taco Truck", "Food Truck", "Hispanic/Latino-owned", "Birmingham", "AL", "full_feature",
    "Downtown", "99 14th St N, Birmingham, AL 35203",
    "Run by the Guzman family. Highly rated taco truck bringing authentic Latin cuisine to Birmingham's streets, frequently updating recipes with family visiting from Mexico."),

  biz("Sol Y Luna Tapas and Tequilas", "Restaurant", "Hispanic/Latino-owned", "Birmingham", "AL", "full_feature",
    "Mountain Brook", "920 Lane Parke Ct, Mountain Brook, AL 35223",
    "Upscale Mexican restaurant led by Head Chef Jorge Castro from Guadalajara. Crafts delicious tapas and phenomenal tequila drinks. Direct roots to Guadalajara bring an authentic, elevated Mexican experience."),

  biz("Red Sea Ethiopian & Mediterranean Restaurant", "Restaurant", "Ethiopian-owned", "Birmingham", "AL", "full_feature",
    "Homewood", "22 Green Springs Hwy, Homewood, AL 35209",
    "Highly rated establishment offering authentic Ethiopian dishes including injera and doro wat alongside Mediterranean favorites. Communal Ethiopian dining makes for excellent visual content."),

  biz("Ghion Cultural Hall", "Restaurant", "Ethiopian-owned", "Birmingham", "AL", "full_feature",
    "Downtown / The Pizitz Food Hall", "1821 2nd Ave N, Birmingham, AL 35203",
    "Alabama's first Ethiopian restaurant serving authentic Ethiopian cuisine in the heart of downtown. Historical significance within the local diaspora and great atmosphere in a bustling food hall."),

  biz("Southern Caribbean Restaurant", "Restaurant", "Caribbean-owned", "Birmingham", "AL", "full_feature",
    "West Birmingham", "1116 Lomb Ave, Birmingham, AL 35224",
    "Local favorite for authentic Jamaican patties, jerk chicken, oxtails, and other Caribbean specialties. Cornerstone for Caribbean flavors in the city with vibrant spices and traditional cooking methods."),

  biz("Texas de Brazil", "Restaurant", "Brazilian-owned", "Birmingham", "AL", "full_feature",
    "Uptown", "2301 Richard Arrington Jr Blvd N, Birmingham, AL 35203",
    "Authentic Brazilian churrascaria offering a continuous dining experience with various cuts of meat carved tableside. Showcases the South American diaspora. Visually spectacular for an app feature."),

  biz("Mr. Chen's Authentic Chinese Cooking & Hometown Supermarket", "Restaurant / Market", "Asian-owned (Chinese)", "Birmingham", "AL", "full_feature",
    "Homewood", "808 Green Springs Hwy, Homewood, AL 35209",
    "Cultural touchstone for the East Asian community. Authentic Chinese cuisine and an attached supermarket with essential Asian groceries. Dual-purpose community hub serving the local Asian diaspora."),

  biz("Pho Pho Asian Cuisine", "Restaurant", "Asian-owned (Vietnamese)", "Birmingham", "AL", "full_feature",
    "Hoover", "1580 Montgomery Hwy, Hoover, AL 35216",
    "Popular spot for authentic Vietnamese pho alongside Asian fusion dishes like Japanese takoyaki. Represents the vibrant Vietnamese community in Birmingham. Steaming bowls highlight cultural blending."),

  biz("Falafel Cafe", "Restaurant", "Middle Eastern-owned", "Birmingham", "AL", "full_feature",
    "Southside / UAB Area", "401 19th St S, Birmingham, AL 35233",
    "Highly-rated, fast-casual spot known for fantastic, authentic falafel, shawarma, and fresh pitas. Staple for the local Middle Eastern community and university students. Highlights accessible Middle Eastern cuisine."),

  biz("Epice", "Restaurant", "Middle Eastern-owned (Lebanese)", "Birmingham", "AL", "full_feature",
    "Lakeview District", "2308 1st Ave S, Birmingham, AL 35233",
    "Charming neighborhood bistro serving authentic Lebanese foods at moderate prices. Offers an upscale, beautifully designed environment showcasing the refined side of Lebanese culinary traditions."),

  // ============================================================
  // MOBILE, AL — Full Feature
  // ============================================================
  biz("Sweet Pepper Caribbean Restaurant", "Restaurant", "Caribbean-owned (Jamaican)", "Mobile", "AL", "full_feature",
    "West Mobile", "Mobile, AL",
    "Beloved local spot serving authentic Jamaican and Caribbean cuisine including jerk chicken, oxtails, and curries. Known for vibrant flavors and welcoming atmosphere. A cultural staple for the local diaspora."),

  biz("Jamaican Vibes Restaurant", "Restaurant", "Jamaican-owned", "Mobile", "AL", "full_feature",
    "South Mobile", "3700 Government Blvd Ste A, Mobile, AL 36693",
    "Wide menu of traditional Jamaican meals, patties, and made-to-order dishes. Popular for both dine-in and takeout. Known for authentic 'vibes' and flavors. Strong community presence."),

  biz("Slurp Society Asian Eats & Drinks", "Restaurant", "Asian-owned", "Mobile", "AL", "full_feature",
    "Downtown Mobile", "609 Dauphin St, Mobile, AL 36602",
    "Trendy downtown spot serving Asian street food with a Southern twist, specializing in ramen and unique Asian-inspired drinks. Represents the modern Asian diaspora blending traditional and local influences."),

  biz("Liti Pho Vietnamese Restaurant", "Restaurant", "Vietnamese-owned", "Mobile", "AL", "full_feature",
    "West Mobile", "Mobile, AL",
    "Cozy restaurant offering authentic Vietnamese comfort food including traditional pho, banh mi, and specialty drinks like Mango Coconut Cream Matcha Lattes. Highlights the Vietnamese community in Mobile."),

  biz("African Market (Sahara Supermarket)", "Grocery Store / Market", "West African-owned", "Mobile", "AL", "full_feature",
    "Midtown / South Mobile", "18 A South Sage Ave, Mobile, AL 36606",
    "Retail establishment offering a wide variety of African-inspired products, groceries, clothing, and accessories. Essential hub for the local African diaspora to find familiar goods and connect."),

  biz("Jerusalem Cafe", "Restaurant", "Middle Eastern-owned", "Mobile", "AL", "full_feature",
    "West Mobile", "4715 Airport Blvd Ste 330, Mobile, AL 36608",
    "Mobile's first Middle Eastern restaurant offering authentic shawarma, falafel, and hummus. As a pioneer of Middle Eastern cuisine in the city, it has a great backstory and serves as a cultural pillar."),

  biz("Texas de Brazil (Mobile)", "Restaurant", "Brazilian-owned", "Mobile", "AL", "full_feature",
    "Mobile", "Mobile, AL",
    "Upscale Brazilian steakhouse offering authentic churrascaria experience with various meats carved tableside and a gourmet salad area. Brings the communal dining style of Brazil to Mobile."),

  biz("Hacienda San Miguel (House of Tequila)", "Restaurant / Bar", "Hispanic/Mexican-owned", "Mobile", "AL", "full_feature",
    "West Mobile", "Mobile, AL",
    "Lively Mexican restaurant and tequila bar known for authentic food, extensive drink menu, and vibrant atmosphere. Highly popular locally owned Hispanic business that serves as a community gathering place."),

  biz("Storylight Books", "Bookstore", "Black-owned", "Mobile", "AL", "full_feature",
    "Mobile", "Mobile, AL",
    "Newly opened Black-owned bookstore specializing in romance and fantasy. Provides a curated selection of books and a welcoming space for readers. An important intellectual and cultural representation."),

  biz("Los Rancheros Mexican Restaurant", "Restaurant", "Hispanic/Mexican-owned", "Mobile", "AL", "full_feature",
    "West Mobile", "3662F Airport Blvd, Mobile, AL 36608",
    "One of the first Mexican restaurants to open in the area, offering traditional Mexican cuisine in a family-friendly setting. Legacy and deep roots as an original Mexican restaurant in Mobile."),

  biz("Sam's Banh Mi Cafe", "Restaurant / Cafe", "Vietnamese-owned", "Mobile", "AL", "full_feature",
    "West Mobile", "Mobile, AL",
    "Newly opened cafe specializing in authentic Vietnamese Banh Mi sandwiches and traditional comfort foods. Represents the growing and evolving Vietnamese culinary scene in Mobile."),

  biz("La Mexicana Supermarket", "Grocery Store / Bakery", "Hispanic/Mexican-owned", "Mobile", "AL", "full_feature",
    "Mobile", "Mobile, AL",
    "Local supermarket and bakery offering authentic Mexican groceries, fresh produce, and traditional baked goods (pan dulce). Authentic look into the daily lives and culinary traditions of the Hispanic community."),

  biz("Pot Au Pho Vietnamese Restaurant", "Restaurant", "Vietnamese-owned", "Mobile", "AL", "full_feature",
    "Mobile", "Mobile, AL",
    "Highly-rated local spot known for authentic and comforting bowls of pho and other traditional Vietnamese dishes. Recognized locally for authenticity, great representation of the Vietnamese diaspora."),

  biz("Bariachi Mexican Kitchen", "Restaurant", "Hispanic/Mexican-owned", "Mobile", "AL", "full_feature",
    "Midtown Mobile", "Mobile, AL",
    "Midtown Mobile's newest Mexican restaurant offering authentic food and drinks in a neighborhood setting designed for community gathering. Focus on being a neighborhood pillar celebrating Hispanic culture."),

  biz("El Rincon Latino", "Restaurant", "Hispanic-owned", "Mobile", "AL", "full_feature",
    "Mobile", "1956 S University Blvd, Mobile, AL",
    "Local favorite serving authentic Hispanic food specializing in tacos and margaritas. Vibrant, authentic dining experience deeply appreciated by the local community."),

  // ============================================================
  // BATON ROUGE, LA — Full Feature
  // ============================================================
  biz("The Chicken Shack", "Restaurant", "Black-owned", "Baton Rouge", "LA", "full_feature",
    "Mid City / North Baton Rouge", "413 N Acadian Thruway, Baton Rouge, LA 70806",
    "Historic staple in Baton Rouge since 1935, famous for fried chicken and classic Southern sides. One of the oldest continuously operating Black-owned businesses in the city. Incredible multi-generational history."),

  biz("Monarch Books", "Bookstore", "Black-owned", "Baton Rouge", "LA", "full_feature",
    "Downtown Baton Rouge", "Baton Rouge, LA",
    "Baton Rouge's premier Black-owned independent bookstore run by a mother-daughter duo. Focus on diverse literature and community events. Great story of family entrepreneurship and culturally significant space."),

  biz("Smoke Bayou", "Restaurant", "Black-owned", "Baton Rouge", "LA", "full_feature",
    "Mid City", "4310 Florida Blvd, Baton Rouge, LA 70806",
    "Highly-rated local BBQ joint known for smoked meats, boudin, and flavorful sides. Authentic local flavor deeply appreciated by the community with great visual appeal for food shots."),

  biz("Sazon Latin Grill", "Restaurant", "Colombian/Cuban-owned", "Baton Rouge", "LA", "full_feature",
    "Shenandoah / O'Neal", "1230 O'Neal Ln Suite 4, Baton Rouge, LA 70816",
    "Family-owned business offering authentic Cuban and Colombian flavors including Cuban bowls, black beans, sweet plantains, and slow-roasted meats. Represents the blending of two distinct Latin cultures."),

  biz("Mi Tierra (Baton Rouge)", "Restaurant", "Latin American (Honduran/Central American)", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "13213 Perkins Rd, Baton Rouge, LA 70810",
    "Welcoming Latin American restaurant serving authentic dishes from Central America and beyond. Highlights the growing Central American community in Baton Rouge."),

  biz("La Carreta", "Restaurant", "Mexican-owned", "Baton Rouge", "LA", "full_feature",
    "Mid City", "4065 Government St, Baton Rouge, LA 70806",
    "Vibrant, popular Mexican restaurant known for excellent food, margaritas, and welcoming atmosphere. A staple in the Mid City neighborhood with great visual appeal and lively community vibe."),

  biz("The Bullfish Bistro", "Restaurant", "Caribbean-owned", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "4001 Nicholson Dr, Baton Rouge, LA 70808",
    "Offers some of the best Caribbean food in Baton Rouge — jerk chicken, oxtails, and plantains. Authentic Caribbean flavors highly rated and representing island culture in Louisiana."),

  biz("Alliance Brazilian Supermarket", "Grocery Store / Market", "Brazilian-owned", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "Baton Rouge, LA",
    "Local market offering authentic Brazilian groceries, meats, and specialty items. Provides a unique look into the Brazilian diaspora's daily life and culinary staples."),

  biz("Dang's Vietnamese Restaurant", "Restaurant", "Vietnamese-owned", "Baton Rouge", "LA", "full_feature",
    "Florida Blvd Area", "12385 Florida Blvd, Baton Rouge, LA 70815",
    "Beloved local spot for authentic Vietnamese pho, banh mi, and other traditional dishes. Represents the strong Vietnamese community in Louisiana offering authentic and comforting cuisine."),

  biz("Bao Vietnamese Kitchen", "Restaurant", "Vietnamese-owned", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "8342 Perkins Rd, Baton Rouge, LA 70810",
    "Modern take on traditional Vietnamese street food and family recipes. Great visual appeal with modern aesthetic while maintaining cultural authenticity."),

  biz("Al Shami", "Restaurant", "Middle Eastern-owned (Syrian/Levantine)", "Baton Rouge", "LA", "full_feature",
    "Baton Rouge", "Baton Rouge, LA",
    "Authentic Levantine favorites: chicken shawarma, beef tikka, grilled liver, and kibbeh. A new addition to the city's culinary scene showcasing authentic Levantine cuisine."),

  biz("A Z International Fine Foods", "Grocery Store / Market", "Middle Eastern-owned", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "11224 Florida Blvd, Baton Rouge, LA 70815",
    "Well-stocked international market specializing in Middle Eastern groceries, spices, and halal meats. Community hub for the Middle Eastern diaspora to find tastes of home."),

  biz("Yori African Restaurant", "Restaurant", "West African-owned", "Baton Rouge", "LA", "full_feature",
    "Baton Rouge", "Baton Rouge, LA",
    "Authentic West African cuisine bringing bold flavors and traditional dishes to the city. Represents the West African diaspora offering a unique culinary experience not commonly found in the area."),

  biz("Diversity Kitchen", "Restaurant", "West African-owned", "Baton Rouge", "LA", "full_feature",
    "Baton Rouge", "Baton Rouge, LA",
    "Known for authentic West African food featuring traditional stews and fufu. Authentic, unpretentious, and deeply rooted in West African culinary traditions."),

  biz("Mestizo Louisiana Mexican Cuisine", "Restaurant", "Mixed (Mexican and Cajun-French)", "Baton Rouge", "LA", "full_feature",
    "South Baton Rouge", "2323 S Acadian Thruway, Baton Rouge, LA 70808",
    "Locally owned restaurant blending Mexican cuisine with local Cajun-French influences. Perfect example of cultural blending representing the intersection of the diaspora with Louisiana culture."),

  // ============================================================
  // NEW ORLEANS, LA — Full Feature
  // ============================================================
  biz("Dooky Chase's Restaurant", "Restaurant", "Black-owned (Creole)", "New Orleans", "LA", "full_feature",
    "Tremé", "2301 Orleans Ave, New Orleans, LA 70119",
    "Historic landmark famous for authentic Creole cuisine including gumbo, fried chicken, and stuffed shrimp. Also houses an impressive collection of African American art. Crucial meeting place during Civil Rights Movement."),

  biz("Baldwin & Co.", "Bookstore and Coffee Shop", "Black-owned", "New Orleans", "LA", "full_feature",
    "Marigny", "1030 Elysian Fields Ave, New Orleans, LA 70117",
    "Named after James Baldwin. Independent bookstore and coffee shop celebrating literature, particularly Black authors and diverse voices. Modern intellectual and cultural hub with community events."),

  biz("Heard Dat Kitchen", "Restaurant", "Black-owned", "New Orleans", "LA", "full_feature",
    "Central City", "2520 Felicity St, New Orleans, LA 70113",
    "Popular neighborhood spot known for creative and hearty takes on classic New Orleans soul food. The 'Superdome' (mac and cheese topped with blackened fish and crawfish sauce) represents authentic culinary innovation."),

  biz("14 Parishes Jamaican Restaurant", "Restaurant", "Jamaican-owned", "New Orleans", "LA", "full_feature",
    "Uptown / Oak Street", "8227 Oak St, New Orleans, LA 70118",
    "Family-owned restaurant offering authentic Jamaican dishes — jerk chicken, oxtails, curried goat — prepared by Head Chef Charles Blake. Brings the vibrant flavors of Jamaica to New Orleans."),

  biz("Boswell's Jamaican Grill", "Restaurant", "Jamaican-owned", "New Orleans", "LA", "full_feature",
    "Mid-City", "3521 Tulane Ave, New Orleans, LA 70119",
    "Long-standing spot serving generous portions of traditional Jamaican comfort food including patties, plantains, and jerk dishes. A staple for the local Caribbean community offering genuine island taste."),

  biz("Addis NOLA", "Restaurant", "Ethiopian-owned", "New Orleans", "LA", "full_feature",
    "Bayou Road", "2514 Bayou Rd, New Orleans, LA 70119",
    "Award-winning, family-owned Ethiopian restaurant on historic Bayou Road. Traditional dishes on injera with traditional coffee ceremonies. Deep dive into East African culture, visually and culturally rich."),

  biz("Cafe Abyssinia", "Restaurant", "Ethiopian-owned", "New Orleans", "LA", "full_feature",
    "Uptown", "3511 Magazine St, New Orleans, LA 70115",
    "Cozy, unassuming cafe serving authentic Ethiopian stews and vegetarian dishes. One of the first Ethiopian restaurants in the city. Quiet, authentic cultural experience on bustling Magazine Street."),

  biz("Acamaya", "Restaurant", "Mexican-owned", "New Orleans", "LA", "full_feature",
    "Bywater", "3070 Dauphine St, New Orleans, LA 70117",
    "Contemporary Mexican seafood restaurant offering fresh, innovative takes on coastal Mexican cuisine. Highlights the modern, elevated side of Mexican cuisine moving beyond traditional Tex-Mex."),

  biz("La Patrona", "Restaurant", "Latino-owned (LGBTQ+ friendly)", "New Orleans", "LA", "full_feature",
    "Broadmoor / Mid-City", "New Orleans, LA",
    "Authentic Mexican food spot positioning itself as a community gathering place. Traditional tacos, tamales, and more. Explicitly inclusive, Latino-owned and LGBTQ+ friendly, representing intersectional diversity."),

  biz("Mais Arepas", "Restaurant", "Colombian-owned", "New Orleans", "LA", "full_feature",
    "Central City / Lower Garden District", "1200 Carondelet St, New Orleans, LA 70130",
    "Highly-rated eatery specializing in traditional Colombian arepas stuffed with a variety of meats, cheeses, and plantains. Introduces users to specific South American street food culture."),

  biz("Dong Phuong Bakery & Restaurant", "Bakery and Restaurant", "Vietnamese-owned", "New Orleans", "LA", "full_feature",
    "New Orleans East", "14207 Chef Menteur Hwy, New Orleans, LA 70129",
    "James Beard Award-winning bakery known for incredible banh mi bread, traditional Vietnamese pastries, and famous King Cakes. The Vietnamese community is a massive part of New Orleans' modern cultural fabric."),

  biz("Saffron NOLA", "Restaurant", "Indian-owned", "New Orleans", "LA", "full_feature",
    "New Orleans", "New Orleans, LA",
    "Modern Indian restaurant bringing elevated South Asian cuisine to New Orleans. Represents the Indian diaspora in a city known for its diverse, layered culinary heritage."),

  // ============================================================
  // HOUSTON, TX — Full Feature
  // ============================================================
  biz("The Greasy Spoon", "Restaurant", "Black-owned", "Houston", "TX", "full_feature",
    "North Houston", "636 Cypress Station Dr, Houston, TX 77090",
    "Popular soul food restaurant known for elevated comfort food including oxtails, mac and cheese, and greens. A community staple with a great story of resilience and culinary excellence."),

  biz("Kindred Stories", "Bookstore", "Black-owned", "Houston", "TX", "full_feature",
    "Third Ward", "2304 Stuart St, Houston, TX 77004",
    "Independent bookstore celebrating Black authors and creators. Curated selection of books with community events. A cultural hub in the historic Third Ward promoting literacy and Black voices."),

  biz("Cielito Cafe", "Cafe / Restaurant", "Mexican-owned", "Houston", "TX", "full_feature",
    "Montrose", "1915 Dunlavy St, Houston, TX 77006",
    "Cozy cafe offering authentic Mexican breakfast and brunch items including chilaquiles and cafe de olla. Visually charming with a strong cultural identity and warm, authentic Mexican culinary experience."),

  biz("Treats of Mexico", "Candy Store / Market", "Mexican-owned", "Houston", "TX", "full_feature",
    "East End", "724 Telephone Rd, Houston, TX 77023",
    "Vibrant shop offering a wide variety of authentic Mexican candies, snacks, and piñatas. A colorful and nostalgic spot that perfectly captures the essence of Mexican sweet treats and culture."),

  biz("Lucy Ethiopian Restaurant & Lounge", "Restaurant", "Ethiopian-owned", "Houston", "TX", "full_feature",
    "Sharpstown", "6800 Southwest Fwy, Houston, TX 77074",
    "Family-owned restaurant offering traditional Ethiopian dishes served on injera with a welcoming lounge atmosphere. One of the most well-known Ethiopian spots in Houston with communal dining experience."),

  biz("Bahel Ethiopian Mart", "Market / Restaurant", "Ethiopian-owned", "Houston", "TX", "full_feature",
    "Gulfton", "6509 Chimney Rock Rd, Houston, TX 77081",
    "Combination market and restaurant offering fresh, homemade Ethiopian dishes and imported goods. Dual experience of dining and shopping for authentic Ethiopian ingredients, deeply rooted in the local community."),

  biz("Reggae Hut", "Restaurant", "Caribbean-owned (Jamaican)", "Houston", "TX", "full_feature",
    "Third Ward", "4814 Almeda Rd, Houston, TX 77004",
    "Long-standing spot in the Third Ward serving classic Jamaican dishes like jerk chicken, patties, and plantains. A historic and beloved institution in Houston's Caribbean community."),

  biz("Emporio Brazilian Grill", "Restaurant / Market", "Brazilian-owned", "Houston", "TX", "full_feature",
    "Westchase", "12288 Westheimer Rd, Houston, TX 77077",
    "Authentic Brazilian grill and market offering traditional dishes, baked goods, and imported Brazilian products. One-stop shop for Brazilian culture combining restaurant, bakery, and market."),

  biz("ChopnBlok", "Restaurant", "West African-owned", "Houston", "TX", "full_feature",
    "Downtown / POST Houston", "401 Franklin St, Houston, TX 77201",
    "Fast-casual restaurant offering contemporary West African cuisine including jollof rice and plantains in a modern setting. Fresh, modern take on West African food in a trendy food hall."),

  biz("Afrikiko Restaurant", "Restaurant", "West African-owned (Ghanaian)", "Houston", "TX", "full_feature",
    "Southwest Houston", "9625 Bissonnet St, Houston, TX 77036",
    "Traditional restaurant serving authentic Ghanaian and West African dishes like fufu, waakye, and peanut soup. Deeply authentic spot that serves as a gathering place for Houston's West African diaspora."),

  biz("Ishtia", "Restaurant", "Indigenous-owned (Choctaw)", "Houston", "TX", "full_feature",
    "Kemah (Greater Houston)", "609 Bradford Ave, Kemah, TX 77565",
    "Unique dining experience offering modern interpretations of indigenous cuisine led by a Choctaw chef. Rare and exceptional representation of indigenous culinary traditions offering a profound cultural experience."),

  biz("Cloud Chief & Co.", "Retail / Jewelry", "Native American-owned", "Houston", "TX", "full_feature",
    "Various / Pop-ups", "Houston, TX",
    "Store offering authentic, handcrafted Native American jewelry and goods from various tribes. Highlights authentic indigenous craftsmanship and artistry, providing a platform for Native artisans."),

  biz("Day 6 Coffee Co.", "Coffee Shop", "Asian/Black-owned (Mixed Diaspora)", "Houston", "TX", "full_feature",
    "Downtown", "910 Prairie St, Houston, TX 77002",
    "Unique coffee shop blending Vietnamese coffee traditions with a modern, inclusive community vibe. A beautiful representation of mixed diaspora and cultural blending, offering unique drinks."),

  biz("Al Aseel Grill & Cafe", "Restaurant", "Middle Eastern-owned (Palestinian)", "Houston", "TX", "full_feature",
    "Westchase", "8619 Richmond Ave, Houston, TX 77063",
    "Popular spot known for authentic Palestinian and Middle Eastern dishes, particularly famous fried chicken and mansaf. A beloved community fixture offering incredible, authentic flavors."),

  biz("Phoenicia Specialty Foods", "Market / Grocery", "Middle Eastern-owned (Lebanese)", "Houston", "TX", "full_feature",
    "Downtown", "1001 Austin St, Houston, TX 77010",
    "Massive international market offering a vast array of Middle Eastern and global foods with an in-house bakery and deli. An iconic Houston institution showcasing the diversity of global and Middle Eastern cuisine."),

  // ============================================================
  // ALLENTOWN, PA — Satellite (under Philadelphia)
  // ============================================================
  biz("Las Palmas Restaurant", "Restaurant", "Hispanic-owned", "Allentown", "PA", "satellite",
    "Allentown", "959 W Turner St, Allentown, PA",
    "Locally owned and family-run restaurant spotlighted during Hispanic Heritage Month. Owned by Ana & Santiago Pena, serving authentic Latin American cuisine.",
    "Philadelphia"),

  biz("Braza & Candela", "Restaurant", "Latin American-owned", "Allentown", "PA", "satellite",
    "Allentown", "Allentown, PA",
    "Highly rated Latin restaurant in Allentown known for its vibrant flavors and cultural authenticity.",
    "Philadelphia"),

  biz("La Placita Mexico", "Restaurant / Deli", "Mexican-owned", "Allentown", "PA", "satellite",
    "Allentown", "Allentown, PA",
    "Popular spot for authentic Mexican cuisine contributing to the diverse culinary landscape of Allentown.",
    "Philadelphia"),

  biz("This Life Forever", "Distillery", "Black-owned", "Allentown", "PA", "satellite",
    "Allentown", "Allentown, PA",
    "Pennsylvania's first Black-owned distillery producing vodka and making national moves in the spirits industry.",
    "Philadelphia"),

  biz("GQ'S Soul Kitchen", "Restaurant", "Black-owned", "Allentown", "PA", "satellite",
    "Allentown", "Allentown, PA 18103",
    "Highly-rated local food stand offering soul food and contributing to the diverse culinary scene in Allentown.",
    "Philadelphia"),

  biz("Ayat", "Restaurant", "Middle Eastern-owned (Palestinian)", "Allentown", "PA", "satellite",
    "Allentown", "1243 W Tilghman Street, Allentown, PA 18102",
    "Michelin Guide-featured Palestinian restaurant that has expanded to Allentown, serving authentic Middle Eastern cuisine.",
    "Philadelphia"),

  biz("Sahara Mediterranean Cuisine", "Restaurant", "Middle Eastern / Greek-owned", "Allentown", "PA", "satellite",
    "Allentown", "5661 Hamilton Blvd, Allentown, PA",
    "Family-run restaurant offering authentic Greek and Middle Eastern dishes, highly rated by the local community.",
    "Philadelphia"),

  biz("Elias Market", "Grocery Store", "Middle Eastern-owned", "Allentown", "PA", "satellite",
    "Allentown", "Allentown, PA",
    "Popular local market providing Middle Eastern groceries, fresh produce, and specialty items to the community.",
    "Philadelphia"),

  biz("Rice Family", "Restaurant", "Asian-owned (Japanese/Asian Fusion)", "Allentown", "PA", "satellite",
    "Allentown", "2952 Lehigh St, Allentown, PA 18103",
    "Asian-owned restaurant offering Japanese and Asian fusion cuisine in a repurposed location in Allentown.",
    "Philadelphia"),

  // ============================================================
  // ABINGTON / WILLOW GROVE, PA — Satellite (Founder's Hometown, under Philadelphia)
  // ============================================================
  biz("Philly Shared", "Retail Showroom / Boutique", "Black-owned / Minority-owned collective", "Willow Grove", "PA", "satellite",
    "Willow Grove Park Mall", "2500 W Moreland Rd Level 1, Willow Grove, PA 19090",
    "Shared retail space founded by Annette Kennedy-Harris and Christin Austin-Evans. Provides a storefront for minority-owned small businesses including Nature's Love Organics and MarkEscric.",
    "Philadelphia"),

  biz("I SAW Visions", "Arts and Culture Boutique", "Black-owned / Minority-owned collective", "Willow Grove", "PA", "satellite",
    "Upper Moreland / Willow Grove", "York Road area, Willow Grove, PA",
    "Founded by Sharia Wallace, a one-stop-shop to support local businesses. Features products from 60+ artisans and artists, 95% minority-owned. Offers all-natural hair care, crocheted dolls, and multicultural artwork.",
    "Philadelphia"),

  biz("Duke's Cafe", "Restaurant", "Black-owned", "Willow Grove", "PA", "satellite",
    "Willow Grove", "Willow Grove, PA",
    "Highly-rated local cafe known for its welcoming atmosphere and community presence.",
    "Philadelphia"),

  biz("Aunt Vonda's Kitchen Table", "Restaurant", "Black-owned", "Willow Grove", "PA", "satellite",
    "Willow Grove", "Willow Grove, PA",
    "Local favorite offering comfort food and a strong sense of community connection.",
    "Philadelphia"),

  biz("Seven Seas Mediterranean Seafood", "Restaurant", "Middle Eastern / Mediterranean-owned", "Willow Grove", "PA", "satellite",
    "Willow Grove", "Near Willow Grove Park Mall, Willow Grove, PA",
    "Popular dining spot offering Mediterranean cuisine, reflecting the area's diverse culinary landscape.",
    "Philadelphia"),

  // ============================================================
  // HARRISBURG, PA — Satellite (Founder's Connection, under Philadelphia)
  // ============================================================
  biz("Diaspora Sustainable Living", "Retail / Wellness", "Black-owned", "Harrisburg", "PA", "satellite",
    "Inside Broad Street Market", "1233 N 3rd St, Harrisburg, PA 17102",
    "Family-run business offering sustainable, culturally rooted wellness and lifestyle products. Highlights the intersection of Black entrepreneurship and environmental sustainability.",
    "Philadelphia"),

  biz("Marie's Kitchen Haitian Cuisine", "Restaurant", "Caribbean-owned (Haitian)", "Harrisburg", "PA", "satellite",
    "Inside Broad Street Market", "1233 N 3rd St, Harrisburg, PA 17102",
    "Brings authentic Haitian flair to the capital region, serving up traditional island comfort food. Represents the Caribbean diaspora in Central PA.",
    "Philadelphia"),

  biz("Tacos Mi Tierra", "Restaurant", "Mexican-owned", "Harrisburg", "PA", "satellite",
    "Allison Hill", "1416 Derry St, Harrisburg, PA 17104",
    "Beloved Allison Hill hidden gem serving highly authentic Mexican street tacos (al pastor, carne asada). A true neighborhood staple highlighting the vibrant working-class Hispanic culture of Allison Hill.",
    "Philadelphia"),

  biz("Julie's African Caribbean & Continental Restaurant", "Restaurant", "West African / Caribbean-owned", "Harrisburg", "PA", "satellite",
    "Harrisburg", "425 S Cameron St, Harrisburg, PA 17101",
    "Fusion of authentic African and Caribbean comfort foods serving as a culinary bridge between diaspora communities. Perfect representation of mixed-diaspora culinary traditions.",
    "Philadelphia"),

  biz("Cidra's Cabana Restaurant", "Restaurant", "Hispanic-owned (Dominican & Puerto Rican)", "Harrisburg", "PA", "satellite",
    "Allison Hill", "1716 Derry St, Harrisburg, PA 17104",
    "Vibrant, beach-themed restaurant serving authentic Dominican and Puerto Rican home cooking from oxtail to roast pork. A major community meeting place in Allison Hill representing unity and cultural identity.",
    "Philadelphia"),

  biz("Halaal Restaurant", "Restaurant", "West African-owned", "Harrisburg", "PA", "satellite",
    "Allison Hill", "138 S 13th St, Harrisburg, PA 17104",
    "Long-standing takeout spot catering to the African community. Serves from-scratch halal meats, fufu, and traditional soups. Showcases the dietary and cultural traditions of the West African and Muslim diaspora.",
    "Philadelphia"),

  biz("Capow Jamaican Restaurant", "Restaurant", "Caribbean-owned (Jamaican)", "Harrisburg", "PA", "satellite",
    "Allison Hill", "1403 Market St, Harrisburg, PA 17104",
    "Tiny, highly popular spot known for selling out of its authentic jerk chicken and oxtail daily. A classic 'hole-in-the-wall' success story built on incredible food and word-of-mouth in a diverse neighborhood.",
    "Philadelphia"),

  biz("Nyianga Store", "Fashion / Retail", "West African-owned (Cameroon)", "Harrisburg", "PA", "satellite",
    "Harrisburg", "1423 N 3rd St, Harrisburg, PA 17102",
    "Beautiful boutique where 'fashion meets nature,' offering authentic Cameroonian and African apparel and accessories. Expands the business features beyond food into diaspora fashion and retail.",
    "Philadelphia"),

  // ============================================================
  // CHICOPEE / SPRINGFIELD, MA — Satellite (Founder's Connection)
  // ============================================================
  biz("Flame On Vegan", "Restaurant", "Black-owned", "Chicopee", "MA", "satellite",
    "Chicopee", "57 Springfield St, Chicopee, MA 01013",
    "Founded by Khesahn Reid and Nina Ortiz. Serves incredible vegan comfort food and is highly active in giving back to the local community. A shining example of Black entrepreneurship in the wellness/vegan space.",
    "Springfield"),

  biz("Hazel's Kitchen", "Restaurant", "Black-owned", "Chicopee", "MA", "satellite",
    "Chicopee", "76 Main St, Chicopee, MA 01020",
    "Beloved local eatery serving hearty, soulful comfort food to the Chicopee community. A classic neighborhood staple representing the Black culinary presence in a predominantly white/Hispanic area.",
    "Springfield"),

  biz("El Comalito", "Restaurant", "Hispanic-owned (Mexican & Salvadoran)", "Chicopee", "MA", "satellite",
    "Amherst / Easthampton area", "Serving Chicopee/Springfield area, MA",
    "Highly regarded for authentic Mexican and Salvadoran cuisine, particularly pupusas. Highlights the Central American diaspora presence in the Pioneer Valley.",
    "Springfield"),

  biz("Bernardino's Bakery", "Bakery", "Hispanic/Portuguese-owned", "Chicopee", "MA", "satellite",
    "Chicopee", "Chicopee, MA 01014",
    "Long-standing local bakery providing fresh breads and cultural staples to the community. Represents the deep-rooted, multi-generational immigrant food businesses in the city.",
    "Springfield"),

  biz("Solid Gold Beauty Palace", "Salon / Beauty", "Black-owned", "Chicopee", "MA", "satellite",
    "Springfield / Chicopee", "Springfield/Chicopee area, MA",
    "Owned by Lucille Kennedy, described as 'therapy' and a safe haven for Black women. Hair salons are crucial cultural hubs; this one highlights the importance of beauty spaces as community pillars.",
    "Springfield"),

  biz("Olive Tree Books and Voices", "Bookstore", "Black-owned", "Springfield", "MA", "satellite",
    "Springfield", "97 Hancock St, Springfield, MA 01109",
    "Owned by Zee Johnson. Focuses on Black history, authors, and local entrepreneurs, sparking 'awakenings' for visitors. A vital educational and cultural resource for the entire Western Mass region.",
    "Springfield"),

  biz("White Lion Brewing Company", "Brewery", "Black-owned", "Springfield", "MA", "satellite",
    "Springfield", "1477 Main St, Springfield, MA 01103",
    "Highly successful, pioneering Black-owned craft brewery in Western Massachusetts. Breaks the mold of traditional food businesses, showing diverse entrepreneurship in the craft beer industry.",
    "Springfield"),

  biz("D & G Jamaican Cuisine", "Restaurant", "Caribbean-owned (Jamaican)", "Springfield", "MA", "satellite",
    "Springfield", "5 Preston St, Springfield, MA",
    "A go-to spot for authentic Jamaican dishes like curry goat and jerk chicken in the Western Mass area. Represents the vibrant Caribbean diaspora in the region.",
    "Springfield"),
];

async function seedTourGuideBusinesses() {
  console.log(`\n🗺️  MWM Tour Guide Seed — ${BUSINESSES.length} businesses\n`);

  const asian = BUSINESSES.filter((b) => !b.launchEnabled);
  const visible = BUSINESSES.filter((b) => b.launchEnabled);
  console.log(`  ✅ Launch enabled (visible): ${visible.length}`);
  console.log(`  🔒 Launch disabled (Asian/PI — hidden): ${asian.length}`);
  console.log(`\n  Hidden businesses:`);
  asian.forEach((b) => console.log(`     • ${b.name} (${b.diasporaCommunity}) — ${b.city}, ${b.state}`));
  console.log();

  // Clear existing tour guide data
  await pool.query("DELETE FROM tour_guide_businesses");
  console.log("  🗑️  Cleared existing tour guide businesses");

  let inserted = 0;
  for (const b of BUSINESSES) {
    await pool.query(
      `INSERT INTO tour_guide_businesses
         (name, business_type, diaspora_community, city, state, city_type, parent_hub_city,
          neighborhood, address, description, launch_enabled)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        b.name,
        b.businessType,
        b.diasporaCommunity,
        b.city,
        b.state,
        b.cityType,
        b.parentHubCity ?? null,
        b.neighborhood ?? null,
        b.address ?? null,
        b.description,
        b.launchEnabled,
      ]
    );
    inserted++;
  }

  console.log(`\n  ✨ Inserted ${inserted} tour guide businesses into database`);

  // Summary by city
  console.log("\n  📍 By city:");
  const cities: Record<string, { total: number; hidden: number }> = {};
  for (const b of BUSINESSES) {
    const key = `${b.city}, ${b.state}`;
    if (!cities[key]) cities[key] = { total: 0, hidden: 0 };
    cities[key].total++;
    if (!b.launchEnabled) cities[key].hidden++;
  }
  for (const [city, counts] of Object.entries(cities)) {
    const hiddenNote = counts.hidden > 0 ? ` (${counts.hidden} hidden)` : "";
    console.log(`     ${city}: ${counts.total}${hiddenNote}`);
  }

  console.log("\n  ✅ Seed complete!\n");
  await pool.end();
}

seedTourGuideBusinesses().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
