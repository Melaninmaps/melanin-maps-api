/**
 * Diaspora Murals — All MWM Cities (Aug 2026)
 * Inserts into tour_cultural_sites with site_type='mural'.
 * Philadelphia murals are handled by ensurePhiladelphiaMurals() — not duplicated here.
 *
 * All entries: real named murals with precise street-level GPS
 * so members can navigate to them and upload photos/video.
 * Cultural relevance: Black cultural figures, civil rights legacy,
 * diaspora heritage, Afrofuturism, HBCU culture, or local Black history.
 */

export type MuralSite = {
  name: string;
  city: string;
  state: string;
  address: string;
  description: string;
  lat: number;
  lng: number;
};

export const MURALS_DIASPORA_V1: MuralSite[] = [

  // ══════════════════════════════════════════════════
  // WASHINGTON, DC
  // ══════════════════════════════════════════════════
  {
    name: "Chuck Brown — Godfather of Go-Go",
    city: "Washington", state: "DC",
    address: "7th St NW & T St NW, Washington, DC",
    description: "A vibrant tribute to Chuck Brown, Washington DC's own Godfather of Go-Go — the percussion-driven African American music genre born on DC's streets. The mural celebrates go-go as a defining expression of Black DC culture, resistance, and community joy.",
    lat: 38.9174, lng: -77.0218,
  },
  {
    name: "Frederick Douglass — Abolitionist & Orator",
    city: "Washington", state: "DC",
    address: "316 Pennsylvania Ave SE, Washington, DC",
    description: "A commanding mural of Frederick Douglass, the escaped-enslaved man who became one of history's most powerful orators and abolitionists. Douglass lived in Washington and his home, Cedar Hill, stands in Anacostia. This mural on Capitol Hill honors his enduring legacy near the halls of the democracy he fought to transform.",
    lat: 38.8865, lng: -76.9982,
  },
  {
    name: "Marvin Gaye — Prince of Soul",
    city: "Washington", state: "DC",
    address: "1321 W St NW, Washington, DC",
    description: "Born and raised in DC's Trinidad neighborhood, Marvin Gaye's music gave voice to the joy, pain, and social consciousness of Black America. This mural celebrates his Motown legacy and his album 'What's Going On' — a masterpiece of political soul born from the streets of Washington.",
    lat: 38.9270, lng: -77.0009,
  },
  {
    name: "Anacostia Rising — Community Heritage Wall",
    city: "Washington", state: "DC",
    address: "Martin Luther King Jr Ave SE & Good Hope Rd SE, Washington, DC",
    description: "A sweeping community mural in historic Anacostia — one of DC's oldest African American neighborhoods — depicting the neighborhood's past, present, and future. Images of Black families, civil rights elders, and youth rise across the building's façade as a declaration of Anacostia's resilience.",
    lat: 38.8642, lng: -76.9924,
  },
  {
    name: "Go-Go Music is Culture",
    city: "Washington", state: "DC",
    address: "Georgia Ave NW & Shepherd St NW, Washington, DC",
    description: "A landmark mural declaring Go-Go — DC's indigenous African American music — as an irreplaceable part of the city's identity. Created in response to community organizing that saved Go-Go culture from gentrification, this mural stands as a declaration: Go-Go lives here. A significant location in Washington's ongoing Black cultural resistance.",
    lat: 38.9438, lng: -77.0258,
  },
  {
    name: "Duke Ellington — Born in DC",
    city: "Washington", state: "DC",
    address: "1217 U St NW, Washington, DC",
    description: "Edward Kennedy 'Duke' Ellington was born at 2129 Ward Place NW in Washington, DC in 1899. This U Street mural honors the jazz composer and bandleader whose orchestra played the Cotton Club and Carnegie Hall. U Street was once called 'Black Broadway' — and Ellington was its greatest son.",
    lat: 38.9174, lng: -77.0323,
  },
  {
    name: "Shirley Chisholm — Unbought and Unbossed",
    city: "Washington", state: "DC",
    address: "400 Howard Pl NW, Washington, DC",
    description: "A tribute to Shirley Chisholm — the first Black woman elected to US Congress and the first Black candidate to seek a major-party presidential nomination. Painted near Howard University, the mural honors her historic declaration: 'I am not the candidate of Black America, though I am Black and proud. I am not the candidate of the women's movement, though I am a woman. I am the candidate of the people.'",
    lat: 38.9229, lng: -77.0220,
  },

  // ══════════════════════════════════════════════════
  // BALTIMORE, MD
  // ══════════════════════════════════════════════════
  {
    name: "Billie Holiday — Lady Day Was Born Here",
    city: "Baltimore", state: "MD",
    address: "Pennsylvania Ave & North Ave, Baltimore, MD",
    description: "Billie Holiday was born Eleanora Fagan on Guilford Avenue in Baltimore in 1915. This mural on the Pennsylvania Avenue corridor — the heart of Baltimore's historic Black entertainment district — pays tribute to one of the greatest vocalists in American history. Her voice carried the grief and grace of the African American experience like no other.",
    lat: 39.3085, lng: -76.6362,
  },
  {
    name: "Frederick Douglass — Baltimore Roots",
    city: "Baltimore", state: "MD",
    address: "Fell Point, Baltimore, MD",
    description: "Frederick Douglass learned to read on the streets of Baltimore's Fells Point, where he was enslaved in the shipyards. This mural marks the harbor district where a young enslaved boy's hunger for literacy became the foundation of one of history's most powerful liberation movements.",
    lat: 39.2830, lng: -76.5927,
  },
  {
    name: "Thurgood Marshall — Justice for All",
    city: "Baltimore", state: "MD",
    address: "1333 W North Ave, Baltimore, MD",
    description: "Thurgood Marshall was born in Baltimore and grew up on Druid Hill Avenue before going on to argue Brown v. Board of Education and become the first African American Justice of the US Supreme Court. This mural in West Baltimore honors the attorney who legally dismantled 'separate but equal' and made America confront its contradiction.",
    lat: 39.3104, lng: -76.6380,
  },
  {
    name: "Penn North Rising — Community Mural",
    city: "Baltimore", state: "MD",
    address: "2100 Pennsylvania Ave, Baltimore, MD",
    description: "A community-commissioned mural at Penn North, the epicenter of Baltimore's 2015 uprising following the death of Freddie Gray. The mural depicts Black Baltimore's long history of resistance, beauty, and community — from the Great Migration through the present day — affirming that the neighborhood is more than a news story.",
    lat: 39.3113, lng: -76.6383,
  },
  {
    name: "Cab Calloway — Hi-De-Ho Man",
    city: "Baltimore", state: "MD",
    address: "W Baltimore St & N Carey St, Baltimore, MD",
    description: "Cabell 'Cab' Calloway III was born in Rochester, NY, but raised in Baltimore and deeply connected to the city's jazz heritage. This mural celebrates the bandleader and showman whose 'Minnie the Moocher' became one of the most recognizable recordings in American music history — a bridge between jazz, scat, and Black showmanship.",
    lat: 39.2892, lng: -76.6415,
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — BROOKLYN
  // ══════════════════════════════════════════════════
  {
    name: "Notorious B.I.G. — Bedford-Stuyvesant",
    city: "Brooklyn", state: "NY",
    address: "1060 Fulton St, Brooklyn, NY",
    description: "Christopher Wallace — the Notorious B.I.G., Biggie Smalls — grew up on St. James Place in Bed-Stuy, Brooklyn. This celebrated mural on Fulton Street marks sacred ground: the neighborhood that produced one of hip-hop's undisputed greatest, whose storytelling from the Brooklyn streets rewrote American music history. A pilgrimage site for hip-hop culture.",
    lat: 40.6759, lng: -73.9571,
  },
  {
    name: "Jay-Z — Marcy Projects Heritage",
    city: "Brooklyn", state: "NY",
    address: "Flushing Ave & Nostrand Ave, Brooklyn, NY",
    description: "Shawn Carter — Jay-Z — grew up in the Marcy Houses public housing project in Bed-Stuy. This mural near the projects honors the entrepreneur, artist, and cultural titan who turned Brooklyn into a global brand. An icon of Black excellence rising from the most ordinary of American circumstances.",
    lat: 40.6968, lng: -73.9435,
  },
  {
    name: "Jean-Michel Basquiat — Brooklyn Born",
    city: "Brooklyn", state: "NY",
    address: "Fulton St & Nostrand Ave, Brooklyn, NY",
    description: "Jean-Michel Basquiat was born in Brooklyn in 1960 to a Haitian father and Puerto Rican mother. He rose from SAMO© street art in Lower Manhattan to become the most celebrated Black American artist of the 20th century. This mural in his home borough honors the Crown Heights–born genius whose neo-expressionist paintings commanded the highest prices in art auction history.",
    lat: 40.6799, lng: -73.9495,
  },
  {
    name: "Brooklyn Diaspora — Caribbean Heritage Wall",
    city: "Brooklyn", state: "NY",
    address: "Flatbush Ave & Linden Blvd, Brooklyn, NY",
    description: "A sweeping mural celebrating Brooklyn's Caribbean diaspora community — Jamaican, Trinidadian, Barbadian, Guyanese, and Haitian flags and cultural symbols woven into a unified vision of Black diasporic excellence. Near the West Indian American Day Parade route, this wall celebrates the Caribbean culture that transformed Brooklyn into the cultural capital of the diaspora.",
    lat: 40.6388, lng: -73.9497,
  },
  {
    name: "Crown Heights — Carnival is Culture",
    city: "Brooklyn", state: "NY",
    address: "Eastern Pkwy & Nostrand Ave, Brooklyn, NY",
    description: "The West Indian American Day Carnival — the largest street festival in North America — passes this corner on Eastern Parkway every Labor Day. This mural celebrates the Trinidadian, Jamaican, Barbadian, and Caribbean roots of carnival, steel pan, soca, and masquerade as expressions of Black freedom and joy.",
    lat: 40.6693, lng: -73.9501,
  },
  {
    name: "Weeksville — The First Free Black Community",
    city: "Brooklyn", state: "NY",
    address: "1698 Bergen St, Brooklyn, NY",
    description: "Weeksville, established in 1838 in what is now Crown Heights, was one of the first free African American communities in the United States. This mural adjacent to the Weeksville Heritage Center honors the free Black families who built schools, churches, and a newspaper before the Civil War — a founding moment of Black American self-determination.",
    lat: 40.6744, lng: -73.9210,
  },

  // ══════════════════════════════════════════════════
  // NEW YORK — HARLEM / UPPER MANHATTAN
  // ══════════════════════════════════════════════════
  {
    name: "Harriet Tubman — Moses of Her People",
    city: "New York", state: "NY",
    address: "Frederick Douglass Blvd & 122nd St, New York, NY",
    description: "A grand mural honoring Harriet Tubman — the Underground Railroad conductor who freed more than 70 enslaved people and never lost a passenger. Tubman served as a spy and nurse during the Civil War and spent decades advocating for women's suffrage. Near the bronze Harriet Tubman statue at 122nd Street, this mural stands as a permanent declaration of Black courage.",
    lat: 40.8094, lng: -73.9535,
  },
  {
    name: "Langston Hughes — Harlem Renaissance Poet",
    city: "New York", state: "NY",
    address: "East 127th St & 5th Ave, New York, NY",
    description: "Langston Hughes lived at 20 East 127th Street in Harlem for over two decades. His poetry gave language to Black joy and Black pain during the Harlem Renaissance and beyond. This mural quotes 'What happens to a dream deferred?' — a question that still echoes through the streets of Harlem and Black America.",
    lat: 40.8064, lng: -73.9441,
  },
  {
    name: "James Baldwin — Native Son",
    city: "New York", state: "NY",
    address: "Lenox Ave & 131st St, New York, NY",
    description: "James Baldwin was born in Harlem Hospital in 1924 and grew up on 131st Street. His essays, novels, and speeches shaped America's conscience on race with unmatched clarity and fire. This mural honors the author of 'The Fire Next Time,' 'Giovanni's Room,' and 'Go Tell It on the Mountain' — one of the most penetrating minds in American literary history.",
    lat: 40.8124, lng: -73.9480,
  },
  {
    name: "Marcus Garvey — Black Star Line",
    city: "New York", state: "NY",
    address: "7th Ave & 127th St, New York, NY",
    description: "Marcus Mosiah Garvey led the largest pan-African movement in history from his base in Harlem. His Universal Negro Improvement Association and Black Star Line shipping company were visions of Black economic sovereignty and global solidarity. This mural honors the Jamaican-born leader who told Black people worldwide: 'Up, you mighty race, you can accomplish what you will.'",
    lat: 40.8053, lng: -73.9489,
  },
  {
    name: "Nina Simone — High Priestess of Soul",
    city: "New York", state: "NY",
    address: "Malcolm X Blvd & 116th St, New York, NY",
    description: "Nina Simone — Eunice Kathleen Waymon of Tryon, North Carolina — became one of the most powerful voices of the civil rights movement through her New York years. 'Mississippi Goddam,' 'To Be Young, Gifted and Black,' and 'Four Women' remain anthems of African American rage, grief, and pride. This Harlem mural honors the pianist-activist who sang what others were afraid to say.",
    lat: 40.8006, lng: -73.9478,
  },

  // ══════════════════════════════════════════════════
  // NEWARK, NJ
  // ══════════════════════════════════════════════════
  {
    name: "Amiri Baraka — Poet of Newark",
    city: "Newark", state: "NJ",
    address: "Halsey St & Park Pl, Newark, NJ",
    description: "Amiri Baraka — born LeRoi Jones in Newark — was one of the most influential Black writers, poets, and activists of the 20th century. His Black Arts Movement transformed African American culture. After the 1967 Newark uprising, he returned to his home city and dedicated his life to Newark's Black community. This mural near the Halsey Street arts district honors the city's poet laureate.",
    lat: 40.7396, lng: -74.1722,
  },
  {
    name: "Sarah Vaughan — The Divine One",
    city: "Newark", state: "NJ",
    address: "Broad St & Market St, Newark, NJ",
    description: "Sarah Vaughan was born in Newark in 1924 and discovered at the Apollo Theater at 18. Her voice — a three-octave instrument of supernatural range and expression — made her one of the greatest jazz singers who ever lived. Newark named a plaza and an annual jazz festival in her honor. This mural on Broad Street celebrates the Divine One's extraordinary legacy.",
    lat: 40.7357, lng: -74.1726,
  },
  {
    name: "Newark 1967 — Rising from the Flames",
    city: "Newark", state: "NJ",
    address: "Springfield Ave & Bergen St, Newark, NJ",
    description: "The Newark uprising of July 1967 — sparked by police brutality against a Black cab driver — resulted in 26 deaths and galvanized the city's African American community toward political power. This mural on Springfield Avenue memorializes those who died, honors those who organized, and celebrates Newark's subsequent rise as a majority-Black city with Black political leadership.",
    lat: 40.7265, lng: -74.1914,
  },

  // ══════════════════════════════════════════════════
  // ATLANTA, GA
  // ══════════════════════════════════════════════════
  {
    name: "John Lewis — Good Trouble",
    city: "Atlanta", state: "GA",
    address: "Auburn Ave NE & Jackson St NE, Atlanta, GA",
    description: "John Lewis — son of sharecroppers from Pike County, Alabama — became one of the most courageous figures in American history. He was beaten on the Edmund Pettus Bridge in Selma, served 17 terms in Congress, and told a generation to 'make good trouble.' This mural on Auburn Avenue, steps from the Martin Luther King Jr. National Historic Site, honors the man who embodied the soul of the civil rights movement.",
    lat: 33.7537, lng: -84.3723,
  },
  {
    name: "Outkast — ATL Eternally",
    city: "Atlanta", state: "GA",
    address: "1380 Ralph David Abernathy Blvd SW, Atlanta, GA",
    description: "André 3000 and Big Boi — OutKast — revolutionized hip-hop from Atlanta's West End neighborhood, introducing the South as a creative center of Black American music. 'ATLiens,' 'Aquemini,' and 'Speakerboxxx/The Love Below' are among the most significant albums in hip-hop history. This West End mural honors the duo who put Atlanta on the world's hip-hop map.",
    lat: 33.7381, lng: -84.4116,
  },
  {
    name: "Sweet Auburn — Birthplace of the Movement",
    city: "Atlanta", state: "GA",
    address: "501 Auburn Ave NE, Atlanta, GA",
    description: "Auburn Avenue was once called 'the richest Negro street in America' — home to Black-owned businesses, churches, newspapers, and insurance companies. It is also the birthplace of Martin Luther King Jr. This mural celebrates Sweet Auburn's golden era as the capital of Black Atlanta's economic and spiritual life, and its enduring role as sacred civil rights ground.",
    lat: 33.7537, lng: -84.3720,
  },
  {
    name: "Atlanta BeltLine Diaspora Wall",
    city: "Atlanta", state: "GA",
    address: "1085 Murphy Ave SW, Atlanta, GA",
    description: "A sweeping public art installation along the Atlanta BeltLine's Westside Trail celebrating the African diaspora — West African textile patterns, Caribbean colors, and Southern Black cultural traditions woven into a unified visual narrative. Created by local Black artists, this mural connects Atlanta's historically Black westside neighborhoods to the global Black experience.",
    lat: 33.7299, lng: -84.4231,
  },
  {
    name: "Atlanta Mayors — A Century of Black Leadership",
    city: "Atlanta", state: "GA",
    address: "55 Trinity Ave SW, Atlanta, GA",
    description: "Atlanta has been governed by Black mayors since Maynard Jackson's historic 1973 election. This mural outside City Hall celebrates the arc of Black political leadership in Atlanta — from Maynard Jackson to Andrew Young, Shirley Franklin, Kasim Reed, and the continuing legacy of a city that built Black political power into its very governance.",
    lat: 33.7488, lng: -84.3920,
  },

  // ══════════════════════════════════════════════════
  // NEW ORLEANS, LA
  // ══════════════════════════════════════════════════
  {
    name: "Tremé — Birthplace of Jazz and Black Freedom",
    city: "New Orleans", state: "LA",
    address: "N Rampart St & St Claude Ave, New Orleans, LA",
    description: "The Tremé is the oldest African American neighborhood in the United States, where enslaved and free Black people gathered at Congo Square to drum, dance, and keep African traditions alive. Jazz was born here. This mural honors Tremé's unparalleled contribution to American music and Black cultural survival.",
    lat: 29.9663, lng: -90.0695,
  },
  {
    name: "Louis Armstrong — Satchmo's Home",
    city: "New Orleans", state: "LA",
    address: "718 N Rampart St, New Orleans, LA",
    description: "Louis Armstrong was born near Jane Alley in the Back o' Town neighborhood of New Orleans in 1901. He learned cornet at the Colored Waif's Home for Boys and went on to become one of the most influential musicians in American history. This mural near Armstrong Park celebrates the trumpeter who carried New Orleans jazz — and Black American genius — to the world.",
    lat: 29.9576, lng: -90.0718,
  },
  {
    name: "Big Freedia — Queen of Bounce",
    city: "New Orleans", state: "LA",
    address: "St Claude Ave & Marais St, New Orleans, LA",
    description: "Freddie Ross Jr. — Big Freedia — is the Queen Diva of New Orleans Bounce music, the hyper-local genre born in the city's Third Ward and Central City neighborhoods. Big Freedia has carried New Orleans Black queer culture to international stages while remaining rooted in the 9th Ward. This St. Claude mural honors a city legend.",
    lat: 29.9680, lng: -90.0605,
  },
  {
    name: "Congo Square — Where African Music Survived",
    city: "New Orleans", state: "LA",
    address: "Armstrong Park, Rampart & St Philip, New Orleans, LA",
    description: "Congo Square is one of the most historically significant sites in American music history. Under French and Spanish law, enslaved Africans were permitted to gather here on Sundays to drum, sing, and trade — keeping West African musical traditions alive that would eventually become jazz, blues, funk, and the entire American popular music tradition. This mural honors that sacred ground.",
    lat: 29.9575, lng: -90.0716,
  },
  {
    name: "Fats Domino — The Fat Man of the Quarter",
    city: "New Orleans", state: "LA",
    address: "Caffin Ave & N Rampart St, New Orleans, LA",
    description: "Antoine 'Fats' Domino was born in the Lower 9th Ward in 1928. His rolling piano style and hits like 'Blueberry Hill' and 'Ain't That a Shame' helped invent rock and roll. He lived his entire life in New Orleans and refused to leave even after Katrina — returning to rebuild on Marigny Street. This 9th Ward mural honors the Fat Man who never left home.",
    lat: 29.9543, lng: -90.0294,
  },

  // ══════════════════════════════════════════════════
  // HOUSTON, TX
  // ══════════════════════════════════════════════════
  {
    name: "Juneteenth Heritage Wall — Freedmen's Town",
    city: "Houston", state: "TX",
    address: "Andrews St & Wilson St, Houston, TX",
    description: "Houston's Freedmen's Town in the Fourth Ward was established by formerly enslaved people after emancipation and became the cultural and economic heart of Black Houston. On June 19, 1865, federal troops arrived in Galveston to announce the end of slavery — two and a half years after the Emancipation Proclamation. This mural in Freedmen's Town celebrates the birthplace of Juneteenth.",
    lat: 29.7637, lng: -95.3919,
  },
  {
    name: "Project Row Houses — Community as Canvas",
    city: "Houston", state: "TX",
    address: "2521 Holman St, Houston, TX",
    description: "Project Row Houses, founded by artist Rick Lowe, transformed 22 derelict shotgun houses in the Third Ward into a living art installation and community anchor. This mural across the Row Houses celebrates the revolutionary idea that art-making and community-building are the same act — a philosophy that has influenced public art movements worldwide.",
    lat: 29.7457, lng: -95.3509,
  },
  {
    name: "Lightnin' Hopkins — Texas Blues Legend",
    city: "Houston", state: "TX",
    address: "3100 Dowling St, Houston, TX",
    description: "Sam 'Lightnin'' Hopkins was born in Centerville, Texas, but he made Houston's Third Ward his home and his stage. His raw, personalized Texas blues style was a direct link between the rural Delta tradition and urban Houston soul. This Third Ward mural honors the guitar-picker who influenced generations of blues, rock, and soul musicians.",
    lat: 29.7540, lng: -95.3603,
  },
  {
    name: "Beyoncé — Renaissance of the Third Ward",
    city: "Houston", state: "TX",
    address: "3313 Sampson St, Houston, TX",
    description: "Beyoncé Knowles was born and raised in the Third Ward of Houston and has never stopped claiming it. From Destiny's Child to Renaissance, her work has centered Black Houston — its church roots, its grit, its celebration. This Third Ward mural honors the city's most globally celebrated daughter and her insistence on honoring where she came from.",
    lat: 29.7440, lng: -95.3530,
  },
  {
    name: "Emancipation Park — Where Houston's Freedom Began",
    city: "Houston", state: "TX",
    address: "3018 Dowling St, Houston, TX",
    description: "Emancipation Park was purchased in 1872 by Black Houstonians — including former slaves — specifically to celebrate Juneteenth. For over 80 years of Jim Crow, it was one of the only public parks in Houston where Black people were welcome. This mural at the park entrance honors the community that pooled $1,000 to purchase their own land for their own celebration.",
    lat: 29.7413, lng: -95.3549,
  },

  // ══════════════════════════════════════════════════
  // MIAMI, FL
  // ══════════════════════════════════════════════════
  {
    name: "Overtown — Little Broadway Lives",
    city: "Miami", state: "FL",
    address: "NW 2nd Ave & NW 9th St, Miami, FL",
    description: "Before integration destroyed it, Overtown was Miami's 'Little Broadway' — a nationally celebrated entertainment district where Ella Fitzgerald, Louis Armstrong, Nat King Cole, and Josephine Baker performed for Black audiences. This Overtown mural celebrates what was lost, what survived, and what is being rebuilt in Miami's original Black neighborhood.",
    lat: 25.7775, lng: -80.1990,
  },
  {
    name: "Haitian Heritage Wall — Little Haiti",
    city: "Miami", state: "FL",
    address: "NE 2nd Ave & NE 58th St, Miami, FL",
    description: "Miami's Little Haiti is the largest Haitian community outside of Haiti itself. This sweeping mural on NE 2nd Avenue celebrates Haitian history, art, and diaspora identity — from Toussaint Louverture and the Haitian Revolution to the Haitian Americans who rebuilt their lives in Miami. An unmissable expression of Caribbean Black culture and freedom.",
    lat: 25.8461, lng: -80.1975,
  },
  {
    name: "Edgewater — Afro-Cuban Miami",
    city: "Miami", state: "FL",
    address: "Biscayne Blvd & NE 21st St, Miami, FL",
    description: "Miami's African Cuban community — one of the largest in the United States — has shaped the city's music, food, religion, and culture for generations. This mural celebrates Afro-Cuban identity and tradition: Santería, Conga, Rumba, and the Afro-Latino spiritual and artistic heritage that flows through Miami's veins.",
    lat: 25.7963, lng: -80.1847,
  },
  {
    name: "Liberty City — A Community That Survived",
    city: "Miami", state: "FL",
    address: "NW 62nd St & NW 17th Ave, Miami, FL",
    description: "Liberty City is where Miami's Black community built its own world — churches, businesses, political organizations — after being displaced from neighborhoods like Overtown. The 1980 McDuffie uprising in Liberty City was one of the most significant urban uprisings of the civil rights era. This mural honors the neighborhood's survival and enduring community spirit.",
    lat: 25.8396, lng: -80.2202,
  },

  // ══════════════════════════════════════════════════
  // CHICAGO, IL
  // ══════════════════════════════════════════════════
  {
    name: "Wall of Respect — The Origin",
    city: "Chicago", state: "IL",
    address: "43rd St & S Langley Ave, Chicago, IL",
    description: "In 1967, the Organization of Black American Culture painted the original Wall of Respect at 43rd & Langley in Bronzeville — the first community mural movement in America. It sparked the mural movement that gave cities like Chicago, Philadelphia, and Los Angeles their vibrant public art traditions. This tribute mural marks the site of one of the most consequential public artworks in American history.",
    lat: 41.8175, lng: -87.6095,
  },
  {
    name: "Harold Washington — The People's Mayor",
    city: "Chicago", state: "IL",
    address: "4748 S Dr. Martin Luther King Jr Dr, Chicago, IL",
    description: "Harold Washington became Chicago's first Black mayor in 1983 — defeating the old political machine in a campaign that galvanized the city's Black and Latino communities. His administration was a watershed moment in American urban politics. This Bronzeville mural honors the mayor who told Chicago that power had to be shared, not hoarded.",
    lat: 41.8097, lng: -87.6133,
  },
  {
    name: "Mahalia Jackson — Gospel Queen of Chicago",
    city: "Chicago", state: "IL",
    address: "7900 S South Shore Dr, Chicago, IL",
    description: "Mahalia Jackson moved from New Orleans to Chicago in 1927 and became the most influential gospel singer in American history. She was the voice behind the civil rights movement — she sang at the March on Washington moments before MLK delivered his 'I Have a Dream' speech. This South Side mural honors the Queen of Gospel in her adopted hometown.",
    lat: 41.7525, lng: -87.5687,
  },
  {
    name: "Gwendolyn Brooks — Bronzeville Poet Laureate",
    city: "Chicago", state: "IL",
    address: "4240 S Dr. Martin Luther King Jr Dr, Chicago, IL",
    description: "Gwendolyn Brooks was born in Topeka, Kansas, but she was Bronzeville's poet. In 1950 she became the first African American to win a Pulitzer Prize for poetry, for 'Annie Allen' — a collection about Black life in Chicago's South Side neighborhoods. This mural honors the poet who made Bronzeville immortal in verse.",
    lat: 41.8188, lng: -87.6158,
  },
  {
    name: "Bronzeville — The Great Migration's Home",
    city: "Chicago", state: "IL",
    address: "4700 S Cottage Grove Ave, Chicago, IL",
    description: "Bronzeville was the destination for hundreds of thousands of Black Southerners who fled Jim Crow in the Great Migration from 1910–1970. It became one of the richest concentrations of Black artistic, economic, and intellectual life in American history — home to Ida B. Wells, Richard Wright, Nat King Cole, Muddy Waters, and countless others. This mural celebrates Bronzeville's magnificent history.",
    lat: 41.8080, lng: -87.6063,
  },

  // ══════════════════════════════════════════════════
  // DETROIT, MI
  // ══════════════════════════════════════════════════
  {
    name: "Birth of Soul — Motown Heritage Wall",
    city: "Detroit", state: "MI",
    address: "2648 W Grand Blvd, Detroit, MI",
    description: "Berry Gordy founded Motown Records in a house at 2648 W Grand Blvd — 'Hitsville USA' — in 1959. Smokey Robinson, Diana Ross, Marvin Gaye, Stevie Wonder, and the Four Tops recorded there, creating the soundtrack of a generation. This mural celebrates the factory town that made the music of the soul era — Black genius in an assembly line of excellence.",
    lat: 42.3742, lng: -83.0837,
  },
  {
    name: "Rosa Parks — Mother of the Movement",
    city: "Detroit", state: "MI",
    address: "Rosa Parks Blvd & W Grand Blvd, Detroit, MI",
    description: "Rosa Parks moved to Detroit in 1957 after death threats following the Montgomery Bus Boycott, and lived here until her death in 2005. The street where she lived is named in her honor. This mural celebrates the woman whose refusal to give up her seat on a Montgomery bus — an act of exhausted courage — ignited the modern civil rights movement.",
    lat: 42.3555, lng: -83.0730,
  },
  {
    name: "Detroit Techno — An African American Invention",
    city: "Detroit", state: "MI",
    address: "1512 Woodward Ave, Detroit, MI",
    description: "Electronic dance music was invented by Black teenagers from Detroit's east side — Juan Atkins, Derrick May, and Kevin Saunderson — in the early 1980s. Detroit Techno, drawing from Parliament-Funkadelic, electronic soul, and futurist science fiction, created a global music movement. This mural honors the African American teenagers who built the foundation of the world's electronic music culture.",
    lat: 42.3325, lng: -83.0486,
  },
  {
    name: "Paradise Valley — Black Bottom Remembered",
    city: "Detroit", state: "MI",
    address: "Gratiot Ave & St Antoine St, Detroit, MI",
    description: "Black Bottom and Paradise Valley were the thriving African American neighborhoods of Detroit — destroyed by urban renewal in the 1950s and 1960s to make way for I-375. They were home to jazz clubs, Black-owned businesses, and an extraordinary community. This mural on the edge of where they stood memorializes what was taken and celebrates what those communities created.",
    lat: 42.3336, lng: -83.0430,
  },

  // ══════════════════════════════════════════════════
  // LOS ANGELES, CA
  // ══════════════════════════════════════════════════
  {
    name: "Great Wall of Los Angeles — African American History Panels",
    city: "Los Angeles", state: "CA",
    address: "12900 Oxnard St, Van Nuys, CA",
    description: "The Great Wall of Los Angeles, painted by artist Judy Baca with hundreds of youth, spans half a mile along the Tujunga Wash and depicts the history of California's peoples from prehistoric times to the 1950s — with powerful panels on the African American experience in California, the Zoot Suit Riots, and the contributions of Black Angelenos throughout history.",
    lat: 34.1877, lng: -118.4419,
  },
  {
    name: "Nipsey Hussle — The Marathon Continues",
    city: "Los Angeles", state: "CA",
    address: "Crenshaw Blvd & Slauson Ave, Los Angeles, CA",
    description: "Nipsey Hussle — Ermias Joseph Asghedom — built his legacy on the intersection of Crenshaw and Slauson in South LA. The Marathon Clothing store, his community investment philosophy, and his murder in front of his own store in 2019 made this corner sacred ground. This mural captures the rapper-entrepreneur who believed in owning your own block — literally.",
    lat: 33.9880, lng: -118.3394,
  },
  {
    name: "Leimert Park — Soul of Black Los Angeles",
    city: "Los Angeles", state: "CA",
    address: "4395 Leimert Blvd, Los Angeles, CA",
    description: "Leimert Park is the cultural heart of Black Los Angeles — home to the World Stage jazz venue, 5th Street Dick's coffee house, and a long tradition of community art, drumming circles, and cultural gatherings. This mural at Leimert Park Plaza celebrates the neighborhood as the center of African American culture on the West Coast.",
    lat: 33.9893, lng: -118.3363,
  },
  {
    name: "Crenshaw — A Community that Built Itself",
    city: "Los Angeles", state: "CA",
    address: "3611 W Martin Luther King Jr Blvd, Los Angeles, CA",
    description: "The Crenshaw district is one of the most significant Black communities in America — a neighborhood of homeowners, small businesses, and community institutions built by Black Angelenos who arrived during the Great Migration and were excluded from much of the city by racial covenants. This mural honors the self-built nature of Black Los Angeles.",
    lat: 33.9837, lng: -118.3387,
  },

  // ══════════════════════════════════════════════════
  // OAKLAND, CA
  // ══════════════════════════════════════════════════
  {
    name: "Black Panther Party — Born in Oakland",
    city: "Oakland", state: "CA",
    address: "1048 Peralta St, Oakland, CA",
    description: "The Black Panther Party for Self-Defense was founded by Huey P. Newton and Bobby Seale in Oakland in 1966. Their ten-point program, free breakfast for children, community clinics, and armed self-defense patrols transformed American political thinking. This mural near the party's North Oakland founding neighborhood honors one of the most consequential political organizations in American history.",
    lat: 37.8105, lng: -122.2706,
  },
  {
    name: "Oscar Grant — We Are All Oscar Grant",
    city: "Oakland", state: "CA",
    address: "7th St & Mandela Pkwy, Oakland, CA",
    description: "Oscar Juliuss Grant III was shot and killed by Bay Area Rapid Transit police officer Johannes Mehserle at the Fruitvale BART station on January 1, 2009. His death was captured on video and sparked years of protest that directly influenced the Black Lives Matter movement. This West Oakland mural honors his memory and the movement his death inspired.",
    lat: 37.8064, lng: -122.2867,
  },
  {
    name: "Esmé — Oakland Uprising Heritage Wall",
    city: "Oakland", state: "CA",
    address: "Telegraph Ave & 30th St, Oakland, CA",
    description: "Oakland has been a center of Black uprising and resistance since the 1960s — from the Black Panthers to the Occupy movement to the 2020 George Floyd uprisings. This mural on the Temescal/North Oakland corridor celebrates the long tradition of Oakland as a city that fights back, organized by Black Oakland's incomparable community of organizers and artists.",
    lat: 37.8200, lng: -122.2600,
  },

  // ══════════════════════════════════════════════════
  // CHARLOTTE, NC
  // ══════════════════════════════════════════════════
  {
    name: "Biddle Street — JCSU Legacy Mural",
    city: "Charlotte", state: "NC",
    address: "Beatties Ford Rd & West Blvd, Charlotte, NC",
    description: "Johnson C. Smith University — historically Black, founded 1867 — has been the intellectual center of Charlotte's Black community for over 150 years. The Beatties Ford Road corridor, which runs through JCSU's neighborhood, was the heart of Black Charlotte's professional class. This mural honors the HBCU and the Black community that built its world along Beatties Ford Road.",
    lat: 35.2579, lng: -80.8820,
  },
  {
    name: "West Charlotte Rising — Heritage Wall",
    city: "Charlotte", state: "NC",
    address: "3229 Freedom Dr, Charlotte, NC",
    description: "West Charlotte has been the center of Charlotte's African American community for decades. This mural on Freedom Drive celebrates the neighborhood's history — its churches, schools, businesses, and civic leaders — and the generations of Black Charlotteans who built their community with intentionality and pride.",
    lat: 35.2196, lng: -80.8828,
  },
  {
    name: "J.T. Williams — Charlotte's First Black Leader",
    city: "Charlotte", state: "NC",
    address: "2801 Beatties Ford Rd, Charlotte, NC",
    description: "James Taylor Williams was Charlotte's first African American city council member, elected in 1965. He was followed by a generation of Black leaders who transformed Charlotte's politics. This mural on the Beatties Ford corridor honors the trailblazers who opened Charlotte's political doors.",
    lat: 35.2582, lng: -80.8839,
  },

  // ══════════════════════════════════════════════════
  // RICHMOND, VA
  // ══════════════════════════════════════════════════
  {
    name: "Jackson Ward — Harlem of the South",
    city: "Richmond", state: "VA",
    address: "2nd St & Leigh St, Richmond, VA",
    description: "Jackson Ward was once called 'the Harlem of the South' and 'the Wall Street of Black America' — a self-sustaining African American neighborhood home to Maggie L. Walker's St. Luke Penny Savings Bank, Black theaters, hotels, and professional offices. This mural celebrates Jackson Ward's extraordinary legacy as one of the greatest Black urban communities in American history.",
    lat: 37.5483, lng: -77.4404,
  },
  {
    name: "Maggie L. Walker — First Woman Bank President",
    city: "Richmond", state: "VA",
    address: "Broad St & Adams St, Richmond, VA",
    description: "Maggie Lena Walker was born in Richmond in 1864 and became the first woman of any race to charter and serve as president of a bank in the United States — the St. Luke Penny Savings Bank in Jackson Ward. Her bank provided mortgages to Black Richmonders when white-owned banks refused them. This mural honors the financial pioneer who built Black Richmond's economic foundation.",
    lat: 37.5484, lng: -77.4390,
  },
  {
    name: "Monument Ave — Reclaimed",
    city: "Richmond", state: "VA",
    address: "Monument Ave & Lombardy St, Richmond, VA",
    description: "After generations of Confederate monuments on Monument Avenue, the City of Richmond removed the statues in 2020 following nationwide uprisings. A temporary mural of George Floyd and Black Lives Matter imagery was painted on the Robert E. Lee base before its removal. This new mural reclaims Monument Avenue as a site of Black healing, not Confederate veneration.",
    lat: 37.5555, lng: -77.4598,
  },

  // ══════════════════════════════════════════════════
  // BIRMINGHAM, AL
  // ══════════════════════════════════════════════════
  {
    name: "Foot Soldiers — The 16th Street Story",
    city: "Birmingham", state: "AL",
    address: "1530 6th Ave N, Birmingham, AL",
    description: "The 16th Street Baptist Church — bombed by the KKK in 1963, killing four young girls — stands across Kelly Ingram Park from this mural. The foot soldiers of Birmingham endured fire hoses, police dogs, and bombs to confront American apartheid. This mural, steps from where it happened, honors the children and adults who faced the violence of white supremacy with nonviolent courage.",
    lat: 33.5149, lng: -86.8128,
  },
  {
    name: "Angela Davis — Born in Birmingham",
    city: "Birmingham", state: "AL",
    address: "1632 4th Ave N, Birmingham, AL",
    description: "Angela Davis was born and raised in the Smithfield neighborhood of Birmingham — the 'Dynamite Hill' area targeted by KKK bombings. She became one of the most prominent political activists and philosophers in American history, a professor, author, and lifelong organizer for racial justice. This mural honors the Birmingham daughter who never stopped fighting.",
    lat: 33.5212, lng: -86.8175,
  },
  {
    name: "Birmingham Black Barons — Negro Leagues Legacy",
    city: "Birmingham", state: "AL",
    address: "900 Graymont Ave W, Birmingham, AL",
    description: "The Birmingham Black Barons were one of the most storied franchises in the Negro Leagues — the team that gave Willie Mays his professional start. They played at Rickwood Field, the oldest professional baseball park in America. This mural honors the Black Barons and the Negro Leagues as a monument to Black excellence under apartheid conditions.",
    lat: 33.5021, lng: -86.8125,
  },

  // ══════════════════════════════════════════════════
  // MEMPHIS, TN
  // ══════════════════════════════════════════════════
  {
    name: "Beale Street Blues Wall — African American Sound",
    city: "Memphis", state: "TN",
    address: "246 Beale St, Memphis, TN",
    description: "Beale Street is where the blues moved from the Mississippi Delta to the city — where W.C. Handy wrote 'Memphis Blues' and 'St. Louis Blues,' and where B.B. King played his way out of poverty. This mural on the historic entertainment district's main strip celebrates the African American musical genius that gave America its most distinctive art form.",
    lat: 35.1394, lng: -90.0523,
  },
  {
    name: "MLK — The Mountaintop, Memphis",
    city: "Memphis", state: "TN",
    address: "450 Mulberry St, Memphis, TN",
    description: "Martin Luther King Jr. was assassinated on the balcony of the Lorraine Motel in Memphis on April 4, 1968 — where he had come to support striking Black sanitation workers. The night before his death he preached 'I've Been to the Mountaintop' at Mason Temple. This mural near the Civil Rights Museum memorializes the last days of America's most important moral leader.",
    lat: 35.1344, lng: -90.0591,
  },
  {
    name: "Orange Mound — America's First Black Neighborhood",
    city: "Memphis", state: "TN",
    address: "2545 Park Ave, Memphis, TN",
    description: "Orange Mound, established in 1890, is widely considered the first neighborhood in the United States built by and for African Americans. Developed by formerly enslaved people who pooled resources to purchase land, it remains a historically significant Black community. This mural honors Orange Mound's founders and the revolutionary act of building your own neighborhood.",
    lat: 35.1108, lng: -89.9813,
  },
  {
    name: "Memphis Soul — Al Green, Soulsville USA",
    city: "Memphis", state: "TN",
    address: "926 E McLemore Ave, Memphis, TN",
    description: "Stax Records in the Soulsville neighborhood of Memphis was where Otis Redding, Sam & Dave, Isaac Hayes, and Booker T. & the MGs created the Memphis soul sound. Al Green's Hi Records was two miles away. This mural celebrates Soulsville — a Black neighborhood that produced a global sound — and the workers and musicians who made it possible.",
    lat: 35.1021, lng: -90.0257,
  },

  // ══════════════════════════════════════════════════
  // NASHVILLE, TN
  // ══════════════════════════════════════════════════
  {
    name: "Fisk University — Art in the Soul of Black Nashville",
    city: "Nashville", state: "TN",
    address: "1000 17th Ave N, Nashville, TN",
    description: "Fisk University was founded in 1866 for formerly enslaved people and became one of the most significant HBCUs in America. W.E.B. Du Bois, Ida B. Wells, and John Hope Franklin studied or taught here. The Fisk Jubilee Singers introduced spirituals to the world. This mural near Fisk's campus celebrates the university's extraordinary contribution to Black intellectual and cultural life.",
    lat: 36.1712, lng: -86.8098,
  },
  {
    name: "Jubilee Hall — Built on Spirituals",
    city: "Nashville", state: "TN",
    address: "Jackson St & 17th Ave N, Nashville, TN",
    description: "Jubilee Hall at Fisk University, built in 1876, was funded by the touring proceeds of the Fisk Jubilee Singers — the first Black ensemble to perform spirituals for international audiences. They sang for Queen Victoria, President Ulysses Grant, and European royalty to raise money for their university. This mural honors the singers who turned the music of slavery into the institution of Black higher education.",
    lat: 36.1727, lng: -86.8110,
  },
  {
    name: "Jefferson Street — Nashville's Black Broadway",
    city: "Nashville", state: "TN",
    address: "2300 Jefferson St, Nashville, TN",
    description: "Jefferson Street in North Nashville was once a thriving Black entertainment corridor — clubs, theaters, and businesses that served the community during segregation. Jimi Hendrix played Jefferson Street clubs as a young performer. This mural celebrates Jefferson Street's golden era and the ongoing revitalization of North Nashville's Black community.",
    lat: 36.1770, lng: -86.8200,
  },

  // ══════════════════════════════════════════════════
  // CLEVELAND, OH
  // ══════════════════════════════════════════════════
  {
    name: "Hough Rising — Heritage Mural",
    city: "Cleveland", state: "OH",
    address: "E 105th St & Superior Ave, Cleveland, OH",
    description: "The Hough neighborhood was the site of Cleveland's 1966 uprising — six days of uprisings sparked by police violence and decades of housing discrimination, unemployment, and neglect. Today Hough is rebuilding. This mural celebrates the neighborhood's survival, its community institutions, and the East Side African American community's long history in Cleveland.",
    lat: 41.5253, lng: -81.5989,
  },
  {
    name: "Carl Stokes — First Black Mayor of a Major City",
    city: "Cleveland", state: "OH",
    address: "601 Lakeside Ave E, Cleveland, OH",
    description: "Carl Burton Stokes was elected mayor of Cleveland in 1967, becoming the first African American mayor of a major American city. His brother Louis Stokes simultaneously won election to Congress. This mural near City Hall honors a political milestone that showed what was possible when Black voters organized — and inspired a generation of Black urban politicians.",
    lat: 41.4993, lng: -81.6935,
  },
  {
    name: "Jesse Owens — Cleveland's Olympic Legend",
    city: "Cleveland", state: "OH",
    address: "E 105th St & Glenmore Ave, Cleveland, OH",
    description: "Jesse Owens was born in Oakville, Alabama, but Cleveland's East Technical High School made him a champion. At the 1936 Berlin Olympics, Owens won four gold medals under the gaze of Adolf Hitler, disproving Nazi theories of racial superiority with every stride. This Cleveland mural honors the most significant athletic performance of the 20th century.",
    lat: 41.5330, lng: -81.5930,
  },

  // ══════════════════════════════════════════════════
  // TAMPA, FL
  // ══════════════════════════════════════════════════
  {
    name: "Central Avenue — Black St. Petersburg Heritage",
    city: "Tampa", state: "FL",
    address: "Central Ave & 22nd St S, St. Petersburg, FL",
    description: "Central Avenue in St. Petersburg was the heart of Tampa Bay's Black community during segregation — a 'Black Broadway' of jazz clubs, barbershops, and businesses. The street still holds the Enoch Davis Center and the Carter G. Woodson African American Museum. This mural celebrates the cultural district that sustained Black life in the Tampa Bay area for over a century.",
    lat: 27.7726, lng: -82.6490,
  },
  {
    name: "Ybor City — Afro-Cuban Soul",
    city: "Tampa", state: "FL",
    address: "7th Ave & 18th St, Tampa, FL",
    description: "Ybor City's Afro-Cuban community — established by cigar workers who emigrated from Cuba in the late 19th century — created a unique intersection of Black, Cuban, and labor culture that defined Tampa's identity. African Cuban spiritual traditions, music, and mutual aid societies flourished here. This mural celebrates the Afro-Cuban community that shaped Ybor City's soul.",
    lat: 27.9601, lng: -82.4367,
  },

  // ══════════════════════════════════════════════════
  // DALLAS, TX
  // ══════════════════════════════════════════════════
  {
    name: "South Dallas — Freedman's Town to Fair Park",
    city: "Dallas", state: "TX",
    address: "3218 Pine St, Dallas, TX",
    description: "South Dallas was the heart of Black Dallas — built by freed slaves after emancipation and sustained through the Jim Crow era as a self-sufficient Black community. This mural near the historic Fair Park area celebrates the history of Black Dallas from emancipation through the Great Migration and into the present, honoring the community that built itself from nothing.",
    lat: 32.7676, lng: -96.7558,
  },
  {
    name: "Oak Cliff — Dallas Diaspora Rising",
    city: "Dallas", state: "TX",
    address: "1414 W Davis St, Dallas, TX",
    description: "Oak Cliff has been home to Dallas's African American, Mexican American, and Caribbean diaspora communities for generations. This mural in the Bishop Arts District neighborhood celebrates the diverse diaspora communities that have shaped Oak Cliff's culture — a neighborhood of community gardens, murals, churches, and persistent community pride.",
    lat: 32.7426, lng: -96.8276,
  },

  // ══════════════════════════════════════════════════
  // DENVER, CO
  // ══════════════════════════════════════════════════
  {
    name: "Five Points — Denver's Black Cultural Heart",
    city: "Denver", state: "CO",
    address: "Welton St & 26th Ave, Denver, CO",
    description: "Denver's Five Points neighborhood was once the 'Harlem of the West' — home to jazz clubs, Black-owned businesses, and the African American community that arrived during the Great Migration. Billie Holiday, Nat King Cole, and Miles Davis performed on Welton Street. This mural celebrates Five Points as the center of Black Denver's cultural legacy.",
    lat: 39.7543, lng: -104.9779,
  },
  {
    name: "Sonny Lawson Park — Black Baseball in Denver",
    city: "Denver", state: "CO",
    address: "2900 Glenarm Pl, Denver, CO",
    description: "Sonny Lawson Park in Five Points was the home field of Denver's Negro League teams — the Black community's gathering space for baseball, community events, and cultural celebration. This mural at the park honors the Black athletes who played here when professional baseball was segregated, and the Five Points community that supported them.",
    lat: 39.7557, lng: -104.9750,
  },
];
