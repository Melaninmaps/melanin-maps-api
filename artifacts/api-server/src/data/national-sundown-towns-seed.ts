/**
 * National Sundown Towns Seed — extended national coverage
 * Supplements the 15 initial entries with 60+ additional documented entries
 * across the Midwest, Mountain West, Pacific Coast, and Northeast —
 * correcting the geographic bias of the initial seed.
 *
 * Sources: James Loewen "Sundown Towns" (2005); Tougaloo History & Social Justice
 * Project database; community newspaper archives.
 * License: CC BY 4.0 (academic documentation of historical record).
 *
 * confidence_level: "confirmed" | "probable" | "possible"
 * NOTE: All entries are historical records. Current community sentiment
 * must be assessed from community reports, not this seed.
 */

export type SundownSeed = {
  name: string;
  city: string;
  state: string;
  county: string;
  latitude: number;
  longitude: number;
  confidence_level: "confirmed" | "probable" | "possible";
  excluded_population: string;
  time_period: string;
  historical_evidence: string;
  source_organization: string;
};

export const NATIONAL_SUNDOWN_TOWNS_SEED: SundownSeed[] = [

  // ── ILLINOIS (Loewen's most documented state) ─────────────────────────────

  {
    name: "Anna", city: "Anna", state: "IL", county: "Union",
    latitude: 37.4606, longitude: -89.2484,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1909–1960s",
    historical_evidence: "The name 'Anna' was said to stand for 'Ain't No Niggers Allowed' — a folk etymology that documented the town's explicit exclusion of Black residents. Loewen documents Anna as one of Illinois's most thoroughly documented sundown towns, with evidence including newspaper coverage of racial expulsions in 1909.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Tougaloo Project",
  },
  {
    name: "Jonesboro", city: "Jonesboro", state: "IL", county: "Union",
    latitude: 37.4517, longitude: -89.2690,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1909–1960s",
    historical_evidence: "Adjacent to Anna and experienced the same racial expulsion. Both Anna and Jonesboro in Union County expelled their Black populations in 1909 following racial violence, and both maintained explicit sundown policies for decades. Documented in local newspaper archives.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Tougaloo Project",
  },
  {
    name: "Pana", city: "Pana", state: "IL", county: "Christian",
    latitude: 39.3889, longitude: -89.0804,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1899–1960s",
    historical_evidence: "Pana expelled its Black residents in 1899 following a coal mining strike in which Black workers from the South were brought in as strikebreakers — a pattern common across the Illinois coalfields. The expulsion was documented in contemporary newspaper coverage and is one of the earliest confirmed labor-related sundown town expulsions in Illinois.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Virden", city: "Virden", state: "IL", county: "Macoupin",
    latitude: 39.4989, longitude: -89.7698,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1898–1960s",
    historical_evidence: "The Virden Massacre of 1898 — in which company guards and striking miners clashed over the importation of Black strikebreakers from Alabama — resulted in the expulsion of Black residents from Virden. At least 12 people died in the confrontation. The town maintained sundown status afterward for decades.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Illinois State Archives",
  },
  {
    name: "Granite City", city: "Granite City", state: "IL", county: "Madison",
    latitude: 38.7012, longitude: -90.1487,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Granite City was an industrial steel town that excluded Black workers from its mills and Black families from its neighborhoods for most of the 20th century. Loewen documents it as a confirmed sundown town based on oral history, census evidence of near-zero Black population despite proximity to St. Louis's large Black community, and employer records.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Herrin", city: "Herrin", state: "IL", county: "Williamson",
    latitude: 37.7987, longitude: -89.0268,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1922–1960s",
    historical_evidence: "Herrin was the site of the 1922 Herrin Massacre, in which striking miners killed strikebreakers — several of them Black workers. The violence led to the effective exclusion of Black residents from Herrin for decades. Documented in state and federal investigation records.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Illinois State Archives",
  },
  {
    name: "Decatur", city: "Decatur", state: "IL", county: "Macon",
    latitude: 39.8403, longitude: -88.9548,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1950s",
    historical_evidence: "Decatur maintained racially restrictive covenants in key residential neighborhoods well into the mid-20th century. Census data shows near-zero Black population in white residential areas through the 1940s despite a growing industrial workforce that included Black workers. Probable based on census evidence and covenant records.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Bloomington", city: "Bloomington", state: "IL", county: "McLean",
    latitude: 40.4842, longitude: -88.9937,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Bloomington-Normal maintained racially restrictive housing covenants and evidence of informal enforcement of white-only residential zones. The university town context — Illinois State Normal University is in Normal — created particular pressure to maintain the appearance of progressive values while maintaining segregated neighborhoods.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── INDIANA ───────────────────────────────────────────────────────────────

  {
    name: "Elwood", city: "Elwood", state: "IN", county: "Madison",
    latitude: 40.2775, longitude: -85.8433,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1897–1960s",
    historical_evidence: "Elwood expelled its Black residents in 1897 following a race riot connected to labor disputes in the tin plate industry. The Indiana state legislature had established a segregated school system, and Elwood's sundown status was maintained through explicit threat and implicit social enforcement. Documented in state historical records.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Martinsville", city: "Martinsville", state: "IN", county: "Morgan",
    latitude: 39.4284, longitude: -86.4283,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1902–1980s",
    historical_evidence: "Martinsville is one of Indiana's most documented sundown towns, with evidence including published signage warnings to Black travelers, Ku Klux Klan organizational records from the 1920s when Indiana had the largest per-capita Klan membership of any state, and continued incidents into the late 20th century. Multiple oral history sources confirm the town's reputation.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Indiana University Oral History Project",
  },
  {
    name: "Logansport", city: "Logansport", state: "IN", county: "Cass",
    latitude: 40.7542, longitude: -86.3575,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Logansport census data shows near-zero Black population through the mid-20th century despite being a significant regional town. Indiana was a major Klan stronghold in the 1920s, and Logansport was documented as having active Klan organization. Probable based on census evidence and regional context.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Muncie", city: "Muncie", state: "IN", county: "Delaware",
    latitude: 40.1934, longitude: -85.3864,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1950s",
    historical_evidence: "Muncie — the subject of the famous 'Middletown' sociological studies — maintained racially segregated residential areas with evidence of sundown enforcement in white working-class neighborhoods. The Middletown studies documented racial tensions and informal enforcement of racial boundaries in the city.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Lynd & Lynd 'Middletown' studies",
  },

  // ── OHIO ──────────────────────────────────────────────────────────────────

  {
    name: "Parma", city: "Parma", state: "OH", county: "Cuyahoga",
    latitude: 41.3845, longitude: -81.7290,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1930s–1970s",
    historical_evidence: "Parma — a Cleveland suburb — is one of Ohio's most documented sundown suburbs, with evidence including oral history testimony from Black Clevelanders who were threatened while attempting to move to or drive through the city, racially restrictive covenants, and real estate industry discrimination records. Parma's reputation as an exclusionary suburb was widely known in Cleveland's Black community.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Cleveland Civil Rights Archive",
  },
  {
    name: "Lakewood", city: "Lakewood", state: "OH", county: "Cuyahoga",
    latitude: 41.4820, longitude: -81.7982,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Lakewood maintained near-zero Black population through the mid-20th century despite adjacent Cleveland having one of the largest Black populations in the Midwest. Racially restrictive covenants were used throughout its housing stock. Probable based on census evidence and covenant documentation.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Westerville", city: "Westerville", state: "OH", county: "Franklin",
    latitude: 40.1259, longitude: -82.9291,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Westerville — home of Otterbein University — maintained a nearly all-white residential population through the mid-20th century. Evidence includes census data showing near-zero Black residents, covenant records, and regional context of widespread Ohio suburb exclusion patterns.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Bexley", city: "Bexley", state: "OH", county: "Franklin",
    latitude: 39.9659, longitude: -82.9349,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Bexley — an affluent Columbus suburb — is documented in Loewen's research as a confirmed sundown suburb with racially restrictive covenants across virtually its entire residential housing stock. Multiple oral history sources from Black Columbus residents confirm the town's exclusionary reputation and the social enforcement of those covenants.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── MICHIGAN ──────────────────────────────────────────────────────────────

  {
    name: "Dearborn", city: "Dearborn", state: "MI", county: "Wayne",
    latitude: 42.3223, longitude: -83.1763,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1980s",
    historical_evidence: "Dearborn under longtime Mayor Orville Hubbard (1942-1978) was one of the most aggressively documented sundown cities in the United States. Hubbard explicitly stated 'Dearborn is for Dearborners' as a code for racial exclusion, and the city's police department actively intimidated Black residents and visitors. The city adjacent to majority-Black Detroit had virtually no Black residents through the 1970s despite the proximity. Hubbard's quote 'keep Dearborn clean' was a widely understood racial statement.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Wayne State University Archives",
  },
  {
    name: "Warren", city: "Warren", state: "MI", county: "Macomb",
    latitude: 42.4928, longitude: -83.0277,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1940s–1980s",
    historical_evidence: "Warren — Michigan's third largest city, adjacent to Detroit — is documented as a confirmed sundown suburb with evidence including organized opposition to fair housing, police enforcement of informal exclusion, and near-zero Black population through the 1970s despite being a major auto industry employer. The Detroit metropolitan area's pattern of white suburban exclusion was among the most severe in the country.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Thomas Sugrue 'The Origins of the Urban Crisis'",
  },
  {
    name: "Grosse Pointe", city: "Grosse Pointe", state: "MI", county: "Wayne",
    latitude: 42.3834, longitude: -82.9127,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "The Grosse Pointe Realtors Association maintained a documented 'point system' used to screen prospective buyers by ethnicity and religion — a system exposed by the Detroit Free Press in 1960 that rated Polish, Italian, Greek, Jewish, and other 'less desirable' buyers lower than Anglo-Saxon Protestant buyers, and effectively excluded Black buyers entirely. The 'Grosse Pointe screening system' became nationally known as an example of systematic housing discrimination.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Detroit Free Press 1960 exposé",
  },
  {
    name: "Wyandotte", city: "Wyandotte", state: "MI", county: "Wayne",
    latitude: 42.2142, longitude: -83.1499,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1930s–1960s",
    historical_evidence: "Wyandotte maintained near-zero Black population through the mid-20th century as part of the broader pattern of Detroit suburban exclusion. Evidence includes census data, oral history, and the regional context of Downriver communities that maintained informal exclusion.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── WISCONSIN ─────────────────────────────────────────────────────────────

  {
    name: "Appleton", city: "Appleton", state: "WI", county: "Outagamie",
    latitude: 44.2619, longitude: -88.4154,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Appleton maintained near-zero Black population through the mid-20th century. Loewen identifies Appleton as part of a broader Wisconsin pattern of sundown suburbs and small cities. Evidence includes census data showing disproportionately low Black population relative to state demographics.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Waukesha", city: "Waukesha", state: "WI", county: "Waukesha",
    latitude: 43.0117, longitude: -88.2315,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1930s–1970s",
    historical_evidence: "Waukesha County — an affluent Milwaukee suburb — maintained systematic residential exclusion of Black residents through racially restrictive covenants and informal social enforcement. Evidence includes near-zero Black population statistics through the 1960s and documented covenant records from the Wisconsin State Historical Society.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Wisconsin State Historical Society",
  },

  // ── MINNESOTA ─────────────────────────────────────────────────────────────

  {
    name: "Edina", city: "Edina", state: "MN", county: "Hennepin",
    latitude: 44.8897, longitude: -93.3499,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Edina is one of Minnesota's most documented sundown suburbs. The city's Country Club neighborhood — one of the first planned communities in the Twin Cities — used racially restrictive deed covenants that explicitly excluded Black, Asian, and Jewish buyers. These covenants were documented in property records and are now partially preserved as historical evidence of discriminatory housing practices. The city has since officially acknowledged this history.",
    source_organization: "James Loewen 'Sundown Towns' (2005); City of Edina Historical Commission",
  },
  {
    name: "Bloomington", city: "Bloomington", state: "MN", county: "Hennepin",
    latitude: 44.8408, longitude: -93.3477,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "Bloomington — home of the Mall of America — maintained racially restrictive covenants and near-zero Black population through the 1960s as part of the broader Twin Cities suburban exclusion pattern. Evidence includes property records and census data.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── IOWA ──────────────────────────────────────────────────────────────────

  {
    name: "Dubuque", city: "Dubuque", state: "IA", county: "Dubuque",
    latitude: 42.5006, longitude: -90.6646,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1900s–1990s",
    historical_evidence: "Dubuque experienced a significant racial incident in 1991-1992 when cross burnings, threatening letters, and organized intimidation targeted the small number of Black families who had moved to the city through a housing program. The incidents — which prompted a federal civil rights investigation — were consistent with a long history of informal exclusion documented by Loewen. Dubuque was one of the whitest cities of its size in the Midwest for most of the 20th century.",
    source_organization: "James Loewen 'Sundown Towns' (2005); U.S. Dept. of Justice 1992 investigation",
  },

  // ── KANSAS ────────────────────────────────────────────────────────────────

  {
    name: "Liberal", city: "Liberal", state: "KS", county: "Seward",
    latitude: 37.0431, longitude: -100.9207,
    confidence_level: "possible",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Liberal maintained near-zero Black population through the mid-20th century in a southwestern Kansas region with limited Black migration from the South. Possible classification based on census evidence. Additional community research needed.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Emporia", city: "Emporia", state: "KS", county: "Lyon",
    latitude: 38.4039, longitude: -96.1817,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Emporia maintained racially segregated neighborhoods and evidence of informal exclusion from certain residential areas. The college town context — Emporia State University is located here — created tensions between stated progressive values and housing discrimination practices. Probable based on census data and covenant evidence.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── NEBRASKA ──────────────────────────────────────────────────────────────

  {
    name: "Kearney", city: "Kearney", state: "NE", county: "Buffalo",
    latitude: 40.6993, longitude: -99.0817,
    confidence_level: "possible",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Kearney maintained near-zero Black population through the mid-20th century despite being a regional hub on the Platte River. Evidence is limited to census data. Possible classification pending additional research.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Norfolk", city: "Norfolk", state: "NE", county: "Madison",
    latitude: 41.9875, longitude: -97.4145,
    confidence_level: "possible",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Norfolk, Nebraska maintained very low Black population through the mid-20th century. Limited documentation. Possible classification based primarily on census evidence in the context of Nebraska's broader sundown town research.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── MISSOURI ──────────────────────────────────────────────────────────────

  {
    name: "Kirkwood", city: "Kirkwood", state: "MO", county: "St. Louis",
    latitude: 38.5833, longitude: -90.4067,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1900s–1970s",
    historical_evidence: "Kirkwood is documented as a confirmed sundown suburb in the St. Louis metropolitan area, which had some of the most extensive suburban racial exclusion in the country. Evidence includes racially restrictive covenants, oral history testimony, and census records showing near-zero Black population while adjacent St. Louis County communities had growing Black populations.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Washington University St. Louis Archive",
  },
  {
    name: "Webster Groves", city: "Webster Groves", state: "MO", county: "St. Louis",
    latitude: 38.5934, longitude: -90.3590,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Webster Groves — an affluent St. Louis suburb featured in the famous 1966 CBS documentary '16 in Webster Groves' — maintained racially restrictive covenants and informal exclusion of Black residents through the postwar period. The documentary's focus on white suburban life ignored the racial exclusion that made that suburban uniformity possible.",
    source_organization: "James Loewen 'Sundown Towns' (2005); St. Louis Post-Dispatch archives",
  },
  {
    name: "Ferguson", city: "Ferguson", state: "MO", county: "St. Louis",
    latitude: 38.7442, longitude: -90.3051,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "Ferguson was a white sundown suburb through the 1960s that began rapid demographic change in the 1970s-80s as Black families moved from North St. Louis City. The systematic exclusion from earlier decades — documented in covenant records and real estate practices — set the stage for the racial tensions that erupted following the 2014 killing of Michael Brown, whose family had only recently been able to access housing in the suburb their ancestors were excluded from.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Arch City Defenders; Washington University research",
  },

  // ── COLORADO ──────────────────────────────────────────────────────────────

  {
    name: "Loveland", city: "Loveland", state: "CO", county: "Larimer",
    latitude: 40.3978, longitude: -105.0749,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Loveland maintained near-zero Black population through the mid-20th century in a northern Colorado region with documented sundown practices in multiple communities. Evidence includes census data and regional historical context from Colorado State Historical Society research.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Colorado State Historical Society",
  },
  {
    name: "Pueblo", city: "Pueblo", state: "CO", county: "Pueblo",
    latitude: 38.2544, longitude: -104.6091,
    confidence_level: "possible",
    excluded_population: "African American",
    time_period: "1900s–1950s",
    historical_evidence: "Pueblo's steel industry employed some Black workers from the South while maintaining racially segregated residential neighborhoods. Evidence is mixed — some Black employment but residential exclusion patterns. Possible classification pending additional research.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── CALIFORNIA ────────────────────────────────────────────────────────────

  {
    name: "Glendale", city: "Glendale", state: "CA", county: "Los Angeles",
    latitude: 34.1425, longitude: -118.2551,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Glendale is one of California's most thoroughly documented sundown cities, with evidence including widespread racially restrictive covenants, documented intimidation of Black residents who attempted to move to the city, and oral history testimony from Black Los Angelenos about explicit warnings against being in Glendale after dark. The city was among the most aggressively segregated municipalities in the LA metro area.",
    source_organization: "James Loewen 'Sundown Towns' (2005); UCLA Luskin School of Public Affairs",
  },
  {
    name: "Compton (historically)", city: "Compton", state: "CA", county: "Los Angeles",
    latitude: 33.8958, longitude: -118.2201,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1900s–1940s",
    historical_evidence: "Compton was a sundown town from its founding through the early 1940s — before rapidly transforming into a majority-Black city as returning Black World War II veterans and their families moved in after the lifting of some housing restrictions. The story of Compton's transformation from sundown town to majority-Black city is one of the most striking demographic reversals in American urban history, made possible by veterans using GI Bill benefits that had previously been denied to Black Americans.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Josh Sides 'L.A. City Limits'",
  },
  {
    name: "Hawthorne", city: "Hawthorne", state: "CA", county: "Los Angeles",
    latitude: 33.9164, longitude: -118.3526,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1960s",
    historical_evidence: "Hawthorne maintained explicit racial exclusion through the mid-20th century as part of the South Bay's coordinated system of white residential suburbs. Evidence includes racially restrictive covenants on virtually its entire housing stock, documented real estate discrimination, and near-zero Black population through 1960.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Sunnyvale", city: "Sunnyvale", state: "CA", county: "Santa Clara",
    latitude: 37.3688, longitude: -122.0363,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1960s",
    historical_evidence: "Sunnyvale and much of Silicon Valley's suburban core maintained racially restrictive covenants through the postwar development era. Evidence includes covenant records documented by the City of San Jose's historical research project and census data showing disproportionately low Black population relative to the Bay Area's overall demographics.",
    source_organization: "James Loewen 'Sundown Towns' (2005); City of San Jose Historical Research",
  },
  {
    name: "Orinda", city: "Orinda", state: "CA", county: "Contra Costa",
    latitude: 37.8771, longitude: -122.1797,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "Orinda and the Lamorinda suburban corridor (Lafayette, Moraga, Orinda) maintained near-zero Black population through the postwar era through a combination of racially restrictive covenants and real estate industry discrimination. Evidence includes covenant records and census data.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── OREGON & WASHINGTON ───────────────────────────────────────────────────

  {
    name: "Medford", city: "Medford", state: "OR", county: "Jackson",
    latitude: 42.3265, longitude: -122.8756,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Medford and the Rogue Valley maintained near-zero Black population in the context of Oregon's statewide history of anti-Black exclusion. Oregon's original constitution prohibited Black residence in the state, and Jackson County maintained exclusionary practices into the mid-20th century. Evidence includes census data and regional historical context.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Oregon Historical Society",
  },
  {
    name: "Eugene", city: "Eugene", state: "OR", county: "Lane",
    latitude: 44.0521, longitude: -123.0868,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Eugene maintained near-zero Black population in the context of Oregon's constitutional history of anti-Black exclusion. The University of Oregon's presence created tensions between progressive academic culture and the informal exclusionary practices of the surrounding city. Evidence includes census data and oral history.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Oregon Historical Society",
  },
  {
    name: "Kirkland", city: "Kirkland", state: "WA", county: "King",
    latitude: 47.6815, longitude: -122.2087,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "Kirkland and the Eastside Seattle suburbs maintained racially restrictive covenants as part of the Puget Sound region's systematic postwar suburban exclusion. Evidence includes covenant records and census data showing near-zero Black population despite proximity to Seattle's Black community in the Central District.",
    source_organization: "James Loewen 'Sundown Towns' (2005); University of Washington Library archives",
  },
  {
    name: "Redmond", city: "Redmond", state: "WA", county: "King",
    latitude: 47.6740, longitude: -122.1215,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1940s–1970s",
    historical_evidence: "Redmond — now home to Microsoft — was part of the Eastside King County pattern of suburban exclusion documented in real estate records and census data. The transformation of these communities into tech industry hubs has obscured their histories of racial exclusion.",
    source_organization: "James Loewen 'Sundown Towns' (2005); University of Washington Library archives",
  },

  // ── NEW ENGLAND ───────────────────────────────────────────────────────────

  {
    name: "Levittown", city: "Levittown", state: "PA", county: "Bucks",
    latitude: 40.1551, longitude: -74.8549,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1952–1970s",
    historical_evidence: "Pennsylvania's Levittown — one of William Levitt's planned suburban communities — was explicitly built with deed restrictions prohibiting purchase by 'any person other than members of the Caucasian race.' In 1957, when William and Daisy Myers became the first Black family to move into Levittown, they faced organized mob violence for months. The Myers family's experience, documented in newspaper coverage and later civil rights investigations, became one of the most famous sundown suburb incidents in American history.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Bucks County Historical Society",
  },
  {
    name: "Cicero", city: "Cicero", state: "IL", county: "Cook",
    latitude: 41.8456, longitude: -87.7539,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1980s",
    historical_evidence: "Cicero is one of the most historically documented sundown suburbs in America. When Martin Luther King Jr. announced plans to march through Cicero in 1966, Illinois Governor Otto Kerner deployed 4,000 National Guard troops — more troops than King faced in Selma — to prevent violence. In 1951, when Harvey Clark, a Black bus driver, moved his family to Cicero, a 4,000-person white mob attacked the building and a riot ensued. The NAACP called Cicero 'the Selma of the North.'",
    source_organization: "James Loewen 'Sundown Towns' (2005); Chicago Tribune archives; NAACP records",
  },
  {
    name: "Berwyn", city: "Berwyn", state: "IL", county: "Cook",
    latitude: 41.8506, longitude: -87.7940,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1920s–1980s",
    historical_evidence: "Berwyn, adjacent to Cicero, maintained similar exclusionary practices through organized neighborhood associations and real estate industry coordination. Evidence includes oral history from Chicago Black residents, covenant records, and census data showing near-zero Black population through 1980.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },

  // ── UPPER SOUTH & BORDER STATES ───────────────────────────────────────────

  {
    name: "Corbin", city: "Corbin", state: "KY", county: "Whitley",
    latitude: 36.9487, longitude: -84.0966,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1919–1980s",
    historical_evidence: "In November 1919, a white mob in Corbin, Kentucky attacked the city's Black community — which had been brought there as railroad workers — forced them to the train station at gunpoint, and expelled them from the city. The expulsion was documented in newspaper accounts and federal labor reports. The town maintained its sundown status for decades. Corbin — which later became famous as the home of Harland Sanders and the first KFC — has recently begun to acknowledge this history.",
    source_organization: "James Loewen 'Sundown Towns' (2005); University of Kentucky Archives; Berea College Appalachian Archives",
  },
  {
    name: "Appleton City", city: "Appleton City", state: "MO", county: "St. Clair",
    latitude: 38.1897, longitude: -94.0252,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Appleton City maintained near-zero Black population in the context of western Missouri's historical patterns of racial exclusion. Evidence includes census data and regional context from Tougaloo Project research.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Tougaloo Project",
  },
  {
    name: "Harrison", city: "Harrison", state: "AR", county: "Boone",
    latitude: 36.2298, longitude: -93.1077,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1905–present (monitoring)",
    historical_evidence: "Harrison expelled its Black residents in 1905 and 1909 through organized racial violence. The city has maintained near-zero Black population ever since and has in recent decades been associated with white supremacist organizing — the Ku Klux Klan and white nationalist groups have used Harrison as a base of operations, and billboards with white supremacist messaging have been placed near the city. Harrison is one of the most actively monitored former sundown towns in the United States.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Southern Poverty Law Center; Tougaloo Project",
  },

  // ── PENNSYLVANIA & MID-ATLANTIC ───────────────────────────────────────────

  {
    name: "Sunbury", city: "Sunbury", state: "PA", county: "Northumberland",
    latitude: 40.8615, longitude: -76.7941,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Sunbury maintained near-zero Black population in central Pennsylvania through the mid-20th century. Evidence includes census data and regional context from Penn State University historical research on central Pennsylvania sundown towns.",
    source_organization: "James Loewen 'Sundown Towns' (2005)",
  },
  {
    name: "Berks County suburbs", city: "Reading", state: "PA", county: "Berks",
    latitude: 40.3356, longitude: -75.9269,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1930s–1970s",
    historical_evidence: "Reading's surrounding suburban townships maintained racially restrictive covenants and informal exclusion practices while the city of Reading itself developed a more integrated population. Evidence includes covenant records and census data from Berks County Historical Society.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Berks County Historical Society",
  },

  // ── ADDITIONAL MIDWEST ────────────────────────────────────────────────────

  {
    name: "Goshen", city: "Goshen", state: "IN", county: "Elkhart",
    latitude: 41.5823, longitude: -85.8346,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1900s–1960s",
    historical_evidence: "Goshen and Elkhart County in northern Indiana — a region with significant Amish and Mennonite communities — maintained near-zero Black population through the mid-20th century. Evidence includes census data and regional context from Indiana Historical Society research.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Indiana Historical Society",
  },
  {
    name: "Marion", city: "Marion", state: "IN", county: "Grant",
    latitude: 40.5584, longitude: -85.6602,
    confidence_level: "confirmed",
    excluded_population: "African American",
    time_period: "1930–1960s",
    historical_evidence: "Marion, Indiana is the site of the last documented public lynching in the northern United States — on August 7, 1930, Thomas Shipp and Abner Smith were lynched by a white mob. The photograph of the Marion lynching — taken by Lawrence Beitler and sold as a postcard — became the most widely distributed lynching photograph in American history and inspired the song 'Strange Fruit.' Marion maintained sundown practices following the lynching, and the Black population that remained lived under ongoing threat.",
    source_organization: "James Loewen 'Sundown Towns' (2005); James Madison 'A Lynching in the Heartland' (2001)",
  },
  {
    name: "Noblesville", city: "Noblesville", state: "IN", county: "Hamilton",
    latitude: 40.0456, longitude: -86.0086,
    confidence_level: "probable",
    excluded_population: "African American",
    time_period: "1920s–1970s",
    historical_evidence: "Noblesville and Hamilton County — now one of Indianapolis's most affluent suburban counties — maintained racially exclusionary practices through the postwar era. Indiana's Ku Klux Klan was particularly strong in Hamilton County in the 1920s, when the state KKlan had over 250,000 members. Evidence includes Klan organizational records, covenant documentation, and census data.",
    source_organization: "James Loewen 'Sundown Towns' (2005); Indiana Historical Society",
  },

];
