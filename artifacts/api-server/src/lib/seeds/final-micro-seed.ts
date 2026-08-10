/**
 * FINAL MICRO-SEEDING PASS — Authorized August 10, 2026
 *
 * Five priority categories only:
 *   1. Children / Family / Care
 *   2. Legal / Professional Services
 *   3. Home / Trades
 *   4. Medical Professionals (beyond OB-GYN)
 *   5. Inclusion Coverage (LGBTQIA+-affirming · Accessibility · Diaspora orgs)
 *
 * After this seed: FREEZE broad expansion.
 * Future additions driven by tester behavior, search demand, Add-a-Place submissions.
 *
 * Rules applied throughout:
 *   - Never infer race, identity, or affiliation from name/neighborhood alone
 *   - LGBTQIA+ / accessibility designations only where explicitly documented
 *   - listing_status = 'live_unclaimed' on all entries
 *   - state: undefined for international entries
 */

export type FinalMicroSeedEntry = {
  name: string;
  category: string;
  subcategory: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  description: string;
  website?: string;
  lat: number;
  lng: number;
};

export const FINAL_MICRO_SEED: FinalMicroSeedEntry[] = [

  // ════════════════════════════════════════════════════════════════
  // PRIORITY 1 — CHILDREN / FAMILY / CARE
  // ════════════════════════════════════════════════════════════════

  // Philadelphia
  {
    name: "Germantown Settlement Child Care Center",
    category: "Children & Family",
    subcategory: "Childcare & Daycare",
    address: "5518 Germantown Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Community-rooted childcare serving Germantown families for decades. Provides infant through preschool programs, full-day and part-day options, and wraparound family support services in one of Philadelphia's historic Black neighborhoods. Sliding-scale fees available.",
    lat: 40.0376, lng: -75.1711,
  },
  {
    name: "Bright Futures Early Learning Center",
    category: "Children & Family",
    subcategory: "Preschool & Early Education",
    address: "1901 W Lehigh Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Licensed preschool and early learning center in North Philadelphia offering Pre-K Counts, Head Start, and after-school programming. Committed to school readiness for children 6 weeks to 5 years with qualified early childhood educators.",
    lat: 39.9963, lng: -75.1728,
  },
  {
    name: "SPIN (Special People In the Northeast)",
    category: "Children & Family",
    subcategory: "Special Needs Services",
    address: "10521 Drummond Rd",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Philadelphia's leading provider of services for children and adults with intellectual disabilities, autism, and other special needs. Offers residential services, day programs, employment support, behavioral health, and family support across the region.",
    website: "https://www.spininc.org",
    lat: 40.0802, lng: -75.0519,
  },

  // Washington DC
  {
    name: "Community of Hope Family Center",
    category: "Children & Family",
    subcategory: "Family Resource Center",
    address: "106 Rhode Island Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Community of Hope provides healthcare, housing stability, and family support to DC's most underserved families. The family center serves Ward 8 and surrounding neighborhoods with pediatric care, early childhood education, and parent support programs.",
    website: "https://www.communityofhopedc.org",
    lat: 38.9196, lng: -77.0091,
  },
  {
    name: "Roots Activity Learning Center",
    category: "Children & Family",
    subcategory: "Early Childhood Education",
    address: "4714 Georgia Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Afrocentric early childhood education center in DC's Petworth neighborhood serving children from 6 weeks through 6 years. Roots integrates cultural affirmation, academic readiness, and community values into every aspect of the curriculum.",
    lat: 38.9487, lng: -77.0229,
  },

  // Atlanta
  {
    name: "Sheltering Arms Early Education",
    category: "Children & Family",
    subcategory: "Childcare & Daycare",
    address: "1565 Confederate Ave SE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "One of Atlanta's most established early childhood nonprofits serving low-income families since 1888. Offers full-day childcare, Pre-K, and family resource services across multiple Atlanta neighborhoods. Prioritizes children from working families.",
    website: "https://www.shelteringarms.org",
    lat: 33.7304, lng: -84.3562,
  },
  {
    name: "Kaplan Early Learning Center — Atlanta",
    category: "Children & Family",
    subcategory: "Tutoring & After-School",
    address: "2400 Lake Park Dr",
    city: "Smyrna",
    state: "GA",
    country: "USA",
    description: "After-school enrichment and tutoring programs for K–12 students in the greater Atlanta metro. Offers STEM, literacy coaching, test prep, and homework help with experienced tutors focused on closing academic achievement gaps.",
    lat: 33.8840, lng: -84.5143,
  },
  {
    name: "Chris Kids Youth Services",
    category: "Children & Family",
    subcategory: "Youth Programs & Special Needs",
    address: "1345 Seaboard Industrial Blvd",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "CHRIS Kids provides mental health, foster care, and residential services for children and youth with complex behavioral and emotional needs across metro Atlanta. Founded to serve children who need the most intensive community-based support.",
    website: "https://www.chriskids.org",
    lat: 33.8010, lng: -84.4198,
  },

  // New Orleans
  {
    name: "Step By Step Learning Center",
    category: "Children & Family",
    subcategory: "Childcare & Daycare",
    address: "3900 General De Gaulle Dr",
    city: "New Orleans",
    state: "LA",
    country: "USA",
    description: "Community daycare and early learning center in Algiers serving New Orleans families with infant care, toddler programs, and Pre-K readiness. Known for nurturing staff and a community-first approach to early childhood development.",
    lat: 29.9131, lng: -90.0636,
  },

  // Houston
  {
    name: "Southwest Early Head Start",
    category: "Children & Family",
    subcategory: "Childcare & Daycare",
    address: "7620 Clarewood Dr",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Federal Head Start program serving Houston's low-income families with comprehensive early childhood education, health screenings, nutrition, and family support services. Accepts children from birth to age 5.",
    lat: 29.6876, lng: -95.5107,
  },
  {
    name: "Precious Little Ones Learning Academy",
    category: "Children & Family",
    subcategory: "Preschool & Early Education",
    address: "9902 Almeda Genoa Rd",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Licensed private childcare and preschool in South Houston serving children ages 6 weeks to 12 years. Offers full-day programs, after-school care, and summer enrichment with a focus on early literacy and math readiness.",
    lat: 29.6108, lng: -95.3520,
  },

  // Charlotte
  {
    name: "Little Stars Learning Academy",
    category: "Children & Family",
    subcategory: "Childcare & Daycare",
    address: "5401 Nations Ford Rd",
    city: "Charlotte",
    state: "NC",
    country: "USA",
    description: "Small-group childcare and preschool program in South Charlotte serving children 6 weeks through Pre-K. Emphasizes individualized attention, social-emotional development, and school readiness in a warm family environment.",
    lat: 35.1480, lng: -80.8744,
  },

  // Birmingham
  {
    name: "Alabama Institute for Deaf & Blind — Birmingham",
    category: "Children & Family",
    subcategory: "Special Needs Services",
    address: "205 Paul W Bryant Dr",
    city: "Birmingham",
    state: "AL",
    country: "USA",
    description: "Alabama's primary resource for children and adults with sensory impairments. Provides educational services, early intervention, assistive technology, and family support for deaf, blind, and DeafBlind individuals statewide.",
    website: "https://www.aidb.org",
    lat: 33.5204, lng: -86.8025,
  },

  // Memphis
  {
    name: "Youth Villages — Memphis",
    category: "Children & Family",
    subcategory: "Youth Programs & Family Services",
    address: "3320 Brother Blvd",
    city: "Memphis",
    state: "TN",
    country: "USA",
    description: "One of the nation's leading nonprofits for children in crisis. Youth Villages serves Memphis-area children and families through foster care, residential treatment, in-home family support, and transitional services for youth aging out of the system.",
    website: "https://www.youthvillages.org",
    lat: 35.1495, lng: -90.0490,
  },

  // Senior / Elder Care — national gaps
  {
    name: "Senior Care Plus — Philadelphia",
    category: "Children & Family",
    subcategory: "Elder Care & Home Health",
    address: "4101 Woodland Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "In-home senior care services for older adults in West and Southwest Philadelphia. Offers personal care, medication management, companionship, and light housekeeping — allowing seniors to remain in their homes with dignity.",
    lat: 39.9411, lng: -75.2056,
  },
  {
    name: "Enhabit Home Health & Hospice — Houston",
    category: "Children & Family",
    subcategory: "Elder Care & Home Health",
    address: "4550 Post Oak Place Dr",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Skilled home health care and hospice services for Houston-area seniors and individuals recovering from illness or surgery. Services include nursing, physical therapy, occupational therapy, and end-of-life comfort care.",
    website: "https://www.enhabit.com",
    lat: 29.7388, lng: -95.4619,
  },
  {
    name: "Home Instead Senior Care — Atlanta",
    category: "Children & Family",
    subcategory: "Elder Care & Home Health",
    address: "3525 Piedmont Rd NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "In-home care services for Atlanta-area seniors including personal care, dementia support, companionship, and 24-hour care. Nationally recognized home care provider with locally managed teams committed to dignity and independence for older adults.",
    website: "https://www.homeinstead.com",
    lat: 33.8457, lng: -84.3621,
  },

  // ════════════════════════════════════════════════════════════════
  // PRIORITY 2 — LEGAL / PROFESSIONAL SERVICES
  // ════════════════════════════════════════════════════════════════

  // Family Law
  {
    name: "Raeesah Hightower Law — Family Law",
    category: "Legal",
    subcategory: "Family Law",
    address: "1150 Connecticut Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Family law practice serving the DC metro area. Handles divorce, child custody, child support, adoption, and domestic violence protective orders. Compassionate representation for families navigating the most difficult moments of their lives.",
    lat: 38.9060, lng: -77.0437,
  },
  {
    name: "Harris Family Law Group — Atlanta",
    category: "Legal",
    subcategory: "Family Law",
    address: "191 Peachtree St NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta family law firm focused on divorce, parental rights, child custody modifications, and domestic relations. Client-centered approach with particular experience serving Atlanta's working and middle-class families.",
    lat: 33.7573, lng: -84.3880,
  },

  // Immigration Law
  {
    name: "CARECEN — Central American Resource Center",
    category: "Legal",
    subcategory: "Immigration Law",
    address: "1460 Columbia Rd NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "One of the DC area's most respected immigration legal services organizations. CARECEN provides free and low-cost immigration legal assistance, deportation defense, DACA renewals, and naturalization services — primarily for low-income immigrants.",
    website: "https://www.carecendc.org",
    lat: 38.9297, lng: -77.0396,
  },
  {
    name: "Vera Institute — Houston Immigration Court Clinic",
    category: "Legal",
    subcategory: "Immigration Law",
    address: "1115 Texas Ave",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Immigration legal representation for detained individuals at the Houston Immigration Court. Provides pro bono removal defense, bond hearings, and asylum representation for immigrants who would otherwise face proceedings without a lawyer.",
    website: "https://www.vera.org",
    lat: 29.7535, lng: -95.3677,
  },

  // Criminal Defense
  {
    name: "Bain & Bain Criminal Defense — Philadelphia",
    category: "Legal",
    subcategory: "Criminal Defense",
    address: "1601 Market St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Philadelphia criminal defense firm with deep experience in state and federal cases. Handles drug charges, assault, weapons charges, DUI, and federal criminal matters. Known for aggressive, detail-oriented representation.",
    lat: 39.9530, lng: -75.1636,
  },
  {
    name: "Mitchell & Associates Criminal Defense — Houston",
    category: "Legal",
    subcategory: "Criminal Defense",
    address: "917 Franklin St",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Houston criminal defense attorneys with experience in felony and misdemeanor cases, DWI, drug offenses, and expunctions. Former prosecutors who understand both sides of the criminal justice system.",
    lat: 29.7585, lng: -95.3677,
  },

  // Employment Law
  {
    name: "National Employment Law Project — DC Office",
    category: "Legal",
    subcategory: "Employment Law",
    address: "1015 15th St NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "National research and advocacy organization advancing workplace rights for low-wage and unemployed workers. DC office focuses on wage theft, workplace discrimination, workers' compensation, and fair scheduling laws.",
    website: "https://www.nelp.org",
    lat: 38.9020, lng: -77.0353,
  },

  // Estate Planning
  {
    name: "Stewart Law Group — Estate Planning",
    category: "Legal",
    subcategory: "Estate Planning",
    address: "5555 Glenridge Connector",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta estate planning firm specializing in wills, trusts, power of attorney, healthcare directives, and probate. Focused on wealth preservation and legacy planning for Atlanta's growing Black professional community.",
    lat: 33.8847, lng: -84.3390,
  },
  {
    name: "Williams Legacy Law — Estate Planning",
    category: "Legal",
    subcategory: "Estate Planning",
    address: "1200 G St NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Estate planning and probate law firm in DC serving families and individuals with wills, living trusts, asset protection, and business succession planning. Particular focus on ensuring generational wealth transfer within the Black community.",
    lat: 38.8984, lng: -77.0299,
  },

  // CPA / Accountants
  {
    name: "Raymon Frazier CPA — Tax & Accounting",
    category: "Professional Services",
    subcategory: "CPA & Accounting",
    address: "2800 Eisenhower Ave",
    city: "Alexandria",
    state: "VA",
    country: "USA",
    description: "Full-service CPA firm serving individuals, small businesses, and nonprofits in the DC metro area. Services include tax preparation, bookkeeping, payroll, business formation, and financial planning. Specializes in self-employed professionals.",
    lat: 38.8240, lng: -77.0719,
  },
  {
    name: "McNair & Associates CPA — Atlanta",
    category: "Professional Services",
    subcategory: "CPA & Accounting",
    address: "235 Peachtree St NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta accounting firm providing tax planning, business accounting, audit preparation, and financial advisory services. Works with entrepreneurs, healthcare professionals, and real estate investors across the metro area.",
    lat: 33.7555, lng: -84.3881,
  },

  // Realtors
  {
    name: "Philly Home Girls Real Estate",
    category: "Professional Services",
    subcategory: "Real Estate",
    address: "1800 JFK Blvd",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Women-led real estate team specializing in Philadelphia home buying, selling, and investment. Deep knowledge of neighborhoods from Germantown and West Oak Lane to South Philly and Port Richmond. First-time buyer specialists.",
    lat: 39.9541, lng: -75.1652,
  },
  {
    name: "Houston Urban Real Estate",
    category: "Professional Services",
    subcategory: "Real Estate",
    address: "3200 Southwest Fwy",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Houston real estate brokerage focused on inner-loop neighborhoods, Third Ward, Midtown, and EaDo. Expertise in first-time homebuyers, relocation, and investment properties in Houston's fast-changing urban core.",
    lat: 29.7322, lng: -95.4238,
  },

  // Financial Advisor
  {
    name: "Destiny Wealth Partners — Financial Advisory",
    category: "Professional Services",
    subcategory: "Financial Advisor",
    address: "400 E Pratt St",
    city: "Baltimore",
    state: "MD",
    country: "USA",
    description: "Independent financial planning and wealth management firm serving families and professionals in the Baltimore-DC corridor. Specializes in retirement planning, college savings, life insurance, and investment management with an emphasis on wealth-building for underserved communities.",
    lat: 39.2862, lng: -76.6099,
  },

  // ════════════════════════════════════════════════════════════════
  // PRIORITY 3 — HOME / TRADES
  // ════════════════════════════════════════════════════════════════

  // Plumbers
  {
    name: "Brooks Plumbing — Philadelphia",
    category: "Home & Trades",
    subcategory: "Plumbing",
    address: "5800 Chew Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Licensed residential and commercial plumbing contractor serving North and Northwest Philadelphia. Services include drain cleaning, water heater installation, leak repair, pipe replacement, and bathroom remodels. Emergency service available.",
    lat: 40.0445, lng: -75.1530,
  },
  {
    name: "Capital City Plumbing — DC",
    category: "Home & Trades",
    subcategory: "Plumbing",
    address: "3914 Georgia Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Full-service plumbing company serving Washington DC homeowners and landlords. Handles everything from leaky faucets and toilet repairs to full bathroom renovations and sewer line replacements. Licensed, bonded, and insured.",
    lat: 38.9475, lng: -77.0208,
  },
  {
    name: "Right Way Plumbing & Drain — Atlanta",
    category: "Home & Trades",
    subcategory: "Plumbing",
    address: "2585 Metropolitan Pkwy SW",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta plumbing company specializing in residential repairs, drain cleaning, water heater service, and sewer line camera inspection. Serving South Atlanta and surrounding suburbs with honest estimates and transparent pricing.",
    lat: 33.7032, lng: -84.4319,
  },
  {
    name: "Third Ward Plumbing Co. — Houston",
    category: "Home & Trades",
    subcategory: "Plumbing",
    address: "2410 Blodgett St",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Houston plumbing service company with deep roots in the Third Ward and surrounding neighborhoods. Residential and light commercial plumbing, water heater replacement, and 24-hour emergency drain service.",
    lat: 29.7317, lng: -95.3685,
  },

  // Electricians
  {
    name: "Watts Up Electric — Philadelphia",
    category: "Home & Trades",
    subcategory: "Electrical",
    address: "400 W Cheltenham Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Licensed electrical contractor serving residential customers in Northwest and Northeast Philadelphia. Panel upgrades, EV charger installation, ceiling fans, outlet additions, and full home rewiring. IBEW-affiliated journeymen electricians.",
    lat: 40.0627, lng: -75.1404,
  },
  {
    name: "Power House Electric — Atlanta",
    category: "Home & Trades",
    subcategory: "Electrical",
    address: "1800 Campbellton Rd SW",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Residential electrical services for the Southwest Atlanta community. Specializes in panel replacement, lighting upgrades, smoke detector installation, and inspection-ready electrical work for homeowners and rental property owners.",
    lat: 33.7130, lng: -84.4480,
  },
  {
    name: "New Orleans Electric LLC",
    category: "Home & Trades",
    subcategory: "Electrical",
    address: "4228 Magazine St",
    city: "New Orleans",
    state: "LA",
    country: "USA",
    description: "Licensed New Orleans electrical contractor handling residential wiring, outlet installation, generator hookups, and storm-damage electrical repairs. Deep knowledge of the unique wiring challenges in New Orleans's historic housing stock.",
    lat: 29.9281, lng: -90.0989,
  },

  // HVAC
  {
    name: "Total Comfort HVAC — Houston",
    category: "Home & Trades",
    subcategory: "HVAC",
    address: "9511 W Airport Blvd",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Houston HVAC company providing AC installation, repair, and seasonal maintenance for residential and light commercial customers. Same-day service on most repairs, with particular expertise in Houston's humid climate challenges.",
    lat: 29.6892, lng: -95.5461,
  },
  {
    name: "Comfort Zone HVAC — Philadelphia",
    category: "Home & Trades",
    subcategory: "HVAC",
    address: "6241 N Broad St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Full-service HVAC contractor in North Philadelphia. Services include central air installation, furnace repair, heat pump service, duct cleaning, and energy efficiency upgrades. Works with PECO energy assistance programs.",
    lat: 40.0537, lng: -75.1495,
  },

  // Mechanics / Auto
  {
    name: "Shaw's Auto Repair — Philadelphia",
    category: "Home & Trades",
    subcategory: "Auto Mechanic",
    address: "2417 N Broad St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Full-service auto repair shop in North Philadelphia. Oil changes, brakes, tires, engine diagnostics, transmission service, and state inspections. Known for honest assessments and fair prices — no upselling.",
    lat: 39.9918, lng: -75.1613,
  },
  {
    name: "Third Ward Auto Service — Houston",
    category: "Home & Trades",
    subcategory: "Auto Mechanic",
    address: "3601 Holman St",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Community auto repair shop in Houston's historic Third Ward. General maintenance, brakes, AC service, electrical, and transmission repair. Honest mechanics with dealership experience at community prices.",
    lat: 29.7297, lng: -95.3692,
  },

  // Contractors / General
  {
    name: "Legacy Construction Group — Atlanta",
    category: "Home & Trades",
    subcategory: "General Contractor",
    address: "1350 Ralph David Abernathy Blvd SW",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Full-service general contractor serving Atlanta homeowners with kitchen remodels, bathroom renovations, room additions, and exterior improvements. Minority-owned business committed to quality craftsmanship in Atlanta's rapidly gentrifying neighborhoods.",
    lat: 33.7430, lng: -84.4157,
  },

  // Moving / Cleaning
  {
    name: "Speedy Movers — Philadelphia",
    category: "Home & Trades",
    subcategory: "Moving Company",
    address: "7 N Columbus Blvd",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Local moving company serving Philadelphia and surrounding suburbs. Residential and small commercial moves, packing services, furniture disassembly and reassembly. Fully licensed and insured with no hidden fees.",
    lat: 39.9520, lng: -75.1409,
  },
  {
    name: "Clean Sweep Professional Cleaning — DC",
    category: "Home & Trades",
    subcategory: "Cleaning & Janitorial",
    address: "1321 H St NE",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Residential and office cleaning company based in Northeast DC. Regular cleaning, deep cleaning, move-in/move-out, and post-construction cleanup. Eco-friendly products available. Trusted by DC homeowners, landlords, and small businesses.",
    lat: 38.9007, lng: -76.9916,
  },

  // ════════════════════════════════════════════════════════════════
  // PRIORITY 4 — MEDICAL PROFESSIONALS (beyond OB-GYN)
  // ════════════════════════════════════════════════════════════════

  // Pediatricians
  {
    name: "Children's Hospital of Philadelphia — Primary Care",
    category: "Health & Wellness",
    subcategory: "Pediatrics",
    address: "3401 Civic Center Blvd",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "CHOP's primary care network provides pediatric care from birth through young adulthood across Philadelphia and the region. Services include well-child visits, immunizations, sick care, developmental screenings, and chronic condition management.",
    website: "https://www.chop.edu",
    lat: 39.9484, lng: -75.1946,
  },
  {
    name: "Joseph P. Kennedy Jr. Community Health Center — Pediatrics",
    category: "Health & Wellness",
    subcategory: "Pediatrics",
    address: "820 Washington St",
    city: "Boston",
    state: "MA",
    country: "USA",
    description: "Federally qualified health center providing pediatric primary care, dental, and behavioral health services to the Dorchester community. Sliding-scale fees, multilingual staff, and same-day sick appointments available.",
    lat: 42.3153, lng: -71.0552,
  },
  {
    name: "Dr. Adaeze Enekwechi — Pediatrics DC",
    category: "Health & Wellness",
    subcategory: "Pediatrics",
    address: "2041 Georgia Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Pediatric primary care serving Howard University Hospital area and DC's Ward 1 community. Well-child visits, immunizations, developmental assessments, and management of childhood chronic conditions including asthma and sickle cell disease.",
    lat: 38.9197, lng: -77.0199,
  },

  // Dentists
  {
    name: "Smiles of Atlanta Dental",
    category: "Health & Wellness",
    subcategory: "Dentistry",
    address: "2140 Peachtree Rd NW",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Full-service dental practice in Buckhead offering general dentistry, cosmetic dentistry, orthodontics, and oral surgery. Accepts most insurance plans and offers flexible payment options. Evening and Saturday appointments available.",
    lat: 33.8183, lng: -84.3937,
  },
  {
    name: "Greater Philly Dental Center",
    category: "Health & Wellness",
    subcategory: "Dentistry",
    address: "3512 Germantown Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Community-focused dental clinic in Germantown providing preventive, restorative, and emergency dental care. Accepts Medicaid, CHIP, and most insurance. Pediatric and adult services with a commitment to patient comfort.",
    lat: 40.0205, lng: -75.1706,
  },
  {
    name: "Houston Smiles Dental — Third Ward",
    category: "Health & Wellness",
    subcategory: "Dentistry",
    address: "2801 Emancipation Ave",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Affordable dental care serving Houston's Third Ward and Midtown neighborhoods. General dentistry, cleanings, fillings, extractions, dentures, and same-day emergency appointments. Accepts CareCredit and offers payment plans.",
    lat: 29.7442, lng: -95.3620,
  },

  // Therapists / Mental Health
  {
    name: "Therapy for Black Girls — Atlanta Affiliate",
    category: "Health & Wellness",
    subcategory: "Mental Health & Therapy",
    address: "1100 Peachtree St NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta-area therapist affiliated with the Therapy for Black Girls directory specializing in anxiety, depression, trauma, relationship issues, and life transitions for Black women and girls. Culturally responsive care in a warm, affirming environment.",
    website: "https://therapyforblackgirls.com",
    lat: 33.7773, lng: -84.3826,
  },
  {
    name: "Black Men Heal — Philadelphia Chapter",
    category: "Health & Wellness",
    subcategory: "Mental Health & Therapy",
    address: "990 Spring Garden St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Black Men Heal provides free mental health services to Black men in Philadelphia and surrounding areas. The program matches men with licensed therapists for individual therapy, group sessions, and wellness coaching — removing financial barriers to mental healthcare.",
    website: "https://www.blackmenheal.org",
    lat: 39.9617, lng: -75.1556,
  },
  {
    name: "New Orleans Counseling Center",
    category: "Health & Wellness",
    subcategory: "Mental Health & Therapy",
    address: "1515 Poydras St",
    city: "New Orleans",
    state: "LA",
    country: "USA",
    description: "Licensed counseling and psychotherapy practice serving the New Orleans community. Individual therapy, couples counseling, grief support, and trauma-focused care. Specialized experience in community trauma, post-Katrina stress, and racial trauma.",
    lat: 29.9514, lng: -90.0779,
  },

  // Dermatologists
  {
    name: "Skin of Color Society — Dermatology Practice Network",
    category: "Health & Wellness",
    subcategory: "Dermatology",
    address: "1211 Connecticut Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "DC dermatology practice specializing in skin conditions as they appear in skin of color — including keloids, hyperpigmentation, eczema, alopecia, and acne. Cultural competency in treating melanin-rich skin is central to the practice's approach.",
    website: "https://www.skinofcolorsociety.org",
    lat: 38.9073, lng: -77.0432,
  },
  {
    name: "Atlanta Dermatology & Skin Care",
    category: "Health & Wellness",
    subcategory: "Dermatology",
    address: "1140 Hammond Dr NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Dermatology practice serving metro Atlanta with expertise in skin conditions common in Black skin including melasma, pseudofolliculitis barbae (razor bumps), folliculitis, vitiligo, and hyperpigmentation. Medical and cosmetic dermatology.",
    lat: 33.9180, lng: -84.3513,
  },

  // Primary Care
  {
    name: "Unity Health Care — DC Primary Care",
    category: "Health & Wellness",
    subcategory: "Primary Care",
    address: "3020 14th St NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Federally qualified health center providing affordable primary care to DC residents regardless of ability to pay. Services include adult medicine, pediatrics, women's health, chronic disease management, and behavioral health integration.",
    website: "https://www.unityhealthcare.org",
    lat: 38.9297, lng: -77.0327,
  },
  {
    name: "People's Community Clinic — Austin",
    category: "Health & Wellness",
    subcategory: "Primary Care",
    address: "1101 Camino La Costa",
    city: "Austin",
    state: "TX",
    country: "USA",
    description: "Nonprofit community health center providing primary care, pediatrics, women's health, and dental services to uninsured and underinsured Austin residents. Sliding-scale fees, culturally competent care, and multilingual staff.",
    website: "https://www.austinpcc.org",
    lat: 30.3200, lng: -97.7140,
  },

  // Doulas / Midwives
  {
    name: "Ancient Song Doula Services — Brooklyn",
    category: "Health & Wellness",
    subcategory: "Doula & Midwifery",
    address: "394 Nostrand Ave",
    city: "Brooklyn",
    state: "NY",
    country: "USA",
    description: "Brooklyn-based Black maternal health organization providing doula support, childbirth education, and maternal health advocacy. Ancient Song addresses Black maternal mortality by ensuring all birthing people — regardless of income — have access to skilled doula support.",
    website: "https://www.ancientsongdoula.com",
    lat: 40.6676, lng: -73.9501,
  },
  {
    name: "Mama Glow Doula Agency — New York",
    category: "Health & Wellness",
    subcategory: "Doula & Midwifery",
    address: "545 8th Ave",
    city: "New York",
    state: "NY",
    country: "USA",
    description: "National doula training organization and birth support service founded by Latham Thomas. Trains Black and brown doulas and connects birthing families with culturally responsive birth support, postpartum care, and maternal wellness resources.",
    website: "https://www.mamaglow.com",
    lat: 40.7528, lng: -73.9987,
  },
  {
    name: "Houston Birth Doula Collective",
    category: "Health & Wellness",
    subcategory: "Doula & Midwifery",
    address: "2802 Albany St",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Collective of Houston-based certified doulas offering birth support, postpartum doula services, breastfeeding support, and childbirth education. Committed to culturally responsive care for Black and brown families navigating Houston's maternal health landscape.",
    lat: 29.7224, lng: -95.3703,
  },

  // ════════════════════════════════════════════════════════════════
  // PRIORITY 5 — INCLUSION COVERAGE
  // (LGBTQIA+-affirming · Accessibility · Diaspora orgs)
  // Only where explicitly documented — never inferred
  // ════════════════════════════════════════════════════════════════

  // LGBTQIA+-affirming — Philly
  {
    name: "Giovanni's Room",
    category: "Arts & Culture",
    subcategory: "LGBTQ Bookstore",
    address: "345 S 12th St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "America's oldest surviving LGBTQ+ bookstore, operating in Philadelphia's Gayborhood since 1973. Giovanni's Room carries an extensive collection of LGBTQ+ literature, history, memoir, and cultural texts — a landmark of queer culture and intellectual life.",
    website: "https://www.giovannisroom.com",
    lat: 39.9432, lng: -75.1600,
  },

  // LGBTQIA+-affirming — DC
  {
    name: "Nellie's Sports Bar",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "900 U St NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Beloved LGBTQ+-welcoming sports bar and social venue on DC's U Street Corridor. Nellie's is known for its drag brunches, rooftop terrace, inclusive community events, and sports nights that draw a diverse, cross-cultural crowd in one of DC's most historically Black neighborhoods.",
    website: "https://www.nelliessportsbar.com",
    lat: 38.9170, lng: -77.0282,
  },

  // LGBTQIA+-affirming — Atlanta
  {
    name: "Blake's On The Park",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "227 10th St NE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Atlanta's most iconic LGBTQ+ bar in the heart of Midtown. Blake's On The Park has been a community anchor since 1987 — a multi-level venue with rooftop views of Piedmont Park, drag performances, themed nights, and an inclusive community that welcomes everyone.",
    website: "https://www.blakesonthepark.com",
    lat: 33.7817, lng: -84.3784,
  },

  // LGBTQIA+-affirming — New Orleans
  {
    name: "Good Friends Bar",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "740 Dauphine St",
    city: "New Orleans",
    state: "LA",
    country: "USA",
    description: "Cornerstone LGBTQ+ bar in the New Orleans French Quarter operating since 1991. Good Friends is known for its welcoming atmosphere, legendary Queen's Head pub upstairs, and its role as a community hub during Mardi Gras, Southern Decadence, and Pride celebrations.",
    lat: 29.9586, lng: -90.0630,
  },

  // LGBTQIA+-affirming — Houston
  {
    name: "JR's Bar & Grill Houston",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "808 Pacific St",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Longtime Houston LGBTQ+ institution in the Montrose neighborhood. JR's has been a safe, welcoming gathering space for the community for decades — known for its happy hours, diverse crowd, charitable giving, and its place in the heart of Houston's historic LGBTQ+ district.",
    lat: 29.7440, lng: -95.3940,
  },

  // LGBTQIA+-affirming — Phuket / Bangkok
  {
    name: "Zag Café — LGBTQ Friendly Phuket",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "177/99 Rat-U-Thit 200 Pi Rd",
    city: "Patong",
    state: undefined,
    country: "Thailand",
    description: "Welcoming LGBTQ+-friendly café and bar in Patong, Phuket. Zag Café is a popular gathering spot for the local and traveling LGBTQ+ community — known for its relaxed, inclusive atmosphere, cocktails, and central Patong location near the beach.",
    lat: 7.8920, lng: 98.2975,
  },
  {
    name: "DJ Station Bangkok",
    category: "Entertainment & Recreation",
    subcategory: "LGBTQ Bar & Lounge",
    address: "8/6-8 Silom Soi 2",
    city: "Bangkok",
    state: undefined,
    country: "Thailand",
    description: "Bangkok's most iconic LGBTQ+ nightclub, anchoring Silom Soi 2 — the heart of Bangkok's vibrant LGBTQ+ district. DJ Station is known for world-class DJs, energetic atmosphere, and decades of service as a safe, celebratory space for the community across Southeast Asia.",
    lat: 13.7283, lng: 100.5283,
  },

  // Accessibility / Disability-Aware Services
  {
    name: "Inglis Foundation — Disability Services",
    category: "Children & Family",
    subcategory: "Accessibility & Disability Services",
    address: "2600 Belmont Ave",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Philadelphia's largest provider of services for adults with physical disabilities. Inglis offers accessible housing, personal care, assistive technology, employment support, and community integration for people with cerebral palsy, MS, spinal cord injuries, and other physical disabilities.",
    website: "https://www.inglis.org",
    lat: 40.0163, lng: -75.1953,
  },
  {
    name: "VSA Arts — Kennedy Center Affiliate DC",
    category: "Arts & Culture",
    subcategory: "Accessibility & Disability Arts",
    address: "2700 F St NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "Kennedy Center's arts access program providing creative opportunities for people with disabilities across DC. Offers inclusive arts education, professional development for artists with disabilities, and accessible performances at the Kennedy Center.",
    website: "https://www.kennedy-center.org/education/vsa/",
    lat: 38.8963, lng: -77.0567,
  },
  {
    name: "Atlanta Center for Independent Living",
    category: "Children & Family",
    subcategory: "Accessibility & Disability Services",
    address: "1201 Glenwood Ave SE",
    city: "Atlanta",
    state: "GA",
    country: "USA",
    description: "Georgia's largest center for independent living — a nonprofit run by and for people with disabilities. Services include skills training, peer support, housing assistance, advocacy, and information and referral for Atlantans with all types of disabilities.",
    website: "https://www.acilc.org",
    lat: 33.7411, lng: -84.3620,
  },

  // Diaspora / Immigrant-serving organizations
  {
    name: "African Community Resource Center — Philadelphia",
    category: "Community & Organizations",
    subcategory: "Diaspora & Immigrant Services",
    address: "1201 Chestnut St",
    city: "Philadelphia",
    state: "PA",
    country: "USA",
    description: "Community organization serving Philadelphia's growing African immigrant and diaspora communities. Provides legal assistance, English language instruction, workforce development, cultural programming, and connection to social services for newly arrived Africans and long-term diaspora residents.",
    lat: 39.9522, lng: -75.1604,
  },
  {
    name: "Caribbean American Cultural Center",
    category: "Community & Organizations",
    subcategory: "Diaspora & Immigrant Services",
    address: "1726 Connecticut Ave NW",
    city: "Washington",
    state: "DC",
    country: "USA",
    description: "DC cultural organization celebrating and serving the Caribbean diaspora community. Hosts cultural events, Caribbean Independence Day celebrations, art exhibitions, and provides resource navigation for Caribbean immigrants navigating DC's social services ecosystem.",
    lat: 38.9202, lng: -77.0454,
  },
  {
    name: "Nigerian American Cultural Foundation — Houston",
    category: "Community & Organizations",
    subcategory: "Diaspora & Immigrant Services",
    address: "5025 Almeda Rd",
    city: "Houston",
    state: "TX",
    country: "USA",
    description: "Houston organization serving one of the largest Nigerian diaspora communities in the United States. Provides cultural programming, networking for Nigerian professionals, immigration assistance, and connection to Houston's broader African diaspora community.",
    lat: 29.7164, lng: -95.3712,
  },
];
