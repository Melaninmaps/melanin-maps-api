# MWM Library → Collection → Book → Sections Architecture
*Source: Founder strategic document, August 9, 2026*
*Status: Architectural specification. Implementation requires separate task authorization.*

## Core Vision

The Library is one of the places where the entire Mapping With Melanin flywheel becomes obvious to users.
"Diaspora" as a topic is not enough — it is too broad.

If someone types **Kenya**, the Library should understand that Kenya is:
- A country hub connected to history, culture, travel, economy, current events, health
- A diaspora connection (Kenyan restaurants in Philadelphia, Kenyan cultural organizations in DC)
- A language connection (Swahili)
- A gateway to local community discovery before ever buying a plane ticket

## Hierarchy

```
Library
  → Collection
    → Book
      → Sections
        → Entries / Stories / Sources / Media / Community
```

## Examples

### Africa Collection
```
Africa
  → East Africa
    → Kenya
      → History / Culture / Travel / Economy / News / Food / Business / Health / Diaspora / Volunteer / Heritage / Entertainment
```

### Divine Nine Collection
```
Divine Nine
  → Alpha Phi Alpha
  → Alpha Kappa Alpha
  → Kappa Alpha Psi
  → Omega Psi Phi
  → Delta Sigma Theta
  → Phi Beta Sigma
  → Zeta Phi Beta
  → Sigma Gamma Rho
  → Iota Phi Theta
```
A person can follow Divine Nine as a whole, or just Delta Sigma Theta, or a narrower topic beneath that.

### Other Examples
```
Hair → Locs → Maintenance / Stylists / Products / Alopecia / Stories / Videos
Parenting → Raising Children of Color
Skilled Trades → Welding
```

## The Taxonomy Rule

**Anything that appears as an approved ownership/community designation should be discoverable in the Library at the appropriate level.**

This does NOT mean ownership and Library taxonomy are the same DB field. It means the Library must have a corresponding knowledge/discovery entity for every designation.

## Authority Ladder

| Subject | Strongest Authority |
|---|---|
| Medical | WHO, government health agencies, recognized medical institutions |
| Legal | Government statutes/courts/bar associations; clear no-legal-advice boundary |
| Current travel entry requirements | Government immigration/embassy |
| Safety advisory | Government/official sources + verified community intelligence clearly separated |
| Economy | World Bank, IMF, national statistical agencies |
| History | UNESCO, archives, universities, museums, reputable historians |
| News | Multiple reputable news organizations |
| Tourism | Official tourism authority + community traveler intelligence |
| Restaurant vibe | Community |
| Hair/braiding experience | Community + specialists |
| Entertainment | Local creators, venues, businesses, reputable entertainment sources |
| Cultural practice | Cultural institutions + community voices |
| Local slang | Community |
| "Where should I eat?" | MWM business intelligence + community |
| "What does this medicine do?" | Medical authority, not community popularity |

**Topic availability can be immediate. Authority is earned by source type.**

## New Topic Auto-Creation Rule

When a member searches something that doesn't exist yet:
1. Create a topic shell immediately
2. Classify it automatically by domain
3. Display: "Topic created — building this shelf."
4. Attach validated sources before allowing Kinfolk to characterize medical/legal information
5. User-generated posts clearly separated from authoritative source content

For "Welding": immediate community contributions OK.
For "Pancreatic Cancer": shell exists immediately but validated medical sources must attach first.
For "Pennsylvania Custody Law": shell exists, legal-source ingestion triggered, user posts clearly separated.

## Required Country Library Books — All 55 AU Member States

Source of truth: African Union official member state list + UN M49 for country names and codes.
Do NOT hardcode country names from prose — use AU and UN M49 programmatically.

### Central Africa
Burundi, Cameroon, Central African Republic, Chad, Republic of the Congo, Democratic Republic of the Congo, Equatorial Guinea, Gabon, São Tomé and Príncipe

### Eastern Africa
Comoros, Djibouti, Eritrea, Ethiopia, Kenya, Madagascar, Mauritius, Rwanda, Seychelles, Somalia, South Sudan, Sudan, Tanzania, Uganda

### Northern Africa
Algeria, Egypt, Libya, Mauritania, Morocco, Sahrawi Arab Democratic Republic/Western Sahara context, Tunisia

### Southern Africa
Angola, Botswana, Eswatini, Lesotho, Malawi, Mozambique, Namibia, South Africa, Zambia, Zimbabwe

### Western Africa
Benin, Burkina Faso, Cabo Verde, Côte d'Ivoire, The Gambia, Ghana, Guinea, Guinea-Bissau, Liberia, Mali, Niger, Nigeria, Senegal, Sierra Leone, Togo

