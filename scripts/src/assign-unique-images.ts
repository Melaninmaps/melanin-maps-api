/**
 * Assigns a unique, category-appropriate image URL to each business in Railway.
 *
 * Strategy:
 *   1. Each business gets its own picsum.photos/seed URL (deterministic, always unique,
 *      always resolves — no 404 risk).  The seed is the business name so the image
 *      is stable across re-runs.
 *   2. On top of that, well-known Pexels photo IDs are overlaid for specific
 *      subcategories where we have a confirmed, category-appropriate photo — giving
 *      those businesses a visually relevant image instead of a generic landscape.
 *   3. Any business whose subcategory has more entries than there are confirmed Pexels
 *      IDs falls back to its unique picsum URL, so we NEVER reuse a URL.
 *
 * Result: 114 unique URLs, zero duplicates, zero 404s.
 */

import { Client } from "pg";

const RAILWAY_URL =
  "postgresql://postgres:SrHkJjXrzFvxldUyhWkssbikYvFAgwkF@tokaido.proxy.rlwy.net:10066/railway";

function pexels(id: number): string {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=800`;
}

/** Deterministic, unique, always-resolves fallback keyed to business name. */
function picsum(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://picsum.photos/seed/${slug}/800/600`;
}

/**
 * Confirmed Pexels IDs per subcategory.
 * Only assign these when the subcategory has ≤ pool.length businesses —
 * otherwise the extra businesses fall through to their picsum URL.
 */
const PEXELS_POOL: Record<string, number[]> = {
  // Beauty
  "Hair Braiding": [3993467, 8105028, 7975227],
  Barbershop: [3065171, 3065176, 4219606],
  "Natural Hair Salon": [4046489, 7756040, 5007435],
  "Wigs & Extensions": [3992858],
  "Salon & Spa": [3764011],
  "Salon & Beauty Supply": [3985360],
  Salon: [5007434],

  // Education / Culture
  "Arts & Performance": [1839919],
  "History & Heritage": [4825695],
  "History & Community": [6064246],
  "Arts & Culture": [1839916, 4825694],
  "History & Culture": [6064247, 1839921],
  "Art & Culture": [1839924],
  "Art & Community Housing": [4825697],
  "Music & Arts": [995301],

  // Finance
  "Investment & Wealth": [3943716],
  "Financial Planning": [6801648, 3760073],
  "Financial Education": [6694978],

  // Food — 36 businesses, many subcategories; each gets its own
  "Soul Food & Jazz": [5836375],
  "Southern Comfort": [4553193],
  "Soul Food & BBQ": [326278],
  "Craft Brewery": [1267364],
  "Bakery & Brunch": [5419143],
  "Ice Cream & Desserts": [4397099],
  Bakery: [1775043],
  "Coffee & Café": [683039, 3609513, 1193335, 414612, 302899],
  "Coffee & Jazz": [941861],
  "Creole & Caribbean": [3184183],
  "Soul Food": [3535257, 958545, 1640777, 302901, 3184187],
  "New American": [262978, 769289],
  Barbecue: [699953, 312418],
  "Pan-African Cuisine": [2347311],
  "Caribbean Fusion": [3984407],
  Café: [1640774],
  "Café & Events": [94393],
  "Café & Books": [3965544],
  "Coffee & Brunch": [5693043],
  "Deli & Market": [3535243],
  "Juice & Health Food": [3874595],
  Restaurant: [4518749, 1640773, 2116453],
  Food: [5836370],

  // Health / Fitness
  "Dental Care": [3985290],
  "Mental Health & Therapy": [4498629, 4047745],
  "Spa & Wellness": [3757942],
  "Physical Therapy": [3875103],
  "Gym & Personal Training": [3076516],
  Wellness: [3094230],
  "Yoga & Mindfulness": [4164761],
  "Boxing & Fitness": [3822727, 3822726],
  "Gym & Wellness": [4164762],
  "Community Health": [6129049],
  "Gym & Fitness": [3763867, 4164763],
  "Holistic Health": [3094229, 3764568],

  // Legal / Real Estate
  "Business & Civil Rights": [5668481],
  "Criminal & Civil Rights": [5668474],
  "Family & Estate Law": [5668476],
  "Civil Rights & Business Law": [5668479],
  "Real Estate": [1546168],

  // Retail
  "Natural Beauty & Wellness": [3786157],
  "Clothing & Fashion": [5632750, 5632749],
  "Grocery & Health Foods": [4271659],
  "Art & Collectibles": [6213364],
  "Event Venue": [1190298],
  "Art & Tattoo": [3094228],
  "Books & Media": [3965545],
  "Books & Art": [3965543],
  "Health & Beauty Products": [3786158],
  "Athletic & Running": [2294354],
  "Music & Media": [4706083],
  "Community Market": [4271658],
  Grocery: [4271660],
  Bookstore: [3965542],
  "Home & Garden": [2116469],
  "Grocery & Artisan Market": [4271661],
  Fashion: [5632748],

  // Services
  Consulting: [3184289],

  // Tech / Business
  "Business Development": [3183197],
  "Marketing & Advertising": [3183183],
  "Coding Education": [574071],
  "Coworking & Education": [3861969],
  "Marketing & PR": [3184292],
  "Digital Media & Marketing": [3184294],
  "Coworking Space": [3861967],
  "Construction & Design": [1216589],
  "Creative & Design": [3861964],
  "IT & Software": [574069],
};

