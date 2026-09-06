const COUNTRY_ALIASES: Record<string, string> = {
  "us": "US",
  "u s": "US",
  "usa": "US",
  "united states of america": "US",
  "uk": "GB",
  "u k": "GB",
  "great britain": "GB",
  "the gambia": "GM",
  "gambia the": "GM",
  "u s virgin islands": "VI",
  "us virgin islands": "VI",
  "british virgin islands": "VG",
  "ivory coast": "CI",
  "cote d ivoire": "CI",
  "cabo verde": "CV",
  "cape verde": "CV",
  "curacao": "CW",
  "sint maarten": "SX",
  "turks and caicos islands": "TC",
  "antigua and barbuda": "AG",
  "saint kitts and nevis": "KN",
  "saint lucia": "LC",
  "saint vincent and the grenadines": "VC",
  "trinidad and tobago": "TT",
};

const PLACEHOLDERS = new Set([
  "", "unknown", "unsure", "not sure", "n a", "na", "none", "null", "tbd",
  "other", "various", "multiple", "global", "international", "worldwide",
]);

export function normalizeCountryText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const VALID_COUNTRY_CODES = new Set(
  `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
   CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
   GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
   KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT
   MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
   SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG
   UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`.split(/\s+/),
);
const COUNTRY_CODES_BY_NAME = (() => {
  const names = new Map<string, string>();
  const displayNames = new Intl.DisplayNames(["en"], { type: "region" });
  for (const code of VALID_COUNTRY_CODES) {
    const label = displayNames.of(code);
    if (label && label !== code) names.set(normalizeCountryText(label), code);
  }
  for (const [name, code] of Object.entries(COUNTRY_ALIASES)) names.set(name, code);
  return names;
})();

export function canonicalCountryCode(value: unknown): string | null {
  const normalized = normalizeCountryText(value);
  if (PLACEHOLDERS.has(normalized)) return null;
  const alias = COUNTRY_ALIASES[normalized];
  if (alias) return alias;
  if (/^[a-z]{2}$/.test(normalized)) {
    const code = normalized.toUpperCase();
    return VALID_COUNTRY_CODES.has(code) ? code : null;
  }
  return COUNTRY_CODES_BY_NAME.get(normalized) ?? null;
}

export function sameRecognizedCountry(left: unknown, right: unknown): boolean {
  const leftCode = canonicalCountryCode(left);
  return Boolean(leftCode && leftCode === canonicalCountryCode(right));
}
