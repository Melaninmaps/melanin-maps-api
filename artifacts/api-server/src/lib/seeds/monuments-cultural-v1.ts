/**
 * Monuments, Museums & Spiritual Sites — All MWM Cities (Aug 2026)
 * Inserts into tour_cultural_sites.
 *
 * site_type breakdown:
 *   'monument'  — statues, buildings, memorials named after minority figures
 *   'museum'    — museums with permanent/current diaspora-relevant exhibitions
 *   'spiritual' — historic Black churches, cultural/spiritual centers
 *   'landmark'  — architecturally or historically significant Black cultural buildings
 */

export type CulturalTourSite = {
  name: string;
  city: string;
  state: string;
  address: string;
  description: string;
  lat: number;
  lng: number;
  siteType: "monument" | "museum" | "spiritual" | "landmark";
};

export const MONUMENTS_CULTURAL_V1: CulturalTourSite[] = [

  // ══════════════════════════════════════════════════
  // MONUMENTS & STATUES — WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "Martin Luther King Jr. National Memorial",
    city: "Washington", state: "DC",
    address: "1964 Independence Ave SW, Washington, DC",
    description: "The Martin Luther King Jr. Memorial on the National Mall is the first monument on the Mall dedicated to a non-president — and the first to honor an African American. The 30-foot Stone of Hope, carved with King's image, emerges from the Mountain of Despair. A sacred site on the banks of the Tidal Basin where King looks toward the Jefferson Memorial across the water.",
    lat: 38.8864, lng: -77.0441, siteType: "monument",
  },
  {
    name: "Frederick Douglass National Historic Site — Cedar Hill",
    city: "Washington", state: "DC",
    address: "1411 W St SE, Washington, DC",
    description: "Cedar Hill was the home of Frederick Douglass from 1877 until his death in 1895 — the largest private residence in the Anacostia neighborhood. Maintained by the National Park Service, the Victorian house and its grounds are open for tours. The site includes Douglass's 'Growlery' writing retreat and a museum of his life and legacy.",
    lat: 38.8616, lng: -76.9813, siteType: "monument",
  },
  {
    name: "Mary McLeod Bethune Council House",
    city: "Washington", state: "DC",
    address: "1318 Vermont Ave NW, Washington, DC",
    description: "Mary McLeod Bethune — educator, civil rights leader, and founder of Bethune-Cookman University — used this Logan Circle townhouse as the headquarters of the National Council of Negro Women from 1943 to 1966. Bethune was the first Black woman to lead a federal agency and the most influential Black woman in American government during the New Deal era.",
    lat: 38.9086, lng: -77.0326, siteType: "monument",
  },
  {
    name: "African American Civil War Memorial",
    city: "Washington", state: "DC",
    address: "1925 Vermont Ave NW, Washington, DC",
    description: "The African American Civil War Memorial honors the 209,145 United States Colored Troops who fought for freedom during the Civil War — and the white officers who commanded them. The Spirit of Freedom statue, created by sculptor Ed Hamilton, stands at the center of a semicircular wall engraved with the names of every USCT soldier. A deeply moving tribute in the U Street neighborhood.",
    lat: 38.9166, lng: -77.0321, siteType: "monument",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "National Museum of African American History & Culture",
    city: "Washington", state: "DC",
    address: "1400 Constitution Ave NW, Washington, DC",
    description: "The NMAAHC is the most significant museum of African American culture ever built — a landmark bronze-clad building on the National Mall housing 37,000 objects spanning 400+ years of Black history, art, and culture. From the slave ship shackles to James Brown's cape to Muhammad Ali's boxing gloves, this museum holds the full complexity of the African American experience. Plan 4+ hours. Timed passes required.",
    lat: 38.8913, lng: -77.0324, siteType: "museum",
  },
  {
    name: "Smithsonian Anacostia Community Museum",
    city: "Washington", state: "DC",
    address: "1901 Fort Pl SE, Washington, DC",
    description: "America's first community-based museum, founded in 1967 in the heart of Anacostia — DC's historically African American east side neighborhood. The Anacostia Community Museum regularly mounts exhibitions on African American urban history, community life, and cultural preservation. Currently showing programs on DC's African American neighborhoods and the arts.",
    lat: 38.8592, lng: -76.9844, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "Metropolitan AME Church",
    city: "Washington", state: "DC",
    address: "1518 M St NW, Washington, DC",
    description: "Founded in 1838, Metropolitan AME has been called the 'National Cathedral of African Methodism.' Frederick Douglass, Blanche Bruce, and other Black leaders worshipped here. The church hosted the state funerals of Frederick Douglass and Rosa Parks. A living monument to Black faith and freedom in Washington DC.",
    lat: 38.9054, lng: -77.0391, siteType: "spiritual",
  },
  {
    name: "Howard University Andrew Rankin Memorial Chapel",
    city: "Washington", state: "DC",
    address: "2395 6th St NW, Washington, DC",
    description: "Howard University's Andrew Rankin Memorial Chapel, built in 1895, is the spiritual center of the historically Black university often called 'the capstone of Negro education.' The chapel has hosted Martin Luther King Jr., Thurgood Marshall, and generations of Black America's greatest minds. Howard University itself is a sacred institution of Black intellectual life.",
    lat: 38.9226, lng: -77.0220, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — BALTIMORE, MD
  // ══════════════════════════════════════════════════
  {
    name: "Thurgood Marshall Statue — Lawyers Mall",
    city: "Baltimore", state: "MD",
    address: "100 State Cir, Annapolis, MD",
    description: "A bronze statue of Thurgood Marshall, Baltimore-born Supreme Court Justice, stands at the Maryland State House — the seat of the government he fought to make truly democratic. Marshall argued Brown v. Board of Education before the Supreme Court and later became the first African American justice. The statue honors the attorney who changed America through the law.",
    lat: 38.9787, lng: -76.4927, siteType: "monument",
  },
  {
    name: "Frederick Douglass — Isaac Myers Maritime Park",
    city: "Baltimore", state: "MD",
    address: "1417 Thames St, Baltimore, MD",
    description: "Isaac Myers founded the Chesapeake Marine Railway and Dry Dock Company in 1866 — the first Black-owned shipyard in America — after Black caulkers were expelled from Baltimore's white-controlled shipyards. Frederick Douglass, who learned his caulking trade in the same Baltimore harbor as an enslaved man, celebrated this as the first major Black industrial enterprise in America. A monument to Black economic self-determination.",
    lat: 39.2843, lng: -76.5940, siteType: "monument",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — BALTIMORE, MD
  // ══════════════════════════════════════════════════
  {
    name: "Reginald F. Lewis Museum of Maryland African American History",
    city: "Baltimore", state: "MD",
    address: "830 E Pratt St, Baltimore, MD",
    description: "Maryland's premier museum of African American history and culture, named for Reginald F. Lewis — the Baltimore-born entrepreneur who became the first Black American to build a billion-dollar corporation. The museum's permanent collections cover the history of Black Marylanders from African origins through the present, with regular exhibitions on art, civil rights, and community history. Currently showing rotating exhibitions on the Great Migration.",
    lat: 39.2873, lng: -76.6054, siteType: "museum",
  },
  {
    name: "Great Blacks in Wax Museum",
    city: "Baltimore", state: "MD",
    address: "1601 E North Ave, Baltimore, MD",
    description: "The National Great Blacks in Wax Museum is the first wax museum in the US dedicated to African American history — and the first African American-owned wax museum in the world. Founded in 1983, the museum features over 150 life-size wax figures of African Americans who shaped history, from ancient African civilizations to contemporary leaders. A unique and powerful educational experience.",
    lat: 39.3080, lng: -76.5970, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — NEW YORK
  // ══════════════════════════════════════════════════
  {
    name: "Harriet Tubman Monument — Harlem",
    city: "New York", state: "NY",
    address: "Frederick Douglass Blvd & 122nd St, New York, NY",
    description: "A commanding bronze monument to Harriet Tubman stands at the corner of Frederick Douglass Boulevard and 122nd Street in Harlem. Dedicated in 2008, the statue depicts Tubman in motion, arms reaching outward, with the faces of those she freed emerging from the metal behind her. An unmissable site of Black liberation history in the heart of Harlem.",
    lat: 40.8094, lng: -73.9525, siteType: "monument",
  },
  {
    name: "Jackie Robinson Rotunda — Citi Field",
    city: "New York", state: "NY",
    address: "41 Seaver Way, Queens, NY",
    description: "The Jackie Robinson Rotunda at Citi Field honors the man who broke Major League Baseball's color barrier on April 15, 1947. A 12-foot bronze sculpture of Robinson stands at the entrance, with quotes from the civil rights giant on the walls. Every April 15, all MLB players wear number 42 in his honor. The Mets' stadium was designed with the rotunda as a deliberate tribute.",
    lat: 40.7571, lng: -73.8459, siteType: "monument",
  },
  {
    name: "Schomburg Center for Research in Black Culture",
    city: "New York", state: "NY",
    address: "515 Malcolm X Blvd, New York, NY",
    description: "The Schomburg Center is one of the most important research libraries in the world dedicated to African and African American history and culture. Founded by Arturo Schomburg — a Puerto Rican-born Afro-Latino who collected African diaspora materials — it holds over 11 million items. Regular public exhibitions, author readings, film screenings, and cultural programs. A pillar of Black intellectual life in Harlem.",
    lat: 40.8094, lng: -73.9461, siteType: "museum",
  },
  {
    name: "Studio Museum in Harlem",
    city: "New York", state: "NY",
    address: "144 W 125th St, New York, NY",
    description: "The Studio Museum in Harlem is the premier institution devoted to contemporary art by Black artists from America, Africa, and the African diaspora. Since 1968 it has championed artists including Kerry James Marshall, David Hammons, Faith Ringgold, and Kara Walker. Its artist-in-residence program has launched careers of some of the most significant Black artists working today.",
    lat: 40.8083, lng: -73.9480, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — NEW YORK
  // ══════════════════════════════════════════════════
  {
    name: "Abyssinian Baptist Church",
    city: "New York", state: "NY",
    address: "132 Odell Clark Pl W, New York, NY",
    description: "Founded in 1808, Abyssinian Baptist Church is one of the oldest and most historically significant Black churches in America. Under Rev. Adam Clayton Powell Sr. and his son Adam Clayton Powell Jr. — Harlem's congressman — the church was a pillar of the Harlem Renaissance and civil rights movement. The Gothic Revival building seats 2,400 and still holds powerful Sunday services open to visitors.",
    lat: 40.8111, lng: -73.9511, siteType: "spiritual",
  },
  {
    name: "Mother AME Zion Church — Harlem",
    city: "New York", state: "NY",
    address: "140 W 137th St, New York, NY",
    description: "Mother AME Zion is one of the oldest African American churches in America, founded in 1796 in Lower Manhattan and relocated to Harlem. Harriet Tubman, Frederick Douglass, and Sojourner Truth were all connected to AME Zion. The church in Harlem has been a spiritual home for the Great Migration community since 1914. The 'Freedom Church.'",
    lat: 40.8175, lng: -73.9468, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — ATLANTA, GA
  // ══════════════════════════════════════════════════
  {
    name: "Martin Luther King Jr. Birth Home",
    city: "Atlanta", state: "GA",
    address: "501 Auburn Ave NE, Atlanta, GA",
    description: "Martin Luther King Jr. was born on January 15, 1929, in this two-story Victorian house on Auburn Avenue. The house is maintained by the National Park Service as part of the Martin Luther King Jr. National Historical Park. A free ranger-led tour takes visitors through the rooms where the future civil rights leader grew up, hearing stories from his childhood.",
    lat: 33.7538, lng: -84.3723, siteType: "monument",
  },
  {
    name: "John Lewis Statue — Edgewood Avenue",
    city: "Atlanta", state: "GA",
    address: "55 Edgewood Ave SE, Atlanta, GA",
    description: "A bronze statue of Congressman John Lewis stands near the Capitol in downtown Atlanta — his arms outstretched in the gesture of the march, his face set with the courage of a man who crossed the Edmund Pettus Bridge and never stopped crossing. John Lewis is buried in South-View Cemetery, Atlanta's historic African American cemetery, also worth visiting.",
    lat: 33.7489, lng: -84.3880, siteType: "monument",
  },
  {
    name: "National Center for Civil and Human Rights",
    city: "Atlanta", state: "GA",
    address: "100 Ivan Allen Jr Blvd NW, Atlanta, GA",
    description: "The National Center for Civil and Human Rights connects the American civil rights movement to the contemporary global human rights movement in a powerful, immersive museum experience. Current exhibitions explore the history of LGBTQ rights, immigration, and indigenous rights alongside the civil rights movement. Located in the heart of downtown Atlanta, steps from Centennial Olympic Park.",
    lat: 33.7598, lng: -84.3940, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — ATLANTA, GA
  // ══════════════════════════════════════════════════
  {
    name: "Ebenezer Baptist Church",
    city: "Atlanta", state: "GA",
    address: "407 Auburn Ave NE, Atlanta, GA",
    description: "Ebenezer Baptist Church — founded 1886 — was the church of Martin Luther King Jr., his father (Daddy King), and his grandfather A.D. Williams. It remains an active congregation and a National Historic Site. The new Horizon Sanctuary and the historic church sanctuary stand side by side on Auburn Avenue. Martin Luther King Jr.'s voice still fills the air at the historic sanctuary through recorded sermons played for visitors.",
    lat: 33.7539, lng: -84.3740, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — NEW ORLEANS, LA
  // ══════════════════════════════════════════════════
  {
    name: "National WWII Museum — New Orleans",
    city: "New Orleans", state: "LA",
    address: "945 Magazine St, New Orleans, LA",
    description: "The National WWII Museum holds an important exhibition on the Buffalo Soldiers and African American service members who fought in World War II — often in segregated units, fighting for freedoms they did not fully enjoy at home. The museum's Road to Tokyo and Road to Berlin exhibitions include Black service stories often omitted from mainstream WWII narratives.",
    lat: 29.9432, lng: -90.0714, siteType: "museum",
  },
  {
    name: "New Orleans African American Museum",
    city: "New Orleans", state: "LA",
    address: "1418 Governor Nicholls St, New Orleans, LA",
    description: "Located in the historic Tremé neighborhood, the New Orleans African American Museum occupies four historic Creole cottages in the oldest African American neighborhood in America. Its collections focus on the distinctive Creole African American culture of New Orleans — free people of color, Congo Square, and the extraordinary tradition of Black Mardi Gras Indian culture. Currently hosting an exhibition on New Orleans jazz funerals.",
    lat: 29.9670, lng: -90.0725, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — HOUSTON, TX
  // ══════════════════════════════════════════════════
  {
    name: "Buffalo Soldiers National Museum",
    city: "Houston", state: "TX",
    address: "3816 Caroline St, Houston, TX",
    description: "The Buffalo Soldiers National Museum — founded by a former US Army officer — is dedicated to preserving the history of the African American military experience from the Civil War through the 20th century. The Buffalo Soldiers were 10th Cavalry and 24th Infantry units of Black soldiers who served on the western frontier and in every American conflict. Currently showing an exhibition on Tuskegee Airmen legacy.",
    lat: 29.7342, lng: -95.3741, siteType: "museum",
  },
  {
    name: "Texas Southern University — Museum of Culture",
    city: "Houston", state: "TX",
    address: "3100 Cleburne St, Houston, TX",
    description: "Texas Southern University — one of Texas's leading HBCUs — is home to the Heartman Collection, one of the largest archives of African American materials in the South, and a museum of African American culture and history. Barbara Jordan, the first Southern Black woman elected to the US Congress, was a TSU law professor and alumna.",
    lat: 29.7261, lng: -95.3535, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — MIAMI, FL
  // ══════════════════════════════════════════════════
  {
    name: "HistoryMiami Museum — African American Heritage",
    city: "Miami", state: "FL",
    address: "101 W Flagler St, Miami, FL",
    description: "HistoryMiami Museum's permanent exhibitions include major holdings on Miami's African American community — the Bahamian settlers who built much of early Miami, the Overtown community's Little Broadway era, and the Haitian immigration that transformed the city. The museum regularly mounts special exhibitions on diaspora history. Currently showing 'Building Miami: The Untold Black Story.'",
    lat: 25.7747, lng: -80.1979, siteType: "museum",
  },
  {
    name: "Little Haiti Cultural Center",
    city: "Miami", state: "FL",
    address: "212 NE 59th Terrace, Miami, FL",
    description: "The Little Haiti Cultural Center is the hub of Miami's Haitian community — hosting art exhibitions, cultural performances, language classes, and community programming. The center's gallery regularly shows Haitian and Haitian American visual art. The 2024 turmoil in Haiti has made the cultural center's programming more vital than ever as the diaspora community processes loss and resilience.",
    lat: 25.8466, lng: -80.1932, siteType: "museum",
  },
  {
    name: "Lyric Theater — Overtown Cultural Landmark",
    city: "Miami", state: "FL",
    address: "819 NW 2nd Ave, Miami, FL",
    description: "The Lyric Theater, built in 1913, was the social and entertainment center of Overtown during the segregation era — where Nat King Cole, Josephine Baker, Louis Armstrong, and Ella Fitzgerald performed for Black audiences who were barred from Miami Beach's white hotels. Restored and reopened, the Lyric is now a cultural landmark and performance venue honoring Overtown's extraordinary arts legacy.",
    lat: 25.7789, lng: -80.1990, siteType: "landmark",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — CHICAGO, IL
  // ══════════════════════════════════════════════════
  {
    name: "DuSable Black Chicago History Museum",
    city: "Chicago", state: "IL",
    address: "740 E 56th Pl, Chicago, IL",
    description: "Named for Jean Baptiste Point DuSable — the Haitian fur trader who founded Chicago — the DuSable Black Chicago History Museum is the oldest independent institution in the US dedicated to the collection, preservation, and interpretation of African American history and culture. Its Harold Washington Wing and Bronzeville exhibitions are essential Chicago history. Regular programming on jazz, visual art, and Black politics.",
    lat: 41.7930, lng: -87.6065, siteType: "museum",
  },
  {
    name: "Barack Obama Presidential Center",
    city: "Chicago", state: "IL",
    address: "1200 S Lake Shore Dr, Chicago, IL",
    description: "The Barack Obama Presidential Center — under construction in Jackson Park on the South Side of Chicago — will be the first presidential center on the South Side, deliberately sited in the community where Obama organized as a young man. The center is designed by architect Tod Williams and Billie Tsien and will include a museum, public library branch, athletic center, and recording studio. Opening 2025/2026.",
    lat: 41.7936, lng: -87.5788, siteType: "landmark",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — CHICAGO, IL
  // ══════════════════════════════════════════════════
  {
    name: "Quinn Chapel AME Church — Chicago",
    city: "Chicago", state: "IL",
    address: "2401 S Wabash Ave, Chicago, IL",
    description: "Quinn Chapel is the oldest African American congregation in Chicago, founded in 1844. It was a major station on the Underground Railroad, sheltering freedom-seekers in its basement. The historic chapel in the near South Side has hosted Frederick Douglass, Booker T. Washington, and countless civil rights leaders. Sunday services are open to the public.",
    lat: 41.8491, lng: -87.6270, siteType: "spiritual",
  },
  {
    name: "Trinity United Church of Christ — Jeremiah A. Wright",
    city: "Chicago", state: "IL",
    address: "400 W 95th St, Chicago, IL",
    description: "Trinity United Church of Christ is one of the largest and most influential African American congregations in America, known for its 'Unashamedly Black and Unapologetically Christian' theology. The church where Barack Obama was baptized and married, and where Rev. Jeremiah A. Wright preached for 36 years. A pillar of Black liberation theology on Chicago's South Side.",
    lat: 41.7217, lng: -87.6419, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — DETROIT, MI
  // ══════════════════════════════════════════════════
  {
    name: "Charles H. Wright Museum of African American History",
    city: "Detroit", state: "MI",
    address: "315 E Warren Ave, Detroit, MI",
    description: "The Charles H. Wright Museum — the largest institution of its kind in the world — houses one of the most comprehensive collections of African American history and culture. Its permanent exhibition 'And Still We Rise' traces 400,000 years of African and African American history. Current exhibitions include 'Detroit's Civil Rights Movement' and 'Motown: The Sound of Young America.' A must-visit destination for anyone in Detroit.",
    lat: 42.3585, lng: -83.0622, siteType: "museum",
  },
  {
    name: "Motown Museum — Hitsville USA",
    city: "Detroit", state: "MI",
    address: "2648 W Grand Blvd, Detroit, MI",
    description: "The Motown Museum — 'Hitsville USA' — is the original recording studio where Diana Ross, Marvin Gaye, Stevie Wonder, the Four Tops, and the Temptations made the music that defined a generation. Studio A, where virtually every Motown hit was recorded, has been preserved exactly as it was. The museum recently expanded to a new facility adjacent to the original house. One of the most significant music history sites in America.",
    lat: 42.3742, lng: -83.0837, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — DETROIT, MI
  // ══════════════════════════════════════════════════
  {
    name: "Hartford Memorial Baptist Church",
    city: "Detroit", state: "MI",
    address: "18700 James Couzens Hwy, Detroit, MI",
    description: "Hartford Memorial Baptist Church — led for decades by Rev. Charles G. Adams, 'the Harvard of the Pulpit' — is one of Detroit's most storied African American congregations. The church's social justice ministry, community development programs, and cultural events have made it a pillar of Detroit's Black community. Sunday services are among the most powerful worship experiences in the Midwest.",
    lat: 42.4102, lng: -83.1283, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — LOS ANGELES, CA
  // ══════════════════════════════════════════════════
  {
    name: "California African American Museum (CAAM)",
    city: "Los Angeles", state: "CA",
    address: "600 State Dr, Los Angeles, CA",
    description: "The California African American Museum in Exposition Park holds over 4,000 artworks and historical artifacts documenting the history and culture of African Americans with emphasis on California and the West. Current exhibitions include contemporary African American visual art and a retrospective on the Black Panther Party. The museum is free and family-friendly.",
    lat: 34.0137, lng: -118.2860, siteType: "museum",
  },
  {
    name: "Museum of the African Diaspora — Los Angeles Outpost",
    city: "Los Angeles", state: "CA",
    address: "601 W Temple St, Los Angeles, CA",
    description: "MoAD's programming in Los Angeles celebrates artistic and cultural expression across the African diaspora — from West Africa and the Caribbean to Brazil, the American South, and the Pacific Coast. Regular exhibitions on African textile art, contemporary diaspora photography, and Afrofuturism in Black visual culture.",
    lat: 34.0559, lng: -118.2477, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — LOS ANGELES
  // ══════════════════════════════════════════════════
  {
    name: "Nipsey Hussle Memorial Plaza",
    city: "Los Angeles", state: "CA",
    address: "3420 W Slauson Ave, Los Angeles, CA",
    description: "The Los Angeles City Council officially renamed the intersection of Crenshaw Boulevard and Slauson Avenue 'Ermias 'Nipsey Hussle' Asghedom Square' following the rapper's murder in 2019. The Marathon Clothing store, still operating, is the epicenter of the memorial. A gathering place for the Crenshaw community and a pilgrimage site for hip-hop fans worldwide.",
    lat: 33.9880, lng: -118.3395, siteType: "monument",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — OAKLAND, CA
  // ══════════════════════════════════════════════════
  {
    name: "Museum of the African Diaspora — Oakland",
    city: "Oakland", state: "CA",
    address: "685 Market St, San Francisco, CA",
    description: "MoAD in San Francisco's SoMa neighborhood — a short BART ride from Oakland — is the primary museum on the West Coast dedicated to the global African diaspora. Current exhibitions include African photography, the Harlem Renaissance, and contemporary African and African American visual art. The staircase mural by artist Leonardo Drew is alone worth the visit.",
    lat: 37.7869, lng: -122.4007, siteType: "museum",
  },
  {
    name: "African American Museum & Library at Oakland (AAMLO)",
    city: "Oakland", state: "CA",
    address: "659 14th St, Oakland, CA",
    description: "The AAMLO — a branch of the Oakland Public Library — holds one of the most significant collections of African American history materials on the West Coast. Its exhibitions and programming focus on California's Black history with particular emphasis on the Bay Area — the Black Panther Party, Oakland's Great Migration community, and the African American labor movement.",
    lat: 37.8050, lng: -122.2680, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — CHARLOTTE, NC
  // ══════════════════════════════════════════════════
  {
    name: "Harvey B. Gantt Center for African-American Arts + Culture",
    city: "Charlotte", state: "NC",
    address: "551 S Tryon St, Charlotte, NC",
    description: "Named for Harvey Gantt — the first Black student to enroll at Clemson University and later Charlotte's first Black mayor — the Gantt Center is Charlotte's leading institution for African American visual and performing arts. Current exhibitions include work by Black contemporary artists from the Southeast and a retrospective on Charlotte's civil rights movement. Located in the heart of uptown Charlotte.",
    lat: 35.2218, lng: -80.8454, siteType: "museum",
  },
  {
    name: "Levine Museum of the New South — Black Charlotte",
    city: "Charlotte", state: "NC",
    address: "401 S Tryon St, Charlotte, NC",
    description: "The Levine Museum's foundational exhibition 'Cotton Fields to Skyscrapers' includes comprehensive coverage of Charlotte's African American history — from Reconstruction through the civil rights movement to the modern era. Special exhibitions regularly focus on the Black experience in the Carolinas. The museum's collection includes significant materials on JCSU and the sit-in movement in Charlotte.",
    lat: 35.2213, lng: -80.8455, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — RICHMOND, VA
  // ══════════════════════════════════════════════════
  {
    name: "Black History Museum and Cultural Center of Virginia",
    city: "Richmond", state: "VA",
    address: "122 W Leigh St, Richmond, VA",
    description: "Located in the historic Leigh Street Armory in Jackson Ward — once the center of Black Richmond's economic life — this museum holds major collections on Virginia's African American history. Current exhibitions include the history of Maggie L. Walker and the Penny Savings Bank, the civil rights movement in Richmond, and contemporary Black art from Virginia artists. In the neighborhood Jackson Ward itself is a walkable museum of Black history.",
    lat: 37.5480, lng: -77.4399, siteType: "museum",
  },
  {
    name: "Maggie L. Walker National Historic Site",
    city: "Richmond", state: "VA",
    address: "600 N 2nd St, Richmond, VA",
    description: "The home of Maggie Lena Walker — the first woman of any race to charter and serve as president of a bank in the United States — is preserved as a National Historic Site in Jackson Ward, Richmond. Walker founded the St. Luke Penny Savings Bank in 1903 and used it to provide mortgages to Black Richmonders excluded from white-owned banks. Free admission; ranger-led tours available.",
    lat: 37.5494, lng: -77.4393, siteType: "monument",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — BIRMINGHAM, AL
  // ══════════════════════════════════════════════════
  {
    name: "Birmingham Civil Rights Institute",
    city: "Birmingham", state: "AL",
    address: "520 16th St N, Birmingham, AL",
    description: "The Birmingham Civil Rights Institute is one of the most significant civil rights museums in the world, located across from the 16th Street Baptist Church and Kelly Ingram Park — the epicenter of the 1963 Birmingham Campaign. Its Barriers Gallery traces the history of segregation; the Confrontation Gallery shows the movement's most dramatic moments; and the Milestones Gallery shows the road to the present. Essential.",
    lat: 33.5149, lng: -86.8133, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — BIRMINGHAM, AL
  // ══════════════════════════════════════════════════
  {
    name: "16th Street Baptist Church",
    city: "Birmingham", state: "AL",
    address: "1530 6th Ave N, Birmingham, AL",
    description: "The 16th Street Baptist Church is one of the most sacred sites in American civil rights history. On September 15, 1963, Ku Klux Klan members bombed the church, killing four young girls — Addie Mae Collins, Cynthia Wesley, Carole Robertson, and Carol Denise McNair — who were preparing for Sunday school. The bombing galvanized the nation and accelerated the passage of the Civil Rights Act. The church is still an active congregation and a National Historic Landmark open to visitors.",
    lat: 33.5150, lng: -86.8130, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — MEMPHIS, TN
  // ══════════════════════════════════════════════════
  {
    name: "National Civil Rights Museum — Lorraine Motel",
    city: "Memphis", state: "TN",
    address: "450 Mulberry St, Memphis, TN",
    description: "The National Civil Rights Museum at the Lorraine Motel — site of Martin Luther King Jr.'s assassination on April 4, 1968 — is the most comprehensive civil rights museum in America. Its journey from the Montgomery Bus Boycott through the March on Washington to Room 306 of the Lorraine is devastating and essential. The Rosa Parks bus is there. The balcony where King was shot is preserved exactly as it was. A transformative experience.",
    lat: 35.1344, lng: -90.0591, siteType: "museum",
  },
  {
    name: "Stax Museum of American Soul Music",
    city: "Memphis", state: "TN",
    address: "926 E McLemore Ave, Memphis, TN",
    description: "The Stax Museum occupies the original site of Stax Records — the Soulsville USA recording studio where Otis Redding, Isaac Hayes, Sam & Dave, and Booker T. & the MGs created Memphis soul music. The museum holds the original Studio A recording console, hundreds of artifacts, and a full-size replica of the Satellite Record Shop. Essential for any understanding of African American music history.",
    lat: 35.1021, lng: -90.0257, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — NASHVILLE, TN
  // ══════════════════════════════════════════════════
  {
    name: "National Museum of African American Music",
    city: "Nashville", state: "TN",
    address: "501 Commerce St, Nashville, TN",
    description: "The NMAAM — opened 2021 in the heart of downtown Nashville — is the only museum dedicated to preserving and celebrating the many music genres created, influenced, and inspired by African Americans. Its five portals trace the Black roots of gospel, blues, jazz, R&B, rock & roll, and hip-hop. An immersive experience that corrects the record: nearly every American music genre is Black music. Currently showing exhibitions on the Fisk Jubilee Singers and Nashville's civil rights music.",
    lat: 36.1600, lng: -86.7797, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — CLEVELAND, OH
  // ══════════════════════════════════════════════════
  {
    name: "Rock & Roll Hall of Fame — African American Wing",
    city: "Cleveland", state: "OH",
    address: "1100 Rock and Roll Blvd, Cleveland, OH",
    description: "Rock and roll is African American music — a fact the Rock & Roll Hall of Fame now more fully acknowledges. Major inductees and exhibitions focus on Chuck Berry, Little Richard, Jimi Hendrix, and the full arc of Black musical innovation from rhythm & blues through hip-hop. Current exhibitions include the history of the music industry's systematic exploitation of Black artists and the artists who fought back.",
    lat: 41.5085, lng: -81.6954, siteType: "museum",
  },
  {
    name: "Cleveland History Center — African American Galleries",
    city: "Cleveland", state: "OH",
    address: "10825 East Blvd, Cleveland, OH",
    description: "The Cleveland History Center's African American galleries trace the history of Black Cleveland from the Underground Railroad through the Great Migration to the city's role as a center of Black political power. Artifacts include materials from the Karamu House — the oldest African American theater company in America — and the historic Hough and Glenville neighborhoods.",
    lat: 41.5107, lng: -81.6119, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — TAMPA / ST. PETE, FL
  // ══════════════════════════════════════════════════
  {
    name: "Carter G. Woodson African American Museum",
    city: "Tampa", state: "FL",
    address: "2240 9th Ave S, St. Petersburg, FL",
    description: "Named for the founder of Black History Month, the Carter G. Woodson African American Museum in St. Petersburg preserves the history of African Americans in the Tampa Bay region — from the Bahamian settlers of the early 20th century through the civil rights movement in Pinellas County. Current exhibitions include the history of Central Avenue and the Negro League baseball teams of Tampa Bay.",
    lat: 27.7726, lng: -82.6490, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — DALLAS, TX
  // ══════════════════════════════════════════════════
  {
    name: "African American Museum of Dallas",
    city: "Dallas", state: "TX",
    address: "3536 Grand Ave, Dallas, TX",
    description: "The African American Museum of Dallas — one of the largest African American cultural institutions in the Southwest — houses four galleries of art, four galleries of cultural history, and the largest African American folk art collection in the United States. Current exhibitions include Texas African American history, the Buffalo Soldiers in Texas, and contemporary Black Texas artists. Located in the historic Fair Park.",
    lat: 32.7834, lng: -96.7538, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // MUSEUMS — DENVER, CO
  // ══════════════════════════════════════════════════
  {
    name: "Blair-Caldwell African American Research Library",
    city: "Denver", state: "CO",
    address: "2401 Welton St, Denver, CO",
    description: "The Blair-Caldwell African American Research Library in Five Points is Denver's premier institution for African American history and culture — housing the Black Experience in Colorado Collection, the Five Points Jazz Festival archives, and major resources on African American Westward migration. Regular exhibitions, film screenings, and cultural programming focused on Denver and Colorado's Black community.",
    lat: 39.7543, lng: -104.9783, siteType: "museum",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — NEW ORLEANS
  // ══════════════════════════════════════════════════
  {
    name: "St. Augustine Church — Tremé",
    city: "New Orleans", state: "LA",
    address: "1210 Gov Nicholls St, New Orleans, LA",
    description: "Founded in 1841, St. Augustine is the oldest African American Catholic church in the United States and one of the oldest Black Catholic congregations in the Americas. Free Black Catholics and enslaved people both worshipped here before the Civil War, sitting in the same pews — an act of radical equality for its time. The church's gospel choir and Jazz Mass are legendary. An active congregation with open services.",
    lat: 29.9671, lng: -90.0714, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — ATLANTA
  // ══════════════════════════════════════════════════
  {
    name: "Big Bethel AME Church",
    city: "Atlanta", state: "GA",
    address: "220 Auburn Ave NE, Atlanta, GA",
    description: "Founded in 1847 — the year before Atlanta was incorporated — Big Bethel AME is the oldest African American church in Atlanta. The church housed the Gate City Colored School, Atlanta's first school for Black children, in 1868. Its historic red-brick sanctuary on Auburn Avenue anchors the Sweet Auburn Heritage District and remains an active congregation.",
    lat: 33.7535, lng: -84.3750, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — HOUSTON
  // ══════════════════════════════════════════════════
  {
    name: "Wheeler Avenue Baptist Church",
    city: "Houston", state: "TX",
    address: "3826 Wheeler Ave, Houston, TX",
    description: "Wheeler Avenue Baptist Church, led for decades by Rev. William A. Lawson, has been one of the most influential Black congregations in Houston for over 60 years. The church organized Houston's civil rights protests, supported the Houston Astros' first Black players, and has been a community anchor in the Third Ward. Barbara Jordan was a member. Services are welcoming to visitors.",
    lat: 29.7228, lng: -95.3620, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // SPIRITUAL — DETROIT
  // ══════════════════════════════════════════════════
  {
    name: "Greater Grace Temple",
    city: "Detroit", state: "MI",
    address: "23500 W 7 Mile Rd, Detroit, MI",
    description: "Bishop Charles H. Ellis III's Greater Grace Temple is one of the largest Black churches in Detroit — a megachurch whose funerals and celebrations for Aretha Franklin and other cultural icons drew international attention. Greater Grace's community development programs, housing assistance, and cultural events make it one of the most consequential institutions in Detroit's African American community.",
    lat: 42.4239, lng: -83.1950, siteType: "spiritual",
  },

  // ══════════════════════════════════════════════════
  // MONUMENTS — MEMPHIS
  // ══════════════════════════════════════════════════
  {
    name: "Ida B. Wells Memorial — Beale Street Landing",
    city: "Memphis", state: "TN",
    address: "460 N Riverside Dr, Memphis, TN",
    description: "A monument to Ida B. Wells-Barnett — the Memphis journalist and anti-lynching crusader who was born enslaved in Holly Springs, Mississippi, and became one of the most courageous voices in American history. After her newspaper offices were burned by a white mob in 1892, she continued her anti-lynching campaign in Chicago and New York. The monument stands near the riverfront where she built her legacy.",
    lat: 35.1447, lng: -90.0562, siteType: "monument",
  },

  // ══════════════════════════════════════════════════
  // MONUMENT — NEWARK
  // ══════════════════════════════════════════════════
  {
    name: "Harriet Tubman Monument — Newark",
    city: "Newark", state: "NJ",
    address: "West Market St & William St, Newark, NJ",
    description: "A bronze monument to Harriet Tubman stands in Newark's downtown — honoring the freedom fighter who made 13 missions into the South, freeing 70+ enslaved people and becoming the most celebrated conductor on the Underground Railroad. Newark's monument joins those in New York, Washington, and Boston as part of a growing national recognition of Tubman's legacy.",
    lat: 40.7357, lng: -74.1736, siteType: "monument",
  },
];
