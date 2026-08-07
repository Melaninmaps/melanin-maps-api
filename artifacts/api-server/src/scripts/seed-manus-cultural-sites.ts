/**
 * Seed script: Manus Tour Guide Cultural Sites
 * Source: Three Manus AI-generated cultural guide PDFs (Parts 1, 2, 3)
 * Canonical spec: docs/product/MWM_Replit_Seeding_Instructions.md
 *
 * Usage:
 *   npx ts-node -r tsconfig-paths/register src/scripts/seed-manus-cultural-sites.ts [--dry-run]
 *
 * Rules:
 *   - Dedup on LOWER(name) + LOWER(city) — upsert (enrich existing rows)
 *   - listing_status: Philadelphia = live_unclaimed, all others = staged
 *   - data_source: always "manus_tour_guide"
 *   - approximate_location: true when no street address available (city-center coords used)
 *   - Cultural Phrases section from Part 3 is intentionally excluded
 */

import { Pool } from "pg";
import * as dotenv from "dotenv";
dotenv.config();

const isDryRun = process.argv.includes("--dry-run");


// ─── City-center coordinate fallbacks ───────────────────────────────────────
const CITY_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Philadelphia,PA":   { lat: 39.9526,  lng: -75.1652 },
  "Washington,DC":     { lat: 38.9072,  lng: -77.0369 },
  "Richmond,VA":       { lat: 37.5407,  lng: -77.4360 },
  "Durham,NC":         { lat: 35.9940,  lng: -78.8986 },
  "Raleigh,NC":        { lat: 35.7796,  lng: -78.6382 },
  "Charlotte,NC":      { lat: 35.2271,  lng: -80.8431 },
  "Columbia,SC":       { lat: 33.9999,  lng: -81.0344 },
  "Atlanta,GA":        { lat: 33.7490,  lng: -84.3880 },
  "Montgomery,AL":     { lat: 32.3668,  lng: -86.3000 },
  "Birmingham,AL":     { lat: 33.5186,  lng: -86.8104 },
  "Mobile,AL":         { lat: 30.6954,  lng: -88.0399 },
  "Tuskegee,AL":       { lat: 32.4240,  lng: -85.6924 },
  "Baton Rouge,LA":    { lat: 30.4515,  lng: -91.1871 },
  "New Orleans,LA":    { lat: 29.9511,  lng: -90.0715 },
  "Houston,TX":        { lat: 29.7604,  lng: -95.3698 },
  "San Antonio,TX":    { lat: 29.4241,  lng: -98.4936 },
  "Dallas,TX":         { lat: 32.7767,  lng: -96.7970 },
  "Fort Worth,TX":     { lat: 32.7555,  lng: -97.3308 },
  "Allentown,PA":      { lat: 40.6084,  lng: -75.4902 },
  "Harrisburg,PA":     { lat: 40.2732,  lng: -76.8839 },
  "Collingdale,PA":    { lat: 39.9168,  lng: -75.2771 },
  "Willow Grove,PA":   { lat: 40.1484,  lng: -75.1166 },
  "Chicopee,MA":       { lat: 42.1487,  lng: -72.6079 },
  "Springfield,MA":    { lat: 42.1015,  lng: -72.5898 },
  "New York,NY":       { lat: 40.7128,  lng: -74.0060 },
  "Newark,NJ":         { lat: 40.7357,  lng: -74.1724 },
  "Baltimore,MD":      { lat: 39.2904,  lng: -76.6122 },
  "Boston,MA":         { lat: 42.3601,  lng: -71.0589 },
  "Hartford,CT":       { lat: 41.7658,  lng: -72.6851 },
  "Jacksonville,FL":   { lat: 30.3322,  lng: -81.6557 },
  "Miami,FL":          { lat: 25.7617,  lng: -80.1918 },
  "Orlando,FL":        { lat: 28.5383,  lng: -81.3792 },
  "Tampa,FL":          { lat: 27.9506,  lng: -82.4572 },
  "Savannah,GA":       { lat: 32.0835,  lng: -81.0998 },
  "Nashville,TN":      { lat: 36.1627,  lng: -86.7816 },
  "Memphis,TN":        { lat: 35.1495,  lng: -90.0490 },
  "Chicago,IL":        { lat: 41.8781,  lng: -87.6298 },
  "Detroit,MI":        { lat: 42.3314,  lng: -83.0458 },
  "Dearborn,MI":       { lat: 42.3223,  lng: -83.1763 },
  "Hamtramck,MI":      { lat: 42.3978,  lng: -83.0494 },
  "Cleveland,OH":      { lat: 41.4993,  lng: -81.6944 },
  "St. Louis,MO":      { lat: 38.6270,  lng: -90.1994 },
  "Indianapolis,IN":   { lat: 39.7684,  lng: -86.1581 },
  "Milwaukee,WI":      { lat: 43.0389,  lng: -87.9065 },
  "Minneapolis,MN":    { lat: 44.9778,  lng: -93.2650 },
  "St. Paul,MN":       { lat: 44.9537,  lng: -93.0900 },
  "Kansas City,MO":    { lat: 39.0997,  lng: -94.5786 },
  "Tulsa,OK":          { lat: 36.1540,  lng: -95.9928 },
  "Jackson,MS":        { lat: 32.2988,  lng: -90.1848 },
  "Los Angeles,CA":    { lat: 34.0522,  lng: -118.2437 },
  "Oakland,CA":        { lat: 37.8044,  lng: -122.2712 },
  "San Francisco,CA":  { lat: 37.7749,  lng: -122.4194 },
  "San Jose,CA":       { lat: 37.3382,  lng: -121.8863 },
  "Denver,CO":         { lat: 39.7392,  lng: -104.9903 },
  "Phoenix,AZ":        { lat: 33.4484,  lng: -112.0740 },
  "Las Vegas,NV":      { lat: 36.1699,  lng: -115.1398 },
  "Seattle,WA":        { lat: 47.6062,  lng: -122.3321 },
  "Portland,OR":       { lat: 45.5051,  lng: -122.6750 },
  "Charleston,SC":     { lat: 32.7765,  lng: -79.9311 },
  "Columbus,OH":       { lat: 39.9612,  lng: -82.9988 },
  "Cincinnati,OH":     { lat: 39.1031,  lng: -84.5120 },
  "Norfolk,VA":        { lat: 36.8508,  lng: -76.2859 },
};

function coords(city: string, state: string, address?: string) {
  const key = `${city},${state}`;
  const c = CITY_CENTERS[key] ?? { lat: 39.9526, lng: -75.1652 };
  return { lat: c.lat, lng: c.lng, approx: !address || address.toLowerCase().includes(city.toLowerCase()) };
}

