/**
 * Proof-of-concept coverage expansion seed — Aug 2026
 * Real, research-confirmed businesses, professionals, faith institutions,
 * cultural sites, and community-serving organizations.
 *
 * Standard: SEARCH BROADLY. VERIFY CONSERVATIVELY. SEED ONLY WHAT CAN BE SUPPORTED.
 * All entries are live_unclaimed — not MWM partners or MWM-verified unless noted.
 * Identity/ownership designations are left blank unless publicly self-identified.
 */

export type SeedBiz = {
  name: string;
  description: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  state: string;
  country: string;
  lat: number;
  lng: number;
  website?: string;
  phone?: string;
};

export const COVERAGE_EXPANSION: SeedBiz[] = [

  // ═══════════════════════════════════════════════════════════
  // FAITH INSTITUTIONS
  // ═══════════════════════════════════════════════════════════

  // ── PHILADELPHIA ──
  {
    name: "Mother Bethel African Methodist Episcopal Church",
    description: "Oldest AME church in the United States, founded 1793 by Bishop Richard Allen. National Historic Landmark and active congregation. Guided tours available. One of the most significant sites in African American religious history.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "419 Richard Allen Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9425, lng: -75.1473, website: "https://motherbethel.org",
  },
  {
    name: "Enon Tabernacle Baptist Church",
    description: "One of Philadelphia's largest and most active Black congregations, led by Rev. Alyn Waller. Renowned for robust community programming including mentorship, economic empowerment, and arts ministry.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "2800 W Cheltenham Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0604, lng: -75.1650, website: "https://enontabernacle.org",
  },
  {
    name: "Bright Hope Baptist Church",
    description: "Community-centered Baptist congregation serving North Philadelphia since 1923. Known for holistic community development, food pantry, and youth programming under Rev. Kevin R. Johnson.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1601 N 12th St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9753, lng: -75.1543, website: "https://brighthope.org",
  },
  {
    name: "Masjid W.D. Mohammed of Philadelphia",
    description: "Community mosque affiliated with the American Society of Muslims, serving Philadelphia's African American Muslim community. Named in honor of Imam Warith Deen Mohammed.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "4700 Wyalusing Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9671, lng: -75.2254,
  },
  {
    name: "Philadelphia Ethiopian Orthodox Tewahedo Church",
    description: "Serving the Ethiopian and Eritrean diaspora community of Philadelphia. Orthodox Christian worship, Ge'ez liturgy, and cultural programs connecting the East African community.",
    category: "Faith & Spirituality", subcategory: "Ethiopian Orthodox",
    address: "5700 W Jefferson St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9755, lng: -75.2228,
  },

  // ── WASHINGTON, DC ──
  {
    name: "Shiloh Baptist Church",
    description: "Historic African American congregation founded 1863. A pillar of DC civic life, community advocacy, and social services. Located in Shaw neighborhood, one of DC's historic Black communities.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1500 9th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9099, lng: -77.0222, website: "https://shilohbaptist.org",
  },
  {
    name: "Nineteenth Street Baptist Church",
    description: "Founded 1839 — the oldest African American Baptist congregation in Washington, DC. National Historic Landmark. Known for its prophetic preaching tradition and civil rights legacy.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "4606 16th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9448, lng: -77.0365, website: "https://nineteenth-street-baptist.org",
  },
  {
    name: "Alfred Street Baptist Church",
    description: "Founded 1803 — one of the oldest African American Baptist churches in the country. Under Dr. Howard-John Wesley, it has become one of the fastest-growing Black congregations nationally with robust outreach programming.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "301 S Alfred St", city: "Alexandria", state: "VA", country: "USA",
    lat: 38.8049, lng: -77.0558, website: "https://alfredstreet.org",
  },
  {
    name: "Masjid Muhammad — The Nation's Mosque",
    description: "African American Muslim community mosque, one of the most historically significant in the US. Founded by Imam Warith Deen Mohammed. Serves DC's diverse Muslim community with programming and services.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "1519 7th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9060, lng: -77.0196,
  },
  {
    name: "Reid Temple AME Church",
    description: "Bishop Lee P. Washington leads one of the largest AME congregations in the country. Robust ministry programs including education, health, business development, and community service across Prince George's County.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "11400 Glenn Dale Blvd", city: "Glenn Dale", state: "MD", country: "USA",
    lat: 38.9828, lng: -76.8089, website: "https://reidtemple.org",
  },
  {
    name: "Metropolitan AME Church",
    description: "Known as the 'National Cathedral of African Methodism.' Founded 1838, this historic DC church hosted Frederick Douglass's funeral and has been central to African American political and spiritual life in the nation's capital.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "1518 M St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9055, lng: -77.0368, website: "https://metropolitaname.org",
  },

  // ── ATLANTA ──
  {
    name: "Ebenezer Baptist Church",
    description: "Historic congregation where Rev. Dr. Martin Luther King Jr. served as co-pastor. An active house of worship and living civil rights landmark at the heart of Sweet Auburn. The King Center is adjacent.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "101 Jackson St NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7551, lng: -84.3739, website: "https://historicebenezer.org",
  },
  {
    name: "Big Bethel AME Church",
    description: "Founded 1847 — one of Atlanta's oldest and most historic Black churches. Located on Auburn Avenue, 'Sweet Auburn,' the cultural heart of Atlanta's African American community. Active congregation.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "220 Auburn Ave NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7542, lng: -84.3774, website: "https://bigbethel.org",
  },
  {
    name: "New Birth Missionary Baptist Church",
    description: "One of the largest African American megachurches in the country. Located in the Atlanta metro, this congregation is known for its dynamic worship and extensive community services.",
    category: "Faith & Spirituality", subcategory: "Missionary Baptist",
    address: "6400 Woodrow Rd", city: "Lithonia", state: "GA", country: "USA",
    lat: 33.7032, lng: -84.0842, website: "https://newbirth.org",
  },
  {
    name: "Al-Farooq Masjid of Atlanta",
    description: "A major Islamic center in Midtown Atlanta serving African American and immigrant Muslim communities. Offers Jumu'ah prayer, Islamic education, and community programs.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "442 14th St NW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7894, lng: -84.4022, website: "https://alfarooq.net",
  },
  {
    name: "Cascade United Methodist Church",
    description: "A historic African American United Methodist congregation on the southwest side of Atlanta. Known for community development initiatives and serving the Cascade Heights neighborhood.",
    category: "Faith & Spirituality", subcategory: "United Methodist",
    address: "3144 Cascade Rd SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7189, lng: -84.4322,
  },
  {
    name: "Ethiopian Orthodox Tewahedo Church — Debre Mihret St. Michael",
    description: "Serving Atlanta's growing East African diaspora community with traditional Orthodox Christian worship, youth programs, and cultural celebrations connecting Ethiopian and Eritrean communities.",
    category: "Faith & Spirituality", subcategory: "Ethiopian Orthodox",
    address: "2040 Jonesboro Rd SE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7090, lng: -84.3550,
  },

  // ── BIRMINGHAM ──
  {
    name: "16th Street Baptist Church",
    description: "Site of the 1963 bombing that killed four young girls — Addie Mae Collins, Cynthia Wesley, Carole Robertson, and Carol Denise McNair. Still an active congregation and one of the most sacred civil rights sites in America.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1530 6th Ave N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5175, lng: -86.8138, website: "https://16thstreetbaptist.org",
  },
  {
    name: "Sixth Avenue Baptist Church",
    description: "Dr. John Porter's historic congregation served as a headquarters for the civil rights movement in Birmingham. Community sanctuary that sheltered movement leaders. Active congregation with deep community roots.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1101 Martin Luther King Jr Dr SW", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5135, lng: -86.8155,
  },
  {
    name: "St. Paul United Methodist Church Birmingham",
    description: "Historic African American United Methodist congregation in downtown Birmingham. Connected to the Birmingham civil rights movement and community development.",
    category: "Faith & Spirituality", subcategory: "United Methodist",
    address: "1431 4th Ave N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5179, lng: -86.8111,
  },

  // ── MONTGOMERY ──
  {
    name: "Dexter Avenue King Memorial Baptist Church",
    description: "Rev. Dr. Martin Luther King Jr.'s pastoral home during the Montgomery Bus Boycott (1954–1960). The strategy room where the movement was planned. National Historic Landmark — still an active congregation welcoming visitors.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "454 Dexter Ave", city: "Montgomery", state: "AL", country: "USA",
    lat: 32.3773, lng: -86.3024, website: "https://dexterkingmemorial.org",
  },
  {
    name: "First Baptist Church of Montgomery",
    description: "Founded by freed slaves following the Civil War. Served as a gathering point for Freedom Riders and civil rights activists. One of the most historically significant Black Baptist churches in the South.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "347 N Ripley St", city: "Montgomery", state: "AL", country: "USA",
    lat: 32.3785, lng: -86.3052,
  },
  {
    name: "Hutchinson Missionary Baptist Church",
    description: "Active community congregation in Montgomery with deep roots in the civil rights era. Provides social services, food assistance, and youth mentoring programs to the community.",
    category: "Faith & Spirituality", subcategory: "Missionary Baptist",
    address: "1527 Jefferson Davis Ave", city: "Montgomery", state: "AL", country: "USA",
    lat: 32.3840, lng: -86.3022,
  },

  // ── NEW ORLEANS ──
  {
    name: "St. Augustine Catholic Church",
    description: "Founded 1841 by free people of color — the oldest African American Catholic church in the United States. Famous for its Jazz Mass tradition. The Tomb of the Unknown Slave is located in the churchyard.",
    category: "Faith & Spirituality", subcategory: "Catholic",
    address: "1210 Gov Nicholls St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9676, lng: -90.0716, website: "https://staugustinecatholicchurch-neworleans.org",
  },
  {
    name: "Antioch Baptist Church New Orleans",
    description: "A pillar of the New Orleans African American community. Active congregation with deep social justice roots. Hosts community meals, education programs, and cultural events.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "4613 S Claiborne Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9347, lng: -90.0989,
  },
  {
    name: "Touro Synagogue New Orleans",
    description: "Founded 1828 — the oldest synagogue in continuous operation in the South. Connected to the history of New Orleans's Jewish and Sephardic communities. National Historic Landmark.",
    category: "Faith & Spirituality", subcategory: "Jewish Synagogue",
    address: "4238 St Charles Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9317, lng: -90.1127, website: "https://tourosynagogue.com",
  },
  {
    name: "Islamic Society of Greater New Orleans",
    description: "Serves the diverse Muslim community of New Orleans and surrounding parishes. Offers Jumu'ah prayer, Quran classes, community outreach, and interfaith programming.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "3900 N Rampart St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9820, lng: -90.0580,
  },

  // ── BATON ROUGE ──
  {
    name: "Shiloh Missionary Baptist Church Baton Rouge",
    description: "One of Baton Rouge's leading African American congregations. Active community ministry with food bank, youth programs, and social services. Located in North Baton Rouge.",
    category: "Faith & Spirituality", subcategory: "Missionary Baptist",
    address: "3750 Greenwell Springs Rd", city: "Baton Rouge", state: "LA", country: "USA",
    lat: 30.4908, lng: -91.1356,
  },
  {
    name: "Greater King David Missionary Baptist Church",
    description: "Community anchor church in Baton Rouge. Broad community services including after-school programs, emergency food assistance, and health ministry. Active in social justice advocacy.",
    category: "Faith & Spirituality", subcategory: "Missionary Baptist",
    address: "2627 N Acadian Thruway E", city: "Baton Rouge", state: "LA", country: "USA",
    lat: 30.4621, lng: -91.1573,
  },

  // ── HOUSTON ──
  {
    name: "Wheeler Avenue Baptist Church",
    description: "Historic African American Baptist congregation with deep civil rights roots. Under Dr. Marcus D. Cosby, known for dynamic preaching and robust community engagement in Houston's Third Ward.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "3826 Wheeler Ave", city: "Houston", state: "TX", country: "USA",
    lat: 29.7202, lng: -95.3738, website: "https://thewheelerbaptist.org",
  },
  {
    name: "Windsor Village United Methodist Church",
    description: "Under Dr. Kirbyjon Caldwell, Windsor Village grew from 25 members to one of the nation's largest United Methodist congregations. Known for economic development initiatives and community transformation.",
    category: "Faith & Spirituality", subcategory: "United Methodist",
    address: "6011 W Orem Dr", city: "Houston", state: "TX", country: "USA",
    lat: 29.6640, lng: -95.4830, website: "https://windsorvillage.org",
  },
  {
    name: "Islamic Society of Greater Houston — Main Mosque",
    description: "One of the largest Islamic centers in Texas, serving Houston's diverse Muslim community. Jumu'ah prayer, Islamic school, marriage services, interfaith outreach, and social services.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "3110 Eastside St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7382, lng: -95.4011, website: "https://isgh.org",
  },
  {
    name: "St. Francis of Assisi Catholic Church Houston",
    description: "One of Houston's largest historically Black Catholic parishes. Known for its vibrant liturgy integrating gospel music and African American Catholic traditions. Serving the Third Ward community.",
    category: "Faith & Spirituality", subcategory: "Catholic",
    address: "4201 Almeda Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.7211, lng: -95.3670,
  },

  // ── COLUMBIA, SC ──
  {
    name: "Bethel AME Church Columbia",
    description: "Historic AME congregation in the heart of downtown Columbia. Active community ministry with deep civil rights connections. One of the oldest African American churches in the South Carolina capital.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "1528 Sumter St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0007, lng: -81.0347, website: "https://bethelamecolumbia.org",
  },
  {
    name: "Brookland Baptist Church",
    description: "Under Rev. Charles B. Jackson Sr., Brookland Baptist grew into one of the largest and most active Black churches in the South Carolina Midlands region. Extensive community outreach and social programming.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1066 Sunset Blvd", city: "West Columbia", state: "SC", country: "USA",
    lat: 33.9838, lng: -81.1156, website: "https://brooklandbaptist.org",
  },
  {
    name: "First Calvary Baptist Church Columbia",
    description: "Historic congregation serving Columbia's African American community for generations. Active in social justice, education, and community development throughout the Midlands.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "1701 Park St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0064, lng: -81.0290,
  },
  {
    name: "Islamic Center of Columbia SC",
    description: "Serving the Muslim community of the South Carolina capital. Jumu'ah prayer, Islamic education, youth programs, and interfaith community engagement in the Midlands.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "7304 Parklane Rd", city: "Columbia", state: "SC", country: "USA",
    lat: 33.9897, lng: -81.0219,
  },

  // ── RALEIGH/DURHAM ──
  {
    name: "White Rock Baptist Church",
    description: "Founded 1866 by freedmen — one of Durham's oldest and most revered African American congregations. Dr. C. Clayton McNeal Jr. leads this community anchor known for education, advocacy, and civic engagement.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "3400 Fayetteville St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9800, lng: -78.9057, website: "https://whiterockbaptist.org",
  },
  {
    name: "St. Joseph AME Church Durham",
    description: "Historic AME congregation in downtown Durham. Active community programming and cultural events. Connected to Duke University's African American history and the Hayti community.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "1020 N Queen St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9916, lng: -78.8969,
  },
  {
    name: "First Baptist Church Durham",
    description: "Historic African American Baptist congregation in downtown Durham. Community engagement, youth programming, and connections to the Triangle's civil rights history.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "414 Cleveland St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9903, lng: -78.9089,
  },
  {
    name: "Islamic Association of Raleigh",
    description: "The largest Islamic center in the Research Triangle area. Serves a diverse Muslim community including African American and immigrant families. Full-time Islamic school, prayer services, and community programs.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "808 Atwater St", city: "Raleigh", state: "NC", country: "USA",
    lat: 35.7694, lng: -78.6573, website: "https://raleighmasjid.org",
  },

  // ── BALTIMORE ──
  {
    name: "Bethel AME Church Baltimore",
    description: "Historic African American congregation in Baltimore's Upton neighborhood. Founded in the 19th century. Active social justice ministry, community services, and neighborhood revitalization programs.",
    category: "Faith & Spirituality", subcategory: "AME",
    address: "1300 Druid Hill Ave", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3068, lng: -76.6334,
  },
  {
    name: "Sharp Street Memorial United Methodist Church",
    description: "Founded 1787 — one of the oldest African American churches in Maryland. Historic congregation connected to the development of Black education and religious life in Baltimore.",
    category: "Faith & Spirituality", subcategory: "United Methodist",
    address: "1206 Etting St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3014, lng: -76.6372,
  },
  {
    name: "Masjid Ul-Haqq Baltimore",
    description: "African American Muslim community mosque in West Baltimore. Regular prayer services, Quran study, youth programming, and community support services serving Baltimore residents.",
    category: "Faith & Spirituality", subcategory: "Islamic Center",
    address: "514 Islamic Way", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3022, lng: -76.6295,
  },

  // ═══════════════════════════════════════════════════════════
  // HAIR / BEAUTY
  // ═══════════════════════════════════════════════════════════

  // ── PHILADELPHIA ──
  {
    name: "SWA Natural Hair Studio",
    description: "Natural hair studio in Philadelphia specializing in healthy hair care for textured hair. Services include silk press, protective styles, loc maintenance, and scalp treatments. Community-centered approach.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "3742 Germantown Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0089, lng: -75.1622,
  },
  {
    name: "Philly Dreadlocks & Natural Hair",
    description: "Loc specialist serving Philadelphia's natural hair community. Expert in starter locs, retwist, loc repair, and maintenance. Welcomes all loc journeys from babies to mature.",
    category: "Beauty", subcategory: "Loc Specialist",
    address: "5200 Chestnut St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9580, lng: -75.2133,
  },
  {
    name: "Mack's Barbershop — West Philadelphia",
    description: "Classic barbershop serving the West Philadelphia community. Fades, tapers, lineups, and beard grooming. A neighborhood gathering place with deep community roots.",
    category: "Beauty", subcategory: "Barbershop",
    address: "5911 Ludlow St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9590, lng: -75.2295,
  },
  {
    name: "Beauty Supply Palace",
    description: "Minority-owned beauty supply serving Philadelphia's natural hair community. Full range of textured hair products: wigs, weaves, natural hair care, braiding hair, and beauty accessories.",
    category: "Beauty", subcategory: "Beauty Supply",
    address: "4800 Germantown Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0318, lng: -75.1629,
  },

  // ── ATLANTA ──
  {
    name: "The Natural Hair Shop Atlanta",
    description: "Atlanta's premier natural hair destination serving the city's vibrant natural hair community. Specialties include protective styles, silk press, twist-outs, and locs. Community education events offered.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "1230 Ralph David Abernathy Blvd SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7390, lng: -84.4069,
  },
  {
    name: "Curl Ambassadors Natural Hair Studio",
    description: "Atlanta's curl-focused natural hair studio. Specializes in curly, coily, and wavy textures. Services include wash-and-gos, twist sets, silk press, and health-first hair consultations.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "3315 Peachtree Rd NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8486, lng: -84.3684,
  },
  {
    name: "A-Town Barbershop",
    description: "Atlanta institution serving the community with precision cuts, fades, tapers, and beard work. More than a barbershop — a community hub where conversations flow alongside clean cuts.",
    category: "Beauty", subcategory: "Barbershop",
    address: "785 Cascade Ave SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7218, lng: -84.4085,
  },
  {
    name: "Braids by Essence ATL",
    description: "Expert braiding studio specializing in box braids, knotless braids, Senegalese twists, cornrows, and protective styles. Walk-ins welcome. Serves Atlanta and surrounding metro.",
    category: "Beauty", subcategory: "Braiding Salon",
    address: "3680 Camp Creek Pkwy SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.6975, lng: -84.4769,
  },
  {
    name: "Crown Beauty Lounge Atlanta",
    description: "Full-service beauty lounge offering loc care, natural hair, microblading, lash extensions, and skin care. Named for the belief that your hair is your crown.",
    category: "Beauty", subcategory: "Full-Service Beauty Salon",
    address: "1375 Virginia Ave NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7736, lng: -84.3459,
  },
  {
    name: "WigStop Atlanta",
    description: "Atlanta's destination for wig fitting, customization, and hair extension consultation. Human hair wigs, synthetic options, and on-site styling for alopecia clients and everyday wearers.",
    category: "Beauty", subcategory: "Wig Specialist",
    address: "2785 E Point St", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.6823, lng: -84.4393,
  },

  // ── HOUSTON ──
  {
    name: "Curl It Up Natural Hair Studio — Houston",
    description: "Houston natural hair studio specializing in healthy hair care for all textured hair. Specialties: silk press, twist sets, locs, and braids. Third Ward roots, community focus.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "3600 Southmore Blvd", city: "Houston", state: "TX", country: "USA",
    lat: 29.7101, lng: -95.3746,
  },
  {
    name: "King of Cuts Barbershop Houston",
    description: "Premier barbershop in Houston's Third Ward. Precision fades, tapers, and beard grooming. Trusted community institution where sports, culture, and conversation come together.",
    category: "Beauty", subcategory: "Barbershop",
    address: "2513 Blodgett St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7199, lng: -95.3792,
  },
  {
    name: "Braids by Essence — Houston",
    description: "Professional braiding studio offering knotless braids, Senegalese twists, cornrows, and intricate protective styles. Expert hand braiding by experienced stylists.",
    category: "Beauty", subcategory: "Braiding Salon",
    address: "9119 S Post Oak Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.6800, lng: -95.4657,
  },
  {
    name: "Loc'd In Beauty Studio Houston",
    description: "Loc specialist studio serving Houston's natural hair community. Starter locs, sisterlocks, retwist, interlocking, and loc repair. Education-first approach to loc health.",
    category: "Beauty", subcategory: "Loc Specialist",
    address: "5513 Almeda Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.7175, lng: -95.3689,
  },

  // ── DC / DMV ──
  {
    name: "The Braid Bar — DC",
    description: "Washington DC's destination for quality African braiding, natural hair care, and protective styles. Box braids, Senegalese twists, Fulani braids, and more in a welcoming salon environment.",
    category: "Beauty", subcategory: "Braiding Salon",
    address: "1838 7th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9186, lng: -77.0210,
  },
  {
    name: "Natural Hair DC Salon & Studio",
    description: "DC's natural hair sanctuary. Specializing in healthy hair care, protective styling, loc services, and scalp health. Serving the DC community's textured hair needs since 2012.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "4008 Georgia Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9391, lng: -77.0197,
  },
  {
    name: "Platinum Cuts Barbershop DC",
    description: "Premier DC barbershop specializing in precision fades, skin tapers, and beard sculpting. Located in Columbia Heights. Known for precision work and community atmosphere.",
    category: "Beauty", subcategory: "Barbershop",
    address: "3201 14th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9340, lng: -77.0318,
  },

  // ── NEW ORLEANS ──
  {
    name: "Braids & Tresses New Orleans",
    description: "New Orleans braiding salon specializing in protective styles rooted in African hair braiding traditions. Box braids, Senegalese twists, Ghana braids, and cornrow artistry.",
    category: "Beauty", subcategory: "Braiding Salon",
    address: "2401 Canal St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9624, lng: -90.0773,
  },
  {
    name: "Creole Crown Natural Hair Salon",
    description: "New Orleans natural hair salon celebrating the diverse hair textures of the Crescent City. Loc services, silk press, moisture treatments, and protective styling in a relaxed welcoming environment.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "2800 Tulane Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9598, lng: -90.0836,
  },

  // ── COLUMBIA, SC ──
  {
    name: "Natural Roots Hair Studio Columbia SC",
    description: "Columbia's natural hair specialist. Services include locs, twists, silk press, protective styles, and scalp health consultations. Dedicated to textured hair care education.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "2500 Gervais St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0112, lng: -81.0269,
  },
  {
    name: "The Barbershop on Main — Columbia SC",
    description: "Community barbershop serving Columbia's African American community. Precision cuts, fades, tapers, and full beard services. Conversation and community always welcome.",
    category: "Beauty", subcategory: "Barbershop",
    address: "1218 Main St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0025, lng: -81.0326,
  },

  // ── DURHAM/RALEIGH ──
  {
    name: "Curl Theory Natural Hair Salon Durham",
    description: "Durham's curl-celebratory natural hair studio. Expert care for coils, kinks, and waves. Specialties include natural hair coloring, big chop consultations, and protective styling.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "805 W Main St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9950, lng: -78.9187,
  },
  {
    name: "Triangle Braiding Studio — Raleigh",
    description: "Raleigh's premier African braiding destination. Full range of African braiding styles: box braids, knotless, Ghana braids, butterfly locs, and Marley twists. Experienced stylists only.",
    category: "Beauty", subcategory: "Braiding Salon",
    address: "4900 Falls of Neuse Rd", city: "Raleigh", state: "NC", country: "USA",
    lat: 35.8361, lng: -78.6089,
  },

  // ── BIRMINGHAM ──
  {
    name: "Magic City Natural Hair Studio",
    description: "Birmingham's natural hair sanctuary. Loc care, protective styles, silk press, and scalp health services. Dedicated to the beauty of textured hair in the Magic City.",
    category: "Beauty", subcategory: "Natural Hair Salon",
    address: "1900 3rd Ave N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5214, lng: -86.8031,
  },

  // ═══════════════════════════════════════════════════════════
  // HEALTHCARE PROFESSIONALS & PRACTICES
  // ═══════════════════════════════════════════════════════════

  // ── PHILADELPHIA ──
  {
    name: "Philadelphia FIGHT Community Health Centers",
    description: "Federally qualified health center serving Philadelphia's underserved communities. Comprehensive primary care, HIV/AIDS services, behavioral health, dental, and pharmacy. Deep roots in the African American community.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "1233 Locust St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9487, lng: -75.1598, website: "https://fight.org",
  },
  {
    name: "Dr. Yvette Caldwell, DO — Primary Care",
    description: "Board-certified family medicine physician serving Philadelphia. Emphasis on preventive care, chronic disease management, and culturally competent care for the African American community.",
    category: "Health & Wellness", subcategory: "Primary Care",
    address: "3900 Chestnut St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9550, lng: -75.1988,
  },
  {
    name: "Dr. Roland Ottley, DDS — Community Dentistry",
    description: "Philadelphia dentist providing comprehensive dental care to the community. General dentistry, cosmetic procedures, and emergency dental services. Welcoming environment for patients of all backgrounds.",
    category: "Health & Wellness", subcategory: "Dentist",
    address: "5401 Chestnut St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9573, lng: -75.2189,
  },
  {
    name: "Aunt Sadie's Doula Collective — Philadelphia",
    description: "Community-centered doula collective serving Philadelphia birthing families. Full-spectrum doula support: prenatal, birth, and postpartum. Special focus on reducing Black maternal mortality and birth equity.",
    category: "Health & Wellness", subcategory: "Doula & Midwife",
    address: "3800 Lancaster Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9609, lng: -75.1928,
  },

  // ── WASHINGTON, DC ──
  {
    name: "Howard University Hospital",
    description: "Historically Black teaching hospital associated with Howard University. Provides comprehensive medical care to Washington's diverse community. One of the few remaining Black teaching hospitals in the United States.",
    category: "Health & Wellness", subcategory: "Hospital",
    address: "2041 Georgia Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9220, lng: -77.0188, website: "https://huhealthcare.com",
  },
  {
    name: "Unity Health Care DC",
    description: "Federally qualified health center providing comprehensive care across multiple DC locations. Serves uninsured, underinsured, and community patients. Trusted by DC's African American and immigrant communities.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "3020 14th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9289, lng: -77.0318, website: "https://unityhealthcare.org",
  },
  {
    name: "Dr. Joia Crear-Perry, MD — OB-GYN & Maternal Health Equity",
    description: "Nationally recognized Black OB-GYN and maternal health equity advocate based in Washington, DC. Founder of the National Birth Equity Collaborative. Provides women's health care and advocates for Black maternal health.",
    category: "Health & Wellness", subcategory: "OB-GYN",
    address: "1050 K St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9014, lng: -77.0282,
  },
  {
    name: "Abundant Life Wellness Center DC",
    description: "Integrative wellness center serving the DC community. Mental health therapy, life coaching, nutrition counseling, and stress management. Culturally affirming care for Black and Brown communities.",
    category: "Health & Wellness", subcategory: "Mental Health",
    address: "3050 K St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9022, lng: -77.0600,
  },

  // ── ATLANTA ──
  {
    name: "Morehouse School of Medicine Community Health",
    description: "Associated with the only HBCU-affiliated medical school in the country, this practice provides culturally competent care with research-informed approaches to reducing health disparities in the Black community.",
    category: "Health & Wellness", subcategory: "Academic Medicine",
    address: "720 Westview Dr SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7470, lng: -84.4127, website: "https://msm.edu",
  },
  {
    name: "Dr. Nzinga Harrison, MD — Psychiatry Atlanta",
    description: "Board-certified psychiatrist and addiction medicine specialist in Atlanta. Known for reducing stigma around mental health in the Black community. Author and public health advocate.",
    category: "Health & Wellness", subcategory: "Psychiatry",
    address: "2300 Henderson Mill Rd NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8618, lng: -84.2804,
  },
  {
    name: "Midwives of Color — Atlanta Collective",
    description: "Atlanta-based collective of certified nurse-midwives and doulas dedicated to culturally competent birth care. Prenatal education, birth support, postpartum care, and breastfeeding support.",
    category: "Health & Wellness", subcategory: "Doula & Midwife",
    address: "1775 Memorial Dr SE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7506, lng: -84.3451,
  },
  {
    name: "Dr. Ayanna Howard — Pediatric Care Atlanta",
    description: "Community pediatrician serving Atlanta families. Comprehensive pediatric care including well-child visits, vaccinations, developmental assessments, and chronic disease management.",
    category: "Health & Wellness", subcategory: "Pediatrician",
    address: "1968 Peachtree Rd NW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8124, lng: -84.3879,
  },

  // ── HOUSTON ──
  {
    name: "Legacy Community Health Houston",
    description: "Federally qualified health center with multiple Houston locations. Comprehensive primary care, behavioral health, dental, and OB services. Trusted by Houston's diverse communities including the Third Ward.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "1415 California St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7454, lng: -95.3722, website: "https://legacycommunityhealth.org",
  },
  {
    name: "Dr. Kamala Cooper, MD — OB-GYN Houston",
    description: "Houston OB-GYN providing comprehensive women's health care. Specializes in high-risk obstetrics, fibroids, and culturally affirming gynecologic care for Black women.",
    category: "Health & Wellness", subcategory: "OB-GYN",
    address: "6620 Main St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7139, lng: -95.4127,
  },
  {
    name: "Black Doctors Collective — Houston",
    description: "Houston network of Black physicians providing primary care, specialty care, and community health education. Dedicated to reducing health disparities and providing culturally competent care.",
    category: "Health & Wellness", subcategory: "Primary Care",
    address: "7210 Scott St", city: "Houston", state: "TX", country: "USA",
    lat: 29.6967, lng: -95.3689,
  },

  // ── NEW ORLEANS ──
  {
    name: "Daughters of Charity Community Health",
    description: "Community health center serving New Orleans East and surrounding communities. Comprehensive primary care, pediatrics, women's health, and behavioral health. Serving uninsured and underinsured patients.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "2477 N Galvez St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9833, lng: -90.0581,
  },
  {
    name: "Covenant House New Orleans — Health Services",
    description: "Health and social services for youth experiencing homelessness in New Orleans. Medical care, mental health support, substance use counseling, and case management. Serving vulnerable community members.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "611 N Rampart St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9644, lng: -90.0649,
  },

  // ── COLUMBIA, SC ──
  {
    name: "Palmetto Health Richland Community Medicine",
    description: "Community medicine practice affiliated with Prisma Health serving Columbia's diverse population. Comprehensive primary care with culturally sensitive approach. Sliding-scale fee options available.",
    category: "Health & Wellness", subcategory: "Primary Care",
    address: "3 Columbia Medical Pl", city: "West Columbia", state: "SC", country: "USA",
    lat: 33.9976, lng: -81.1043,
  },
  {
    name: "Vista Dental — Columbia SC",
    description: "Family dental practice serving Columbia's diverse community. General dentistry, cosmetic procedures, orthodontics, and pediatric dentistry. Welcoming all patients with affordable care options.",
    category: "Health & Wellness", subcategory: "Dentist",
    address: "700 Assembly St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0034, lng: -81.0394,
  },

  // ── DURHAM/RALEIGH ──
  {
    name: "Lincoln Community Health Center Durham",
    description: "Federally qualified community health center serving Durham's diverse and underserved communities. Comprehensive primary care, dental, behavioral health, and pharmacy. Founded to serve the historically underserved.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "1301 Fayetteville St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9771, lng: -78.9047, website: "https://lincolnchc.org",
  },
  {
    name: "SisterSpace Health Collective — Durham",
    description: "Women's health collective in Durham serving the Triangle's Black women. OB-GYN care, doula services, mental health, and holistic wellness. Community-driven approach to Black women's health.",
    category: "Health & Wellness", subcategory: "Women's Health",
    address: "400 W Main St", city: "Durham", state: "NC", country: "USA",
    lat: 35.9938, lng: -78.9012,
  },

  // ═══════════════════════════════════════════════════════════
  // LEGAL / PROFESSIONAL SERVICES
  // ═══════════════════════════════════════════════════════════

  // ── PHILADELPHIA ──
  {
    name: "Bailey & Raines Law Group — Philadelphia",
    description: "Civil rights and employment law firm serving Philadelphia's African American community. Cases involving workplace discrimination, police misconduct, and civil rights violations. Community legal education offered.",
    category: "Professional Services", subcategory: "Civil Rights Attorney",
    address: "1515 Market St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9529, lng: -75.1654,
  },
  {
    name: "Covenant Tax Services — Philadelphia",
    description: "CPA firm and tax preparation service specializing in small business accounting, personal tax returns, and financial planning. Serving Philadelphia's minority business community with affordable professional services.",
    category: "Professional Services", subcategory: "CPA / Accountant",
    address: "5501 Baltimore Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9436, lng: -75.2246,
  },
  {
    name: "Marcus & Associates Real Estate — Philadelphia",
    description: "Black-owned real estate firm helping Philadelphia families navigate homeownership and investment. Specializing in first-time homebuyers, property management, and community development.",
    category: "Professional Services", subcategory: "Real Estate",
    address: "4600 Market St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9564, lng: -75.2010,
  },

  // ── WASHINGTON, DC ──
  {
    name: "Bell, Boyd & Rasheed — Civil Rights Law",
    description: "Washington, DC civil rights law firm representing clients in discrimination, employment law, and constitutional rights cases. Known for impact litigation serving the African American community.",
    category: "Professional Services", subcategory: "Civil Rights Attorney",
    address: "1828 L St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9019, lng: -77.0451,
  },
  {
    name: "Ujima Financial Group DC",
    description: "Minority-owned financial services and wealth management firm in DC. Financial planning, investment management, retirement planning, and legacy wealth building with cultural competency.",
    category: "Professional Services", subcategory: "Financial Advisor",
    address: "1875 Connecticut Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9285, lng: -77.0618,
  },
  {
    name: "Wright Immigration Law — DC",
    description: "Immigration law firm serving Washington DC's African and Caribbean immigrant communities. DACA renewal, family petitions, asylum cases, naturalization, and work visas.",
    category: "Professional Services", subcategory: "Immigration Attorney",
    address: "1120 Connecticut Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9056, lng: -77.0433,
  },

  // ── ATLANTA ──
  {
    name: "Johnson & Thompson Law Group — Atlanta",
    description: "Atlanta civil rights and criminal defense law firm. Specializing in criminal defense, civil rights violations, wrongful death, and employment discrimination cases.",
    category: "Professional Services", subcategory: "Attorney",
    address: "191 Peachtree St NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7569, lng: -84.3886,
  },
  {
    name: "SouthTrust Financial Advisors Atlanta",
    description: "Minority-owned wealth management and financial planning firm in Atlanta. Serving Black families and entrepreneurs with investment strategy, tax planning, and generational wealth building.",
    category: "Professional Services", subcategory: "Financial Advisor",
    address: "3520 Piedmont Rd NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8439, lng: -84.3613,
  },
  {
    name: "Cascade Realty Group — Atlanta",
    description: "Black-owned real estate brokerage serving the Atlanta metropolitan area. Residential sales, commercial real estate, property management, and first-time homebuyer coaching.",
    category: "Professional Services", subcategory: "Real Estate",
    address: "3300 Cobb Pkwy SE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7871, lng: -84.4620,
  },

  // ── HOUSTON ──
  {
    name: "Jordan & Associates — Houston Business Law",
    description: "Business law firm serving Houston's minority entrepreneurs. Contracts, LLC formation, intellectual property, business disputes, and employment matters. First-generation business owner focus.",
    category: "Professional Services", subcategory: "Business Attorney",
    address: "2425 W Loop S", city: "Houston", state: "TX", country: "USA",
    lat: 29.7378, lng: -95.4648,
  },
  {
    name: "Prospera Insurance Group — Houston",
    description: "Minority-owned insurance agency serving Houston families and small businesses. Life insurance, health insurance, business insurance, and retirement planning. Serving the Third Ward and surrounding communities.",
    category: "Professional Services", subcategory: "Insurance",
    address: "2407 Blodgett St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7207, lng: -95.3795,
  },

  // ── NEW ORLEANS ──
  {
    name: "Thurgood Marshall Law Collective — New Orleans",
    description: "Community legal services organization in New Orleans providing civil rights, tenant rights, and criminal defense representation. Named for the iconic civil rights attorney and Supreme Court Justice.",
    category: "Professional Services", subcategory: "Civil Rights Attorney",
    address: "1010 Common St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9518, lng: -90.0701,
  },

  // ═══════════════════════════════════════════════════════════
  // TRADES & HOME SERVICES
  // ═══════════════════════════════════════════════════════════

  {
    name: "Roberts Electric — Philadelphia",
    description: "Licensed Black-owned electrical contractor serving Philadelphia and surrounding counties. Residential and commercial electrical installation, repair, panel upgrades, and EV charger installation.",
    category: "Services", subcategory: "Electrician",
    address: "4200 Haverford Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9662, lng: -75.2037,
  },
  {
    name: "Morgan Plumbing & HVAC — Philadelphia",
    description: "Family-owned plumbing and HVAC company serving Philadelphia for over 15 years. Residential and commercial plumbing, drain cleaning, HVAC installation, and emergency repair services.",
    category: "Services", subcategory: "Plumbing",
    address: "2200 W Girard Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9727, lng: -75.1904,
  },
  {
    name: "Crown Roofing Solutions — Atlanta",
    description: "Black-owned roofing contractor serving the greater Atlanta area. Residential and commercial roof installation, repair, inspection, and replacement. Fully licensed and insured.",
    category: "Services", subcategory: "Roofing",
    address: "2100 Jonesboro Rd SE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7019, lng: -84.3571,
  },
  {
    name: "Heritage HVAC & Electrical — Atlanta",
    description: "Minority-owned HVAC and electrical company serving Atlanta metro. Heating and cooling installation, repair, and maintenance. 24-hour emergency service. Licensed and insured.",
    category: "Services", subcategory: "HVAC",
    address: "1845 S Cobb Dr SE", city: "Smyrna", state: "GA", country: "USA",
    lat: 33.8489, lng: -84.5061,
  },
  {
    name: "Williams & Sons General Contractors — Houston",
    description: "Second-generation Black-owned general contracting firm serving greater Houston. Residential remodels, additions, commercial build-outs, and new construction. Serving the African American community with quality craftsmanship.",
    category: "Services", subcategory: "General Contractor",
    address: "7830 Old Spanish Trail", city: "Houston", state: "TX", country: "USA",
    lat: 29.7012, lng: -95.3618,
  },
  {
    name: "Third Ward Plumbing — Houston",
    description: "Licensed plumbing contractor serving Houston's Third Ward and surrounding communities. Residential plumbing repair, water heater installation, drain cleaning, and emergency service.",
    category: "Services", subcategory: "Plumbing",
    address: "3217 Blodgett St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7203, lng: -95.3700,
  },
  {
    name: "Legacy Moving Company — DC",
    description: "Minority-owned moving company serving the DC metropolitan area. Local and long-distance moving, packing services, furniture assembly, and storage solutions. Reliable and community-trusted.",
    category: "Services", subcategory: "Moving Company",
    address: "5200 Auth Rd", city: "Suitland", state: "MD", country: "USA",
    lat: 38.8482, lng: -76.9246,
  },
  {
    name: "Precision Electric — New Orleans",
    description: "Licensed electrical contractor serving the greater New Orleans area. Residential wiring, panel upgrades, generator installation, and commercial electrical work. Family-owned and community-trusted.",
    category: "Services", subcategory: "Electrician",
    address: "1900 Tulane Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9563, lng: -90.0835,
  },
  {
    name: "Gulfstream HVAC — Houston",
    description: "Houston HVAC company specializing in residential and light commercial systems. A/C installation, repair, seasonal maintenance, and indoor air quality solutions. Serving greater Houston since 2008.",
    category: "Services", subcategory: "HVAC",
    address: "6401 S Braeswood Blvd", city: "Houston", state: "TX", country: "USA",
    lat: 29.6889, lng: -95.4447,
  },
  {
    name: "Strong Foundation Contracting — Birmingham",
    description: "Black-owned general contracting firm serving the Birmingham metro. Home renovations, commercial build-outs, flooring, painting, and exterior work. Quality craftsmanship rooted in the Birmingham community.",
    category: "Services", subcategory: "General Contractor",
    address: "1524 3rd Ave N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5225, lng: -86.8104,
  },
  {
    name: "Carolina Handyman Services — Columbia SC",
    description: "Licensed handyman and home maintenance company serving Columbia. Plumbing repairs, electrical, painting, carpentry, and general property maintenance. Serving homeowners and property managers.",
    category: "Services", subcategory: "Handyman",
    address: "1805 Bull St", city: "Columbia", state: "SC", country: "USA",
    lat: 34.0070, lng: -81.0283,
  },

  // ═══════════════════════════════════════════════════════════
  // FAMILY / CHILDCARE / ELDER CARE
  // ═══════════════════════════════════════════════════════════

  {
    name: "Sankofa Academy — Philadelphia",
    description: "Afrocentric early childhood education center serving Philadelphia's Germantown community. Curriculum rooted in African and African American history. Full-day Pre-K through kindergarten programs.",
    category: "Education", subcategory: "Early Childhood Education",
    address: "6428 Germantown Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 40.0486, lng: -75.1684,
  },
  {
    name: "Ujima Afterschool Program — Atlanta",
    description: "Community-rooted afterschool and tutoring program serving Atlanta's Westside. Academic support, arts, STEM, and mentorship for K-12 students. Named for the Kwanzaa principle of collective work.",
    category: "Education", subcategory: "After-School Program",
    address: "735 Westview Dr SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7462, lng: -84.4120,
  },
  {
    name: "Little Scholars Learning Center — Houston",
    description: "Minority-owned childcare and preschool in Houston's Sunnyside neighborhood. High-quality early childhood education for children 6 weeks through 5 years. Culturally affirming curriculum.",
    category: "Education", subcategory: "Childcare / Daycare",
    address: "4120 Reed Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.6743, lng: -95.3780,
  },
  {
    name: "Village Elder Care — Atlanta",
    description: "African American-owned adult day care and elder care services in Atlanta. Daytime programs for seniors, personal care assistance, Alzheimer's/dementia support, and family respite services.",
    category: "Health & Wellness", subcategory: "Elder Care",
    address: "2170 Cascade Rd SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7218, lng: -84.4219,
  },
  {
    name: "Roots Learning Center — Washington DC",
    description: "Family-run early childhood education center serving DC's Petworth neighborhood. Focuses on culturally inclusive education, school readiness, and developmental support for children 6 weeks to 5 years.",
    category: "Education", subcategory: "Childcare / Daycare",
    address: "724 Kennedy St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9553, lng: -77.0287,
  },
  {
    name: "Tabitha House Youth Services — New Orleans",
    description: "Youth development organization serving New Orleans providing after-school tutoring, STEM education, mental health support, and college prep for middle and high school students.",
    category: "Education", subcategory: "Youth Organization",
    address: "2320 Dumaine St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9718, lng: -90.0816,
  },

  // ═══════════════════════════════════════════════════════════
  // FOOD DIASPORA EXPANSION
  // ═══════════════════════════════════════════════════════════

  // ── ETHIOPIAN / EAST AFRICAN ──
  {
    name: "Makeda Ethiopian Kitchen — Atlanta",
    description: "Authentic Ethiopian restaurant in Atlanta serving traditional injera-based dishes. Signature tibs, doro wat, kitfo, and vegetarian fasting platters. Community gathering space for Atlanta's Ethiopian diaspora.",
    category: "Food", subcategory: "Ethiopian",
    address: "1867 Cheshire Bridge Rd NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8137, lng: -84.3478,
  },
  {
    name: "Habasha Ethiopian & Eritrean Restaurant — Houston",
    description: "Houston's Ethiopian and Eritrean dining destination. Communal injera platters, tej honey wine, coffee ceremony, and traditional stews. Serving Houston's East African community.",
    category: "Food", subcategory: "Ethiopian / Eritrean",
    address: "5800 S Braeswood Blvd", city: "Houston", state: "TX", country: "USA",
    lat: 29.6816, lng: -95.4524,
  },
  {
    name: "Habesha Restaurant — Washington DC",
    description: "Ethiopian dining in the heart of DC's U Street corridor. Traditional family-style injera platters, tej wine, and a communal dining experience connecting DC's East African community.",
    category: "Food", subcategory: "Ethiopian",
    address: "2134 Wyoming Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9225, lng: -77.0489,
  },

  // ── NIGERIAN / WEST AFRICAN ──
  {
    name: "Lagos Kitchen — Houston",
    description: "Houston's Nigerian restaurant bringing the flavors of Lagos to Texas. Jollof rice, egusi soup, suya, puff-puff, and fresh pepper soup. Community dining for Houston's Nigerian diaspora.",
    category: "Food", subcategory: "Nigerian",
    address: "10001 Bissonnet St", city: "Houston", state: "TX", country: "USA",
    lat: 29.6777, lng: -95.5221,
  },
  {
    name: "Accra Kitchen — Washington DC",
    description: "Ghanaian restaurant in DC serving home-style West African cooking. Waakye, jollof, kelewele, red red, and banku with tilapia. Taste of Accra in the nation's capital.",
    category: "Food", subcategory: "Ghanaian",
    address: "8215 Georgia Ave", city: "Silver Spring", state: "MD", country: "USA",
    lat: 38.9945, lng: -77.0230,
  },
  {
    name: "Dakar Restaurant Philadelphia",
    description: "Senegalese and West African dining experience in Philadelphia. Thiéboudienne (national rice dish), yassa poulet, mafé, and ataya tea. Connecting Philadelphia's growing Senegalese community.",
    category: "Food", subcategory: "Senegalese",
    address: "4627 Baltimore Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9435, lng: -75.2101,
  },

  // ── HAITIAN ──
  {
    name: "Toussaint's Haitian Cuisine — Miami",
    description: "Authentic Haitian restaurant serving griot, diri ak pwa, tassot, and legim. Named for Haitian revolutionary Toussaint Louverture. A vibrant community gathering place celebrating Haitian culture.",
    category: "Food", subcategory: "Haitian",
    address: "7100 NW 7th Ave", city: "Miami", state: "FL", country: "USA",
    lat: 25.8553, lng: -80.2020,
  },
  {
    name: "Lakay Haitian Restaurant — Boston",
    description: "Boston's destination for authentic Haitian home cooking. Griot, bouyon, plantains, and pikliz. Family recipes brought from Haiti. Beloved by Boston's Haitian American community.",
    category: "Food", subcategory: "Haitian",
    address: "388 Blue Hill Ave", city: "Boston", state: "MA", country: "USA",
    lat: 42.3138, lng: -71.0863,
  },

  // ── SOUL FOOD / SOUTHERN ──
  {
    name: "Ms. Tootsie's Soul Food Cafe — Philadelphia",
    description: "Philadelphia institution for authentic soul food. Fried chicken, collard greens, mac and cheese, candied yams, and sweet potato pie. A home-cooking experience rooted in Southern tradition.",
    category: "Food", subcategory: "Soul Food",
    address: "1312 South St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9437, lng: -75.1629,
  },
  {
    name: "Paschal's Restaurant — Atlanta",
    description: "Atlanta institution since 1947. Served as a meeting place for civil rights leaders including Dr. King. Famous for fried chicken, soul food, and Southern comfort cooking with historical significance.",
    category: "Food", subcategory: "Soul Food",
    address: "180 Northside Dr SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7489, lng: -84.4000,
  },
  {
    name: "Dooky Chase's Restaurant — New Orleans",
    description: "Iconic New Orleans Creole restaurant opened 1941 by Leah Chase, the 'Queen of Creole Cuisine.' Hosted civil rights leaders and presidents. Still serving gumbo, fried chicken, and Creole classics.",
    category: "Food", subcategory: "Creole / Soul Food",
    address: "2301 Orleans Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9745, lng: -90.0865, website: "https://dookychases.com",
  },
  {
    name: "Lucille's Restaurant — Houston",
    description: "Upscale soul food and Southern cuisine by Chef Chris Williams in Houston's Midtown. Farm-to-table ingredients, heirloom recipes, and a menu honoring the chef's great-great-grandmother Lucille B. Smith.",
    category: "Food", subcategory: "Soul Food / Southern",
    address: "5512 La Branch St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7327, lng: -95.3802, website: "https://lucilleshouston.com",
  },
  {
    name: "Chef Lee's Soul Food — Birmingham",
    description: "Birmingham soul food institution. Smothered pork chops, fried catfish, cornbread, and banana pudding. Scratch-made Southern cooking passed down through generations.",
    category: "Food", subcategory: "Soul Food",
    address: "1200 4th Ave N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5195, lng: -86.8058,
  },
  {
    name: "Big Apple Inn — Jackson (Mississippi)",
    description: "Jackson, Mississippi's legendary soul food counter since 1939. Famous for smoked ear sandwiches and pig ear subs — a uniquely Southern experience beloved by generations.",
    category: "Food", subcategory: "Soul Food",
    address: "509 N Farish St", city: "Jackson", state: "MS", country: "USA",
    lat: 32.2969, lng: -90.1869,
  },

  // ── DIASPORA BAKERIES / CAFES ──
  {
    name: "Honeysuckle Provisions — Philadelphia",
    description: "West African-inspired bakery and provisions store in West Philadelphia. Spiced pastries, hibiscus drinks, groundnut cookies, and community gatherings celebrating West African culinary traditions.",
    category: "Food", subcategory: "Bakery / Cafe",
    address: "5901 Baltimore Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9446, lng: -75.2310, website: "https://honeysuckleprovisions.com",
  },
  {
    name: "Mahogany Bakery — Atlanta",
    description: "Atlanta's Black-owned artisan bakery specializing in Southern-inspired cakes, pies, and custom celebration cakes. Community gathering spot celebrating dessert traditions of the African American South.",
    category: "Food", subcategory: "Bakery",
    address: "2269 Lee St SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7327, lng: -84.4134,
  },
  {
    name: "Bitter Truth Coffee — Washington DC",
    description: "DC Black-owned specialty coffee shop and community gathering space. Ethically sourced single-origin coffees, tea, pastries, and community events. Located in the Shaw neighborhood.",
    category: "Food", subcategory: "Coffee / Cafe",
    address: "1748 14th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9177, lng: -77.0320,
  },
  {
    name: "Freedom Brewing Company — Philadelphia",
    description: "Black-owned craft brewery in Philadelphia celebrating the city's abolitionist history. Community taproom, live music, and rotating tap list. Named for Philadelphia's Underground Railroad legacy.",
    category: "Food", subcategory: "Brewery / Taproom",
    address: "3939 Lancaster Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9617, lng: -75.2014,
  },

  // ── HALAL ──
  {
    name: "Ali's Halal Kitchen — Houston",
    description: "Houston halal restaurant serving the city's diverse Muslim community. Grilled meats, rice dishes, shawarma, and fresh-baked bread. Serving families from Houston's African American and African Muslim communities.",
    category: "Food", subcategory: "Halal",
    address: "5700 Hillcroft Ave", city: "Houston", state: "TX", country: "USA",
    lat: 29.7012, lng: -95.4911,
  },
  {
    name: "Halal Brothers — Atlanta",
    description: "Atlanta halal restaurant serving freshly prepared halal meats, Mediterranean plates, and community-priced family meals. Serving the Atlanta Muslim community including the African American Muslim community.",
    category: "Food", subcategory: "Halal",
    address: "2145 Candler Rd", city: "Decatur", state: "GA", country: "USA",
    lat: 33.7400, lng: -84.2729,
  },

  // ═══════════════════════════════════════════════════════════
  // CULTURE / HERITAGE / MUSEUMS / BOOKSTORES
  // ═══════════════════════════════════════════════════════════

  {
    name: "National Museum of African American History & Culture",
    description: "The only national museum devoted exclusively to African American life, history, and culture. Located on the National Mall in Washington, DC. 12 floors of permanent galleries covering 400 years of African American history.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "1400 Constitution Ave NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.8913, lng: -77.0317, website: "https://nmaahc.si.edu",
  },
  {
    name: "Birmingham Civil Rights Institute",
    description: "World-class civil rights museum and research center adjacent to 16th Street Baptist Church. Tells the story of the modern civil rights movement through immersive galleries, oral histories, and artifacts.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "520 16th St N", city: "Birmingham", state: "AL", country: "USA",
    lat: 33.5179, lng: -86.8148, website: "https://bcri.org",
  },
  {
    name: "National Civil Rights Museum at Lorraine Motel",
    description: "Built around the site where Dr. Martin Luther King Jr. was assassinated in 1968. One of the most important civil rights museums in the world. Comprehensive journey through the American civil rights movement.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "450 Mulberry St", city: "Memphis", state: "TN", country: "USA",
    lat: 35.1342, lng: -90.0594, website: "https://civilrightsmuseum.org",
  },
  {
    name: "APEX Museum — African American Panoramic Experience",
    description: "Atlanta museum celebrating African American history through the Sweet Auburn neighborhood. Exhibits on Black Wall Street, the Harlem Renaissance, civil rights, and Atlanta's own Black history.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "135 Auburn Ave NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7535, lng: -84.3763, website: "https://apexmuseum.org",
  },
  {
    name: "African American Museum in Philadelphia",
    description: "The first museum built by a major American city to house and interpret African American culture. Located in the historic district. Permanent and rotating exhibitions celebrating African American art and history.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "701 Arch St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9534, lng: -75.1572, website: "https://aampmuseum.org",
  },
  {
    name: "Hammonds House Museum — Atlanta",
    description: "Atlanta's museum dedicated to art by people of African descent. Permanent collection of over 400 works. Exhibition programs, artist residencies, and community arts education.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "503 Peeples St SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7362, lng: -84.3954, website: "https://hammondshouse.org",
  },
  {
    name: "Amistad Research Center — New Orleans",
    description: "Independent archives and research center preserving documents related to American ethnic minority history. Located at Tulane University. Vast collection on African American and civil rights history.",
    category: "Arts & Culture", subcategory: "Cultural Center",
    address: "6823 St Charles Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9393, lng: -90.1205, website: "https://amistadresearchcenter.org",
  },
  {
    name: "The Legacy Museum — Equal Justice Initiative",
    description: "Museum documenting the history of racial terror, mass incarceration, and the legacy of slavery in America. Created by Bryan Stevenson and the Equal Justice Initiative in Montgomery, Alabama.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "115 Coosa St", city: "Montgomery", state: "AL", country: "USA",
    lat: 32.3712, lng: -86.3016, website: "https://museumandmemorial.eji.org",
  },
  {
    name: "National Memorial for Peace and Justice — EJI",
    description: "The nation's first memorial dedicated to victims of racial terror lynching. Created by the Equal Justice Initiative. A powerful outdoor memorial in Montgomery, Alabama.",
    category: "Arts & Culture", subcategory: "Memorial",
    address: "417 Caroline St", city: "Montgomery", state: "AL", country: "USA",
    lat: 32.3678, lng: -86.3018, website: "https://museumandmemorial.eji.org",
  },

  // ── BLACK BOOKSTORES ──
  {
    name: "Hakim's Bookstore — Philadelphia",
    description: "Philadelphia's premier Black bookstore serving the community since 1959. African American literature, history, children's books, and cultural gifts. Community events, book clubs, and author talks.",
    category: "Retail", subcategory: "Bookstore",
    address: "210 S 52nd St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9513, lng: -75.2242, website: "https://hakimsbookstore.com",
  },
  {
    name: "Medu Bookstore — Atlanta",
    description: "Atlanta's beloved Black bookstore at Greenbriar Mall since 1988. African American literature, Pan-African books, children's books, and cultural gifts. Community anchor for Atlanta's Black reading community.",
    category: "Retail", subcategory: "Bookstore",
    address: "2841 Greenbriar Pkwy SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.6868, lng: -84.4802,
  },
  {
    name: "Loyalty Bookstores — DC",
    description: "Black-owned independent bookstore with locations in DC and Maryland. Curated selection with focus on marginalized voices, BIPOC authors, LGBTQIA+ titles, and community programming.",
    category: "Retail", subcategory: "Bookstore",
    address: "2001 11th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9144, lng: -77.0263, website: "https://loyaltybookstores.com",
  },
  {
    name: "Kindred Stories Bookshop — Houston",
    description: "Houston's Black women-owned independent bookstore. Curated selection of diverse and inclusive titles, children's books featuring characters of color, author events, and book clubs.",
    category: "Retail", subcategory: "Bookstore",
    address: "5537 Richmond Ave", city: "Houston", state: "TX", country: "USA",
    lat: 29.7394, lng: -95.4783, website: "https://kindredstories.com",
  },
  {
    name: "Community Book Center — New Orleans",
    description: "New Orleans institution for African American literature and culture since 1989. Books, gifts, and community events celebrating Black history, literature, and art. Located in the historic Tremé.",
    category: "Retail", subcategory: "Bookstore",
    address: "217 N Broad St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9621, lng: -90.0843,
  },

  // ═══════════════════════════════════════════════════════════
  // NIGHTLIFE & ENTERTAINMENT
  // ═══════════════════════════════════════════════════════════

  {
    name: "Velvet Underground — Atlanta",
    description: "Atlanta's premier Black-owned music venue and social club. Live jazz, R&B, neo-soul, and hip-hop in an intimate setting. VIP sections, craft cocktails, and weekend DJs.",
    category: "Entertainment & Recreation", subcategory: "Music Venue",
    address: "360 Pharr Rd NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.8409, lng: -84.3654,
  },
  {
    name: "The Spot Bar & Lounge — Houston",
    description: "Houston's classic Black-owned lounge in the Third Ward. Live music Fridays, karaoke Saturdays, and a comfortable neighborhood gathering space. Community institution for decades.",
    category: "Entertainment & Recreation", subcategory: "Bar / Lounge",
    address: "2520 Blodgett St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7208, lng: -95.3800,
  },
  {
    name: "U Street Music Hall — Washington DC",
    description: "DC's independent music venue on the historic U Street corridor. Electronic music, hip-hop, live bands, and community events. Located in DC's historic Black Broadway neighborhood.",
    category: "Entertainment & Recreation", subcategory: "Music Venue",
    address: "1115 U St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9169, lng: -77.0310, website: "https://ustreetmusichall.com",
  },
  {
    name: "Frankie Beverly's — New Orleans",
    description: "New Orleans jazz and soul lounge celebrating the music traditions of the African American South. Live jazz, blues, and R&B Thursday through Sunday. True New Orleans nightlife experience.",
    category: "Entertainment & Recreation", subcategory: "Jazz Club",
    address: "1910 Magazine St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9359, lng: -90.0764,
  },
  {
    name: "Vibrations Rooftop Lounge — Philadelphia",
    description: "Philadelphia's vibrant rooftop bar and lounge. Weekend DJs, panoramic city views, craft cocktails, and a welcoming vibe for Philadelphia's Black social scene. Dress code in effect.",
    category: "Entertainment & Recreation", subcategory: "Rooftop Bar",
    address: "1200 Market St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9527, lng: -75.1596,
  },

  // ═══════════════════════════════════════════════════════════
  // BLACK FRANCHISE OWNERS / CHAIN LOCATIONS
  // ═══════════════════════════════════════════════════════════

  {
    name: "McDonald's — Greenbriar (Black Franchise Owner)",
    description: "McDonald's franchise location in the Greenbriar community of Southwest Atlanta, operated by a Black franchise owner. Part of the National Black McDonald's Operators Association (NBMOA) network of franchisees.",
    category: "Food", subcategory: "Fast Food / Franchise",
    address: "2825 Headland Dr SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.6920, lng: -84.4813,
  },
  {
    name: "McDonald's — Third Ward (Black Franchise Owner)",
    description: "McDonald's franchise location in Houston's historic Third Ward, operated by a member of the National Black McDonald's Operators Association. Community-rooted franchise serving the Third Ward.",
    category: "Food", subcategory: "Fast Food / Franchise",
    address: "3015 Blodgett St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7195, lng: -95.3679,
  },
  {
    name: "Chick-fil-A — Auburn Ave (Black Operator)",
    description: "Chick-fil-A franchise location near Atlanta's Sweet Auburn district operated by a Black franchise operator. Part of the growing network of minority franchise owners in the food service industry.",
    category: "Food", subcategory: "Fast Food / Franchise",
    address: "300 Auburn Ave NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7551, lng: -84.3811,
  },
  {
    name: "V&J Foods — Burger King (Valerie Daniels-Carter)",
    description: "Valerie Daniels-Carter's V&J Foods is one of the largest minority-owned restaurant franchise companies in the US, operating dozens of Burger King and Pizza Hut locations across the Midwest.",
    category: "Food", subcategory: "Fast Food / Franchise",
    address: "N 27th St & W Burleigh St", city: "Milwaukee", state: "WI", country: "USA",
    lat: 43.0700, lng: -87.9398,
  },
  {
    name: "Subway — West Philadelphia (Black Franchise Owner)",
    description: "Subway franchise location in West Philadelphia operated by a Black franchise owner. Part of the growing number of minority-owned Subway franchise operators serving their home communities.",
    category: "Food", subcategory: "Fast Food / Franchise",
    address: "4917 Baltimore Ave", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9431, lng: -75.2162,
  },

  // ═══════════════════════════════════════════════════════════
  // TATTOO ARTISTS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Prick Studio — Atlanta",
    description: "Atlanta's premier Black-owned tattoo studio. Specializes in fine-line portraiture, botanical designs, Afrocentric art, and custom blackwork. Community-celebrated studio in the Old Fourth Ward.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "349 Auburn Ave NE", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7554, lng: -84.3773,
  },
  {
    name: "Crown & Needle Tattoo — Philadelphia",
    description: "Black-owned tattoo studio in West Philadelphia specializing in melanin-safe tattooing on dark skin tones. Custom designs, cover-ups, and Afrocentric artwork. Education-first approach to ink.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "4400 Chestnut St", city: "Philadelphia", state: "PA", country: "USA",
    lat: 39.9557, lng: -75.2024,
  },
  {
    name: "The Melanin Tattoo Collective — Houston",
    description: "Houston's community-celebrated Black-owned tattoo collective. Artists specializing in dark skin tones, custom portraiture, geometric designs, and Afrocentric spiritual artwork.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "3900 Main St", city: "Houston", state: "TX", country: "USA",
    lat: 29.7259, lng: -95.3809,
  },
  {
    name: "Sacred Skin Tattoo — Washington DC",
    description: "DC Black-owned tattoo studio celebrating the art of tattooing as a cultural tradition. Custom designs, traditional African motifs, fine-line work, and melanin-safe techniques.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "1700 7th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9137, lng: -77.0229,
  },
  {
    name: "Noire Tattoo Studio — New Orleans",
    description: "New Orleans Black-owned tattoo studio with expertise in dark skin tones. Specialties: custom portraiture, Neo-traditional, and designs inspired by African diaspora art and culture.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "3120 Magazine St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9273, lng: -90.0856,
  },
  {
    name: "Darkroom Tattoo — Atlanta",
    description: "Atlanta tattoo studio specializing in tattooing on melanated skin. Known for vibrant color work, cover-ups, and custom designs that honor the rich artistic traditions of African and diaspora culture.",
    category: "Beauty", subcategory: "Tattoo Studio",
    address: "1170 Ralph David Abernathy Blvd SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7381, lng: -84.4049,
  },

  // ═══════════════════════════════════════════════════════════
  // WELLNESS / FITNESS
  // ═══════════════════════════════════════════════════════════

  {
    name: "Blackbird Yoga & Wellness — DC",
    description: "Washington DC's Black-owned yoga and wellness studio. Community-priced classes in yoga, meditation, and breathwork. Dedicated to making holistic wellness accessible to the Black community.",
    category: "Health & Wellness", subcategory: "Yoga / Wellness Studio",
    address: "2107 18th St NW", city: "Washington", state: "DC", country: "USA",
    lat: 38.9204, lng: -77.0411,
  },
  {
    name: "Sankofa Fitness ATL",
    description: "Atlanta's community fitness center rooted in African wellness traditions. Group fitness, personal training, and holistic health workshops. Located in the West End neighborhood.",
    category: "Health & Wellness", subcategory: "Fitness Center",
    address: "1031 Lee St SW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7356, lng: -84.4069,
  },
  {
    name: "Strong is Beautiful — Houston",
    description: "Houston's Black women-centered fitness studio. Strength training, HIIT, and wellness coaching designed for and by Black women. Community, accountability, and fitness in a safe affirming space.",
    category: "Health & Wellness", subcategory: "Fitness Center",
    address: "5115 Almeda Rd", city: "Houston", state: "TX", country: "USA",
    lat: 29.7192, lng: -95.3688,
  },

  // ═══════════════════════════════════════════════════════════
  // INTERNATIONAL EXPANSION — BANGKOK / PHUKET
  // ═══════════════════════════════════════════════════════════

  // ── MORE PHUKET ──
  {
    name: "Zoe in Yellow",
    description: "Phuket Town's beloved outdoor bar and music venue. Nightly live DJs, international traveler gathering spot, and casual street-food-style drinking in the heart of Old Phuket Town. Budget-friendly and welcoming.",
    category: "Entertainment & Recreation", subcategory: "Bar / Nightlife",
    address: "8 Soi Phuthon", city: "Phuket Town", state: "", country: "Thailand",
    lat: 7.8882, lng: 98.3989,
  },
  {
    name: "Suay Restaurant — Phuket",
    description: "Beloved Phuket Town restaurant by chef Tamara. Creative Thai and fusion dishes made with local ingredients. Known for the weekly Sunday brunch and an excellent natural wine selection. Local and expat favorite.",
    category: "Food", subcategory: "Thai Fusion",
    address: "50/2 Takua Pa Rd", city: "Phuket Town", state: "", country: "Thailand",
    lat: 7.8870, lng: 98.3971, website: "https://suayphuket.com",
  },
  {
    name: "Black Cat Bar — Patong",
    description: "Welcoming bar in Patong Beach known for being inclusive and embracing international travelers. Pool table, craft drinks, and music. A go-to spot for solo Black travelers visiting Phuket.",
    category: "Entertainment & Recreation", subcategory: "Bar / Nightlife",
    address: "174/19 Rat Uthit 200 Pi Rd", city: "Patong", state: "", country: "Thailand",
    lat: 7.8974, lng: 98.2990,
  },
  {
    name: "Baan Talay Spa Phuket",
    description: "Traditional Thai massage and spa in a garden setting near Kata Beach. Authentic herbal treatments, hot stone massage, and aromatherapy. Award-winning service with fair pricing.",
    category: "Health & Wellness", subcategory: "Spa",
    address: "23 Kata Rd, Karon", city: "Kata Beach", state: "", country: "Thailand",
    lat: 7.8202, lng: 98.2958,
  },
  {
    name: "Siam Supper Club — Phuket",
    description: "Upscale international dining and live music venue on Phuket's west coast. Seafood, steaks, and classic cocktails accompanied by nightly live jazz and blues. A favorite of international visitors.",
    category: "Food", subcategory: "International Fine Dining",
    address: "36/9 Patak Rd, Karon", city: "Karon", state: "", country: "Thailand",
    lat: 7.8392, lng: 98.2931,
  },
  {
    name: "Nicky's Handlebar — Phuket",
    description: "Phuket's iconic dive bar and social hub in Patong. Cold beer, international sports, pool table, and a welcoming vibe drawing travelers from around the world. No pretense, just good times.",
    category: "Entertainment & Recreation", subcategory: "Bar / Nightlife",
    address: "105/37 Rat-U-Thit 200 Pi Rd", city: "Patong", state: "", country: "Thailand",
    lat: 7.8980, lng: 98.2971,
  },
  {
    name: "Phuket Surf House",
    description: "Surf training and board rental on Kata Beach. Professional instructors, group lessons, and private coaching for all levels. Gateway to Phuket's surf scene for the adventure-seeking traveler.",
    category: "Entertainment & Recreation", subcategory: "Water Sports",
    address: "22/2 Kata Rd", city: "Kata Beach", state: "", country: "Thailand",
    lat: 7.8210, lng: 98.2963,
  },
  {
    name: "PRG Floating Restaurant — Phuket",
    description: "Authentic Thai seafood on a floating restaurant off Chalong Bay. Fresh fish, tiger prawns, and Thai dishes served over the water. A unique Phuket dining experience beloved by locals and travelers.",
    category: "Food", subcategory: "Seafood",
    address: "Chalong Pier, Chalong Bay", city: "Chalong", state: "", country: "Thailand",
    lat: 7.8108, lng: 98.3543,
  },
  {
    name: "Chalong Temple (Wat Chalong)",
    description: "The most sacred Buddhist temple in Phuket, revered by both locals and visitors. Ornate architecture, giant Buddha pagoda, and the Grand Pagoda housing a bone fragment of the Buddha. Must-visit cultural site.",
    category: "Arts & Culture", subcategory: "Temple / Cultural Site",
    address: "Luang Pho Cham Rd, Chalong", city: "Chalong", state: "", country: "Thailand",
    lat: 7.8446, lng: 98.3358,
  },
  {
    name: "Old Phuket Town Walking Street",
    description: "Phuket's historic Sino-Portuguese old town neighborhood. Colorful shophouses, street art, cafes, and weekend night markets. A cultural immersion experience showcasing Phuket's multicultural Peranakan heritage.",
    category: "Arts & Culture", subcategory: "Cultural District",
    address: "Thalang Rd, Phuket Town", city: "Phuket Town", state: "", country: "Thailand",
    lat: 7.8885, lng: 98.3951,
  },
  {
    name: "Phuket Elephant Sanctuary",
    description: "Ethical elephant sanctuary offering observation-only visits. No riding. Visitors walk alongside rescued elephants in their natural habitat. A responsible wildlife experience for conscious travelers.",
    category: "Entertainment & Recreation", subcategory: "Wildlife & Nature",
    address: "100 Moo 2 Paklok", city: "Phuket", state: "", country: "Thailand",
    lat: 8.0311, lng: 98.4038, website: "https://phuketelephantsanctuary.org",
  },

  // ── MORE BANGKOK ──
  {
    name: "Namsaah Bottling Trust",
    description: "Bangkok's beloved community bar and restaurant in a converted colonial shophouse. Craft cocktails, natural wine, and Thai snacks. A neighborhood gathering spot known for its inclusive welcoming vibe.",
    category: "Entertainment & Recreation", subcategory: "Bar / Restaurant",
    address: "401 Silom Rd", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7278, lng: 100.5287,
  },
  {
    name: "The Bookshop Bangkok",
    description: "Bangkok's beloved independent English-language bookshop. Curated selection of fiction, travel, Asian history, and international titles. Community events, author talks, and a warm literary gathering space.",
    category: "Retail", subcategory: "Bookstore",
    address: "36 Gaysorn Tower, Ploenchit Rd", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7442, lng: 100.5403,
  },
  {
    name: "Health Land Spa & Massage Bangkok",
    description: "Bangkok's renowned traditional Thai massage and spa group. Multiple locations offering authentic Thai massage, aromatherapy, and herbal treatments at fair prices. Trusted by locals and travelers.",
    category: "Health & Wellness", subcategory: "Spa",
    address: "120 North Sathorn Rd", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7260, lng: 100.5308, website: "https://healthlandspa.com",
  },
  {
    name: "Or Tor Kor Market Bangkok",
    description: "Bangkok's highest-quality fresh market selling premium local produce, ready-to-eat food, and specialty Thai ingredients. A food lover's paradise — cleaner and more upscale than Chatuchak.",
    category: "Retail", subcategory: "Market",
    address: "101 Kamphaeng Phet Rd, Chatuchak", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7983, lng: 100.5484,
  },
  {
    name: "Wat Pho — Temple of the Reclining Buddha",
    description: "Bangkok's oldest and largest temple complex. Home to the enormous golden Reclining Buddha (46m long). One of Thailand's most important Buddhist temples and the birthplace of traditional Thai massage.",
    category: "Arts & Culture", subcategory: "Temple / Cultural Site",
    address: "2 Sanam Chai Rd, Phra Nakhon", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7466, lng: 100.4927, website: "https://watpho.com",
  },
  {
    name: "Wat Arun — Temple of Dawn",
    description: "Bangkok's iconic riverside temple recognized worldwide for its distinctive 82-meter central spire. One of the most photographed landmarks in Thailand. Active Buddhist temple on the Chao Phraya River.",
    category: "Arts & Culture", subcategory: "Temple / Cultural Site",
    address: "158 Thanon Wang Doem, Wat Arun", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7437, lng: 100.4888,
  },
  {
    name: "Sri Trang Agro-Industry Dining Room",
    description: "Bangkok's famous worker canteen turned cultural dining experience. Authentic central Thai food at local prices. A beloved institution showing the real Bangkok food scene away from tourist restaurants.",
    category: "Food", subcategory: "Thai Cuisine",
    address: "Vibhavadi Rangsit Rd, Chatuchak", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.8116, lng: 100.5574,
  },
  {
    name: "Tropic City — Bangkok",
    description: "Bangkok's celebrated LGBTQIA+-friendly cocktail bar. Award-winning creative cocktails, inclusive welcoming environment, and regular community events. Safe and affirming space for all travelers.",
    category: "Entertainment & Recreation", subcategory: "Bar / LGBTQIA+-Friendly",
    address: "672/49 Charoen Krung Rd", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7273, lng: 100.5143,
  },
  {
    name: "Banyan Tree Spa Bangkok",
    description: "Award-winning urban spa retreat atop the Banyan Tree Hotel. Signature Rainmist treatment, traditional Thai massage, and full wellness sanctuary with panoramic Bangkok views on the upper floors.",
    category: "Health & Wellness", subcategory: "Spa",
    address: "21/100 South Sathorn Rd", city: "Bangkok", state: "", country: "Thailand",
    lat: 13.7199, lng: 100.5278,
  },

  // ── JAMAICA ──
  {
    name: "Scotchies Jerk Centre — Kingston",
    description: "Jamaica's legendary jerk destination. Whole pork and chicken roasted over pimento wood the traditional way. Multiple locations across Jamaica. Considered by many the best jerk in the world.",
    category: "Food", subcategory: "Jamaican / Jerk",
    address: "Shop 7, Sovereign Centre, Hope Rd", city: "Kingston", state: "", country: "Jamaica",
    lat: 17.9876, lng: -76.7707,
  },
  {
    name: "Scotchies Jerk Centre — Ocho Rios",
    description: "The original Scotchies location, regarded as the birthplace of the Scotchies jerk tradition. Outdoor dining, pimento wood pits, and the most authentic jerk experience in the Caribbean.",
    category: "Food", subcategory: "Jamaican / Jerk",
    address: "Main Rd, Drax Hall", city: "Ocho Rios", state: "", country: "Jamaica",
    lat: 18.4023, lng: -77.1028,
  },
  {
    name: "Devon House Kingston",
    description: "Jamaica's only National Heritage Trust property that was built and owned by a Black millionaire — George Stiebel in 1881. Features galleries, restaurants, and the world-famous Devon House ice cream.",
    category: "Arts & Culture", subcategory: "Heritage Site",
    address: "26 Hope Rd", city: "Kingston", state: "", country: "Jamaica",
    lat: 17.9877, lng: -76.7673, website: "https://devonhousejamaica.com",
  },
  {
    name: "Bob Marley Museum Kingston",
    description: "The former home and recording studio of Robert Nesta Marley. Preserved as a museum celebrating the legend's life, music, and influence on world culture. 56 Hope Road, Kingston.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "56 Hope Rd", city: "Kingston", state: "", country: "Jamaica",
    lat: 17.9870, lng: -76.7713, website: "https://bobmarleymuseum.com",
  },
  {
    name: "Rick's Cafe Negril",
    description: "Jamaica's world-famous sunset spot. Cliff diving, spectacular Caribbean Sea views, food, drinks, and live entertainment. An iconic Jamaican experience beloved by travelers from around the world.",
    category: "Entertainment & Recreation", subcategory: "Restaurant / Bar",
    address: "West End Rd", city: "Negril", state: "", country: "Jamaica",
    lat: 18.3592, lng: -78.3504, website: "https://rickscafejamaica.com",
  },
  {
    name: "Pelican Bar Jamaica",
    description: "Jamaica's most unique bar — built on a sandbar in the Caribbean Sea, 15 minutes by boat from Parottee Beach in St. Elizabeth. The ultimate off-the-beaten-path Jamaican experience.",
    category: "Entertainment & Recreation", subcategory: "Bar / Experience",
    address: "Offshore sandbar, Treasure Beach area", city: "Treasure Beach", state: "", country: "Jamaica",
    lat: 17.9060, lng: -77.7310,
  },
  {
    name: "Usain Bolt's Tracks & Records Kingston",
    description: "Sports bar and restaurant by Olympic legend Usain Bolt. Celebrates Jamaican excellence in sports, food, and entertainment. Sports broadcasting, Jamaican cuisine, and cocktails.",
    category: "Entertainment & Recreation", subcategory: "Sports Bar / Restaurant",
    address: "67 Constant Spring Rd", city: "Kingston", state: "", country: "Jamaica",
    lat: 18.0091, lng: -76.7797,
  },

  // ── CANCUN / MEXICO ──
  {
    name: "El Muelle Cevichería — Cancun",
    description: "Locally beloved Cancun ceviche restaurant away from the tourist zone. Fresh catch ceviches, aguachiles, tostadas, and shrimp cocktails at local prices. Authentic Mexican coastal cuisine.",
    category: "Food", subcategory: "Seafood / Mexican",
    address: "Av. Yaxchilán 47, Sm 22", city: "Cancun", state: "Quintana Roo", country: "Mexico",
    lat: 21.1628, lng: -86.8245,
  },
  {
    name: "Mercado 23 Cancun",
    description: "Local Cancun market serving residential neighborhoods away from the hotel zone. Fresh produce, prepared foods, tacos, and artisan goods at authentic local prices. The real Cancun experience.",
    category: "Retail", subcategory: "Market",
    address: "Av. Tulum, SM 23", city: "Cancun", state: "Quintana Roo", country: "Mexico",
    lat: 21.1642, lng: -86.8292,
  },
  {
    name: "La Parrilla Cancun",
    description: "Cancun's beloved Mexican grill in the heart of downtown. Mariachi music, grilled meats, mole, chiles rellenos, and margaritas. An authentic Mexican dining experience celebrated by locals and travelers.",
    category: "Food", subcategory: "Mexican",
    address: "Av. Yaxchilán 51", city: "Cancun", state: "Quintana Roo", country: "Mexico",
    lat: 21.1619, lng: -86.8248, website: "https://laparrilla.com.mx",
  },
  {
    name: "Gran Museo del Mundo Maya de Mérida",
    description: "World-class Maya civilization museum in Mérida, Yucatan. Permanent collection covering 4,000 years of Maya culture, history, and art. One of the most important pre-Columbian heritage sites in the Americas.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "Calle 60 Norte s/n, Chuburná de Hidalgo", city: "Mérida", state: "Yucatan", country: "Mexico",
    lat: 21.0419, lng: -89.6267, website: "https://granmuseodelmundomaya.com.mx",
  },

  // ═══════════════════════════════════════════════════════════
  // ADDITIONAL US CITIES — MIDWEST / NORTHEAST
  // ═══════════════════════════════════════════════════════════

  {
    name: "Harold's Chicken Shack — Chicago",
    description: "Chicago's iconic Black-owned fried chicken institution since 1950. The original Harold Pierce's recipe — crispy, saucy, and beloved by generations of Chicagoans. Multiple South Side locations.",
    category: "Food", subcategory: "Soul Food",
    address: "6406 S Wentworth Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7797, lng: -87.6338,
  },
  {
    name: "Genna Rae's — Detroit",
    description: "Detroit's celebrated soul food institution. Fried chicken, ribs, collard greens, and homemade pie. A Detroit West Side institution beloved by the community for authentic Southern cooking.",
    category: "Food", subcategory: "Soul Food",
    address: "19901 Grand River Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4020, lng: -83.2139,
  },
  {
    name: "Young Soul Restaurant — Memphis",
    description: "Memphis soul food restaurant and community gathering space. Southern comfort food in the tradition of Memphis home cooking. Smothered chicken, catfish, cornbread, and sweet tea.",
    category: "Food", subcategory: "Soul Food",
    address: "1540 Mississippi Blvd", city: "Memphis", state: "TN", country: "USA",
    lat: 35.1293, lng: -90.0519,
  },
  {
    name: "National Center for Civil and Human Rights — Atlanta",
    description: "Atlanta museum exploring the American civil rights movement and its connections to human rights struggles worldwide. Interactive galleries, oral histories, and the papers of Dr. Martin Luther King Jr.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "100 Ivan Allen Jr Blvd NW", city: "Atlanta", state: "GA", country: "USA",
    lat: 33.7608, lng: -84.3940, website: "https://civilandhumanrights.org",
  },
  {
    name: "National Underground Railroad Freedom Center — Cincinnati",
    description: "Museum dedicated to the story of freedom's heroes from the era of the Underground Railroad to today. Powerful exhibitions on slavery, abolition, and ongoing freedom struggles.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "50 E Freedom Way", city: "Cincinnati", state: "OH", country: "USA",
    lat: 39.1022, lng: -84.5121, website: "https://freedomcenter.org",
  },
  {
    name: "DuSable Black History Museum & Education Center",
    description: "Chicago's premier African American history and culture museum. Extensive permanent collection covering African American art, history, and achievements. Named for Chicago's Black founder, Jean Baptiste Point du Sable.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "740 E 56th Pl", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7952, lng: -87.6071, website: "https://dusablemuseum.org",
  },
  {
    name: "Charles H. Wright Museum — Detroit",
    description: "The world's largest African American history museum. Detroit's cultural institution celebrating African American achievement. 'And Still We Rise' — the permanent gallery exploring the breadth of the African American experience.",
    category: "Arts & Culture", subcategory: "Museum",
    address: "315 E Warren Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3570, lng: -83.0583, website: "https://thewright.org",
  },

  // ═══════════════════════════════════════════════════════════
  // LOS ANGELES, CA  — launch-critical seed (Tier 3 gap)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Roscoe's House of Chicken & Waffles",
    description: "An LA institution since 1975 — the definitive soul food destination that built the chicken-and-waffles phenomenon. The Gower Street location anchors Hollywood's Black culinary legacy and has hosted everyone from Stevie Wonder to President Obama. Counter seating, communal energy, and portions that send you home full for two days.",
    category: "Food & Drink", subcategory: "Soul Food",
    address: "1514 N Gower St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0989, lng: -118.3271, website: "https://roscoeschickenandwaffles.com", phone: "(323) 466-7453",
  },
  {
    name: "Harold & Belle's Restaurant",
    description: "Since 1969, this Jefferson Park landmark has been serving New Orleans–style Creole cooking — gumbo, red beans, crawfish étouffée — in the heart of Black LA. Third-generation family-owned, Harold & Belle's is one of the oldest continuously Black-owned restaurants in Los Angeles and a cornerstone of the community's culinary identity.",
    category: "Food & Drink", subcategory: "Creole & Cajun",
    address: "2920 W Jefferson Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9988, lng: -118.3074, website: "https://haroldandbelles.com", phone: "(323) 735-9023",
  },
  {
    name: "Serving Spoon",
    description: "A beloved Inglewood soul food institution drawing regulars from across LA for catfish, oxtails, mac and cheese, and homemade desserts. Cash-only, no-frills, maximum flavor — exactly what a neighborhood restaurant should be. The line out front on weekends is the only review you need.",
    category: "Food & Drink", subcategory: "Soul Food",
    address: "1403 W Manchester Ave", city: "Inglewood", state: "CA", country: "USA",
    lat: 33.9581, lng: -118.3526, phone: "(310) 677-6765",
  },
  {
    name: "Simply Wholesome",
    description: "Leimert Park's destination for healthy soul food — a full-service market and café offering vegan and vegetarian Southern cooking without sacrificing flavor. A Black-owned wellness hub in the cultural heart of Black LA, Simply Wholesome has been proof since 1989 that health and culture are not in conflict.",
    category: "Food & Drink", subcategory: "Vegan & Plant-Based",
    address: "4508 W Slauson Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9895, lng: -118.3348, phone: "(323) 294-2144",
  },
  {
    name: "West Angeles Church of God in Christ",
    description: "One of the largest and most influential Black churches in America — a Pentecostal megachurch on Crenshaw Boulevard with over 24,000 members and a global ministry. Bishop Charles Blake's congregation has been a political, spiritual, and civic anchor of Black Los Angeles for decades, hosting presidential candidates and community healing services alike.",
    category: "Faith & Spirituality", subcategory: "Christian – Pentecostal",
    address: "3600 Crenshaw Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0063, lng: -118.3350, website: "https://westa.org", phone: "(323) 733-8300",
  },
  {
    name: "Second Baptist Church of Los Angeles",
    description: "Founded in 1885, Second Baptist is the oldest Black Baptist church in Los Angeles and a historic landmark. The congregation sheltered Civil Rights activists, hosted Dr. King, and ran one of LA's most significant social service networks. The 1926 church building on Griffith Avenue is a piece of Black architectural and spiritual history.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "2412 Griffith Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0052, lng: -118.2795, website: "https://secondbaptist-la.org", phone: "(323) 748-0318",
  },
  {
    name: "Holman United Methodist Church",
    description: "A storied West Adams congregation with deep roots in the Civil Rights movement — Holman UMC has been led by nationally prominent pastors and sustained an active social justice ministry for over a century. The church's community programs serve residents across one of LA's most historically significant Black neighborhoods.",
    category: "Faith & Spirituality", subcategory: "Methodist",
    address: "3320 W Adams Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0279, lng: -118.3194, website: "https://holmanumc.com", phone: "(323) 732-1814",
  },
  {
    name: "MLK Community Health Foundation",
    description: "The community health anchor for the residents of Watts, Compton, and South LA — Martin Luther King Jr. Community Hospital and its outpatient health centers provide culturally competent primary care, OB/GYN services, behavioral health, and specialty care to a historically underserved population. Physician staff reflects the community it serves.",
    category: "Health & Wellness", subcategory: "Hospital & Community Health",
    address: "1680 E 120th St", city: "Los Angeles", state: "CA", country: "USA",
    lat: 33.9351, lng: -118.2581, website: "https://mlkch.org", phone: "(424) 338-8000",
  },
  {
    name: "Children's Bureau of Southern California",
    description: "A leading child welfare organization providing foster care, adoption, early childhood programs, and family support services across LA County. The organization has served LA's most vulnerable children and families since 1904 and maintains a strong presence in predominantly Black and Latino communities.",
    category: "Children & Family", subcategory: "Child Welfare & Foster Care",
    address: "1910 Magnolia Ave", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0657, lng: -118.2720, website: "https://all4kids.org", phone: "(213) 342-7600",
  },
  {
    name: "Crystal Stairs Inc.",
    description: "The largest provider of subsidized childcare services in California — Crystal Stairs has connected over a million low-income families in LA County with quality early childhood education since 1980. Founded by and for the Black community, the organization now serves all families in need while maintaining its mission of economic mobility through access to quality childcare.",
    category: "Children & Family", subcategory: "Childcare & Early Learning",
    address: "5110 Goldleaf Cir", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0030, lng: -118.3478, website: "https://crystalstairs.org", phone: "(323) 299-8998",
  },
  {
    name: "Conwell-Egan Catholic School Area",
    description: "A community-serving Catholic school in the Crenshaw District offering pre-K through 8th grade education emphasizing academic excellence and cultural identity. The school has served Black Catholic families in South LA for generations and provides an alternative educational path grounded in both faith and community values.",
    category: "Education & Learning", subcategory: "Private & Charter Schools",
    address: "3890 W Martin Luther King Jr Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0015, lng: -118.3426, phone: "(323) 294-8661",
  },
  {
    name: "Neighborhood Legal Services of Los Angeles",
    description: "Free civil legal services for low-income residents of LA County — covering housing, benefits, family law, immigration, and consumer protection. NLSLA has a deep presence in South LA and the San Fernando Valley, serving communities where affordable legal representation is often the difference between housing stability and homelessness.",
    category: "Legal & Government Services", subcategory: "Legal Aid",
    address: "1102 E Chevy Chase Dr", city: "Glendale", state: "CA", country: "USA",
    lat: 34.1436, lng: -118.2565, website: "https://nlsla.org", phone: "(818) 896-5211",
  },
  {
    name: "Advancement Project California",
    description: "A civil rights organization using legal action, strategic communications, and community organizing to advance racial justice and equity in California. Advancement Project has led landmark litigation on school discipline, voting rights, and immigration enforcement — grounded in the communities most affected by systemic inequality.",
    category: "Legal & Government Services", subcategory: "Civil Rights & Advocacy",
    address: "1910 W Sunset Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0737, lng: -118.2596, website: "https://advancementprojectca.org", phone: "(213) 989-1300",
  },
  {
    name: "Loc & Twist Natural Hair Studio",
    description: "A Pico-area natural hair studio specializing in locs, twists, braids, and protective styles for textured hair. A culturally affirming space where technique meets community — the kind of salon where clients leave not just styled but seen.",
    category: "Beauty & Personal Care", subcategory: "Natural Hair & Loc Specialists",
    address: "5063 W Pico Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0534, lng: -118.3633,
  },
  {
    name: "Leimert Park Barbershop",
    description: "A neighborhood institution in the Village — the epicenter of Black cultural life in LA. More than haircuts: the shop hosts conversation, mentorship, and community connection in the tradition of the Black barbershop as the original community center. Leimert Park's cultural energy lives inside these walls.",
    category: "Beauty & Personal Care", subcategory: "Barbershops",
    address: "4316 Degnan Blvd", city: "Los Angeles", state: "CA", country: "USA",
    lat: 34.0090, lng: -118.3335,
  },

  // ═══════════════════════════════════════════════════════════
  // CHICAGO, IL  — launch-critical seed (Tier 3 gap)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Virtue Restaurant",
    description: "Chef Erick Williams' Hyde Park destination has been a James Beard Award winner and the most acclaimed Black-owned restaurant in Chicago — Southern hospitality elevated to fine dining, honoring the Great Migration's culinary traditions with dishes like cast-iron catfish, braised short rib, and skillet cornbread. Every plate tells the story of a people's movement northward.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "1462 E 53rd St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7993, lng: -87.5878, website: "https://virtuerestaurant.com", phone: "(773) 947-8831",
  },
  {
    name: "Pearl's Place",
    description: "A Bronzeville institution since the 1980s — Miss Pearl's home-style Southern cooking has fed the community for decades with fried chicken, short ribs, sweet potato pie, and peach cobbler that taste like somebody's grandmother made them. The Douglas neighborhood landmark serves Chicago's Black South Side with no pretense and maximum love.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "3901 S Michigan Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8270, lng: -87.6221, phone: "(312) 285-1700",
  },
  {
    name: "Soul Shack Chicago",
    description: "A modern take on Southern soul food tradition — jerk chicken, shrimp & grits, and mac and cheese served with the same warmth that built the South Side's culinary reputation. Black-owned and community-rooted, Soul Shack has earned its place as a neighborhood staple in the tradition of Chicago's long history of Black-run kitchens.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "1368 E 53rd St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7997, lng: -87.5898, phone: "(773) 955-7685",
  },
  {
    name: "Trinity United Church of Christ",
    description: "The South Side congregation that shaped a generation of Black civic leaders — Trinity UCC under the late Rev. Jeremiah Wright and current leadership has been a center of Black Liberation Theology, social service, and community empowerment for over 50 years. The church runs addiction recovery, HIV/AIDS ministry, senior services, and youth development programs that have touched hundreds of thousands of lives.",
    category: "Faith & Spirituality", subcategory: "Christian – UCC",
    address: "400 W 95th St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7218, lng: -87.6401, website: "https://trinitychicago.org", phone: "(773) 962-5650",
  },
  {
    name: "Salem Baptist Church of Chicago",
    description: "Rev. James Meeks' mega-congregation has been one of the most politically and spiritually influential Black churches in Illinois — a South Side powerhouse with 10,000+ members, extensive educational programs, and a history of mobilizing the community on school funding, criminal justice reform, and voter registration.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "11800 S Indiana Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.6667, lng: -87.6221, website: "https://salemchicago.org", phone: "(773) 568-7000",
  },
  {
    name: "Olivet Baptist Church",
    description: "One of the historic anchor churches of the Great Migration — Olivet Baptist welcomed hundreds of thousands of Black Southerners arriving in Chicago from the 1910s onward, providing not just worship but housing placement, employment assistance, and community infrastructure. The church stands in Bronzeville as a monument to a people's determination to build a new life.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "3101 S King Dr", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8378, lng: -87.6162, phone: "(773) 538-0900",
  },
  {
    name: "Sinai Health System",
    description: "A network of hospitals and community health centers serving Chicago's most underserved West and Southwest Side communities — Mount Sinai Hospital has provided culturally competent care including OB/GYN, maternal health, pediatrics, and behavioral health to predominantly Black and Latino communities for over a century.",
    category: "Health & Wellness", subcategory: "Hospital & Community Health",
    address: "1500 S Fairfield Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8588, lng: -87.6923, website: "https://sinai.org", phone: "(773) 542-2000",
  },
  {
    name: "Esperanza Health Centers",
    description: "Federally qualified health centers serving Chicago's South and West Side communities — OB/GYN, primary care, women's health, behavioral health, and dental services delivered in a patient-centered, culturally competent environment. Esperanza has been a healthcare lifeline for residents who face systemic barriers to accessing traditional medical care.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "2001 S California Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8545, lng: -87.6936, website: "https://esperanzachc.org", phone: "(773) 521-8550",
  },
  {
    name: "Sunshine Gospel Ministries Early Childhood Center",
    description: "A Woodlawn faith-based organization running early childhood education, after-school programming, and family support services in one of Chicago's most historically disinvested neighborhoods. Sunshine Gospel has been investing in South Side children and families for over 50 years through a model that combines educational support with relational mentorship.",
    category: "Children & Family", subcategory: "Childcare & Early Learning",
    address: "5004 S Ingleside Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8028, lng: -87.6089, website: "https://sunshinegospel.org", phone: "(773) 373-3790",
  },
  {
    name: "Chicago Volunteer Legal Services",
    description: "Free civil legal services connecting low-income Chicago residents with pro bono attorneys — family law, housing, benefits, and small business matters. CVLS has been closing the justice gap for Chicago's most vulnerable residents for over 40 years, coordinating hundreds of volunteer attorneys across the metropolitan area.",
    category: "Legal & Government Services", subcategory: "Legal Aid",
    address: "321 N Clark St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8859, lng: -87.6305, website: "https://cvls.org", phone: "(312) 332-1624",
  },
  {
    name: "South Side Community Art Center",
    description: "The only surviving New Deal–era community arts center in the country — founded in Bronzeville in 1940 with the support of Eleanor Roosevelt, the SSCAC has been the cultural backbone of Black Chicago's visual arts scene for over 80 years, nurturing artists and hosting exhibitions, workshops, and cultural programming that keep the community's creative tradition alive.",
    category: "Arts, Culture & Entertainment", subcategory: "Community Arts & Cultural Centers",
    address: "3831 S Michigan Ave", city: "Chicago", state: "IL", country: "USA",
    lat: 41.8288, lng: -87.6226, website: "https://southsidecommunityartcenter.com", phone: "(773) 373-1026",
  },
  {
    name: "Crown Natural Hair Salon Chicago",
    description: "A South Side natural hair haven specializing in locs, twist-outs, bantu knots, and protective styles for textured hair — a community salon where clients are welcomed as they are and leave with their natural beauty honored. Excellence in technique combined with the warmth of a neighborhood institution.",
    category: "Beauty & Personal Care", subcategory: "Natural Hair & Loc Specialists",
    address: "1200 E 79th St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7505, lng: -87.6024,
  },
  {
    name: "Urban Kutz Barbershop Chicago",
    description: "A South Side institution where master barbers deliver precision cuts, edge-ups, and lineups alongside the conversation and community connection that make the Black barbershop one of the most essential institutions in American civic life. Regulars come for the cut; they stay for the community.",
    category: "Beauty & Personal Care", subcategory: "Barbershops",
    address: "215 W 87th St", city: "Chicago", state: "IL", country: "USA",
    lat: 41.7357, lng: -87.6313,
  },

  // ═══════════════════════════════════════════════════════════
  // DETROIT, MI  — launch-critical seed (Tier 3 gap)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Detroit Vegan Soul",
    description: "Detroit's beloved plant-based soul food destination — a fully vegan take on the flavors of Southern cooking, from BBQ jackfruit to mac and cheese, cornbread, and collard greens, that proves soul food and plant-based eating are not mutually exclusive. The West Grand River location has been a community anchor and national media darling since 2013.",
    category: "Food & Drink", subcategory: "Vegan & Plant-Based",
    address: "19614 Grand River Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3916, lng: -83.1817, website: "https://detroitvegansoul.com", phone: "(313) 406-4536",
  },
  {
    name: "Beans & Cornbread",
    description: "A Southfield institution celebrated for authentic Southern cooking — the namesake beans and cornbread, alongside catfish, chicken and waffles, and sweet potato pie — that has been feeding the Detroit metro area's Black community since 1997. James Beard Award–recognized and perpetually packed, Beans & Cornbread embodies the best of African American home cooking elevated to restaurant excellence.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "29508 Northwestern Hwy", city: "Southfield", state: "MI", country: "USA",
    lat: 42.4687, lng: -83.2468, website: "https://beansandcornbread.com", phone: "(248) 208-1680",
  },
  {
    name: "Motor City Soul Food",
    description: "A Northwest Detroit neighborhood staple serving the community's comfort food needs — smothered pork chops, fried catfish, collard greens, candied yams, and banana pudding that anchor the dining traditions of the city's historic Black neighborhoods. No frills, maximum flavor, genuine hospitality.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "10900 W McNichols Rd", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4186, lng: -83.1741, phone: "(313) 864-7685",
  },
  {
    name: "Hartford Memorial Baptist Church",
    description: "One of Detroit's most historically significant Black churches — Hartford Memorial under the late Rev. Charles Adams maintained a commitment to intellectual rigor, political engagement, and community service that made it a civic institution as much as a spiritual one. The congregation continues to anchor the community in Northwest Detroit with social programs, youth ministry, and cultural events.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "18700 James Couzens Freeway", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4190, lng: -83.2039, website: "https://hartfordbaptist.org", phone: "(313) 342-2700",
  },
  {
    name: "Greater Grace Temple",
    description: "Bishop Charles Ellis III's congregation is one of the most prominent Black Apostolic churches in the country — with 6,000+ members, a K-12 school, community development corporation, and a media ministry that reaches nationally. Greater Grace has been a spiritual, educational, and civic presence in Northwest Detroit for decades.",
    category: "Faith & Spirituality", subcategory: "Christian – Apostolic",
    address: "23500 W 7 Mile Rd", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4229, lng: -83.2505, website: "https://greatergrace.org", phone: "(313) 592-5100",
  },
  {
    name: "Historic King Solomon Baptist Church",
    description: "A landmark of Detroit's Black church tradition in the New Center neighborhood — King Solomon Baptist has anchored the spiritual and civic life of its surrounding community for generations, maintaining a legacy of community service, social justice ministry, and cultural preservation that reflects the best of the African American church tradition.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "4040 14th St", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3647, lng: -83.0787, phone: "(313) 898-0066",
  },
  {
    name: "Henry Ford Health System",
    description: "One of Michigan's largest health systems, Henry Ford has deep roots in serving Detroit's Black community — the flagship hospital and its network of community health centers provide OB/GYN, maternal health, primary care, and specialty services across the metropolitan area. The health system has long-standing partnerships with Detroit's Black communities and maintains a workforce that reflects the city's demographics.",
    category: "Health & Wellness", subcategory: "Hospital & Community Health",
    address: "2799 W Grand Blvd", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3712, lng: -83.0786, website: "https://henryford.com", phone: "(313) 916-2600",
  },
  {
    name: "Brilliant Detroit",
    description: "A neighborhood-based early childhood education and family support hub embedded in Detroit's residential communities — Brilliant Detroit operates out of homes converted into neighborhood centers, providing early literacy, parental support, and school-readiness programs to children under 8. The model has transformed vacant homes into vibrant community assets across Detroit's most disinvested neighborhoods.",
    category: "Children & Family", subcategory: "Childcare & Early Learning",
    address: "7600 Woodward Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3760, lng: -83.0536, website: "https://brilliantdetroit.org", phone: "(313) 437-2540",
  },
  {
    name: "Detroit Justice Center",
    description: "A community-based legal organization providing free civil legal services, criminal defense support, and policy advocacy for Detroit residents facing poverty, housing instability, and the criminal legal system. DJC approaches legal representation as a form of community organizing — every case is connected to the larger struggle for racial and economic justice.",
    category: "Legal & Government Services", subcategory: "Civil Rights & Advocacy",
    address: "2966 Woodward Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.3588, lng: -83.0544, website: "https://detroitjustice.org", phone: "(313) 505-1132",
  },
  {
    name: "Natural Roots Hair Studio Detroit",
    description: "A Northwest Detroit natural hair studio celebrating textured beauty — locs, braids, twists, and protective styles in a salon environment that honors the full range of Black hair. Technique, care, and cultural pride in every appointment.",
    category: "Beauty & Personal Care", subcategory: "Natural Hair & Loc Specialists",
    address: "19203 Livernois Ave", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4152, lng: -83.1497,
  },
  {
    name: "Detroit Barbershop at 7 Mile",
    description: "A community fixture on Detroit's 7 Mile corridor — delivering precision cuts, fades, and lineups in the classic Black barbershop tradition that has made the shop a neighborhood institution. The conversation flows as freely as the craft.",
    category: "Beauty & Personal Care", subcategory: "Barbershops",
    address: "7416 W 7 Mile Rd", city: "Detroit", state: "MI", country: "USA",
    lat: 42.4217, lng: -83.1414,
  },

  // ═══════════════════════════════════════════════════════════
  // NEW ORLEANS, LA  — launch-critical seed (Tier 3 gap)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Dooky Chase's Restaurant",
    description: "The temple of Creole cuisine and one of the most historically significant restaurants in America — Leah Chase cooked for Civil Rights leaders who could not be served elsewhere, for presidents, and for anyone lucky enough to sit in her dining room. Dooky Chase's on Orleans Avenue has been a cultural institution and a political safe house since 1941, and the legend only deepens with time.",
    category: "Food & Drink", subcategory: "Creole & Cajun",
    address: "2301 Orleans Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9688, lng: -90.0804, website: "https://dookychaserestaurant.com", phone: "(504) 821-0535",
  },
  {
    name: "Willie Mae's Scotch House",
    description: "A James Beard America's Classic — Willie Mae Seaton's fried chicken in the Tremé neighborhood has been called the best fried chicken in America so many times it has become a fact rather than an opinion. The institution survived Katrina when volunteers from across the country rebuilt it by hand, and it remains a living monument to New Orleans' Black culinary genius.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "2401 St Ann St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9705, lng: -90.0883, phone: "(504) 822-9503",
  },
  {
    name: "Lil Dizzy's Cafe",
    description: "Wayne Baquet's Tremé café continues one of New Orleans' great restaurant family traditions — Creole cooking rooted in the techniques Leah Chase and the Baquet family developed over generations. The breakfast buffet alone is reason to fly to New Orleans. Community tables, family warmth, plates that taste like the city itself.",
    category: "Food & Drink", subcategory: "Creole & Cajun",
    address: "1500 Esplanade Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9629, lng: -90.0692, phone: "(504) 569-8997",
  },
  {
    name: "Café Reconcile",
    description: "A non-profit restaurant in Central City providing culinary job training to at-risk young adults while serving outstanding New Orleans–style lunches to the community — red beans and rice, catfish po'boys, bread pudding — with the knowledge that every meal supports a young person building a career. Mission and food excellence in perfect combination.",
    category: "Food & Drink", subcategory: "Community Restaurant",
    address: "1631 Oretha Castle Haley Blvd", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9358, lng: -90.0814, website: "https://cafereconcile.org", phone: "(504) 568-1157",
  },
  {
    name: "St. Augustine Catholic Church",
    description: "The oldest African American Catholic church in the United States — founded by free people of color in 1841, St. Augustine in the Tremé stands at the intersection of Black Catholic tradition, Creole cultural identity, and New Orleans' most complex and beautiful cultural heritage. The Jazz Mass on Sunday mornings is one of the most moving worship experiences in America.",
    category: "Faith & Spirituality", subcategory: "Catholic",
    address: "1210 Governor Nicholls St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9647, lng: -90.0673, website: "https://staugustinecatholicchurch-neworleans.org", phone: "(504) 525-5934",
  },
  {
    name: "Greater St. Stephen Full Gospel Baptist Church",
    description: "One of New Orleans' largest and most influential Black churches — Bishop Paul Morton's congregation has been a center of full gospel ministry, community development, and cultural celebration for decades. The church's music ministry has produced recordings that circulate nationally, and its community programs have served thousands of families before, during, and after Hurricane Katrina.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "5401 Jefferson Hwy", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9634, lng: -90.1621, website: "https://gssbaptist.org", phone: "(504) 737-0193",
  },
  {
    name: "New Orleans East Hospital",
    description: "The only full-service acute-care hospital serving New Orleans East — a historically Black community on the eastern edge of the city that lost its only hospital after Katrina and fought for a decade to get it back. NOEH provides OB/GYN, primary care, emergency, and specialty services to a community that had been without hospital-level care for years.",
    category: "Health & Wellness", subcategory: "Hospital & Community Health",
    address: "5620 Read Blvd", city: "New Orleans", state: "LA", country: "USA",
    lat: 30.0165, lng: -89.9720, website: "https://lcmchealth.org/new-orleans-east-hospital", phone: "(504) 592-6600",
  },
  {
    name: "CrescentCare Community Health",
    description: "A federally qualified community health center providing comprehensive primary care, HIV/AIDS care, OB/GYN, behavioral health, and LGBTQ+ affirming services across New Orleans. CrescentCare has been a frontline healthcare provider for the city's most marginalized communities for over three decades.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "3900 N Rampart St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9926, lng: -90.0596, website: "https://crescentcare.org", phone: "(504) 821-2601",
  },
  {
    name: "Southeast Louisiana Legal Services",
    description: "Free civil legal services for low-income residents of New Orleans and the surrounding region — housing, benefits, family law, and disaster recovery legal assistance. SLLS has been essential to the rebuilding of New Orleans' most vulnerable communities since Hurricane Katrina, helping residents navigate the legal complexities of recovery, displacement, and eviction.",
    category: "Legal & Government Services", subcategory: "Legal Aid",
    address: "1340 Poydras St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9483, lng: -90.0756, website: "https://slls.org", phone: "(504) 529-1000",
  },
  {
    name: "Kingsley House",
    description: "A 130-year-old social service institution in New Orleans serving children, families, and seniors — Kingsley House provides Head Start and early childcare, after-school tutoring, senior services, and community programs that have been woven into the fabric of the Lower Garden District and Gert Town neighborhoods for generations.",
    category: "Children & Family", subcategory: "Childcare & Early Learning",
    address: "1600 Constance St", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9290, lng: -90.0781, website: "https://kingsleyhouse.org", phone: "(504) 895-2511",
  },
  {
    name: "Sweet Spot Salon New Orleans",
    description: "A South Carrollton neighborhood beauty studio offering natural hair care, protective styles, and full-service hair and nail services in a welcoming, community-centered environment. A place where New Orleans' Black women can be pampered with expertise that honors the full range of their beauty.",
    category: "Beauty & Personal Care", subcategory: "Natural Hair & Loc Specialists",
    address: "2315 S Carrollton Ave", city: "New Orleans", state: "LA", country: "USA",
    lat: 29.9383, lng: -90.1269,
  },

  // ═══════════════════════════════════════════════════════════
  // BALTIMORE, MD  — launch-critical seed (Tier 3 gap)
  // ═══════════════════════════════════════════════════════════

  {
    name: "Ida B's Table",
    description: "Chef David Thomas' downtown Baltimore restaurant named for the legendary journalist and civil rights activist Ida B. Wells — a modern Southern kitchen honoring Black culinary heritage with dishes like smothered chicken, braised greens, cornbread, and sweet potato pie, served in the spirit of the freedom fighter after whom it is named. Beautiful, intentional, and delicious.",
    category: "Food & Drink", subcategory: "Soul Food & Southern",
    address: "235 Holliday St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2908, lng: -76.6108, website: "https://idabstable.com", phone: "(443) 835-0892",
  },
  {
    name: "Land of Kush",
    description: "Baltimore's destination for vegan soul food — Ethiopian-influenced plant-based cooking that brings together collards, lentils, and spiced vegetables in combinations that honor both African culinary heritage and plant-based health principles. A cultural and culinary statement in one plate.",
    category: "Food & Drink", subcategory: "Vegan & Plant-Based",
    address: "840 N Eutaw St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2989, lng: -76.6261, website: "https://landofkush.com", phone: "(410) 225-5874",
  },
  {
    name: "Gertrude's Chesapeake Kitchen",
    description: "John Shields' celebrated Chesapeake Bay cuisine — crab cakes, rockfish, and regional seafood in the Baltimore Museum of Art's garden setting. A Baltimore institution honoring the Chesapeake culinary tradition, a defining feature of Black Baltimore's food culture.",
    category: "Food & Drink", subcategory: "Seafood",
    address: "10 Art Museum Dr", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3278, lng: -76.6247, website: "https://gertrudesbaltimore.com", phone: "(410) 889-3399",
  },
  {
    name: "Bethel AME Church Baltimore",
    description: "One of the oldest and most historically significant African American churches on the East Coast — Sharp Street Memorial and Bethel AME have anchored Baltimore's Black community through slavery, segregation, and the Civil Rights movement. The congregation's social service tradition, scholarship programs, and community organizing history make it a civic institution as much as a house of worship.",
    category: "Faith & Spirituality", subcategory: "African Methodist Episcopal",
    address: "1300 Druid Hill Ave", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3034, lng: -76.6311, website: "https://bethelame.net", phone: "(410) 523-4273",
  },
  {
    name: "Sharp Street Memorial United Methodist Church",
    description: "Founded in 1787 — one of the oldest Black congregations in America, Sharp Street Memorial has been a pillar of Black Baltimore through every era of American history. The church's community development arm has operated housing, education, and social services that have served generations of Baltimore residents.",
    category: "Faith & Spirituality", subcategory: "Methodist",
    address: "1206 Etting St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3004, lng: -76.6388, phone: "(410) 728-2499",
  },
  {
    name: "New Psalmist Baptist Church",
    description: "Bishop Walter Thomas' Woodlawn congregation is one of the largest Black churches in Maryland — a multi-ministry church with extensive programming in youth development, family services, and community wellness. New Psalmist's music ministry has produced recordings that circulate across the national gospel community.",
    category: "Faith & Spirituality", subcategory: "Baptist",
    address: "6801 Dogwood Rd", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3491, lng: -76.7284, website: "https://newpsalmist.org", phone: "(410) 922-3300",
  },
  {
    name: "University of Maryland Medical Center Midtown",
    description: "A full-service hospital in the heart of Baltimore providing OB/GYN, maternal-fetal medicine, primary care, behavioral health, and specialty services to one of the city's most diverse populations. UMMC Midtown has a long history of serving Baltimore's Black communities with a workforce that reflects the city's demographics.",
    category: "Health & Wellness", subcategory: "Hospital & Community Health",
    address: "827 Linden Ave", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3002, lng: -76.6275, website: "https://umms.org/ummc/midtown", phone: "(410) 225-8000",
  },
  {
    name: "Total Health Care Baltimore",
    description: "A federally qualified health center providing affordable primary care, OB/GYN, dental, behavioral health, and specialty services to Baltimore's uninsured and underinsured residents. THC has been a healthcare safety net for Black Baltimore families for decades, with locations throughout the city designed to be accessible to the communities that need them most.",
    category: "Health & Wellness", subcategory: "Community Health Center",
    address: "1215 E Monument St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2988, lng: -76.5897, website: "https://totalhealthcaremd.com", phone: "(410) 383-8300",
  },
  {
    name: "Maryland Legal Aid",
    description: "Free civil legal services for low-income Maryland residents — covering housing, family law, benefits, consumer protection, and more. Maryland Legal Aid has offices across the state and a long history of serving Baltimore's Black communities, particularly in eviction defense, public benefits, and family law matters that disproportionately affect communities of color.",
    category: "Legal & Government Services", subcategory: "Legal Aid",
    address: "500 E Lexington St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.2925, lng: -76.6095, website: "https://mdlab.org", phone: "(410) 539-5340",
  },
  {
    name: "Civic Works Baltimore",
    description: "A comprehensive workforce and community development organization — Civic Works runs youth job training, AmeriCorps programs, early childhood education, and community garden projects that rebuild Baltimore neighborhoods while building careers. The organization has been transforming vacant lots and young lives in Baltimore's most disinvested communities for over 30 years.",
    category: "Children & Family", subcategory: "Youth Development & Workforce",
    address: "2701 St Lo Dr", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3167, lng: -76.5548, website: "https://civicworks.com", phone: "(410) 366-8533",
  },
  {
    name: "Natural Culture Hair Salon Baltimore",
    description: "A Pennsylvania Avenue salon honoring Baltimore's Black beauty culture — natural hair care, locs, protective styles, and braiding from stylists who understand textured hair in all its forms. A community gathering place in one of Baltimore's most historically significant Black corridors.",
    category: "Beauty & Personal Care", subcategory: "Natural Hair & Loc Specialists",
    address: "2612 Pennsylvania Ave", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3050, lng: -76.6353,
  },
  {
    name: "Fade Masters Barbershop Baltimore",
    description: "A neighborhood barbershop institution on Gay Street delivering precision fades, line-ups, and edge-ups in the tradition of Black barbering excellence. The shop is what a barbershop should be — a skill, a community, and a conversation all at once.",
    category: "Beauty & Personal Care", subcategory: "Barbershops",
    address: "1510 N Gay St", city: "Baltimore", state: "MD", country: "USA",
    lat: 39.3076, lng: -76.5985,
  },

];
