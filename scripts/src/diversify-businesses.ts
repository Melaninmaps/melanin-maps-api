/**
 * Diversifies business ownership by converting ~30 of the 76 "black-owned only"
 * businesses into authentic representations of other minority communities.
 *
 * Each update changes name + description + ownership_designations together
 * so the business actually represents the community — not just a relabel.
 *
 * Geographic logic: community assignments match real diaspora/immigrant
 * concentrations in each city (e.g., Dearborn MI → Arab-American,
 * Oakland Fruitvale → Latino, New Orleans → Caribbean, Miami → Hispanic).
 */

import { Client } from "pg";

const RAILWAY_URL =
  "postgresql://postgres:SrHkJjXrzFvxldUyhWkssbikYvFAgwkF@tokaido.proxy.rlwy.net:10066/railway";

interface BizUpdate {
  oldName: string;
  newName: string;
  description: string;
  ownershipDesignations: string[];
}

const UPDATES: BizUpdate[] = [
  // ── HISPANIC-OWNED (5) ─────────────────────────────────────────────────────
  // Fruitvale, Oakland IS the Latino neighborhood — this name change is authentic
  {
    oldName: "Fruitvale Soul Spot",
    newName: "La Paloma Taqueria & Panadería",
    description:
      "Family-owned taqueria and bakery rooted in Fruitvale's vibrant Latino community. Known for fresh tortillas, pan dulce, and slow-cooked birria that draws lines down the block every weekend.",
    ownershipDesignations: ["hispanic-owned", "latino-owned", "immigrant-owned"],
  },
  // Detroit Southwest is a major Mexican-American community
  {
    oldName: "Motown Eats",
    newName: "Abuela Luz Mexican Kitchen",
    description:
      "Southwest Detroit institution serving three generations of the Reyes family's recipes — mole negro, handmade tamales, and weekend menudo that regulars say tastes exactly like home.",
    ownershipDesignations: ["hispanic-owned", "latino-owned", "women-owned"],
  },
  // New York has the largest Puerto Rican and Dominican population in the US
  {
    oldName: "Nana's Southern Table",
    newName: "Alma Latina Kitchen",
    description:
      "Bronx-born and community-bred, Alma Latina serves Puerto Rican and Dominican home cooking — pernil, mofongo, and pastelillos — in a space that doubles as a neighborhood gathering point.",
    ownershipDesignations: ["hispanic-owned", "latino-owned"],
  },
  // Nashville's Latino community has grown significantly — East Nashville esp.
  {
    oldName: "Sulphur Dell Cafe",
    newName: "Casa Hernández Panadería",
    description:
      "Nashville's go-to Mexican bakery, opened by the Hernández family after relocating from Oaxaca. Conchas, churros, and specialty coffee alongside a community bulletin board that serves the city's growing Latino population.",
    ownershipDesignations: ["hispanic-owned", "latino-owned", "immigrant-owned"],
  },
  // Miami is majority Hispanic — a coworking hub there should reflect that
  {
    oldName: "Nexus Coworking",
    newName: "Conexión Business Hub",
    description:
      "Miami's premier coworking space designed for Latino entrepreneurs, creatives, and freelancers. Bilingual programming, mentorship cohorts, and a community that celebrates the full spectrum of Latin American business culture.",
    ownershipDesignations: ["hispanic-owned", "latino-owned"],
  },

  // ── IMMIGRANT-OWNED / AFRICAN DIASPORA (4) ────────────────────────────────
  // Ethiopian community in DC/DMV area — also strong in various cities
  {
    oldName: "Freeborn Roasters",
    newName: "Meskel Ethiopian Kitchen",
    description:
      "Named for the Ethiopian New Year harvest celebration, Meskel serves traditional injera with tibs, kitfo, and misir wot alongside Ethiopian coffee ceremonies that honor the drink's origin story.",
    ownershipDesignations: ["immigrant-owned", "african-diaspora-owned"],
  },
  // Nigerian diaspora strong in Memphis and Atlanta — Lagos Market works
  {
    oldName: "Soulful Grind Coffee",
    newName: "Lagos Market & Café",
    description:
      "West African grocery and café bringing the flavors of Lagos to Memphis — suya, jollof rice, akara, and imported goods from Nigeria, Ghana, and Senegal. A home away from home for the city's growing West African community.",
    ownershipDesignations: ["immigrant-owned", "african-diaspora-owned"],
  },
  // Chicago has a significant Haitian community in Evanston/Rogers Park
  {
    oldName: "Bronzeville Biscuit Co.",
    newName: "Lakay Haitian Bakery",
    description:
      "\"Lakay\" means home in Haitian Creole — and that's exactly the feeling. Patties, pain patate, griot sandwiches, and strong Haitian coffee baked fresh daily by a family that arrived from Port-au-Prince in 2010.",
    ownershipDesignations: ["immigrant-owned", "caribbean-owned"],
  },
  // Oakland has a notable Brazilian capoeira and arts community (Fruitvale/Temescal)
  {
    oldName: "Oakland Roots Coffee",
    newName: "Raízes Brasileiras Café",
    description:
      "\"Raízes\" means roots — this Brazilian-owned café and cultural space in Oakland serves specialty Brazilian coffee, pão de queijo, and brigadeiros alongside capoeira workshops and Portuguese language meetups.",
    ownershipDesignations: ["immigrant-owned", "african-diaspora-owned", "lgbtq-owned"],
  },

  // ── INDIGENOUS-OWNED (5) ──────────────────────────────────────────────────
  // Austin is near many tribal lands; Three Sisters is a traditional farming concept
  {
    oldName: "House of Praise Event Space",
    newName: "Three Sisters Native Market",
    description:
      "Rooted in the traditional Three Sisters agricultural practice, this Indigenous-owned market carries native seeds, medicinal plants, handwoven textiles, and foods sourced from tribal nations across the Southwest.",
    ownershipDesignations: ["indigenous-owned", "native-american-owned", "women-owned"],
  },
  // Milwaukee has the largest urban Native American population in Wisconsin
  {
    oldName: "Heritage Physical Therapy",
    newName: "Red Earth Healing Center",
    description:
      "Holistic healing rooted in Indigenous medicine traditions — combining licensed physical therapy with plant-based treatments, smudging ceremonies, and mental wellness programming for Milwaukee's Native American community.",
    ownershipDesignations: ["indigenous-owned", "native-american-owned", "women-owned"],
  },
  // Oakland's Intertribal Friendship House is a real landmark — honoring that tradition
  {
    oldName: "Ashby Arts Academy",
    newName: "Intertribal Arts & Culture Center",
    description:
      "Inspired by Oakland's rich history of pan-tribal organizing, this center offers Indigenous art classes, beading workshops, storytelling circles, and gallery exhibitions featuring artists from across tribal nations.",
    ownershipDesignations: ["indigenous-owned", "native-american-owned"],
  },
  // Baltimore has Native American communities often overlooked
  {
    oldName: "Druid Hill Creative Hub",
    newName: "Sage & Cedar Wellness Collective",
    description:
      "Indigenous women-led wellness space offering plant medicine consultations, sweat lodge ceremonies, trauma-informed counseling, and community healing circles rooted in Lumbee and Piscataway traditions.",
    ownershipDesignations: ["indigenous-owned", "native-american-owned", "women-owned"],
  },
  // Charlotte — Catawba Nation has historic ties to this region
  {
    oldName: "Verdant Landscape & Design",
    newName: "Red Cedar Native Plant Nursery",
    description:
      "Catawba Nation-affiliated nursery specializing in native plant landscaping, ecological restoration, and culturally significant plants used in traditional medicine. Serving both residential clients and tribal land projects.",
    ownershipDesignations: ["indigenous-owned", "native-american-owned"],
  },

  // ── CARIBBEAN-OWNED (4) ───────────────────────────────────────────────────
  // New Orleans has the deepest Caribbean cultural roots of any US city
  {
    oldName: "Jazz & Java Lounge",
    newName: "Island Spice Caribbean Grill",
    description:
      "New Orleans Caribbean fusion — jerk chicken, oxtail, curry goat, and roti served alongside rum cocktails and live soca and reggae on weekends. The Antilles brought to the Crescent City.",
    ownershipDesignations: ["caribbean-owned"],
  },
  // Atlanta has a very large Jamaican and Caribbean community
  {
    oldName: "Kulture Kitchen",
    newName: "Kingston Jerk House",
    description:
      "Atlanta's most authentic Jamaican kitchen — barrel-smoked jerk chicken and pork, escovitch fish, ackee and saltfish, and homemade rum punch. Started by a Kingston family who moved to Decatur in 2008.",
    ownershipDesignations: ["caribbean-owned", "immigrant-owned"],
  },
  // Brooklyn has one of the largest Caribbean communities in the US (West Indian)
  {
    oldName: "Sankofa Natural Apothecary",
    newName: "Trini Roots Apothecary",
    description:
      "Brooklyn's Trinidadian-owned herbal shop and wellness boutique. Carries bush teas, black castor oil, Caribbean natural hair products, and traditional remedies passed down through Trinidadian folk healing practice.",
    ownershipDesignations: ["caribbean-owned", "immigrant-owned", "women-owned"],
  },
  // West End Atlanta — growing Caribbean population
  {
    oldName: "West End Market",
    newName: "Caribbean Crossroads Market",
    description:
      "Pan-Caribbean grocery and gathering space in Atlanta's West End — carrying produce, spices, and specialty goods from Trinidad, Barbados, Haiti, and Jamaica alongside a prepared foods counter with rotating island specials.",
    ownershipDesignations: ["caribbean-owned", "immigrant-owned"],
  },

  // ── MIDDLE EASTERN-OWNED (4) ──────────────────────────────────────────────
  // Dearborn/Inkster Michigan has the largest Arab-American population in the US
  {
    oldName: "Inkster Financial Advisors",
    newName: "Dearborn Community Finance",
    description:
      "Arab-American owned financial services firm in the greater Dearborn area, specializing in halal-compliant financial planning, small business loans, and wealth-building workshops for Michigan's Muslim and Arab communities.",
    ownershipDesignations: ["middle-eastern-owned", "north-african-owned"],
  },
  // Washington DC has a very large Ethiopian, Yemeni, and Arab-American community
  {
    oldName: "4th Avenue Eatery",
    newName: "Baba's Mediterranean Grill",
    description:
      "Lebanese-Palestinian family restaurant serving shawarma, falafel, hummus, and house-made baklava in a warm space where the whole neighborhood feels welcome. Open since 2015, beloved by regulars since day one.",
    ownershipDesignations: ["middle-eastern-owned", "immigrant-owned"],
  },
  // LA's Iranian/Persian community is centered in Westwood/Beverly Hills/West LA
  {
    oldName: "Hyde Park Health & Fitness",
    newName: "Saffron House Wellness Center",
    description:
      "Iranian-owned wellness center blending Persian traditional medicine with modern fitness — cupping, herbal consultations, Persian-style steam baths, and culturally informed nutrition coaching for LA's diverse diaspora community.",
    ownershipDesignations: ["middle-eastern-owned", "immigrant-owned", "women-owned"],
  },
  // St. Louis has a growing Arab-American community (Lebanese, Yemeni)
  {
    oldName: "Wright Financial Literacy Center",
    newName: "Juntos Community Financial Center",
    description:
      "Bilingual financial education nonprofit serving both Latin American immigrants and Arab-American families in St. Louis — free tax prep, ITIN assistance, halal financing education, and first-generation homebuyer counseling.",
    ownershipDesignations: ["hispanic-owned", "immigrant-owned", "minority-owned"],
  },

  // ── CROSS-COMMUNITY COMBOS (4) ────────────────────────────────────────────
  // Detroit's Southwest is THE Mexican-American community — agricultural/market roots
  {
    oldName: "Cultivate Organic Market",
    newName: "Tres Culturas Community Market",
    description:
      "Detroit's Southwest multicultural market celebrating three food traditions — Mexican, African, and Indigenous — with a rotating vendor floor, community kitchen rentals, and a farm-to-table CSA serving immigrant families.",
    ownershipDesignations: ["hispanic-owned", "latino-owned", "indigenous-owned", "immigrant-owned"],
  },
  // Charlotte — Hispanic + veteran combo; many Latino vets in the Carolinas
  {
    oldName: "Old Fourth Ward Fitness",
    newName: "Guerrero Brothers Boxing & Fitness",
    description:
      "Founded by two Chicano veterans from Charlotte, Guerrero Brothers offers boxing training, strength conditioning, and a free youth program for at-risk teens. The name means warrior — and they mean it.",
    ownershipDesignations: ["hispanic-owned", "latino-owned", "veteran-owned"],
  },
  // African tech diaspora in Detroit — immigrant + tech community
  {
    oldName: "Detroit Future Tech",
    newName: "Pan-African Tech Collective",
    description:
      "Detroit-based tech hub and incubator connecting African diaspora founders, engineers, and creatives across West African, East African, and Caribbean communities. Coding bootcamps, startup mentorship, and global diaspora networking.",
    ownershipDesignations: ["immigrant-owned", "african-diaspora-owned"],
  },
  // Dallas has a large Nigerian and East African tech workforce — Uhuru is Swahili already
  {
    oldName: "Uhuru Tech Solutions",
    newName: "Uhuru Digital Studio",
    description:
      "Swahili for freedom — Uhuru Digital is a Pan-African creative tech studio in Dallas building apps, digital campaigns, and software for diaspora-owned businesses. Founded by a Kenyan software engineer and a Nigerian UX designer.",
    ownershipDesignations: ["immigrant-owned", "african-diaspora-owned"],
  },
];