// ─── Entity type ─────────────────────────────────────────────────────────────
interface Entity {
  name: string;
  description: string;
  category: string;           // top-level category
  heritage_category?: string; // sub-bucket for heritage_landmark rows
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
  listing_status: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const GUIDE_ENTITIES: Entity[] = [

  // ═══════════════════════════════════════════════════════════════════════════
  // PHILADELPHIA, PA  — listing_status: live_unclaimed
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "African American Museum in Philadelphia",
    description: "The first museum in the U.S. funded and built by a major municipality to preserve and interpret the history of African Americans.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "701 Arch St, Philadelphia, PA 19106",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "live_unclaimed",
    visit_tip: "Plan a morning visit — exhibits are richest early and the galleries give you room to breathe before afternoon crowds arrive.",
  },
  {
    name: "Mother Bethel AME Church",
    description: "Founded in 1816, the oldest AME church in the country and birthplace of the African Methodist Episcopal denomination. A National Historic Landmark and key stop on the Underground Railroad.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "419 S 6th St, Philadelphia, PA 19147",
    year_established: 1816, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "live_unclaimed",
    visit_tip: "Sunday morning service is open to all — arrive a little early and you'll get to experience worship in one of the most sacred spaces in Black American history.",
  },
  {
    name: "Johnson House Historic Site",
    description: "A preserved 18th-century Germantown home that served as a documented station on the Underground Railroad, offering guided tours of hidden passages used by freedom seekers.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "6306 Germantown Ave, Philadelphia, PA 19144",
    admission_free: false, is_accessible: false, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "live_unclaimed",
  },
  {
    name: "Mural Arts Philadelphia — Germantown",
    description: "A corridor of transformative murals in the Germantown neighborhood celebrating Black history, resilience, and community pride across dozens of public walls.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Philadelphia", state: "PA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "live_unclaimed",
  },
  {
    name: "Historic Eden Cemetery",
    description: "A historic cemetery dating to 1853 where prominent African Americans, including Marian Anderson and many Civil War veterans, are buried. A testament to Black dignity and legacy.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Collingdale", state: "PA", address: "1434 Springfield Rd, Collingdale, PA 19023",
    year_established: 1853, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "live_unclaimed",
  },
  {
    name: "East Passyunk Avenue",
    description: "A vibrant South Philadelphia corridor lined with diverse diaspora-owned restaurants and shops representing the city's Italian, Vietnamese, Mexican, and Cambodian communities.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Multi-Diaspora",
    city: "Philadelphia", state: "PA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "live_unclaimed",
  },
  {
    name: "Philadelphia's 9th Street Italian Market",
    description: "America's oldest continuously operating outdoor market, now home to vendors from Mexico, Vietnam, Southeast Asia, and beyond alongside its Italian roots.",
    category: "market", heritage_category: "community_market", ethnic_community: "Multi-Diaspora",
    city: "Philadelphia", state: "PA", address: "9th Street between Christian and Wharton, Philadelphia, PA 19147",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "live_unclaimed",
    visit_tip: "Saturday mornings are when the market is at its most alive — grab breakfast from one of the Latin food stalls and walk the whole length before 11am.",
  },
  {
    name: "African American Market at FDR Park",
    description: "A vibrant outdoor market in South Philadelphia celebrating Black-owned vendors, artisans, and food entrepreneurs in a welcoming community setting.",
    category: "market", heritage_category: "community_market", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "FDR Park, Philadelphia, PA 19148",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "live_unclaimed",
    visit_tip: "Show up hungry — the food vendors here are the real stars, and the energy is pure community.",
  },
  {
    name: "Reading Terminal Market",
    description: "A beloved historic public market founded in 1892, home to Amish farmers, Pennsylvania Dutch vendors, and a rich diversity of local food cultures including Pennsylvania's African American culinary traditions.",
    category: "market", heritage_category: "historic_market", ethnic_community: "Multi-Diaspora",
    city: "Philadelphia", state: "PA", address: "51 N 12th St, Philadelphia, PA 19107",
    year_established: 1892, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "live_unclaimed",
    visit_tip: "Weekday mornings before noon hit different — the Amish vendors are fully stocked and you can actually hear yourself think.",
  },
  {
    name: "La Chinesca — Chinatown Philadelphia",
    description: "Philadelphia's Chinatown, one of the oldest in America, a vibrant hub for Chinese, Vietnamese, Cambodian, and pan-Asian communities fighting to preserve their neighborhood against development pressure.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Asian",
    city: "Philadelphia", state: "PA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "live_unclaimed",
  },
  // Businesses — Philadelphia
  {
    name: "Sisterfriend Jewelry",
    description: "A beloved Black-owned jewelry studio in West Philadelphia offering handcrafted pieces that celebrate African heritage, identity, and community artistry.",
    category: "retail", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "West Philadelphia, PA",
    pin_type: "business_retail", listing_status: "live_unclaimed",
    visit_tip: "Call ahead — studio hours are flexible and the owner loves to share the stories behind each piece.",
  },
  {
    name: "Harriett's Bookshop",
    description: "A celebrated Black-owned independent bookshop in Fishtown dedicated to books by women, women of color, and activists. A gathering place for community and cultural conversation.",
    category: "bookstore", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "258 E Girard Ave, Philadelphia, PA 19125",
    pin_type: "business_bookstore", listing_status: "live_unclaimed",
    visit_tip: "Stop in on a Saturday afternoon — there's almost always an event, author reading, or community conversation happening.",
  },
  {
    name: "Gold Standard Cafe",
    description: "A warmly decorated West Philadelphia spot known for hearty brunch dishes, inclusive vibes, and strong coffee — a neighborhood anchor in the University City corridor.",
    category: "restaurant", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "4448 Baltimore Ave, Philadelphia, PA 19143",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },
  {
    name: "South Philadelphia Barbacoa",
    description: "An acclaimed Mexican restaurant in South Philly celebrating authentic Oaxacan and barbacoa traditions, reflecting the Mexican diaspora's deep roots in the neighborhood.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Philadelphia", state: "PA", address: "1934 S 11th St, Philadelphia, PA 19148",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },
  {
    name: "Green Soul",
    description: "A Black-owned vegan soul food restaurant in North Philadelphia offering plant-based takes on Southern classics with heart and community care.",
    category: "restaurant", ethnic_community: "African American",
    city: "Philadelphia", state: "PA", address: "1410 Cecil B. Moore Ave, Philadelphia, PA 19121",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },
  {
    name: "Darna Mediterranean Kitchen",
    description: "A cozy North African and Mediterranean restaurant in South Philadelphia serving Moroccan tagines, Lebanese mezze, and North African staples in a welcoming atmosphere.",
    category: "restaurant", ethnic_community: "North African",
    city: "Philadelphia", state: "PA",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },
  {
    name: "Philly Walnut Ethiopia",
    description: "A beloved Ethiopian restaurant in West Philadelphia serving traditional injera-based dishes, offering a gathering place for the city's East African community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Philadelphia", state: "PA",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
    visit_tip: "Come with people you love — Ethiopian dining is a shared experience, and the communal platter is meant to bring you together.",
  },
  {
    name: "Hardena — Warung Hardena",
    description: "A legendary Indonesian home restaurant in South Philadelphia serving authentic Javanese cooking out of a family's living room — a true community gem.",
    category: "restaurant", ethnic_community: "Indonesian",
    city: "Philadelphia", state: "PA", address: "1754 S Hicks St, Philadelphia, PA 19145",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },
  {
    name: "Pho Saigon Café",
    description: "A Vietnamese-owned restaurant in South Philadelphia's Vietnamese corridor serving authentic pho and banh mi, a pillar of Philadelphia's vibrant Southeast Asian food scene.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Philadelphia", state: "PA",
    pin_type: "business_restaurant", listing_status: "live_unclaimed",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WASHINGTON DC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Museum of African American History and Culture",
    description: "The Smithsonian's crown jewel — the nation's largest museum dedicated to African American life, history, and culture, housing 40,000 artifacts across 12 exhibitions from slavery to the present.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1400 Constitution Ave NW, Washington, DC 20560",
    year_established: 2016, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Book timed entry passes in advance — this museum fills up fast, and you'll want at least 4 hours to do it justice.",
  },
  {
    name: "Howard University",
    description: "Founded in 1867, Howard is one of the nation's premier HBCUs, producing generations of Black leaders, doctors, lawyers, and artists. Home to the Moorland-Spingarn Research Center.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "2400 6th St NW, Washington, DC 20059",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "Walk through the yard on a weekday afternoon — the campus energy and the Founders Library steps give you a real sense of why Howard is the Mecca.",
  },
  {
    name: "Frederick Douglass National Historic Site — Cedar Hill",
    description: "The preserved Victorian home of abolitionist Frederick Douglass, offering guided tours of the grounds and house where he lived from 1877 until his death in 1895.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1411 W St SE, Washington, DC 20020",
    year_established: 1877, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Mary McLeod Bethune Council House",
    description: "The historic townhouse where educator and civil rights leader Mary McLeod Bethune lived and operated the National Council of Negro Women, now a National Historic Site.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1318 Vermont Ave NW, Washington, DC 20005",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "African American Civil War Memorial and Museum",
    description: "A museum dedicated to the 209,145 African American soldiers and sailors who served in the Civil War, featuring their service records and the Spirit of Freedom sculpture.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1925 Vermont Ave NW, Washington, DC 20001",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Anacostia Community Museum",
    description: "A Smithsonian museum in the historic Anacostia neighborhood that examines the impact of social issues on urban communities with a focus on Black and underserved populations.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1901 Fort Place SE, Washington, DC 20020",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "U Street Corridor — Black Broadway",
    description: "Historic DC's 'Black Broadway' — the vibrant cultural corridor where Duke Ellington was born and Bohemian Caverns, the Lincoln Theatre, and hundreds of Black-owned businesses once thrived.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Washington", state: "DC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Friday evenings on U Street are electric — the energy of the neighborhood comes alive with music spilling out of venues and community gathering on every corner.",
  },
  {
    name: "Lincoln Memorial",
    description: "A monumental tribute to President Lincoln and the site of Marian Anderson's 1939 concert and Dr. Martin Luther King Jr.'s 1963 'I Have a Dream' speech — sacred ground for civil rights history.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "2 Lincoln Memorial Cir NW, Washington, DC 20037",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Ben's Chili Bowl",
    description: "An iconic DC institution opened in 1958 by Ben and Virginia Ali, a gathering place for civil rights leaders and a symbol of Black entrepreneurship and community on the U Street corridor.",
    category: "restaurant", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "1213 U St NW, Washington, DC 20009",
    year_established: 1958, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order the half-smoke — it's the dish that's fed everyone from Barack Obama to neighborhood regulars for 60 years. Weekend mornings have the best energy.",
  },
  {
    name: "Busboys and Poets",
    description: "A beloved DC institution combining a progressive bookstore, restaurant, and cultural gathering space. Named for Langston Hughes, it has been a hub for activism, arts, and community dialogue since 2005.",
    category: "bookstore", ethnic_community: "African American",
    city: "Washington", state: "DC", address: "2021 14th St NW, Washington, DC 20009",
    year_established: 2005, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "Check their calendar before you come — there's almost always a spoken word event, author talk, or community discussion worth catching on evenings and weekends.",
  },
  {
    name: "Maketto",
    description: "A Southeast Asian-inspired market, cafe, and boutique in the H Street corridor celebrating Cambodian and Taiwanese culinary heritage with exceptional street food.",
    category: "restaurant", ethnic_community: "Cambodian",
    city: "Washington", state: "DC", address: "1351 H St NE, Washington, DC 20002",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Immigrant Food",
    description: "A restaurant near the White House celebrating the contributions of immigrants to American food culture, featuring dishes from across the global diaspora alongside community advocacy.",
    category: "restaurant", ethnic_community: "Multi-Diaspora",
    city: "Washington", state: "DC", address: "1701 Pennsylvania Ave NW, Washington, DC 20006",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Eastern Market",
    description: "A historic public market in Capitol Hill active since 1873, home to Black-owned vendors, African and Caribbean food stalls, local artisans, and a legendary Saturday farmers market.",
    category: "market", heritage_category: "historic_market", ethnic_community: "Multi-Diaspora",
    city: "Washington", state: "DC", address: "225 7th St SE, Washington, DC 20003",
    year_established: 1873, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday morning is peak Eastern Market — arrive by 9am to see the farmers market at full capacity before the afternoon rush.",
  },
  {
    name: "Georgia Avenue Farmers Market",
    description: "A thriving community farmers market in Petworth serving a predominantly African American and immigrant neighborhood with fresh produce, Black-owned food vendors, and cultural gatherings.",
    category: "market", heritage_category: "community_market", ethnic_community: "African American",
    city: "Washington", state: "DC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RICHMOND, VA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Black History Museum and Cultural Center of Virginia",
    description: "Virginia's premier museum documenting African American history, art, and culture from before the Civil War through the present, housed in the historic Leigh Street Armory.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "122 W Leigh St, Richmond, VA 23220",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Virginia Union University",
    description: "A historic HBCU founded in 1865 that grew from the efforts of formerly enslaved people seeking education. One of Virginia's leading centers of Black intellectual life and community leadership.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "1500 N Lombardy St, Richmond, VA 23220",
    year_established: 1865, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The Coburn Hall library is particularly worth visiting — it holds an important archive of Virginia Black history you won't find anywhere else.",
  },
  {
    name: "Jackson Ward Historic District",
    description: "Known as the 'Harlem of the South' and 'Wall Street of Black America,' Jackson Ward was the heart of Black business, banking, and culture in the early 20th century, producing icons like Maggie Walker.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Richmond", state: "VA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the neighborhood on a weekday afternoon — the storefronts, murals, and historic markers reveal layers of history at every turn.",
  },
  {
    name: "Maggie L. Walker National Historic Site",
    description: "The preserved home of Maggie L. Walker, the first Black woman to charter a bank in the United States and a towering figure in Richmond's Black business community.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "110 E Leigh St, Richmond, VA 23219",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Richmond National Battlefield Park",
    description: "Preserves Civil War battlefields with exhibits on the role of African American soldiers and the fight for freedom in Virginia's capital.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "470 Tredegar St, Richmond, VA 23219",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Elegba Folklore Society",
    description: "A non-profit organization dedicated to preserving and presenting the traditional African and African American arts, including dance, storytelling, and crafts, in the Jackson Ward neighborhood.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "101 E Broad St, Richmond, VA 23219",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Bill Bojangles Robinson Statue",
    description: "A beloved statue honoring Bill 'Bojangles' Robinson, Richmond's legendary tap dancer, located at the corner of Leigh and Adams Streets in Jackson Ward.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "Leigh St & Adams St, Richmond, VA 23220",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
  },
  {
    name: "Northside Social",
    description: "A Black-owned coffee shop and community hub in North Richmond offering specialty coffee, fresh food, and a welcoming space for the community to gather and connect.",
    category: "restaurant", ethnic_community: "African American",
    city: "Richmond", state: "VA",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Morning hours are cozy and perfect for people-watching — grab a window seat and you'll feel the neighborhood come to life.",
  },
  {
    name: "Mama J's Kitchen",
    description: "A Richmond institution serving authentic Southern soul food including fried chicken, smothered pork chops, and slow-cooked collard greens. A beloved gathering spot for families and community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Richmond", state: "VA", address: "415 N 1st St, Richmond, VA 23219",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Show up Sunday after church and you'll find Richmond's heart — this kitchen serves the kind of food that feels like a hug.",
  },
  {
    name: "Pho So 1",
    description: "A well-loved Vietnamese restaurant in Richmond's historic Carytown neighborhood offering authentic pho and Vietnamese cuisine, representing the city's growing Asian American community.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Richmond", state: "VA",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DURHAM / RALEIGH, NC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "North Carolina Central University",
    description: "Founded in 1909 by James E. Shepard, NCCU is one of the nation's premier HBCUs, producing leaders in law, education, business, and the sciences in the heart of Durham.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Durham", state: "NC", address: "1801 Fayetteville St, Durham, NC 27707",
    year_established: 1909, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The campus is gorgeous year-round — NCCU's homecoming in the fall is one of North Carolina's most spirited celebrations if you can make it.",
  },
  {
    name: "Shaw University",
    description: "Founded in 1865, Shaw is the oldest HBCU in the South, birthplace of SNCC (Student Nonviolent Coordinating Committee), and a cornerstone of the Raleigh civil rights movement.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Raleigh", state: "NC", address: "118 E South St, Raleigh, NC 27601",
    year_established: 1865, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The historic Estey Hall on campus is one of the oldest college buildings constructed for women of color in America — well worth seeing.",
  },
  {
    name: "Hayti Heritage Center",
    description: "Housed in the historic St. Joseph's AME Church (1891), the Hayti Heritage Center celebrates the legacy of Durham's Hayti neighborhood, once one of the wealthiest Black communities in America.",
    category: "cultural_center", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Durham", state: "NC", address: "804 Old Fayetteville St, Durham, NC 27701",
    year_established: 1891, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The building itself — a stunning AME church — is worth visiting even before you step inside. The film screenings on weekend evenings draw a great crowd.",
  },
  {
    name: "Pauli Murray Center",
    description: "The childhood home of Pauli Murray — lawyer, poet, activist, and Episcopal priest — who pioneered legal arguments that shaped both civil rights and women's rights law in America.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Durham", state: "NC", address: "906 Carroll St, Durham, NC 27701",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Durham Civil Rights Heritage Trail",
    description: "A self-guided trail connecting the historic sites of Durham's Black community, civil rights landmarks, and the legacy of the 1957 Royal Ice Cream Parlor sit-in, which predated national sit-in campaigns.",
    category: "heritage_district", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Durham", state: "NC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Dillard's BBQ",
    description: "A Durham institution serving classic North Carolina barbecue and soul food sides, a community gathering place for generations of families in the Hayti neighborhood.",
    category: "restaurant", ethnic_community: "African American",
    city: "Durham", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Come for lunch on a weekday — parking is easier and the pork is at its freshest right out of a morning smoke.",
  },
  {
    name: "Fullsteam Brewery",
    description: "A Durham-based craft brewery celebrating Southern ingredients and culture, a community gathering spot that champions local farmers and the Carolina food tradition.",
    category: "restaurant", ethnic_community: "African American",
    city: "Durham", state: "NC", address: "726 Rigsbee Ave, Durham, NC 27701",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Dos Perros",
    description: "A vibrant Mexican restaurant in downtown Durham celebrating authentic regional Mexican cuisine — a beloved gathering spot for Durham's growing Latino community.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Durham", state: "NC", address: "200 N Mangum St, Durham, NC 27701",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Chatham County Line Farmers Market",
    description: "A regional farmers market bringing together Black farmers, Latino growers, and diverse food producers from across North Carolina's Research Triangle.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Durham", state: "NC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
  },
  {
    name: "Durham Farmers Market",
    description: "A beloved Saturday morning tradition at Durham Central Park, featuring local Black-owned farms, African diaspora food vendors, and community artisans.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Durham", state: "NC", address: "Durham Central Park, Durham, NC 27701",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday mornings before 11am are when the stalls are fullest and the community energy is highest.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARLOTTE, NC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Johnson C. Smith University",
    description: "Founded in 1867, JCSU is Charlotte's HBCU — a historic institution providing educational opportunity for Black students through partnerships with the broader Charlotte community.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Charlotte", state: "NC", address: "100 Beatties Ford Rd, Charlotte, NC 28216",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "Campus tours are available by appointment — the historic buildings are a beautiful example of HBCU architectural legacy.",
  },
  {
    name: "Harvey B. Gantt Center for African American Arts + Culture",
    description: "Charlotte's premier African American arts and culture center, offering exhibitions, performances, and community programming celebrating Black artistic achievement.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Charlotte", state: "NC", address: "551 S Tryon St, Charlotte, NC 28202",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Levine Museum of the New South",
    description: "A museum documenting the history of the American South from Reconstruction to the present, with powerful galleries on civil rights, Jim Crow, and the region's diverse immigrant communities.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Multi-Diaspora",
    city: "Charlotte", state: "NC", address: "200 E 7th St, Charlotte, NC 28202",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Beatties Ford Road Corridor",
    description: "Historic Charlotte's Black cultural and commercial district — a corridor of Black-owned businesses, historically Black churches, and cultural landmarks stretching from uptown to northwest Charlotte.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Charlotte", state: "NC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Mecklenburg County African American Cultural Corridor",
    description: "A network of African American cultural institutions, historic churches, and heritage sites linking Charlotte's Black history from Reconstruction to the present day.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Charlotte", state: "NC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Soul Gastrolounge",
    description: "A celebrated Black-owned lounge and restaurant in Charlotte's Plaza Midwood neighborhood offering elevated soul food and cocktails in an intimate, community-centered atmosphere.",
    category: "restaurant", ethnic_community: "African American",
    city: "Charlotte", state: "NC", address: "1500 Central Ave, Charlotte, NC 28205",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Baoding Chinese Restaurant",
    description: "A beloved Charlotte institution introducing authentic Chinese regional cuisine to the city — a flagship of Charlotte's growing Asian American restaurant scene.",
    category: "restaurant", ethnic_community: "Chinese",
    city: "Charlotte", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Talita's Brazilian Kitchen",
    description: "A vibrant Brazilian restaurant in Charlotte celebrating authentic churrasco, feijoada, and Brazilian street food, serving the city's growing Brazilian diaspora community.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Charlotte", state: "NC",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Charlotte Regional Farmers Market",
    description: "One of North Carolina's largest farmers markets, home to Black-owned farms, Latino produce vendors, and diverse immigrant food entrepreneurs year-round.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Charlotte", state: "NC", address: "1801 Yorkmount Rd, Charlotte, NC 28217",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday mornings are the busiest and most vibrant — show up by 8am for the freshest picks and the warmest conversations with vendors.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMBIA, SC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Benedict College",
    description: "Founded in 1870 by Bathsheba Benedict, this historic HBCU has educated generations of South Carolina's Black leaders, serving as a center of faith, academics, and community service.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Columbia", state: "SC", address: "1600 Harden St, Columbia, SC 29204",
    year_established: 1870, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The campus chapel hosts community events throughout the year — check their calendar for open lectures and cultural programs.",
  },
  {
    name: "Allen University",
    description: "One of South Carolina's oldest HBCUs, founded in 1870 by the AME Church, producing generations of Black educators, ministers, and civic leaders in Columbia.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Columbia", state: "SC", address: "1530 Harden St, Columbia, SC 29204",
    year_established: 1870, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "Mann-Simons Site",
    description: "The historic home of Celia Mann, an enslaved woman who purchased her own freedom and established a home that became a cultural institution in Columbia's Black community for over 100 years.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Columbia", state: "SC", address: "1403 Richland St, Columbia, SC 29201",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "South Carolina State Museum",
    description: "South Carolina's largest museum, with exhibits on natural history, science, art, and a powerful history section documenting the experiences of African Americans and other minority communities in the state.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Multi-Diaspora",
    city: "Columbia", state: "SC", address: "301 Gervais St, Columbia, SC 29201",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Modjeska Monteith Simkins House",
    description: "The home of Modjeska Simkins, the 'Godmother' of the South Carolina civil rights movement, now a historic landmark and living reminder of her decades of organizing for Black justice.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Columbia", state: "SC", address: "2025 Marion St, Columbia, SC 29201",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Sekayi African Restaurant",
    description: "An authentic West African restaurant in Columbia offering Nigerian and West African dishes in a warm, community-centered setting — a gathering place for South Carolina's African diaspora.",
    category: "restaurant", ethnic_community: "West African",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Come with an open heart and an appetite — the fufu and egusi soup here will introduce you to a whole dimension of African culinary tradition.",
  },
  {
    name: "Loose Cannon Bar and Kitchen",
    description: "A Black-owned gastropub in Columbia celebrating Southern ingredients with creative flair, a community favorite for its welcoming vibe and elevated comfort food.",
    category: "restaurant", ethnic_community: "African American",
    city: "Columbia", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "La Hacienda Supermarket",
    description: "A vibrant Latino supermarket in Columbia serving the city's growing Hispanic community with authentic ingredients, fresh produce, and a beloved taqueria counter inside.",
    category: "market", ethnic_community: "Hispanic/Latino",
    city: "Columbia", state: "SC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
  },
  {
    name: "State Farmers Market",
    description: "South Carolina's largest public market, featuring Black-owned farm stands, Lowcountry produce, and a rich diversity of vendors celebrating the state's agricultural heritage.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Columbia", state: "SC", address: "3483 Charleston Hwy, West Columbia, SC 29172",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "The peak season is spring through fall — Saturday mornings draw the full community.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ATLANTA, GA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Atlanta University Center Historic District",
    description: "The world's largest consortium of HBCUs — a 110-acre historic district housing Morehouse, Spelman, Clark Atlanta, and Morehouse School of Medicine. The intellectual center of Black America.",
    category: "heritage_district", heritage_category: "hbcu_district", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "223 James P Brawley Dr SW, Atlanta, GA 30314",
    year_established: 1929, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the AUC campus on a Friday afternoon — the energy of thousands of HBCU students is unlike anything else in American education.",
  },
  {
    name: "Morehouse College",
    description: "Founded in 1867, Morehouse is the nation's only historically Black men's liberal arts college. Alma mater of Dr. Martin Luther King Jr. and a global standard for Black excellence.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "830 Westview Dr SW, Atlanta, GA 30314",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The King Chapel on campus — where Dr. King's papers are archived — is open to visitors and carries a rare spiritual weight.",
  },
  {
    name: "Spelman College",
    description: "Founded in 1881, Spelman is the nation's top HBCU and the country's premier historically Black women's liberal arts college — producing generations of transformative Black women leaders.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "350 Spelman Ln SW, Atlanta, GA 30314",
    year_established: 1881, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The Spelman Museum of Fine Art on campus hosts rotating exhibitions of African and African American art — a hidden gem worth finding.",
  },
  {
    name: "Clark Atlanta University",
    description: "Formed in 1988 from the merger of Clark College (1869) and Atlanta University (1865), Clark Atlanta carries forward a 150-year tradition of educating Black students and conducting research on the African diaspora.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "223 James P Brawley Dr SW, Atlanta, GA 30314",
    year_established: 1865, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "Morehouse School of Medicine",
    description: "One of only four HBCUs offering medical degrees, founded in 1975 to train physicians and other health professionals to meet the primary care needs of underserved communities.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "720 Westview Dr SW, Atlanta, GA 30310",
    year_established: 1975, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "Martin Luther King Jr. National Historic Site",
    description: "The birthplace and final resting place of Dr. Martin Luther King Jr., including the birth home, Ebenezer Baptist Church, and the King Center — sacred ground for the global civil rights movement.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "450 Auburn Ave NE, Atlanta, GA 30312",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Start at the visitor center to get historical context, then walk the entire Auburn Avenue corridor — Dr. King's birth home, the Ebenezer church, and the memorial pool all deserve quiet reflection.",
  },
  {
    name: "Sweet Auburn Historic District",
    description: "One of the most significant African American commercial and civic districts in the nation — 'Sweet Auburn' was designated the 'richest Negro street in the world' by Fortune magazine in 1956.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "Auburn Ave NE, Atlanta, GA 30303",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the full length of Auburn Avenue on a weekday morning — the stories embedded in every building along this corridor will change how you understand Black America.",
  },
  {
    name: "Hammonds House Museum",
    description: "Atlanta's premier museum dedicated to the visual arts of the African diaspora, housed in the 1857 Victorian home of the late Dr. Otis Thrash Hammonds, a collector of African American art.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "503 Peeples St SW, Atlanta, GA 30310",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "National Center for Civil and Human Rights",
    description: "An interactive museum connecting the American Civil Rights Movement to the ongoing global human rights movement, featuring Dr. King's papers and immersive exhibits on freedom struggles worldwide.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "100 Ivan Allen Jr Blvd NW, Atlanta, GA 30313",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The lunch counter simulation exhibit is one of the most powerful museum experiences in America — budget an extra hour just for it.",
  },
  {
    name: "Ebenezer Baptist Church",
    description: "The historic church where Dr. Martin Luther King Sr. and Jr. both preached, a cornerstone of the civil rights movement and a living congregation that continues to serve the community today.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "407 Auburn Ave NE, Atlanta, GA 30312",
    year_established: 1886, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday morning service at the new Ebenezer is open to all — attending feels like stepping directly into the living legacy of the civil rights movement.",
  },
  {
    name: "Busy Bee Cafe",
    description: "A legendary soul food institution in the Vine City neighborhood that opened in 1947 and has fed everyone from Martin Luther King Jr. to Gladys Knight. A cornerstone of Atlanta's Black cultural heritage.",
    category: "restaurant", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "810 Martin Luther King Jr Dr SW, Atlanta, GA 30314",
    year_established: 1947, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order the fried chicken and cornbread — this kitchen has been perfecting that combination for 75 years and it shows in every plate.",
  },
  {
    name: "Slutty Vegan",
    description: "A nationally recognized Atlanta-born plant-based restaurant founded by Pinky Cole that has become a symbol of Black vegan entrepreneurship and community joy, with lines out the door on weekends.",
    category: "restaurant", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "1542 Ralph D. Abernathy Blvd SW, Atlanta, GA 30310",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Weekday lunch is your best bet to skip the weekend lines — but either way, bring the energy because this spot celebrates you walking in.",
  },
  {
    name: "BrewDog DogTap Atlanta",
    description: "A community-focused taproom in the Ponce City Market area that supports local Black and minority craft brewers through collaboration events and community programming.",
    category: "restaurant", ethnic_community: "African American",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Trap Kitchen Atlanta",
    description: "A celebrated Atlanta pop-up turned restaurant offering Southern comfort food and Caribbean-inspired dishes, a Black-owned culinary experience that grew from community roots to national recognition.",
    category: "restaurant", ethnic_community: "African American",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Grindhouse Killer Burgers",
    description: "An Atlanta-born Black-owned burger chain that became a community institution, known for creative burgers with Southern flair and a commitment to hiring from the local community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Atlanta", state: "GA", address: "1842 Piedmont Ave NE, Atlanta, GA 30324",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Addis Ethiopian Restaurant",
    description: "A beloved Ethiopian restaurant in Atlanta's Decatur neighborhood offering traditional injera and wot dishes, serving both the city's substantial Ethiopian community and curious diners seeking authentic flavors.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Atlanta", state: "GA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Go with a group of four or more and order the combination platter — sharing food from one plate is how Ethiopians welcome you into their community.",
  },
  {
    name: "Ponce City Market Farmers Market",
    description: "A vibrant rooftop and ground-level farmers market at Atlanta's iconic Ponce City Market featuring Black-owned farms, immigrant food vendors, and diverse artisan producers.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Atlanta", state: "GA", address: "675 Ponce De Leon Ave NE, Atlanta, GA 30308",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday mornings on the roof during the warm months are pure Atlanta magic — great vendors, skyline views, and the best people-watching in the city.",
  },
  {
    name: "Buford Highway Farmers Market",
    description: "One of Atlanta's great multicultural food destinations along the internationally famous Buford Highway corridor, offering Latin, Asian, and global diaspora ingredients and prepared foods.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Atlanta", state: "GA", address: "5600 Buford Hwy NE, Doraville, GA 30340",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "This isn't a farmers market in the traditional sense — it's a massive international grocery experience unlike anything else in the South. Bring a cooler.",
  },
  {
    name: "Little Five Points",
    description: "Atlanta's eclectic cultural district where Black-owned boutiques, vintage shops, Ethiopian restaurants, and community art spaces create one of the most diverse neighborhoods in the city.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Multi-Diaspora",
    city: "Atlanta", state: "GA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MONTGOMERY, AL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Memorial for Peace and Justice",
    description: "The nation's first memorial dedicated to the legacy of enslaved Black people, the terror of lynching, and the ongoing struggle for racial justice — a profoundly powerful experience on a hill overlooking Montgomery.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "417 Caroline St, Montgomery, AL 36104",
    year_established: 2018, admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Visit in the morning when the light is softer and you can move through the memorial slowly — this is a place that deserves time, not rushing.",
  },
  {
    name: "The Legacy Museum",
    description: "An interactive museum by the Equal Justice Initiative sited on the site of a former slave warehouse, documenting America's history of racial terror and its ongoing legacy in the criminal justice system.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "115 Coosa St, Montgomery, AL 36104",
    year_established: 2018, admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Pair this with the Peace and Justice Memorial — they're designed as a conversation with each other, and seeing both in one day is a transformative experience.",
  },
  {
    name: "Rosa Parks Museum",
    description: "Built on the site where Rosa Parks was arrested in 1955 for refusing to give up her bus seat, this museum tells the story of the Montgomery Bus Boycott and the people who powered it.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "252 Montgomery St, Montgomery, AL 36104",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The time-machine theater experience inside is remarkable — you'll feel like you're on that bus in 1955. Budget an hour minimum for the full experience.",
  },
  {
    name: "Dexter Avenue King Memorial Baptist Church",
    description: "The historic church where Dr. Martin Luther King Jr. served as pastor from 1954 to 1960 and from which he helped organize the Montgomery Bus Boycott — a National Historic Landmark.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "454 Dexter Ave, Montgomery, AL 36104",
    year_established: 1877, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday service here is open to visitors — there are few more powerful ways to experience this history than worshipping in the room where the movement was planned.",
  },
  {
    name: "Alabama State University",
    description: "Founded in 1867, ASU is Alabama's oldest public HBCU and the first state-supported institution of higher education for Black students in the country.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "915 S Jackson St, Montgomery, AL 36104",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The Tullibody Art and Design Center on campus hosts rotating exhibitions of contemporary African American art worth seeking out.",
  },
  {
    name: "Civil Rights Memorial Center",
    description: "A memorial and museum honoring the 40 individuals killed during the civil rights movement, featuring Maya Lin's iconic black granite memorial with flowing water over the names of the martyrs.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL", address: "400 Washington Ave, Montgomery, AL 36104",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Old Ship African Methodist Episcopal Church",
    description: "One of the oldest African American churches in Montgomery, established before the Civil War, a spiritual anchor and civil rights organizing center for Montgomery's Black community.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Montgomery", state: "AL",
    year_established: 1852, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This is one of the oldest Black churches in Alabama — the congregation's roots go back to the antebellum period, and the history in those walls is extraordinary.",
  },
  {
    name: "True Kitchen + Bar",
    description: "A Black-owned farm-to-table restaurant in Montgomery's Cloverdale neighborhood offering elevated Southern cuisine with seasonal ingredients and a vibrant community atmosphere.",
    category: "restaurant", ethnic_community: "African American",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Central Alabama Farmers Market",
    description: "Montgomery's principal farmers market featuring Black-owned farm stands, fresh local produce, and a diverse array of artisan food producers serving Central Alabama.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Montgomery", state: "AL", address: "1655 Federal Dr, Montgomery, AL 36107",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday mornings are the best time to come — the stalls are fully stocked and the community energy makes this a highlight of the week.",
  },
  {
    name: "El Tapatio Mexican Restaurant",
    description: "A beloved Mexican family restaurant serving Montgomery's growing Latino community with authentic home-style Mexican cuisine — a pillar of the city's Hispanic cultural life.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Montgomery", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BIRMINGHAM, AL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Birmingham Civil Rights Institute",
    description: "A world-class civil rights museum in the historic 4th Avenue District documenting Birmingham's central role in the American Civil Rights Movement through interactive exhibits, archives, and powerful oral histories.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "520 16th St N, Birmingham, AL 35203",
    year_established: 1992, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The 'Confronting History' gallery is the most powerful section — allow yourself at least 90 minutes in the museum to absorb everything it holds.",
  },
  {
    name: "16th Street Baptist Church",
    description: "The historic church bombed by the KKK on September 15, 1963, killing four young girls — Addie Mae Collins, Cynthia Wesley, Carole Robertson, and Carol Denise McNair — a sacred civil rights landmark.",
    category: "religious_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "1530 6th Ave N, Birmingham, AL 35203",
    year_established: 1873, admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Take the guided tour — the church's history requires a guide to fully understand. The memorial garden outside is a quiet place to sit and reflect.",
  },
  {
    name: "Kelly Ingram Park",
    description: "The historic park across from 16th Street Baptist Church where civil rights demonstrators faced fire hoses and police dogs in 1963, now a sculpture garden memorializing the Birmingham movement.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "600 16th St N, Birmingham, AL 35203",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Walk the full circle of sculptures slowly — each one represents a specific moment from the 1963 campaign and they tell the story in sequence.",
  },
  {
    name: "Miles College",
    description: "A historic HBCU founded in 1898 by the Christian Methodist Episcopal Church, serving the Birmingham community through higher education and producing leaders in education, ministry, and community service.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "5500 Myron Massey Blvd, Fairfield, AL 35064",
    year_established: 1898, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "4th Avenue Historic District",
    description: "Birmingham's historic 'Black Business District' where Black entrepreneurs built a thriving commercial corridor during segregation — once home to over 300 Black-owned businesses.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Birmingham", state: "AL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The 4th Avenue Jazz District comes alive on weekend evenings — the nightlife tradition here goes back over a century.",
  },
  {
    name: "Birmingham Museum of Art — African Galleries",
    description: "One of the South's finest art museums, with a significant African art collection representing 37 countries and the artistic traditions of multiple African diasporas.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African",
    city: "Birmingham", state: "AL", address: "2000 Rev Abraham Woods Jr Blvd, Birmingham, AL 35203",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Sloss Furnaces National Historic Landmark",
    description: "A preserved 19th-century iron furnace that tells the complex history of Birmingham's industrial rise — including the labor of Black workers who built the city's steel industry under brutal conditions.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "20 32nd St N, Birmingham, AL 35222",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Hot and Hot Fish Club",
    description: "A James Beard Award-winning Birmingham restaurant celebrating local and seasonal Southern ingredients — an anchor of Birmingham's culinary renaissance that draws community around the table.",
    category: "restaurant", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "2180 11th Ct S, Birmingham, AL 35205",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Saw's Soul Kitchen",
    description: "A beloved Birmingham soul food and barbecue restaurant offering smoked meats, slow-cooked collards, and Southern sides that have made it a community institution across multiple locations.",
    category: "restaurant", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "1008 Oxmoor Rd, Homewood, AL 35209",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The smoked chicken and white BBQ sauce is the Birmingham standard — you haven't really experienced the city's food culture until you've had this.",
  },
  {
    name: "Queen's Barbecue",
    description: "A historic Birmingham barbecue joint that has been serving the Black community in the Ensley neighborhood for generations — old school pit-smoked meats at their finest.",
    category: "restaurant", ethnic_community: "African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Zambia's Place",
    description: "A Zambian-owned African restaurant in Birmingham offering authentic East and Southern African cuisine — a rare gem introducing Birmingham diners to the rich culinary traditions of Zambia and neighboring countries.",
    category: "restaurant", ethnic_community: "East African",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This is one of the few places in Alabama where you can experience authentic Southern African cuisine — the nshima and relish are the dishes to start with.",
  },
  {
    name: "Pepper Place Saturday Market",
    description: "Birmingham's premier Saturday farmers market in the historic Pepper Place complex, featuring Black-owned farms, Latino vendors, artisan food producers, and a vibrant community gathering.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Birmingham", state: "AL", address: "2829 2nd Ave S, Birmingham, AL 35233",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Spring and fall are the best seasons here — come hungry and plan to spend at least two hours moving through the stalls.",
  },
  {
    name: "Norma Jean's Restaurant",
    description: "A beloved Black-owned soul food restaurant in the historic Ensley neighborhood of Birmingham, serving traditional Southern cooking to the community for decades.",
    category: "restaurant", ethnic_community: "African American",
    city: "Birmingham", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Lunch is when this kitchen shines — the daily specials rotate and everything is made from scratch every morning.",
  },
  {
    name: "Lodestar Coffee",
    description: "A community-minded Birmingham coffee shop and gathering space that prioritizes hiring from underserved communities and serves as a connector for diverse cultural conversations.",
    category: "restaurant", ethnic_community: "African American",
    city: "Birmingham", state: "AL", address: "1125 2nd Ave N, Birmingham, AL 35203",
    pin_type: "business_coffee", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILE, AL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Bishop State Community College",
    description: "A historically Black community college in Mobile serving the educational needs of the Gulf Coast region, founded in 1927 as Alabama's first publicly supported community college for Black students.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Mobile", state: "AL", address: "351 N Broad St, Mobile, AL 36603",
    year_established: 1927, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "History Museum of Mobile",
    description: "The region's premier history museum, with significant galleries on Mobile's African American heritage, the antebellum era, and the city's unique Creole cultural identity.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Mobile", state: "AL", address: "111 S Royal St, Mobile, AL 36602",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Africatown Heritage House",
    description: "A cultural center in Mobile's Africatown neighborhood, the community founded by the last Africans brought to America on the slave ship Clotilda in 1860 — one of the most powerful heritage sites in the United States.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This is one of the most profound and unique African American heritage sites in the entire country — the descendants of the Clotilda's survivors still live in this community today.",
  },
  {
    name: "Clotilda Memorial at Magazine Point",
    description: "The memorial site near Africatown commemorating the last known slave ship to arrive in the United States — the Clotilda — and the Africans who survived it and founded their own community.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Tuskegee Airmen National Historic Site — Brookley Field Display",
    description: "A historical display at Mobile's Brookley Field commemorating the Tuskegee Airmen who trained and served during World War II, honoring Mobile's connection to the legendary Black aviators.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Old Plateau Cemetery",
    description: "The historic cemetery where many founders and descendants of Africatown are buried, including Cudjo Lewis — one of the last known survivors of the Clotilda — a sacred site of African American memory.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "First Baptist Church of Africatown",
    description: "The historic church founded by the Clotilda survivors in the Africatown community, a sacred gathering place where the descendants of the last Africans brought to America as slaves have worshipped for over 150 years.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    year_established: 1870, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This congregation traces its roots directly to the survivors of the last American slave ship — worshipping here or attending a community event is a profound connection to history.",
  },
  {
    name: "Deja Vu on Dauphin",
    description: "A popular Black-owned soul food restaurant in Mobile offering traditional Gulf Coast-influenced Southern cooking — a community gathering spot beloved by Mobile families.",
    category: "restaurant", ethnic_community: "African American",
    city: "Mobile", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Gulf shrimp and grits here reflect the unique Creole-African American culinary tradition of coastal Alabama — a combination you won't find north of the state line.",
  },
  {
    name: "Thai Palace Mobile",
    description: "A beloved Thai restaurant in Mobile serving the community with authentic flavors from Thailand, representing the city's growing Southeast Asian diaspora population.",
    category: "restaurant", ethnic_community: "Thai",
    city: "Mobile", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Senor Tequila Mexican Grill",
    description: "A vibrant Mexican restaurant in Mobile serving authentic family recipes and celebrating the culture of Mexico's diverse regions — a community hub for Mobile's Latino population.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Mobile", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BATON ROUGE, LA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Southern University and A&M College",
    description: "The largest HBCU in the world by enrollment, founded in 1880 and situated on a bluff overlooking the Mississippi River. Home to the legendary Southern University Human Jukebox marching band.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Baton Rouge", state: "LA", address: "801 Harding Blvd, Baton Rouge, LA 70813",
    year_established: 1880, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "If there's a home football game, attend — the Southern Human Jukebox halftime show is a cultural experience unlike any other in American college sports.",
  },
  {
    name: "Baton Rouge African American History Museum",
    description: "Dedicated to preserving the rich African American history of Baton Rouge and the greater Louisiana region, from the antebellum era through the civil rights movement and into the present.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Baton Rouge", state: "LA",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Port Hudson State Historic Site",
    description: "The site of the longest siege in American Civil War history, where Black Union soldiers of the First and Third Louisiana Native Guards fought valiantly in 1863 — a turning point in the use of Black troops.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Baton Rouge", state: "LA", address: "236 US-61, Port Hudson, LA 70767",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Old State Capitol Museum",
    description: "A Gothic Revival castle on the Mississippi River that tells the political history of Louisiana, including the long fight for Black suffrage and the role of Black Reconstruction legislators.",
    category: "museum", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Baton Rouge", state: "LA", address: "100 North Blvd, Baton Rouge, LA 70801",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "McKinley High School — Historic Black High School",
    description: "Baton Rouge's historic Black high school (est. 1924), a National Historic Landmark that produced generations of community leaders including civil rights icon John Lewis before he moved to Atlanta.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Baton Rouge", state: "LA",
    year_established: 1924, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "The Bullfish Bistro",
    description: "Offers some of the best Caribbean food in Baton Rouge, featuring dishes like jerk chicken, oxtails, and plantains — a beloved gathering place for the city's Caribbean community.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Baton Rouge", state: "LA", address: "4001 Nicholson Dr, Baton Rouge, LA 70808",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The oxtail here is slow-braised to perfection — come on a Friday evening when the island vibe is at its most welcoming.",
  },
  {
    name: "Dang's Vietnamese Restaurant",
    description: "A beloved local spot for authentic Vietnamese pho, banh mi, and traditional dishes — a pillar of Baton Rouge's strong Vietnamese community along Florida Boulevard.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Baton Rouge", state: "LA", address: "12385 Florida Blvd, Baton Rouge, LA 70815",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Al Shami Restaurant",
    description: "A recently opened Baton Rouge restaurant serving authentic Levantine favorites like chicken shawarma, beef tikka, grilled liver, and kibbeh — a new addition showcasing Syrian and Levantine cuisine.",
    category: "restaurant", ethnic_community: "Middle Eastern",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Yori African Restaurant",
    description: "Offers authentic West African cuisine in Baton Rouge, bringing bold flavors and traditional dishes to a city where West African culinary traditions are rarely found.",
    category: "restaurant", ethnic_community: "West African",
    city: "Baton Rouge", state: "LA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Try the fufu and groundnut soup — Yori is one of the only places in Baton Rouge where you can experience this depth of West African cooking.",
  },
  {
    name: "Mestizo Louisiana Mexican Cuisine",
    description: "A locally owned restaurant uniquely blending Mexican cuisine with Cajun-French influences — a perfect example of the cultural blending that defines Louisiana's diaspora community.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Baton Rouge", state: "LA", address: "2323 S Acadian Thruway, Baton Rouge, LA 70808",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Red Stick Farmers Market",
    description: "Baton Rouge's premier farmers market in the heart of downtown, operating Thursdays and Saturdays, featuring local farmers, Black-owned food vendors, and community artisans.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Baton Rouge", state: "LA", address: "Fifth St & Main St, Downtown Baton Rouge, LA 70801",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Thursday and Saturday mornings are when this market is most alive — pair your market visit with breakfast from one of the prepared food vendors.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW ORLEANS, LA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "New Orleans African American Museum (NOAAM)",
    description: "Located in the historic Tremé neighborhood, NOAAM preserves and presents the art, culture, and history of African Americans in New Orleans, housed in a historic villa.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "1417 Governor Nicholls St, New Orleans, LA 70116",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Morning visits on weekdays give you quiet time with the exhibits — the curator-led tours tell stories the placards alone cannot capture.",
  },
  {
    name: "Louisiana Civil Rights Museum",
    description: "Highlights Louisiana's pivotal role in the Civil Rights Movement, featuring narratives of local activists, the Canal Street sit-ins, and the desegregation of New Orleans public schools.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "900 Convention Center Blvd, New Orleans, LA 70130",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "The Backstreet Cultural Museum",
    description: "Situated in Tremé, this museum holds the world's most comprehensive collection of Mardi Gras Indian suits, second-line paraphernalia, and jazz funeral artifacts — a vital institution of New Orleans Black tradition.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "1531 St. Philip St, New Orleans, LA 70116",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "If you can time your visit with a second-line parade on Sunday afternoon, you'll see the living tradition the museum preserves — ask inside for the current schedule.",
  },
  {
    name: "Studio BE",
    description: "A 35,000 sq ft warehouse in Bywater showcasing monumental, socially conscious street art by local artist Brandan 'BMike' Odums, depicting Black resilience, civil rights leaders, and everyday heroes.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "2941 Royal St, New Orleans, LA 70117",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Come in the late afternoon when the natural light through the skylights hits the murals — it's one of the most visually powerful art experiences in the American South.",
  },
  {
    name: "Dooky Chase's Restaurant",
    description: "Opened in 1941, this iconic Creole restaurant became a crucial meeting place during the Civil Rights Movement, where MLK and local activists strategized over meals by the legendary Chef Leah Chase.",
    category: "restaurant", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "2301 Orleans Ave, New Orleans, LA 70119",
    year_established: 1941, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Lunch buffet on weekdays is the best value — you get the full Leah Chase experience with every dish on the menu. The gumbo and fried chicken are the benchmarks.",
  },
  {
    name: "Congo Square at Louis Armstrong Park",
    description: "A sacred historic gathering place where enslaved Africans and free people of color met to play traditional music and practice cultural traditions on Sundays — widely considered the birthplace of jazz.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "701 N Rampart St, New Orleans, LA 70116",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday afternoons sometimes feature community drum circles at Congo Square that carry forward the tradition of African music and gathering — check the park schedule.",
  },
  {
    name: "William Frantz Elementary School",
    description: "In 1960, this school became a focal point of the Civil Rights Movement when six-year-old Ruby Bridges, escorted by federal marshals, became the first Black student to integrate the institution.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "3811 N Galvez St, New Orleans, LA 70117",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "St. Augustine Catholic Church",
    description: "Established in 1841 in Tremé, St. Augustine is the oldest Black Catholic parish in the United States, built by free people of color and featuring the Tomb of the Unknown Slave on its grounds.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "1210 Gov. Nicholls St, New Orleans, LA 70116",
    year_established: 1841, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday mass at St. Augustine is a profound experience — this is the oldest Black Catholic parish in America, and the music alone is worth the visit.",
  },
  {
    name: "New Zion Baptist Church",
    description: "This historic New Orleans church hosted a 1957 meeting where Rev. MLK and local pastors gathered, leading to the founding of the Southern Christian Leadership Conference (SCLC).",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "2319 Third St, New Orleans, LA 70113",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Xavier University of Louisiana",
    description: "Founded in 1925, Xavier is the only historically Black and Catholic university in the United States, with a strong legacy of producing African American medical professionals and leaders.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "1 Drexel Dr, New Orleans, LA 70125",
    year_established: 1925, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The campus is beautifully maintained — the main administration building and chapel are worth seeing on any walking tour of New Orleans' HBCU heritage.",
  },
  {
    name: "Dillard University",
    description: "Louisiana's oldest HBCU, Dillard is a historic liberal arts institution with a stunning 'Avenue of the Oaks' campus that has long been a center for Black intellectual and cultural life in New Orleans.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "2601 Gentilly Blvd, New Orleans, LA 70122",
    year_established: 1869, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "Walk the iconic Avenue of the Oaks on campus — it's one of the most beautiful HBCU settings in America and the oak canopy has sheltered generations of Black scholars.",
  },
  {
    name: "Historic Tremé Neighborhood",
    description: "Recognized as the oldest African American neighborhood in the U.S., Tremé was a thriving community for free people of color and remains a cultural epicenter for jazz, brass bands, and Creole heritage.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "New Orleans", state: "LA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Sunday afternoons in Tremé are when the neighborhood's soul shows itself — second-line parades, brass bands, and the music from church windows create a soundtrack that can't be manufactured.",
  },
  {
    name: "Baldwin & Co.",
    description: "An independent bookstore and coffee shop in the Marigny named after James Baldwin, celebrating literature with a focus on Black authors and diverse voices. A modern intellectual and cultural hub.",
    category: "bookstore", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "1030 Elysian Fields Ave, New Orleans, LA 70117",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "Check their events calendar before you visit — author nights and reading groups at Baldwin happen regularly and they're the heartbeat of the bookstore experience.",
  },
  {
    name: "Heard Dat Kitchen",
    description: "A popular Central City neighborhood spot known for creative and hearty takes on classic New Orleans soul food — authentic, unpretentious, and deeply flavorful culinary innovation.",
    category: "restaurant", ethnic_community: "African American",
    city: "New Orleans", state: "LA", address: "2520 Felicity St, New Orleans, LA 70113",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "14 Parishes Jamaican Restaurant",
    description: "A family-owned Uptown restaurant offering authentic Jamaican dishes like jerk chicken, oxtails, and curried goat — a pillar of the city's Caribbean community prepared by Head Chef Charles Blake.",
    category: "restaurant", ethnic_community: "Jamaican",
    city: "New Orleans", state: "LA", address: "8227 Oak St, New Orleans, LA 70118",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The curried goat on Friday evenings hits different — this family has been bringing Jamaica to New Orleans with real love in every pot.",
  },
  {
    name: "Addis NOLA",
    description: "An award-winning, family-owned Ethiopian restaurant on historic Bayou Road offering traditional dishes served on injera, complete with traditional coffee ceremonies — a gem of New Orleans' diaspora food scene.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "New Orleans", state: "LA", address: "2514 Bayou Rd, New Orleans, LA 70119",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The traditional coffee ceremony here is unlike anything else in New Orleans — a meditative, communal experience that invites you to slow down and be present.",
  },
  {
    name: "Dong Phuong Bakery",
    description: "A legendary James Beard Award-winning Vietnamese bakery in New Orleans East known for its incredible banh mi bread, traditional Vietnamese pastries, and famous King Cakes — an absolute New Orleans institution.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "New Orleans", state: "LA", address: "14207 Chef Menteur Hwy, New Orleans, LA 70129",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Come early on weekend mornings — the freshly baked banh mi bread runs out and the line of regulars who know this secret tells you everything you need to know.",
  },
  {
    name: "Crescent City Farmers Market — Uptown",
    description: "New Orleans' beloved Uptown farmers market, held Tuesdays at The Batture, featuring local farmers, Black-owned food producers, and community vendors in a welcoming neighborhood setting.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "New Orleans", state: "LA", address: "25 Walnut St, New Orleans, LA 70118",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Tuesday mornings 8am-12pm — the Uptown neighborhood comes alive around this market and the vendors know their regulars by name.",
  },
  {
    name: "Crescent City Farmers Market — Mid-City",
    description: "The Thursday edition of New Orleans' beloved Crescent City Farmers Market, held at the Lafitte Greenway Plaza in Mid-City — a community gathering for fresh food and local culture.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "New Orleans", state: "LA", address: "500 N Norman C Francis Pkwy, New Orleans, LA 70119",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Thursday afternoons 3pm-7pm hit different with the post-work crowd — it's the most community-feeling of the three locations.",
  },
  {
    name: "Crescent City Farmers Market — City Park",
    description: "The Sunday morning edition of New Orleans' beloved Crescent City Farmers Market at Tad Gormley Stadium, perfect for a leisurely morning of fresh food and community gathering.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "New Orleans", state: "LA", address: "City Park, Tad Gormley Stadium, New Orleans, LA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Sunday 8am-12pm at City Park is the most scenic of the three market locations — combine it with a walk through the park afterward.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HOUSTON, TX
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "The African American Library at the Gregory School",
    description: "Housed in Houston's first public school for African Americans (1876), this facility serves as a premier research and cultural center preserving the history of African Americans in Houston and the African diaspora.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "1300 Victor St, Houston, TX 77019",
    year_established: 1876, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The archival collections here document Black Houston in remarkable detail — call ahead to arrange access to specific research materials.",
  },
  {
    name: "Buffalo Soldiers National Museum",
    description: "The only museum in the U.S. dedicated to the history of Black soldiers, exploring their stories and contributions from the Civil War through modern conflicts — a powerful tribute to African American military service.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "3816 Caroline St, Houston, TX 77004",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The museum's personal artifacts and letters from Buffalo Soldiers are the most moving parts of the collection — give yourself time to read them.",
  },
  {
    name: "Houston Museum of African American Culture (HMAAC)",
    description: "A cultural hub dedicated to collecting, conserving, and exhibiting the material and intellectual culture of Africans and African Americans in Houston and the Southwest.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "4807 Caroline St, Houston, TX 77004",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Freedmen's Town Historic District",
    description: "Founded just after 1865, this is the oldest African American district in Houston, originally settled by formerly enslaved people who built a thriving community with its own businesses, churches, and schools.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Houston", state: "TX",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the original brick-paved streets of Freedmen's Town — the bricks were laid by formerly enslaved people and tell a story of freedom built with bare hands.",
  },
  {
    name: "Project Row Houses",
    description: "A community-based arts and culture organization in the Third Ward that revitalized historic shotgun houses as art studios, exhibition spaces, and community resources — a model of culture-led urban revitalization.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "2521 Holman St, Houston, TX 77004",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The rotating artist residencies bring new installations each semester — check their website for exhibition openings which are free and community-centered events.",
  },
  {
    name: "Emancipation Park",
    description: "Established in 1872 when formerly enslaved African Americans pooled their resources to purchase 10 acres to celebrate Juneteenth — the oldest park in Houston and a sacred symbol of Black freedom.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "3018 Emancipation Ave, Houston, TX 77004",
    year_established: 1872, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Visit around Juneteenth if you can — this park was purchased specifically for that celebration and the tradition continues with Houston's largest annual Juneteenth event.",
  },
  {
    name: "Antioch Missionary Baptist Church",
    description: "Founded in 1866, the first African American Baptist Church in Houston. It played a pivotal role in education, civil rights activism, and community building during Reconstruction and beyond.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "500 Clay St, Houston, TX 77002",
    year_established: 1866, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday morning service at Antioch is a deeply moving experience — one of the oldest Black congregations in Texas worships in this space every week.",
  },
  {
    name: "Texas Southern University",
    description: "One of the largest HBCUs in the country, TSU has a rich history of civil rights activism — its students organized Houston's first lunch counter sit-ins in 1960, and its Ocean of Soul marching band is legendary.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "3100 Cleburne St, Houston, TX 77004",
    year_established: 1947, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The Tiger Walk and campus murals are worth seeing any time — but a football game with the Ocean of Soul performing is an unforgettable Houston experience.",
  },
  {
    name: "Eldorado Ballroom",
    description: "Built in 1939 by Black businesswoman Anna Dupree, this historic Third Ward venue hosted B.B. King, Ray Charles, and the greatest blues musicians of the 20th century — now preserved as a cultural landmark.",
    category: "historic_site", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "2310 Elgin St, Houston, TX 77004",
    year_established: 1939, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "The Greasy Spoon",
    description: "A popular Houston soul food restaurant known for its elevated comfort food including oxtails, mac and cheese, and greens — a community staple with a great story of resilience and culinary excellence.",
    category: "restaurant", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "636 Cypress Station Dr, Houston, TX 77090",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The oxtails on the weekend special sell out fast — call ahead or show up early to secure your plate.",
  },
  {
    name: "Kindred Stories",
    description: "An independent Black-owned bookstore in the historic Third Ward celebrating Black authors and creators, offering a curated selection of books and hosting community events.",
    category: "bookstore", ethnic_community: "African American",
    city: "Houston", state: "TX", address: "2304 Stuart St, Houston, TX 77004",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "The staff picks here are exceptional — ask for recommendations and you'll walk out with something that will stay with you.",
  },
  {
    name: "ChopnBlok",
    description: "A fast-casual restaurant at POST Houston offering contemporary West African cuisine including jollof rice and plantains in a modern setting — bringing the cuisine to a mainstream audience without compromise.",
    category: "restaurant", ethnic_community: "West African",
    city: "Houston", state: "TX", address: "401 Franklin St, Houston, TX 77201",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The jollof rice here is the real deal — cooked the proper Nigerian way with the signature smoky bottom. Pair it with the plantains and grilled protein.",
  },
  {
    name: "Reggae Hut",
    description: "A long-standing Third Ward spot serving classic Jamaican dishes like jerk chicken, patties, and plantains — a historic and beloved institution in Houston's Caribbean community.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Houston", state: "TX", address: "4814 Almeda Rd, Houston, TX 77004",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The jerk chicken here is cooked low and slow over wood — Friday and Saturday evenings have the most authentic island atmosphere.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SATELLITE CITIES
  // ═══════════════════════════════════════════════════════════════════════════

  // Harrisburg, PA (Satellite)
  {
    name: "A Gathering at the Crossroads Monument",
    description: "Erected in 2020 on the former site of Harrisburg's Old Eighth Ward (demolished for the Capitol), this monument honors four prominent African American activists and the community that was erased.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Harrisburg", state: "PA", address: "Irvis Equality Circle, South Lawn of PA State Capitol",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
  },
  {
    name: "Broad Street Market",
    description: "Founded in 1860, one of the oldest continuously operating farmers markets in the country — a massive hub for minority-owned food vendors, Harrisburg community gathering, and cultural connection.",
    category: "market", heritage_category: "historic_market", ethnic_community: "Multi-Diaspora",
    city: "Harrisburg", state: "PA", address: "1233 N 3rd St, Harrisburg, PA 17102",
    year_established: 1860, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday mornings are when Broad Street Market is most alive — the diversity of vendors here represents Harrisburg's entire diaspora community under one roof.",
  },
  {
    name: "Maya Angelou Butterfly Mural",
    description: "A vibrant mural inspired by Maya Angelou, symbolizing growth, transformation, and perseverance through the imagery of monarch butterflies — a beacon of hope on a Harrisburg street.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Harrisburg", state: "PA", address: "42 Hanover Rd, Harrisburg, PA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
  },
  {
    name: "Tacos Mi Tierra",
    description: "A beloved Allison Hill hidden gem serving highly authentic Mexican street tacos — al pastor and carne asada — in a community-centric, working-class environment that is the heart of Harrisburg's Latino life.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Harrisburg", state: "PA", address: "1416 Derry St, Harrisburg, PA 17104",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Show up at lunch on a weekday — the al pastor here is the real deal, carved fresh off a trompo, and the Allison Hill neighborhood energy is worth experiencing.",
  },

  // Chicopee/Springfield, MA (Satellite)
  {
    name: "Puerto Rican Cultural District — Holyoke",
    description: "Approved by the Mass Cultural Council in 2024, this newly designated district celebrates the history, art, and economic impact of the region's massive Puerto Rican community — the densest Puerto Rican enclave in the Northeast.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Puerto Rican",
    city: "Chicopee", state: "MA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Flame On Vegan",
    description: "Founded by Khesahn Reid and Nina Ortiz, a popular Chicopee spot serving incredible vegan comfort food and actively giving back to the local minority-owned business community in Western Mass.",
    category: "restaurant", ethnic_community: "African American",
    city: "Chicopee", state: "MA", address: "57 Springfield St, Chicopee, MA 01013",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The comfort food here is as soul-warming as the traditional kind — and the owners' commitment to community makes every meal feel like an act of love.",
  },
  {
    name: "Olive Tree Books and Voices",
    description: "A Black-owned Springfield bookstore focused on Black history, Black authors, and local entrepreneurs — a vital educational and cultural resource for Western Massachusetts.",
    category: "bookstore", ethnic_community: "African American",
    city: "Chicopee", state: "MA", address: "97 Hancock St, Springfield, MA 01109",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "This bookstore is a community conversation starter — the owner curates with intention and can find you exactly what you need if you tell her what you're searching for.",
  },
  {
    name: "White Lion Brewing Company",
    description: "A pioneering Black-owned craft brewery in Western Massachusetts based in Springfield, breaking the mold of traditional food businesses and showing the diversity of Black entrepreneurship.",
    category: "restaurant", ethnic_community: "African American",
    city: "Chicopee", state: "MA", address: "1477 Main St, Springfield, MA 01103",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEW YORK CITY, NY
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Museum of African American Music",
    description: "Located in Nashville, but essential to understanding New York's contribution to Black music — the Apollo Theater in Harlem is the spiritual home of this tradition in NYC.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "New York", state: "NY",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Apollo Theater",
    description: "The legendary Harlem institution that launched the careers of Ella Fitzgerald, James Brown, Michael Jackson, and countless other Black artists. The Amateur Night tradition continues to discover new talent.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "New York", state: "NY", address: "253 W 125th St, New York, NY 10027",
    year_established: 1914, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Amateur Night at the Apollo is one of the most electric audience experiences in America — the crowd participates, judges, and celebrates with an energy that has launched careers for over 80 years.",
  },
  {
    name: "Schomburg Center for Research in Black Culture",
    description: "The world's most significant research library dedicated to the documentation of the Black experience — the Schomburg holds over 11 million items in Harlem, the heart of Black America's intellectual life.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "New York", state: "NY", address: "515 Malcolm X Blvd, New York, NY 10037",
    year_established: 1925, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Schomburg's free public exhibitions are world-class — but if you're a researcher, the reading rooms hold materials that can be found nowhere else on Earth.",
  },
  {
    name: "Studio Museum in Harlem",
    description: "The leading institution devoted to artists of African descent — the Studio Museum's collection and programming have shaped global contemporary Black art since 1968.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "New York", state: "NY", address: "144 W 125th St, New York, NY 10027",
    year_established: 1968, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Harlem Cultural District",
    description: "The historic heart of Black America — Harlem's 125th Street corridor remains a vibrant center of Black culture, business, arts, and community life, home to the Apollo, Studio Museum, and Black-owned institutions.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "New York", state: "NY",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Spend a morning walking from 110th to 135th Street along Adam Clayton Powell Jr. Blvd — the history, businesses, and community energy here tell the full story of Black New York.",
  },
  {
    name: "El Museo del Barrio",
    description: "The nation's leading Latinx cultural institution in East Harlem (El Barrio), celebrating the art and culture of Puerto Rico, the Caribbean, and Latin America in New York City.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Puerto Rican",
    city: "New York", state: "NY", address: "1230 Fifth Ave, New York, NY 10029",
    year_established: 1969, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Jackson Diner",
    description: "A legendary Indian restaurant in Jackson Heights, Queens — the epicenter of South Asian culture in New York City, serving authentic subcontinental cuisine for over three decades.",
    category: "restaurant", ethnic_community: "Indian",
    city: "New York", state: "NY", address: "37-47 74th St, Jackson Heights, NY 11372",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Sylvia's Restaurant",
    description: "Harlem's legendary soul food institution, open since 1962, serving Southern cooking that has fed everyone from neighborhood regulars to presidents. The Queen of Soul Food's legacy lives on in every plate.",
    category: "restaurant", ethnic_community: "African American",
    city: "New York", state: "NY", address: "328 Lenox Ave, New York, NY 10027",
    year_established: 1962, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Sunday gospel brunch at Sylvia's is a New York institution — arrive by 10am for a table and stay for the full experience of food, music, and Harlem community.",
  },
  {
    name: "Yatenga French Bistro — Harlem",
    description: "A beloved Harlem institution blending French bistro tradition with West African and Caribbean influences — named for a kingdom in Burkina Faso, celebrating Pan-African culinary elegance.",
    category: "restaurant", ethnic_community: "West African",
    city: "New York", state: "NY",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NEWARK, NJ
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Newark Museum of Art — African Art Collection",
    description: "One of New Jersey's premier art institutions with a significant African art collection, celebrating the creative traditions of the continent and connecting Newark's diaspora community to their heritage.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African",
    city: "Newark", state: "NJ", address: "49 Washington St, Newark, NJ 07102",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Ironbound District",
    description: "Newark's vibrant Portuguese and Brazilian cultural district — a heritage neighborhood of authentic restaurants, bakeries, and cultural institutions reflecting the city's deep Lusophone community roots.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Brazilian",
    city: "Newark", state: "NJ",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Ferry Street in the Ironbound is the main artery — weekend evenings are when the Brazilian and Portuguese restaurants are at their most vibrant.",
  },
  {
    name: "New Jersey Performing Arts Center",
    description: "Newark's premier cultural institution offering world-class performances, with programming that celebrates the African American, Latinx, and immigrant communities at the heart of Newark's cultural life.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Multi-Diaspora",
    city: "Newark", state: "NJ", address: "1 Center St, Newark, NJ 07102",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Treat's Bake Shop",
    description: "A beloved Black-owned Newark bakery offering creative cakes, pastries, and desserts that have made it a community institution and a symbol of Black entrepreneurship in Essex County.",
    category: "restaurant", ethnic_community: "African American",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Mr. Taco",
    description: "A vibrant Mexican restaurant in Newark's growing Latino community serving authentic tacos, tortas, and traditional Mexican street food — a gathering place for Newark's Ironbound-adjacent Hispanic population.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Fornos of Spain",
    description: "A historic Portuguese restaurant in Newark's Ironbound neighborhood that has anchored the Portuguese-speaking community for generations, serving authentic Iberian and Brazilian cuisine.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Newark", state: "NJ", address: "47 Ferry St, Newark, NJ 07105",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Seabra's Marisqueira",
    description: "A renowned Portuguese seafood restaurant in Newark's Ironbound District, celebrating the maritime culinary traditions of Portugal and serving as a community anchor for the Lusophone diaspora.",
    category: "restaurant", ethnic_community: "Brazilian",
    city: "Newark", state: "NJ",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BALTIMORE, MD
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Morgan State University",
    description: "Founded in 1867, Morgan State is Maryland's Preeminent Public Urban Research University and one of its most historic HBCUs — producing generations of Maryland's Black professionals, educators, and community leaders.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Baltimore", state: "MD", address: "1700 E Cold Spring Ln, Baltimore, MD 21251",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The James E. Lewis Museum of Art on campus is one of Baltimore's best-kept secrets — an outstanding African American art collection in a beautiful campus setting.",
  },
  {
    name: "Frederick Douglass — Isaac Myers Maritime Park",
    description: "A living history museum on the Baltimore waterfront honoring Frederick Douglass and Isaac Myers, who organized Black caulkers and shipyard workers into the first Black trade union after the Civil War.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Baltimore", state: "MD", address: "1417 Thames St, Baltimore, MD 21231",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Reginald F. Lewis Museum of Maryland African American History",
    description: "Maryland's largest African American cultural museum, celebrating the lives and contributions of African Americans across the state's history from colonial times to the present.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Baltimore", state: "MD", address: "830 E Pratt St, Baltimore, MD 21202",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Sharp-Leadenhall Historic District",
    description: "One of Baltimore's oldest African American neighborhoods — a community built by freed Black Marylanders in the antebellum era that remains a living heritage site of Black self-determination.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Baltimore", state: "MD",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Lexington Market",
    description: "One of America's oldest public markets (est. 1782), a Baltimore institution where Black-owned food stalls, immigrant vendors, and the full diversity of the city's food culture come together under one roof.",
    category: "market", heritage_category: "historic_market", ethnic_community: "Multi-Diaspora",
    city: "Baltimore", state: "MD", address: "400 W Lexington St, Baltimore, MD 21201",
    year_established: 1782, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Weekday mornings are when the market feels most authentic — the vendors have been at their stalls for generations and the food reflects Baltimore's full cultural diversity.",
  },
  {
    name: "The Land of Kush",
    description: "A beloved vegan and vegetarian soul food restaurant in Baltimore's East Side neighborhood offering plant-based takes on Black Southern classics in a warm community atmosphere.",
    category: "restaurant", ethnic_community: "African American",
    city: "Baltimore", state: "MD", address: "840 N Eutaw St, Baltimore, MD 21201",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The vegan crab cake here is a Baltimore phenomenon — it tastes like the real thing and reflects the ingenuity of Black plant-based cooking.",
  },
  {
    name: "Ekiben",
    description: "A Baltimore-born Asian American restaurant celebrating Japanese-inspired food with local ingredients, a community institution that donates a portion of profits to social justice causes.",
    category: "restaurant", ethnic_community: "Asian American",
    city: "Baltimore", state: "MD", address: "1622 Eastern Ave, Baltimore, MD 21231",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Mi Casita",
    description: "A vibrant Mexican restaurant in Baltimore's growing Latino community, serving authentic home-style Mexican cuisine and functioning as a gathering place for the neighborhood's Hispanic population.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Baltimore", state: "MD",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // BOSTON, MA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Museum of African American History Boston",
    description: "Encompassing the African Meeting House (1806, the oldest Black church building in the U.S.) and Abiel Smith School, this museum preserves the history of the Black community in New England.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Boston", state: "MA", address: "46 Joy St, Boston, MA 02114",
    year_established: 1806, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The African Meeting House is one of the oldest Black church buildings in America — standing inside it connects you to the free Black community of 19th-century Boston.",
  },
  {
    name: "Black Heritage Trail",
    description: "A 1.6-mile walking trail on Beacon Hill linking 14 sites significant to the history of Boston's free Black community in the 19th century — the nation's largest collection of pre-Civil War African American historic structures.",
    category: "heritage_district", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Boston", state: "MA",
    admission_free: true, is_accessible: false, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The National Park Service offers free guided walking tours of the Black Heritage Trail — booking in advance is recommended for this exceptional 90-minute experience.",
  },
  {
    name: "Roxbury Neighborhood",
    description: "Boston's historic center of Black culture, activism, and community life — home to the nation's oldest Black community newspaper, historic churches, and murals celebrating Boston's African American legacy.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Boston", state: "MA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Roxbury Murals and Public Art",
    description: "A collection of powerful murals throughout Roxbury and North Dorchester celebrating Black history, resistance, and community — a living gallery of African American artistic expression on Boston's streets.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Boston", state: "MA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Walk Dudley Square and the surrounding blocks with eyes up — the murals in Roxbury tell Black Boston's story in bold color and extraordinary detail.",
  },
  {
    name: "Hola Arepa",
    description: "A beloved Venezuelan-owned restaurant in Boston celebrating authentic Venezuelan arepas and street food, bringing South American flavors and warmth to the city's diverse food scene.",
    category: "restaurant", ethnic_community: "Venezuelan",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Haley House Bakery Café",
    description: "A Black-owned Roxbury bakery and café that operates as a social enterprise, hiring from the community and serving as a gathering place for the historic South End and Roxbury neighborhoods.",
    category: "restaurant", ethnic_community: "African American",
    city: "Boston", state: "MA", address: "12 Dade St, Boston, MA 02122",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Weekday mornings are when this cafe hums with the energy of the community it serves — the food is excellent and the mission behind every purchase matters.",
  },
  {
    name: "Pho Pasteur",
    description: "A beloved Boston institution celebrating authentic Vietnamese cuisine, serving the city's substantial Vietnamese community on Chinatown's edge for decades.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Boston", state: "MA",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Haymarket",
    description: "Boston's historic outdoor produce market, operating since the 1800s, where Black vendors, immigrant produce sellers, and diverse food entrepreneurs have gathered every Friday and Saturday for generations.",
    category: "market", heritage_category: "historic_market", ethnic_community: "Multi-Diaspora",
    city: "Boston", state: "MA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Fridays and Saturdays year-round — this is the most democratic food market in Boston, where immigrant vendors sell fresh produce at prices that make quality food accessible to everyone.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HARTFORD, CT
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "North End Historic District",
    description: "Hartford's historic center of African American community life — a neighborhood of Black-owned businesses, historic churches, and cultural institutions that has anchored the city's Black community for generations.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Hartford", state: "CT",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Park Avenue and Barbour Street in the North End are the main arteries of Hartford's Black community — the independent Black businesses here have served generations of Hartford families.",
  },
  {
    name: "Frog Hollow Neighborhood",
    description: "Hartford's vibrant Puerto Rican and Latino cultural district, home to colorful murals, authentic Caribbean restaurants, and the Puerto Rican Cultural Center that anchors community life.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Puerto Rican",
    city: "Hartford", state: "CT",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Park Street in Frog Hollow is Hartford's most culturally vibrant corridor — weekend afternoons bring the full Puerto Rican and Latino community out to gather, eat, and connect.",
  },
  {
    name: "Harriet Beecher Stowe Center",
    description: "The Victorian home of the abolitionist author of Uncle Tom's Cabin, now a National Historic Landmark offering tours of the house where Stowe lived and worked for nearly two decades.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Hartford", state: "CT", address: "77 Forest St, Hartford, CT 06105",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Real Art Ways",
    description: "An independent arts organization in Hartford supporting contemporary and emerging Black and minority artists through exhibitions, performances, and community cultural programming.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Multi-Diaspora",
    city: "Hartford", state: "CT", address: "56 Arbor St, Hartford, CT 06106",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "El Mercado Hartford",
    description: "A vibrant Latino market and community hub on Park Street celebrating Puerto Rican and Caribbean food traditions, offering authentic produce, prepared foods, and a window into Frog Hollow's cultural life.",
    category: "market", ethnic_community: "Puerto Rican",
    city: "Hartford", state: "CT",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Park Street on a Saturday morning is the heart of Puerto Rican Hartford — the market, the restaurants, and the community energy make it an essential experience.",
  },
  {
    name: "Bless Your Heart Bakery",
    description: "A beloved Black-owned Hartford bakery offering Southern-inspired pastries, cakes, and comfort baked goods that have made it a community institution and gathering place.",
    category: "restaurant", ethnic_community: "African American",
    city: "Hartford", state: "CT",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Buena Vibra Group — La Paloma Sabanera",
    description: "A beloved Puerto Rican cafe in Frog Hollow that anchors the community around authentic coffee, pastries, and the vibrant cultural life of Hartford's largest diaspora neighborhood.",
    category: "restaurant", ethnic_community: "Puerto Rican",
    city: "Hartford", state: "CT",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Start your Frog Hollow exploration here — the cafe is a meeting point for community organizers and neighbors, and the café con leche is the best in Hartford.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JACKSONVILLE, FL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Ritz Theatre and Museum",
    description: "A historic cultural institution on Ashley Street documenting the history of African Americans in Northeast Florida, housed in the historic Ritz Theatre in Jacksonville's LaVilla neighborhood.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Jacksonville", state: "FL", address: "829 N Davis St, Jacksonville, FL 32202",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "LaVilla Neighborhood",
    description: "Jacksonville's historic Black cultural district — once known as the 'Harlem of the South,' LaVilla was home to jazz clubs, Black-owned businesses, and the vibrant African American social life of pre-integration Jacksonville.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Jacksonville", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Edwin W. Brown Memorial",
    description: "A tribute to the legacy of civil rights leadership in Jacksonville, commemorating the local activists and community leaders who challenged segregation in Northeast Florida.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Jacksonville", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "The Melanin Market Jacksonville",
    description: "A curated marketplace celebrating Black and Brown entrepreneurs in Jacksonville, featuring pop-up vendors, artisans, and small business owners from Northeast Florida's minority community.",
    category: "market", ethnic_community: "African American",
    city: "Jacksonville", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Check their social media for market dates — these pop-up events draw Jacksonville's most creative Black entrepreneurs and the energy is incredible.",
  },
  {
    name: "Sauté Cuisine",
    description: "A celebrated Black-owned restaurant in Jacksonville offering refined Caribbean-Southern fusion cuisine, elevating traditional flavors with culinary artistry and community warmth.",
    category: "restaurant", ethnic_community: "African American",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "BB's Restaurant and Bar",
    description: "A popular Black-owned Jacksonville gathering spot offering elevated American comfort food and craft cocktails in a vibrant, welcoming atmosphere for the local community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Vietnam Garden",
    description: "A beloved Vietnamese restaurant in Jacksonville serving the city's growing Vietnamese community with authentic pho, banh mi, and traditional dishes in a welcoming family setting.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Jacksonville", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MIAMI, FL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Overtown Historic District",
    description: "Miami's historic 'Colored Town' — Overtown was a thriving self-contained Black community that hosted Nat King Cole, Billie Holiday, and Louis Armstrong (who couldn't stay on Miami Beach during segregation).",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Miami", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The history of Overtown is the history of Jim Crow Miami — walking these streets with a guide connects you to a community that created something extraordinary under impossible conditions.",
  },
  {
    name: "Little Haiti Cultural Complex",
    description: "The cultural center of Miami's Haitian community in the Little Haiti neighborhood, offering visual arts, performing arts, and community programming celebrating Caribbean Haitian culture.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Haitian",
    city: "Miami", state: "FL", address: "212 NE 59th Terrace, Miami, FL 33137",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Haitian community in Little Haiti has built remarkable cultural institutions — explore the neighborhood beyond the complex itself for murals, markets, and gathering spaces.",
  },
  {
    name: "Little Havana",
    description: "Miami's iconic Cuban neighborhood — a living tapestry of Cuban culture, history, and community life along Calle Ocho (SW 8th Street), where dominoes, cafecito, and Cuban cigars define the rhythms of daily life.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Cuban",
    city: "Miami", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Stop at Domino Park on SW 8th Street on a Saturday afternoon — watching the elders play dominoes while sipping Cuban coffee is as authentic a Miami experience as you can find.",
  },
  {
    name: "Tap Tap Haitian Restaurant",
    description: "A beloved Haitian restaurant in South Beach celebrating authentic Haitian cuisine and vibrant Haitian art — a colorful cultural hub serving as an ambassador for Haitian culture to Miami's diverse visitors.",
    category: "restaurant", ethnic_community: "Haitian",
    city: "Miami", state: "FL", address: "819 5th St, Miami Beach, FL 33139",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The griot — fried pork with pikliz — is the signature dish of Haitian cuisine and this is one of the best versions in Miami. Come hungry.",
  },
  {
    name: "Versailles Restaurant",
    description: "The legendary Cuban exile institution in Little Havana — open since 1971, Versailles is where Cuban Miami celebrates milestones, mourns losses, and debates politics over café cubano and ropa vieja.",
    category: "restaurant", ethnic_community: "Cuban",
    city: "Miami", state: "FL", address: "3555 SW 8th St, Miami, FL 33135",
    year_established: 1971, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order at the ventanita (window) for the full experience — standing on SW 8th Street with a shot of Cuban coffee while Miami life flows around you is quintessential Little Havana.",
  },
  {
    name: "Jackson Soul Food",
    description: "A historic Miami institution serving authentic Southern soul food in Overtown, one of the few remaining Black-owned restaurants preserving the culinary traditions of Miami's historic Black neighborhood.",
    category: "restaurant", ethnic_community: "African American",
    city: "Miami", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This is one of the last authentic soul food institutions in Overtown — eating here is an act of community support for one of Miami's most historically significant Black neighborhoods.",
  },
  {
    name: "Kimberly's Korner",
    description: "A Black-owned Opa-locka restaurant serving authentic Caribbean and American comfort food, a gathering spot for a neighborhood that has long been a center of Miami-Dade's African American community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Miami", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Coyo Taco — Wynwood",
    description: "A vibrant Mexican restaurant in Miami's Wynwood Arts District celebrating authentic Mexican street food alongside the neighborhood's rich Latino cultural scene and world-famous murals.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Miami", state: "FL", address: "2300 NW 2nd Ave, Miami, FL 33127",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Wynwood Walls",
    description: "Miami's outdoor museum of international street art in Wynwood, featuring dozens of large-scale murals by diverse artists including many from Black and Latino backgrounds — a global celebration of cultural expression.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Multi-Diaspora",
    city: "Miami", state: "FL", address: "2520 NW 2nd Ave, Miami, FL 33127",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ORLANDO, FL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Wells' Built Museum of African American History",
    description: "Housed in the historic Wells' Built Hotel (1921) where Black entertainers stayed during segregation, this Orlando museum preserves the city's African American legacy and the Church Street Historic District.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Orlando", state: "FL", address: "511 W South St, Orlando, FL 32805",
    year_established: 1921, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Parramore Heritage District",
    description: "Orlando's historic African American neighborhood, the cultural heart of the city's Black community, home to historic churches, community organizations, and the legacy of Orlando's civil rights struggle.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Orlando", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Mills 50 District — Little Vietnam",
    description: "Orlando's vibrant Vietnamese and Southeast Asian cultural district along Mills Avenue and Colonial Drive, home to dozens of authentic restaurants, markets, and the cultural center of Orlando's Vietnamese community.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Vietnamese",
    city: "Orlando", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The restaurants in the Mills 50 District are open late — dinner on a Friday or Saturday night here is when the Vietnamese community gathers and the food is at its most vibrant.",
  },
  {
    name: "Hunger Street Tacos",
    description: "A popular Latino-owned taco shop in Orlando celebrating authentic Mexican street food with locally sourced ingredients — a community institution for Orlando's growing Hispanic population.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Pig Floyd's Urban Barbakoa",
    description: "An Orlando BBQ institution celebrating the African American and Latin American barbecue traditions — a beloved gathering spot serving smoked meats with global inspiration and local community pride.",
    category: "restaurant", ethnic_community: "African American",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Little Puerto Rico Restaurant",
    description: "An authentic Puerto Rican restaurant in Orlando celebrating the traditional foods and flavors of the island — a welcoming cultural hub for Central Florida's substantial Puerto Rican community.",
    category: "restaurant", ethnic_community: "Puerto Rican",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The mofongo here is the standard by which to judge all others in Central Florida — the Puerto Rican community comes here for the authentic taste of home.",
  },
  {
    name: "Keke's Breakfast Café",
    description: "A Black-owned Orlando brunch institution known for creative breakfast dishes and a commitment to community — one of the city's most beloved morning gathering spots.",
    category: "restaurant", ethnic_community: "African American",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Pho Vinh Loi",
    description: "A beloved Vietnamese restaurant in Orlando's Mills 50 District serving authentic pho and Vietnamese classics — an institution for the local Vietnamese community and pho enthusiasts across Central Florida.",
    category: "restaurant", ethnic_community: "Vietnamese",
    city: "Orlando", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "East End Market",
    description: "A curated indoor market in Orlando's Audubon Park neighborhood celebrating local farmers, minority-owned food producers, and culinary innovators from across Central Florida's diverse diaspora.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Orlando", state: "FL", address: "3201 Corrine Dr, Orlando, FL 32803",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Weekend mornings are when this market shines — it's a beautifully curated space where you can find products from across Orlando's entire diaspora food community.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVANNAH, GA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Beach Institute African American Cultural Center",
    description: "One of the first schools for formerly enslaved people in Georgia, now a museum celebrating the art and history of African Americans in Savannah, home to an important collection of the work of folk artist Ulysses Davis.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "502 E Harris St, Savannah, GA 31401",
    year_established: 1867, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Ulysses Davis collection inside is a revelation — 200 sculptures carved by a Savannah barber who spent 40 years creating an astonishing body of work in near-total obscurity.",
  },
  {
    name: "First African Baptist Church",
    description: "Established in 1773, this is the oldest continuously operating Black church in North America — originally organized by enslaved and free Black people, with diamonds cut in the floor serving as ventilation for the Underground Railroad below.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "23 Montgomery St, Savannah, GA 31401",
    year_established: 1773, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The guided tour of the sanctuary includes the story of the diamond patterns carved in the floor — an Underground Railroad hiding place beneath the oldest Black church in America.",
  },
  {
    name: "Gullah Geechee Cultural Heritage Corridor",
    description: "A national heritage area celebrating the unique culture of the Gullah Geechee people — descendants of West and Central African slaves who preserved their language, foodways, and traditions on the Sea Islands.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Gullah Geechee",
    city: "Savannah", state: "GA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The Gullah Geechee culture is one of the most distinctive African American cultural traditions in the country — the language, cooking, and crafts here connect directly to West Africa.",
  },
  {
    name: "Vic's on the River",
    description: "A beloved Savannah restaurant celebrating Lowcountry Southern cuisine with regional seafood and slow-cooked classics, offering a gathering place for Savannah's community around the table.",
    category: "restaurant", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "26 E Bay St, Savannah, GA 31401",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "The Olde Pink House",
    description: "A historic Savannah dining institution in an 18th-century Georgian mansion, celebrating Lowcountry culinary traditions and the complex cultural heritage of coastal Georgia.",
    category: "restaurant", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "23 Abercorn St, Savannah, GA 31401",
    year_established: 1771, pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Treylor Park",
    description: "A Black-owned Savannah restaurant celebrating Southern comfort food with a creative, community-centered spirit — a gathering spot for Savannah's diverse community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "115 E Bay St, Savannah, GA 31401",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Savannah State University",
    description: "Founded in 1890, Savannah State University is Georgia's oldest public HBCU, producing generations of Georgia's Black educators, scientists, and community leaders.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Savannah", state: "GA", address: "3219 College St, Savannah, GA 31404",
    year_established: 1890, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
  },
  {
    name: "Forsyth Farmers Market",
    description: "Savannah's beloved Saturday farmers market in historic Forsyth Park, featuring Black-owned farm stands, Gullah Geechee food producers, and the full diversity of Savannah's culinary heritage.",
    category: "market", ethnic_community: "Multi-Diaspora",
    city: "Savannah", state: "GA", address: "Forsyth Park, Savannah, GA 31401",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Saturday morning in Forsyth Park is the most beautiful farmers market setting in the South — under the Spanish moss and ancient oaks, with Savannah's whole community gathering together.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NASHVILLE, TN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Museum of African American Music",
    description: "The only museum dedicated to the many music genres created, influenced, and innovated by African Americans — a 56,000 square foot experience tracing the journey from West Africa to contemporary music.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Nashville", state: "TN", address: "501 Broadway, Nashville, TN 37203",
    year_established: 2021, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The immersive experiences here — recording in a simulated studio, experiencing a digital church choir — put you inside Black music history in a way no other museum does.",
  },
  {
    name: "Fisk University",
    description: "A historically Black university founded in 1866, Fisk's Jubilee Hall is a National Historic Landmark and the Fisk Jubilee Singers have performed for royalty worldwide, preserving the tradition of Negro spirituals since 1871.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Nashville", state: "TN", address: "1000 17th Ave N, Nashville, TN 37208",
    year_established: 1866, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The Carl Van Vechten Gallery on campus houses the Alfred Stieglitz Collection of American Art — works by Georgia O'Keeffe and other masters donated to Fisk in 1949.",
  },
  {
    name: "Jefferson Street Historic Corridor",
    description: "Nashville's historic Black business and entertainment district, once home to jazz clubs and the 'Black Broadway' before the I-40 interstate was built through the community, displacing thousands of residents.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Nashville", state: "TN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The story of Jefferson Street is the story of how highway construction destroyed Black communities across America — walking these blocks with knowledge of that history is transformative.",
  },
  {
    name: "Plaza Mariachi",
    description: "A vibrant cultural hub in South Nashville featuring diverse Latin American food vendors, live mariachi music, dancing, and artisan shops that recreate the atmosphere of a Mexican marketplace — the heart of Nashville's Hispanic community.",
    category: "market", ethnic_community: "Hispanic/Latino",
    city: "Nashville", state: "TN", address: "3955 Nolensville Pike, Nashville, TN 37211",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Weekend evenings at Plaza Mariachi are pure magic — live music, the smell of food from across Latin America, and the full Nashville Latino community gathered in celebration.",
  },
  {
    name: "Edessa Restaurant Nashville",
    description: "A highly-rated dining spot in South Nashville's Little Kurdistan offering authentic Kurdish and Turkish cuisine, named after the ancient Kurdish city — a warm cultural gathering place for Nashville's large Kurdish community.",
    category: "restaurant", ethnic_community: "Kurdish",
    city: "Nashville", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The kebab platters and warm bread here are extraordinary — this is one of the most authentic Kurdish restaurants in the American South, and the hospitality reflects it.",
  },
  {
    name: "Horn Coffee",
    description: "A family-owned coffee shop in The Nations neighborhood serving traditional Somali chai, sambusas, and specialty coffee in a culturally rich environment — bringing Somali coffee culture to Nashville.",
    category: "restaurant", ethnic_community: "Somali",
    city: "Nashville", state: "TN",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "The Somali chai and sambusa combination here is the warm welcome of East African hospitality in every cup — come on a weekday morning when it's quietest.",
  },
  {
    name: "Awash Ethiopian Restaurant Nashville",
    description: "A beloved local eatery in South Nashville's Nolensville Pike corridor offering traditional Ethiopian dishes served on injera — an authentic taste of East Africa in Nashville's international food corridor.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Nashville", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Nolensville Pike is Nashville's international food mile — Awash anchors the East African section and the communal platter experience makes it a perfect introduction to Ethiopian cuisine.",
  },
  {
    name: "The Local Distro",
    description: "A community-focused grocery store and eatery in Nashville's Salemtown neighborhood that provides fresh food options and highlights local minority-owned products, addressing food access while creating economic opportunities.",
    category: "market", ethnic_community: "African American",
    city: "Nashville", state: "TN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "This store is exactly what food justice looks like in practice — fresh food, minority producers, and a community-owned model that keeps dollars circulating locally.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MEMPHIS, TN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Civil Rights Museum at the Lorraine Motel",
    description: "Built around the site of Dr. Martin Luther King Jr.'s assassination, this comprehensive museum chronicles the American Civil Rights Movement from slavery to the present — one of the most important sites in America.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Memphis", state: "TN", address: "450 Mulberry St, Memphis, TN 38103",
    year_established: 1991, admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Budget at least 3 hours for this museum — the preserved Room 306 and balcony are profound, and the exhibits take you through the full arc of the movement with care and depth.",
  },
  {
    name: "Historic Beale Street",
    description: "Known as the 'Home of the Blues,' Beale Street was a thriving hub for Black businesses, musicians, and culture. B.B. King, Muddy Waters, and Memphis Minnie performed here before it became a tourist destination.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Memphis", state: "TN", address: "Beale St, Memphis, TN 38103",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk Beale Street in the late afternoon before the evening crowds arrive — the historical markers and music venues tell the real story before the tourist activity takes over.",
  },
  {
    name: "Stax Museum of American Soul Music",
    description: "Located at the original Stax Records site, this museum celebrates the legendary artists who created Memphis soul — one of the first racially integrated businesses in Memphis during the height of segregation.",
    category: "museum", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Memphis", state: "TN", address: "926 E McLemore Ave, Memphis, TN 38106",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The replica of Studio A where Otis Redding and Isaac Hayes recorded is the emotional centerpiece — you can feel the music that was made in this room over 50 years ago.",
  },
  {
    name: "Orange Mound Neighborhood",
    description: "Established in the 1890s, this is the first neighborhood in the U.S. built specifically by and for African Americans — a historic symbol of Black self-determination where homes were designed by Black craftsmen for Black families.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Memphis", state: "TN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "LeMoyne-Owen College",
    description: "An HBCU founded in 1862, originally established to educate freedmen and runaway slaves after the Civil War — one of the oldest HBCUs in the country and a cornerstone of Black Memphis.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Memphis", state: "TN", address: "807 Walker Ave, Memphis, TN 38126",
    year_established: 1862, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "LeMoyne-Owen is the oldest HBCU west of the Appalachians — the campus holds 160 years of Black educational history in Memphis.",
  },
  {
    name: "Clayborn Temple",
    description: "A historic church that served as the organizing headquarters for the 1968 Memphis sanitation strike and the distribution point for the iconic 'I Am A Man' signs — one of the most significant civil rights sites in the country.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Memphis", state: "TN", address: "294 Hernando St, Memphis, TN 38126",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This is where sanitation workers gathered every morning before marching with their 'I Am A Man' signs — standing in this sanctuary connects you to one of the most powerful labor and civil rights stories in American history.",
  },
  {
    name: "CxffeeBlack Anti Gentrification Coffee Club",
    description: "A community-focused coffee shop dedicated to reclaiming the Black history of coffee and fighting gentrification in Memphis — using specialty coffee as a tool for education and anti-displacement activism.",
    category: "restaurant", ethnic_community: "African American",
    city: "Memphis", state: "TN",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "This isn't just coffee — it's a philosophy. The founders can trace coffee's origins to Ethiopia and explain why the specialty coffee industry belongs to Black culture. Ask them to tell the story.",
  },
  {
    name: "El Mercadito de Memphis",
    description: "A bustling Mexican-owned market in Hickory Ridge housing over a dozen Latino businesses, including food stalls, a salon, and event spaces — representing the collective entrepreneurial spirit of Memphis's Latino community.",
    category: "market", ethnic_community: "Mexican",
    city: "Memphis", state: "TN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "This market is a self-contained Latino ecosystem — you can eat, shop, get your hair done, and celebrate all in one place. Weekend afternoons have the most energy.",
  },
  {
    name: "Sheger Ethiopian Restaurant and Grocery",
    description: "A premier destination in East Memphis for authentic Ethiopian cuisine and imported groceries — serving both prepared food and the ingredients needed to cook traditional dishes at home.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Memphis", state: "TN",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHICAGO, IL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "DuSable Black History Museum and Education Center",
    description: "The nation's oldest independent African American museum, founded in 1961 by Dr. Margaret Burroughs, named after the Haitian-born founder of Chicago — housing 40,000 works spanning African and African American history.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Chicago", state: "IL", address: "740 E 56th Pl, Chicago, IL 60637",
    year_established: 1961, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The permanent collection galleries on African American history from slavery to the present are comprehensive and deeply moving — give yourself at least 2 hours.",
  },
  {
    name: "Monument to the Great Northern Migration",
    description: "A bronze sculpture by Alison Saar honoring the thousands of African Americans who migrated to Chicago seeking freedom and opportunity — a towering figure on MLK Drive in the heart of Bronzeville.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Chicago", state: "IL", address: "2800 S Martin Luther King Dr, Chicago, IL 60616",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
  },
  {
    name: "National Museum of Mexican Art",
    description: "Located in Pilsen, this is the largest Latino cultural institution in the country, housing over 10,000 works spanning 3,000 years of Mexican artistic production — with free admission ensuring community accessibility.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Mexican",
    city: "Chicago", state: "IL", address: "1852 W 19th St, Chicago, IL 60608",
    year_established: 1987, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Día de los Muertos installations in October-November are extraordinary — but this museum is worth visiting any time of year. Free admission makes it accessible to everyone.",
  },
  {
    name: "Bronzeville Neighborhood",
    description: "The 'Black Metropolis' — Bronzeville was the cultural capital of Black America during the Great Migration, producing Ida B. Wells, Gwendolyn Brooks, and a generation of Black intellectuals who shaped the 20th century.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Chicago", state: "IL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the Bronzeville Walk of Fame along Martin Luther King Drive — the plaques honor dozens of Black luminaries who made this neighborhood the cultural capital of Black America.",
  },
  {
    name: "Pilsen Neighborhood — 16th Street Murals",
    description: "A vibrant corridor of dozens of Chicano murals in Pilsen expressing the history, struggles, and cultural identity of the Mexican-American community — one of the most significant collections of Chicano public art in the country.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Mexican",
    city: "Chicago", state: "IL", address: "16th St between Halsted and Western Ave, Chicago, IL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Walk the full length of 16th Street on a Saturday afternoon — the murals build on each other telling a continuous story of Mexican American identity, and the community life around them is equally beautiful.",
  },
  {
    name: "South Side Community Art Center",
    description: "The oldest African American art center in the U.S., established during the Chicago Black Renaissance in 1940 — a gallery, studio, and gathering place that has nurtured generations of Black artists for over 80 years.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Chicago", state: "IL", address: "3831 S Michigan Ave, Chicago, IL 60653",
    year_established: 1940, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Opening night events for new exhibitions here draw Chicago's Black arts community in a way that feels like the Chicago Black Renaissance is still alive — check their calendar.",
  },
  {
    name: "Virtue Restaurant and Bar",
    description: "An award-winning Southern restaurant in Hyde Park by Chef Erick Williams honoring the culinary traditions of the Black diaspora, bringing fine dining warmth and cultural authenticity to Chicago's South Side.",
    category: "restaurant", ethnic_community: "African American",
    city: "Chicago", state: "IL", address: "1462 E 53rd St, Chicago, IL 60615",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Chef Williams' take on Southern cooking is both technically brilliant and deeply soulful — this is fine dining that makes you feel at home, a combination that only the best Black chefs can achieve.",
  },
  {
    name: "Bronzeville Winery",
    description: "A sophisticated dining destination in Bronzeville celebrating Black culture and entrepreneurship — bringing fine dining and a curated wine program to a historically significant Black neighborhood.",
    category: "restaurant", ethnic_community: "African American",
    city: "Chicago", state: "IL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "5 Rabanitos",
    description: "A popular Pilsen spot offering authentic Mexican cuisine, deeply rooted in the local Mexican-American community — celebrating traditional dishes in the heart of Chicago's Mexican cultural district.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Chicago", state: "IL", address: "1758 W 18th St, Chicago, IL 60608",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Come at lunch on a weekday — the daily specials are the best value and the Pilsen neighborhood energy around this restaurant is as much a part of the experience as the food.",
  },
  {
    name: "Demera Ethiopian Restaurant",
    description: "A beloved community staple in Uptown serving authentic Ethiopian cuisine — a gathering place for Chicago's Ethiopian community and an excellent introduction to East African communal dining.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Chicago", state: "IL", address: "4801 N Broadway, Chicago, IL 60640",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The combination platter for two or more people is the best way to experience the breadth of Ethiopian cooking — order the vegetarian platter alongside a meat option for the full range.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DETROIT, MI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Charles H. Wright Museum of African American History",
    description: "One of the world's largest permanent exhibits on African American culture — 'And Still We Rise' takes visitors on a journey from Africa through the Middle Passage, slavery, emancipation, and into the modern era.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Detroit", state: "MI", address: "315 E Warren Ave, Detroit, MI 48201",
    year_established: 1965, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Middle Passage exhibit is the most powerful room in any museum dedicated to African American history — allow yourself time to be still with what you encounter there.",
  },
  {
    name: "Motown Museum — Hitsville U.S.A.",
    description: "The historic recording studio where Berry Gordy founded Motown Records — launching Stevie Wonder, The Supremes, Marvin Gaye, and dozens of other legends from this modest house on Grand Boulevard.",
    category: "museum", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Detroit", state: "MI", address: "2648 W Grand Blvd, Detroit, MI 48208",
    year_established: 1959, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The guided tour includes Studio A with its original equipment — standing in the room where 'My Girl' and 'Ain't No Mountain High Enough' were recorded is a genuinely moving experience.",
  },
  {
    name: "Arab American National Museum",
    description: "The first and only museum in the U.S. devoted to Arab American history and culture, located in Dearborn — home to the largest concentration of Arab Americans in the country.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Arab American",
    city: "Dearborn", state: "MI", address: "13624 Michigan Ave, Dearborn, MI 48126",
    year_established: 2005, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The 'Living in America' gallery documents Arab American life across the full breadth of the community — from Yemeni workers to Lebanese entrepreneurs — in a way mainstream media never shows.",
  },
  {
    name: "The Heidelberg Project",
    description: "An outdoor art environment by Tyree Guyton transforming a Detroit neighborhood into a vibrant canvas using paint, found objects, and sculptural installations — an internationally recognized symbol of art as resistance.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Detroit", state: "MI", address: "3600 Heidelberg St, Detroit, MI 48207",
    year_established: 1986, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Walk slowly through the Heidelberg Project and let the installations speak — each piece comments on specific aspects of urban poverty, racial injustice, and community neglect, and there is always something new to discover.",
  },
  {
    name: "Mexicantown — Bagley Street",
    description: "Detroit's vibrant Latino cultural district, home to colorful murals, generations-old bakeries, and authentic Mexican restaurants celebrating over a century of Mexican-American community life on the Southwest side.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Mexican",
    city: "Detroit", state: "MI", address: "Bagley St, Detroit, MI 48216",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Weekend mornings on Bagley Street when the bakeries and tortillerias open are the most authentic times to experience Mexicantown — the smells alone tell the neighborhood's story.",
  },
  {
    name: "Baobab Fare",
    description: "An award-winning restaurant in Detroit's New Center offering authentic Burundian cuisine — founded by Hamissi Mamba and Nadia Nijimbere, refugees who rebuilt their lives and became one of Detroit's most celebrated restaurateurs.",
    category: "restaurant", ethnic_community: "East African",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The story of this restaurant — Burundian refugees who became celebrated Detroit chefs — is as nourishing as the food. Ask about the dishes if the owners are around.",
  },
  {
    name: "Shatila Bakery",
    description: "A legendary Dearborn bakery known nationwide for its authentic baklava, knafeh, and Middle Eastern pastries — founded by a Lebanese immigrant family and grown into a nationally recognized symbol of Arab American culinary excellence.",
    category: "restaurant", ethnic_community: "Lebanese",
    city: "Dearborn", state: "MI", address: "14300 W Warren Ave, Dearborn, MI 48126",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The knafeh here — warm, stretchy, drenched in syrup — is one of the most transcendent pastry experiences in the Midwest. Come on a weekend when it's made fresh.",
  },
  {
    name: "Good Cakes and Bakes",
    description: "A community-focused Detroit bakery on the Avenue of Fashion offering organic, vegan, and traditional baked goods with a commitment to positive social impact and neighborhood revitalization.",
    category: "restaurant", ethnic_community: "African American",
    city: "Detroit", state: "MI",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CLEVELAND, OH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "African American Cultural Garden",
    description: "A dedicated space within Cleveland's Cultural Gardens using sculpture, architecture, and landscape design to tell the story of the Black experience in America — one of 33 cultural gardens representing different ethnic groups.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Cleveland", state: "OH", address: "1051 Martin Luther King Jr Dr, Cleveland, OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Walk through all 33 cultural gardens if you have time — the African American garden is most powerful when experienced in the context of the global diaspora gardens surrounding it.",
  },
  {
    name: "Karamu House",
    description: "The oldest producing African American theater in the United States, founded in 1915 — 'a place of joyful gathering' in Swahili, where Langston Hughes premiered several plays and generations of Black artists found their voice.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Cleveland", state: "OH", address: "2355 E 89th St, Cleveland, OH",
    year_established: 1915, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "A Karamu House performance is a pilgrimage for Black theater lovers — the 100-year tradition of Black performing arts in this building is palpable the moment you enter.",
  },
  {
    name: "Clark-Fulton Neighborhood",
    description: "The epicenter of Cleveland's Hispanic and Latino community, boasting the highest concentration of Hispanic residents in Ohio — home to the annual Puerto Rican Parade and a vibrant corridor of Latin restaurants and markets.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Puerto Rican",
    city: "Cleveland", state: "OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The annual Puerto Rican Parade here is the largest cultural celebration in Northeast Ohio — but any weekend the neighborhood's murals, markets, and restaurants make it a vibrant destination.",
  },
  {
    name: "Station Hope at St. John's Episcopal Church",
    description: "Cleveland's oldest consecrated building and a verified stop on the Underground Railroad — now the site of an annual multi-arts event celebrating freedom and social justice, connecting the present to its freedom-fighting past.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Cleveland", state: "OH", address: "2600 Church Ave, Cleveland, OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "ThirdSpace Reading Room",
    description: "A Black-owned independent bookstore and reading room in Glenville focused on Black literature and community education — creating dedicated space for intellectual engagement centered on Black experiences.",
    category: "bookstore", ethnic_community: "African American",
    city: "Cleveland", state: "OH",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "The reading room format here is intentional — come for a few hours, sink into a chair, and immerse yourself in the collection curated specifically for Black intellectual life.",
  },
  {
    name: "Zoma Ethiopian Restaurant",
    description: "One of the few authentic Ethiopian restaurants in Cleveland Heights offering traditional injera and wot dishes for both vegans and meat lovers — a cultural bridge and community gathering place.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Cleveland", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "CentroVilla25",
    description: "A newly developed Latino market and cultural hub in Cleveland's Clark-Fulton neighborhood providing low-cost commercial space for local Hispanic entrepreneurs and food vendors — an incubator for Latino business.",
    category: "market", ethnic_community: "Hispanic/Latino",
    city: "Cleveland", state: "OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "This market was built by the community for the community — the vendors here are local Latino entrepreneurs getting their start, and your support matters directly.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ST. LOUIS, MO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "The Griot Museum of Black History",
    description: "The first museum in the country solely dedicated to the broad scope of Black history in the Midwest, featuring life-size wax figures of prominent African Americans from Dred Scott to Madam C.J. Walker.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "St. Louis", state: "MO", address: "2505 St Louis Ave, St. Louis, MO 63106",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The life-size wax figures here are remarkably detailed — standing face to face with Dred Scott or Ida B. Wells creates an intimate connection to history that photographs cannot replicate.",
  },
  {
    name: "Mary Meachum Freedom Crossing",
    description: "Missouri's first nationally recognized Underground Railroad site, where free Black woman Mary Meachum helped enslaved people escape across the Mississippi River to Illinois in 1855.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "St. Louis", state: "MO", address: "28 E Grand Ave, St. Louis, MO 63147",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Stand at the river crossing and imagine the courage required to cross the Mississippi in darkness, trusting in freedom on the other side — one of the most powerful Underground Railroad sites in America.",
  },
  {
    name: "Scott Joplin House State Historic Site",
    description: "The preserved home of the 'King of Ragtime,' where Joplin wrote some of his most famous works including 'The Entertainer' — a modest apartment where a Black composer revolutionized American music.",
    category: "historic_site", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "St. Louis", state: "MO", address: "2658 Delmar Blvd, St. Louis, MO 63103",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The docents here play live ragtime piano during tours — hearing the music in the room where it was composed connects you to Joplin's genius in an immediate, visceral way.",
  },
  {
    name: "Cherokee Street",
    description: "St. Louis's vibrant Hispanic and Latino cultural district, filled with authentic Mexican bakeries, art galleries, and murals — a colorful multicultural corridor that evolved from a declining commercial strip into a thriving community hub.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Mexican",
    city: "St. Louis", state: "MO",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Saturday mornings on Cherokee Street when the bakeries open their fresh pan dulce is the most authentic time to experience this neighborhood — the smells tell the story of Mexican St. Louis.",
  },
  {
    name: "Balkan Treat Box",
    description: "A highly acclaimed eatery in Webster Groves serving bold Balkan street food inspired by Bosnia — representing the largest Bosnian community outside of Europe, and earning national recognition for its somun bread.",
    category: "restaurant", ethnic_community: "Bosnian",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The somun bread — thick, pillowy, charred on the outside — is unlike any bread you've likely eaten. Pair it with the cevapi and you'll understand why refugee entrepreneurs transformed St. Louis's food culture.",
  },
  {
    name: "SweetArt Bakery",
    description: "A beloved Black-owned bakery, cafe, and art studio in the Shaw neighborhood offering vegan-friendly treats and soul food in a welcoming, community-focused space combining food, art, and culture.",
    category: "restaurant", ethnic_community: "African American",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The vegan soul food here challenges everything you thought you knew about what plant-based cooking can be — this bakery proves that healthy food and soul food are not mutually exclusive.",
  },
  {
    name: "Diana's Bakery",
    description: "A popular Mexican bakery on Cherokee Street — the heart of St. Louis's Latino community — offering authentic pan dulce, tamales, and cakes that fill the neighborhood with the aromas of traditional Mexican baking.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "St. Louis", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Weekend mornings when the pan dulce comes out fresh are the best time to visit — the warm pastries and the neighborhood energy around this bakery are a beautiful combination.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // INDIANAPOLIS, IN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Madam Walker Legacy Center",
    description: "Built in 1927 in African and Egyptian-inspired Art Deco style, this historic building honors Madam C.J. Walker — the first self-made female millionaire in America — and continues her legacy through cultural programming and Black economic empowerment.",
    category: "cultural_center", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Indianapolis", state: "IN", address: "617 Indiana Ave, Indianapolis, IN 46202",
    year_established: 1927, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Walker Theatre hosts community events year-round in a stunning Art Deco setting — one of the most beautiful Black-built spaces in America and a monument to what determined entrepreneurship can create.",
  },
  {
    name: "Indiana Avenue Historic Jazz District",
    description: "Once the vibrant center of Black culture and jazz in Indianapolis, Indiana Avenue produced legends like Wes Montgomery and served as a self-sustaining Black commercial and entertainment district during segregation.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Indianapolis", state: "IN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The Fountain Square neighborhood is where Indy's jazz heritage lives on in active venues — combine a visit to Indiana Avenue's history with a jazz evening in Fountain Square.",
  },
  {
    name: "Landmark for Peace Memorial",
    description: "Located in Dr. Martin Luther King Jr. Park, this memorial marks where Robert F. Kennedy delivered his famous impromptu speech on the night of MLK's assassination — credited with preventing riots that erupted in other cities.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Indianapolis", state: "IN", address: "1702 N Broadway St, Indianapolis, IN 46202",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Burmese American Community Institute (BACI)",
    description: "An organization serving Indianapolis's large Burmese refugee community through language classes, job training, and cultural programming — representing one of the largest Burmese populations in the United States.",
    category: "cultural_center", heritage_category: "community_organization", ethnic_community: "Burmese",
    city: "Indianapolis", state: "IN", address: "4925 Shelby St #200, Indianapolis, IN 46227",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Yogi's Deli",
    description: "A Black-owned deli and neighborhood staple in Indianapolis that has served the community for decades with hearty sandwiches, comfort food, and a gathering atmosphere that feels like family.",
    category: "restaurant", ethnic_community: "African American",
    city: "Indianapolis", state: "IN",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Iaria's Italian Restaurant",
    description: "A historic Indianapolis institution that has brought Italian immigrant culinary traditions to the community since 1933 — representing the depth of Indianapolis's immigrant heritage and the power of food to create community.",
    category: "restaurant", ethnic_community: "Italian",
    city: "Indianapolis", state: "IN", address: "317 S College Ave, Indianapolis, IN 46202",
    year_established: 1933, pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MILWAUKEE, WI
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "America's Black Holocaust Museum",
    description: "Reopened in 2022, this Milwaukee museum documents the history of African Americans from slavery through the present, founded by civil rights activist James Cameron — the only known survivor of an attempted lynching.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Milwaukee", state: "WI", address: "401 W North Ave, Milwaukee, WI 53212",
    year_established: 2022, admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The personal testimony of James Cameron embedded throughout the museum transforms this from a history lesson into a living witness — few museums anywhere create this level of moral urgency.",
  },
  {
    name: "Bronzeville Neighborhood — Milwaukee",
    description: "Milwaukee's historic African American cultural district, once known as the 'Harlem of the Midwest,' a neighborhood of jazz clubs, Black-owned businesses, and cultural vitality during the Great Migration era.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Milwaukee", state: "WI",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Hmong Cultural Center Milwaukee",
    description: "A community hub celebrating Hmong culture through exhibitions, traditional arts, and educational programs — serving Milwaukee's substantial Hmong community with cultural preservation and intergenerational connection.",
    category: "cultural_center", heritage_category: "museum_gallery", ethnic_community: "Hmong",
    city: "Milwaukee", state: "WI",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Bronzeville Collective MKE",
    description: "A collaborative storefront in Bronzeville featuring over 25 local Black, Brown, and Indigenous creatives selling art, apparel, and wellness products — a model of collective commerce amplifying community voices.",
    category: "retail", ethnic_community: "African American",
    city: "Milwaukee", state: "WI",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Every purchase here goes directly to a local Black, Brown, or Indigenous artist — ask who made each item and you'll walk out with a story as meaningful as the object itself.",
  },
  {
    name: "Daddy's Soul Food and Grille",
    description: "A family-owned Milwaukee institution on the Near West Side serving comforting soul food classics that has become a pillar of the local Black community — the kind of home-cooked meals that build community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Milwaukee", state: "WI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Come for Sunday dinner — the full spread of soul food classics from this family kitchen feels like the most welcoming table in Milwaukee.",
  },
  {
    name: "Alem Ethiopian Village Milwaukee",
    description: "A beloved staple in Downtown Milwaukee offering authentic Ethiopian cuisine with traditional injera and rich stews, serving as a cultural gathering space for the city's East African community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Milwaukee", state: "WI",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order the combination platter and eat with your hands the Ethiopian way — the injera is the utensil and the experience of communal eating is as important as the food itself.",
  },
  {
    name: "Hmongtown Marketplace Milwaukee",
    description: "A bustling Hmong market in Milwaukee's South Side featuring dozens of vendors selling authentic Hmong cuisine, fresh produce, traditional clothing, and community goods — a living expression of Hmong culture in Wisconsin.",
    category: "market", ethnic_community: "Hmong",
    city: "Milwaukee", state: "WI",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Weekend mornings are when the market is most vibrant — the prepared food vendors offer papaya salad, grilled meats, and Hmong sweets that you won't find anywhere else in Milwaukee.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // MINNEAPOLIS / ST. PAUL, MN
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Minnesota African American Heritage Museum and Gallery",
    description: "Located in North Minneapolis, this museum explores the history, achievements, and experiences of African Americans in Minnesota through rotating exhibits and community programs — filling a crucial gap in Midwestern Black history.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Minneapolis", state: "MN", address: "1256 Penn Ave N, Minneapolis, MN 55411",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Hmong Cultural Center St. Paul",
    description: "A vital community hub in St. Paul that celebrates Hmong culture through interactive museum exhibits, traditional arts, and educational programs preserving the rich cultural heritage of the Hmong people.",
    category: "cultural_center", heritage_category: "museum_gallery", ethnic_community: "Hmong",
    city: "St. Paul", state: "MN", address: "375 University Ave W, Suite 204, St. Paul, MN 55103",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The story cloth exhibitions here document Hmong history in a traditional textile medium that predates written language — each cloth is a visual narrative of community and survival.",
  },
  {
    name: "Historic Fort Snelling — Dred Scott's Quarters",
    description: "A historic military fort where Dred and Harriet Scott lived and labored before their landmark Supreme Court case — forcing visitors to confront the reality that slavery existed even in 'free' territories.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "St. Paul", state: "MN", address: "200 Tower Ave, St. Paul, MN 55111",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The preserved quarters where Dred and Harriet Scott lived are part of guided historical tours — the connection to the landmark Supreme Court case that preceded the Civil War is profound.",
  },
  {
    name: "Sabathani Community Center",
    description: "Founded in 1966, one of the oldest African American-founded nonprofits in Minnesota, providing essential resources in South Minneapolis near the intersection that gained global significance in 2020.",
    category: "cultural_center", heritage_category: "community_organization", ethnic_community: "African American",
    city: "Minneapolis", state: "MN", address: "310 E 38th St, Minneapolis, MN 55409",
    year_established: 1966, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Capri Theater Minneapolis",
    description: "A historic venue in North Minneapolis where Prince played his first solo concert — a cultural anchor for the neighborhood since 1927, connecting Black artistic excellence from the 1920s to Prince's 1970s breakthrough.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Minneapolis", state: "MN", address: "2027 W Broadway Ave, Minneapolis, MN 55411",
    year_established: 1927, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "A Capri performance connects you to over 100 years of North Minneapolis Black arts — the same stage where Prince first performed as a teenager now nurtures the next generation of Minneapolis artists.",
  },
  {
    name: "Afro Deli and Grill",
    description: "A popular, vibrant eatery in Downtown St. Paul offering a fusion of African, Mediterranean, and American cuisine — founded by a Somali immigrant and serving as a community gathering space and model of immigrant entrepreneurship.",
    category: "restaurant", ethnic_community: "Somali",
    city: "St. Paul", state: "MN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The fusion menu here — Somali shawarma, East African rice dishes alongside American standards — is a delicious map of immigrant culinary creativity. The owner's story is as nourishing as the food.",
  },
  {
    name: "Black Garnet Books",
    description: "Minnesota's first Black- and queer-owned bookstore in Midway, St. Paul, specializing in adult and YA literature by Black and racially diverse authors — celebrating intersectional identity through literature.",
    category: "bookstore", ethnic_community: "African American",
    city: "St. Paul", state: "MN",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "The curation here is explicitly intersectional — you'll find books that center Blackness, queerness, and their beautiful overlap in ways that most bookstores don't even try.",
  },
  {
    name: "Pimento Jamaican Kitchen Minneapolis",
    description: "A beloved Minneapolis spot on Eat Street serving authentic Jamaican street food and functioning as a platform for social activism — a restaurant that feeds the body and serves the community at the same time.",
    category: "restaurant", ethnic_community: "Jamaican",
    city: "Minneapolis", state: "MN",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The jerk chicken here is slow-smoked to perfection and the activism is genuine — ask about the owner's community work alongside the best Jamaican food in Minneapolis.",
  },
  {
    name: "Hmongtown Marketplace St. Paul",
    description: "The largest Hmong market in the country, featuring over a hundred vendors selling authentic Hmong cuisine, fresh produce, traditional clothing, and herbal medicines — a complete cultural ecosystem in Frogtown.",
    category: "market", ethnic_community: "Hmong",
    city: "St. Paul", state: "MN",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "This is the most complete Hmong cultural market in America — weekend mornings when all vendors are open and the prepared food stalls are cooking is when it's at its most extraordinary.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DALLAS / FORT WORTH, TX
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "African American Museum of Dallas",
    description: "Located in historic Fair Park, this museum is dedicated to the preservation of African American artistic, cultural, and historical materials — housing one of the largest collections of African American folk art in the U.S.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Dallas", state: "TX", address: "3536 Grand Ave, Dallas, TX 75210",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The folk art collection here — representing over a century of Black vernacular artistic tradition — is one of the most underappreciated museum collections in Texas.",
  },
  {
    name: "Deep Ellum Historic District",
    description: "Originally established by formerly enslaved people after the Civil War, Deep Ellum became a legendary hub for blues and jazz where Blind Lemon Jefferson, Leadbelly, and other blues pioneers performed.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Dallas", state: "TX",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Friday evenings in Deep Ellum when the music venues come alive reflect the district's blues heritage in a living way — the street murals tell the history before the clubs tell it in sound.",
  },
  {
    name: "Paul Quinn College",
    description: "The oldest HBCU in Texas, known for its innovative 'WE over ME' philosophy that transformed an abandoned football field into an organic farm addressing the local food desert in South Dallas.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Dallas", state: "TX", address: "3837 Simpson Stuart Rd, Dallas, TX 75241",
    year_established: 1872, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The WE over ME farm on campus is one of the most innovative HBCU initiatives in the country — it grows food for the neighborhood and teaches students about food justice simultaneously.",
  },
  {
    name: "Latino Cultural Center Dallas",
    description: "A multidisciplinary arts center designed by renowned architect Ricardo Legorreta, dedicated to the preservation and promotion of Latino and Hispanic arts and culture in a stunning building inspired by Mexican architecture.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Hispanic/Latino",
    city: "Dallas", state: "TX", address: "2600 Live Oak St, Dallas, TX 75204",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The building itself is a work of art — Ricardo Legorreta's bold geometric forms and colors are a deliberate expression of Mexican cultural tradition transplanted to Texas soil.",
  },
  {
    name: "Desta Ethiopian Restaurant Dallas",
    description: "A beloved spot in Lake Highlands serving authentic Ethiopian cuisine — a community hub for DFW's large Ethiopian population and an excellent introduction to East African culinary traditions.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Dallas has one of the largest Ethiopian communities in the country — Desta is where they gather, and the food reflects years of cooking for family, not just customers.",
  },
  {
    name: "Smoke-A-Holics BBQ",
    description: "A popular Fort Worth craft barbecue joint known for its 'Tex-Soul' cuisine — blending traditional Texas BBQ with soulful Southern sides in a combination that is uniquely Texan and uniquely Black.",
    category: "restaurant", ethnic_community: "African American",
    city: "Fort Worth", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The brisket here is rubbed and smoked the Texas way, but the sides tell a distinctly Black Southern story — the combination of both traditions on one plate is what 'Tex-Soul' means.",
  },
  {
    name: "Pan-African Connection Bookstore Dallas",
    description: "More than a bookstore in South Dallas — a vital community resource center offering books, art, clothing, and educational programs focused on the African diaspora. A cultural anchor for decades.",
    category: "bookstore", ethnic_community: "African American",
    city: "Dallas", state: "TX",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "This bookstore has been the intellectual backbone of South Dallas's Black community for decades — ask the staff for recommendations and you'll leave with books that challenge and inspire.",
  },
  {
    name: "Tacos La Banqueta",
    description: "A legendary no-frills East Dallas taqueria famous for its authentic street-style tacos — particularly the suadero and pastor — drawing devoted crowds from across the city for uncompromisingly authentic Mexican street food.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Dallas", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order the suadero taco — it's made from a cut of beef almost impossible to find elsewhere in the city, braised until meltingly tender and piled onto a warm corn tortilla. No fancy presentation, just perfect.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SAN ANTONIO, TX
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "San Antonio African American Community Archive and Museum",
    description: "A digital archive and museum in the historic La Villita, dedicated to preserving and sharing the rich, diverse history of African Americans in San Antonio — a community often overshadowed in majority-Hispanic TX.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "San Antonio", state: "TX", address: "218 S Presa St, San Antonio, TX 78205",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Guadalupe Cultural Arts Center San Antonio",
    description: "Located in the heart of the Westside, this center is dedicated to cultivating Chicano, Latino, and Native American arts and culture — the cultural heart of San Antonio's Mexican-American community for over 40 years.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Mexican",
    city: "San Antonio", state: "TX", address: "723 S Brazos St, San Antonio, TX 78207",
    year_established: 1980, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The murals on the center's exterior are iconic representations of Chicano art — but the performances and exhibitions inside are what make this the beating heart of Mexican-American San Antonio.",
  },
  {
    name: "St. Philip's College",
    description: "A historic institution holding the unique distinction of being both an HBCU and a Hispanic Serving Institution — reflecting San Antonio's unique demographics and educating both Black and Hispanic students since 1898.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "San Antonio", state: "TX", address: "1801 Martin Luther King Dr, San Antonio, TX 78203",
    year_established: 1898, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "St. Philip's is the only institution in the U.S. that is simultaneously an HBCU and a Hispanic Serving Institution — a distinction that perfectly reflects San Antonio's unique cultural identity.",
  },
  {
    name: "Historic Market Square — El Mercado",
    description: "The largest Mexican market in the United States — a three-block outdoor plaza where over 100 locally owned shops celebrate Hispanic culture through handmade crafts, traditional clothing, and live mariachi music.",
    category: "market", ethnic_community: "Mexican",
    city: "San Antonio", state: "TX", address: "514 W Commerce St, San Antonio, TX 78207",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "Weekend evenings at El Mercado when mariachi bands are playing and the market vendors are fully open capture the living cultural tradition of Mexican San Antonio at its most vibrant.",
  },
  {
    name: "Carver Community Cultural Center San Antonio",
    description: "Originally the colored branch of the San Antonio Library during segregation, now a premier hub for celebrating diverse cultures — particularly African American heritage — through the performing arts.",
    category: "cultural_center", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "San Antonio", state: "TX", address: "226 N Hackberry St, San Antonio, TX 78202",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "A performance at the Carver is a pilgrimage — this space was reclaimed from segregation and transformed into a stage for Black artistic excellence. Attend with intention.",
  },
  {
    name: "Rosario's Mexican Restaurant San Antonio",
    description: "A vibrant, award-winning restaurant in the historic Southtown neighborhood celebrating traditional and contemporary Mexican cuisine — one of San Antonio's most beloved restaurants.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "San Antonio", state: "TX", address: "910 S Alamo St, San Antonio, TX 78205",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The margaritas here are legendary in San Antonio and the interior murals tell the story of Mexican culinary tradition with color and joy — this is the San Antonio restaurant that locals bring their families.",
  },
  {
    name: "Sweet Yams San Antonio",
    description: "The first organic takeout restaurant in San Antonio, located on the historic East Side and offering healthy, soulful, and vegan-friendly options — bringing health-conscious dining to a historically underserved Black community.",
    category: "restaurant", ethnic_community: "African American",
    city: "San Antonio", state: "TX",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This restaurant is a food justice statement — organic, vegan soul food on the East Side means the community doesn't have to choose between health and culture.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOS ANGELES, CA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "California African American Museum (CAAM)",
    description: "A museum dedicated to the history, art, and culture of African Americans in California — telling the unique story of Black life on the West Coast with free admission ensuring community accessibility.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Los Angeles", state: "CA", address: "600 State Dr, Los Angeles, CA 90037",
    year_established: 1977, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The museum's rotating exhibitions on contemporary Black California artists are some of the most exciting in any publicly funded institution — free admission makes this a no-excuse visit.",
  },
  {
    name: "Leimert Park Village Plaza",
    description: "The cultural hub for African Americans in LA — called the 'Black Greenwich Village' for its concentration of art galleries, performance spaces, and Black-owned businesses. The gathering place for Black LA's creative spirit.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Los Angeles", state: "CA", address: "4395 Leimert Blvd, Los Angeles, CA 90008",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Sunday afternoons in Leimert Park are when the neighborhood's soul shows itself most fully — drum circles, vendors, community gathering, and the artwork that lines the park tell the story of Black LA.",
  },
  {
    name: "Japanese American National Museum",
    description: "Dedicated to preserving Japanese American history with particular focus on the WWII internment experience — a museum that documents injustice and celebrates resilience in LA's Little Tokyo.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Japanese American",
    city: "Los Angeles", state: "CA", address: "100 N Central Ave, Los Angeles, CA 90012",
    year_established: 1985, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Watts Towers",
    description: "A collection of 17 interconnected sculptural towers built by Italian immigrant Simon Rodia over 33 years — now a symbol of the predominantly Black and Latino Watts community's creative spirit and resilience.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Multi-Diaspora",
    city: "Los Angeles", state: "CA", address: "1765 E 107th St, Los Angeles, CA 90002",
    year_established: 1954, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "The guided tour gets you closest to the towers — the intricate mosaics of bottles, shells, and tile embedded in the structure are extraordinary up close. One of the most unique artworks in America.",
  },
  {
    name: "Guelaguetza",
    description: "A James Beard Award-winning restaurant in Koreatown known for its authentic Oaxacan cuisine — a family-owned institution bringing the complex, ancient culinary traditions of Oaxaca to national prominence.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Los Angeles", state: "CA", address: "3014 W Olympic Blvd, Los Angeles, CA 90006",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The mole negro here — the complex black mole that takes days to make — is among the finest versions of this ancient Oaxacan dish anywhere outside of Oaxaca itself.",
  },
  {
    name: "Malik Books Los Angeles",
    description: "An independent African American bookstore in Baldwin Hills specializing in books, calendars, and gifts celebrating cultural diversity — serving one of the wealthiest Black neighborhoods in America with cultural resources.",
    category: "bookstore", ethnic_community: "African American",
    city: "Los Angeles", state: "CA",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "The owner curates this collection with deep intentionality — every book in this store has been personally selected to celebrate and strengthen Black cultural identity.",
  },
  {
    name: "Meals by Genet — Little Ethiopia LA",
    description: "A beloved eatery in LA's Little Ethiopia offering traditional Ethiopian dishes — located in the heart of the largest Ethiopian community outside of Ethiopia, famous for its intricate dorowat.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Los Angeles", state: "CA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The dorowat here is a masterclass in slow-cooked Ethiopian cooking — this is a dish that takes two days to make properly and Chef Genet has been perfecting it for decades.",
  },
  {
    name: "Wi Spa Koreatown",
    description: "A massive traditional Korean spa in Koreatown serving as a cultural and community gathering place — representing the Korean tradition of communal bathing and relaxation that connects the community to centuries-old practice.",
    category: "cultural_center", heritage_category: "wellness", ethnic_community: "Korean",
    city: "Los Angeles", state: "CA", address: "2700 Wilshire Blvd, Los Angeles, CA 90057",
    admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "24-hour access means you can go late at night when it's quietest — the jjimjilbang (communal heated rooms) experience is a window into Korean wellness culture at its most authentic.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // OAKLAND / BAY AREA, CA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "DeFremery Park — Little Bobby Hutton Park",
    description: "A historic Oakland park that served as a central gathering place for the Black Panther Party — named after Bobby Hutton, the first BPP member killed by police at age 17, a symbol of revolutionary community organizing.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Oakland", state: "CA", address: "1651 Adeline St, Oakland, CA 94607",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This park is sacred ground for Black liberation history — the community picnics, youth programs, and neighborhood organizing that happen here today continue the Panther tradition of mutual aid.",
  },
  {
    name: "Marcus Books Oakland",
    description: "The nation's oldest independent Black bookstore, serving as a literary and cultural cornerstone since 1960 — founded by Julian and Raye Richardson, a gathering place for Black intellectuals and activists for over 60 years.",
    category: "bookstore", ethnic_community: "African American",
    city: "Oakland", state: "CA", address: "3900 Martin Luther King Jr Way, Oakland, CA 94609",
    year_established: 1960, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "This is the oldest Black bookstore in America — every book you buy here carries 60 years of Black intellectual tradition. Ask the family about the store's history and they'll share stories that will stay with you.",
  },
  {
    name: "Fruitvale Transit Village",
    description: "The heart of Oakland's Latino community featuring vibrant murals, community plazas, and culturally significant architecture — a successful model of community-led development expressing Mexican and Central American heritage.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Mexican",
    city: "Oakland", state: "CA", address: "3400 E 12th St, Oakland, CA 94601",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "The Day of the Dead murals at Fruitvale station are stunning — but the entire transit village was designed by the community to reflect their cultural identity, making every wall and plaza meaningful.",
  },
  {
    name: "Everett and Jones Barbeque",
    description: "A legendary family-owned Oakland barbecue joint in Jack London Square, founded in 1973 by Dorothy Everett — serving authentic oak-smoked meats that represent the Southern traditions brought west during the Great Migration.",
    category: "restaurant", ethnic_community: "African American",
    city: "Oakland", state: "CA", address: "126 Broadway, Oakland, CA 94607",
    year_established: 1973, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The oak-smoked brisket here is the definitive Oakland BBQ experience — 50 years of perfecting a recipe that connects Northern California's Black community to its Southern roots.",
  },
  {
    name: "Red Bay Coffee",
    description: "A specialty coffee company in Oakland's Fruitvale neighborhood founded by Keba Konte, dedicated to diversity, inclusion, and bringing high-quality coffee to the community — challenging the whiteness of specialty coffee culture.",
    category: "restaurant", ethnic_community: "African American",
    city: "Oakland", state: "CA",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Red Bay Coffee is a statement about who belongs in specialty coffee — the quality matches the best in the industry and the intentionality behind every cup makes it taste even better.",
  },
  {
    name: "Wahpepah's Kitchen",
    description: "One of the only Native American restaurants in the Bay Area, in Oakland's Fruitvale neighborhood — using food as a tool for cultural reclamation, serving dishes made with traditional Indigenous ingredients and preparation methods.",
    category: "restaurant", ethnic_community: "Indigenous",
    city: "Oakland", state: "CA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This is one of the rarest dining experiences in America — Indigenous food prepared with ceremony and intention, using ingredients that connect the meal directly to pre-colonial North America.",
  },
  {
    name: "The Women's Building — MaestraPeace Mural SF",
    description: "A women-led community space in SF's Mission District featuring the iconic MaestraPeace mural celebrating female leaders across the diaspora — a 1994 community art masterpiece painted by seven women artists.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Multi-Diaspora",
    city: "San Francisco", state: "CA", address: "3543 18th St, San Francisco, CA 94110",
    year_established: 1979, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Stand across the street to take in the full scale of the MaestraPeace mural — it covers the entire building and the details reward as much time as you give it.",
  },
  {
    name: "Reem's California",
    description: "An Arab street food bakery in SF's Mission District building community across cultures while serving traditional man'oushe and mezze — founded by Reem Assil, using food as community building and political expression.",
    category: "restaurant", ethnic_community: "Arab American",
    city: "San Francisco", state: "CA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The za'atar man'oushe here is breakfast perfection — warm flatbread, olive oil, and wild thyme that tastes like Lebanon. The political murals on the walls make the context explicit.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DENVER, CO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Black American West Museum",
    description: "Housed in the former home of Dr. Justina Ford (Colorado's first Black female doctor), this Denver museum documents the prominent role of Black pioneers, cowboys, and settlers in shaping the American West.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Denver", state: "CO", address: "3091 California St, Denver, CO 80205",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The collection challenges every Western movie you've ever seen — one in four cowboys in the American West was Black, and this museum proves it with photos, artifacts, and oral histories.",
  },
  {
    name: "Five Points Historic Cultural District Denver",
    description: "Once known as the 'Harlem of the West' — Five Points was the epicenter of Black commerce and jazz in Denver during segregation, hosting Duke Ellington and Billie Holiday on Welton Street.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Denver", state: "CO",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk Welton Street and stop at the Five Points Jazz Festival in summer to hear the music that once made this the cultural capital of Black Denver — the neighborhood's legacy lives in every note.",
  },
  {
    name: "Museo de las Americas Denver",
    description: "The premier museum in the Rocky Mountain region dedicated exclusively to the diverse arts and cultures of the Americas — showcasing pre-Columbian art through contemporary Latino artists in Denver's Art District on Santa Fe.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Hispanic/Latino",
    city: "Denver", state: "CO", address: "861 Santa Fe Dr, Denver, CO 80204",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Cultural First Fridays on Santa Fe bring this museum and the surrounding art district alive with gallery openings, performances, and community gathering — the best evening to experience Denver's Latino arts scene.",
  },
  {
    name: "La Alma Lincoln Park Murals",
    description: "Denver's most significant collection of Chicano murals — a neighborhood rich in Mexican American history featuring artwork depicting immigration, labor struggles, cultural pride, and community aspiration.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Mexican",
    city: "Denver", state: "CO",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "The murals in La Alma are a reading list in paint — each piece tells a specific story about the Mexican American experience in Denver that you could spend hours studying.",
  },
  {
    name: "Welton Street Café Denver",
    description: "A long-standing community staple in Denver's historic Five Points neighborhood serving authentic soul food and Caribbean dishes — a gathering place for the Black community for decades.",
    category: "restaurant", ethnic_community: "African American",
    city: "Denver", state: "CO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This café sits in the heart of what was once the 'Harlem of the West' — eating here is participating in a tradition of Black community gathering that goes back generations.",
  },
  {
    name: "Ras Kassa's Ethiopian Restaurant Denver",
    description: "A beloved, long-running Aurora restaurant owned by Kassa Tekle serving the East African community with traditional dishes and house-made teff injera — a cornerstone of Denver's Ethiopian community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Denver", state: "CO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The house-made teff injera here is one of the best in the region — come with a group and order the combination platter to experience the full breadth of Ethiopian cooking.",
  },
  {
    name: "Convivio Café Denver",
    description: "A bilingual, immigrant-owned cafe in Northwest Denver celebrating Guatemalan coffee culture — a welcoming community space where the Latino population feels at home and shares their culture with all of Denver.",
    category: "restaurant", ethnic_community: "Guatemalan",
    city: "Denver", state: "CO",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "The Guatemalan coffee here is some of the finest in Colorado — shade-grown, carefully roasted, and served with the warmth of a culture that has been cultivating this crop for centuries.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOENIX, AZ
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Eastlake Park Phoenix",
    description: "The oldest park in Phoenix and the historic epicenter of the early African American community since the late 1800s — a gathering place for the Black community through civil rights rallies, community celebrations, and cultural events.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Phoenix", state: "AZ", address: "1549 E Jefferson St, Phoenix, AZ 85034",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Eastlake Park is sacred ground for Black Phoenix — the community that built this city is remembered in every corner of this park.",
  },
  {
    name: "Tanner Chapel AME Church Phoenix",
    description: "The oldest African American congregation in Arizona (1887), located in the Eastlake Park neighborhood — for nearly 140 years, a spiritual home and organizing center for the Black community of Phoenix.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Phoenix", state: "AZ", address: "20 S 8th St, Phoenix, AZ 85034",
    year_established: 1887, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "This congregation has been the spiritual anchor of Black Phoenix since 1887 — Sunday service is open to all, and the community warmth that greets visitors is genuine.",
  },
  {
    name: "Palabras Bilingual Bookstore Phoenix",
    description: "Downtown Phoenix's only bilingual bookstore and cultural sanctuary, elevating BIPOC voices and fostering community healing through books in English and Spanish, workshops, and healing circles.",
    category: "bookstore", ethnic_community: "Hispanic/Latino",
    city: "Phoenix", state: "AZ", address: "906 W Roosevelt St, Phoenix, AZ 85007",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "This bookstore is explicitly a healing space — the community events here center those most impacted by systemic harm and the curation reflects that care.",
  },
  {
    name: "Mrs. White's Golden Rule Cafe Phoenix",
    description: "A Phoenix institution since 1964 serving down-home Southern comfort food like fried catfish and smothered pork chops — the heart of Black Phoenix's food culture for six decades.",
    category: "restaurant", ethnic_community: "African American",
    city: "Phoenix", state: "AZ",
    year_established: 1964, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This is the longest-running Black-owned restaurant in Phoenix and one of the oldest in the Southwest — every plate here carries 60 years of love and the fried catfish is legendary.",
  },
  {
    name: "Bacanora Phoenix",
    description: "An award-winning Sonoran restaurant in Phoenix's Grand Avenue Arts District by Chef René Andrade — bringing the heart of the Sonoran Desert to the table with mesquite-grilled meats celebrating the deep Mexican-American roots of Arizona.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Phoenix", state: "AZ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The mesquite-smoked meats here reflect the Sonoran cooking tradition that predates the US-Mexico border — this is food tied to place and land in a way that elevates every bite.",
  },
  {
    name: "Abyssinia Restaurant Phoenix",
    description: "A beloved Ethiopian restaurant in Central Phoenix serving traditional dishes and performing the spiritual Ethiopian Coffee Ceremony — providing a complete cultural experience for Phoenix's East African community.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Phoenix", state: "AZ",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Ethiopian Coffee Ceremony here is a meditative, cultural experience unlike any coffee you've had before — ask for it specifically and allow time to receive the full three-pour tradition.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LAS VEGAS, NV
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Historic Westside School Las Vegas",
    description: "Built in 1923 and serving as the first school for Black children in Las Vegas, this Mission Revival-style structure now houses community organizations, reflecting the historic Black community's enduring presence.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Las Vegas", state: "NV", address: "330 W Washington Ave, Las Vegas, NV 89106",
    year_established: 1923, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Moulin Rouge Hotel Site Las Vegas",
    description: "Opened in 1955 as the first racially integrated casino in the US — a monument to racial justice where the 1960 desegregation agreement was signed, ending segregation on the Las Vegas Strip.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Las Vegas", state: "NV", address: "900 W Bonanza Rd, Las Vegas, NV 89106",
    year_established: 1955, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Moulin Rouge operated for only six months but changed Las Vegas history — standing on this site connects you to the moment when Black entertainers refused to remain segregated in the city they built.",
  },
  {
    name: "Filipino Town Cultural District Las Vegas",
    description: "Officially designated in 2025, this 1.2-mile corridor is the heart of Las Vegas's thriving Filipino community — the largest ethnic Asian group in Nevada, anchored by Seafood City and vibrant Filipino-owned businesses.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Filipino",
    city: "Las Vegas", state: "NV",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Maryland Parkway in Filipino Town is the best place to experience the Filipino community's transformation of Las Vegas — the food, businesses, and cultural events here reflect a community that built its own home.",
  },
  {
    name: "Legacy Park Las Vegas",
    description: "A $3.2 million park in the Historic Westside featuring exhibits, sculptures, and plaques highlighting the area's history and Black community leaders — an outdoor museum preserving the memory of the Westside's golden age.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Las Vegas", state: "NV", address: "1600 Mount Mariah Drive, Las Vegas, NV 89106",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Nigerian Cuisine by MJ Las Vegas",
    description: "Offering the authentic flavors of West Africa near the North Strip on Maryland Parkway — rice dishes, meat stews, plantains, and yams bringing Nigeria to Las Vegas for the growing West African community.",
    category: "restaurant", ethnic_community: "West African",
    city: "Las Vegas", state: "NV",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The rice and stew combinations here — jollof with peppered fish, or rice with egusi and assorted meats — are the kind of meal that makes you feel like you're in Lagos. The lunch special is the best value.",
  },
  {
    name: "Seafood City Supermarket Las Vegas",
    description: "Much more than a grocery store — this Filipino Town anchor serves daily doses of home with Philippines-based chains Jollibee and Red Ribbon Bakeshop, doubles as a polling place, and hosts an annual Philippine Independence Day celebration.",
    category: "market", ethnic_community: "Filipino",
    city: "Las Vegas", state: "NV",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "The lechon counter inside is a Filipino Las Vegas institution — the rotisserie pig is prepared fresh daily and this is where the Filipino community shops for everything they need to cook from home.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SEATTLE, WA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Northwest African American Museum",
    description: "A museum dedicated to presenting and preserving the connections between the Pacific Northwest and people of African descent — telling the unique story of Black life in a region where that history is rarely taught.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Seattle", state: "WA", address: "2300 S Massachusetts St, Seattle, WA 98144",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Wing Luke Museum of the Asian Pacific American Experience",
    description: "A Smithsonian-affiliated museum in Seattle's International District using community-curated exhibits to tell the stories of Asian immigrants who built the Pacific Northwest despite exclusion and internment.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Asian American",
    city: "Seattle", state: "WA", address: "719 S King St, Seattle, WA 98104",
    year_established: 1967, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The neighborhood walking tours offered by Wing Luke are exceptional — they connect the museum's history to the living community in the International District in ways that illuminate both.",
  },
  {
    name: "Central District — Seattle's Historic Black Neighborhood",
    description: "Seattle's historic Black community — the C.D. grew during WWII-era migration and due to redlining, became home to Quincy Jones, Jimi Hendrix, and a vibrant Black cultural life now threatened by gentrification.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Seattle", state: "WA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walk the C.D. with knowledge of what's being lost to gentrification — the remaining Black-owned businesses here are community anchors fighting to preserve the neighborhood's identity.",
  },
  {
    name: "Jimi Hendrix Park and Memorial",
    description: "A park dedicated to the legendary guitarist born and raised in Seattle's Central District, featuring artistic installations inspired by his music — celebrating one of the most influential musicians in history, a Black man from the C.D.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Seattle", state: "WA", address: "2400 S Massachusetts St, Seattle, WA 98144",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "The park's landscape design evokes the waves and distortions of Hendrix's music — sit in the space and let it speak before moving on to the museum next door.",
  },
  {
    name: "Communion Seattle",
    description: "A celebrated soul food restaurant and bar in the Central District by Chef Kristi Brown honoring the culinary traditions of the C.D.'s Black community — a restaurant fighting to preserve cultural identity against gentrification.",
    category: "restaurant", ethnic_community: "African American",
    city: "Seattle", state: "WA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This restaurant is a statement of cultural preservation in a neighborhood under gentrification pressure — every meal here supports the Black community that built the Central District.",
  },
  {
    name: "Uwajimaya Seattle",
    description: "A historic and massive Asian supermarket in the Chinatown-International District — a family business that grew from a small fish cake shop in 1928 into a major Asian supermarket representing nearly a century of Asian American entrepreneurship.",
    category: "market", ethnic_community: "Japanese American",
    city: "Seattle", state: "WA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "The prepared food counters in Uwajimaya offer some of the best Japanese, Korean, and pan-Asian ready-to-eat options in Seattle — it's a full cultural experience disguised as grocery shopping.",
  },
  {
    name: "Kubota Garden Seattle",
    description: "A stunning 20-acre Japanese garden created in 1928 by Fujitaro Kubota, blending Japanese landscaping with native Northwest plants — maintained by Kubota even after his family's WWII internment, a symbol of resilience.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "Japanese American",
    city: "Seattle", state: "WA", address: "9817 55th Ave S, Seattle, WA 98118",
    year_established: 1928, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Morning visits in any season are when this garden is most serene — Kubota designed it to be peaceful above all else, and following the winding paths reveals new beauty at every turn.",
  },
  {
    name: "Amy's Merkato Seattle",
    description: "A long-standing community staple in Hillman City/Rainier Valley offering authentic Ethiopian and Eritrean cuisine, spices, and injera — serving Seattle's large East African community with both prepared food and cultural ingredients.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Seattle", state: "WA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Rainier Valley is Seattle's most diverse neighborhood — Amy's anchors its East African food corridor, and you can spend a full day exploring the culinary diversity within walking distance.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTLAND, OR
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Billy Webb Elks Lodge Portland",
    description: "A historic African American lodge that served as a crucial gathering place, NAACP headquarters, and safe haven for Black Portlanders during segregation — community built in a city with some of the most restrictive racial covenants in America.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Portland", state: "OR", address: "6 N Tillamook St, Portland, OR 97227",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Japanese American Historical Plaza Portland",
    description: "A memorial plaza along the Portland waterfront dedicated to Japanese Americans in Oregon, particularly those interned during WWII — featuring haiku written by internees on poetry stones, a contemplative site of memory.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "Japanese American",
    city: "Portland", state: "OR", address: "NW Naito Pkwy & NW Couch St, Portland, OR 97209",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "Read each poetry stone slowly — the haiku written by internees during their captivity are among the most moving pieces of anti-incarceration literature in America, and they deserve careful attention.",
  },
  {
    name: "Portland Indigenous Marketplace",
    description: "A barrier-free, culturally respectful space supporting Indigenous artists and entrepreneurs in Portland, celebrating Native American heritage and providing economic opportunity for Indigenous artisans.",
    category: "market", ethnic_community: "Indigenous",
    city: "Portland", state: "OR",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "market", listing_status: "staged",
    visit_tip: "The work sold here is authentic Native American art — ask each vendor about their nation and the tradition behind their craft. That conversation is as meaningful as the object you take home.",
  },
  {
    name: "Above Grnd Coffee Portland",
    description: "Portland's first Somali-owned late-night coffee shop in Old Town, created by three second-generation Somali Americans building community — honoring heritage while reflecting their American identity.",
    category: "restaurant", ethnic_community: "Somali",
    city: "Portland", state: "OR",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Late evening at Above Grnd is when the Somali community gathers — the café chai and the conversations that happen here late at night represent the second generation finding its own voice.",
  },
  {
    name: "Mis Tacones Portland",
    description: "A queer, Latinx-owned vegan taqueria in Portland providing a safe space for the LGBTQ+ and Latino communities while serving delicious plant-based Mexican food — celebrating all aspects of the owners' intersectional identity.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "This taqueria is a home for people who belong to multiple communities simultaneously — the food is excellent and the welcome for LGBTQ+ Latinx people is explicit and genuine.",
  },
  {
    name: "Bison Coffeehouse Portland",
    description: "Portland's only Native-owned coffeehouse in the Cully neighborhood — a community gathering space serving locally roasted beans and providing a home for Indigenous community members in Portland.",
    category: "restaurant", ethnic_community: "Indigenous",
    city: "Portland", state: "OR",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Bison is more than a coffee shop — it's a deliberate act of Indigenous presence in a city where Native people have been largely invisible. Visiting here supports that presence.",
  },
  {
    name: "Akati West African Restaurant Portland",
    description: "A West African restaurant in Northeast Portland whose name means 'tasty' in Bambara, offering authentic dishes from Côte d'Ivoire and surrounding regions — a rare taste of West Africa in the Pacific Northwest.",
    category: "restaurant", ethnic_community: "West African",
    city: "Portland", state: "OR",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The attiéké (fermented cassava couscous) with grilled fish is a dish you almost certainly haven't tried before and one you'll want to order again immediately — authentic Ivorian coastal cooking in Portland.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // KANSAS CITY, MO
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "18th and Vine Historic Jazz District",
    description: "The historic epicenter of African American business and culture in Kansas City — internationally renowned as a cradle of jazz where Charlie Parker, Count Basie, and Big Joe Turner developed the distinctive Kansas City sound in 100+ nightclubs.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Kansas City", state: "MO", address: "18th St & Vine St, Kansas City, MO 64108",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Friday and Saturday evenings in the 18th & Vine District are when the jazz tradition lives on in the active clubs — the American Jazz Museum's Blue Room hosts live music that continues the legacy.",
  },
  {
    name: "American Jazz Museum Kansas City",
    description: "Located in the 18th & Vine district, this museum preserves the history of American jazz with interactive exhibits and live performances — connecting visitors to the music's African American roots in Kansas City.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Kansas City", state: "MO", address: "1616 E 18th St, Kansas City, MO 64108",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Blue Room live jazz venue inside the museum operates on weekends — attending a performance after touring the exhibits completes the experience of understanding jazz as a living tradition.",
  },
  {
    name: "Negro Leagues Baseball Museum Kansas City",
    description: "Dedicated to preserving the history of African American baseball — the Negro Leagues as a civil rights story, of Black athletes building their own institutions when excluded from the majors, and whose excellence eventually forced integration.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Kansas City", state: "MO", address: "1616 E 18th St, Kansas City, MO 64108",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The centerpiece is a field of player sculptures at their positions — standing among them tells the story of a complete, fully flourishing Black baseball world that existed entirely because of exclusion and thrived despite it.",
  },
  {
    name: "Guadalupe Centers Kansas City",
    description: "Established in 1919 — one of the nation's longest-operating Latino-serving nonprofits, offering cultural programming, festivals, and community support for Kansas City's Mexican-American community for over a century.",
    category: "cultural_center", heritage_category: "community_organization", ethnic_community: "Mexican",
    city: "Kansas City", state: "MO", address: "1015 Avenida Cesar E Chavez, Kansas City, MO 64108",
    year_established: 1919, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Gates Bar-B-Q Kansas City",
    description: "A historic family-owned Kansas City barbecue institution with multiple locations — a pillar of the local Black community and culinary scene for decades. The famous 'Hi, may I help you?' greeting is known throughout the city.",
    category: "restaurant", ethnic_community: "African American",
    city: "Kansas City", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Gates is more than Kansas City's most iconic Black-owned BBQ restaurant — it's a cultural institution. Order the burnt ends and know that you're participating in a tradition that has defined this city for 75 years.",
  },
  {
    name: "Blue Nile Cafe Kansas City",
    description: "The oldest Ethiopian restaurant in Kansas City, located in the City Market and offering traditional dishes and injera — a pioneer in bringing East African food culture to the Midwest.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Kansas City", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Blue Nile has been educating Kansas City about Ethiopian food for decades — the combination platter with injera is the perfect introduction for first-timers and deeply satisfying for regulars.",
  },
  {
    name: "Yoli Tortilleria Kansas City",
    description: "An award-winning, Mexican-owned tortilleria on the Westside specializing in authentic, stone-ground corn tortillas and traditional Mexican baked goods — representing the artisanal food traditions of Mexico in Kansas City.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Kansas City", state: "MO",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The stone-ground masa tortillas here taste like a completely different food than anything mass-produced — come for the tortillas and leave with enough to make enchiladas at home.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TULSA, OK
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Greenwood Rising History Center",
    description: "A state-of-the-art history center at the heart of Tulsa's Greenwood District honoring the legacy of Black Wall Street before and after the 1921 Tulsa Race Massacre — an immersive experience of prosperity, destruction, and resilience.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Tulsa", state: "OK", address: "23 N Greenwood Ave, Tulsa, OK 74120",
    year_established: 2021, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The immersive theater experience about the 1921 massacre is one of the most powerful in any American museum — it places you inside a community being destroyed and forces you to reckon with that history.",
  },
  {
    name: "Historic Greenwood District — Black Wall Street",
    description: "The historic neighborhood that was the thriving center of African American wealth and entrepreneurship before being destroyed in 1921 and subsequently rebuilt — over 300 Black-owned businesses flourished here before the massacre.",
    category: "heritage_district", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Tulsa", state: "OK",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walking the current Greenwood District knowing what was destroyed here in 1921 transforms every step — the surviving buildings and new construction all carry the weight of that history.",
  },
  {
    name: "Fulton Street Books and Coffee Tulsa",
    description: "Tulsa's only Black-owned bookstore in downtown Greenwood, opened in 2020 amid national protests against police brutality — a powerful symbol of how communities respond to crisis by building institutions.",
    category: "bookstore", ethnic_community: "African American",
    city: "Tulsa", state: "OK",
    pin_type: "business_bookstore", listing_status: "staged",
    visit_tip: "This bookstore was born out of a moment of national reckoning and it carries that origin in its curation — every book here was chosen to respond to that moment with depth and care.",
  },
  {
    name: "Southwest Trading Company Tulsa",
    description: "A Native American community hub downtown offering jewelry, pottery, blankets, apparel, and fine art — providing a platform for Indigenous artisans while educating visitors about Native American artistic traditions.",
    category: "retail", ethnic_community: "Indigenous",
    city: "Tulsa", state: "OK",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "Ask the staff about the provenance of each item — authentic Native American art carries a story about the artist's nation and tradition that makes the work significantly more meaningful.",
  },
  {
    name: "918 Maple Tacos and Catering Tulsa",
    description: "Owned by Jose Bamarca from Guatemala in East Tulsa — growing from a successful catering operation into a full restaurant, representing the entrepreneurial journey of Central American immigrants building from the ground up.",
    category: "restaurant", ethnic_community: "Guatemalan",
    city: "Tulsa", state: "OK",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Sisserou's Caribbean Restaurant Tulsa",
    description: "Authentic Caribbean cuisine in the Tulsa Arts District, bringing the island flavors of the Caribbean diaspora to Oklahoma — a rare and welcome taste of the islands in the American heartland.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Tulsa", state: "OK",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // JACKSON, MS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Mississippi Civil Rights Museum",
    description: "A comprehensive museum dedicated to the history of the American Civil Rights Movement in Mississippi, featuring interactive exhibits and artifacts — Mississippi was the most dangerous state in the movement and this museum honors that.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Jackson", state: "MS", address: "222 North Street, Jackson, MS 39201",
    year_established: 2017, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The 'Mississippi Freedom' gallery is the most comprehensive documentation of Mississippi's civil rights history anywhere — allow at least 2 hours for the full museum experience.",
  },
  {
    name: "Medgar and Myrlie Evers Home National Monument",
    description: "The preserved home of civil rights leader Medgar Evers, assassinated in his driveway in 1963 — a modest ranch-style home that tells the story of a family living under constant threat for their commitment to justice.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Jackson", state: "MS", address: "2332 Margaret W Alexander Dr, Jackson, MS 39213",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Standing in the driveway where Medgar Evers was shot is one of the most sobering civil rights experiences in America — the preserved home connects his sacrifice to a recognizable human life.",
  },
  {
    name: "Farish Street Historic District",
    description: "Once known as the 'Black Mecca of Mississippi' with over 200 Black-owned businesses, Farish Street was the economic and cultural hub of Jackson's Black community during the Jim Crow era.",
    category: "heritage_district", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Jackson", state: "MS",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Tougaloo College",
    description: "A historic HBCU that played a crucial role in the Civil Rights Movement, serving as a safe haven for activists and organizing center when no other institution would — its students among the bravest participants in sit-ins and freedom rides.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Jackson", state: "MS", address: "500 W County Line Rd, Tougaloo, MS 39174",
    year_established: 1869, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "Tougaloo's civil rights archive and the campus environment that sheltered activists when Mississippi was most dangerous makes this HBCU one of the most historically important in the American South.",
  },
  {
    name: "Bully's Restaurant Jackson",
    description: "A legendary soul food restaurant in West Jackson known for its authentic Southern cooking and deep roots in the local Black community — the definition of unpretentious, authentic, and deeply loved.",
    category: "restaurant", ethnic_community: "African American",
    city: "Jackson", state: "MS",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Bully's is Jackson's soul food institution — the smothered chicken and vegetables cooked in rich pot liquor represent the culinary tradition of Mississippi's Black community at its purest.",
  },
  {
    name: "Little Haiti Caribbean Jackson",
    description: "A newly opened authentic Caribbean restaurant on North State Street offering traditional Haitian dishes — bringing the flavors of Haiti to Jackson's growing Caribbean community.",
    category: "restaurant", ethnic_community: "Haitian",
    city: "Jackson", state: "MS",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TAMPA, FL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Ybor City Museum State Park",
    description: "A museum dedicated to the history of Ybor City — a historic center of Tampa's 'Barrio Latino,' telling the story of how Cuban, Spanish, and Italian immigrants built a thriving cigar industry and multicultural community.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "Cuban",
    city: "Tampa", state: "FL", address: "1818 E 9th Ave, Tampa, FL 33605",
    year_established: 1886, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Walk the surrounding Ybor City streets after the museum — the historic district's architecture and cigar culture are still visible in the neighborhood itself.",
  },
  {
    name: "Soulwalk Tampa",
    description: "An experience featuring powerful installations and murals celebrating Black culture, history, and artistic expression throughout Tampa — public art that transforms urban spaces into galleries honoring Black heritage.",
    category: "public_art", heritage_category: "mural_public_art", ethnic_community: "African American",
    city: "Tampa", state: "FL",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "mural_or_public_art", listing_status: "staged",
    visit_tip: "The Soulwalk route is designed as a journey through Black Tampa — walking it with intention, following each installation in sequence, tells a continuous story about the community.",
  },
  {
    name: "La Segunda Bakery Tampa",
    description: "A historic Ybor City bakery serving Cuban bread and pastries since 1915 — as one of the oldest Cuban bakeries in the country, La Segunda produces the famous Cuban bread that defines Tampa's sandwich culture.",
    category: "restaurant", ethnic_community: "Cuban",
    city: "Tampa", state: "FL", address: "2512 N 15th St, Tampa, FL 33605",
    year_established: 1915, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The Cuban bread comes out of the oven in the morning — if you arrive early enough, the fresh loaves are as good as bread gets. The Cuban sandwich made with this bread is the Tampa standard.",
  },
  {
    name: "Queen of Sheba Ethiopian Restaurant Tampa",
    description: "A family-owned Ethiopian restaurant in Temple Terrace serving traditional dishes with fresh ingredients — bringing authentic Ethiopian flavors to Tampa's diverse food landscape.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Tampa", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The tibs (sautéed meat with spices) here is prepared with real care — combine it with a vegetarian sampler on injera for the full Ethiopian dining experience.",
  },
  {
    name: "Jerk Hut Island Grille Tampa",
    description: "A Black-owned restaurant featuring Caribbean cuisine in Tampa — bringing the bold flavors of the Caribbean islands to the city with jerk chicken, oxtail, and other island favorites.",
    category: "restaurant", ethnic_community: "Caribbean",
    city: "Tampa", state: "FL",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The jerk chicken here is wood-smoked the authentic Jamaican way — order a side of festival bread to complete the island meal experience.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHARLESTON, SC
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "International African American Museum",
    description: "Located on historic Gadsden's Wharf — where an estimated 100,000 enslaved Africans first set foot in North America — this museum documents the journey of the African diaspora with the African Ancestors Memorial Garden.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Charleston", state: "SC", address: "14 Wharfside St, Charleston, SC 29401",
    year_established: 2023, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Begin at the African Ancestors Memorial Garden before entering the museum — standing on the spot where enslaved Africans first arrived in North America grounds everything you experience inside in a profound way.",
  },
  {
    name: "Mother Emanuel AME Church Charleston",
    description: "Founded in 1816, the oldest AME church in the South — a beacon of faith that endured arson, earthquake, and the 2015 mass shooting killing nine parishioners, continuing to stand as a symbol of forgiveness and strength.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Charleston", state: "SC", address: "110 Calhoun St, Charleston, SC 29401",
    year_established: 1816, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Sunday morning service at Mother Emanuel is open to all — worshipping in the church where the Emanuel Nine were killed and where their families extended forgiveness is one of the most spiritually significant experiences in America.",
  },
  {
    name: "McLeod Plantation Historic Site",
    description: "A former plantation that focuses on the stories of the enslaved people who lived and worked there — unlike most plantation museums, McLeod centers the enslaved experience including their transition to freedom and establishment of a freedmen's community.",
    category: "historic_site", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Charleston", state: "SC", address: "325 Country Club Dr, Charleston, SC 29412",
    admission_free: false, is_accessible: true, is_family_friendly: false,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The guided tour here is explicitly centered on the enslaved people's experience — the guides are some of the most knowledgeable interpreters of plantation history in the Southeast. Book in advance.",
  },
  {
    name: "East Side Neighborhood Charleston",
    description: "A historic neighborhood with a complex history dating back to the 1760s — one of the oldest African American communities in America, where free and enslaved Black people established cultural traditions that persist today.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "Gullah Geechee",
    city: "Charleston", state: "SC",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
    visit_tip: "Walking the East Side with knowledge of its 250-year Black history reveals a community built by extraordinary people — look for the churches, the sweetgrass basket weavers, and the family homes that have withstood it all.",
  },
  {
    name: "Hannibal's Kitchen Charleston",
    description: "A family-owned East Side staple for over 40 years, serving authentic Gullah cuisine like crab and shrimp rice — one of the few places where authentic Gullah cooking can be experienced in its original community context.",
    category: "restaurant", ethnic_community: "Gullah Geechee",
    city: "Charleston", state: "SC",
    year_established: 1984, pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The she-crab soup and rice dishes here are directly descended from West African cooking traditions — this is Gullah cuisine prepared the way it's been made in Charleston's Black community for generations.",
  },
  {
    name: "Bintü Atelier Charleston",
    description: "An intimate East Side eatery offering authentic West African dishes like jollof rice, fufu, and mafe — connecting Charleston's African American community to their West African roots through food.",
    category: "restaurant", ethnic_community: "West African",
    city: "Charleston", state: "SC",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The mafe (West African peanut stew) here traces a direct culinary line from Senegal to the Lowcountry — this is food that tells the story of the African American diaspora in every spoonful.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // TUSKEGEE, AL
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Tuskegee Airmen National Historic Site",
    description: "The museum at Moton Field tells the heroic story of the 'Red Tails' — the first African American military pilots in WWII, who overcame racism at home to fight fascism abroad, proving their excellence and paving the way for military desegregation.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Tuskegee", state: "AL", address: "1616 Chappie James Ave, Tuskegee, AL",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The flight simulator experience here connects you viscerally to what the Tuskegee Airmen did — men who mastered a technology barrier while simultaneously fighting institutional racism. Their courage was double.",
  },
  {
    name: "Tuskegee University",
    description: "Founded in 1881 by Booker T. Washington, this HBCU is a Registered National Historic Landmark — a campus where practical education and self-sufficiency transformed the lives of thousands of Black students and influenced educational philosophy worldwide.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Tuskegee", state: "AL", address: "1200 W Montgomery Rd, Tuskegee, AL",
    year_established: 1881, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The brick buildings on campus were made by students under Booker T. Washington's philosophy of learning by doing — walk the campus knowing that the students literally built their own school with their own hands.",
  },
  {
    name: "The Oaks — Home of Booker T. Washington",
    description: "The historic home of Tuskegee University's founder, offering insights into the life and legacy of Booker T. Washington — a beautifully preserved Victorian home reflecting his philosophy of dignity through achievement.",
    category: "historic_site", heritage_category: "heritage_landmark", ethnic_community: "African American",
    city: "Tuskegee", state: "AL", address: "1212 Old Montgomery Rd, Tuskegee, AL",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The guided tour of Washington's home provides intimate access to the life of one of the most influential African Americans in history — the personal artifacts and family photographs are particularly moving.",
  },
  {
    name: "George Washington Carver Museum Tuskegee",
    description: "Dedicated to the life and work of the renowned scientist and inventor who taught at Tuskegee University for nearly 50 years — Carver's agricultural innovations transformed Southern farming and improved lives across racial lines.",
    category: "museum", heritage_category: "museum_gallery", ethnic_community: "African American",
    city: "Tuskegee", state: "AL", address: "1212 Old Montgomery Rd, Tuskegee, AL",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Blue Seas 2 Restaurant Tuskegee",
    description: "A local favorite on West Martin Luther King Hwy known for delicious seafood and soul food dishes, serving as a community gathering spot for Tuskegee's residents.",
    category: "restaurant", ethnic_community: "African American",
    city: "Tuskegee", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "El Mariachi Mexican Restaurant Tuskegee",
    description: "A highly-rated Mexican restaurant in the Tuskegee area providing authentic cuisine and a vibrant dining experience — serving the growing Latino community and introducing Mexican flavors to the broader area.",
    category: "restaurant", ethnic_community: "Mexican",
    city: "Tuskegee", state: "AL",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COLUMBUS, OH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Bronzeville Neighborhood Columbus",
    description: "The first Black community in the United States, according to local historians — Columbus's Bronzeville neighborhood has deep historical roots in Black community building on the Near East Side.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Columbus", state: "OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "King Arts Complex Columbus",
    description: "A cultural center on Columbus's Near East Side that preserves, presents, and fosters the contributions of African Americans through the arts — providing gallery space, performance venues, and educational programming.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Columbus", state: "OH",
    admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Somali Community Association of Ohio",
    description: "Established in 1996, this Columbus center serves the second-largest Somali community in the United States, providing essential services including language classes, job training, and cultural programming.",
    category: "cultural_center", heritage_category: "community_organization", ethnic_community: "Somali",
    city: "Columbus", state: "OH",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "Columbus has the second-largest Somali community in the United States — this center is the anchor of that community and a window into how refugee communities build their own institutions.",
  },
  {
    name: "Hoyo's Kitchen Columbus",
    description: "A popular North Market eatery offering authentic Somali cuisine — embodying the spirit of family and community while sharing the rich tapestry of Somali flavors with Columbus's diverse food market.",
    category: "restaurant", ethnic_community: "Somali",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Order the rice with beef or goat stew — Somali rice cooking is distinct from any other tradition, fragrant with spices that trace the historical Indian Ocean trade routes.",
  },
  {
    name: "Addis Restaurant Columbus",
    description: "A beloved spot in Northeast Columbus committed to providing excellent and authentic traditional Ethiopian cuisine — serving Columbus's Ethiopian community with dishes prepared with care and authenticity.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
  },
  {
    name: "Simplee Deelicious Soul Food Columbus",
    description: "A Black-owned soul food restaurant and catering service in Columbus offering traditional comfort food — serving the community with authentic Southern cooking for everyday meals and special events.",
    category: "restaurant", ethnic_community: "African American",
    city: "Columbus", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The lunch specials rotate daily and are the best value — ask what's freshest because this kitchen cooks from scratch every morning.",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CINCINNATI, OH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "National Underground Railroad Freedom Center",
    description: "Perched on the Ohio River — the boundary between slavery and freedom — this museum explores the struggle for human freedom rooted in the stories of the Underground Railroad with immense symbolic power.",
    category: "museum", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Cincinnati", state: "OH", address: "50 East Freedom Way, Cincinnati, OH 45202",
    year_established: 2004, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The Freedom's Eternal Flame terrace overlooking the Ohio River is the museum's most emotionally powerful moment — standing here knowing enslaved people crossed this exact water toward freedom is visceral.",
  },
  {
    name: "King Records Studio Building Cincinnati",
    description: "One of the first racially integrated businesses in Cincinnati — this studio recorded James Brown, Bootsy Collins, and dozens of R&B and soul legends across genres in a building that was revolutionary for its integration during segregation.",
    category: "historic_site", heritage_category: "cultural_arts", ethnic_community: "African American",
    city: "Cincinnati", state: "OH", address: "1540 Brewster Ave, Cincinnati, OH 45207",
    year_established: 1943, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "The building where James Brown recorded 'Papa's Got a Brand New Bag' and Bootsy Collins cut his first records is now open for tours — the history of funk began here.",
  },
  {
    name: "Allen Temple AME Church Cincinnati",
    description: "The oldest operating African American church in the area (since 1824), founded to provide freedom for worship and empower the community — 200 years of Black spiritual and community life in Cincinnati.",
    category: "religious_site", heritage_category: "church_faith_landmark", ethnic_community: "African American",
    city: "Cincinnati", state: "OH", address: "7080 Reading Road, Cincinnati, OH 45237",
    year_established: 1824, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "At 200 years old, Allen Temple is one of the oldest continuously operating African American churches in the United States — Sunday services are open to all and the congregation's history is alive in every hymn.",
  },
  {
    name: "Nolia Kitchen Cincinnati",
    description: "An acclaimed Over-the-Rhine restaurant by Chef Jeff Harris serving exquisite Southern comfort food inspired by New Orleans — bringing the flavors of the Crescent City to Cincinnati's historic neighborhood.",
    category: "restaurant", ethnic_community: "African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "Chef Harris's gumbo is the kind that requires days to prepare properly — the depth of flavor reflects a respect for the New Orleans tradition that cannot be faked.",
  },
  {
    name: "blaCk Coffee Lounge Cincinnati",
    description: "A bustling downtown community space and coffee shop decked with Black art, hosting lectures and live music — combining specialty coffee with cultural programming as a gathering place for Cincinnati's Black community.",
    category: "restaurant", ethnic_community: "African American",
    city: "Cincinnati", state: "OH",
    pin_type: "business_coffee", listing_status: "staged",
    visit_tip: "Check the weekly events calendar before you come — the lectures, live music, and community conversations that happen here make this more than a coffee shop. It's a cultural institution.",
  },
  {
    name: "Habesha Ethiopian Restaurant Cincinnati",
    description: "A highly-rated local favorite in Westwood serving authentic and delicious Ethiopian cuisine, including injera and traditional stews — serving Cincinnati's Ethiopian community with traditional flavors and warmth.",
    category: "restaurant", ethnic_community: "Ethiopian",
    city: "Cincinnati", state: "OH",
    pin_type: "business_restaurant", listing_status: "staged",
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NORFOLK, VA
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: "Norfolk State University",
    description: "An HBCU founded in 1935, offering a culturally diverse environment in the Hampton Roads region — home to an African Art Gallery with a significant collection connecting students and community to continental heritage.",
    category: "education", heritage_category: "hbcu", ethnic_community: "African American",
    city: "Norfolk", state: "VA", address: "700 Park Ave, Norfolk, VA 23504",
    year_established: 1935, admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "hbcu", listing_status: "staged",
    visit_tip: "The African Art Gallery at Norfolk State is one of the finest HBCU art collections in the Mid-Atlantic — free and open to the public, it connects the region's African American community to their continental artistic heritage.",
  },
  {
    name: "Attucks Theatre Norfolk",
    description: "Known as the 'Apollo of the South,' this theater was designed, financed, and built by African Americans in 1919 — a remarkable achievement of Black entrepreneurship and artistic ambition during the Jim Crow era.",
    category: "cultural_center", heritage_category: "civil_rights_landmark", ethnic_community: "African American",
    city: "Norfolk", state: "VA", address: "1010 Church St, Norfolk, VA 23510",
    year_established: 1919, admission_free: false, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
    visit_tip: "A performance at the Attucks Theatre is a connection to 100 years of Black artistic excellence in Hampton Roads — the building itself was built by Black hands for Black audiences at a time when that act was radical.",
  },
  {
    name: "Huntersville Historic District Norfolk",
    description: "One of the earliest planned suburban communities for African Americans in Norfolk — a neighborhood representing the aspiration for dignified living that drove Black community planning during the segregation era.",
    category: "heritage_district", heritage_category: "cultural_district", ethnic_community: "African American",
    city: "Norfolk", state: "VA",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_district", listing_status: "staged",
  },
  {
    name: "Philippine Cultural Center of Virginia",
    description: "A hub for the large Filipino community in the Hampton Roads area — the Navy's presence has brought one of the East Coast's largest Filipino populations to this region, and this center preserves their cultural traditions.",
    category: "cultural_center", heritage_category: "cultural_arts", ethnic_community: "Filipino",
    city: "Norfolk", state: "VA", address: "4857 Baxter Rd, Virginia Beach, VA 23462",
    admission_free: true, is_accessible: true, is_family_friendly: true,
    pin_type: "heritage_landmark", listing_status: "staged",
  },
  {
    name: "Only at Rene's Norfolk",
    description: "A local favorite for authentic Filipino cuisine in Norfolk, serving the city's large Filipino Navy community with traditional dishes that connect them to their heritage far from home.",
    category: "restaurant", ethnic_community: "Filipino",
    city: "Norfolk", state: "VA",
    pin_type: "business_restaurant", listing_status: "staged",
    visit_tip: "The sinigang (tamarind soup) here is a taste of the Philippines that the Filipino Navy community depends on — it's the dish that crosses the Pacific and lands on your table with full authenticity.",
  },
  {
    name: "Pure Lagos Norfolk",
    description: "An African art gallery and boutique in Norfolk bringing West African artistic traditions to the Hampton Roads area through curated art and cultural products — a bridge between the diaspora and the continent.",
    category: "retail", ethnic_community: "West African",
    city: "Norfolk", state: "VA",
    pin_type: "business_retail", listing_status: "staged",
    visit_tip: "The curation at Pure Lagos is intentional and educational — ask the owner about the origin of each piece and you'll leave with both an object and a story that connects you to West Africa.",
  },
];

// ─── Coordinate resolver ──────────────────────────────────────────────────────
function resolveCoords(entity: Entity): { lat: number; lng: number; approx: boolean } {
  const key = `${entity.city},${entity.state}`;
  const fallback = CITY_CENTERS[key] ?? { lat: 39.9526, lng: -75.1652 };
  const approx = !entity.address ||
    entity.address.toLowerCase().endsWith(entity.state.toLowerCase()) ||
    entity.address.toLowerCase().includes("area") ||
    entity.address.toLowerCase().includes("various") ||
    entity.address.toLowerCase().includes("(check");
  return { lat: fallback.lat, lng: fallback.lng, approx };
}

// ─── Main seeding function ────────────────────────────────────────────────────
async function seedManusCulturalSites() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log(`\n🌍 Manus Cultural Sites Seed Script`);
  console.log(`   Mode: ${isDryRun ? "DRY RUN (no writes)" : "LIVE"}`);
  console.log(`   Entities to process: ${GUIDE_ENTITIES.length}\n`);

