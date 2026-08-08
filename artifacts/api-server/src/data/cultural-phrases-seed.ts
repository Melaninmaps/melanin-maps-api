/**
 * Cultural Phrases & Community Language taxonomy.
 * Extracted from MWM East Coast Tour Guide Part 3 — Section: Cultural Phrases & Community Language.
 * Used by KinfolkAI to make each community feel seen.
 * These phrases are ideal for Kinfolk's voice, recommendation badges, and community endorsements.
 *
 * SENSITIVITY RULES (enforced by the edit-suggestion and KinfolkAI systems):
 * 1. Never use phrases from one culture to describe a business from a DIFFERENT culture.
 * 2. Regional phrases can apply to any business in that region regardless of cultural community.
 * 3. Culture-specific phrases only apply to businesses FROM that culture.
 * 4. When in doubt, use MWM universal language: "Community Loved," "People's Choice," "Put Your People On."
 * 5. Indigenous phrases require extra sensitivity — consult with the community before using specific tribal language.
 */

export interface CulturalPhraseSeed {
  group_name: string;
  phrase: string;
  english_gloss: string;
  is_sensitive: boolean;
}

export interface SensitivityRule {
  rule_text: string;
}

export const CULTURAL_PHRASES_SEED: CulturalPhraseSeed[] = [
  // ── African American ──────────────────────────────────────────────────────
  { group_name: "African American", phrase: "Auntie Approved",        english_gloss: "Trust/Home",                          is_sensitive: false },
  { group_name: "African American", phrase: "Put your people on",     english_gloss: "Community sharing",                   is_sensitive: false },
  { group_name: "African American", phrase: "That's the spot",        english_gloss: "Endorsement",                         is_sensitive: false },
  { group_name: "African American", phrase: "Real ones know",         english_gloss: "Community staple",                    is_sensitive: false },
  // ── Hispanic / Latino ─────────────────────────────────────────────────────
  { group_name: "Hispanic/Latino",  phrase: "Tía Approved",           english_gloss: "Auntie approved",                     is_sensitive: false },
  { group_name: "Hispanic/Latino",  phrase: "Como en casa",           english_gloss: "Like home",                           is_sensitive: false },
  { group_name: "Hispanic/Latino",  phrase: "De confianza",           english_gloss: "Trustworthy/Reliable",                is_sensitive: false },
  { group_name: "Hispanic/Latino",  phrase: "Pa' la familia",         english_gloss: "For the family",                      is_sensitive: false },
  // ── Caribbean (Jamaican) ──────────────────────────────────────────────────
  { group_name: "Caribbean (Jamaican)", phrase: "Yard approved",      english_gloss: "Home/Authentic",                      is_sensitive: false },
  { group_name: "Caribbean (Jamaican)", phrase: "Irie vibes",         english_gloss: "Good/Positive atmosphere",            is_sensitive: false },
  { group_name: "Caribbean (Jamaican)", phrase: "Big up",             english_gloss: "Endorsement/Respect",                 is_sensitive: false },
  { group_name: "Caribbean (Jamaican)", phrase: "Real ting",          english_gloss: "Authentic",                           is_sensitive: false },
  // ── Haitian ───────────────────────────────────────────────────────────────
  { group_name: "Haitian",          phrase: "Lakay",                  english_gloss: "Home/Belonging",                      is_sensitive: false },
  { group_name: "Haitian",          phrase: "Fanmi",                  english_gloss: "Family",                              is_sensitive: false },
  { group_name: "Haitian",          phrase: "Bon Bagay",              english_gloss: "Good stuff/Quality",                  is_sensitive: false },
  { group_name: "Haitian",          phrase: "Se moun pa nou",         english_gloss: "They are our people",                 is_sensitive: false },
  // ── Ethiopian / East African ──────────────────────────────────────────────
  { group_name: "Ethiopian/East African", phrase: "Beteseb",          english_gloss: "Family (Amharic)",                    is_sensitive: false },
  { group_name: "Ethiopian/East African", phrase: "Enebla",           english_gloss: "Let's eat / Welcome (Amharic)",       is_sensitive: false },
  { group_name: "Ethiopian/East African", phrase: "Konjo",            english_gloss: "Beautiful / Good (Amharic)",          is_sensitive: false },
  { group_name: "Ethiopian/East African", phrase: "Gojo",             english_gloss: "Home (Amharic)",                      is_sensitive: false },
  // ── West African (Nigerian / Ghanaian) ────────────────────────────────────
  { group_name: "West African (Nigerian/Ghanaian)", phrase: "Naija approved", english_gloss: "Nigerian certified",          is_sensitive: false },
  { group_name: "West African (Nigerian/Ghanaian)", phrase: "Odogwu",         english_gloss: "Boss / Respected (Igbo)",      is_sensitive: false },
  { group_name: "West African (Nigerian/Ghanaian)", phrase: "Oga at the top", english_gloss: "Boss (Pidgin)",               is_sensitive: false },
  { group_name: "West African (Nigerian/Ghanaian)", phrase: "Chop make you shine", english_gloss: "Eat well (Pidgin)",      is_sensitive: false },
  // ── Vietnamese ────────────────────────────────────────────────────────────
  { group_name: "Vietnamese",       phrase: "Gia đình",               english_gloss: "Family",                              is_sensitive: false },
  { group_name: "Vietnamese",       phrase: "Quán quen",              english_gloss: "Familiar / Trusted spot",             is_sensitive: false },
  { group_name: "Vietnamese",       phrase: "Chuẩn vị",               english_gloss: "Authentic taste",                     is_sensitive: false },
  { group_name: "Vietnamese",       phrase: "Ngon quá",               english_gloss: "Very delicious",                      is_sensitive: false },
  // ── Korean ────────────────────────────────────────────────────────────────
  { group_name: "Korean",           phrase: "Jjindda",                english_gloss: "Authentic / Real deal",               is_sensitive: false },
  { group_name: "Korean",           phrase: "Maul",                   english_gloss: "Neighborhood / Village",              is_sensitive: false },
  { group_name: "Korean",           phrase: "Dan-gol",                english_gloss: "Regular / Trusted spot",              is_sensitive: false },
  { group_name: "Korean",           phrase: "Mat-jib",                english_gloss: "Famous / Delicious restaurant",       is_sensitive: false },
  // ── Indigenous ────────────────────────────────────────────────────────────
  // is_sensitive = true: consult specific tribes for local language before use
  { group_name: "Indigenous",       phrase: "Community Gathering",    english_gloss: "Universal safe phrase",               is_sensitive: true  },
  { group_name: "Indigenous",       phrase: "Original Stewards",      english_gloss: "Respect",                             is_sensitive: true  },
  { group_name: "Indigenous",       phrase: "Native Owned",           english_gloss: "Endorsement — consult specific tribes for local language", is_sensitive: true },
  // ── Brazilian ─────────────────────────────────────────────────────────────
  { group_name: "Brazilian",        phrase: "De casa",                english_gloss: "From home",                           is_sensitive: false },
  { group_name: "Brazilian",        phrase: "Nossa família",          english_gloss: "Our family",                          is_sensitive: false },
  { group_name: "Brazilian",        phrase: "Comida de vó",           english_gloss: "Grandma's food",                      is_sensitive: false },
  { group_name: "Brazilian",        phrase: "Tudo bom",               english_gloss: "All good / Approved",                 is_sensitive: false },
  // ── Middle Eastern ────────────────────────────────────────────────────────
  { group_name: "Middle Eastern",   phrase: "Ahlan wa sahlan",        english_gloss: "Welcome / You are family",            is_sensitive: false },
  { group_name: "Middle Eastern",   phrase: "Asli",                   english_gloss: "Authentic",                           is_sensitive: false },
  { group_name: "Middle Eastern",   phrase: "Beit",                   english_gloss: "Home",                                is_sensitive: false },
  { group_name: "Middle Eastern",   phrase: "Sahtain",                english_gloss: "To your health",                      is_sensitive: false },
  // ── Somali ────────────────────────────────────────────────────────────────
  { group_name: "Somali",           phrase: "Hoy",                    english_gloss: "Home",                                is_sensitive: false },
  { group_name: "Somali",           phrase: "Hooyo",                  english_gloss: "Mother / Nurturing",                  is_sensitive: false },
  { group_name: "Somali",           phrase: "Qoyska",                 english_gloss: "Family",                              is_sensitive: false },
  { group_name: "Somali",           phrase: "Waa Inoo",               english_gloss: "It's for us / Ours",                  is_sensitive: false },
];

/** The 5 sensitivity guidelines from the tour guide — stored for KinfolkAI injection */
export const SENSITIVITY_GUIDELINES: SensitivityRule[] = [
  { rule_text: "Never use phrases from a culture to describe a business from a DIFFERENT culture." },
  { rule_text: "Regional phrases can apply to any business in that region regardless of cultural community." },
  { rule_text: "Culture-specific phrases only apply to businesses FROM that culture." },
  { rule_text: "When in doubt, use MWM universal language: 'Community Loved,' 'People's Choice,' 'Put Your People On.'" },
  { rule_text: "Indigenous phrases require extra sensitivity — consult with the community before using specific tribal language." },
];