async function run() {
  const client = new Client({
    connectionString: RAILWAY_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log(`Connected. Planning ${UPDATES.length} business conversions.\n`);

  let updated = 0;
  let notFound = 0;

  for (const u of UPDATES) {
    const result = await client.query(
      `UPDATE businesses
       SET name = $1,
           description = $2,
           ownership_designations = $3::jsonb
       WHERE name = $4
       RETURNING id, city`,
      [u.newName, u.description, JSON.stringify(u.ownershipDesignations), u.oldName]
    );

    if (result.rowCount && result.rowCount > 0) {
      const row = result.rows[0] as { id: string; city: string };
      console.log(`✅ ${u.oldName} → ${u.newName} (${row.city})`);
      updated++;
    } else {
      console.log(`⚠️  NOT FOUND: "${u.oldName}"`);
      notFound++;
    }
  }

  console.log(`\nDone. Updated: ${updated}  Not found: ${notFound}`);

  // Final distribution
  const dist = await client.query(`
    SELECT ownership_designations, COUNT(*) as count
    FROM businesses
    GROUP BY ownership_designations
    ORDER BY count DESC
  `);
  console.log("\nFinal ownership distribution:");
  for (const row of dist.rows as Array<{ ownership_designations: string[]; count: string }>) {
    console.log(`  ${JSON.stringify(row.ownership_designations).padEnd(60)} → ${row.count}`);
  }

  await client.end();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