  if (isDryRun) {
    // Summarize by city
    const byCityMap = new Map<string, number>();
    for (const e of GUIDE_ENTITIES) {
      const k = `${e.city}, ${e.state}`;
      byCityMap.set(k, (byCityMap.get(k) ?? 0) + 1);
    }
    console.log("📊 Entity count by city:");
    for (const [city, count] of [...byCityMap.entries()].sort()) {
      console.log(`   ${city.padEnd(28)} → ${count}`);
    }
    const byPinType = new Map<string, number>();
    for (const e of GUIDE_ENTITIES) {
      byPinType.set(e.pin_type, (byPinType.get(e.pin_type) ?? 0) + 1);
    }
    console.log("\n📊 Entity count by pin_type:");
    for (const [pt, count] of [...byPinType.entries()].sort()) {
      console.log(`   ${pt.padEnd(30)} → ${count}`);
    }
    console.log(`\n✅ Total: ${GUIDE_ENTITIES.length} entities`);
    await pool.end();
    return;
  }

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const entity of GUIDE_ENTITIES) {
    const { lat, lng, approx } = resolveCoords(entity);
    const approxFinal = approx || entity.address === undefined;

    try {
      // Check for existing row
      const existingRes = await pool.query(
        `SELECT id FROM cultural_sites
         WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2)
         LIMIT 1`,
        [entity.name, entity.city]
      );

      if (existingRes.rowCount && existingRes.rowCount > 0) {
        // UPDATE — enrich
        await pool.query(
          `UPDATE cultural_sites SET
            description       = COALESCE(NULLIF($1, ''), description),
            category          = COALESCE($2, category),
            heritage_category = COALESCE($3, heritage_category),
            ethnic_community  = COALESCE($4, ethnic_community),
            address           = COALESCE($5, address),
            latitude          = COALESCE($6, latitude),
            longitude         = COALESCE($7, longitude),
            pin_type          = $8,
            visit_tip         = COALESCE($9, visit_tip),
            listing_status    = $10,
            data_source       = 'manus_tour_guide',
            approximate_location = $11
           WHERE LOWER(name) = LOWER($12) AND LOWER(city) = LOWER($13)`,
          [
            entity.description, entity.category, entity.heritage_category ?? null,
            entity.ethnic_community ?? null, entity.address ?? null,
            lat, lng,
            entity.pin_type, entity.visit_tip ?? null,
            entity.listing_status, approxFinal,
            entity.name, entity.city,
          ]
        );
        updated++;
        process.stdout.write("u");
      } else {
        // INSERT
        await pool.query(
          `INSERT INTO cultural_sites (
            name, description, category, heritage_category, subcategory,
            ethnic_community, city, state, address, latitude, longitude,
            era, significance, is_verified, year_established,
            is_accessible, is_family_friendly, admission_free,
            pin_type, visit_tip, listing_status, data_source, approximate_location,
            country, created_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10, $11,
            $12, $13, false, $14,
            $15, $16, $17,
            $18, $19, $20, 'manus_tour_guide', $21,
            'US', NOW()
          )`,
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
          ]
        );
        inserted++;
        process.stdout.write(".");
      }
    } catch (err: any) {
      errors++;
      process.stdout.write("E");
      console.error(`\n❌ Error on "${entity.name}" (${entity.city}): ${err.message}`);
    }
  }

  console.log(`\n\n✅ Done.`);
  console.log(`   Inserted : ${inserted}`);
  console.log(`   Updated  : ${updated}`);
  console.log(`   Errors   : ${errors}`);
  console.log(`   Total    : ${inserted + updated}`);

  await pool.end();
}