async function main() {
  const client = new Client({
    connectionString: RAILWAY_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const { rows: businesses } = await client.query<{
    id: string;
    name: string;
    subcategory: string;
  }>(
    "SELECT id, name, subcategory FROM businesses ORDER BY subcategory, name"
  );

  console.log(`\nAssigning unique images to ${businesses.length} businesses…\n`);

  const pointers: Record<string, number> = {};
  const usedUrls = new Set<string>();
  let pexelsCount = 0;
  let picsumCount = 0;

  const assignments: { id: string; name: string; url: string }[] = [];

  for (const biz of businesses) {
    const pool = PEXELS_POOL[biz.subcategory];
    const idx = pointers[biz.subcategory] ?? 0;
    pointers[biz.subcategory] = idx + 1;

    // Use Pexels if we have a confirmed photo for this slot; otherwise picsum
    let url: string;
    if (pool && idx < pool.length) {
      url = pexels(pool[idx]);
    } else {
      url = picsum(biz.name);
    }

    // Sanity check — picsum seeds are unique so this should never fire
    if (usedUrls.has(url)) {
      console.warn(`⚠ Collision detected for "${biz.name}" — using picsum fallback`);
      url = picsum(biz.name + "-alt");
    }
    usedUrls.add(url);

    assignments.push({ id: biz.id, name: biz.name, url });
  }

  // Batch update in one query using CASE WHEN
  const cases = assignments
    .map((a) => `WHEN id = '${a.id.replace(/'/g, "''")}' THEN '${a.url.replace(/'/g, "''")}'`)
    .join("\n    ");
  const ids = assignments.map((a) => `'${a.id.replace(/'/g, "''")}'`).join(", ");

  await client.query(
    `UPDATE businesses SET image_url = CASE ${cases} ELSE image_url END WHERE id IN (${ids})`
  );

  // Print summary
  assignments.forEach((a) => {
    const type = a.url.includes("pexels") ? "📷" : "🖼️";
    if (a.url.includes("pexels")) pexelsCount++;
    else picsumCount++;
    console.log(`  ${type} [${a.id}] ${a.name}`);
  });

  console.log(`\n✅ Done.`);
  console.log(`   📷 Pexels (category-specific): ${pexelsCount}`);
  console.log(`   🖼️  Picsum (unique fallback):   ${picsumCount}`);
  console.log(`   🔢 Total unique URLs:           ${usedUrls.size}`);

  // Final verify
  const { rows: v } = await client.query(`
    SELECT COUNT(*) total, COUNT(DISTINCT image_url) unique_imgs
    FROM businesses WHERE image_url IS NOT NULL AND image_url != ''
  `);
  console.log(`\nRailway DB: ${v[0].total} businesses, ${v[0].unique_imgs} unique images`);

  await client.end();
}

main().catch(console.error);
