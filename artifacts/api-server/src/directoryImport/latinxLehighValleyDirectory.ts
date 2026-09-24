import { createHash } from "node:crypto";

/**
 * A user-supplied working directory, preserved exactly as a source-backed
 * intake dataset. It is not a verification registry and no designation in
 * this file is inferred from a name, address, category, or cuisine.
 */
export const LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE =
  "user_supplied_latinx_lehigh_valley_directory_20260924" as const;
export const LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL =
  "User-supplied Latinx-owned Lehigh Valley working directory (source-reported; unverified)" as const;
export const LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256 =
  "c1fdde96dd1c6403bb64d460ad2197601e0403a6d909cd33469dbc93dbd22c9f" as const;
export const LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LINES = 449 as const;
export const LATINX_LEHIGH_VALLEY_DIRECTORY_POLICY =
  "user-supplied-latinx-lehigh-valley-v1" as const;

export type LatinxDirectorySourceRecord = Readonly<{
  sourceRow: number;
  name: string;
  category: string;
  service?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  notes?: string;
}>;

const SOURCE_RECORDS: readonly LatinxDirectorySourceRecord[] = [
  { sourceRow: 6, name: "AmericaVen, LLC", category: "Advertising, Marketing & Multimedia", service: "AudioVisual, information technology, telecommunications, digital signage, video surveillance, web development", address: "964 Macron Blv", city: "Allentown", state: "PA", postalCode: "18109", phone: "610-849-0474" },
  { sourceRow: 12, name: "Market Source Group", category: "Advertising, Marketing & Multimedia", service: "Promotional products and marketing", address: "1132 Hamilton St, Suite 205", city: "Allentown", state: "PA", phone: "872-228-7458" },
  { sourceRow: 19, name: "Signs & Awnings, Inc.", category: "Advertising, Marketing & Multimedia", service: "Sign manufacturing and signage", address: "944 Marcon Blvd, Suite 130", city: "Allentown", state: "PA", postalCode: "18109", phone: "610-841-2188" },
  { sourceRow: 26, name: "Trilu Media Studios", category: "Advertising, Marketing & Multimedia", service: "Creative agency", address: "1132 Hamilton St, Suite 205", city: "Allentown", state: "PA", phone: "872-228-7458" },
  { sourceRow: 34, name: "LovelyyFaces Spa Lounge, LLC", category: "Beauty, Health & Wellness", service: "Esthetic salon spa lounge", address: "813 Linden St, Suite 12", city: "Bethlehem", state: "PA", postalCode: "18018", phone: "484-561-0052" },
  { sourceRow: 42, name: "Uniquely Lopez", category: "Boutiques & Clothing", service: "Redesign, Dixie Bell paint, unique gifts", address: "3300 Lehigh St", city: "Allentown", state: "PA", phone: "610-330-0165" },
  { sourceRow: 49, name: "Alma & Eva", category: "Coaching, Counseling & Mental Health", service: "Personal development strategy and empowerment events", city: "Lehigh Valley", state: "PA", instagram: "@almaandeva" },
  { sourceRow: 53, name: "Bethlehem Counseling Center & Christian Therapy Associates LLC", category: "Coaching, Counseling & Mental Health", service: "Counseling services", address: "35 E Elizabeth Ave", city: "Bethlehem", state: "PA", phone: "610-867-8657" },
  { sourceRow: 59, name: "C.Bello Enterprises, LLC", category: "Coaching, Counseling & Mental Health", service: "Counseling services", address: "1600 Hamilton St", city: "Allentown", state: "PA", postalCode: "18102", phone: "484-602-5772" },
  { sourceRow: 65, name: "Counseling Solutions LV - CSOLV", category: "Coaching, Counseling & Mental Health", service: "Adolescent and adult mental health, psychiatry, substance use treatment", address: "2030 Tilghman St, Ste 200 & 2022", city: "Allentown", state: "PA", postalCode: "18104", phone: "610-437-2370", instagram: "@csolv101", facebook: "@csolv101" },
  { sourceRow: 72, name: "Sanctuary of Hope Counseling Center", category: "Coaching, Counseling & Mental Health", service: "Counseling private practice", address: "541 E Broad St", city: "Bethlehem", state: "PA", postalCode: "18018", phone: "484-861-4501" },
  { sourceRow: 78, name: "The Missing Piece Coach", category: "Coaching, Counseling & Mental Health", service: "Coaching", city: "Lehigh Valley", state: "PA", phone: "774-253-0675" },
  { sourceRow: 82, name: "QueenSuite Personal & Professional Development", category: "Coaching, Counseling & Mental Health", service: "Personal and professional development", city: "Lehigh Valley", state: "PA", phone: "484-893-0748", instagram: "@queensuitecoach" },
  { sourceRow: 86, name: "Renew Wellness & Psychotherapy, LLC", category: "Coaching, Counseling & Mental Health", service: "Mental health services", address: "641 N 13th St, Suite E-101", city: "Easton", state: "PA", postalCode: "18045", phone: "484-725-0072" },
  { sourceRow: 93, name: "SJ Media Consulting, LLC", category: "Coaching, Counseling & Mental Health", service: "Media consulting", city: "Lehigh Valley", state: "PA", phone: "917-612-9877" },
  { sourceRow: 97, name: "Ask Margies Alterations", category: "Childcare & Educational Services", service: "Alterations", address: "216 2nd Street", city: "Catasauqua", state: "PA", postalCode: "18032", phone: "610-264-7814" },
  { sourceRow: 102, name: "The Caring Place Youth Development Center", category: "Childcare & Educational Services", service: "Youth development", address: "931 Hamilton Street", city: "Allentown", state: "PA", postalCode: "18102", phone: "610-433-5683" },
  { sourceRow: 107, name: "The Child Development Center of Easton", category: "Childcare & Educational Services", service: "Childcare", address: "45 North 9th St", city: "Easton", state: "PA", phone: "908-329-7366" },
  { sourceRow: 113, name: "The Fé Foundation", category: "Childcare & Educational Services", service: "Educational nonprofit", address: "555 Union Blvd", city: "Allentown", state: "PA", phone: "610-841-1128" },
  { sourceRow: 119, name: "Learning Minds Education Center", category: "Childcare & Educational Services", service: "Child care center", address: "1036 N Godfrey St", city: "Allentown", state: "PA", phone: "610-435-0454" },
  { sourceRow: 125, name: "Eazyinks, LLC", category: "Childcare & Educational Services", service: "Educational services", city: "Easton", state: "PA", phone: "862-220-1780" },
  { sourceRow: 129, name: "Edwing Joseph and Sons", category: "Childcare & Educational Services", service: "Custom suits and formal wear", address: "Venture X, 306 S New St, Suite 110", city: "Bethlehem", state: "PA", postalCode: "18015", phone: "201-228-0616" },
  { sourceRow: 135, name: "Endless Innovation Academy", category: "Childcare & Educational Services", service: "Education", address: "2310 South 12 Street", city: "Allentown", state: "PA", phone: "610-841-9997" },
  { sourceRow: 140, name: "Jefotti Designs", category: "Childcare & Educational Services", service: "Design services", city: "Allentown", state: "PA", phone: "484-948-0602" },
  { sourceRow: 144, name: "Kula Children's Center", category: "Childcare & Educational Services", service: "Learning center", address: "1722 S 4th St", city: "Allentown", state: "PA", postalCode: "18103", phone: "484-350-3557" },
  { sourceRow: 150, name: "Palmer Child Care Academy & Learning Center", category: "Childcare & Educational Services", service: "Child care academy", address: "2918 William Penn Highway", city: "Easton", state: "PA", phone: "610-438-8830" },
  { sourceRow: 156, name: "The Ortiz Ark Foundation", category: "Community & Nonprofit", service: "Nonprofit", address: "113 N Ninth St", city: "Allentown", state: "PA", postalCode: "18102", phone: "484-951-0921" },
  { sourceRow: 162, name: "The Unidos Foundation", category: "Community & Nonprofit", service: "Charitable nonprofit", address: "2030 West Tilghman St, Suite 202", city: "Allentown", state: "PA", phone: "484-403-0811" },
  { sourceRow: 169, name: "Computerwkz, LLC", category: "Electronics", service: "Electronics", address: "411 Main Street, Suite 102e", city: "Stroudsburg", state: "PA", postalCode: "18360", phone: "877-295-9552", website: "https://www.computerwkz.co" },
  { sourceRow: 176, name: "Alani Graphics, LLC.", category: "Entertainment & Event Services", service: "Caricatures, branding, graphic design", city: "Lehigh Valley", state: "PA", phone: "484-226-5696", instagram: "@mr.alanij", facebook: "@mr.alanij" },
  { sourceRow: 183, name: "Lehigh Valley Credit Restoration", category: "Financial", service: "Credit restoration", address: "1111 W Broad Street", city: "Bethlehem", state: "PA", postalCode: "18018", phone: "610-865-1000" },
  { sourceRow: 188, name: "Day One Accounting and Financial Services", category: "Financial", service: "Accounting, bookkeeping, payroll and tax services", address: "2785 PA-115 Ste 101", city: "Effort", state: "PA", phone: "800-587-5554", instagram: "@dayoneaccunting" },
  { sourceRow: 195, name: "LAE Financial Service Company", category: "Financial", service: "Mortgage lender and insurances", address: "821 N Glenwood Street", city: "Allentown", state: "PA", postalCode: "18104", phone: "610-432-7769", website: "https://calendly.com/laefinancialservicecompany" },
  { sourceRow: 203, name: "36E Fitness", category: "Fitness", service: "Personal training", address: "1450 Stefko Blvd", city: "Bethlehem", state: "PA", postalCode: "18017", phone: "610-756-7700" },
  { sourceRow: 209, name: "Bodyworks by Kira", category: "Fitness", service: "Fitness", city: "Lehigh Valley", state: "PA", phone: "484-600-1383", facebook: "https://www.facebook.com/bodyworksbykira" },
  { sourceRow: 214, name: "Crossft Lehigh Valley", category: "Fitness", service: "Fitness", address: "1855 Weaversville Road", city: "Allentown", state: "PA", phone: "610-266-1044" },
  { sourceRow: 219, name: "Life Advance Fitness", category: "Fitness", service: "Personal fitness", address: "436 State Ave", city: "Emmaus", state: "PA", phone: "484-273-2156" },
  { sourceRow: 225, name: "The Refinery Fitness", category: "Fitness", service: "Fitness by August", address: "112 Springfield St", city: "Coopersburg", state: "PA", postalCode: "18036" },
  { sourceRow: 232, name: "De Jesus General Contractor", category: "Maintenance, Auto & Moving", service: "Remodeling", city: "Pennsylvania", state: "PA", phone: "914-336-6171" },
  { sourceRow: 237, name: "The Ortiz Ark, LLC", category: "Maintenance, Auto & Moving", service: "Painting and life construction", address: "523 Tilghman St", city: "Allentown", state: "PA", phone: "484-226-8645" },
  { sourceRow: 243, name: "Jaze Properties, LLC", category: "Maintenance, Auto & Moving", service: "Junk removal, power washing, gutter cleaning", city: "Allentown", state: "PA", phone: "610-400-5507" },
  { sourceRow: 248, name: "JCJ Property Maintenance", category: "Maintenance, Auto & Moving", service: "Property maintenance", address: "345 W Lincoln Street", city: "Easton", state: "PA", postalCode: "18042", phone: "484-542-7467" },
  { sourceRow: 253, name: "Legacy Cleanings", category: "Maintenance, Auto & Moving", service: "Cleaning services", city: "Emmaus", state: "PA", postalCode: "18951", phone: "484-560-0549" },
  { sourceRow: 257, name: "All Out Scrap & Junk Removal Service", category: "Maintenance, Auto & Moving", service: "Junk removal", address: "229 S 15th St", city: "Allentown", state: "PA", postalCode: "18103", phone: "610-969-6263" },
  { sourceRow: 262, name: "Beast Moving & Hauling", category: "Maintenance, Auto & Moving", service: "Moving and hauling", city: "Lehigh Valley", state: "PA", phone: "484-661-0132" },
  { sourceRow: 265, name: "WCA Interiors, LLC", category: "Maintenance, Auto & Moving", service: "Interior services", city: "Easton", state: "PA", phone: "610-393-0757" },
  { sourceRow: 269, name: "Belisaire Painting Inc.", category: "Maintenance, Auto & Moving", service: "Painting", city: "Bethlehem", state: "PA", phone: "484-894-1579" },
  { sourceRow: 273, name: "Drain Surgeons Plumbing", category: "Maintenance, Auto & Moving", service: "Plumbing", address: "538 Vine Street", city: "Allentown", state: "PA", postalCode: "18103", phone: "484-903-8963" },
  { sourceRow: 278, name: "Wall2Wall Pest Control Services, LLC", category: "Maintenance, Auto & Moving", service: "Pest control", address: "555 Union Blvd", city: "Allentown", state: "PA", postalCode: "18109", phone: "610-991-6040" },
  { sourceRow: 283, name: "PattyRock Cleaning Services", category: "Maintenance, Auto & Moving", service: "Commercial cleaning", city: "Lehigh Valley", state: "PA", phone: "908-917-8543", facebook: "PattyRoc Cleaning Services" },
  { sourceRow: 290, name: "Brisas del Salvador", category: "Restaurants, Cafes & Dining", service: "Take-out", address: "1428 Butler St", city: "Easton", state: "PA", phone: "484-903-4573" },
  { sourceRow: 296, name: "Casa Catrina Mexican Restaurant", category: "Restaurants, Cafes & Dining", service: "Curbside, delivery and take-out; vegetarian friendly", address: "1905 Brookside Rd", city: "Macungie", state: "PA", phone: "484-656-7177" },
  { sourceRow: 304, name: "Casa de Campo Restaurante", category: "Restaurants, Cafes & Dining", service: "Curbside, delivery and take-out; vegetarian friendly", address: "123 W 4th St", city: "Bethlehem", state: "PA", phone: "610-849-2079" },
  { sourceRow: 311, name: "Don Juan Mex Grill — Easton (William Penn Highway)", category: "Restaurants, Cafes & Dining", service: "Delivery and take-out; vegetarian friendly", address: "2600 William Penn Highway", city: "Easton", state: "PA", phone: "610-438-5661" },
  { sourceRow: 311, name: "Don Juan Mex Grill — Easton (North 3rd Street)", category: "Restaurants, Cafes & Dining", service: "Delivery and take-out; vegetarian friendly", address: "300 N 3rd St", city: "Easton", state: "PA", phone: "610-438-5661" },
  { sourceRow: 311, name: "Don Juan Mex Grill — Emmaus", category: "Restaurants, Cafes & Dining", service: "Delivery and take-out; vegetarian friendly", address: "1328 Chestnut St", city: "Emmaus", state: "PA", phone: "610-438-5661" },
  { sourceRow: 311, name: "Don Juan Mex Grill — Bethlehem", category: "Restaurants, Cafes & Dining", service: "Delivery and take-out; vegetarian friendly", address: "5540 Crawford Dr", city: "Bethlehem", state: "PA", phone: "610-438-5661" },
  { sourceRow: 311, name: "Don Juan Mex Grill — Fogelsville", category: "Restaurants, Cafes & Dining", service: "Delivery and take-out; vegetarian friendly", address: "7751 Glenlivet Dr West", city: "Fogelsville", state: "PA", phone: "610-438-5661" },
  { sourceRow: 334, name: "Cbd Store Whitehall", category: "Restaurants, Cafes & Dining", service: "CBD store", address: "2705 MacArthur Rd", city: "Whitehall", state: "PA", phone: "610-351-0433" },
  { sourceRow: 339, name: "El Super Taco", category: "Restaurants, Cafes & Dining", service: "Curbside and take-out; vegetarian friendly", address: "201 S 12th St", city: "Easton", state: "PA", phone: "610-438-2048" },
  { sourceRow: 347, name: "Green Vida Company", category: "Restaurants, Cafes & Dining", service: "Curbside; vegetarian friendly", address: "1800 Sullivan Trail, Suite 330", city: "Easton", state: "PA", phone: "610-438-4112" },
  { sourceRow: 355, name: "La Bicicleta Arepa Bar", category: "Restaurants, Cafes & Dining", service: "Curbside, delivery and take-out; vegetarian friendly", address: "12 S 8th St", city: "Allentown", state: "PA", phone: "610-871-0809" },
  { sourceRow: 362, name: "Mexico Lindo", category: "Restaurants, Cafes & Dining", service: "Take-out; vegetarian friendly", address: "720 Main St", city: "Bethlehem", state: "PA", phone: "610-691-5141" },
  { sourceRow: 370, name: "Rios Brazilian Steakhouse", category: "Restaurants, Cafes & Dining", service: "Curbside and take-out; vegetarian friendly", address: "127 S Broad St", city: "Nazareth", state: "PA", phone: "610-614-1018" },
  { sourceRow: 377, name: "Tacos y Tequila", category: "Restaurants, Cafes & Dining", service: "Local delivery and take-out", address: "530 Hamilton St", city: "Allentown", state: "PA", phone: "610-351-8226" },
  { sourceRow: 383, name: "Take A Taco", category: "Restaurants, Cafes & Dining", service: "Mobile food business; varying Lehigh Valley locations", city: "Lehigh Valley", state: "PA", phone: "610-393-7100" },
  { sourceRow: 389, name: "Taqueria La Plaza", category: "Restaurants, Cafes & Dining", service: "Take-out", address: "1647 Washington Blvd", city: "Easton", state: "PA", phone: "610-559-6163" },
  { sourceRow: 395, name: "Tierra de Fuego", category: "Restaurants, Cafes & Dining", service: "Curbside, delivery and take-out; vegan friendly", address: "612 Northampton St", city: "Easton", state: "PA", phone: "610-829-2700" },
  { sourceRow: 403, name: "Urbano Mexican Kitchen & Bar", category: "Restaurants, Cafes & Dining", service: "Curbside, delivery and take-out; vegetarian friendly", address: "526 Main St", city: "Bethlehem", state: "PA", phone: "610-419-1736" },
  { sourceRow: 411, name: "Valley Prep Meal Prep", category: "Restaurants, Cafes & Dining", service: "Food meal prep", address: "23 S 9th St", city: "Allentown", state: "PA", phone: "484-903-6300", instagram: "@valleyprep_mealprep", notes: "The supplied source explicitly includes the phrase ‘Minority Owned Business Certified.’" },
  { sourceRow: 419, name: "Khanisa's", category: "Restaurants, Cafes & Dining", service: "Dining", address: "The Market, 27 N 7th St", city: "Allentown", state: "PA", phone: "484-895-8002" },
  { sourceRow: 424, name: "Family Chichen and Waffles", category: "Restaurants, Cafes & Dining", service: "Dining", address: "1800 Sullivan Trail, Suite 360", city: "Easton", state: "PA", phone: "610-438-1882" },
  { sourceRow: 429, name: "D's Touch A' Lacarte Catering", category: "Restaurants, Cafes & Dining", service: "Catering", city: "Lehigh Valley", state: "PA", phone: "484-633-0958" },
  { sourceRow: 432, name: "Mandy Cakes", category: "Restaurants, Cafes & Dining", service: "Baked goods", city: "Lehigh Valley", state: "PA", phone: "484-351-6209" },
  { sourceRow: 436, name: "Kyra's Kreations", category: "Restaurants, Cafes & Dining", service: "Baked goods", city: "Lehigh Valley", state: "PA" },
  { sourceRow: 440, name: "The Bayou Southera Kichen and Bar", category: "Restaurants, Cafes & Dining", service: "Dining", address: "702 Hawthorme Rd", city: "Bethlehem", state: "PA", phone: "610-419-6669" },
  { sourceRow: 447, name: "The Bayou Easton", category: "Restaurants, Cafes & Dining", service: "Dining", address: "64 Centre Square", city: "Easton", state: "PA", postalCode: "18042", phone: "610-829-1700" },
] as const;

