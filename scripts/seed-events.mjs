/**
 * seed-events.mjs — Seed 509 community festivals, markets, and gatherings
 * Run: node scripts/seed-events.mjs
 */
import pg from "pg";
import { randomUUID } from "crypto";

const db = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const CITIES = [
  { city: "Atlanta",         state: "GA", lat: 33.7490,  lng: -84.3880 },
  { city: "Houston",         state: "TX", lat: 29.7604,  lng: -95.3698 },
  { city: "New Orleans",     state: "LA", lat: 29.9511,  lng: -90.0715 },
  { city: "Washington",      state: "DC", lat: 38.9072,  lng: -77.0369 },
  { city: "New York",        state: "NY", lat: 40.7128,  lng: -74.0060 },
  { city: "Chicago",         state: "IL", lat: 41.8781,  lng: -87.6298 },
  { city: "Los Angeles",     state: "CA", lat: 34.0522,  lng: -118.2437 },
  { city: "Philadelphia",    state: "PA", lat: 39.9526,  lng: -75.1652 },
  { city: "Charlotte",       state: "NC", lat: 35.2271,  lng: -80.8431 },
];

const CATEGORIES = ["Cultural", "Festival", "Market", "Community", "Music", "Food", "Art", "Business", "Health", "Education"];

// Base event templates per category
const MARKET_TEMPLATES = [
  { title: "{city} Black Farmers Market",        desc: "Fresh produce, preserves, and goods from Black-owned farms and vendors. Live music, community connection, and real food.",              organizer: "Black Farmers Collective",   price: "Free",   is_free: true,  featured: true  },
  { title: "Sweet Auburn Market Day",            desc: "Weekly community market in the heart of {city}'s cultural district. Local crafts, food vendors, and artisans.",                       organizer: "Community Market Co.",       price: "Free",   is_free: true,  featured: false },
  { title: "{city} Juneteenth Market",           desc: "Celebrating freedom with 80+ minority-owned vendors, live performances, and cultural exhibits.",                                      organizer: "Juneteenth Collective",      price: "Free",   is_free: true,  featured: true  },
  { title: "Melanin Market Pop-Up",              desc: "Curated pop-up with Black and brown designers, makers, jewelry artists, and wellness brands.",                                        organizer: "Melanin Makers Co.",         price: "$5",     is_free: false, featured: false },
  { title: "{city} Soul Food Market",            desc: "Celebrating the tradition of soul food with homemade recipes, live cooking demos, and generational recipes.",                         organizer: "Soul Kitchen Alliance",      price: "Free",   is_free: true,  featured: false },
  { title: "Third Ward Artisan Market",          desc: "Artisan crafts, handmade goods, and cultural wares from {city}'s most historically rich neighborhood.",                              organizer: "Third Ward Market Assoc.",   price: "Free",   is_free: true,  featured: false },
  { title: "{city} Heritage Makers Market",      desc: "100+ vendors celebrating African diaspora culture through crafts, beauty, wellness, and food.",                                       organizer: "Heritage Arts Foundation",   price: "$3",     is_free: false, featured: true  },
  { title: "Black Business Bazaar",              desc: "Shop, sip, and support. A curated market featuring 60+ Black-owned businesses from {city} and beyond.",                             organizer: "Black Business Network",     price: "Free",   is_free: true,  featured: false },
  { title: "Afrofuturist Flea Market",           desc: "Art, vintage, streetwear, and Afrocentric goods in a vibrant outdoor market setting. DJs, food trucks, community.",                 organizer: "Future Collective",          price: "$5",     is_free: false, featured: false },
  { title: "{city} Community Harvest Market",   desc: "End-of-season celebration with produce, preserves, baked goods, and community connection.",                                           organizer: "Urban Agriculture Collective", price: "Free",  is_free: true,  featured: false },
];