## Non-African Country Books

Rule: Read the authoritative current MWM ownership-designation taxonomy. Extract every designation that corresponds to a nationality, country, territory, diaspora, Indigenous nation/community, or regional cultural identity. Every applicable geographic identity must have a corresponding Library entity.

Compare that list to the Library seed inventory and report every missing country/community. This automatically catches Cuban, Dominican, Puerto Rican, Jamaican, Haitian, etc.

## Source Portfolio Per Country

For every country seed with:

### Official Government Sources
- National government portal
- Ministry of Tourism / official tourism board
- Ministry of Health
- Ministry of Culture/Heritage (where available)
- National statistics agency
- Immigration/visa authority
- Investment/business authority
- National museum/archive

### Global Authoritative Sources (all countries)
- African Union: https://au.int/en/member_states/countryprofiles2
- UN M49 (standardized codes): https://unstats.un.org/unsd/methodology/m49/
- WHO country profiles: https://www.who.int/countries
- UNESCO: https://www.unesco.org/en/countries
- World Bank: https://www.worldbank.org/en/country
- IMF: https://www.imf.org/en/Countries
- UNDP: https://www.undp.org
- UN Tourism: https://www.unwto.org/
- UNHCR: https://www.unhcr.org/
- UNICEF: https://www.unicef.org/
- ILO: https://www.ilo.org/
- FAO: https://www.fao.org/

### News (Multiple Perspectives Required)
Minimum per country:
- National/local reputable outlet(s)
- Regional outlet(s)
- International wire/source

Global sources: Reuters, AP, BBC, France24, Al Jazeera, DW, Africanews
Plus credible national journalism produced in or focused on that country.

### Travel Sources Per Country
- Official national tourism authority
- Government visa/immigration authority
- U.S. State Department: https://travel.state.gov/
- CDC Travelers' Health: https://wwwnc.cdc.gov/travel/
- WHO country health profile
- UNESCO heritage

Then MWM layers on what generic travel sources don't provide:
minority-owned businesses, diaspora businesses, community experiences, Black traveler experiences, LGBTQ+ traveler experiences, accessibility, religious/cultural context, neighborhood intelligence, community media, local creators, safety experiences, historical context, Kinfolk recommendations.

### Donations/Volunteering — Strict Standard
Prioritize verified international organizations:
- UN Volunteers: https://www.unv.org/
- UNDP country programs
- UNICEF country programs
- Red Cross/Red Crescent: https://www.ifrc.org/
- GlobalGiving: https://www.globalgiving.org/
- GiveWell: https://www.givewell.org/

Distinguish: Verified organization vs Community recommended organization.

### Business/Economy Sources
- World Bank, IMF, UNCTAD, International Trade Centre, ILO
- National statistics agency + national investment authority + national chamber of commerce (independently validated)

### Culture/History/Heritage Sources
- UNESCO + UNESCO World Heritage Centre: https://whc.unesco.org/
- Smithsonian: https://www.si.edu/
- Library of Congress: https://www.loc.gov/
- National Archives: https://www.archives.gov/
- National museums/archives of the country
- African Union resources: https://au.int/
- Reputable universities/research institutions

### Entertainment / Living Culture
Lower barrier than medical/legal:
- Verified musicians/artists, official festival accounts, verified creators
- Local entertainment publications, cultural institutions, community radio
- Official venues, businesses, Cultural Ambassadors, member videos

## Three Things to Add (Not in Original Request)

1. **Languages.** Kenya → Swahili; Haiti → Haitian Creole; Brazil → Portuguese. Language as travel/community bridge.

2. **Diaspora-at-home connections.** Kenya should not only mean travel to Kenya. It connects to Kenyan-owned restaurants in Philadelphia, Kenyan cultural organizations in DC, Kenyan festivals, creators, churches/community groups, local businesses. Members explore culture before buying a plane ticket.

3. **Follow context is never identity inference.** A member might follow Kenya because it is their heritage, because their spouse is Kenyan, because they're planning travel, studying, or simply curious. Kinfolk must never infer identity from following a country.

## The Flywheel

```
Learn about Kenya
→ save Kenya
→ discover Kenyan food locally
→ follow a Kenyan Cultural Ambassador
→ watch their Nairobi video
→ save a Nairobi business
→ build a trip
→ receive relevant travel/safety information
→ travel
→ check in
→ contribute a video
→ enrich the Kenya Library for the next person
```

That is the knowledge layer connecting the rest of Mapping With Melanin.