// ─── Exported function for admin endpoint ────────────────────────────────────
// Accepts any pool-like object so admin.ts can pass the shared pool
export interface PoolLike {
  query(sql: string, params?: unknown[]): Promise<{ rowCount: number | null; rows: Record<string, unknown>[] }>;
}

export async function seedManusEntities(
  p: PoolLike,
  opts: { dryRun?: boolean } = {}
): Promise<{ inserted: number; updated: number; errors: number; total: number }> {
  if (opts.dryRun) {
    return { inserted: 0, updated: 0, errors: 0, total: GUIDE_ENTITIES.length };
  }
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const entity of GUIDE_ENTITIES) {
    const { lat, lng, approx } = resolveCoords(entity);
    const approxFinal = approx || entity.address === undefined;
    try {
      const existingRes = await p.query(
        `SELECT id FROM cultural_sites WHERE LOWER(name) = LOWER($1) AND LOWER(city) = LOWER($2) LIMIT 1`,
        [entity.name, entity.city]
      );
      if (existingRes.rowCount && existingRes.rowCount > 0) {
        await p.query(
          `UPDATE cultural_sites SET
            description = COALESCE(NULLIF($1, ''), description),
            category = COALESCE($2, category),
            heritage_category = COALESCE($3, heritage_category),
            ethnic_community = COALESCE($4, ethnic_community),
            address = COALESCE($5, address),
            latitude = COALESCE($6, latitude),
            longitude = COALESCE($7, longitude),
            pin_type = $8,
            visit_tip = COALESCE($9, visit_tip),
            listing_status = $10,
            data_source = 'manus_tour_guide',
            approximate_location = $11
           WHERE LOWER(name) = LOWER($12) AND LOWER(city) = LOWER($13)`,
          [entity.description, entity.category, entity.heritage_category ?? null,
           entity.ethnic_community ?? null, entity.address ?? null, lat, lng,
           entity.pin_type, entity.visit_tip ?? null, entity.listing_status,
           approxFinal, entity.name, entity.city]
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
            country, created_at
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,false,$14,$15,$16,$17,$18,$19,$20,'manus_tour_guide',$21,'US',NOW())`,
          [entity.name, entity.description, entity.category,
           entity.heritage_category ?? null, entity.subcategory ?? null,
           entity.ethnic_community ?? null, entity.city, entity.state,
           entity.address ?? null, lat, lng,
           entity.era ?? null, entity.significance ?? null,
           entity.year_established ?? null,
           entity.is_accessible ?? true, entity.is_family_friendly ?? true,
           entity.admission_free ?? null,
           entity.pin_type, entity.visit_tip ?? null,
           entity.listing_status, approxFinal]
        );
        inserted++;
      }
    } catch (err: unknown) {
      errors++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Manus seed error on "${entity.name}" (${entity.city}): ${msg}`);
    }
  }
  return { inserted, updated, errors, total: inserted + updated };
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────
seedManusCulturalSites().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