const FESTIVAL_TEMPLATES = [
  { title: "{city} Black Arts Festival",         desc: "Three days of visual art, performance, live music, poetry, and cultural celebration across the city.",                               organizer: "Black Arts Alliance",        price: "Free",   is_free: true,  featured: true  },
  { title: "Afrofest {city}",                    desc: "Annual Afrobeats and Pan-African music festival. Dance, food, fashion, and connection with the diaspora.",                           organizer: "Afrofest Productions",       price: "$20",    is_free: false, featured: true  },
  { title: "{city} Jazz & Heritage Festival",    desc: "World-class jazz, blues, gospel, and R&B in the heart of the cultural district. Food, art, and community.",                        organizer: "Jazz Heritage Foundation",   price: "$15",    is_free: false, featured: true  },
  { title: "Historically Black Film Festival",   desc: "Screening independent films by Black directors, with Q&As, panels, and a celebration of Black storytelling.",                       organizer: "Black Cinema Collective",    price: "$12",    is_free: false, featured: false },
  { title: "{city} Juneteenth Celebration",      desc: "Family-friendly festival honoring Emancipation Day. Live music, vendors, historical exhibits, children's activities.",              organizer: "Juneteenth Committee",       price: "Free",   is_free: true,  featured: true  },
  { title: "MLK Day Unity Celebration",          desc: "Annual event honoring Dr. King's legacy through service, community, music, and reflection.",                                        organizer: "MLK Legacy Foundation",      price: "Free",   is_free: true,  featured: false },
  { title: "Black Greek Homecoming Stroll Off",  desc: "NPHC fraternities and sororities unite for a celebration of step, stomp, and Black Greek culture.",                                 organizer: "NPHC {city} Chapter",        price: "$10",    is_free: false, featured: false },
  { title: "{city} Pan-African Festival",        desc: "A celebration of African culture, food, fashion, music, and community across the diaspora.",                                        organizer: "Pan-African Cultural Org",   price: "Free",   is_free: true,  featured: true  },
  { title: "Kwanzaa Community Gathering",        desc: "Seven nights of Nguzo Saba principles: unity, self-determination, collective work, cooperative economics, purpose, creativity, faith.", organizer: "Kwanzaa Foundation",     price: "Free",   is_free: true,  featured: false },
  { title: "{city} Caribbean Carnival",          desc: "Mas costumes, soca, reggae, and Caribbean food in a joyful street celebration of Caribbean culture.",                               organizer: "Caribbean Cultural Assoc.",  price: "Free",   is_free: true,  featured: true  },
  { title: "Harlem Week {city} Edition",         desc: "A week-long celebration of Black art, music, culture, and community excellence modeled after the legendary Harlem Week.",           organizer: "Cultural Uplift Network",    price: "Free",   is_free: true,  featured: false },
  { title: "Black Excellence Gala",             desc: "Annual formal celebration of Black achievement across business, arts, education, and community leadership.",                          organizer: "Excellence in Excellence",   price: "$75",    is_free: false, featured: false },
];

const COMMUNITY_TEMPLATES = [
  { title: "Community Safety Town Hall",         desc: "Open forum with local leaders, advocates, and residents to discuss neighborhood safety, policing, and community solutions.",         organizer: "Community Action Network",   price: "Free",   is_free: true,  featured: false },
  { title: "Block Party: {city} Style",          desc: "Old-school block party energy. Food, music, games, and the kind of community connection that makes neighborhoods whole.",            organizer: "Neighborhood Association",   price: "Free",   is_free: true,  featured: false },
  { title: "Mutual Aid Distribution Event",      desc: "Community resource fair: food, clothing, hygiene products, legal resources, and health screenings.",                                organizer: "Mutual Aid {city}",          price: "Free",   is_free: true,  featured: false },
  { title: "Back-to-School Supply Drive",        desc: "Free school supplies for K-12 students. Backpacks, pencils, notebooks, and more — plus community connection.",                     organizer: "Community Care Collective",  price: "Free",   is_free: true,  featured: false },
  { title: "Barbershop Talk: Men's Mental Health", desc: "Men's mental health and community dialogue in the barbershop tradition. Real talk, no stigma.",                                   organizer: "Brothers Speak Network",     price: "Free",   is_free: true,  featured: false },
  { title: "Sisters Circle: Women's Wellness Day", desc: "A full day of wellness workshops, meditation, nutrition, financial literacy, and sisterhood for Black women.",                   organizer: "Sisters Circle Foundation",  price: "Free",   is_free: true,  featured: false },
  { title: "Youth Entrepreneurship Expo",        desc: "Young innovators (ages 12–24) pitch their business ideas, showcase products, and connect with mentors.",                            organizer: "Young Entrepreneurs Assoc.", price: "Free",   is_free: true,  featured: false },
  { title: "Cookout for a Cause",               desc: "Community cookout with live music, games, and fundraising for local schools and nonprofits.",                                        organizer: "Community First Foundation", price: "Free",   is_free: true,  featured: false },
  { title: "Voter Registration & Civic Empowerment Drive", desc: "Register to vote, learn about local candidates, and connect with civic organizations working for community change.",    organizer: "Civic Power Alliance",       price: "Free",   is_free: true,  featured: false },
  { title: "Community Elder Appreciation Brunch", desc: "Honoring the elders who built our community. Stories, wisdom, food, and intergenerational connection.",                          organizer: "Elder Circle Foundation",    price: "Free",   is_free: true,  featured: false },
  { title: "Housing Rights Workshop",           desc: "Know your rights as a renter or homeowner. Free legal guidance on fair housing, eviction prevention, and homeownership.",            organizer: "Fair Housing Coalition",     price: "Free",   is_free: true,  featured: false },
  { title: "{city} Community Mural Unveiling",   desc: "Celebrate the unveiling of a new community mural honoring local legends and the neighborhood's story.",                            organizer: "Public Art Collective",      price: "Free",   is_free: true,  featured: false },
];

