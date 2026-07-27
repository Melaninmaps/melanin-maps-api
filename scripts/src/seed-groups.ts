import { db } from "@workspace/db";
import { groups } from "@workspace/db/schema";

const SEED_GROUPS = [
  {
    name: "Black Entrepreneurs Network",
    description: "A space for Black business owners and aspiring entrepreneurs to connect, share resources, and support each other's growth. From startups to established businesses — all are welcome.",
    category: "professional",
    memberCount: 1842,
    city: "Atlanta",
    state: "GA",
    isPrivate: false,
  },
  {
    name: "Melanin Travelers",
    description: "For Black travelers who love exploring the world. Share safety tips, destination recs, hidden gems, and connect with travel partners who get the full experience.",
    category: "travel",
    memberCount: 3201,
    city: null,
    state: null,
    isPrivate: false,
  },
  {
    name: "Black Tech Professionals",
    description: "Connecting Black engineers, designers, PMs, and tech leaders. Job referrals, mentorship, industry news, and real talk about navigating the tech industry.",
    category: "professional",
    memberCount: 2654,
    city: "Remote",
    state: null,
    isPrivate: false,
  },
  {
    name: "Community Safety Watch",
    description: "Stay informed about safety in your neighborhood. Members share real-time alerts, resources, and strategies to keep our communities safe and empowered.",
    category: "activism",
    memberCount: 987,
    city: null,
    state: null,
    isPrivate: false,
  },
  {
    name: "Black Women in Wellness",
    description: "A safe space for Black women to discuss physical health, mental wellness, holistic healing, and self-care practices. No judgment, just support.",
    category: "health",
    memberCount: 1523,
    city: null,
    state: null,
    isPrivate: false,
  },
  {
    name: "ATL Black Social Scene",
    description: "Your guide to Atlanta's vibrant Black social life. Events, restaurant recs, rooftop parties, art shows, and everything happening in the city.",
    category: "social",
    memberCount: 2109,
    city: "Atlanta",
    state: "GA",
    isPrivate: false,
  },
  {
    name: "African Diaspora Creatives",
    description: "Artists, musicians, writers, filmmakers, and creatives of the African diaspora. Share your work, collaborate, and celebrate Black artistry in all its forms.",
    category: "culture",
    memberCount: 743,
    city: null,
    state: null,
    isPrivate: false,
  },
  {
    name: "Black Homeowners & Investors",
    description: "Building generational wealth through real estate. Tips on buying your first home, investment properties, credit building, and navigating the housing market.",
    category: "professional",
    memberCount: 1267,
    city: null,
    state: null,
    isPrivate: false,
  },
];

async function main() {
  console.log("Seeding groups...");
  const existing = await db.select().from(groups);
  if (existing.length > 0) {
    console.log(`Groups table already has ${existing.length} rows — skipping seed.`);
    process.exit(0);
  }
  await db.insert(groups).values(SEED_GROUPS);
  console.log(`Inserted ${SEED_GROUPS.length} groups.`);
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
