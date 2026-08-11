/**
 * LA Diaspora Comprehensive Seed — every community that calls Los Angeles home.
 * Mexican, Guatemalan, Salvadoran, Filipino, Korean, Armenian, Persian, Ethiopian,
 * Nigerian, Caribbean, Brazilian, South American, South Asian, Vietnamese,
 * Middle Eastern, and additional Black American institutions.
 */
import { SeedBiz } from "./coverage-expansion.js";

export const LA_DIASPORA_V1: SeedBiz[] = [

  // ═══════════════════════════════════════════════════════════
  // MEXICAN / CHICANO — Boyle Heights, East LA, South LA, Inglewood
  // ═══════════════════════════════════════════════════════════
  {
    name: "El Tepeyac Café",
    description: "A Boyle Heights legend since 1952, El Tepeyac serves the largest burritos in Los Angeles and has fed the community through every era of the neighborhood's story. Founded by Manuel Rojas, this three-generation family restaurant is as much a cultural landmark as it is a meal.",
    category: "Food", subcategory: "Mexican",
    address: "812 N Evergreen Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0481, lng: -118.2017, website: "https://manuelseltepeyac.com",
  },
  {
    name: "Guisados",
    description: "Born in Boyle Heights, Guisados has grown into one of the most celebrated taco destinations in Los Angeles while staying rooted in the Eastside community that made it. Each braised taco filling — from tinga to chuleta — is a home recipe elevated into something unforgettable.",
    category: "Food", subcategory: "Mexican Tacos",
    address: "2100 E César E Chávez Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0327, lng: -118.2019, website: "https://guisados.co",
  },
  {
    name: "La Serenata de Garibaldi",
    description: "One of the first Mexican restaurants in Los Angeles to reject Tex-Mex combination plates in favor of authentic regional Mexican cuisine — La Serenata opened in Boyle Heights in 1985 and changed how the city thought about Mexican food. A pioneer that proved the community deserved better.",
    category: "Food", subcategory: "Mexican Fine Dining",
    address: "1842 E 1st St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0481, lng: -118.2198,
  },
  {
    name: "La Victoria Bakery",
    description: "A beloved East LA panadería serving traditional Mexican sweet breads — conchas, cuernos, polvorones — baked fresh daily from generations-old recipes. One of the oldest Mexican bakeries on the Eastside, it remains a family anchor and neighborhood institution.",
    category: "Food", subcategory: "Mexican Bakery",
    address: "1422 E 7th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0409, lng: -118.2247,
  },
  {
    name: "Homeboy Industries",
    description: "Founded by Father Greg Boyle in 1988, Homeboy Industries is the largest gang intervention and rehabilitation program in the world — and runs a café, bakery, farmers market, and catering operation staffed entirely by former gang members and previously incarcerated men and women. Every purchase directly supports their path forward.",
    category: "Community Organizations", subcategory: "Social Enterprise",
    address: "130 W Bruno St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0717, lng: -118.2193, website: "https://homeboyindustries.org",
  },
  {
    name: "Homegirl Café",
    description: "The sister operation to Homeboy Industries — Homegirl Café is a full-service restaurant staffed by women who have overcome gangs, incarceration, and trauma, cooking regional Mexican food that feeds the body and the spirit. The food is as good as the mission is powerful.",
    category: "Food", subcategory: "Mexican Café",
    address: "130 W Bruno St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0717, lng: -118.2193,
  },
  {
    name: "El Mercadito",
    description: "A three-story indoor market in East LA that has been a hub of Mexican commerce, culture, and community since 1947. Dozens of vendors sell everything from cowboy boots and quinceañera dresses to fresh carnitas and aguas frescas. A living marketplace built by and for the community.",
    category: "Retail", subcategory: "Mexican Market",
    address: "3425 E Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0223, lng: -118.1788,
  },
  {
    name: "Coni'Seafood",
    description: "A family-run Mexican seafood restaurant in Inglewood serving some of the finest Nayarit-style ceviches, aguachiles, and whole fried fish in Los Angeles. Born from the Ruiz family's coastal hometown tradition, Coni'Seafood is the kind of hidden gem that regulars guard carefully.",
    category: "Food", subcategory: "Mexican Seafood",
    address: "3544 W Imperial Hwy", city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9575, lng: -118.3597,
  },
  {
    name: "Guelaguetza Restaurant",
    description: "The crown jewel of LA's Oaxacan diaspora — Guelaguetza has been serving Oaxacan mole negro, tlayudas, and mezcal in Koreatown since 1994. Founded by the López family from Oaxaca, this James Beard Award-recognized restaurant is one of the most important Mexican restaurants west of the Mississippi.",
    category: "Food", subcategory: "Oaxacan Mexican",
    address: "3014 W Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0537, lng: -118.2994, website: "https://ilovemole.com",
  },
  {
    name: "Birrieria Guadalajara",
    description: "A Boyle Heights institution serving Jalisco-style birria — deep red, slow-cooked goat and beef simmered in a broth of chiles and spices. Regulars line up on weekends for birria tacos soaked in consomé, a ritual that has anchored this community for decades.",
    category: "Food", subcategory: "Birria & Mexican",
    address: "3714 E 1st St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0401, lng: -118.1882,
  },
  {
    name: "Tamales Elena y Antojitos",
    description: "East LA's beloved tamale stand has been serving hand-wrapped tamales from family recipes for over three decades. From red pork to rajas con queso, each tamale carries the warmth and craft of a tradition passed from grandmother to daughter to grandchildren.",
    category: "Food", subcategory: "Tamales & Antojitos",
    address: "2822 Whittier Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0225, lng: -118.1850,
  },
  {
    name: "Lotería! Grill",
    description: "Jimmy Shaw's Lotería! Grill inside Grand Central Market has introduced downtown LA to authentic regional Mexican cooking for years — corn tortillas pressed fresh, mole crafted from dozens of ingredients, and Mexican street food elevated with care and respect for its origins.",
    category: "Food", subcategory: "Regional Mexican",
    address: "317 S Broadway", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0506, lng: -118.2488,
  },
  {
    name: "Corazon y Miel",
    description: "Highland Park's beloved Mexican-American restaurant from chef Eduardo Ruiz — a love letter to the flavors of his heritage, served in a neighborhood that has always had those roots. Bacon-wrapped dates, esquites, and a menu that celebrates Mexican-American food without apology.",
    category: "Food", subcategory: "Mexican American",
    address: "6626 N Figueroa St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.1068, lng: -118.2062,
  },
  {
    name: "El Ruso Burrito",
    description: "A Boyle Heights counter-service spot famous for burritos and quesadillas that fuel the neighborhood's workers, students, and families. Fast, generous, and deeply affordable — the kind of spot that only survives because the community keeps coming back.",
    category: "Food", subcategory: "Mexican Burritos",
    address: "2643 Wabash Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0293, lng: -118.1975,
  },
  {
    name: "CARECEN — Central American Resource Center",
    description: "One of the country's leading immigrant rights organizations, CARECEN has been serving Central American communities in Los Angeles since 1983. Legal services, workforce development, and advocacy for Salvadoran, Guatemalan, and Honduran families navigating the immigration system.",
    category: "Community Organizations", subcategory: "Immigrant Services",
    address: "1645 W Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0496, lng: -118.2710, website: "https://carecen-la.org",
  },
  {
    name: "Comunidad Primero — Pico Union Community Resource Center",
    description: "A neighborhood hub in the heart of Pico Union providing social services, ESL classes, and immigration support to the dense Central American and Mexican community in this gateway neighborhood. One of LA's most important frontline organizations serving working-class immigrant families.",
    category: "Community Organizations", subcategory: "Community Services",
    address: "1520 W Pico Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0486, lng: -118.2726,
  },

  // ═══════════════════════════════════════════════════════════
  // GUATEMALAN — Pico Union, MacArthur Park, Westlake
  // ═══════════════════════════════════════════════════════════
  {
    name: "Restaurant La Antigua Guatemala",
    description: "One of Los Angeles' few dedicated Guatemalan restaurants, serving pepián, kak'ik, and hilachas in the heart of Pico Union — a neighborhood where tens of thousands of Guatemalan families have built their lives. The food carries the flavors of Quetzaltenango and Guatemala City with pride.",
    category: "Food", subcategory: "Guatemalan",
    address: "2416 S Western Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0251, lng: -118.3086,
  },
  {
    name: "Guatemalan Maya Center",
    description: "A cultural and social services organization serving the large Guatemalan Maya community in Los Angeles, with particular focus on Indigenous Guatemalan communities whose first language is not Spanish. Language-accessible services, cultural events, and community advocacy.",
    category: "Community Organizations", subcategory: "Cultural Center",
    address: "7030 Tujunga Ave", city: "North Hollywood", state: "CA", country: "USA",
    lat: 34.1743, lng: -118.3680,
  },
  {
    name: "Ixim Mesoamerican Kitchen",
    description: "A small kitchen in the MacArthur Park area serving traditional Guatemalan street food — chuchitos, fiambre, and rellenitos — made by a family from Huehuetenango who brought their ancestral recipes to LA decades ago. One of the community's most trusted homestyle cooks.",
    category: "Food", subcategory: "Guatemalan Street Food",
    address: "2019 W 6th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0577, lng: -118.2802,
  },

  // ═══════════════════════════════════════════════════════════
  // SALVADORAN — Pico Union, MacArthur Park
  // ═══════════════════════════════════════════════════════════
  {
    name: "El Comal Salvadoreño",
    description: "A family-run Salvadoran kitchen in the MacArthur Park area serving handmade pupusas de loroco, curtido fresh from the barrel, and horchata made from scratch. Los Angeles has one of the largest Salvadoran populations outside San Salvador, and spots like El Comal are its culinary heart.",
    category: "Food", subcategory: "Salvadoran Pupusería",
    address: "2327 W 7th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0565, lng: -118.2819,
  },
  {
    name: "La Casita Salvadoreña",
    description: "Serving Salvadoran comfort food to the Pico Union community for over two decades — yuca frita, sopa de pata, tamales de elote, and pupusas made on the comal while you wait. A neighborhood anchor for families from Sonsonate to San Miguel who found a second home here.",
    category: "Food", subcategory: "Salvadoran",
    address: "1724 W Pico Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0499, lng: -118.2682,
  },
  {
    name: "SALVABUILD — Salvadoran Community Organization",
    description: "A community organization serving the Salvadoran diaspora of Los Angeles through workforce training, youth programs, and cultural preservation. Connects the community's deep roots in the Pico Union and Koreatown corridors with economic opportunities across the metro.",
    category: "Community Organizations", subcategory: "Cultural & Immigrant Services",
    address: "2201 W Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0511, lng: -118.2781,
  },

  // ═══════════════════════════════════════════════════════════
  // FILIPINO — Historic Filipinotown, Eagle Rock, North Hollywood
  // ═══════════════════════════════════════════════════════════
  {
    name: "Lasita Rotisserie",
    description: "LA's most celebrated Filipino restaurant has evolved from the Lasa pop-up into a Chinatown destination — now Lasita, serving rotisserie chicken lechon and natural wine in a space that honors Filipino culinary tradition through a modern lens. One of the most exciting diaspora kitchens in the city.",
    category: "Food", subcategory: "Filipino Rotisserie",
    address: "727 N Broadway #120", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0621, lng: -118.2363,
  },
  {
    name: "The Park's Finest",
    description: "A Fil-Am BBQ spot in Historic Filipinotown that blends the Southern low-and-slow tradition with Filipino flavors — ube-glazed ribs, garlic fried rice, and lumpia alongside brisket. Celebrating the community's hybrid American identity without apology.",
    category: "Food", subcategory: "Filipino American BBQ",
    address: "1267 W Temple St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0685, lng: -118.2714, website: "https://theparksfinest.com",
  },
  {
    name: "Barrio Fiesta",
    description: "A San Fernando Valley institution serving classic Filipino comfort food — kare-kare, sinigang, lechon kawali, and crispy pata — to a community that has built one of the largest Filipino populations in the United States right here in the Valley.",
    category: "Food", subcategory: "Filipino",
    address: "7138 Laurel Canyon Blvd", city: "North Hollywood", state: "CA", country: "USA",
    lat: 34.1808, lng: -118.3860,
  },
  {
    name: "Café 86",
    description: "A Filipino dessert café in Glendale famous for ube ice cream, halo-halo, and ensaymada that has introduced the flavors of the Philippines to the wider LA public while giving the Filipino community a gathering space that celebrates their culture with warmth and sweetness.",
    category: "Food", subcategory: "Filipino Desserts & Café",
    address: "3800 San Fernando Rd", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1481, lng: -118.2540,
  },
  {
    name: "Sari Sari Store",
    description: "Inside Grand Central Market, Sari Sari Store brings the flavors of Filipino street food to downtown LA — sisig, tocino, patis chicken, and silog breakfasts served from a counter named after the beloved corner stores that anchor every Filipino neighborhood.",
    category: "Food", subcategory: "Filipino Street Food",
    address: "317 S Broadway", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0506, lng: -118.2488,
  },
  {
    name: "Filipino Community Center of Southern California",
    description: "The heart of Historic Filipinotown — a community center hosting cultural events, language classes, senior programs, and youth activities for the half-million Filipino Americans who call greater Los Angeles home. A gathering space that keeps the community connected across generations.",
    category: "Community Organizations", subcategory: "Filipino Cultural Center",
    address: "660 Blaine St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0669, lng: -118.2771,
  },
  {
    name: "Seafood City Supermarket",
    description: "The premiere Filipino-owned grocery chain in America — Seafood City fills a need no mainstream supermarket could, stocking fresh milkfish (bangus), longanisa, bagoong, and hundreds of Filipino pantry staples alongside a food court of homestyle Filipino cooking.",
    category: "Retail", subcategory: "Filipino Supermarket",
    address: "21761 S Western Ave", city: "Torrance", state: "CA", country: "USA",
    lat: 33.8391, lng: -118.3087, website: "https://seafoodcity.com",
  },
  {
    name: "FANHS Southern California",
    description: "The Filipino American National Historical Society's Southern California chapter — preserving and sharing the rich history of Filipinos in California through archives, exhibitions, and public programs. A critical institution for a community whose history has too often been overlooked.",
    category: "Arts & Culture", subcategory: "Historical Society",
    address: "671 S Kingsley Dr", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0572, lng: -118.3061,
  },

  // ═══════════════════════════════════════════════════════════
  // KOREAN — Koreatown
  // ═══════════════════════════════════════════════════════════
  {
    name: "BCD Tofu House",
    description: "The cornerstone of Korean soft tofu stew in Los Angeles — BCD has served soondubu jjigae in bubbling stone pots to Koreatown since 1996. Open 24 hours, it's where you go after late-night karaoke, before an early shift, or any time the soul needs warmth.",
    category: "Food", subcategory: "Korean Tofu Stew",
    address: "869 S Western Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0536, lng: -118.3084, website: "https://bcdtofuhouse.com",
  },
  {
    name: "Parks BBQ",
    description: "One of Koreatown's most celebrated Korean barbecue restaurants, Parks BBQ elevated the form — wagyu beef, prime galbi, and perfectly seasoned banchan served in a space that treats the art of Korean grilling with the seriousness it deserves. The standard by which all K-BBQ in LA is measured.",
    category: "Food", subcategory: "Korean BBQ",
    address: "955 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0509, lng: -118.2918, website: "https://parksbbq.com",
  },
  {
    name: "Ham Ji Park",
    description: "A Koreatown institution famous for grilled pork spine (gamjatang) and spicy pork rib soup — comforting, deeply flavored Korean food that regulars have been eating here for decades. The kind of restaurant that locals keep close.",
    category: "Food", subcategory: "Korean Comfort Food",
    address: "3407 W 6th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0581, lng: -118.3049,
  },
  {
    name: "Kobawoo House",
    description: "A beloved Koreatown bossam restaurant — Korean pork belly wrapped in cabbage leaves with kimchi and salted shrimp — that has drawn loyal customers for over three decades. Simple, perfect, and deeply rooted in Korean culinary tradition.",
    category: "Food", subcategory: "Korean",
    address: "698 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0515, lng: -118.2920,
  },
  {
    name: "Soban",
    description: "A Koreatown restaurant beloved for its hand-ground sesame oil and meticulous Korean home cooking — the kind of place where the detail and care in each dish reflects decades of culinary devotion. James Beard-recognized, community cherished.",
    category: "Food", subcategory: "Korean",
    address: "4001 W Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0490, lng: -118.3092,
  },
  {
    name: "Sun Nong Dan",
    description: "Famous for its galbitang — a crystal-clear beef short rib soup of extraordinary depth — Sun Nong Dan is the Koreatown restaurant that even serious Korean food critics take seriously. The broth alone is worth the drive.",
    category: "Food", subcategory: "Korean Soup",
    address: "3470 W 6th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0583, lng: -118.3035,
  },
  {
    name: "Korean American Museum",
    description: "The only museum in the United States dedicated to preserving the history and contributions of Korean Americans — located in the heart of Koreatown, the community it serves. Exhibitions, archives, and public programs that ensure the Korean American story is told with its full complexity.",
    category: "Arts & Culture", subcategory: "Korean American Museum",
    address: "3727 W 6th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0585, lng: -118.3062, website: "https://kamuseum.org",
  },
  {
    name: "Korean Cultural Center of Los Angeles",
    description: "An official cultural institution of the Korean government serving the LA Korean American community through art exhibitions, cultural education, Korean language classes, and community events that connect Koreans across the diaspora with their cultural heritage.",
    category: "Arts & Culture", subcategory: "Cultural Center",
    address: "5505 Wilshire Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0628, lng: -118.3373, website: "https://kccla.org",
  },
  {
    name: "Koreatown Immigrant Workers Alliance",
    description: "KIWA has been fighting for the rights of Korean and Latino immigrant workers in Koreatown since 1992 — wage theft, health and safety, and political power for the lowest-paid workers in one of LA's most economically stratified neighborhoods.",
    category: "Community Organizations", subcategory: "Workers Rights",
    address: "3465 W 8th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0560, lng: -118.3047, website: "https://kiwa.org",
  },

  // ═══════════════════════════════════════════════════════════
  // ARMENIAN — Glendale, East Hollywood
  // ═══════════════════════════════════════════════════════════
  {
    name: "Mini Kabob",
    description: "The smallest and most beloved kabob shop in Los Angeles — hidden on a side street in Glendale, Mini Kabob serves flame-kissed Armenian-style lula and koobideh from a family recipe that has attracted a devoted following well beyond the Armenian community. Cash only, lines always.",
    category: "Food", subcategory: "Armenian Kabob",
    address: "313½ Vine St", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1467, lng: -118.2549, website: "https://mini-kabob.com",
  },
  {
    name: "Raffi's Place",
    description: "A Glendale institution since 1993, Raffi's Place serves some of the finest Persian-Armenian kebabs in the San Fernando Valley — koobideh grilled over open flame, saffron rice, and an atmosphere that feels like a family dinner where everyone belongs.",
    category: "Food", subcategory: "Persian-Armenian",
    address: "211 E Broadway", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1431, lng: -118.2474, website: "https://raffisplace.com",
  },
  {
    name: "Carousel Restaurant",
    description: "One of the most celebrated Armenian-Lebanese restaurants in Los Angeles — Carousel on Brand has served mezze, kebabs, and shawarma to the Glendale community for decades, offering a taste of Beirut and Yerevan at the same table.",
    category: "Food", subcategory: "Armenian Lebanese",
    address: "304 N Brand Blvd", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1480, lng: -118.2548,
  },
  {
    name: "Abril Books",
    description: "A legendary Armenian bookstore in Glendale that has served as a cultural anchor for the Armenian diaspora since 1983 — carrying Armenian-language books, music, films, and gifts. A rare institution that keeps the community's literary and cultural life alive.",
    category: "Retail", subcategory: "Armenian Bookstore",
    address: "415 E Broadway", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1430, lng: -118.2410,
  },
  {
    name: "Armenian National Committee of America — Western Region",
    description: "The western headquarters of the most influential Armenian American political organization — advocating for recognition of the Armenian Genocide, US-Armenia relations, and the rights and interests of the 500,000+ Armenian Americans who call Southern California home.",
    category: "Community Organizations", subcategory: "Armenian Advocacy",
    address: "104 N Belmont St", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1516, lng: -118.2569, website: "https://anca.org",
  },
  {
    name: "AGBU Western District",
    description: "The Armenian General Benevolent Union's western office serves the largest Armenian diaspora community outside Armenia — supporting Armenian schools, cultural programs, scholarships, and the next generation's connection to their heritage.",
    category: "Community Organizations", subcategory: "Armenian Community",
    address: "5684 Cahuenga Blvd", city: "North Hollywood", state: "CA", country: "USA",
    lat: 34.1622, lng: -118.3455, website: "https://agbu.org",
  },
  {
    name: "Holy Martyrs Armenian Day School",
    description: "One of the finest Armenian parochial schools in North America — educating students in Armenian language, history, and culture alongside a rigorous academic curriculum. The school is a cornerstone institution for preserving Armenian identity across generations in the diaspora.",
    category: "Childcare & Early Education", subcategory: "Armenian School",
    address: "1614 E Colorado St", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1472, lng: -118.2314,
  },
  {
    name: "St. Gregory Armenian Apostolic Church",
    description: "One of Southern California's prominent Armenian Apostolic parishes — a community center as much as a church, hosting Armenian cultural events, youth programs, and the liturgical traditions that have sustained the Armenian people through centuries of diaspora.",
    category: "Faith & Spirituality", subcategory: "Armenian Apostolic",
    address: "2215 E Colorado Blvd", city: "Pasadena", state: "CA", country: "USA",
    lat: 34.1458, lng: -118.1084, website: "https://stgregoryarmenianchurch.org",
  },

  // ═══════════════════════════════════════════════════════════
  // PERSIAN / IRANIAN — Westwood / "Tehrangeles"
  // ═══════════════════════════════════════════════════════════
  {
    name: "Shamshiri Grill",
    description: "A Westwood institution at the heart of LA's Persian community — Shamshiri has served charcoal-grilled koobideh, barg, and whole-roasted chicken to generations of Iranian Angelenos and their American-born children who grew up on these flavors. A gathering place for the diaspora.",
    category: "Food", subcategory: "Persian Grill",
    address: "1712 Westwood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0649, lng: -118.4437,
  },
  {
    name: "Attari Sandwich Shop",
    description: "A legendary Persian sandwich shop on Westwood Boulevard serving grilled chicken, koobideh, and falafel in French baguettes — the kind of place where Iranian families stop after Friday mosque and students eat between classes at UCLA. Beloved by everyone who has ever found it.",
    category: "Food", subcategory: "Persian Sandwiches",
    address: "1388 Westwood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0626, lng: -118.4416,
  },
  {
    name: "Darband Shishkabob Restaurant",
    description: "Named after a famous mountain resort outside Tehran, Darband has been serving Persian-style shishkabob, joojeh chicken, and basmati rice with golden crust (tahdig) to the Iranian community of Westwood for decades. Family-owned, warmly welcoming.",
    category: "Food", subcategory: "Persian Kabob",
    address: "1420 Westwood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0628, lng: -118.4422,
  },
  {
    name: "Javan Restaurant",
    description: "A beloved Persian restaurant in West LA serving the Westside's large Iranian American community with the full repertoire of Persian cuisine — ghormeh sabzi, fesenjan, gheyma — dishes that take days to prepare and generations to perfect. Consistent, warm, and deeply authentic.",
    category: "Food", subcategory: "Persian",
    address: "11500 Santa Monica Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0486, lng: -118.4643,
  },
  {
    name: "Ketab Corp — Persian Bookstore",
    description: "The premier Persian-language bookstore in North America, Ketab Corp on Westwood Boulevard serves as a cultural lifeline for the Iranian diaspora — carrying Persian books, music, films, and cultural materials that connect the community to Iran's literary and artistic heritage.",
    category: "Retail", subcategory: "Persian Bookstore",
    address: "1419 Westwood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0627, lng: -118.4418,
  },
  {
    name: "Iranian Community of Los Angeles",
    description: "A community organization serving the approximately 400,000 Iranians who live in greater Los Angeles — the largest Iranian diaspora community in the world outside Iran. Cultural programs, social services, and advocacy for a community that has built a remarkable life in California.",
    category: "Community Organizations", subcategory: "Iranian Community",
    address: "5870 W Olympic Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0520, lng: -118.3572,
  },

  // ═══════════════════════════════════════════════════════════
  // ETHIOPIAN / EAST AFRICAN — Little Ethiopia (Fairfax Ave)
  // ═══════════════════════════════════════════════════════════
  {
    name: "Messob Ethiopian Restaurant",
    description: "One of the most established restaurants in LA's Little Ethiopia neighborhood, Messob has been serving the full spectrum of Ethiopian cuisine — doro wot, tibs, kitfo, and vegetarian fasting dishes on hand-made injera — since 1985. A community anchor on Fairfax Avenue.",
    category: "Food", subcategory: "Ethiopian",
    address: "1041 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0524, lng: -118.3610, website: "https://messob.com",
  },
  {
    name: "Nyala Ethiopian Cuisine",
    description: "A family-owned gem on the Little Ethiopia corridor — Nyala serves generous communal platters of lamb tibs, misir wat, and collard greens on injera in a warm, welcoming space that has made it a fixture of the neighborhood's dining scene for decades.",
    category: "Food", subcategory: "Ethiopian",
    address: "1076 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0519, lng: -118.3611,
  },
  {
    name: "Rosalind's West African & Ethiopian Cuisine",
    description: "A rare menu that bridges two diaspora cuisines — Rosalind's serves both traditional Ethiopian injera dishes and West African specialties, reflecting the owner's Pan-African culinary vision and the interconnected nature of the African diaspora community on this block.",
    category: "Food", subcategory: "Ethiopian & West African",
    address: "1044 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0524, lng: -118.3609,
  },
  {
    name: "Meals by Genet",
    description: "Chef Genet Agonafer's intimate Little Ethiopia restaurant has won acclaim from food writers and loyal devotion from the community for her meticulously prepared Ethiopian cuisine. Each dish reflects the culinary traditions of Ethiopia's diverse regions, made with the care of someone cooking for family.",
    category: "Food", subcategory: "Ethiopian Fine Dining",
    address: "1053 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0523, lng: -118.3610,
  },
  {
    name: "Ethiopian Community Association of Los Angeles",
    description: "Serving the large Ethiopian diaspora community of Los Angeles with cultural events, social services, and community programs that help families navigate life in California while staying connected to their Ethiopian identity, language, and traditions.",
    category: "Community Organizations", subcategory: "Ethiopian Community",
    address: "1050 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0522, lng: -118.3610,
  },
  {
    name: "Somali Community Services of LA",
    description: "A social services organization supporting the Somali refugee and immigrant community across greater Los Angeles — case management, language access, employment services, and cultural programs for one of LA's most resilient new communities.",
    category: "Community Organizations", subcategory: "Somali Community",
    address: "4801 W Century Blvd", city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9498, lng: -118.3668,
  },

  // ═══════════════════════════════════════════════════════════
  // NIGERIAN / WEST AFRICAN — South LA, Inglewood
  // ═══════════════════════════════════════════════════════════
  {
    name: "Ponia's Palace",
    description: "A West African restaurant in the Antelope Valley serving the large Nigerian and Ghanaian community of northern LA County — jollof rice, egusi soup, pounded yam, and suya grilled over open flame. One of the only restaurants in the LA metro that serves authentic Nigerian cuisine at this scale.",
    category: "Food", subcategory: "West African Nigerian",
    address: "1038 W Rancho Vista Blvd", city: "Palmdale", state: "CA", country: "USA",
    lat: 34.5794, lng: -118.1165,
  },
  {
    name: "Afro Kitchen LA",
    description: "A West African kitchen serving South LA and the broader city with soul-warming jollof rice, egusi stew, and plantain dishes that connect the African diaspora across the Atlantic. A community gathering place as much as a restaurant.",
    category: "Food", subcategory: "West African",
    address: "5401 W Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9916, lng: -118.3625,
  },
  {
    name: "African Hair Braiding Collective — Crenshaw",
    description: "A cooperative of West African-owned braiding salons along the Crenshaw corridor offering traditional African braiding — box braids, Senegalese twists, cornrows, and Ghana braids — with master braiders trained in the Senegalese, Guinean, and Malian traditions.",
    category: "Beauty & Personal Care", subcategory: "African Hair Braiding",
    address: "3831 Crenshaw Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0092, lng: -118.3377,
  },
  {
    name: "Ghana Evangelical Church of Los Angeles",
    description: "A Ghanaian-founded Pentecostal congregation serving the West African Christian community of Los Angeles — worship in Twi, Ga, and English, alongside community programs that support Ghanaian and broader West African families adjusting to life in California.",
    category: "Faith & Spirituality", subcategory: "West African Christian",
    address: "8500 S Western Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9840, lng: -118.3090,
  },

  // ═══════════════════════════════════════════════════════════
  // CARIBBEAN / HAITIAN — South LA, Inglewood, Compton
  // ═══════════════════════════════════════════════════════════
  {
    name: "Lakay Haitian Restaurant",
    description: "One of the few dedicated Haitian restaurants in Los Angeles — Lakay serves griot (fried pork), diri ak djon djon (black mushroom rice), and pikliz alongside the warmth of Haitian hospitality that makes you feel like you've been invited into someone's home.",
    category: "Food", subcategory: "Haitian",
    address: "4800 W Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9893, lng: -118.3479,
  },
  {
    name: "Island Vibe Jamaican Kitchen",
    description: "A South LA Jamaican restaurant serving the community's authentic flavors — oxtail braised for hours, curry goat, jerk chicken, and brown stew fish alongside festival bread and rice and peas. The kind of cooking that makes homesick Jamaicans feel the island for a moment.",
    category: "Food", subcategory: "Jamaican",
    address: "7823 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9861, lng: -118.2913,
  },
  {
    name: "Belizean Heritage Cultural Association of LA",
    description: "Los Angeles has one of the largest Belizean diaspora communities in the world, and this organization preserves the unique Creole, Garifuna, and Mestizo traditions that define Belizean culture through festivals, community programs, and mutual aid.",
    category: "Community Organizations", subcategory: "Caribbean Cultural Organization",
    address: "9500 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9636, lng: -118.2915,
  },
  {
    name: "Caribbean Soul Kitchen",
    description: "A South LA restaurant blending Caribbean island flavors across the diaspora — Jamaican, Trinidadian, and Barbadian dishes sharing a menu with deep-South soul food influences, reflecting the cultural reality of Black communities whose roots cross the Atlantic.",
    category: "Food", subcategory: "Caribbean Soul Food",
    address: "9224 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9673, lng: -118.2915,
  },

  // ═══════════════════════════════════════════════════════════
  // BRAZILIAN — West Hollywood, Los Feliz, Westside
  // ═══════════════════════════════════════════════════════════
  {
    name: "Bossa Nova Brazilian Cuisine",
    description: "West Hollywood's beloved Brazilian restaurant — Bossa Nova has served the LA community with feijoada, moqueca, and churrasco-style grilled meats for years, becoming a gathering place for Brazil's significant Los Angeles diaspora and an introduction to Brazilian culture for the wider city.",
    category: "Food", subcategory: "Brazilian",
    address: "685 N Robertson Blvd", city: "West Hollywood", state: "CA", country: "USA",
    lat: 34.0895, lng: -118.3783, website: "https://bossafood.com",
  },
  {
    name: "Nossa Caipirinha Bar",
    description: "A Los Feliz restaurant reimagining Brazilian food for LA — caipirinha cocktails, grilled pintado fish, and dishes that draw on the full regional diversity of Brazil's cooking, from Bahian acarajé to Gaucho churrasco. A serious celebration of Brazilian culinary culture.",
    category: "Food", subcategory: "Brazilian",
    address: "1811 Hillhurst Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.1055, lng: -118.2876,
  },
  {
    name: "Boteco Brazilian Bar and Restaurant",
    description: "A casual Brazilian boteco — the neighborhood bar-restaurant that anchors Brazilian social life — transplanted to Melrose with coxinha, pão de queijo, cold Brahma beer, and the easy, warm energy that makes every Brazilian gathering feel like a celebration.",
    category: "Food", subcategory: "Brazilian Bar & Restaurant",
    address: "7302 Melrose Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0837, lng: -118.3620,
  },
  {
    name: "Brazilian Culture Center of Los Angeles",
    description: "A cultural hub for the significant Brazilian community of Los Angeles — offering Portuguese language classes, capoeira, Brazilian arts programming, and events that keep the diaspora connected to their culture while sharing it with the broader LA community.",
    category: "Community Organizations", subcategory: "Brazilian Cultural Center",
    address: "6125 Washington Blvd", city: "Culver City", state: "CA", country: "USA",
    lat: 34.0122, lng: -118.4022,
  },

  // ═══════════════════════════════════════════════════════════
  // SOUTH AMERICAN — Colombian, Peruvian, Venezuelan
  // ═══════════════════════════════════════════════════════════
  {
    name: "Mario's Peruvian Seafood",
    description: "A Melrose institution serving Peruvian-style ceviche, tiradito, and lomo saltado to a devoted LA following since the 1980s. Mario's helped introduce Peruvian cuisine to a wider American audience while remaining deeply connected to the Peruvian community of the Westside.",
    category: "Food", subcategory: "Peruvian",
    address: "5786 Melrose Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0837, lng: -118.3330,
  },
  {
    name: "La Camaronera Colombian Seafood",
    description: "A Colombian-owned restaurant in the San Fernando Valley serving the growing Colombian diaspora of LA with seafood-forward dishes from the coastal Cartagena tradition — camarones al ajillo, cazuela de mariscos, and bandeja paisa for the homesick.",
    category: "Food", subcategory: "Colombian",
    address: "8210 Deering Ave", city: "Canoga Park", state: "CA", country: "USA",
    lat: 34.1970, lng: -118.5960,
  },
  {
    name: "Arepas Bar — Venezuelan Kitchen",
    description: "A Venezuelan-owned café serving handmade corn arepas stuffed with pabellón, pernil, chicken avocado, and black beans — the cornerstone of Venezuelan everyday cooking. As Venezuela's diaspora has grown across LA, spots like this have become cultural anchors for families far from home.",
    category: "Food", subcategory: "Venezuelan",
    address: "7955 Santa Monica Blvd", city: "West Hollywood", state: "CA", country: "USA",
    lat: 34.0905, lng: -118.3614,
  },

  // ═══════════════════════════════════════════════════════════
  // SOUTH ASIAN / INDIAN — Artesia ("Little India")
  // ═══════════════════════════════════════════════════════════
  {
    name: "Surati Farsan Mart",
    description: "The cornerstone of Artesia's Little India strip — Surati Farsan serves Gujarati snacks, chaat, and sweets that transport the South Asian diaspora to the flavors of home. The dhokla, chakli, and chevdo are prepared fresh daily from recipes brought from Surat.",
    category: "Food", subcategory: "Indian Gujarati",
    address: "18640 Pioneer Blvd", city: "Artesia", state: "CA", country: "USA",
    lat: 33.8696, lng: -118.0773,
  },
  {
    name: "Jay Bharat Restaurant",
    description: "A beloved Artesia institution serving the South Asian diaspora of Southern California with vegetarian Gujarati thali, chaat, and a rotating menu of regional Indian specialties. A Friday gathering place for families from across the LA metro who make the trip to Artesia specifically for this food.",
    category: "Food", subcategory: "Indian Vegetarian",
    address: "18701 Pioneer Blvd", city: "Artesia", state: "CA", country: "USA",
    lat: 33.8695, lng: -118.0756,
  },
  {
    name: "Rajdhani Restaurant",
    description: "An Artesia institution serving authentic Gujarati thali — unlimited, vegetarian, and changing with the seasons — to the South Asian community of Southern California. The meal at Rajdhani is designed around the principle that hospitality means abundance.",
    category: "Food", subcategory: "Indian Thali",
    address: "18928 Pioneer Blvd", city: "Artesia", state: "CA", country: "USA",
    lat: 33.8700, lng: -118.0737,
  },
  {
    name: "India Sweets and Spices",
    description: "A beloved South Asian grocery store and prepared food counter in Culver City serving the Indian, Pakistani, and Sri Lankan community of the Westside with fresh samosas, chaat, mithai, and an extensive pantry of spices, lentils, and condiments.",
    category: "Retail", subcategory: "Indian Grocery & Sweets",
    address: "9409 Venice Blvd", city: "Culver City", state: "CA", country: "USA",
    lat: 34.0052, lng: -118.3818,
  },
  {
    name: "Badmaash",
    description: "An Indo-American restaurant in downtown Los Angeles that approaches Indian flavors through a California lens — butter chicken poutine, lamb rogan josh with naan, and a cocktail list built around Indian spices. A celebration of the Indian diaspora's creative identity.",
    category: "Food", subcategory: "Indian-American",
    address: "108 W 2nd St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0514, lng: -118.2480,
  },
  {
    name: "Malibu Hindu Temple",
    description: "The Sri Venkateswara Temple in Calabasas is one of the most significant South Indian temples in North America — an extraordinary architectural achievement of traditional Dravidian style, serving the large Hindu diaspora of Southern California with daily puja, festivals, and community gatherings.",
    category: "Faith & Spirituality", subcategory: "Hindu Temple",
    address: "1600 Las Virgenes Rd", city: "Calabasas", state: "CA", country: "USA",
    lat: 34.1337, lng: -118.7066, website: "https://hindutemple.org",
  },
  {
    name: "Guru Granth Sahib Gurdwara — San Fernando Valley",
    description: "A Sikh house of worship and community center serving the Punjabi Sikh diaspora of the San Fernando Valley — langar (free community meal) open to all, daily kirtan, and a community deeply committed to the Sikh principle of seva (selfless service).",
    category: "Faith & Spirituality", subcategory: "Sikh Gurdwara",
    address: "8316 Woodley Ave", city: "Van Nuys", state: "CA", country: "USA",
    lat: 34.2142, lng: -118.4875,
  },

  // ═══════════════════════════════════════════════════════════
  // VIETNAMESE — San Gabriel Valley
  // ═══════════════════════════════════════════════════════════
  {
    name: "Golden Deli",
    description: "A San Gabriel institution for Vietnamese cuisine — the spring rolls and pho at Golden Deli have drawn lines out the door for decades. A modest restaurant with an outsized reputation as one of the best Vietnamese spots in Southern California, beloved by the large Vietnamese community of the SGV.",
    category: "Food", subcategory: "Vietnamese",
    address: "815 W Las Tunas Dr", city: "San Gabriel", state: "CA", country: "USA",
    lat: 34.0967, lng: -118.1218,
  },
  {
    name: "Thien An Vietnamese Restaurant",
    description: "A long-running San Gabriel Vietnamese restaurant serving the classic repertoire of Saigon street food — bún bò Huế, bánh mì, and cha giò — with the care and consistency that has made it a regular pilgrimage for Vietnamese families across the San Gabriel Valley.",
    category: "Food", subcategory: "Vietnamese",
    address: "9423 Las Tunas Dr", city: "Temple City", state: "CA", country: "USA",
    lat: 34.1004, lng: -118.0560,
  },
  {
    name: "Vietnamese Community of Southern California",
    description: "An advocacy and community services organization serving the substantial Vietnamese American population of Southern California — one of the largest Vietnamese communities in the United States — with legal services, cultural programming, and civic engagement.",
    category: "Community Organizations", subcategory: "Vietnamese Community",
    address: "9121 Bolsa Ave", city: "Westminster", state: "CA", country: "USA",
    lat: 33.7502, lng: -117.9940,
  },
  {
    name: "Vietnamese Buddhist Temple — Long Beach",
    description: "A Vietnamese Buddhist pagoda serving the Long Beach Vietnamese community with daily meditation, Dharma teaching, and cultural preservation programs. One of the spiritual anchors of Southern California's Vietnamese diaspora — a place of peace, culture, and community belonging.",
    category: "Faith & Spirituality", subcategory: "Vietnamese Buddhist Temple",
    address: "2420 E South St", city: "Long Beach", state: "CA", country: "USA",
    lat: 33.7901, lng: -118.1348,
  },

  // ═══════════════════════════════════════════════════════════
  // MIDDLE EASTERN / LEBANESE / YEMENI / ARAB
  // ═══════════════════════════════════════════════════════════
  {
    name: "Sunnin Lebanese Café",
    description: "A Westwood institution serving the Lebanese diaspora and the UCLA community with fresh-made hummus, baba ganoush, shawarma, and falafel prepared with the care of a Lebanese grandmother's kitchen. One of the most authentic Lebanese restaurants in Los Angeles.",
    category: "Food", subcategory: "Lebanese",
    address: "1779 Westwood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0646, lng: -118.4434,
  },
  {
    name: "Marouch Restaurant",
    description: "An East Hollywood institution serving the Armenian and Arab communities of Los Feliz and Silver Lake with authentic Lebanese mezze, grilled kebabs, and mezze spreads that reflect the overlap between Armenian and Levantine culinary traditions along this shared corridor.",
    category: "Food", subcategory: "Lebanese Armenian",
    address: "4905 Santa Monica Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0817, lng: -118.3024,
  },
  {
    name: "Islamic Center of Southern California",
    description: "One of the oldest and most established Islamic centers in Los Angeles — serving the Muslim community across ethnic backgrounds since the 1970s, with Friday prayer, Islamic education, youth programs, and interfaith dialogue. A cornerstone of the diverse Muslim community of Southern California.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "434 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0596, lng: -118.2917, website: "https://islamcenter.org",
  },
  {
    name: "Arab American Civic Council",
    description: "An advocacy organization representing the diverse Arab American community of Los Angeles — Lebanese, Yemeni, Syrian, Palestinian, and Iraqi families — working on civil rights, political representation, and cultural preservation for one of LA's less visible diaspora communities.",
    category: "Community Organizations", subcategory: "Arab American Advocacy",
    address: "5042 Wilshire Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0617, lng: -118.3532,
  },

  // ═══════════════════════════════════════════════════════════
  // ADDITIONAL BLACK AMERICAN — South LA, Crenshaw, Inglewood
  // ═══════════════════════════════════════════════════════════
  {
    name: "Crawford's Restaurant",
    description: "A celebrated Southern restaurant on Beverly Boulevard bringing deep-South cooking traditions to LA — fried chicken, collard greens, and cornbread served with the care of a family recipe and the confidence of a community anchor. A growing destination for the Black dining community of Los Angeles.",
    category: "Food", subcategory: "Southern",
    address: "2616 Beverly Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0731, lng: -118.2839,
  },
  {
    name: "Slauson Deli",
    description: "A Crenshaw community staple serving Cajun-Creole comfort food on West Slauson Avenue — the po'boys, fried catfish, and dirty rice that feed South LA's lunch crowds seven days a week. The kind of spot that never needs advertising because the neighborhood already knows.",
    category: "Food", subcategory: "Cajun Soul Food",
    address: "4454 W Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0013, lng: -118.3472,
  },
  {
    name: "Tam's Burgers",
    description: "A Compton and South LA institution — Tam's has been serving the community with burgers, hot links, and pastrami since 1975. Featured in Kendrick Lamar's music video, Tam's is as much a cultural landmark as a restaurant, embedded in the identity of South LA's working community.",
    category: "Food", subcategory: "Burgers & American",
    address: "1239 W Rosecrans Ave", city: "Compton", state: "CA", country: "USA",
    lat: 33.8939, lng: -118.2315,
  },
  {
    name: "First African Methodist Episcopal Church of Los Angeles",
    description: "Founded in 1872 and known as FAME, this is the oldest African American church in Los Angeles — a spiritual home, civil rights anchor, and community institution that has shaped Black civic life in Southern California for over 150 years. Rev. Mark Whitlock leads one of the most active congregations in the West.",
    category: "Faith & Spirituality", subcategory: "AME Church",
    address: "2270 S Harvard Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0294, lng: -118.3054, website: "https://famechurch.org",
  },
  {
    name: "Second Baptist Church of Los Angeles",
    description: "California's oldest African American Baptist church, founded in 1885 — Second Baptist was a major Underground Railroad station, a civil rights gathering place, and remains one of the most influential Black congregations on the West Coast. Located in the Historic West Adams community.",
    category: "Faith & Spirituality", subcategory: "Baptist Church",
    address: "2412 Griffith Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0281, lng: -118.2847,
  },
  {
    name: "Masjid Ibaadillah",
    description: "A South Los Angeles mosque rooted in the African American Muslim community — offering Friday Jumu'ah prayer, Islamic education, youth programs, and community support to Black Muslims who have been part of LA's religious fabric for decades.",
    category: "Faith & Spirituality", subcategory: "Black Muslim Mosque",
    address: "4016 S Central Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0044, lng: -118.2582,
  },
  {
    name: "Brotherhood Crusade",
    description: "Founded in 1968, Brotherhood Crusade has been fighting for economic equity and community development in South Los Angeles for over 50 years. Through youth programs, community events, and advocacy, they have been a pillar of Black community power in the Crenshaw corridor.",
    category: "Community Organizations", subcategory: "Community Development",
    address: "200 E Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0152, lng: -118.2746, website: "https://brotherhoodcrusade.org",
  },
  {
    name: "Community Coalition",
    description: "Based in South Los Angeles, Community Coalition has been organizing for social and economic justice since 1990 — turning community members into powerful advocates for education reform, public health, and neighborhood investment. One of the most effective community organizing groups on the West Coast.",
    category: "Community Organizations", subcategory: "Community Organizing",
    address: "8101 S Vermont Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0027, lng: -118.2915, website: "https://cocosouthla.org",
  },
  {
    name: "StylesVille Barbershop",
    description: "The oldest Black-owned barbershop in the San Fernando Valley — StylesVille in Pacoima has been cutting, fading, and shaping hair since before most of its clients were born. Under manager Greg Carter Faucett, it remains a neighborhood institution where community happens one chair at a time.",
    category: "Beauty & Personal Care", subcategory: "Black Barbershop",
    address: "13145 Van Nuys Blvd", city: "Pacoima", state: "CA", country: "USA",
    lat: 34.2739, lng: -118.4162,
  },
  {
    name: "Pass Barbershop",
    description: "A legacy South Los Angeles barbershop that has passed ownership within the Black community across generations — a rare achievement in a neighborhood where displacement and gentrification have claimed many institutions. Each haircut here is an act of community continuity.",
    category: "Beauty & Personal Care", subcategory: "Black Barbershop",
    address: "5428 Crenshaw Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9918, lng: -118.3375,
  },
  {
    name: "Kenneth Hahn State Recreation Area",
    description: "An 800-acre oasis in the Baldwin Hills with hiking trails, a fishing lake, and panoramic views of the LA basin — one of the most accessible natural spaces for the Black and Brown communities of South LA. Named after LA County Supervisor Kenneth Hahn, who championed community parks.",
    category: "Entertainment & Recreation", subcategory: "Park & Recreation",
    address: "4100 S La Cienega Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0022, lng: -118.3558,
  },
  {
    name: "Leimert Park Village",
    description: "The cultural heart of Black Los Angeles — Leimert Park Village is an outdoor gathering space anchored by the Vision Theatre, Eso Won Books, and world-class jazz venues. Every weekend brings drum circles, community events, and the living expression of Black LA's artistic tradition.",
    category: "Arts & Culture", subcategory: "Cultural District",
    address: "4395 Leimert Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0052, lng: -118.3318,
  },
  {
    name: "Exposition Park",
    description: "Home to the California African American Museum, the Natural History Museum, and the Rose Garden — Exposition Park is one of LA's great public spaces, anchored in a historically Black and Brown community and increasingly recognized as a cultural treasure of the entire city.",
    category: "Entertainment & Recreation", subcategory: "Cultural Park",
    address: "700 Exposition Park Dr", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0174, lng: -118.2853,
  },
  {
    name: "California African American Museum",
    description: "A free state museum inside Exposition Park dedicated to the art, history, and culture of African Americans in California and beyond — featuring world-class exhibitions and public programming that center the Black experience with the dignity and depth it deserves.",
    category: "Arts & Culture", subcategory: "African American Museum",
    address: "600 State Dr", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0165, lng: -118.2842, website: "https://caamuseum.org",
  },
  {
    name: "Olvera Street — El Pueblo de Los Angeles",
    description: "The birthplace of Los Angeles — Olvera Street preserves the city's original Mexican pueblo and offers a living connection to the Indigenous, Spanish Colonial, and Mexican heritage that predates the American city. A UNESCO-recognized historic landmark and active community cultural site.",
    category: "Arts & Culture", subcategory: "Historic Cultural Site",
    address: "125 Paseo de la Plaza", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0580, lng: -118.2388,
  },
  {
    name: "The Mint",
    description: "A Fairfax music venue that has hosted everything from blues and soul to hip-hop and Latin roots since 1937 — one of LA's great small rooms where the diaspora's musical traditions have been performed, celebrated, and passed forward across generations.",
    category: "Entertainment & Recreation", subcategory: "Live Music Venue",
    address: "1036 S Fairfax Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0523, lng: -118.3608,
  },
  {
    name: "El Floridita Restaurant & Salsa Club",
    description: "A Hollywood Cuban-owned restaurant and salsa club that has been one of the great gathering places for LA's Latin music community since the 1990s — live salsa bands, Cuban food, and a dance floor that celebrates the African-Cuban rhythmic tradition shared across the diaspora.",
    category: "Entertainment & Recreation", subcategory: "Latin Nightclub & Restaurant",
    address: "1253 N Vine St", city: "Hollywood", state: "CA", country: "USA",
    lat: 34.0968, lng: -118.3262,
  },
  {
    name: "La Cita Bar",
    description: "A beloved Downtown LA bar that has been a Chicano cultural anchor for decades — from punk and norteño to cumbia and hip-hop, La Cita's programming reflects the full range of Mexican-American music culture. A neighborhood bar with a serious sense of identity.",
    category: "Entertainment & Recreation", subcategory: "Chicano Bar & Music",
    address: "336 S Hill St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0489, lng: -118.2499,
  },
  {
    name: "Little Tokyo Service Center",
    description: "A community organization serving not only the Japanese American community but all low-income immigrants and seniors in Little Tokyo and beyond — offering social services, affordable housing advocacy, and cultural programming in one of LA's most storied diaspora neighborhoods.",
    category: "Community Organizations", subcategory: "Community Services",
    address: "231 E 3rd St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0480, lng: -118.2424, website: "https://ltsc.org",
  },
  {
    name: "Thai Community Development Center",
    description: "Serving the large Thai community of Hollywood and North Hollywood — Thai CDC provides social services, workforce development, and advocacy for Thai workers and families, many of whom have been in LA for generations as part of one of the world's most vibrant Thai diaspora communities.",
    category: "Community Organizations", subcategory: "Thai Community",
    address: "5265 Hollywood Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.1022, lng: -118.3130, website: "https://thaicdc.org",
  },
];