const MUSIC_TEMPLATES = [
  { title: "Jazz in the Park",                   desc: "Free outdoor jazz concert in a beloved community park. Bring a blanket, enjoy the music, support local artists.",                   organizer: "Jazz in the Park Society",   price: "Free",   is_free: true,  featured: true  },
  { title: "Gospel Brunch & Concert",            desc: "Sunday morning gospel experience with live choir performances, community brunch, and spiritual celebration.",                        organizer: "Gospel Arts Collective",     price: "$15",    is_free: false, featured: false },
  { title: "R&B in the Park",                   desc: "Live R&B performances from emerging and established artists. Picnic vibes, summer energy, community love.",                         organizer: "Music in the Park Series",   price: "Free",   is_free: true,  featured: false },
  { title: "Hip Hop Heritage Day",              desc: "Celebrating hip hop's roots in Black culture with freestyle battles, DJ sets, breakdancing, and graffiti art.",                     organizer: "Hip Hop Heritage Collective", price: "Free",  is_free: true,  featured: false },
  { title: "Soul Sundays Live Music Series",     desc: "Monthly live music series celebrating the tradition of soul, funk, and R&B. Local artists, community venue.",                      organizer: "Soul Sundays Productions",   price: "$10",    is_free: false, featured: false },
  { title: "{city} Blues Festival",             desc: "A celebration of the blues tradition and its African American roots. Multiple stages, vendors, and cultural programming.",           organizer: "Blues Heritage Society",     price: "Free",   is_free: true,  featured: true  },
  { title: "Roots & Culture Music Festival",    desc: "African, Caribbean, and Southern music traditions meet on one stage. A joyful celebration of diaspora culture.",                    organizer: "Roots Music Coalition",      price: "$12",    is_free: false, featured: false },
];

const FOOD_TEMPLATES = [
  { title: "{city} Black Restaurant Week",       desc: "A week-long celebration of minority-owned restaurants. Eat, explore, and support the culinary entrepreneurs in your community.",   organizer: "Black Restaurant Week Org",  price: "Free",   is_free: true,  featured: true  },
  { title: "Soul Food Cook-Off & Competition",  desc: "Community chefs compete in categories: best mac & cheese, best collard greens, best cornbread, best dessert. Public tasting.",     organizer: "Soul Kitchen Network",       price: "$5",     is_free: false, featured: true  },
  { title: "Taste of the Diaspora Food Festival", desc: "Caribbean, West African, Southern, and Latin cuisines celebrate together in a joyful multi-cultural food festival.",             organizer: "Diaspora Kitchen Collective", price: "Free", is_free: true,  featured: false },
  { title: "Vegan Soul Food Pop-Up",            desc: "Plant-based takes on soul food classics. Locally sourced, community-made, and absolutely delicious.",                               organizer: "Plant-Based Black Chefs",    price: "Free",   is_free: true,  featured: false },
  { title: "Fish Fry Fundraiser",               desc: "Classic Friday fish fry to support the community. Catfish, tilapia, coleslaw, potato salad — the way it's supposed to be.",        organizer: "Community Church Kitchen",   price: "$12",    is_free: false, featured: false },
];