function text(value: string | undefined): string | null {
  const normalized = value?.replace(/\s+/g, " ").trim() ?? "";
  return normalized || null;
}

function canonicalText(value: string | undefined): string {
  return (text(value) ?? "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export type LatinxLehighValleyDirectoryProfile = Readonly<{
  id: string;
  sourceRow: number;
  name: string;
  category: string;
  subcategory: string;
  address: string | null;
  city: string;
  state: string;
  country: "United States";
  phone: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  description: string;
  ownershipDesignations: ["Latino / Hispanic-Owned"];
  ownershipClaim: "source_reported_ownership_unverified";
  dataSource: typeof LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE;
  sourceLabel: typeof LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL;
  sourceUrl: null;
  intakeBatchReference: string;
  dedupeKey: string;
  recommendationReason: string;
}>;

export function buildLatinxLehighValleyDirectoryProfiles(): readonly LatinxLehighValleyDirectoryProfile[] {
  return SOURCE_RECORDS.map((record, index) => {
    const city = text(record.city) ?? "Lehigh Valley";
    const state = text(record.state) ?? "PA";
    const address = text(record.address);
    const identity = [
      LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256,
      record.sourceRow,
      index + 1,
      record.name,
      city,
      address ?? "",
    ].join("|");
    const id = `latinx-lv-${createHash("sha256").update(identity).digest("hex").slice(0, 24)}`;
    const service = text(record.service) ?? record.category;
    const suppliedNotes = text(record.notes);
    return {
      id,
      sourceRow: record.sourceRow,
      name: record.name,
      category: record.category,
      subcategory: service,
      address,
      city,
      state,
      country: "United States",
      phone: text(record.phone),
      website: text(record.website),
      instagram: text(record.instagram),
      facebook: text(record.facebook),
      description: suppliedNotes
        ? `${service}. ${suppliedNotes}`
        : service,
      ownershipDesignations: ["Latino / Hispanic-Owned"],
      ownershipClaim: "source_reported_ownership_unverified",
      dataSource: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
      sourceLabel: LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_LABEL,
      sourceUrl: null,
      intakeBatchReference: `${LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE}:${LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE_SHA256}`,
      dedupeKey: [
        LATINX_LEHIGH_VALLEY_DIRECTORY_SOURCE,
        canonicalText(record.name),
        canonicalText(city),
        canonicalText(address ?? String(record.sourceRow)),
      ].join("|"),
      recommendationReason:
        "Source-reported Hispanic-owned in the user-supplied Lehigh Valley working directory; ownership is not verified.",
    };
  });
}

export function assertLatinxLehighValleyDirectoryDataset(): readonly LatinxLehighValleyDirectoryProfile[] {
  const profiles = buildLatinxLehighValleyDirectoryProfiles();
  if (profiles.length !== 77 || new Set(profiles.map((profile) => profile.id)).size !== profiles.length) {
    throw new Error("Latinx Lehigh Valley directory profile identity is inconsistent.");
  }
  return profiles;
}