const HEALTH_TEMPLATES = [
  { title: "Free Health Fair & Screenings",     desc: "Free blood pressure, diabetes, cholesterol, and vision screenings. Community health education and wellness resources.",              organizer: "Community Health Alliance",  price: "Free",   is_free: true,  featured: false },
  { title: "Mental Health Awareness Walk",      desc: "Walk together to break the stigma around mental health in the Black community. Resources, speakers, and community support.",        organizer: "Mind Matters Network",       price: "Free",   is_free: true,  featured: false },
  { title: "Yoga in the Park: Community Session", desc: "Free outdoor yoga class designed for all bodies and skill levels. Part of an ongoing wellness series for the community.",        organizer: "Black Wellness Collective",  price: "Free",   is_free: true,  featured: false },
  { title: "Sickle Cell Awareness Event",       desc: "Education, free testing, resources, and community support for those affected by sickle cell disease.",                              organizer: "Sickle Cell Alliance",       price: "Free",   is_free: true,  featured: false },
];

const BUSINESS_TEMPLATES = [
  { title: "Black Business Networking Mixer",   desc: "Monthly networking event connecting Black entrepreneurs, professionals, and community leaders. Build relationships, share resources.",  organizer: "Black Business Alliance",  price: "Free",   is_free: true,  featured: false },
  { title: "Access to Capital Workshop",        desc: "Learn about grants, SBA loans, CDFIs, and alternative funding sources for minority-owned businesses.",                              organizer: "Minority Business Institute", price: "Free",  is_free: true,  featured: false },
  { title: "Black Entrepreneurs Pitch Night",   desc: "Five founders pitch their businesses to a panel of investors and community mentors. Open to the public.",                            organizer: "Black Venture Network",      price: "Free",   is_free: true,  featured: true  },
  { title: "Business Registration & Legal Workshop", desc: "Free workshop on LLC formation, contracts, trademarks, and business law for Black entrepreneurs.",                           organizer: "Legal Empowerment Initiative", price: "Free", is_free: true,  featured: false },
];

const ART_TEMPLATES = [
  { title: "{city} Black Art Exhibition",       desc: "A curated showcase of works by Black artists exploring identity, history, culture, and the future.",                                organizer: "Black Artists Collective",   price: "Free",   is_free: true,  featured: true  },
  { title: "Art in the Hood Gallery Walk",      desc: "Self-guided gallery walk through {city}'s cultural neighborhood featuring Black and brown artists.",                                organizer: "Hood Art Collective",        price: "Free",   is_free: true,  featured: false },
  { title: "Spoken Word & Poetry Night",        desc: "Open mic and featured poets celebrating Black literary traditions. Sign up to perform or come to be moved.",                       organizer: "Word & Rhythm Collective",   price: "Free",   is_free: true,  featured: false },
  { title: "Youth Art Showcase",                desc: "Young artists (ages 8–18) display paintings, photography, sculptures, and digital art from community art programs.",               organizer: "Youth Arts Foundation",      price: "Free",   is_free: true,  featured: false },
];

const EDUCATION_TEMPLATES = [
  { title: "HBCU College Fair",                 desc: "Representatives from 40+ HBCUs connect with students. Application workshops, scholarship info, and alumni mentorship.",             organizer: "HBCU Connect Alliance",      price: "Free",   is_free: true,  featured: true  },
  { title: "Black History Deep Dive: {city}",   desc: "Community historians uncover the lesser-known stories of Black life and achievement in {city}.",                                   organizer: "Black History Project",      price: "Free",   is_free: true,  featured: false },
  { title: "Financial Literacy for the Community", desc: "Budgeting, credit building, homeownership, and generational wealth — taught in plain language by community educators.",       organizer: "Wealth Building Collective", price: "Free",   is_free: true,  featured: false },
  { title: "Coding & Tech Workshop for Black Youth", desc: "Free coding bootcamp introducing Black students (ages 12–18) to Python, web development, and AI concepts.",                organizer: "Tech Equity Alliance",       price: "Free",   is_free: true,  featured: false },
];

// Dates: Aug 2026 → Dec 2026
const DATES_AUG = ["2026-08-09","2026-08-10","2026-08-14","2026-08-15","2026-08-16","2026-08-21","2026-08-22","2026-08-23","2026-08-28","2026-08-29","2026-08-30"];
const DATES_SEP = ["2026-09-05","2026-09-06","2026-09-07","2026-09-12","2026-09-13","2026-09-19","2026-09-20","2026-09-21","2026-09-26","2026-09-27"];
const DATES_OCT = ["2026-10-03","2026-10-04","2026-10-10","2026-10-11","2026-10-17","2026-10-18","2026-10-24","2026-10-25","2026-10-31"];
const DATES_NOV = ["2026-11-01","2026-11-07","2026-11-08","2026-11-14","2026-11-15","2026-11-21","2026-11-22","2026-11-28","2026-11-29"];
const DATES_DEC = ["2026-12-05","2026-12-06","2026-12-12","2026-12-13","2026-12-19","2026-12-20","2026-12-26","2026-12-27"];
const ALL_DATES = [...DATES_AUG, ...DATES_SEP, ...DATES_OCT, ...DATES_NOV, ...DATES_DEC];

const TIMES = ["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"];

const ALL_TEMPLATES = [
  ...MARKET_TEMPLATES.map(t => ({ ...t, category: "Market" })),
  ...FESTIVAL_TEMPLATES.map(t => ({ ...t, category: "Festival" })),
  ...COMMUNITY_TEMPLATES.map(t => ({ ...t, category: "Community" })),
  ...MUSIC_TEMPLATES.map(t => ({ ...t, category: "Music" })),
  ...FOOD_TEMPLATES.map(t => ({ ...t, category: "Food" })),
  ...HEALTH_TEMPLATES.map(t => ({ ...t, category: "Health" })),
  ...BUSINESS_TEMPLATES.map(t => ({ ...t, category: "Business" })),
  ...ART_TEMPLATES.map(t => ({ ...t, category: "Art" })),
  ...EDUCATION_TEMPLATES.map(t => ({ ...t, category: "Education" })),
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function jitter(coord, range = 0.05) { return coord + (Math.random() - 0.5) * range; }
function shortDate(iso) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

function buildEvents(targetCount = 509) {
  const events = [];
  let i = 0;
  while (events.length < targetCount) {
    const cityObj = CITIES[i % CITIES.length];
    const tmpl = ALL_TEMPLATES[(i * 7 + Math.floor(i / CITIES.length)) % ALL_TEMPLATES.length];
    const dateStr = ALL_DATES[i % ALL_DATES.length];
    const timeStr = TIMES[i % TIMES.length];
    
    const title = (tmpl.title || "Community Event").replace(/\{city\}/g, cityObj.city);
    const desc  = (tmpl.desc  || "").replace(/\{city\}/g, cityObj.city);
    const organizer = (tmpl.organizer || "").replace(/\{city\}/g, cityObj.city);
    
    events.push({
      id: randomUUID(),
      title,
      description: desc,
      date: dateStr,
      date_short: shortDate(dateStr),
      time: timeStr,
      location: `${cityObj.city} Cultural District`,
      city: cityObj.city,
      state: cityObj.state,
      category: tmpl.category,
      organizer,
      price: tmpl.price,
      is_free: tmpl.is_free,
      latitude: jitter(cityObj.lat),
      longitude: jitter(cityObj.lng),
      featured: tmpl.featured && (i % 8 === 0),
      status: "active",
      audience_rating: "everyone",
    });
    i++;
  }
  return events;
}

async function main() {
  await db.connect();
  console.log("Connected to DB");

  // Remove old seeded events (no created_by_id = platform-seeded)
  const existing = await db.query("SELECT COUNT(*) as cnt FROM events");
  console.log(`Existing events: ${existing.rows[0].cnt}`);

  const events = buildEvents(509);
  console.log(`Generated ${events.length} events`);

  // Insert in batches of 50
  const BATCH = 50;
  let inserted = 0;
  for (let b = 0; b < events.length; b += BATCH) {
    const batch = events.slice(b, b + BATCH);
    const values = batch.map((e, idx) => {
      const base = idx * 17 + 1;
      return `($${base},$${base+1},$${base+2},$${base+3},$${base+4},$${base+5},$${base+6},$${base+7},$${base+8},$${base+9},$${base+10},$${base+11},$${base+12},$${base+13},$${base+14},$${base+15},$${base+16})`;
    }).join(",");
    const flat = batch.flatMap(e => [
      e.id, e.title, e.description, e.date, e.date_short, e.time,
      e.location, e.city, e.state, e.category, e.organizer, e.price,
      e.is_free, e.latitude, e.longitude, e.featured, e.status,
    ]);
    await db.query(
      `INSERT INTO events (id,title,description,date,date_short,time,location,city,state,category,organizer,price,is_free,latitude,longitude,featured,status) VALUES ${values} ON CONFLICT (id) DO NOTHING`,
      flat
    );
    inserted += batch.length;
    process.stdout.write(`\rInserted ${inserted}/${events.length} events`);
  }

  const final = await db.query("SELECT COUNT(*) as cnt FROM events");
  console.log(`\nFinal event count: ${final.rows[0].cnt}`);
  await db.end();
}

main().catch(err => { console.error(err); process.exit(1); });
