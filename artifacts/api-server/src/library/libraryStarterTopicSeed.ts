/**
 * Generated from the validated 2026-09-20 Living Library starter catalog.
 *
 * This is deliberately topic navigation metadata only: no individual medical,
 * legal, financial, or eligibility advice is stored here. Live articles remain
 * source-cited and publication-governed by the Living Library pipeline.
 */
import { LIBRARY_PRIMARY_COLLECTION_TOPICS } from "./libraryPrimaryCollectionSeed";

export type LibraryStarterTopic = Readonly<{
  slug: string;
  title: string;
  domain: string;
  summary: string;
  iconKey: string;
  sortOrder: number;
  isFeatured: boolean;
  sourceStandard: string;
  safetyNotes: string;
  candidateSources: ReadonlyArray<Readonly<{ url: string; publisher: string; purpose: string }>>;
  nextBricks: ReadonlyArray<Readonly<{ title: string; reason: string }>>;
}>;

const LIBRARY_BASE_STARTER_TOPICS: readonly LibraryStarterTopic[] = [
  {
    "slug": "finding-rental-housing",
    "title": "Finding Rental Housing and Preparing to Apply",
    "domain": "general",
    "summary": "Helps a member orient to rental-housing options, application preparation, and public-service pathways without promising a unit, price, eligibility result, or approval.",
    "iconKey": "compass",
    "sortOrder": 1,
    "isFeatured": true,
    "sourceStandard": "Use HUD, USAGov, CFPB, and current state or local government housing pages as the primary source tier. Use official public-housing-agency or HUD-approved housing-counseling information only after date and jurisdiction review. Exclude commercial listing sites, lead-generation services, apartment advertisements, unverifiable availability, testimonials, ranking claims, and generalized social-media advice.",
    "safetyNotes": "Do not promise that a home is available, suitable, affordable, accessible, safe, or likely to approve an application. Avoid interpreting a lease, screening report, or denial notice as legal advice. A member asking about a threatened eviction, an unsafe condition, discrimination, or a deadline should see the relevant urgent next brick rather than a generic search flow.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/housing-help",
        "publisher": "USAGov",
        "purpose": "federal public-service gateway for rental, buying, repair, emergency housing, and eviction/foreclosure navigation."
      },
      {
        "url": "https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/",
        "publisher": "Consumer Financial Protection Bureau (CFPB)",
        "purpose": "consumer-facing navigation on rent difficulty, new-rental screening, legal help, and HUD-approved housing counseling."
      }
    ],
    "nextBricks": [
      {
        "title": "Rental Assistance and Public Housing Options",
        "reason": "explains public programs that may be relevant after a member chooses to explore assistance."
      },
      {
        "title": "Tenant Screening and Rental Applications",
        "reason": "separates questions about screening reports, application decisions, and next steps from a general housing search."
      },
      {
        "title": "Tenant Rights, Repairs, and Landlord Complaints",
        "reason": "provides a route for members who already have a rental dispute or maintenance concern."
      },
      {
        "title": "Housing Discrimination and Fair Housing",
        "reason": "offers an optional route when a member asks about unequal treatment."
      }
    ]
  },
  {
    "slug": "tenant-rights-repairs-complaints",
    "title": "Tenant Rights, Repairs, and Landlord Complaints",
    "domain": "legal",
    "summary": "Helps a renter find official pathways for understanding a lease dispute, requesting repairs, and locating the appropriate state or local complaint or legal-help channel.",
    "iconKey": "scale",
    "sortOrder": 2,
    "isFeatured": true,
    "sourceStandard": "Treat tenant law, repair deadlines, withholding rent, entry rules, remedies, and court process as jurisdiction-specific. Prioritize the official state tenant-rights agency, attorney general, housing agency, court, or legal-aid referral identified for the member’s stated location. Use USAGov and HUD as navigation sources, not as substitutes for local law. Exclude generic “50-state” summaries, provider blogs, and unsupported legal conclusions.",
    "safetyNotes": "This is legal information and navigation, not legal advice. Do not say a landlord has violated a law, tell a member to withhold rent, recommend self-help remedies, determine a deadline, or interpret a lease. If the member reports immediate danger, fire, gas odor, a medical emergency, or an active emergency, direct them to local emergency services; do not diagnose the condition or delay emergency response.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/tenant-rights",
        "publisher": "USAGov",
        "purpose": "official navigation to state tenant-rights agencies, HUD multifamily complaint pathways, and affordable legal aid."
      },
      {
        "url": "https://www.hud.gov/sites/dfiles/Housing/documents/resident_rights_brochure_8.pdf",
        "publisher": "U.S. Department of Housing and Urban Development (HUD)",
        "purpose": "primary federal program material that may help frame rights and responsibilities in HUD-assisted multifamily settings; review applicability before use."
      }
    ],
    "nextBricks": [
      {
        "title": "Healthy Home Conditions: Moisture, Mold, and Lead-Safe Repair",
        "reason": "connects a repair concern to government guidance when moisture, mold, peeling paint, or a possible hazard is involved."
      },
      {
        "title": "Eviction Notices and Housing Stability",
        "reason": "provides a time-sensitive route if the dispute includes a demand, notice, or court filing."
      },
      {
        "title": "Housing Discrimination and Fair Housing",
        "reason": "offers a separate civil-rights path when the member asks about discriminatory treatment."
      },
      {
        "title": "Finding Rental Housing and Preparing to Apply",
        "reason": "supports a member who needs to consider a future move without assuming that relocation is desired."
      }
    ]
  },
  {
    "slug": "housing-discrimination-fair-housing",
    "title": "Housing Discrimination and Fair Housing",
    "domain": "legal",
    "summary": "Helps a member find official information about fair-housing protections and formal reporting pathways without deciding whether a particular experience is unlawful.",
    "iconKey": "scale",
    "sortOrder": 3,
    "isFeatured": true,
    "sourceStandard": "Use the Fair Housing Act text, HUD Office of Fair Housing and Equal Opportunity (FHEO) pages, the U.S. Department of Justice, and relevant state or local civil-rights agencies. Confirm complaint procedures, time limits, and covered programs directly from the current agency source before publication. Exclude crowd-sourced accusations, allegations about named properties, legal opinions, and case-outcome predictions.",
    "safetyNotes": "Do not decide that conduct was discrimination, predict a complaint result, or require a member to disclose protected characteristics or personal history. State and local protections can differ from federal law, so location-specific material requires review. Treat reports of threats, violence, stalking, or an immediate safety emergency as urgent safety concerns and route to emergency or specialized support only when the member’s question calls for it.",
    "candidateSources": [
      {
        "url": "https://www.hud.gov/helping-americans/fair-housing-act-overview",
        "publisher": "HUD",
        "purpose": "primary overview of the federal fair-housing framework and its covered housing activities."
      },
      {
        "url": "https://www.hud.gov/reporthousingdiscrimination",
        "publisher": "HUD",
        "purpose": "official FHEO reporting routes and process-oriented information, including online, phone, and mail channels."
      }
    ],
    "nextBricks": [
      {
        "title": "Tenant Rights, Repairs, and Landlord Complaints",
        "reason": "supports a separate maintenance or lease dispute that may be occurring at the same time."
      },
      {
        "title": "Finding Rental Housing and Preparing to Apply",
        "reason": "supports continued housing navigation without assuming the member wants to pursue a complaint."
      },
      {
        "title": "Eviction Notices and Housing Stability",
        "reason": "provides a separate time-sensitive route if the member has received a notice or court documents."
      },
      {
        "title": "Disaster Housing and Recovery",
        "reason": "explains the related reporting path when a member specifically asks about post-disaster housing discrimination."
      }
    ]
  },
  {
    "slug": "eviction-notices-housing-stability",
    "title": "Eviction Notices and Housing Stability",
    "domain": "legal",
    "summary": "Helps a member recognize the difference between rent difficulty, a notice, and a court case, then locate current official or legal-help pathways without giving case-specific legal direction.",
    "iconKey": "scale",
    "sortOrder": 4,
    "isFeatured": true,
    "sourceStandard": "Use CFPB and HUD public guidance for general navigation; use official local court, state housing agency, legal-aid, or tenant-rights sources for procedural and deadline information once location is voluntarily supplied. Review every local page for currency. Exclude eviction-law templates, private lead generators, promises to stop an eviction, dated moratorium material, and content suggesting that a member should miss a filing deadline.",
    "safetyNotes": "This is not legal advice. Court dates, answers, notices, protections, and procedures can be time-sensitive and vary by jurisdiction. Do not interpret notices, calculate deadlines, draft pleadings, predict whether a member can stay, or state that assistance will stop an eviction. Encourage prompt use of the official court and legal-help pathways when a member says a notice or case exists.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/housing/housing-insecurity/help-for-renters/what-to-do-if-youre-facing-eviction/",
        "publisher": "CFPB",
        "purpose": "federal consumer navigation that distinguishes stages of eviction and points to housing counseling, legal help, and assistance resources."
      },
      {
        "url": "https://www.hud.gov/hud-partners/single-family-about-housing-counseling",
        "publisher": "HUD",
        "purpose": "primary overview of HUD-approved counseling, including the availability of free foreclosure, eviction, and homeless counseling; confirm current program details before publication."
      }
    ],
    "nextBricks": [
      {
        "title": "Tenant Rights, Repairs, and Landlord Complaints",
        "reason": "separates a repair or lease dispute from the procedural eviction question."
      },
      {
        "title": "Rental Assistance and Public Housing Options",
        "reason": "offers an optional route to current official assistance navigation, without implying funds are available."
      },
      {
        "title": "Utility Bills and Service Interruptions",
        "reason": "connects household-bill questions that may affect housing stability."
      },
      {
        "title": "Finding Rental Housing and Preparing to Apply",
        "reason": "supports planning for a possible move without presuming it will occur."
      }
    ]
  },
  {
    "slug": "rental-assistance-public-housing",
    "title": "Rental Assistance and Public Housing Options",
    "domain": "general",
    "summary": "Helps a member understand the main official routes for rental assistance, public housing, subsidized housing, and housing-choice vouchers without asserting eligibility, waitlist status, funding, or an available unit.",
    "iconKey": "compass",
    "sortOrder": 5,
    "isFeatured": true,
    "sourceStandard": "Prioritize HUD, USAGov, and official public-housing-agency pages for the stated location. Present program descriptions as navigation, not a screening decision. Verify whether applications or waitlists are open directly from the administering agency before publication or display. Exclude voucher brokers, paid waitlist-alert services, misleading “guaranteed housing” advertising, and static eligibility summaries without a current official source.",
    "safetyNotes": "Do not infer income, disability, age, citizenship or immigration status, household composition, veteran status, or any other eligibility factor. Do not estimate wait time, promise a benefit, recommend an application answer, or state that a waitlist is open. When a member volunteers a location, point to current administering-agency information after review.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/rental-housing-programs",
        "publisher": "USAGov",
        "purpose": "federal overview that links to Housing Choice Vouchers, subsidized housing, public housing, and group-specific pathways."
      },
      {
        "url": "https://www.hud.gov/helping-americans/housing-choice-vouchers",
        "publisher": "HUD",
        "purpose": "primary HUD program overview; publication review should pair it with the relevant local public-housing-agency source for administration details."
      }
    ],
    "nextBricks": [
      {
        "title": "Finding Rental Housing and Preparing to Apply",
        "reason": "helps members connect program exploration with a broader rental search."
      },
      {
        "title": "Eviction Notices and Housing Stability",
        "reason": "provides a time-sensitive route when a member is facing a current notice or case."
      },
      {
        "title": "Utility Bills and Service Interruptions",
        "reason": "separates energy or other household-bill assistance from rent assistance."
      },
      {
        "title": "Tenant Rights, Repairs, and Landlord Complaints",
        "reason": "supports questions about an existing rental or assisted-housing relationship."
      }
    ]
  },
  {
    "slug": "utility-bills-service-interruptions",
    "title": "Utility Bills and Service Interruptions",
    "domain": "general",
    "summary": "Helps a member locate official information about household utility-bill assistance, disconnection questions, and local program navigation without promising aid, reconnection, payment arrangements, or a particular utility policy.",
    "iconKey": "compass",
    "sortOrder": 6,
    "isFeatured": true,
    "sourceStandard": "Use USAGov, HHS/Administration for Children and Families (ACF), state energy offices, public-utility commissions, and the actual local utility’s current customer-assistance or disconnection pages. Separate electricity, gas, water, phone, and internet because programs and protections differ. Exclude social-media claims, fee-based “grant” offers, stale seasonal rules, and claims that a program pays all past-due bills.",
    "safetyNotes": "Do not say that a utility must postpone disconnection, that a member qualifies, or that LIHEAP or another program has funds. Treat a gas odor, electrical hazard, fire, dangerously hot or cold conditions, or an immediate medical emergency as an urgent safety issue; direct the member to the utility’s emergency channel or emergency services as appropriate, without diagnosing risk. Do not request account numbers or bills unless a separately approved privacy flow exists.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/help-with-utility-bills",
        "publisher": "USAGov",
        "purpose": "public-service gateway to federal utility-bill, energy, phone, and internet assistance navigation."
      },
      {
        "url": "https://acf.gov/ocs/programs/liheap",
        "publisher": "ACF",
        "purpose": "primary federal program information on assistance for energy bills, energy crises, weatherization, and certain minor energy-related repairs, with official state and territory contacts."
      }
    ],
    "nextBricks": [
      {
        "title": "Home Energy Efficiency and Weatherization",
        "reason": "explores potential long-term energy-efficiency and weatherization pathways separately from urgent bill issues."
      },
      {
        "title": "Rental Assistance and Public Housing Options",
        "reason": "separates rent assistance from utility assistance while keeping both visible."
      },
      {
        "title": "Eviction Notices and Housing Stability",
        "reason": "gives a relevant route if the member is also facing a housing notice or case."
      },
      {
        "title": "Disaster Housing and Recovery",
        "reason": "provides a path when a utility disruption follows a declared disaster."
      }
    ]
  },
  {
    "slug": "home-energy-efficiency-weatherization",
    "title": "Home Energy Efficiency and Weatherization",
    "domain": "general",
    "summary": "Helps a renter or homeowner explore official weatherization, energy-efficiency, and rebate-navigation resources while recognizing that programs, permissions, eligibility, and offerings vary.",
    "iconKey": "compass",
    "sortOrder": 7,
    "isFeatured": true,
    "sourceStandard": "Use DOE, USAGov, EPA ENERGY STAR, and official state, territory, tribal, or utility program pages. Review local program status, applicant type, property permissions, incentive amount, and contractor requirements at publication time. Exclude claims of savings, rebates, installation quality, “free upgrades,” or program availability unless supported by a current official source.",
    "safetyNotes": "Do not guarantee lower bills, a rebate, tax treatment, approval, energy savings, installation quality, or eligibility. Never assume a renter may alter a property; permissions and local rules may matter. Home-energy work may implicate electrical, combustion, moisture, lead-paint, or other safety concerns; the topic should link out to the appropriate safety record rather than provide unreviewed technical instructions.",
    "candidateSources": [
      {
        "url": "https://www.energy.gov/cmei/scep/wap/weatherization-assistance-program",
        "publisher": "U.S. Department of Energy (DOE)",
        "purpose": "primary program overview and official application pathway for weatherization assistance."
      },
      {
        "url": "https://www.usa.gov/weatherization-energy-programs",
        "publisher": "USAGov",
        "purpose": "public-service guide to WAP, energy-efficiency assistance, and links to current local application routes."
      }
    ],
    "nextBricks": [
      {
        "title": "Utility Bills and Service Interruptions",
        "reason": "separates immediate bill or disconnection concerns from longer-term improvements."
      },
      {
        "title": "Hiring a Home Repair Contractor Safely",
        "reason": "offers consumer-protection guidance when a member moves from program research to considering paid work."
      },
      {
        "title": "Healthy Home Conditions: Moisture, Mold, and Lead-Safe Repair",
        "reason": "provides a related safety branch for repair work in older or moisture-damaged housing."
      },
      {
        "title": "Government Home Repair Assistance",
        "reason": "distinguishes general repair-program navigation from energy-focused improvements."
      }
    ]
  },
  {
    "slug": "hiring-home-repair-contractor-safely",
    "title": "Hiring a Home Repair Contractor Safely",
    "domain": "general",
    "summary": "Helps a member use government consumer-protection guidance when comparing repair work, checking official licensing or complaint channels, and responding to possible home-improvement scams.",
    "iconKey": "compass",
    "sortOrder": 8,
    "isFeatured": true,
    "sourceStandard": "Use FTC consumer guidance, the official state contractor licensing board or equivalent regulator, state consumer-protection office, and official local permitting information after location is stated. Verify every license, insurance, certification, complaint, and permit detail from its governing authority and date. Exclude marketplaces, review aggregators, referral fees, “best contractor” rankings, unverified claims, price estimates, and advertising.",
    "safetyNotes": "Do not recommend a specific contractor, represent that any business is licensed or insured, set a price, assess workmanship, or tell a member that an offer is fraudulent. Urgent hazards such as suspected gas leaks, live electrical danger, fire, structural collapse, or disaster-related danger require emergency/public-safety routing, not contractor shopping. Do not ask for payment details, deeds, contracts, or account information in the Library.",
    "candidateSources": [
      {
        "url": "https://consumer.ftc.gov/articles/how-avoid-home-improvement-scam",
        "publisher": "Federal Trade Commission (FTC)",
        "purpose": "primary federal consumer guidance on warning signs, estimates, contracts, payments, financing, and dispute escalation."
      },
      {
        "url": "https://www.usa.gov/state-consumer",
        "publisher": "USAGov",
        "purpose": "official directory gateway to state consumer-protection offices for business complaints, scam concerns, and consumer assistance."
      }
    ],
    "nextBricks": [
      {
        "title": "Government Home Repair Assistance",
        "reason": "separates program or financing navigation from contractor-selection questions."
      },
      {
        "title": "Healthy Home Conditions: Moisture, Mold, and Lead-Safe Repair",
        "reason": "brings in safety-sensitive source requirements for repairs involving lead paint, mold, or moisture."
      },
      {
        "title": "Home Energy Efficiency and Weatherization",
        "reason": "connects efficiency projects to official program navigation without treating a contractor as program-approved."
      },
      {
        "title": "Disaster Housing and Recovery",
        "reason": "supports members who face post-disaster repair solicitations or recovery scams."
      }
    ]
  },
  {
    "slug": "healthy-home-moisture-mold-lead-safe-repair",
    "title": "Healthy Home Conditions: Moisture, Mold, and Lead-Safe Repair",
    "domain": "general",
    "summary": "Helps a renter or homeowner find authoritative environmental and housing-safety guidance for moisture, mold, deteriorated paint, and repair work, while keeping medical and legal determinations outside the topic.",
    "iconKey": "compass",
    "sortOrder": 9,
    "isFeatured": true,
    "sourceStandard": "Prioritize EPA, HUD, local public-health or housing agencies, and current local building or environmental authorities. Use medical sources only for clearly bounded public-health information and retain a medical disclaimer. Confirm any local inspection, remediation, disclosure, or repair rule from the actual authority. Exclude home-test marketing, remediation sales claims, diagnoses, assertions of causation, and unsupported thresholds.",
    "safetyNotes": "This topic does not diagnose illness, determine exposure, establish causation, or substitute for medical, legal, inspection, environmental, or emergency services. The member’s health status must not be inferred. Where a member reports symptoms, severe contamination, sewage, an immediate hazard, or safety danger, show urgent public-safety and appropriate professional-care language; do not prescribe cleanup methods beyond reviewed source content. Do not state that a building has lead or mold without evidence.",
    "candidateSources": [
      {
        "url": "https://www.epa.gov/mold/brief-guide-mold-moisture-and-your-home",
        "publisher": "Environmental Protection Agency (EPA)",
        "purpose": "primary guidance for renters and homeowners on controlling moisture and addressing residential mold; EPA notes that the guide is not a complete account of health effects."
      },
      {
        "url": "https://www.epa.gov/lead/lead-renovation-repair-and-painting-program",
        "publisher": "EPA",
        "purpose": "primary information on lead-safe renovation rules and consumer pathways for housing built before 1978, including material specific to renters and homeowners."
      }
    ],
    "nextBricks": [
      {
        "title": "Tenant Rights, Repairs, and Landlord Complaints",
        "reason": "guides a renter to local repair-dispute and complaint pathways without treating environmental guidance as legal advice."
      },
      {
        "title": "Hiring a Home Repair Contractor Safely",
        "reason": "supports careful contractor selection when professional work is needed."
      },
      {
        "title": "Home Energy Efficiency and Weatherization",
        "reason": "provides a distinct pathway for efficiency or ventilation questions, subject to property permissions and program rules."
      },
      {
        "title": "Disaster Housing and Recovery",
        "reason": "covers conditions caused by a disaster and links to official recovery navigation."
      }
    ]
  },
  {
    "slug": "disaster-housing-recovery",
    "title": "Disaster Housing and Recovery",
    "domain": "general",
    "summary": "Helps a member locate official preparedness, temporary housing, recovery, and housing-counseling pathways after a disaster without determining whether a disaster is covered, declared, or eligible for assistance.",
    "iconKey": "compass",
    "sortOrder": 10,
    "isFeatured": true,
    "sourceStandard": "Use FEMA, DisasterAssistance.gov, HUD, Ready.gov, and the official emergency-management or recovery agency for the voluntarily stated location. Confirm declaration status, application windows, program scope, local recovery centers, and assistance details at time of publication. Exclude disaster-assistance brokers, fees, guaranteed-award claims, unofficial donation pages, contractor solicitations, and claims about insurance or FEMA outcomes.",
    "safetyNotes": "Do not promise FEMA, HUD, insurance, or local assistance; determine eligibility; advise on a claim; or ask for sensitive identifiers, policy data, immigration information, or account credentials. If a member faces an immediate life-safety emergency, use emergency-service guidance first. Information must distinguish declared-disaster assistance from general preparedness and must be reviewed for current local conditions before display.",
    "candidateSources": [
      {
        "url": "https://www.fema.gov/assistance/individual/housing",
        "publisher": "Federal Emergency Management Agency (FEMA)",
        "purpose": "primary overview of possible housing-related assistance after a presidentially declared disaster and the official application route."
      },
      {
        "url": "https://www.hud.gov/disaster-resources",
        "publisher": "HUD",
        "purpose": "federal housing-recovery navigation, HUD housing counseling, and links to state/local disaster-recovery contacts."
      },
      {
        "url": "https://www.ready.gov/plan",
        "publisher": "Ready.gov",
        "purpose": "official household emergency-planning guidance, including alerts, shelter, evacuation, communication, and household needs."
      }
    ],
    "nextBricks": [
      {
        "title": "Utility Bills and Service Interruptions",
        "reason": "addresses utility disruption questions that may occur during or after a disaster."
      },
      {
        "title": "Hiring a Home Repair Contractor Safely",
        "reason": "keeps post-disaster repair solicitation and contractor-scams navigation distinct from aid questions."
      },
      {
        "title": "Healthy Home Conditions: Moisture, Mold, and Lead-Safe Repair",
        "reason": "connects water damage and repair concerns to authoritative safety guidance."
      },
      {
        "title": "Housing Discrimination and Fair Housing",
        "reason": "provides a separate official complaint path for members who specifically ask about discrimination in housing or assistance."
      }
    ]
  },
  {
    "slug": "reproductive-health-questions-and-care-navigation",
    "title": "Reproductive Health: Questions and Care Navigation",
    "domain": "medical",
    "summary": "Help a member identify a respectful starting point for general reproductive-health questions and prepare to discuss an explicitly stated concern with an appropriate health professional.",
    "iconKey": "heart-pulse",
    "sortOrder": 11,
    "isFeatured": true,
    "sourceStandard": "Use current CDC, HHS Office on Women’s Health, NIH/MedlinePlus, or comparable national public-health sources for general education; use current clinical guidelines only when a medically reviewed published entry needs them. Exclude clinic marketing, social-media anecdotes, unreviewed symptom checkers, and content that frames a member’s identity or life choices as a diagnosis. Do not turn general information into individualized advice.",
    "safetyNotes": "General education only; do not diagnose, interpret symptoms, recommend contraception or treatment, or assume anatomy, pregnancy status, fertility goals, gender, sexuality, relationship status, or family role. A member who describes a medical emergency should be directed to emergency services rather than this topic. The federal Office on Women’s Health itself states that its helpline does not diagnose, treat, prescribe, or refer to specialists.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/reproductive-health/women-health/index.html",
        "publisher": "Centers for Disease Control and Prevention (CDC)",
        "purpose": "candidate public-health overview for connected reproductive-health subjects and official resource pathways."
      },
      {
        "url": "https://womenshealth.gov/topics/reproductive-health",
        "publisher": "U.S. Department of Health and Human Services, Office on Women’s Health",
        "purpose": "candidate federal gateway for medically reviewed topic discovery and language-access context."
      }
    ],
    "nextBricks": [
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "turns a general care question into a practical visit-preparation path. -"
      },
      {
        "title": "Fertility and Family-Building Options",
        "reason": "offers an optional path when the member explicitly asks about becoming a parent or future family building. -"
      },
      {
        "title": "Pregnancy Care and Postpartum Navigation",
        "reason": "provides a separate path for an explicitly stated pregnancy or postpartum question. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "connects a member who wants to understand plan documents or billing processes without presuming coverage."
      }
    ]
  },
  {
    "slug": "pregnancy-care-and-postpartum-navigation",
    "title": "Pregnancy Care and Postpartum Navigation",
    "domain": "medical",
    "summary": "Help a member who explicitly states a pregnancy or recent pregnancy question organize trustworthy information, care questions, and urgent-care awareness without supplying individualized obstetric advice.",
    "iconKey": "heart-pulse",
    "sortOrder": 12,
    "isFeatured": true,
    "sourceStandard": "Prioritize current CDC maternal-health safety material and HHS/NIH patient education; use professionally developed obstetric guidance only after clinical review and contextual dating. Exclude “normal versus emergency” advice that lacks a public-health or clinical source, lifestyle prescriptions, and any numerical risk, outcome, or coverage claim not validated for publication.",
    "safetyNotes": "This topic must always carry an urgent-care notice: CDC advises immediate medical care for an urgent maternal warning sign during pregnancy or in the year after pregnancy. It must not triage symptoms, assure a member that a symptom is normal, replace prenatal/postpartum care, or infer pregnancy or birth status from a search. For a life-threatening emergency, direct the member to call 911 or local emergency services.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/hearher/pregnant-postpartum/index.html",
        "publisher": "CDC",
        "purpose": "candidate source for official urgent maternal warning-sign routing and clinician-conversation prompts. CDC directs people with an urgent maternal warning sign during pregnancy or within a year after pregnancy to get medical care immediately."
      },
      {
        "url": "https://womenshealth.gov/pregnancy",
        "publisher": "HHS Office on Women’s Health",
        "purpose": "candidate topic gateway for before-pregnancy, prenatal, childbirth, and postpartum information."
      }
    ],
    "nextBricks": [
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps prepare questions, medication lists, and follow-up requests for a visit. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "helps members look for official coverage and billing information without promising payment. -"
      },
      {
        "title": "Grief and Bereavement Support",
        "reason": "remains visible as an optional, non-assumptive route for a member who names loss. -"
      },
      {
        "title": "Family Caregiving Navigation",
        "reason": "connects members who explicitly ask about coordinating practical support after a health event."
      }
    ]
  },
  {
    "slug": "fertility-and-family-building-options",
    "title": "Fertility and Family-Building Options",
    "domain": "medical",
    "summary": "Help a member explore high-level, source-reviewed questions about fertility and family building while keeping decisions, identities, diagnoses, and paths to parenthood member-defined.",
    "iconKey": "heart-pulse",
    "sortOrder": 13,
    "isFeatured": false,
    "sourceStandard": "Lead with current CDC and NICHD/NIH consumer information; use neutral, medically reviewed terminology and distinguish information about options from a recommendation. Exclude clinic outcome claims, rankings, package prices, donor or carrier advertisements, promises of parenthood, and material that treats any pathway as universally appropriate.",
    "safetyNotes": "The Library must not infer that a member has infertility, is trying to conceive, is in a relationship, intends to parent, has a particular anatomy, or needs a specific family-building route. It must not recommend an option, predict success, provide an outcome estimate, or offer legal advice about third-party reproduction. Emotional support must be opt-in and not pathologize fertility questions.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/reproductive-health/infertility-faq/index.html",
        "publisher": "CDC",
        "purpose": "candidate source for a public-health overview of fertility, infertility, evaluation, and treatment categories."
      },
      {
        "url": "https://www.nichd.nih.gov/health/topics/factsheets/infertility",
        "publisher": "Eunice Kennedy Shriver National Institute of Child Health and Human Development (NICHD), NIH",
        "purpose": "candidate medical-information source for evaluation and treatment questions that need clinical review."
      }
    ],
    "nextBricks": [
      {
        "title": "Infertility Evaluation and Diagnosis",
        "reason": "a distinct route for a member who asks about difficulty becoming pregnant or a clinical evaluation. -"
      },
      {
        "title": "Fertility Treatment Options and Assisted Reproductive Technology",
        "reason": "explains the difference between broad options and a treatment-specific question. -"
      },
      {
        "title": "Fertility Preservation Conversations",
        "reason": "allows a member to ask about preserving future reproductive options. -"
      },
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "supports member-led questions before an initial consultation. -"
      },
      {
        "title": "Grief and Bereavement Support",
        "reason": "is an optional path for a member who identifies a loss or emotionally difficult experience; it must not be automatically attached to fertility searching."
      }
    ]
  },
  {
    "slug": "infertility-evaluation-and-diagnosis",
    "title": "Infertility Evaluation and Diagnosis",
    "domain": "medical",
    "summary": "Help a member understand the kinds of questions and source-backed concepts that may arise in an infertility evaluation, and prepare to speak with a qualified clinician.",
    "iconKey": "heart-pulse",
    "sortOrder": 14,
    "isFeatured": false,
    "sourceStandard": "Use current CDC and NICHD/NIH primary consumer education plus clinically reviewed guidance for published explanations of evaluation concepts. Every diagnostic description needs medical-editor review, a date, and wording that makes clear that tests and timing depend on clinical circumstances. Exclude self-diagnosis quizzes, single-test “fertility score” claims, unverified laboratory marketing, and success or time-to-pregnancy guarantees.",
    "safetyNotes": "Do not diagnose infertility, interpret test results, tell a member when they personally should seek care, or assume a partner configuration, sexual practices, anatomy, pregnancy history, or cause. Published content must not state that any test can predict an individual’s fertility or outcome unless a current, clinically reviewed source specifically supports that narrow claim. Medical symptoms or time-sensitive concerns belong with a clinician or emergency care as appropriate.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/reproductive-health/infertility-faq/index.html",
        "publisher": "CDC",
        "purpose": "candidate source for public-health context, the fact that infertility can involve more than one factor, and a high-level overview of evaluations and treatment categories."
      },
      {
        "url": "https://www.nichd.nih.gov/health/topics/factsheets/infertility",
        "publisher": "NICHD, NIH",
        "purpose": "candidate technical consumer source on evaluation questions and the distinct considerations clinicians may discuss."
      }
    ],
    "nextBricks": [
      {
        "title": "Fertility and Family-Building Options",
        "reason": "returns to a broader, non-diagnostic overview if the member is still exploring. -"
      },
      {
        "title": "Fertility Treatment Options and Assisted Reproductive Technology",
        "reason": "follows only after a member wants to understand treatment terms or pathways. -"
      },
      {
        "title": "Fertility Preservation Conversations",
        "reason": "offers a separate information path when future reproductive options are the stated concern. -"
      },
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "supports question preparation, record gathering, and clarifying follow-up."
      }
    ]
  },
  {
    "slug": "fertility-treatment-options-and-art",
    "title": "Fertility Treatment Options and Assisted Reproductive Technology",
    "domain": "medical",
    "summary": "Help a member understand common treatment-category terms, including assisted reproductive technology (ART), and develop questions for a clinician without presenting a treatment recommendation or expected result.",
    "iconKey": "heart-pulse",
    "sortOrder": 15,
    "isFeatured": false,
    "sourceStandard": "Prefer current CDC ART definitions, federally reported data contexts, and NICHD/NIH patient education; require medical-editor review for any explanation of procedure, risk, or outcome. Clearly distinguish a national data source from an individualized prognosis. Exclude clinic success-rate marketing, rankings, testimonials, bundled pricing, “best clinic” claims, and any claim that a procedure will be right for or successful for a member.",
    "safetyNotes": "Do not prescribe, compare treatment suitability, quote individual success chances, promise a pregnancy, or make a financial or insurance determination. ART may involve physical, emotional, legal, and financial considerations, but this medical topic should route law and plan-specific questions to separately governed content rather than answer them. The Library must not infer that a member is pursuing a treatment, has a diagnosis, or wants genetic testing, donation, or a gestational carrier.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/art/about/index.html",
        "publisher": "CDC",
        "purpose": "candidate source for the federal definition of ART and its relationship to IVF, cryopreservation, and reported clinic data."
      },
      {
        "url": "https://www.nichd.nih.gov/health/topics/factsheets/infertility",
        "publisher": "NICHD, NIH",
        "purpose": "candidate source for clinically reviewed background on infertility treatment discussions."
      }
    ],
    "nextBricks": [
      {
        "title": "Infertility Evaluation and Diagnosis",
        "reason": "clarifies the role of clinical evaluation before a treatment-specific decision. -"
      },
      {
        "title": "Fertility Preservation Conversations",
        "reason": "distinguishes preservation questions from treatment to achieve a current pregnancy. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "provides a guarded route for plan documents, prior authorization, and bills rather than estimates or coverage promises. -"
      },
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps turn technical terms into questions for a clinician. -"
      },
      {
        "title": "Grief and Bereavement Support",
        "reason": "remains an opt-in support path for a member who names loss, disappointment, or emotional distress."
      }
    ]
  },
  {
    "slug": "fertility-preservation-conversations",
    "title": "Fertility Preservation Conversations",
    "domain": "medical",
    "summary": "Help a member identify informed, clinician-led questions about preserving eggs, sperm, or reproductive tissue for possible future biological parenthood.",
    "iconKey": "heart-pulse",
    "sortOrder": 16,
    "isFeatured": false,
    "sourceStandard": "Use NICHD/NIH and other current federal or specialty-society guidance only after clinical review. Definitions and options must be precisely sourced and version-dated. Exclude timelines, candidacy rules, provider marketing, price estimates, claims of guaranteed future fertility, and advice that delays treatment or substitutes for the member’s own care team.",
    "safetyNotes": "This is not medical advice and must never tell a member whether preservation is medically indicated, feasible, urgent, covered, or likely to result in a child. Do not infer a diagnosis, cancer treatment, age, gender, family plan, or reproductive capacity. If a member describes time-sensitive treatment decisions, the Library should encourage prompt discussion with the member’s treating clinician rather than providing a timeline.",
    "candidateSources": [
      {
        "url": "https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/fertilitypreservation",
        "publisher": "NICHD, NIH",
        "purpose": "candidate source for the federal definition of fertility preservation as protecting eggs, sperm, or reproductive tissue for possible future biological children."
      },
      {
        "url": "https://www.cdc.gov/art/about/index.html",
        "publisher": "CDC",
        "purpose": "candidate source for clear ART terminology, including egg and embryo cryopreservation, to be used only with clinical editorial review."
      }
    ],
    "nextBricks": [
      {
        "title": "Fertility and Family-Building Options",
        "reason": "provides a broader member-led view of future family-building questions. -"
      },
      {
        "title": "Fertility Treatment Options and Assisted Reproductive Technology",
        "reason": "explains where procedure terms overlap while not treating them as interchangeable. -"
      },
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps a member prepare questions and coordinate conversations with their care team. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "offers a cautious pathway to official plan documents and billing rights without asserting coverage."
      }
    ]
  },
  {
    "slug": "navigating-health-care-appointments-and-communication",
    "title": "Navigating Health Care Appointments and Communication",
    "domain": "medical",
    "summary": "Help a member prepare questions, information, and communication preferences for a health care visit and understand how to ask for clarification or language support.",
    "iconKey": "heart-pulse",
    "sortOrder": 17,
    "isFeatured": false,
    "sourceStandard": "Prefer MedlinePlus, AHRQ, NIH, and CMS consumer tools. Published content should focus on question preparation, plain-language communication, accurate record keeping, and member choice; it should not give clinical directions. Exclude scripts that pressure a member to disclose personal information, claims about a particular clinician’s quality, or advice that substitutes for an emergency response.",
    "safetyNotes": "Do not suggest that a member with urgent symptoms wait for an appointment. Do not presume the member wants an interpreter, has low health literacy, is a caregiver, or can bring another person to a visit. Any published advice about records, privacy, consent, or rights must be separately source-checked and scoped to the relevant jurisdiction or program.",
    "candidateSources": [
      {
        "url": "https://medlineplus.gov/talkingwithyourdoctor.html",
        "publisher": "National Library of Medicine, NIH",
        "purpose": "candidate source for appointment preparation, questions, notes, medication lists, records, and requesting an interpreter."
      },
      {
        "url": "https://www.ahrq.gov/questions/question-builder/index.html",
        "publisher": "Agency for Healthcare Research and Quality (AHRQ)",
        "purpose": "candidate source for a federally developed question-preparation tool for patients and caregivers."
      }
    ],
    "nextBricks": [
      {
        "title": "Reproductive Health: Questions and Care Navigation",
        "reason": "provides a focused pathway when the member explicitly identifies a reproductive-health question. -"
      },
      {
        "title": "Pregnancy Care and Postpartum Navigation",
        "reason": "supports pregnancy or postpartum questions while preserving urgent-care routing. -"
      },
      {
        "title": "Infertility Evaluation and Diagnosis",
        "reason": "helps a member create questions for a fertility consultation without interpreting tests. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "connects a member who needs to ask plan or billing questions before a visit. -"
      },
      {
        "title": "Family Caregiving Navigation",
        "reason": "helps someone explicitly coordinating another person’s care prepare for communication and follow-up."
      }
    ]
  },
  {
    "slug": "health-insurance-coverage-and-medical-bills",
    "title": "Health Insurance Coverage and Medical Bills",
    "domain": "financial",
    "summary": "Help a member locate official information and questions for understanding health-plan documents, coverage pathways, and medical bills without determining benefits, costs, or eligibility.",
    "iconKey": "landmark",
    "sortOrder": 18,
    "isFeatured": false,
    "sourceStandard": "Use current CMS, HealthCare.gov, Medicare/Medicaid official program pages, and state regulator resources for the correct jurisdiction and coverage type. A published item must name its effective date, program scope, and any limitations. Exclude insurer marketing, estimates treated as quotes, clinic financing offers, payment-plan recommendations, benefits determinations, eligibility advice, and statements that a procedure or provider is covered.",
    "safetyNotes": "This is general financial and consumer navigation, not insurance, legal, tax, or financial advice. Do not state a member’s eligibility, subsidy, enrollment status, bill validity, coverage, in-network status, prior-authorization result, or out-of-pocket amount. Rules vary by plan, program, state, and date; direct members to official plan documents, the relevant agency, or a qualified consumer-assistance channel. Do not infer income, citizenship/immigration status, disability status, household composition, pregnancy, or insurance type.",
    "candidateSources": [
      {
        "url": "https://www.cms.gov/nosurprises",
        "publisher": "Centers for Medicare & Medicaid Services (CMS)",
        "purpose": "candidate source for federally administered No Surprises Act consumer-protection material and official links for consumers and advocates."
      },
      {
        "url": "https://www.healthcare.gov/see-plans/",
        "publisher": "HealthCare.gov, CMS/HHS",
        "purpose": "candidate source for the official Marketplace plan-preview pathway and its current enrollment caveat."
      }
    ],
    "nextBricks": [
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps a member ask a clinician’s office or plan appropriate questions. -"
      },
      {
        "title": "Fertility Treatment Options and Assisted Reproductive Technology",
        "reason": "offers treatment-term context without implying a benefit or payment outcome. -"
      },
      {
        "title": "Fertility Preservation Conversations",
        "reason": "provides background for a member who has voluntarily named preservation as the concern. -"
      },
      {
        "title": "Pregnancy Care and Postpartum Navigation",
        "reason": "connects medical-care questions to the relevant safety topic, not to a coverage promise."
      }
    ]
  },
  {
    "slug": "family-caregiving-navigation",
    "title": "Family Caregiving Navigation",
    "domain": "medical",
    "summary": "Help a member who explicitly identifies a caregiving role organize practical care-coordination questions, caregiver well-being resources, and official support-system pathways.",
    "iconKey": "heart-pulse",
    "sortOrder": 19,
    "isFeatured": false,
    "sourceStandard": "Use NIA, ACL, and other official public-service sources for caregiving education and resource pathways. Verify program eligibility, availability, benefits, and local contacts from current official sources before publication. Exclude assumptions about family relationship, cultural practices, consent authority, guardianship, financial responsibility, service availability, or a care recipient’s diagnosis.",
    "safetyNotes": "Do not imply that a member is legally authorized to make health decisions or that family caregiving is safe or sufficient for a particular person. Do not provide clinical instructions, abuse screening conclusions, legal authority advice, benefits eligibility, or local service guarantees. If a member describes immediate danger, suspected abuse, or a medical emergency, route to appropriate emergency or protective resources according to an approved safety policy.",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/caregiving",
        "publisher": "National Institute on Aging, NIH",
        "purpose": "candidate source for caregiver worksheets, shared-responsibility material, and support for family and friend caregiving."
      },
      {
        "url": "https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program",
        "publisher": "Administration for Community Living (ACL), HHS",
        "purpose": "candidate source for the federally administered caregiver-support framework and links to public-service resource pathways."
      }
    ],
    "nextBricks": [
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps caregivers prepare questions and support the care recipient’s communication choices. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "offers an official-information route for members who need to understand plan or bill questions without a coverage determination. -"
      },
      {
        "title": "Grief and Bereavement Support",
        "reason": "remains an optional route for a caregiver who names loss or grief. -"
      },
      {
        "title": "Pregnancy Care and Postpartum Navigation",
        "reason": "is visible only when the member explicitly identifies pregnancy or postpartum caregiving needs. -"
      },
      {
        "title": "Advance Care Planning",
        "reason": "a future, separately governed legal/medical topic needed for members who voluntarily request planning information."
      }
    ]
  },
  {
    "slug": "grief-and-bereavement-support",
    "title": "Grief and Bereavement Support",
    "domain": "medical",
    "summary": "Help a member find compassionate, source-reviewed information about grief, support options, and urgent emotional-support routing while respecting that grief experiences and practices differ.",
    "iconKey": "heart-pulse",
    "sortOrder": 20,
    "isFeatured": false,
    "sourceStandard": "Prefer NIH/NIA, SAMHSA, CDC, and vetted public-service sources; content must be trauma-informed, non-prescriptive, culturally humble, and medically reviewed where it discusses mental-health conditions. Do not force stage models, define a “normal” timeline, or label grief as a disorder. Exclude social-media advice, commercial grief services, unreviewed support-group claims, and any guarantee of emotional or clinical outcome.",
    "safetyNotes": "This topic must not diagnose prolonged grief, depression, trauma, or suicide risk, and it must not promise that any support will resolve grief. If a member says they may harm themselves or another person, or needs immediate emotional support, prominently route to 988 in the U.S. by call, text, or chat; for immediate danger, direct them to 911/local emergency services. Do not assume the nature of the loss, the member’s faith or culture, relationship to the person lost, or desire for counseling.",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/grief-and-mourning/coping-grief-and-loss",
        "publisher": "National Institute on Aging, NIH",
        "purpose": "candidate source for grief, bereavement-support, and low-cost/help-seeking information; NIA explicitly notes there is no right or wrong way to mourn."
      },
      {
        "url": "https://www.samhsa.gov/mental-health/988",
        "publisher": "Substance Abuse and Mental Health Services Administration (SAMHSA), HHS",
        "purpose": "candidate source for verified crisis routing: 988 offers 24/7 support by call, text, or chat."
      }
    ],
    "nextBricks": [
      {
        "title": "Family Caregiving Navigation",
        "reason": "offers practical support for a member whose grief is connected to caregiving, only when they choose it. -"
      },
      {
        "title": "Navigating Health Care Appointments and Communication",
        "reason": "helps a member prepare to raise grief-related concerns with a clinician. -"
      },
      {
        "title": "Mental Health Care Navigation",
        "reason": "a future, separately sourced topic for finding non-emergency mental-health care; it must never replace crisis routing. -"
      },
      {
        "title": "Pregnancy Care and Postpartum Navigation",
        "reason": "an opt-in path when a member explicitly names a pregnancy-related or postpartum concern. -"
      },
      {
        "title": "Health Insurance Coverage and Medical Bills",
        "reason": "offers a limited, separate route for a member who asks about plan or billing information for support services."
      }
    ]
  },
  {
    "slug": "everyday-money-and-bank-accounts",
    "title": "Everyday money and bank accounts",
    "domain": "financial",
    "summary": "Help a member understand common bank-account questions, account safety, and where to verify basic protections without assuming which financial products they use.",
    "iconKey": "landmark",
    "sortOrder": 21,
    "isFeatured": false,
    "sourceStandard": "Use CFPB consumer education for general banking questions and FDIC primary material for federal deposit-insurance scope and verification tools. Use official state banking regulators only for state-specific rules. Exclude bank marketing, comparison-site rankings, affiliate offers, unverified social posts, and assertions that a particular account is suitable.",
    "safetyNotes": "General education only, not financial advice or a recommendation to open, close, or move an account. Do not collect account, routing, card, password, or login information. Explain that protection and product terms depend on the institution and account, and verify current details with the official source.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/",
        "publisher": "Consumer Financial Protection Bureau (CFPB)",
        "purpose": "Candidate entry point for CFPB’s consumer education, including bank accounts and services."
      },
      {
        "url": "https://www.fdic.gov/resources/deposit-insurance",
        "publisher": "Federal Deposit Insurance Corporation (FDIC)",
        "purpose": "Primary source for what FDIC deposit insurance covers, what it does not cover, and bank-insurance verification."
      }
    ],
    "nextBricks": [
      {
        "title": "Credit reports and scores",
        "reason": "Account questions often lead to questions about the records used in credit decisions. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Suspicious account activity or a questionable financial website needs a safety-focused path. -"
      },
      {
        "title": "Sending money abroad and remittances",
        "reason": "Members may need a separate, rights-focused path when funds cross national borders. -"
      },
      {
        "title": "Understanding insurance and claims",
        "reason": "Deposit insurance and insurance policies are distinct concepts that should not be conflated."
      }
    ]
  },
  {
    "slug": "credit-reports-and-scores",
    "title": "Credit reports and scores",
    "domain": "financial",
    "summary": "Help a member navigate the difference between credit reports and scores, review records, address possible errors, and recognize misleading credit-repair claims.",
    "iconKey": "landmark",
    "sortOrder": 22,
    "isFeatured": false,
    "sourceStandard": "Prefer CFPB’s official consumer guidance and the federally authorized credit-report access source. Add primary statutory or regulator material only when a reviewed entry needs rights-specific detail. Exclude score-selling promotions, credit-repair advertisements, lender promises, and claims that any action will produce a particular score or approval outcome.",
    "safetyNotes": "Do not promise a score increase, removal of accurate information, approval, or a timeline. Credit-report and dispute processes are not legal advice. Avoid requesting a member’s report, Social Security number, date of birth, or account identifiers in the Library.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/",
        "publisher": "CFPB",
        "purpose": "Candidate source for definitions, report review, dispute pathways, and warnings about credit-repair scams."
      },
      {
        "url": "https://www.annualcreditreport.com/index.action",
        "publisher": "AnnualCreditReport.com, created by the three nationwide credit reporting companies as the central source for reports available under federal law",
        "purpose": "Candidate operational source for requesting credit reports."
      }
    ],
    "nextBricks": [
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "An unfamiliar account or inquiry may call for identity-theft resources. -"
      },
      {
        "title": "Debt collection and repayment navigation",
        "reason": "Collection activity can raise questions about records, notices, and debt disputes. -"
      },
      {
        "title": "Student loans and repayment",
        "reason": "Student-loan questions may involve account history and repayment records. -"
      },
      {
        "title": "Everyday money and bank accounts",
        "reason": "Members may want to distinguish deposit accounts from credit reporting."
      }
    ]
  },
  {
    "slug": "debt-collection-and-repayment",
    "title": "Debt collection and repayment navigation",
    "domain": "financial",
    "summary": "Help a member recognize a debt-collection issue, locate official information about notices and communication, and identify optional paths for debt-specific questions.",
    "iconKey": "landmark",
    "sortOrder": 23,
    "isFeatured": false,
    "sourceStandard": "Use CFPB and FTC consumer guidance as the national baseline. For litigation, limitations periods, garnishment, exemptions, or state collection rules, require current official state/court sources and present them as jurisdiction-specific. Exclude debt-settlement pitches, paid “debt relief” lead generators, personal anecdotes, and any claim that a debt will disappear or be resolved.",
    "safetyNotes": "This topic is not legal advice and must not tell a member whether they owe a debt, whether to pay, settle, ignore, or acknowledge it, or how a court will rule. Court papers and deadlines can be time-sensitive; route members to current court, legal-aid, or attorney resources only when a governed source supports the route. Never request collection notices or sensitive account information in chat.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/debt-collection/",
        "publisher": "CFPB",
        "purpose": "Candidate source for collection terminology, communications, validation, complaints, and action pathways."
      },
      {
        "url": "https://consumer.ftc.gov/articles/debt-collection-faqs",
        "publisher": "Federal Trade Commission (FTC)",
        "purpose": "Candidate source for consumer-facing frequently asked questions on debt collection and reporting concerns."
      }
    ],
    "nextBricks": [
      {
        "title": "Medical bills and medical debt",
        "reason": "Medical bills have their own billing and assistance-navigation questions. -"
      },
      {
        "title": "Student loans and repayment",
        "reason": "Federal and private education debt can require separate source paths. -"
      },
      {
        "title": "Credit reports and scores",
        "reason": "Collection questions may lead to review of consumer reports or reported information. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "A claimed debt may be unfamiliar, fraudulent, or connected to identity misuse."
      }
    ]
  },
  {
    "slug": "student-loans-and-repayment",
    "title": "Student loans and repayment",
    "domain": "financial",
    "summary": "Help a member distinguish general education-loan questions from official federal repayment, servicer, and private-loan information without presuming loan type or eligibility.",
    "iconKey": "landmark",
    "sortOrder": 24,
    "isFeatured": false,
    "sourceStandard": "Use Federal Student Aid as the primary source for federal loans and current federal repayment changes, and CFPB for consumer education across federal and private loans. Require the loan holder, servicer, or official program source before publishing any current plan, payment, discharge, or forgiveness detail. Exclude refinancing advertising, paid enrollment services, lender promotions, and outcome promises.",
    "safetyNotes": "No loan, refinancing, repayment-plan, consolidation, discharge, forgiveness, or eligibility recommendation should be generated from a profile. Rules and programs change. Require the official administering source for current details, and warn against sharing Federal Student Aid credentials or other account credentials with anyone.",
    "candidateSources": [
      {
        "url": "https://studentaid.gov/manage-loans/repayment",
        "publisher": "U.S. Department of Education, Federal Student Aid",
        "purpose": "Primary candidate source for federal-loan repayment navigation, servicers, payment difficulty, and official program updates."
      },
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/student-loans/",
        "publisher": "CFPB",
        "purpose": "Candidate source for consumer questions about obtaining and repaying student loans, including private-loan context."
      }
    ],
    "nextBricks": [
      {
        "title": "Debt collection and repayment navigation",
        "reason": "A member may need collection-specific guidance when loans are in collection. -"
      },
      {
        "title": "Credit reports and scores",
        "reason": "Members may want to understand reporting or error questions related to loan records. -"
      },
      {
        "title": "Government benefits and financial help navigation",
        "reason": "A change in work or household circumstances may lead to broader public-assistance questions. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Loan-relief and impersonation scams require a separate consumer-protection path."
      }
    ]
  },
  {
    "slug": "medical-bills-and-medical-debt",
    "title": "Medical bills and medical debt",
    "domain": "financial",
    "summary": "Help a member locate official starting points for understanding medical bills, coverage-related payment help, and general debt-management navigation without interpreting a bill or medical need.",
    "iconKey": "landmark",
    "sortOrder": 25,
    "isFeatured": false,
    "sourceStandard": "Use USAGov and the applicable program’s primary official source for broad coverage and cost-help navigation. For a specific provider bill, publish only reviewed guidance that tells members to contact the billing entity or official program; do not interpret charges, coverage, medical necessity, charity-care eligibility, or collection status. Exclude hospital marketing, billing-service solicitations, and promises of bill reduction.",
    "safetyNotes": "This is financial and coverage navigation, not medical advice, diagnosis, or a judgment about treatment. Do not ask for medical records, insurance member numbers, bills, or diagnoses. A member with urgent health symptoms should use emergency or appropriate clinical services rather than wait for a Library response. Financial-assistance and coverage rules vary by program and location.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/help-with-medical-bills",
        "publisher": "USAGov, U.S. General Services Administration",
        "purpose": "Candidate source for high-level federal navigation to health-coverage programs, medical-expense help, and debt-management information."
      },
      {
        "url": "https://www.usa.gov/health-insurance",
        "publisher": "USAGov, U.S. General Services Administration",
        "purpose": "Candidate source for official routing to Medicaid, CHIP, Medicare, Marketplace, and COBRA information."
      }
    ],
    "nextBricks": [
      {
        "title": "Health insurance and coverage navigation",
        "reason": "Coverage status and insurance terms may be central to a billing question. -"
      },
      {
        "title": "Debt collection and repayment navigation",
        "reason": "A bill sent to collection creates distinct consumer-rights questions. -"
      },
      {
        "title": "Government benefits and financial help navigation",
        "reason": "Some members may wish to explore official public-program pathways. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Unrecognized medical charges or information concerns need an identity-and-fraud route."
      }
    ]
  },
  {
    "slug": "government-benefits-and-financial-help",
    "title": "Government benefits and financial help",
    "domain": "financial",
    "summary": "Help a member find official government starting points for benefit categories and applications without predicting eligibility or asking them to disclose protected or sensitive circumstances.",
    "iconKey": "landmark",
    "sortOrder": 26,
    "isFeatured": false,
    "sourceStandard": "Use USAGov’s benefits pages and the official federal or state agency that administers a particular program. State clearly that an official finder is a starting point, not an eligibility decision. Exclude paid application help, websites that sell access to public benefits, scams, and any unverified assertion about immigration status, income, disability, family composition, or program qualification.",
    "safetyNotes": "Never infer or request a member’s immigration status, disability, household structure, income, veteran status, age, pregnancy status, or other sensitive eligibility factor merely to present this topic. Do not promise eligibility, an approval, payment, time frame, or application result. Link to the official administering agency for current rules and protect against phishing by keeping the Library’s links canonical.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/benefits",
        "publisher": "USAGov, U.S. General Services Administration",
        "purpose": "Candidate source for the official overview of government-benefit categories and links to administering programs."
      },
      {
        "url": "https://www.usa.gov/benefit-finder",
        "publisher": "USAGov, U.S. General Services Administration",
        "purpose": "Candidate source for a category-based official starting point to explore benefits and application information."
      }
    ],
    "nextBricks": [
      {
        "title": "Health insurance and coverage navigation",
        "reason": "Health-coverage programs are a common official benefits category. -"
      },
      {
        "title": "Medical bills and medical debt",
        "reason": "A coverage or cost question may lead to medical-expense resources. -"
      },
      {
        "title": "Student loans and repayment",
        "reason": "Education-finance questions may need an official aid pathway rather than a benefits estimate. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Benefit-related impersonation and “free money” claims need a consumer-protection route."
      }
    ]
  },
  {
    "slug": "health-insurance-and-coverage-navigation",
    "title": "Health insurance and coverage navigation",
    "domain": "financial",
    "summary": "Help a member understand where to find official information about major U.S. health-coverage pathways and enrollment questions without determining which coverage they should select.",
    "iconKey": "landmark",
    "sortOrder": 27,
    "isFeatured": false,
    "sourceStandard": "Use HealthCare.gov/Centers for Medicare & Medicaid Services and USAGov as federal starting points; use the official state marketplace or administering agency for state-specific enrollment, plan, or program material. Exclude broker advertisements, lead forms, plan rankings, pricing snapshots, network claims, eligibility calculators that are not official, and advice selecting a plan.",
    "safetyNotes": "This topic is insurance navigation, not medical advice or coverage advice. Do not infer medical condition, disability, income, family role, immigration status, or enrollment eligibility. Do not promise plan availability, premiums, subsidies, benefits, provider networks, enrollment dates, or coverage results; all can vary and require current official verification.",
    "candidateSources": [
      {
        "url": "https://www.healthcare.gov/",
        "publisher": "U.S. Centers for Medicare & Medicaid Services",
        "purpose": "Primary candidate source for federal Marketplace basics, enrollment/change pathways, coverage information, and official help routes."
      },
      {
        "url": "https://www.usa.gov/health-insurance",
        "publisher": "USAGov, U.S. General Services Administration",
        "purpose": "Candidate source that routes to official information on Medicaid, CHIP, Medicare, Marketplace, and COBRA."
      }
    ],
    "nextBricks": [
      {
        "title": "Medical bills and medical debt",
        "reason": "Questions about bills often require a separate coverage-and-cost path. -"
      },
      {
        "title": "Government benefits and financial help navigation",
        "reason": "Public health programs connect to broader official benefits navigation. -"
      },
      {
        "title": "Understanding insurance and claims",
        "reason": "Plan terminology, documents, and claim questions need a distinct insurance-literacy branch. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Insurance-shopping and impersonation scams should be surfaced as an optional safety path."
      }
    ]
  },
  {
    "slug": "understanding-insurance-and-claims",
    "title": "Understanding insurance and claims",
    "domain": "financial",
    "summary": "Help a member find regulator-supported explanations of insurance types, policy and claim questions, and complaint pathways without endorsing an insurer, agent, or policy.",
    "iconKey": "landmark",
    "sortOrder": 28,
    "isFeatured": false,
    "sourceStandard": "Use state insurance departments and NAIC’s regulator-supported consumer information for general insurance education, claims complaints, and company-research methodology. For a specific policy or claim, require the policy document, official insurer communication, and the appropriate state regulator’s current rules before publishing substantive guidance. Exclude insurer advertising, agent referrals, sponsored rankings, unverified complaint narratives, and claims that a carrier is best or will pay a claim.",
    "safetyNotes": "This is not legal, financial, medical, or claims-adjusting advice. Avoid advising a member to file, withdraw, settle, appeal, or abandon a claim. State insurance rules and policy terms vary. Do not accept policy numbers, claim documents, photos, or medical details through the Library.",
    "candidateSources": [
      {
        "url": "https://content.naic.org/consumer",
        "publisher": "National Association of Insurance Commissioners (NAIC)",
        "purpose": "Candidate source for consumer education on insurance types, claims, state-department help, and regulator tools."
      },
      {
        "url": "https://content.naic.org/article/how-file-complaint-and-research-complaints-against-insurance-carriers",
        "publisher": "NAIC",
        "purpose": "Candidate source for state-department complaint navigation and cautions on interpreting complaint data."
      }
    ],
    "nextBricks": [
      {
        "title": "Health insurance and coverage navigation",
        "reason": "Health coverage has separate federal program and enrollment pathways. -"
      },
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Suspicious insurance contacts, requests, or identity concerns need a safety path. -"
      },
      {
        "title": "Everyday money and bank accounts",
        "reason": "Members may want to clarify the difference between deposit insurance and other insurance. -"
      },
      {
        "title": "Government benefits and financial help navigation",
        "reason": "Official benefit programs may be relevant to a broader financial-navigation question."
      }
    ]
  },
  {
    "slug": "sending-money-abroad-and-remittances",
    "title": "Sending money abroad and remittances",
    "domain": "financial",
    "summary": "Help a member locate official consumer information about sending money internationally, reviewing required disclosures, and responding to a transfer problem without recommending a transfer provider.",
    "iconKey": "landmark",
    "sortOrder": 29,
    "isFeatured": false,
    "sourceStandard": "Use CFPB primary consumer resources on money transfers and remittance rights; use the transfer provider’s official disclosure only for the member’s particular transaction. Exclude exchange-rate comparisons, “best” provider rankings, affiliate links, transfer promotions, claims of lowest cost or fastest delivery, and advice to send money to an unverified person.",
    "safetyNotes": "Do not recommend a provider, quote a fee, exchange rate, delivery time, or payout availability, or guarantee cancellation or recovery. Do not collect recipient, bank, routing, account, identification, or transaction details. If a member suspects a scam or sent money under pressure, route to official fraud and provider-contact resources without promising recovery.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/money-transfers/",
        "publisher": "CFPB",
        "purpose": "Candidate source for money-transfer terminology, international-transfer protections, error navigation, cancellation questions, and complaints."
      },
      {
        "url": "https://www.consumerfinance.gov/ask-cfpb/what-is-a-remittance-transfer-and-what-are-my-rights-en-1161/",
        "publisher": "CFPB",
        "purpose": "Candidate source for a focused explanation of remittance transfers and consumer rights."
      }
    ],
    "nextBricks": [
      {
        "title": "Fraud, scams, and identity theft",
        "reason": "Urgent transfer requests and unfamiliar contacts can be scam-related. -"
      },
      {
        "title": "Everyday money and bank accounts",
        "reason": "Bank and account questions may arise when choosing a payment method. -"
      },
      {
        "title": "Consumer complaints and problem resolution",
        "reason": "A transfer error may lead to a formal complaint path after contacting the provider. -"
      },
      {
        "title": "Government benefits and financial help navigation",
        "reason": "Keep benefit-related questions distinct from private money-transfer decisions."
      }
    ]
  },
  {
    "slug": "fraud-scams-and-identity-theft",
    "title": "Fraud, scams, and identity theft",
    "domain": "financial",
    "summary": "Help a member recognize official consumer-protection resources for suspected scams, unauthorized financial activity, and identity theft, including reporting and recovery starting points.",
    "iconKey": "landmark",
    "sortOrder": 30,
    "isFeatured": false,
    "sourceStandard": "Use FTC and CFPB primary consumer resources for scam prevention, reporting, identity-theft recovery, and unauthorized-transaction questions. Link to official reporting portals only after review. Exclude private recovery services, “guaranteed refund” offers, breach-list reposts, unverified scam alerts, and any assertion that a caller, text, email, site, or transaction is certainly legitimate or fraudulent without verification.",
    "safetyNotes": "Treat suspected fraud as potentially time-sensitive, but do not diagnose a scam, guarantee recovery, or ask for passwords, one-time codes, account numbers, Social Security numbers, screenshots of IDs, or other sensitive data. Encourage members to use independently accessed official websites and their financial institution’s verified contact channels. If personal safety or coercion is involved, use appropriate emergency or local safety resources. ---",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/consumer-tools/fraud/",
        "publisher": "CFPB",
        "purpose": "Candidate source for recognizing, preventing, reporting, and responding to financial fraud and scams."
      },
      {
        "url": "https://consumer.ftc.gov/identity-theft-and-online-security/identity-theft",
        "publisher": "FTC",
        "purpose": "Candidate source for identity-theft protection, recovery topics, credit freezes, fraud alerts, and official related resources."
      },
      {
        "url": "https://consumer.ftc.gov/scams",
        "publisher": "FTC",
        "purpose": "Candidate source for current scam education, reporting route, and recovery-oriented consumer information."
      }
    ],
    "nextBricks": [
      {
        "title": "Credit reports and scores",
        "reason": "Identity concerns can lead to official consumer-report review and dispute information. -"
      },
      {
        "title": "Everyday money and bank accounts",
        "reason": "Unauthorized activity may involve an account or a suspicious bank site. -"
      },
      {
        "title": "Sending money abroad and remittances",
        "reason": "Money-transfer scams need the transfer-specific rights and error path. -"
      },
      {
        "title": "Debt collection and repayment navigation",
        "reason": "A collection notice may be unfamiliar or fraudulent and needs careful, source-backed handling. -"
      },
      {
        "title": "Understanding insurance and claims",
        "reason": "Some fraud concerns involve insurance-related contacts or documents, which belong in a separate regulator path."
      }
    ]
  },
  {
    "slug": "choosing-early-learning-and-child-care",
    "title": "Choosing Early Learning and Child Care",
    "domain": "education",
    "summary": "Help a member understand common child-care choices and the questions to use when comparing safety, quality, location, schedule, and payment information without recommending a particular program.",
    "iconKey": "graduation-cap",
    "sortOrder": 31,
    "isFeatured": false,
    "sourceStandard": "Use the current ChildCare.gov consumer-education pages and the relevant state or territory consumer-education and licensing authority as first-tier sources. Use only current, directly attributable licensing, inspection, and public-program information in any later entry. Exclude provider marketing, unverified parent reviews, inferred availability, invented quality labels, price claims, and an assumption that licensing alone establishes quality or fit.",
    "safetyNotes": "Do not request or retain a child’s identifying details to answer a general question. Do not claim a program is safe, suitable, open, licensed, affordable, or available without a governed, current record. Present state or territory rules as jurisdiction-specific and time-sensitive; urgent concerns about a child’s immediate safety require appropriate local emergency or protective-services routing, not Library research.",
    "candidateSources": [
      {
        "url": "https://childcare.gov/consumer-education",
        "publisher": "U.S. Administration for Children and Families",
        "purpose": "First-tier consumer overview that links care options, regulation, choosing quality, payment help, and development resources."
      },
      {
        "url": "https://childcare.gov/consumer-education/what-are-my-child-care-options",
        "publisher": "U.S. Administration for Children and Families",
        "purpose": "Canonical federal starting point for explaining option categories and routing members to their state or territory information."
      }
    ],
    "nextBricks": [
      {
        "title": "Understanding Child Care Licensing and Quality",
        "reason": "compares regulated care and quality-information questions before a member evaluates a program. -"
      },
      {
        "title": "Paying for Child Care",
        "reason": "follows a request about costs with public benefit and assistance information, without estimating a household’s eligibility. -"
      },
      {
        "title": "Supporting a Child’s Early Learning",
        "reason": "connects care selection with development and learning resources without treating care choice as a diagnosis or outcome guarantee. -"
      },
      {
        "title": "K–12 School Navigation",
        "reason": "provides the next step for a family moving from early learning into school-age enrollment."
      }
    ]
  },
  {
    "slug": "navigating-k12-schools-and-family-school-communication",
    "title": "Navigating K–12 Schools and Family–School Communication",
    "domain": "education",
    "summary": "Help families orient to school search, enrollment questions, school information, and constructive family–school communication without selecting a school for them.",
    "iconKey": "graduation-cap",
    "sortOrder": 32,
    "isFeatured": false,
    "sourceStandard": "Prioritize the current district or state education agency for enrollment, attendance boundaries, academic requirements, transportation, and family communication. For nationally comparable basic public-school identifiers, use the NCES Common Core of Data (CCD) locator. Exclude crowd-sourced ratings, private rankings, generalized claims about school climate or performance, and any inference from a school’s presence in a government dataset.",
    "safetyNotes": "Enrollment rules, boundaries, deadlines, transportation, and records procedures are local and can change. The Library must not infer custody, guardianship, housing status, disability, language preference, or school assignment. Avoid presenting school-search data as a safety, accreditation, quality, or admissions conclusion.",
    "candidateSources": [
      {
        "url": "https://nces.ed.gov/ccd/schoolsearch/",
        "publisher": "National Center for Education Statistics, U.S. Department of Education",
        "purpose": "Authoritative search interface for public-school identifiers, location, contact information, and selected characteristics; its stated non-endorsement note is important for product framing."
      },
      {
        "url": "https://www.ed.gov/media/document/parent-and-family-engagement-guidance-2025-109202.pdf",
        "publisher": "U.S. Department of Education",
        "purpose": "Primary public guidance for framing ongoing, two-way family engagement rather than treating communication as a one-time transaction."
      }
    ],
    "nextBricks": [
      {
        "title": "School Enrollment and Records",
        "reason": "follows an enrollment question with the appropriate district-specific processes and documents. -"
      },
      {
        "title": "Understanding Special Education and Section 504",
        "reason": "provides a distinct, rights-based path when a member explicitly asks about supports or accommodations. -"
      },
      {
        "title": "College and Career Planning in Middle and High School",
        "reason": "connects school navigation to longer-range planning without assuming a child’s plans. -"
      },
      {
        "title": "Youth Mentoring and Enrichment",
        "reason": "offers optional out-of-school-time support questions rather than presenting programs as substitutes for school services."
      }
    ]
  },
  {
    "slug": "understanding-special-education-ieps-and-section-504",
    "title": "Understanding Special Education, IEPs, and Section 504",
    "domain": "legal",
    "summary": "Help a member find authoritative, plain-language starting points for understanding school-based disability rights, evaluations, individualized education programs (IEPs), Section 504, and dispute-resolution pathways.",
    "iconKey": "scale",
    "sortOrder": 33,
    "isFeatured": false,
    "sourceStandard": "Treat statutes, regulations, current Office of Special Education Programs (OSEP) and Office for Civil Rights (OCR) guidance, and the applicable state education agency as first tier. Use federally funded Parent Training and Information Centers only after confirming the current center and scope. Exclude diagnosis, predictions of eligibility, legal advice, claims that a student has a disability, and claims that a school must take a specific action absent a reviewed jurisdictional source.",
    "safetyNotes": "This is general education-rights information, not legal advice or an eligibility determination. Never infer a diagnosis, disability, need for services, parent status, or dispute from a search. Explain that IDEA and Section 504 are distinct frameworks and route jurisdiction-specific procedural questions to the relevant state or school authority. If a member describes an immediate threat to a student’s safety, route to emergency or crisis services rather than attempting to adjudicate a school dispute.",
    "candidateSources": [
      {
        "url": "https://sites.ed.gov/idea/parents-families/",
        "publisher": "Office of Special Education Programs",
        "purpose": "Primary hub for IDEA family resources, IEP and procedural-safeguard information, state-level routing, and federally funded parent-center pathways."
      },
      {
        "url": "https://www.ed.gov/laws-and-policy/individuals-disabilities/section-504",
        "publisher": "U.S. Department of Education",
        "purpose": "Primary civil-rights overview and routing page for equal access, Section 504, and related OCR resources."
      }
    ],
    "nextBricks": [
      {
        "title": "Requesting an Evaluation and Reviewing School Records",
        "reason": "separates process questions from a conclusion about whether a student qualifies. -"
      },
      {
        "title": "Preparing for an IEP or 504 Meeting",
        "reason": "provides meeting-preparation guidance after a member identifies that as their goal. -"
      },
      {
        "title": "Resolving a School Disagreement",
        "reason": "routes to official state and federal dispute-information sources without offering legal representation or legal conclusions. -"
      },
      {
        "title": "Transition Planning for Education and Work",
        "reason": "creates an optional bridge from school planning to further education, employment, and independent-living questions."
      }
    ]
  },
  {
    "slug": "youth-mentoring-enrichment-and-positive-development",
    "title": "Youth Mentoring, Enrichment, and Positive Development",
    "domain": "education",
    "summary": "Help a member understand mentoring, enrichment, and youth-development questions and identify the information to verify before considering a program.",
    "iconKey": "graduation-cap",
    "sortOrder": 34,
    "isFeatured": false,
    "sourceStandard": "Use Youth.gov, relevant federal youth-program pages, and current evidence reviews or guidance from public agencies as first tier. A future program-specific entry needs independently verified operating status, safeguarding practices where publicly appropriate, and a current source—not a generic claim that mentoring produces a particular outcome. Exclude testimonial-only efficacy claims, unverified background-check claims, and local program lists assembled from advertising.",
    "safetyNotes": "Do not collect a minor’s personal information, home address, school schedule, or contact details to provide general guidance. Do not represent that a program has been screened, is safe, is accepting participants, or fits a youth’s needs unless those are current governed records. Safety concerns, suspected abuse, or immediate danger require appropriate emergency or child-protection routing, not a mentoring referral.",
    "candidateSources": [
      {
        "url": "https://youth.gov/youth-topics/mentoring",
        "publisher": "Interagency Working Group on Youth Programs",
        "purpose": "Federal overview that defines mentoring within positive youth development and connects to evidence and program resources."
      },
      {
        "url": "https://www.dol.gov/agencies/eta/youth/workforce-pathways-for-youth",
        "publisher": "Employment and Training Administration",
        "purpose": "Primary source for youth career-related services such as career exploration, job readiness, work opportunities, and apprenticeships in an out-of-school-time context."
      }
    ],
    "nextBricks": [
      {
        "title": "Youth Career Exploration and Work Experience",
        "reason": "connects mentoring to voluntary career-learning questions without assuming employment readiness. -"
      },
      {
        "title": "College and Career Planning in Middle and High School",
        "reason": "offers a structured next question for education planning. -"
      },
      {
        "title": "Youth Safety and Digital Life",
        "reason": "makes safeguarding questions available as a distinct topic rather than implying risks about a named program. -"
      },
      {
        "title": "Family–School Communication",
        "reason": "supports coordination questions between a family and school where the member asks for it."
      }
    ]
  },
  {
    "slug": "planning-for-college-or-career-school-applications",
    "title": "Planning for College or Career School Applications",
    "domain": "education",
    "summary": "Help a member organize school-research, application, preparation, and comparison questions across college and career-school options without predicting admission.",
    "iconKey": "graduation-cap",
    "sortOrder": 35,
    "isFeatured": false,
    "sourceStandard": "Use Federal Student Aid’s current preparation checklists and official school/data tools as first-tier orientation sources; use each institution’s current admissions page only for that institution’s requirements. Exclude admissions-chance predictions, rankings, test-prep advertising, consultant claims, and advice that assumes a member’s grades, test history, immigration status, finances, or prior education.",
    "safetyNotes": "Do not guarantee admission, transferability, job placement, aid, completion, or earnings. Requirements, tests, documents, and deadlines vary by institution and can change. The Library should not request transcripts, immigration documents, identification numbers, or application credentials; link to official instructions instead.",
    "candidateSources": [
      {
        "url": "https://studentaid.gov/resources/prepare-for-college/checklists",
        "publisher": "U.S. Department of Education, Federal Student Aid",
        "purpose": "Canonical stage-based preparation resource, including high-school, graduate-school, and adult-student pathways."
      },
      {
        "url": "https://collegescorecard.ed.gov/",
        "publisher": "U.S. Department of Education",
        "purpose": "Primary comparison tool for institution and field-of-study data, with filters and side-by-side comparison capability."
      }
    ],
    "nextBricks": [
      {
        "title": "Comparing Colleges, Programs, and Fields of Study",
        "reason": "adds public data questions after a member has identified comparison criteria. -"
      },
      {
        "title": "Financial Aid and FAFSA Planning",
        "reason": "separates application preparation from aid forms, deadlines, and award offers. -"
      },
      {
        "title": "HBCU and Minority-Serving Institution Planning",
        "reason": "provides an optional institution-type path without presuming identity or preference. -"
      },
      {
        "title": "Apprenticeships and Work-Based Learning",
        "reason": "keeps alternate pathways visible without treating a degree as the default route."
      }
    ]
  },
  {
    "slug": "planning-for-hbcus-and-mission-driven-institutions",
    "title": "Planning for HBCUs and Other Mission-Driven Institutions",
    "domain": "education",
    "summary": "Help a member research Historically Black Colleges and Universities (HBCUs) and other institution categories using official definitions and comparable data, without assuming an identity, preference, or expected experience.",
    "iconKey": "graduation-cap",
    "sortOrder": 36,
    "isFeatured": false,
    "sourceStandard": "Use the federal HBCU definition and the official NCES/Department of Education lists or institution data as first tier. Attribute an institution’s programs, admission requirements, costs, and services only to its current official materials or properly labeled federal data with the reporting period. Exclude informal “best HBCU” lists, social-media reputation claims, assumed racial composition, and claims about belonging, outcomes, or campus culture that are not supported by reviewed sources.",
    "safetyNotes": "Participation in this topic must be explicit; do not infer race, heritage, culture, or desired campus environment. A federal designation or dataset listing does not guarantee admission, cost, accessibility, program availability, housing, safety, or a particular student experience. Verify time-sensitive institutional facts against the institution’s own current page before publication.",
    "candidateSources": [
      {
        "url": "https://www.ed.gov/about/initiatives/white-house-initiative-historically-black-colleges-and-universities",
        "publisher": "U.S. Department of Education",
        "purpose": "Authoritative definition and official routing to the NCES HBCU list and NCES fact resources."
      },
      {
        "url": "https://nces.ed.gov/collegenavigator/",
        "publisher": "National Center for Education Statistics, U.S. Department of Education",
        "purpose": "Official search and comparison interface for institutions, programs, award level, location, and selected data fields."
      }
    ],
    "nextBricks": [
      {
        "title": "Comparing Colleges, Programs, and Fields of Study",
        "reason": "links institutional-category research to a member’s actual program and comparison criteria. -"
      },
      {
        "title": "Financial Aid and FAFSA Planning",
        "reason": "follows a request about paying for a particular college with current official aid information. -"
      },
      {
        "title": "College Application Planning",
        "reason": "supports the application sequence after a member identifies prospective institutions. -"
      },
      {
        "title": "Campus Support and Student Success Questions",
        "reason": "creates a future path for reviewing official student-support information without representing services as guaranteed."
      }
    ]
  },
  {
    "slug": "understanding-financial-aid-and-fafsa",
    "title": "Understanding Financial Aid and the FAFSA",
    "domain": "financial",
    "summary": "Help a member understand the official sequence for federal student-aid planning, FAFSA submission, aid-offer review, and follow-up questions without estimating eligibility or telling them which aid to accept.",
    "iconKey": "landmark",
    "sortOrder": 37,
    "isFeatured": false,
    "sourceStandard": "Treat current Federal Student Aid pages, the live FAFSA application, and current school/state financial-aid-office instructions as first tier. Recheck all deadlines, forms, tax-year language, and aid rules before publication because they change by award year and school or state. Exclude individualized eligibility calculations, aid estimates presented as awards, promises of funding, advice to borrow, and third-party “guaranteed scholarship” claims.",
    "safetyNotes": "This is general financial-aid information, not financial, tax, immigration, or legal advice. Do not infer dependency status, income, citizenship or eligible noncitizen status, family structure, tax filing, or eligibility. Never ask members to disclose an FSA ID, Social Security number, tax information, or other application credentials. Deadline and offer questions require a current official source and, when relevant, the school’s financial-aid office.",
    "candidateSources": [
      {
        "url": "https://studentaid.gov/h/understand-aid/how-aid-works",
        "publisher": "U.S. Department of Education, Federal Student Aid",
        "purpose": "Official overview of planning, FAFSA, aid-offer review, disbursement, and repayment stages."
      },
      {
        "url": "https://studentaid.gov/apply-for-aid/fafsa/fafsa-deadlines",
        "publisher": "U.S. Department of Education, Federal Student Aid",
        "purpose": "Current federal deadline source that expressly distinguishes federal, school, and state deadlines."
      }
    ],
    "nextBricks": [
      {
        "title": "College and Career School Cost Questions",
        "reason": "separates an institution’s published cost data from a member’s individual aid offer. -"
      },
      {
        "title": "Comparing College and Career School Options",
        "reason": "links aid questions to comparable program and institution information. -"
      },
      {
        "title": "Scholarships and Grants: Finding Official Information",
        "reason": "supports source-vetted scholarship questions while avoiding unverified listings. -"
      },
      {
        "title": "Student Loan Repayment Basics",
        "reason": "becomes relevant only if a member explicitly asks about borrowing or repayment."
      }
    ]
  },
  {
    "slug": "community-college-certificates-and-career-training-pathways",
    "title": "Community College, Certificates, and Career Training Pathways",
    "domain": "education",
    "summary": "Help a member compare nondegree, certificate, community-college, and career-training pathway questions using official program, aid, and outcome sources without asserting that any pathway is better for them.",
    "iconKey": "graduation-cap",
    "sortOrder": 38,
    "isFeatured": false,
    "sourceStandard": "Use the institution’s current catalog and accreditation disclosures, federal College Scorecard and NCES data where applicable, and current Federal Student Aid information. Treat outcomes and program availability as reporting-period-specific. Exclude school advertising, placement guarantees, salary promises, unverified transfer-credit claims, and an assumption that a certificate leads to licensure or a particular job.",
    "safetyNotes": "Do not promise transfer credit, licensure, aid, job placement, pay, completion, or an employer’s acceptance of a credential. A member’s best pathway depends on facts the Library must not infer. Where an occupation requires a license, route to the relevant official licensing authority for current requirements.",
    "candidateSources": [
      {
        "url": "https://collegescorecard.ed.gov/",
        "publisher": "U.S. Department of Education",
        "purpose": "Official source for comparing institutions and fields of study, including the tool’s links to alternate education and training pathways."
      },
      {
        "url": "https://studentaid.gov/h/understand-aid/how-aid-works",
        "publisher": "U.S. Department of Education, Federal Student Aid",
        "purpose": "Official starting point for checking federal-aid steps for eligible degree or certificate programs and reviewing offers."
      }
    ],
    "nextBricks": [
      {
        "title": "Financial Aid and FAFSA Planning",
        "reason": "follows a question about aid eligibility or awards with federal-source information. -"
      },
      {
        "title": "Apprenticeships and Work-Based Learning",
        "reason": "offers a paid work-and-learning pathway as a distinct optional comparison. -"
      },
      {
        "title": "Career Exploration and Occupational Information",
        "reason": "supports a member who wants to start with an occupation rather than a credential. -"
      },
      {
        "title": "Adult Education and High School Equivalency",
        "reason": "provides a separate path for basic-skills or equivalency questions without assumptions about education history."
      }
    ]
  },
  {
    "slug": "career-exploration-and-occupational-information",
    "title": "Career Exploration and Occupational Information",
    "domain": "education",
    "summary": "Help a member explore occupations, career clusters, skills, training routes, and labor-market information using transparent official tools rather than a personalized career prediction.",
    "iconKey": "graduation-cap",
    "sortOrder": 39,
    "isFeatured": false,
    "sourceStandard": "Use U.S. Department of Labor career tools and Bureau of Labor Statistics occupational profiles as first tier. Preserve source dates, geography, measurement definitions, and projection caveats whenever presenting data. Exclude algorithmic career-match assertions, “best job” lists, social-media salary claims, promises of future demand, and individual wage or hiring predictions.",
    "safetyNotes": "Labor-market data describe published groups and periods; they do not predict an individual’s employment, pay, success, or licensing eligibility. Do not infer a member’s skills, disability, education, age, work authorization, or job preferences. Show any assessment as an optional reflection tool rather than a diagnostic or directive.",
    "candidateSources": [
      {
        "url": "https://www.careeronestop.org/ExploreCareers/explore-careers.aspx",
        "publisher": "U.S. Department of Labor, Employment and Training Administration",
        "purpose": "Official exploration hub for interests, skills, work values, career profiles, training, and wages."
      },
      {
        "url": "https://www.bls.gov/ooh/",
        "publisher": "U.S. Bureau of Labor Statistics",
        "purpose": "Canonical occupational profiles and methodology-linked career information, including education, training, pay, and projected-employment filters."
      }
    ],
    "nextBricks": [
      {
        "title": "Community College, Certificates, and Career Training Pathways",
        "reason": "connects an occupational question to education and training options. -"
      },
      {
        "title": "Apprenticeships and Work-Based Learning",
        "reason": "offers a structured work-and-learning path when relevant to the occupation. -"
      },
      {
        "title": "Youth Career Exploration and Work Experience",
        "reason": "creates a clearly optional youth-facing branch without presuming a member’s age. -"
      },
      {
        "title": "Job Search and Workplace Rights",
        "reason": "directs employment and rights questions to the separate work/legal topic family rather than conflating them with career research."
      }
    ]
  },
  {
    "slug": "apprenticeships-and-work-based-learning",
    "title": "Apprenticeships and Work-Based Learning",
    "domain": "education",
    "summary": "Help a member understand registered apprenticeship and youth work-based-learning pathways, how to verify an opportunity, and how these routes relate to education and career research.",
    "iconKey": "graduation-cap",
    "sortOrder": 40,
    "isFeatured": false,
    "sourceStandard": "Use Apprenticeship.gov and current U.S. Department of Labor materials as first-tier sources for Registered Apprenticeship, plus the specific employer or program sponsor’s current official listing for opportunity terms. Keep “registered” distinct from informal training or employer marketing. Exclude assertions that a particular opening is active, paid at a stated rate, guarantees a credential, accepts a given applicant, or guarantees employment unless verified by a current governed record.",
    "safetyNotes": "The Library must not promise placement, compensation, a credential, employment, workplace safety, or eligibility. Do not infer age, school status, right to work, disability, criminal history, transportation, or schedule. A member should use the official listing and the program sponsor or employer to confirm the current application, requirements, and terms.",
    "candidateSources": [
      {
        "url": "https://www.apprenticeship.gov/career-seekers",
        "publisher": "U.S. Department of Labor",
        "purpose": "Primary explanation of Registered Apprenticeship and the official path to the apprenticeship finder and sponsor/employer application process."
      },
      {
        "url": "https://www.dol.gov/agencies/eta/youth/workforce-pathways-for-youth",
        "publisher": "Employment and Training Administration",
        "purpose": "Federal context for youth career exploration, work readiness, jobs, and apprenticeship-related activities."
      }
    ],
    "nextBricks": [
      {
        "title": "Career Exploration and Occupational Information",
        "reason": "helps a member identify occupations before searching openings. -"
      },
      {
        "title": "Community College, Certificates, and Career Training Pathways",
        "reason": "supports comparison of classroom and work-based routes. -"
      },
      {
        "title": "Youth Mentoring, Enrichment, and Positive Development",
        "reason": "connects a youth-specific pathway question to broader development supports. -"
      },
      {
        "title": "Job Search and Workplace Rights",
        "reason": "moves questions about applications, wages, discrimination, or worker rights to the work/legal topic family."
      }
    ]
  },
  {
    "slug": "returning-to-work-after-incarceration",
    "title": "Returning to Work After Incarceration",
    "domain": "general",
    "summary": "Helps a member identify public workforce, training, and reentry-navigation pathways that may be relevant when preparing for work after incarceration, without assuming a record, work history, or program eligibility.",
    "iconKey": "compass",
    "sortOrder": 41,
    "isFeatured": false,
    "sourceStandard": "Begin with current U.S. Department of Labor employment-and-training sources and official workforce-system resources. Use state or local workforce agencies only after a jurisdiction-specific review. Do not imply that a grant program, American Job Center, apprenticeship, clearance pathway, or provider is available to a particular member; exclude reentry-program marketing and ungoverned referral lists.",
    "safetyNotes": "This topic must not label anyone “justice-involved,” infer a criminal record, or promise employment, record clearance, training placement, or eligibility. It is not legal advice. A member who voluntarily asks about a specific record-related legal issue should be offered the optional legal-help and record-screening bricks, not a conclusion about their rights.",
    "candidateSources": [
      {
        "url": "https://www.dol.gov/agencies/eta/reentry",
        "publisher": "U.S. Department of Labor, Employment and Training Administration",
        "purpose": "Establishes the scope of the federal Reentry Employment Opportunities program and links to its public resources."
      },
      {
        "url": "https://www.apprenticeship.gov/career-seekers/with-employment-barriers",
        "publisher": "U.S. Department of Labor, Apprenticeship.gov",
        "purpose": "Provides federal navigation material about apprenticeship, employment barriers, and American Job Center pathways."
      }
    ],
    "nextBricks": [
      {
        "title": "Job Applications, Background Checks, and Record Questions",
        "reason": "Relevant when an application or screening process raises questions about records or reports. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Relevant when a member asks for legal-information or civil-legal-aid navigation rather than employment preparation. -"
      },
      {
        "title": "Job Loss, Layoffs, and Unemployment Navigation",
        "reason": "Relevant if the member’s reentry work question is also about a recent separation from employment."
      }
    ]
  },
  {
    "slug": "job-applications-background-checks-and-record-questions",
    "title": "Job Applications, Background Checks, and Record Questions",
    "domain": "legal",
    "summary": "Helps a member find reliable starting points for understanding employment background reports, record-related screening questions, and the difference between federal guidance and jurisdiction-specific rules.",
    "iconKey": "scale",
    "sortOrder": 42,
    "isFeatured": false,
    "sourceStandard": "Anchor published material in current Federal Trade Commission (FTC) consumer guidance and EEOC enforcement guidance, then add applicable state or local fair-chance, consumer-reporting, or civil-rights authority only after jurisdiction-specific validation. Clearly separate employment background reports from other hiring issues. Exclude definitive statements that an employer acted lawfully or unlawfully, advice to omit information, and unreviewed “ban-the-box” summaries.",
    "safetyNotes": "This is legal information, not legal advice or a finding about a member’s report, record, application, or employer. Local rules can be more specific than federal guidance. Do not ask members to disclose record details unless they freely choose to phrase an exact question; do not retain or infer them for ranking.",
    "candidateSources": [
      {
        "url": "https://consumer.ftc.gov/articles/employer-background-checks-and-your-rights",
        "publisher": "Federal Trade Commission",
        "purpose": "Candidate consumer-facing source on employment background reporting, notices, permissions, and disputes under the Fair Credit Reporting Act context."
      },
      {
        "url": "https://www.eeoc.gov/laws/guidance/enforcement-guidance-consideration-arrest-and-conviction-records-employment-decisions",
        "publisher": "U.S. Equal Employment Opportunity Commission",
        "purpose": "Candidate agency guidance for the employment-discrimination implications of considering arrest and conviction records."
      }
    ],
    "nextBricks": [
      {
        "title": "Returning to Work After Incarceration",
        "reason": "Provides employment-navigation context without treating record history as a permanent identity. -"
      },
      {
        "title": "Workplace Discrimination and Filing a Charge",
        "reason": "Relevant if a member’s concern may involve a protected-basis employment discrimination question. -"
      },
      {
        "title": "Immigration-Related Employment Rights",
        "reason": "Relevant where a screening or hiring question concerns work authorization documents or national origin. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Provides a navigation route when a member needs information about obtaining civil legal assistance."
      }
    ]
  },
  {
    "slug": "pay-hours-and-overtime-at-work",
    "title": "Pay, Hours, and Overtime at Work",
    "domain": "legal",
    "summary": "Helps a member locate current official information about pay, work hours, overtime, recordkeeping, and wage-and-hour complaint navigation without calculating whether money is owed.",
    "iconKey": "scale",
    "sortOrder": 43,
    "isFeatured": false,
    "sourceStandard": "Use current Wage and Hour Division material and applicable state wage-and-hour agency guidance. Treat classification, exemptions, breaks, tips, deductions, rate calculations, and deadlines as fact-specific and jurisdiction-specific. Exclude wage calculators presented as determinations, unsupported estimates of back pay, and claims about an employer’s practices.",
    "safetyNotes": "This topic does not determine coverage, employee status, exemption, the applicable wage rate, time worked, or the amount due. Complaint choices can have consequences and time limits; present official information and, where appropriate, the legal-help brick rather than instructing a member which action to take.",
    "candidateSources": [
      {
        "url": "https://www.dol.gov/agencies/whd/flsa",
        "publisher": "U.S. Department of Labor, Wage and Hour Division",
        "purpose": "Candidate primary source for federal Fair Labor Standards Act wage, overtime, recordkeeping, and worker-rights overview material."
      },
      {
        "url": "https://www.dol.gov/agencies/whd/contact/complaints",
        "publisher": "U.S. Department of Labor, Wage and Hour Division",
        "purpose": "Candidate official source for wage-and-hour complaint navigation and the information the agency describes for its process."
      }
    ],
    "nextBricks": [
      {
        "title": "Speaking Up at Work and Retaliation",
        "reason": "Relevant if the member is concerned about consequences for raising a pay issue. -"
      },
      {
        "title": "Workplace Safety and Reporting Hazards",
        "reason": "A separate pathway when the work concern involves an unsafe condition rather than compensation. -"
      },
      {
        "title": "Job Loss, Layoffs, and Unemployment Navigation",
        "reason": "Relevant if pay or hours changed as part of a separation, reduction, or layoff. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "A navigation option for members seeking civil legal information or aid."
      }
    ]
  },
  {
    "slug": "workplace-discrimination-and-filing-a-charge",
    "title": "Workplace Discrimination and Filing a Charge",
    "domain": "legal",
    "summary": "Helps a member find official information about federal employment discrimination protections and EEOC charge-filing navigation without deciding whether discrimination occurred.",
    "iconKey": "scale",
    "sortOrder": 44,
    "isFeatured": false,
    "sourceStandard": "Begin with current EEOC statutes, regulations, public guidance, and charge-filing material. Add the relevant state or local civil-rights agency only after confirming jurisdiction, current scope, and intake procedures. Exclude any conclusion that a factual account meets a legal standard, guarantees a remedy, or identifies a deadline without checking the current applicable authority.",
    "safetyNotes": "Legal information only. Do not ask a member to disclose protected traits, medical information, immigration status, or workplace history to access this topic. Agency scope, coverage, filing routes, and timing vary; an entry must direct readers to current official materials rather than provide individualized filing advice.",
    "candidateSources": [
      {
        "url": "https://www.eeoc.gov/know-your-rights-workplace-discrimination-illegal",
        "publisher": "U.S. Equal Employment Opportunity Commission",
        "purpose": "Candidate official employee-facing starting point on federal workplace-discrimination protections and EEOC assistance."
      },
      {
        "url": "https://www.eeoc.gov/filing-charge-discrimination",
        "publisher": "U.S. Equal Employment Opportunity Commission",
        "purpose": "Candidate official source for the EEOC’s charge-filing navigation process."
      }
    ],
    "nextBricks": [
      {
        "title": "Speaking Up at Work and Retaliation",
        "reason": "Relevant when the question concerns an action after a complaint, opposition, or participation in a process. -"
      },
      {
        "title": "Job Applications, Background Checks, and Record Questions",
        "reason": "Relevant to a hiring or screening issue that needs separate background-report or record guidance. -"
      },
      {
        "title": "Leave and Workplace Accommodations",
        "reason": "Relevant when the exact question concerns time away from work or an accommodation request. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Provides civil-legal-aid navigation without recommending a specific lawyer or course of action."
      }
    ]
  },
  {
    "slug": "workplace-safety-and-reporting-hazards",
    "title": "Workplace Safety and Reporting Hazards",
    "domain": "legal",
    "summary": "Helps a member locate official worker-safety rights information and routes for reporting workplace hazards, while distinguishing an urgent emergency from an agency complaint process.",
    "iconKey": "scale",
    "sortOrder": 45,
    "isFeatured": false,
    "sourceStandard": "Prioritize current OSHA standards, worker-rights pages, state-plan agency guidance where applicable, and official complaint instructions. Keep safety facts and medical care separate from legal-process descriptions. Exclude workplace-specific hazard determinations, advice to refuse work, medical assessment, employer safety ratings, and nonofficial “safe workplace” lists.",
    "safetyNotes": "If a member describes an immediate risk of death, serious injury, or another emergency, the interface must foreground calling emergency services or obtaining urgent help; it must not imply that an online complaint is emergency response. This topic is not medical or legal advice and must not decide whether a workplace is covered or hazardous.",
    "candidateSources": [
      {
        "url": "https://www.osha.gov/workers",
        "publisher": "U.S. Department of Labor, Occupational Safety and Health Administration",
        "purpose": "Candidate primary source for worker safety rights, training, inspection, hazard, and retaliation information."
      },
      {
        "url": "https://www.osha.gov/workers/file-complaint",
        "publisher": "U.S. Department of Labor, Occupational Safety and Health Administration",
        "purpose": "Candidate official source that distinguishes safety-and-health and whistleblower complaint pathways."
      }
    ],
    "nextBricks": [
      {
        "title": "Speaking Up at Work and Retaliation",
        "reason": "Relevant if the member reports a negative response to raising a safety concern. -"
      },
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "A separate work-rights pathway if the core question is compensation rather than safety. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Offers civil-legal navigation when the official safety flow does not answer the member’s exact legal question. -"
      },
      {
        "title": "Immigration-Related Employment Rights",
        "reason": "Relevant if the member voluntarily asks about how an immigration-related concern intersects with workplace rights."
      }
    ]
  },
  {
    "slug": "speaking-up-at-work-and-retaliation",
    "title": "Speaking Up at Work and Retaliation",
    "domain": "legal",
    "summary": "Helps a member identify official information about retaliation protections that can apply to specific workplace rights and agencies, without deciding whether retaliation happened.",
    "iconKey": "scale",
    "sortOrder": 46,
    "isFeatured": false,
    "sourceStandard": "Match the evidence to the underlying right and enforcing authority: OSHA for safety-related retaliation, Wage and Hour Division for its covered laws, EEOC for protected equal-employment-opportunity activity, and NLRB for National Labor Relations Act questions. Verify current statutory deadlines and coverage before publishing any detailed process. Exclude one-size-fits-all timelines, promises of confidentiality or outcomes beyond source language, and assertions that a manager’s action was retaliatory.",
    "safetyNotes": "Retaliation rules and filing periods differ by law, agency, jurisdiction, employer, and facts. Do not tell a member whether to confront an employer, resign, document a matter, or file with an agency. Do not infer the underlying complaint, protected trait, union status, immigration status, or work arrangement.",
    "candidateSources": [
      {
        "url": "https://www.osha.gov/workers/file-complaint",
        "publisher": "U.S. Department of Labor, Occupational Safety and Health Administration",
        "purpose": "Candidate official source on safety-related whistleblower complaints and the agency’s stated process distinctions."
      },
      {
        "url": "https://www.nlrb.gov/about-nlrb/rights-we-protect/the-law/employees/concerted-activity",
        "publisher": "National Labor Relations Board",
        "purpose": "Candidate source for the NLRB’s explanation of protected concerted activity concerning workplace conditions."
      },
      {
        "url": "https://www.eeoc.gov/retaliation",
        "publisher": "U.S. Equal Employment Opportunity Commission",
        "purpose": "Candidate official source for EEOC retaliation material to be reviewed alongside the discrimination entry."
      }
    ],
    "nextBricks": [
      {
        "title": "Workplace Safety and Reporting Hazards",
        "reason": "Relevant if the underlying concern is a safety hazard or OSHA-related report. -"
      },
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "Relevant if the concern arose from unpaid wages, hours, or overtime. -"
      },
      {
        "title": "Workplace Discrimination and Filing a Charge",
        "reason": "Relevant if the member’s exact concern is connected to alleged discrimination or an EEOC process. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "An optional route to civil legal-information and aid navigation."
      }
    ]
  },
  {
    "slug": "leave-and-workplace-accommodations",
    "title": "Leave and Workplace Accommodations",
    "domain": "legal",
    "summary": "Helps a member locate official information about family and medical leave and workplace accommodation processes without determining coverage, eligibility, disability, or a requested accommodation.",
    "iconKey": "scale",
    "sortOrder": 47,
    "isFeatured": false,
    "sourceStandard": "Use current Department of Labor Family and Medical Leave Act material and current EEOC Americans with Disabilities Act accommodation guidance, supplemented only by current state or local leave/accommodation authority after location-specific review. Keep each statute and process distinct. Exclude medical advice, requests for diagnosis details, assertions of coverage or eligibility, and claims that a particular accommodation must be granted.",
    "safetyNotes": "This topic is neither medical advice nor legal advice. It must not infer a diagnosis, pregnancy, disability, caregiving role, family relationship, or leave eligibility. Any published content must explain that federal, state, and local rules can differ and that the facts of employment matter.",
    "candidateSources": [
      {
        "url": "https://www.dol.gov/agencies/whd/fmla/employee-guide",
        "publisher": "U.S. Department of Labor, Wage and Hour Division",
        "purpose": "Candidate plain-language source covering the FMLA’s employee-facing coverage, eligibility, leave, notice, certification, return-to-work, and complaint topics."
      },
      {
        "url": "https://www.eeoc.gov/laws/guidance/enforcement-guidance-reasonable-accommodation-and-undue-hardship-under-ada",
        "publisher": "U.S. Equal Employment Opportunity Commission",
        "purpose": "Candidate EEOC primary guidance for a future, separately reviewed accommodation entry."
      }
    ],
    "nextBricks": [
      {
        "title": "Workplace Discrimination and Filing a Charge",
        "reason": "Relevant when the question becomes an equal-employment-opportunity concern. -"
      },
      {
        "title": "Speaking Up at Work and Retaliation",
        "reason": "Relevant if a member voluntarily asks about a negative response after asserting a workplace right. -"
      },
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "Relevant if the exact question concerns unpaid or reduced work time rather than leave rights. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Provides an optional legal-navigation path for a fact-specific question."
      }
    ]
  },
  {
    "slug": "job-loss-layoffs-and-unemployment-navigation",
    "title": "Job Loss, Layoffs, and Unemployment Navigation",
    "domain": "financial",
    "summary": "Helps a member find official starting points for unemployment insurance and layoff-related worker information without deciding eligibility, benefit amount, notice coverage, or the state where a claim belongs.",
    "iconKey": "landmark",
    "sortOrder": 48,
    "isFeatured": false,
    "sourceStandard": "Begin with USA.gov and the relevant state unemployment agency for unemployment information, and with Department of Labor WARN materials and the applicable state authority for layoff notice. State programs administer unemployment; do not create a national eligibility test. Exclude benefit estimates, claims that someone qualifies, employer-specific layoff assertions, and outdated pandemic-era guidance.",
    "safetyNotes": "This is not financial or legal advice. Do not infer job loss, work state, household income, immigration status, or benefit eligibility. Unemployment and layoff notice processes have jurisdiction-specific rules and timing; members need current official state information for a particular claim.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/unemployment-benefits",
        "publisher": "USA.gov, U.S. General Services Administration",
        "purpose": "Candidate public-service source explaining that states set eligibility and administer unemployment programs, with state-routing information."
      },
      {
        "url": "https://www.dol.gov/agencies/eta/layoffs/warn",
        "publisher": "U.S. Department of Labor, Employment and Training Administration",
        "purpose": "Candidate official source for WARN Act compliance assistance and worker-oriented materials."
      }
    ],
    "nextBricks": [
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "Relevant if the member’s question includes final wages, hours, or pay. -"
      },
      {
        "title": "Returning to Work After Incarceration",
        "reason": "A potential employment-navigation path when a member voluntarily asks about reentry and job loss together. -"
      },
      {
        "title": "Job Applications, Background Checks, and Record Questions",
        "reason": "An optional hiring-process pathway when a new job search includes screening or application questions. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Relevant when a member has a fact-specific civil legal question about a separation or notice."
      }
    ]
  },
  {
    "slug": "immigration-related-employment-rights",
    "title": "Immigration-Related Employment Rights",
    "domain": "legal",
    "summary": "Helps a member locate authoritative information about immigration-related employment discrimination, work-authorization document practices, and workplace-rights resources without asking about or inferring immigration status.",
    "iconKey": "scale",
    "sortOrder": 49,
    "isFeatured": false,
    "sourceStandard": "Use current DOJ Immigrant and Employee Rights Section (IER) material and Department of Labor worker-rights material as primary public-service sources. Add NLRB or specialized official sources only for the exact rights question. Do not solicit status, nationality, or document numbers; do not state that any individual is authorized to work, has a remedy, or is protected by a specific law without fact- and law-specific review. Exclude immigration-service marketing and uncredentialed legal assistance.",
    "safetyNotes": "Do not request, collect, infer, display, or use immigration status, national origin, citizenship, or work-authorization document details for ranking. This is not immigration or legal advice. For individualized immigration advice, publication should direct members to verified, authorized legal-service channels only after governance review.",
    "candidateSources": [
      {
        "url": "https://www.justice.gov/crt/immigrant-and-employee-rights-section",
        "publisher": "U.S. Department of Justice, Civil Rights Division, Immigrant and Employee Rights Section",
        "purpose": "Candidate primary source for the IER’s stated enforcement scope concerning citizenship-status and national-origin discrimination, unfair documentary practices, and related retaliation or intimidation."
      },
      {
        "url": "https://www.dol.gov/agencies/whd/workers",
        "publisher": "U.S. Department of Labor, Wage and Hour Division",
        "purpose": "Candidate worker-rights source that describes the Wage and Hour Division’s enforcement without regard to a worker’s immigration status."
      },
      {
        "url": "https://www.nlrb.gov/guidance/key-reference-materials/immigrant-worker-rights",
        "publisher": "National Labor Relations Board",
        "purpose": "Candidate official source to review for National Labor Relations Act information relevant to immigrant workers."
      }
    ],
    "nextBricks": [
      {
        "title": "Workplace Discrimination and Filing a Charge",
        "reason": "Relevant when a member’s exact question concerns employment discrimination more broadly. -"
      },
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "Relevant when the work concern involves wages or hours, which have their own enforcement pathways. -"
      },
      {
        "title": "Workplace Safety and Reporting Hazards",
        "reason": "Relevant when the core concern is an unsafe condition or safety complaint. -"
      },
      {
        "title": "Finding Civil Legal Help for Work Problems",
        "reason": "Offers legal-aid navigation without assuming what form of assistance is needed."
      }
    ]
  },
  {
    "slug": "finding-civil-legal-help-for-work-problems",
    "title": "Finding Civil Legal Help for Work Problems",
    "domain": "legal",
    "summary": "Helps a member find reliable civil legal-information and legal-aid navigation resources for work-related questions without recommending a lawyer, screening eligibility, or promising representation.",
    "iconKey": "scale",
    "sortOrder": 50,
    "isFeatured": false,
    "sourceStandard": "Start with LSC’s official legal-aid locator and the LawHelp state-based legal-information route that LSC identifies. A publication may offer a specific nearby organization only after a governed directory record verifies the organization, scope, jurisdiction, and current contact channel. Exclude attorney advertising, rankings, commercial lead generators, crowdsourced referrals, promises of free representation, and determinations of financial or case eligibility.",
    "safetyNotes": "Do not characterize any organization as available, free, appropriate, accepting cases, or able to represent a member unless current governed data supports it. This topic does not provide legal advice, create an attorney-client relationship, assess income or case merits, or guarantee confidentiality outside the cited service’s own terms.",
    "candidateSources": [
      {
        "url": "https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help",
        "publisher": "Legal Services Corporation",
        "purpose": "Candidate federal legal-aid navigation source with an address/city-based locator for LSC-funded civil legal-aid organizations."
      },
      {
        "url": "https://www.lawhelp.org/",
        "publisher": "LawHelp.org / Pro Bono Net and partner legal-aid organizations",
        "purpose": "Candidate state-based legal-information and referral navigation resource identified by LSC."
      }
    ],
    "nextBricks": [
      {
        "title": "Workplace Discrimination and Filing a Charge",
        "reason": "Relevant if the exact question concerns a civil-rights or EEOC route. -"
      },
      {
        "title": "Pay, Hours, and Overtime at Work",
        "reason": "Relevant when the legal question is primarily about wages or hours. -"
      },
      {
        "title": "Speaking Up at Work and Retaliation",
        "reason": "Relevant when the member’s concern follows raising a workplace issue. -"
      },
      {
        "title": "Job Applications, Background Checks, and Record Questions",
        "reason": "Relevant when the need for legal information arises during hiring or screening. -"
      },
      {
        "title": "Immigration-Related Employment Rights",
        "reason": "Relevant when a voluntarily stated question concerns immigration-related employment practices."
      }
    ]
  },
  {
    "slug": "family-caregiving-getting-started",
    "title": "Family caregiving: getting organized and finding support",
    "domain": "general",
    "summary": "Help a person begin to organize family caregiving responsibilities, communicate with the care recipient and support network, and identify reliable public-service pathways for additional help.",
    "iconKey": "compass",
    "sortOrder": 51,
    "isFeatured": false,
    "sourceStandard": "Use NIH/NIA caregiving materials as the primary plain-language health-information source and ACL/HHS public-service sources for national caregiver-support pathways. Supplement only with current state or local government information after jurisdiction and currency review. Exclude commercial caregiver lead generators, unsupported “care plans,” provider marketing, and claims that a member qualifies for a particular service.",
    "safetyNotes": "Do not assume that a member is a caregiver, the decision-maker, related to the care recipient, or authorized to access another person’s health information. This topic provides navigation and organizational support, not medical assessment, legal authority, or a determination of program eligibility. Urgent health or safety concerns require appropriate emergency or clinical help. ---",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/caregiving",
        "publisher": "National Institute on Aging (NIA), NIH",
        "purpose": "Foundational, expert-reviewed overview with caregiver worksheets and links on getting started, sharing responsibility, and caring for oneself."
      },
      {
        "url": "https://acl.gov/programs/support-caregivers/national-family-caregiver-support-program",
        "publisher": "Administration for Community Living (ACL), HHS",
        "purpose": "Primary federal program page describing the caregiver-support service categories and linking to the official Eldercare Locator."
      },
      {
        "url": "https://eldercare.acl.gov/home",
        "publisher": "ACL, HHS",
        "purpose": "Official public-service handoff for locating aging services by a member-selected location."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Caregiver respite and well-being",
        "reason": "A person asking how to sustain caregiving may want to explore breaks, support, and their own well-being."
      },
      {
        "title": "Caring for someone living with dementia",
        "reason": "Dementia-related care can involve distinct communication, daily-care, and planning questions."
      },
      {
        "title": "Services for an older adult living at home",
        "reason": "Use when the exact question concerns help at home rather than general caregiver organization."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "Useful when the family is preparing for future medical decisions."
      }
    ]
  },
  {
    "slug": "dementia-family-caregiving",
    "title": "Caring for someone living with dementia",
    "domain": "medical",
    "summary": "Help families navigate authoritative information about day-to-day dementia caregiving, changing communication or behavior, caregiver support, and questions to bring to health professionals.",
    "iconKey": "heart-pulse",
    "sortOrder": 52,
    "isFeatured": false,
    "sourceStandard": "Prioritize NIA/NIH and other federal, expert-reviewed dementia education; use clinician-reviewed material only when it clearly distinguishes general information from individualized care. Require current medical review for substantive guidance. Exclude diagnostic quizzes, treatment promises, cure claims, and content that treats a behavior as proof of a condition.",
    "safetyNotes": "This topic must not diagnose dementia, interpret a symptom, advise medication changes, determine capacity, or instruct a person to manage an emergency. Make clear that sudden or concerning changes need prompt clinical evaluation, and route a life-threatening emergency to emergency services. Do not infer a diagnosis from the member’s wording; use person-respecting language and preserve the care recipient’s autonomy and privacy. ---",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/alzheimers-caregiving",
        "publisher": "NIA, NIH",
        "purpose": "Authoritative topic hub on responding to communication and behavior changes, everyday care, caregiver self-care, and finding help."
      },
      {
        "url": "https://www.alzheimers.gov/life-with-dementia/resources-caregivers",
        "publisher": "Alzheimer’s.gov, managed by NIA/NIH",
        "purpose": "Federal resource hub that links reviewed government information, care planning, and community-service navigation."
      },
      {
        "url": "https://medlineplus.gov/alzheimerscaregivers.html",
        "publisher": "MedlinePlus, National Library of Medicine/NIH",
        "purpose": "Additional NIH consumer-health gateway for reviewed caregiving information and support resources."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Helps a member coordinate care tasks and support with family or friends."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "Future-care conversations can be especially time-sensitive when decision-making ability may change; the topic does not assess capacity."
      },
      {
        "title": "Choosing long-term care and comparing options",
        "reason": "Relevant when the exact question is about care settings or additional care support."
      },
      {
        "title": "Caregiver respite and well-being",
        "reason": "Connects to the caregiver’s need for breaks and support without presuming distress."
      }
    ]
  },
  {
    "slug": "aging-in-place-planning",
    "title": "Aging in place: planning to live at home",
    "domain": "general",
    "summary": "Help an older adult or family explore authoritative planning questions about living independently and safely at home, supports, and service navigation without assuming a person must move or needs a particular level of care.",
    "iconKey": "compass",
    "sortOrder": 53,
    "isFeatured": false,
    "sourceStandard": "Prioritize NIA/NIH for consumer health and independence planning, and ACL for official aging-services navigation. Local program detail must be verified through a relevant government or governed directory record. Exclude contractor advertising, home-modification price claims, and assertions that a setting is safe or appropriate for a specific individual.",
    "safetyNotes": "Do not declare any home, person, or arrangement safe; home safety and support needs are individualized. This entry is not a clinical or functional assessment and should not discourage a member from contacting a health professional when there is a health concern. Do not infer age, disability, isolation, income, living arrangement, or family role.",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/aging-place",
        "publisher": "NIA, NIH",
        "purpose": "Federal, expert-reviewed introduction to the planning considerations involved in living at home while aging."
      },
      {
        "url": "https://www.nia.nih.gov/health/aging-place/aging-place-growing-older-home",
        "publisher": "NIA, NIH",
        "purpose": "Supporting NIA consumer guide for home-focused planning and safety considerations."
      },
      {
        "url": "https://eldercare.acl.gov/home",
        "publisher": "ACL, HHS",
        "purpose": "Official locator handoff for a member-selected community’s aging-service resources."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Helps when family members are taking on or sharing support responsibilities."
      },
      {
        "title": "Choosing long-term care and comparing options",
        "reason": "Offers a separate route if home-based options no longer answer the member’s exact question."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "Supports future-care conversations while avoiding assumptions about health status."
      },
      {
        "title": "Recognizing and responding to elder mistreatment",
        "reason": "Relevant only if the member explicitly asks about safety, coercion, neglect, or exploitation."
      }
    ]
  },
  {
    "slug": "choosing-long-term-care",
    "title": "Choosing long-term care and comparing options",
    "domain": "medical",
    "summary": "Help a member understand how to approach questions about long-term care choices and use official comparison resources, without recommending a facility or deciding what care is appropriate.",
    "iconKey": "heart-pulse",
    "sortOrder": 54,
    "isFeatured": false,
    "sourceStandard": "Use CMS/Medicare as the primary source for Medicare-certified provider comparison and consumer guidance, with ACL/NIA as a companion for general long-term-care navigation. Always preserve source date and scope; explain that official comparison data is not a personal recommendation. Exclude facility advertisements, unverified reviews, rankings outside the cited methodology, prices, bed availability, and claims about coverage or eligibility.",
    "safetyNotes": "This topic cannot assess a person’s clinical needs, recommend a facility, guarantee quality, or advise on coverage, costs, admission, or eligibility. Facility data and circumstances change. Where an immediate health or safety concern exists, route to the appropriate urgent or emergency service rather than treating this as a shopping workflow.",
    "candidateSources": [
      {
        "url": "https://www.cms.gov/about-cms/what-we-do/nursing-homes/patients-caregivers/finding-nursing-home",
        "publisher": "Centers for Medicare & Medicaid Services (CMS)",
        "purpose": "Official consumer page linking the nursing-home choice guide, Care Compare, resident-rights information, and alternatives."
      },
      {
        "url": "https://www.medicare.gov/care-compare/",
        "publisher": "Medicare.gov/CMS",
        "purpose": "Official comparison tool for Medicare provider types, including nursing homes, home health, hospice, and other listed categories."
      },
      {
        "url": "https://acl.gov/ltc",
        "publisher": "ACL, HHS",
        "purpose": "Federal navigation source for long-term-care basics and planning considerations."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Aging in place: planning to live at home",
        "reason": "Provides an optional home-focused planning route, rather than presuming institutional care."
      },
      {
        "title": "Caring for someone living with dementia",
        "reason": "Links when dementia-related needs are the member’s stated concern."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "Helps distinguish future preference conversations from facility selection."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Connects a care-choice question with family coordination and caregiver support."
      }
    ]
  },
  {
    "slug": "advance-care-planning-health-care-proxy",
    "title": "Advance care planning and choosing a health care proxy",
    "domain": "legal",
    "summary": "Help a person and their chosen support network locate authoritative information for discussing future health-care preferences, advance directives, and a health care proxy while recognizing that legal requirements vary by state.",
    "iconKey": "scale",
    "sortOrder": 55,
    "isFeatured": false,
    "sourceStandard": "Use NIA/NIH for the health-care-planning framework and official state sources, state bar referral services, or legal-aid sources for jurisdiction-specific form and law information. Review each jurisdictional resource for currentness before publication. Exclude generic form vendors as legal authority, individualized legal conclusions, claims that a document will guarantee an outcome, and any assumption about a member’s capacity or family structure.",
    "safetyNotes": "Legal and medical-information disclaimer required. This topic is not legal advice, a substitute for state-specific legal review, a capacity evaluation, or a directive to sign a document. Never assume a spouse, partner, adult child, friend, or caregiver has authority to make decisions. Present state variation prominently and route acute medical emergencies to emergency services. ---",
    "candidateSources": [
      {
        "url": "https://www.nia.nih.gov/health/advance-care-planning",
        "publisher": "NIA, NIH",
        "purpose": "Expert-reviewed overview of future health-care conversations, advance directives, and health care proxies."
      },
      {
        "url": "https://www.nia.nih.gov/health/advance-care-planning/advance-care-planning-advance-directives-health-care",
        "publisher": "NIA, NIH",
        "purpose": "Detailed NIA guide that flags state-law variation and points readers toward state-specific forms and official/local help."
      },
      {
        "url": "https://eldercare.acl.gov/home",
        "publisher": "ACL, HHS",
        "purpose": "Official public-service handoff that can connect a member to an Area Agency on Aging for navigation, not legal representation."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Caring for someone living with dementia",
        "reason": "May be relevant when the member explicitly asks about planning after a dementia diagnosis or while supporting someone with dementia."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Connects documents and conversations with practical care coordination."
      },
      {
        "title": "Choosing long-term care and comparing options",
        "reason": "Useful where a member’s exact question turns to future care settings."
      },
      {
        "title": "Recognizing and responding to elder mistreatment",
        "reason": "Provides an optional safety route when the stated concern is coercion or exploitation rather than ordinary planning."
      }
    ]
  },
  {
    "slug": "elder-mistreatment-safety-support",
    "title": "Recognizing and responding to elder mistreatment",
    "domain": "legal",
    "summary": "Help someone locate authoritative, safety-centered information about possible elder abuse, neglect, or exploitation and identify appropriate reporting or support pathways without investigating, labelling a person, or determining that abuse occurred.",
    "iconKey": "scale",
    "sortOrder": 56,
    "isFeatured": false,
    "sourceStandard": "Use ACL and DOJ as primary sources for definitions, general warning signs, and reporting/help pathways. For state-specific reporting rules or Adult Protective Services information, use the applicable state government or the official referral source after a location is voluntarily provided. Exclude crowd-sourced accusations, private investigator services, unverified hotline lists, and guidance that tells a user to confront an alleged abuser.",
    "safetyNotes": "Immediate-safety routing required: if someone is in immediate danger, direct them to emergency services (911 in the U.S.). Do not ask the member to prove abuse, conduct an investigation, contact a suspected perpetrator, or share identifying details publicly. This topic cannot make a criminal, financial, medical, or legal determination. Show digital-privacy considerations when a person may be monitored, and avoid exposing search history or sensitive data in a shared device context.",
    "candidateSources": [
      {
        "url": "https://acl.gov/programs/elder-justice/what-elder-abuse",
        "publisher": "ACL, HHS",
        "purpose": "Primary federal explainer describing broad categories and warning signs while emphasizing that laws and definitions vary."
      },
      {
        "url": "https://www.justice.gov/elderjustice/find-help-or-report-abuse",
        "publisher": "U.S. Department of Justice, Elder Justice Initiative",
        "purpose": "Official urgent-routing, Adult Protective Services referral, and elder-fraud support page."
      },
      {
        "url": "https://www.nia.nih.gov/health/elder-abuse",
        "publisher": "NIA, NIH",
        "purpose": "Expert-reviewed consumer-health gateway on forms of elder abuse and getting help."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Healthy relationships and safety planning",
        "reason": "An optional route when the stated concern includes intimate-partner or family relationship safety."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "Separates legitimate planning authority questions from coercion or exploitation concerns."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Useful for non-urgent, non-safety caregiving coordination questions."
      },
      {
        "title": "Choosing long-term care and comparing options",
        "reason": "Relevant only when a member specifically asks about rights or care-setting concerns."
      }
    ]
  },
  {
    "slug": "parenting-child-development-guidance",
    "title": "Parenting and child development: everyday guidance",
    "domain": "education",
    "summary": "Help parents and caregivers find age-appropriate, authoritative parenting and child-development information, while making clear that general guidance does not replace individualized health, developmental, educational, or safety evaluation.",
    "iconKey": "graduation-cap",
    "sortOrder": 57,
    "isFeatured": false,
    "sourceStandard": "Prioritize CDC and other federal public-health or education sources that identify content review and are organized by developmental stage. Use professional or academic sources only after editorial review. Exclude parenting “guarantees,” stigmatizing labels, discipline advice presented as universal, developmental diagnosis tools, and content that assumes a child’s age, gender, disability, family structure, or caregiver relationship.",
    "safetyNotes": "Do not diagnose developmental, learning, behavioral, or mental-health conditions; do not imply that a child is unsafe or that a caregiver is at fault. General guidance should invite a member to contact an appropriate health, developmental, school, or emergency resource for a specific concern. Avoid disciplinary or cultural assumptions and preserve the dignity of children and caregivers. ---",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/child-development/positive-parenting-tips/index.html",
        "publisher": "Centers for Disease Control and Prevention (CDC)",
        "purpose": "Reviewed, age-organized resource hub for positive parenting, child development, safety, and health information."
      },
      {
        "url": "https://www.cdc.gov/parents/index.html",
        "publisher": "CDC",
        "purpose": "Federal parent-information hub for family health and safety topics."
      },
      {
        "url": "https://headstart.gov/parenting",
        "publisher": "Office of Head Start, Administration for Children and Families (ACF), HHS",
        "purpose": "Federal early-childhood resource pathway that can supplement parent-facing content after review."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Finding child care and early learning options",
        "reason": "Connects a child-development question to early-learning and care navigation when requested."
      },
      {
        "title": "Kinship and grandfamily caregiving",
        "reason": "Useful when a relative or close family friend is taking on a parenting role."
      },
      {
        "title": "Healthy relationships and safety planning",
        "reason": "Provides a distinct, safety-centered route when the exact question concerns family or dating relationship safety."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Relevant for intergenerational households or caregivers balancing several care responsibilities."
      }
    ]
  },
  {
    "slug": "child-care-early-learning-navigation",
    "title": "Finding child care and early learning options",
    "domain": "education",
    "summary": "Help families navigate authoritative information on choosing child care, state and territory resource pathways, and federal early-learning programs without rating providers or predicting cost, openings, safety, or eligibility.",
    "iconKey": "graduation-cap",
    "sortOrder": 58,
    "isFeatured": false,
    "sourceStandard": "Use ChildCare.gov and the relevant state or territory government/authorized child-care resource and referral system for current local navigation. Use Head Start’s official federal site for program facts and its official local locator/application path. Exclude commercial lead marketplaces, testimonials as evidence of quality, unverifiable provider claims, price and vacancy claims, and any assertion that a child is eligible or a program is appropriate.",
    "safetyNotes": "Do not certify, endorse, rank, or declare a provider safe, licensed, suitable, open, affordable, or available. Child-care requirements, subsidy rules, and program eligibility are jurisdiction- and program-specific; present official sources rather than conclusions. Never infer the child’s age, caregiver’s work status, income, immigration status, or household arrangement.",
    "candidateSources": [
      {
        "url": "https://www.childcare.gov/",
        "publisher": "Office of Child Care, ACF, HHS",
        "purpose": "Official state-and-territory gateway with consumer education on choosing quality child care, regulation, and paying for care."
      },
      {
        "url": "https://headstart.gov/programs/article/head-start-programs",
        "publisher": "Office of Head Start, ACF, HHS",
        "purpose": "Official overview of Head Start and Early Head Start, their program scope, and how to pursue program information."
      },
      {
        "url": "https://headstart.gov/how-apply",
        "publisher": "Office of Head Start, ACF, HHS",
        "purpose": "Official next-step candidate for local Head Start application and eligibility navigation, subject to current review."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Parenting and child development: everyday guidance",
        "reason": "Supports questions about a child’s development and everyday parenting beyond care selection."
      },
      {
        "title": "Kinship and grandfamily caregiving",
        "reason": "Useful if a relative caregiver needs child-care or early-learning navigation."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Connects households managing multiple caregiving responsibilities."
      },
      {
        "title": "Healthy relationships and safety planning",
        "reason": "A separate safety route for a member whose exact question concerns relationship safety, not child-care selection."
      }
    ]
  },
  {
    "slug": "kinship-grandfamily-caregiving",
    "title": "Kinship and grandfamily caregiving",
    "domain": "general",
    "summary": "Help relatives and other close family-connected caregivers understand the range of kinship-care arrangements and locate authoritative navigation resources without assuming legal custody, child-welfare involvement, parental absence, or a particular household structure.",
    "iconKey": "compass",
    "sortOrder": 59,
    "isFeatured": false,
    "sourceStandard": "Prioritize Child Welfare Information Gateway/Children’s Bureau and NIA/NIH for national, non-stigmatizing explanations and resource routes. For legal custody, guardianship, foster-care status, benefits, or school-enrollment rules, require a current jurisdiction-specific government or legal-aid source and a legal disclaimer. Exclude generalized legal advice, assumptions that kinship care means child-welfare involvement, and claims about benefits or eligibility.",
    "safetyNotes": "Do not assume or state who has legal authority, who a child’s parent is, why a child is living with a caregiver, or whether a child-welfare case exists. This is not legal advice and must not direct a caregiver to take custody-related action without jurisdiction-specific help. If there is an immediate risk to a child’s safety, route to emergency services or the appropriate official child-safety reporting pathway.",
    "candidateSources": [
      {
        "url": "https://www.childwelfare.gov/topics/permanency/kinship-care/",
        "publisher": "Child Welfare Information Gateway, Children’s Bureau/ACF, HHS",
        "purpose": "Primary federal topic page defining kinship care and directing readers to caregiver and system-navigation resources."
      },
      {
        "url": "https://www.nia.nih.gov/health/caregiving/grandfamilies-and-kinship-families-caring-young-relatives",
        "publisher": "NIA, NIH",
        "purpose": "Expert-reviewed guidance for older adults caring for younger relatives, including self-care and national resource pathways."
      },
      {
        "url": "https://www.childwelfare.gov/resources/kinship-care-and-child-welfare-system/",
        "publisher": "Child Welfare Information Gateway, Children’s Bureau/ACF, HHS",
        "purpose": "Supporting federal resource on navigating kinship care when child-welfare systems are involved."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Parenting and child development: everyday guidance",
        "reason": "Offers general child-development and parenting information for a caregiver’s stated age group or need."
      },
      {
        "title": "Finding child care and early learning options",
        "reason": "Provides an early-learning and child-care navigation route."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Connects kin caregivers to broader family-care organization and support pathways."
      },
      {
        "title": "Advance care planning and choosing a health care proxy",
        "reason": "May be relevant for an older kin caregiver’s own future planning, only if they ask."
      }
    ]
  },
  {
    "slug": "healthy-relationships-safety-planning",
    "title": "Healthy relationships and safety planning",
    "domain": "general",
    "summary": "Help a person find authoritative information about relationship safety, options for confidential support, and safety planning without requiring disclosure, diagnosing abuse, or directing a person to take an action that could increase danger.",
    "iconKey": "compass",
    "sortOrder": 60,
    "isFeatured": false,
    "sourceStandard": "Use HHS/Office on Women’s Health and established, confidentiality-aware national support organizations for general safety information and direct support pathways. Give priority to materials that address safer browsing or device monitoring. Exclude couples-therapy listings as a default response to possible abuse, advice to confront someone, public crowd-sourced directories, and any local resource whose safety, confidentiality, or current status has not been governed.",
    "safetyNotes": "Safety and privacy routing required. If there is immediate danger or a life-threatening situation, direct the member to emergency services (911 in the U.S.). Do not require a person to identify themselves, name another person, upload evidence, contact an alleged abuser, or leave a relationship. Prominently support quick exit and device/privacy awareness; browsing history may be monitored and cannot always be fully erased. Use nonjudgmental language, do not diagnose or determine abuse, and offer confidential support routes without assuming gender, sexuality, immigration status, disability, family role, or location.",
    "candidateSources": [
      {
        "url": "https://womenshealth.gov/relationships-and-safety",
        "publisher": "Office on Women’s Health, HHS",
        "purpose": "Federal resource hub on relationship safety, abuse awareness, help pathways, and safer-use warnings."
      },
      {
        "url": "https://www.thehotline.org/plan-for-safety/create-your-personal-safety-plan/",
        "publisher": "National Domestic Violence Hotline",
        "purpose": "Confidential-support and safety-planning candidate source with digital-safety cautions and direct advocate pathways."
      },
      {
        "url": "https://www.cdc.gov/intimate-partner-violence/about/index.html",
        "publisher": "CDC",
        "purpose": "Federal public-health source for reviewed definitions and prevention context, to be used without prevalence claims in a basic navigation entry."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Recognizing and responding to elder mistreatment",
        "reason": "Offers a distinct route when the concern is specifically about an older adult, neglect, or exploitation."
      },
      {
        "title": "Family caregiving: getting organized and finding support",
        "reason": "Relevant to non-abuse caregiving coordination; keep this separate from emergency or safety support."
      },
      {
        "title": "Kinship and grandfamily caregiving",
        "reason": "Useful where the exact question concerns a family-connected caregiver and child, without assuming harm or a legal arrangement."
      },
      {
        "title": "Parenting and child development: everyday guidance",
        "reason": "An optional route for ordinary parenting questions; never use it to divert a safety disclosure."
      }
    ]
  },
  {
    "slug": "food-traditions-everyday-meal-planning",
    "title": "Food Traditions and Everyday Meal Planning",
    "domain": "general",
    "summary": "Helps a member explore practical meal planning while honoring the food traditions, ingredients, and household routines they choose to name.",
    "iconKey": "compass",
    "sortOrder": 61,
    "isFeatured": false,
    "sourceStandard": "Use current USDA/HHS dietary-pattern education and FDA label materials as the factual base, with reviewed public heritage sources for the cultural context. Do not score cuisines, label a member’s food as “good” or “bad,” impose a calorie target, or infer nutrition needs from race, ethnicity, nationality, faith, body size, or health status. Exclude brand recipes, sponsored meal plans, diet influencers, unreviewed “heritage diet” claims, and claims that a traditional food prevents or treats a condition.",
    "safetyNotes": "General navigation only; this record is not individualized nutrition, allergy, pregnancy, eating-disorder, or medical-diet advice. Route questions about an allergic reaction, foodborne illness, severe dietary restriction, or a medical nutrition plan to an appropriate health professional or urgent care channel as indicated. Never infer a member’s culture or dietary practice.",
    "candidateSources": [
      {
        "url": "https://www.myplate.gov/",
        "publisher": "U.S. Department of Agriculture",
        "purpose": "Candidate federal starting point for general food-group and meal-planning education; individual pages and current materials must be selected and reviewed before publication."
      },
      {
        "url": "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Candidate primary source for interpreting the Nutrition Facts label alongside member-selected foods."
      },
      {
        "url": "https://ich.unesco.org/en/what-is-intangible-heritage-00003",
        "publisher": "UNESCO",
        "purpose": "Candidate conceptual source for treating transmitted food knowledge as community-based living heritage rather than a fixed identity label."
      }
    ],
    "nextBricks": [
      {
        "title": "Reading Food Labels and Ingredient Lists",
        "reason": "helps compare packaged ingredients or nutrition information when a member wants to use it. -"
      },
      {
        "title": "Food Storage, Leftovers, and Safe Handling",
        "reason": "connects a cooking plan to safe storage and reheating questions. -"
      },
      {
        "title": "Cultural Traditions and Family Digital Memories",
        "reason": "opens a non-prescriptive route for documenting how food can carry shared memory and tradition. -"
      },
      {
        "title": "Fitness Supplements and Performance Claims",
        "reason": "distinguishes everyday food questions from claims about performance products."
      }
    ]
  },
  {
    "slug": "reading-food-labels-ingredient-lists",
    "title": "Reading Food Labels and Ingredient Lists",
    "domain": "general",
    "summary": "Helps a member understand the parts of a packaged food label and identify questions to take to a qualified professional when personal health needs affect food choices.",
    "iconKey": "compass",
    "sortOrder": 62,
    "isFeatured": false,
    "sourceStandard": "Anchor explanations in FDA’s current consumer label materials and, where needed, USDA/HHS dietary-pattern education. Preserve source context: serving size is a label reference, not a personalized recommendation. Do not calculate an individual diet, identify a “best” product, interpret an allergen or medical restriction, or turn general Daily Value information into medical advice. Exclude retailer filters, brand comparisons, paid nutrition apps, and social-media label “hacks.”",
    "safetyNotes": "This topic must not diagnose an allergy, diabetes, blood-pressure condition, kidney condition, or eating disorder, and it must not recommend a food or intake level for a specific person. If a member reports a severe allergic reaction or other acute symptoms, route to emergency services. Make clear that package labels, ingredients, and formulations can change; the current package label controls for the product in hand.",
    "candidateSources": [
      {
        "url": "https://www.fda.gov/food/nutrition-facts-label/how-understand-and-use-nutrition-facts-label",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary candidate for label elements, serving information, nutrients, and percent Daily Value."
      },
      {
        "url": "https://www.fda.gov/food/nutrition-education-resources-materials/nutrition-facts-label",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Candidate hub for current official label-learning resources and alternate label formats."
      }
    ],
    "nextBricks": [
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "brings label information back to member-chosen meals and staples. -"
      },
      {
        "title": "Food Storage, Leftovers, and Safe Handling",
        "reason": "follows when the question is about package directions, storage, or prepared food. -"
      },
      {
        "title": "Fitness Supplements and Performance Claims",
        "reason": "separates ordinary food-label questions from supplement labeling and marketing claims."
      }
    ]
  },
  {
    "slug": "food-storage-leftovers-safe-handling",
    "title": "Food Storage, Leftovers, and Safe Handling",
    "domain": "general",
    "summary": "Helps a member find reviewed public guidance for safer shopping, preparing, cooling, storing, thawing, and reheating of food at home.",
    "iconKey": "compass",
    "sortOrder": 63,
    "isFeatured": false,
    "sourceStandard": "Use current FDA and USDA Food Safety and Inspection Service consumer guidance as the primary standard. Preserve official conditions, food type, storage method, and temperature context; check current guidance before publishing any time or temperature detail. Exclude anecdotal smell/taste tests, viral food-safety videos, provider claims, and invented determinations that a particular food is safe.",
    "safetyNotes": "Never certify that a specific food is safe based on a chat description, image, smell, or date alone. If a member suspects foodborne illness or reports severe symptoms, direct them to prompt medical care and the official reporting pathway. Surface high-risk food questions with the source’s applicable cautions; do not infer pregnancy, age, immune status, or a diagnosis.",
    "candidateSources": [
      {
        "url": "https://www.fda.gov/food/buy-store-serve-safe-food/safe-food-handling",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary candidate for the public “clean, separate, cook, chill” framework and consumer escalation guidance."
      },
      {
        "url": "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/steps-keep-food-safe",
        "publisher": "USDA Food Safety and Inspection Service",
        "purpose": "Primary candidate for safe-handling concepts, storage charts, and current official cooking-temperature tables."
      }
    ],
    "nextBricks": [
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "links safe preparation questions to planned home meals. -"
      },
      {
        "title": "Reading Food Labels and Ingredient Lists",
        "reason": "helps with package directions and date-label context where an official source addresses it. -"
      },
      {
        "title": "Fitness Supplements and Performance Claims",
        "reason": "offers a separate path when a member’s food question is actually about a supplement product."
      }
    ]
  },
  {
    "slug": "starting-a-movement-routine",
    "title": "Starting a Movement Routine",
    "domain": "medical",
    "summary": "Helps a member locate general, evidence-based physical-activity guidance and choose an optional next question about building a routine that fits their stated interests and circumstances.",
    "iconKey": "heart-pulse",
    "sortOrder": 64,
    "isFeatured": false,
    "sourceStandard": "Use the current HHS Physical Activity Guidelines and CDC consumer materials as first-order authority, with National Library of Medicine resources for plain-language context. Present guidance as public health information rather than a prescription. Do not create a workout plan, estimate calorie burn, set a weight-loss goal, clear a member for exercise, or use demographic or medical inferences. Exclude trainer marketing, before-and-after content, uncredentialed exercise videos, and wearable-app rankings.",
    "safetyNotes": "Not medical clearance or a treatment plan. A member who has pain, dizziness, extreme shortness of breath, a condition affecting safe activity, or another health concern should stop and seek appropriate professional guidance; urgent symptoms require urgent care. Do not assume current fitness, disability, age, pregnancy, health status, body size, or access to equipment.",
    "candidateSources": [
      {
        "url": "https://www.cdc.gov/physical-activity-basics/guidelines/adults.html",
        "publisher": "Centers for Disease Control and Prevention",
        "purpose": "Primary candidate for public adult activity guidance and the distinction between aerobic and muscle-strengthening activity."
      },
      {
        "url": "https://odphp.health.gov/our-work/nutrition-physical-activity/physical-activity-guidelines",
        "publisher": "U.S. Department of Health and Human Services, Office of Disease Prevention and Health Promotion",
        "purpose": "Primary candidate hub for the federal guideline and its supporting scientific material."
      },
      {
        "url": "https://medlineplus.gov/exerciseandphysicalfitness.html",
        "publisher": "National Library of Medicine, National Institutes of Health",
        "purpose": "Candidate plain-language health resource that also flags when a member should speak with a health care provider."
      }
    ],
    "nextBricks": [
      {
        "title": "Fitness Supplements and Performance Claims",
        "reason": "distinguishes routine-building from product claims about exercise or recovery. -"
      },
      {
        "title": "Sun Protection and Sunscreen Labels",
        "reason": "connects outdoor activity with official sun-protection information. -"
      },
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "returns to everyday meals without presuming a fitness or weight goal. -"
      },
      {
        "title": "Everyday Hair and Scalp Care",
        "reason": "offers a practical personal-care branch when activity raises hair- or scalp-care questions."
      }
    ]
  },
  {
    "slug": "fitness-supplements-performance-claims",
    "title": "Fitness Supplements and Performance Claims",
    "domain": "medical",
    "summary": "Helps a member interpret the limits of public information about supplements marketed for exercise or performance and identify questions that require a clinician or pharmacist.",
    "iconKey": "heart-pulse",
    "sortOrder": 65,
    "isFeatured": false,
    "sourceStandard": "Start with NIH Office of Dietary Supplements consumer fact sheets and FDA supplement oversight materials. State the regulatory and evidence limits exactly as reviewed sources do; do not recommend a supplement, brand, dose, stack, testing service, or performance regimen. Exclude affiliate reviews, retailer listings, influencer codes, gym marketing, sports-team endorsements, and any claim that a product diagnoses, treats, cures, or prevents disease.",
    "safetyNotes": "Do not assess whether a specific supplement is safe for an individual, recommend a dose, or advise stopping prescribed medication. Members using medicines, managing a condition, experiencing an adverse effect, or considering a supplement for a child should be directed to a qualified health professional or pharmacist. Suspected serious reactions should follow emergency or official reporting guidance as appropriate.",
    "candidateSources": [
      {
        "url": "https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-Consumer/",
        "publisher": "National Institutes of Health, Office of Dietary Supplements",
        "purpose": "Primary consumer candidate on evidence, possible harms, interactions, and the distinction between public information and individualized advice."
      },
      {
        "url": "https://www.fda.gov/food/dietary-supplements",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary candidate for the U.S. regulatory framework and FDA’s oversight resources."
      }
    ],
    "nextBricks": [
      {
        "title": "Starting a Movement Routine",
        "reason": "shifts attention from products to evidence-based activity guidance. -"
      },
      {
        "title": "Reading Food Labels and Ingredient Lists",
        "reason": "helps distinguish food-label literacy from supplement claims. -"
      },
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "keeps ordinary meal questions separate from performance-product marketing."
      }
    ]
  },
  {
    "slug": "sun-protection-sunscreen-labels",
    "title": "Sun Protection and Sunscreen Labels",
    "domain": "medical",
    "summary": "Helps a member understand official U.S. sunscreen-label and sun-protection information without assuming skin tone, skin condition, geography, or product preference.",
    "iconKey": "heart-pulse",
    "sortOrder": 66,
    "isFeatured": false,
    "sourceStandard": "Use current FDA sunscreen and OTC drug-label guidance as the primary standard. Do not imply that sunscreen is unnecessary for any complexion, guarantee prevention of a disease, select a product for a member, or provide condition-specific dermatology advice. Exclude beauty influencer claims, unverified ingredient scare lists, brand SPF comparisons, and claims based on a member’s presumed race or skin tone.",
    "safetyNotes": "Medical information, not a diagnosis or individualized cancer-prevention plan. A concerning new or changing skin finding, severe burn, unexpected reaction, or product concern needs appropriate professional or urgent evaluation. Current product directions and warnings control; never infer a member’s complexion, medication use, age, or skin condition.",
    "candidateSources": [
      {
        "url": "https://www.fda.gov/drugs/understanding-over-counter-medicines/sunscreen-how-help-protect-your-skin-sun",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary consumer candidate for current U.S. sunscreen labeling, directions, safety warnings, and the role of other sun-protection measures."
      },
      {
        "url": "https://www.fda.gov/drugs/understanding-over-counter-medicines/over-counter-drug-facts-label",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Candidate source for reading the Drug Facts label that accompanies nonprescription drug products, including sunscreen products."
      }
    ],
    "nextBricks": [
      {
        "title": "Cosmetic Product Safety and Labels",
        "reason": "connects sunscreen questions to careful reading of product directions and warnings. -"
      },
      {
        "title": "Starting a Movement Routine",
        "reason": "follows when the question is about outdoor movement or activity. -"
      },
      {
        "title": "Everyday Hair and Scalp Care",
        "reason": "provides a separate personal-care route for scalp or hairline questions without diagnosing a condition."
      }
    ]
  },
  {
    "slug": "everyday-hair-scalp-care",
    "title": "Everyday Hair and Scalp Care",
    "domain": "medical",
    "summary": "Helps a member find dermatology-reviewed, non-stigmatizing information about everyday hair and scalp care while preserving their own language for hair texture, style, and cultural practice.",
    "iconKey": "heart-pulse",
    "sortOrder": 67,
    "isFeatured": false,
    "sourceStandard": "Use dermatology-reviewed public guidance as the core, and add public-agency cosmetics safety material for products when relevant. The summary must distinguish routine care from symptoms that need professional assessment. Do not diagnose hair loss, scalp disease, infection, or a product reaction; do not promise growth or repair; do not rank salons, stylists, products, protective styles, or treatments. Exclude product marketing, growth-oil claims, before-and-after posts, and cultural stereotypes.",
    "safetyNotes": "Do not infer ethnicity, race, hairstyle, hair texture, gender, diagnosis, or access to professional care. New, severe, painful, or persistent scalp/hair symptoms and unexpected product reactions should be routed to an appropriate clinician; serious reactions need urgent care. Any future directory result must rely on governed data and must never claim expertise, availability, cost, or cultural competence without verified fields.",
    "candidateSources": [
      {
        "url": "https://www.aad.org/public/everyday-care/hair-scalp-care/hair/healthy-hair-tips",
        "publisher": "American Academy of Dermatology",
        "purpose": "Candidate expert-reviewed public guidance on routine hair care, hair types, gentle handling, and heat exposure."
      },
      {
        "url": "https://www.aad.org/public/darker-skin/hair-care",
        "publisher": "American Academy of Dermatology",
        "purpose": "Candidate inclusive entry point to dermatology-reviewed hair-care resources, including information relevant to Black hair and extensions, without assigning an identity to a member."
      },
      {
        "url": "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Candidate government source for label-reading and safe-use practices for hair products classified as cosmetics."
      }
    ],
    "nextBricks": [
      {
        "title": "Cosmetic Product Safety and Labels",
        "reason": "links hair-product questions to label and safe-use information. -"
      },
      {
        "title": "Starting a Movement Routine",
        "reason": "follows when a member asks how a movement routine intersects with hair care. -"
      },
      {
        "title": "Sun Protection and Sunscreen Labels",
        "reason": "offers an optional branch for outdoor exposure and hairline or exposed-scalp protection questions. -"
      },
      {
        "title": "Cultural Traditions and Family Digital Memories",
        "reason": "creates a non-medical pathway for questions about practices passed through families or communities."
      }
    ]
  },
  {
    "slug": "cosmetic-product-safety-labels",
    "title": "Cosmetic Product Safety and Labels",
    "domain": "general",
    "summary": "Helps a member understand official consumer information about using cosmetics, reviewing labels, and responding appropriately to an unexpected product reaction.",
    "iconKey": "compass",
    "sortOrder": 68,
    "isFeatured": false,
    "sourceStandard": "Use FDA’s current cosmetics consumer pages and related enforcement, complaint, recall, and labeling information. Explain regulatory terms only as FDA defines them. Do not declare a product safe for a particular person, recommend a brand, treat a cosmetic as medical care, or make unsupported claims about “clean,” “natural,” or “non-toxic” products. Exclude product databases with opaque methodology, influencer ingredient lists, sponsored reviews, and retailer ratings.",
    "safetyNotes": "A rash, redness, burn, or other unexpected reaction is not something the Library should diagnose. The public entry should preserve FDA’s instruction to stop using the product and contact a health care provider, with emergency routing for severe symptoms. Do not infer skin tone, pregnancy, allergy history, age, or a condition from the question.",
    "candidateSources": [
      {
        "url": "https://www.fda.gov/cosmetics/resources-consumers-cosmetics/using-cosmetics-safely",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary consumer candidate for labels, safe handling, common label terms, and the response to an unexpected reaction."
      },
      {
        "url": "https://www.fda.gov/cosmetics",
        "publisher": "U.S. Food and Drug Administration",
        "purpose": "Primary candidate hub for current cosmetics regulation, recalls, complaints, ingredients, and safety alerts."
      }
    ],
    "nextBricks": [
      {
        "title": "Sun Protection and Sunscreen Labels",
        "reason": "clarifies that sunscreen is regulated as a nonprescription drug in the United States and has its own label guidance. -"
      },
      {
        "title": "Everyday Hair and Scalp Care",
        "reason": "connects cosmetic-product use to hair and scalp routines. -"
      },
      {
        "title": "Fitness Supplements and Performance Claims",
        "reason": "distinguishes cosmetics from products sold as dietary supplements or performance aids."
      }
    ]
  },
  {
    "slug": "cultural-traditions-family-digital-memories",
    "title": "Cultural Traditions and Family Digital Memories",
    "domain": "history",
    "summary": "Helps a member explore chosen foodways, music, craft, storytelling, ritual, and family materials as living traditions while beginning to preserve photographs, recordings, video, and other digital memories with care.",
    "iconKey": "book-open",
    "sortOrder": 69,
    "isFeatured": false,
    "sourceStandard": "Use Library of Congress personal-archiving and digital-preservation guidance as the primary public-service source. Pair it with recognized cultural-heritage institutions for any historical or cultural framing. Center community recognition, voluntary context, privacy, and plural experience. Do not declare a practice authentic, assign a tradition to a member, appropriate community knowledge, promise permanent preservation, tell a member where to store sensitive material, or publish private materials. Exclude commercial ancestry content, data-broker genealogy sites, cloud-storage comparisons, nonconsensual recordings, viral heritage claims, and “guaranteed” digitization services.",
    "safetyNotes": "Participation and disclosure must be voluntary. Treat family and community materials as potentially sensitive. The Library must not solicit names, images, audio, documents, locations, immigration records, health details, or other personal data as a condition of help. Do not infer heritage, migration history, language, faith, family relationship, or legal status. Respect consent, access, privacy, sacred or restricted knowledge, and community protocols; use the creative-rights topic for general public information, not individualized legal determinations.",
    "candidateSources": [
      {
        "url": "https://digitalpreservation.gov/personalarchiving/",
        "publisher": "Library of Congress",
        "purpose": "Primary candidate hub for public guidance on preserving digital photographs, audio, video, email, records, websites, scanning, and personal collections."
      },
      {
        "url": "https://ich.unesco.org/en/what-is-intangible-heritage-00003",
        "publisher": "UNESCO",
        "purpose": "Primary candidate for the concept of living, inclusive, and community-based intangible cultural heritage."
      },
      {
        "url": "https://folklife.si.edu/cultural-heritage-policy/ICH/smithsonian",
        "publisher": "Smithsonian Center for Folklife and Cultural Heritage",
        "purpose": "Candidate institutional context for traditions of performance, ritual, music, dance, knowledge, storytelling, and oral transmission."
      }
    ],
    "nextBricks": [
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "turns a cultural food question into an optional practical cooking or meal-planning question. -"
      },
      {
        "title": "Creative Work Sharing and Copyright Basics",
        "reason": "surfaces rights, consent, and permissions questions before publishing or widely sharing material. -"
      },
      {
        "title": "Everyday Hair and Scalp Care",
        "reason": "creates a separate route where a question about a tradition also needs current, dermatology-reviewed care information."
      }
    ]
  },
  {
    "slug": "creative-work-sharing-copyright-basics",
    "title": "Creative Work Sharing and Copyright Basics",
    "domain": "legal",
    "summary": "Helps a member locate official U.S. public information about copyright when considering whether and how to share original writing, visual art, music, photographs, recordings, or family materials.",
    "iconKey": "scale",
    "sortOrder": 70,
    "isFeatured": false,
    "sourceStandard": "Use the U.S. Copyright Office as the primary authority for baseline U.S. copyright information. Keep the entry general, current, and jurisdiction-specific. Do not assess ownership, inheritance, fair use, licensing, registration choices, international rights, infringement, or permission for a particular work. Exclude template legal advice, commercial registration services, social-media legal commentary, and claims that physical possession proves rights.",
    "safetyNotes": "This is legal information, not legal advice. The Library must not tell a member whether they can use a particular work, whether they own it, whether an exception applies, or whether to register. Preserve a clear prompt to consult a qualified attorney or the Copyright Office’s official materials for case-specific questions. Do not infer family relationships, ownership, country, or publication history.",
    "candidateSources": [
      {
        "url": "https://www.copyright.gov/help/faq/faq-general.html",
        "publisher": "U.S. Copyright Office",
        "purpose": "Primary candidate for official baseline information on what copyright is, when protection begins, and the role of registration."
      },
      {
        "url": "https://www.copyright.gov/help/faq/faq-protect.html",
        "publisher": "U.S. Copyright Office",
        "purpose": "Primary candidate for official FAQs about protected works, recipes, names, ideas, websites, and found family materials."
      }
    ],
    "nextBricks": [
      {
        "title": "Cultural Traditions and Family Digital Memories",
        "reason": "brings rights questions back to preserving private family and community materials. -"
      },
      {
        "title": "Permissions and Consent for Sharing Family Materials",
        "reason": "surfaces the separate question of whether people whose voices, images, stories, or community knowledge are involved have agreed to sharing. -"
      },
      {
        "title": "Food Traditions and Everyday Meal Planning",
        "reason": "distinguishes recipe use and family cooking from legal questions about original expression."
      }
    ]
  },
  {
    "slug": "moving-to-a-new-city-first-official-steps",
    "title": "Moving to a New City: First Official Steps",
    "domain": "general",
    "summary": "Helps a member organize an official, non-personalized starting point for address updates, state and local service lookups, and civic tasks after a move.",
    "iconKey": "compass",
    "sortOrder": 71,
    "isFeatured": false,
    "sourceStandard": "Use current official federal, state, county, municipal, and election-administration sources. Begin with USAGov as an official routing source, then link to the member-selected jurisdiction’s agency page. Do not publish a universal deadline, residency rule, document list, eligibility conclusion, or tax/legal instruction; these vary by jurisdiction and circumstances. Exclude commercial moving checklists and sponsored lead-generation pages as evidence.",
    "safetyNotes": "Do not infer that a member has moved, where they live, their citizenship, vehicle ownership, income, immigration status, or voting eligibility. This is navigation information, not legal, tax, immigration, or financial advice. Direct an urgent housing or safety crisis to the applicable emergency or local public-service channel; do not present this topic as emergency assistance.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/change-address",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official starting point that distinguishes USPS forwarding from changes with other government services."
      },
      {
        "url": "https://www.usa.gov/local-governments",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "State-indexed official route to local-government contacts and websites."
      },
      {
        "url": "https://www.usa.gov/state-local-governments",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official routing hub for state/local services and agencies."
      }
    ],
    "nextBricks": [
      {
        "title": "Mail Forwarding and Address Changes",
        "reason": "separates postal forwarding from other agency or account updates. -"
      },
      {
        "title": "State ID, Driver’s License, and Vehicle Services After a Move",
        "reason": "connects the broader move to the relevant state’s official motor-vehicle information. -"
      },
      {
        "title": "Finding Your Local Government and City Services",
        "reason": "helps locate the new jurisdiction’s official website and service channels. -"
      },
      {
        "title": "Updating Voter Registration After a Move",
        "reason": "makes a civic action visible without assuming citizenship or voting eligibility. -"
      },
      {
        "title": "Choosing a Household Goods Mover",
        "reason": "supports people who are still planning an interstate household move."
      }
    ]
  },
  {
    "slug": "mail-forwarding-and-address-changes",
    "title": "Mail Forwarding and Address Changes",
    "domain": "general",
    "summary": "Helps a member distinguish official postal forwarding from the separate updates that may be needed with public agencies and organizations.",
    "iconKey": "compass",
    "sortOrder": 72,
    "isFeatured": false,
    "sourceStandard": "Treat the official USPS page and USAGov as primary public-service sources. Recheck the current USPS process, identity-verification terms, forwarding options, and any fees immediately before publication; do not quote a fixed price, period, or delivery timing in a durable summary unless it is refreshed from USPS. State clearly that a postal change-of-address order does not itself update other agencies or private organizations. Exclude third-party change-of-address vendors and affiliate pages.",
    "safetyNotes": "Use official USPS links; do not solicit address, identity, account, or payment details in the Library. This topic cannot determine whether a particular person may use a given process or whether they have completed it. No legal, tax, benefits, or identity-verification advice.",
    "candidateSources": [
      {
        "url": "https://www.usps.com/manage/forward.htm",
        "publisher": "United States Postal Service",
        "purpose": "Primary guidance for permanent and temporary forwarding, official change-of-address channels, and exceptions."
      },
      {
        "url": "https://www.usa.gov/change-address",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official cross-agency context and routing after a move."
      }
    ],
    "nextBricks": [
      {
        "title": "Moving to a New City: First Official Steps",
        "reason": "returns to the wider move-planning framework. -"
      },
      {
        "title": "Updating Voter Registration After a Move",
        "reason": "keeps voter-registration updates distinct from postal forwarding. -"
      },
      {
        "title": "State ID, Driver’s License, and Vehicle Services After a Move",
        "reason": "routes to state-controlled motor-vehicle information. -"
      },
      {
        "title": "Protecting Yourself From Moving Scams",
        "reason": "supports careful use of official sites and scrutiny of unsolicited services."
      }
    ]
  },
  {
    "slug": "choosing-a-household-goods-mover",
    "title": "Choosing a Household Goods Mover",
    "domain": "legal",
    "summary": "Helps a member find official consumer-protection information for planning an interstate household move and understanding the difference between research and a provider recommendation.",
    "iconKey": "scale",
    "sortOrder": 73,
    "isFeatured": false,
    "sourceStandard": "Prioritize FMCSA’s current Protect Your Move resources, including its registered-mover lookup and official rights materials, for interstate household goods moves. Use state consumer-protection or attorney-general sources only for state-specific matters after jurisdiction selection and review. Do not rank or endorse movers, repeat review-site claims, promise recovery, estimate charges, or assert that a provider is licensed, insured, available, or suitable. Exclude lead-generation marketplaces, affiliate comparison lists, and unverified reviews.",
    "safetyNotes": "Consumer-protection information is not legal advice and cannot resolve an individual dispute. Do not infer a member’s property, contract terms, finances, or loss. For immediate danger, theft, or a local emergency, use emergency/local law-enforcement channels as appropriate rather than relying on a Library entry.",
    "candidateSources": [
      {
        "url": "https://www.fmcsa.dot.gov/protect-your-move",
        "publisher": "Federal Motor Carrier Safety Administration, U.S. Department of Transportation",
        "purpose": "Primary federal consumer resource with planning, fraud-prevention, rights, complaint, and registered-mover lookup pathways."
      },
      {
        "url": "https://www.fmcsa.dot.gov/protect-your-move/search-mover",
        "publisher": "Federal Motor Carrier Safety Administration, U.S. Department of Transportation",
        "purpose": "Canonical federal lookup pathway; any result must be checked at display time rather than copied into Library content."
      },
      {
        "url": "https://www.usa.gov/state-consumer",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official routing source for state consumer-protection offices."
      }
    ],
    "nextBricks": [
      {
        "title": "Moving to a New City: First Official Steps",
        "reason": "connects mover selection to post-move public-service tasks. -"
      },
      {
        "title": "Mail Forwarding and Address Changes",
        "reason": "addresses the separate mail task around a household move. -"
      },
      {
        "title": "Moving Problems and Consumer Complaints",
        "reason": "supports questions that arise when a move has gone wrong without promising a remedy. -"
      },
      {
        "title": "Relocation Budgeting and Cost Questions",
        "reason": "a future financial topic can discuss planning methods without quoting provider prices or recommending products."
      }
    ]
  },
  {
    "slug": "state-id-drivers-license-and-vehicle-services-after-a-move",
    "title": "State ID, Driver’s License, and Vehicle Services After a Move",
    "domain": "legal",
    "summary": "Helps a member reach the correct official state motor-vehicle agency after selecting a jurisdiction, without assuming that they drive, own a vehicle, or meet any eligibility rule.",
    "iconKey": "scale",
    "sortOrder": 74,
    "isFeatured": false,
    "sourceStandard": "Use the relevant state or territorial motor-vehicle agency as the controlling source; USAGov may route to those agencies. Treat deadlines, fees, required documents, status, and appointment availability as time-sensitive and jurisdiction-specific—do not state them generically. Exclude blogs, appointment brokers, commercial document services, and search-result snippets.",
    "safetyNotes": "This is not legal advice or a determination of residency, identity-document eligibility, driving privilege, immigration status, or vehicle-registration obligations. Do not collect or display license numbers, identification images, vehicle identification numbers, or other personal records.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/state-motor-vehicle-services",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official state/territory index for DMV-type services."
      },
      {
        "url": "https://www.tsa.gov/realid",
        "publisher": "Transportation Security Administration",
        "purpose": "Federal traveler-facing information that must be read alongside the selected state’s official credential guidance."
      },
      {
        "url": "https://www.tsa.gov/travel/security-screening/identification",
        "publisher": "Transportation Security Administration",
        "purpose": "Current airport-checkpoint identification list; it is not a substitute for state credential rules."
      }
    ],
    "nextBricks": [
      {
        "title": "Moving to a New City: First Official Steps",
        "reason": "places motor-vehicle tasks within a broader move checklist. -"
      },
      {
        "title": "Mail Forwarding and Address Changes",
        "reason": "distinguishes address forwarding from state credential changes. -"
      },
      {
        "title": "Updating Voter Registration After a Move",
        "reason": "offers a separate civic-update path without assuming eligibility. -"
      },
      {
        "title": "Airport Identification and Security Screening",
        "reason": "supports members asking how travel ID questions relate to flight screening, while keeping state credential rules separate. -"
      },
      {
        "title": "Getting Around a New City by Public Transit",
        "reason": "provides a non-driving city-navigation path."
      }
    ]
  },
  {
    "slug": "updating-voter-registration-after-a-move",
    "title": "Updating Voter Registration After a Move",
    "domain": "legal",
    "summary": "Helps a member find the applicable official state or local election authority for address updates and registration questions after a move.",
    "iconKey": "scale",
    "sortOrder": 75,
    "isFeatured": false,
    "sourceStandard": "Use Vote.gov, the relevant state election office, and the local election authority as canonical sources. Present no conclusion about eligibility, registration status, deadlines, address rules, identification requirements, or voting method without current jurisdiction-specific verification. Keep noncitizenship, age, criminal-history, residence, and disability-related assumptions out of ranking and copy. Exclude partisan campaigns, political advertisements, and advocacy summaries as controlling sources.",
    "safetyNotes": "This topic is not legal advice and does not determine voter eligibility, registration, polling place, or election outcome. Do not infer citizenship, voting preference, party affiliation, criminal-history status, address, or participation. Treat election rules and deadlines as urgent/time-sensitive; route to the selected jurisdiction’s official election authority.",
    "candidateSources": [
      {
        "url": "https://vote.gov/",
        "publisher": "U.S. Election Assistance Commission / Vote.gov",
        "purpose": "Official state- and territory-selection path that includes address-change information."
      },
      {
        "url": "https://www.usa.gov/change-voter-registration",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official routing information for registration changes."
      },
      {
        "url": "https://www.usa.gov/state-election-office",
        "publisher": "USAGov (U.S. General Services Administration)",
        "purpose": "Official route to the responsible election office."
      }
    ],
    "nextBricks": [
      {
        "title": "Moving to a New City: First Official Steps",
        "reason": "keeps the civic task visible as an optional part of moving. -"
      },
      {
        "title": "Finding Your Local Government and City Services",
        "reason": "helps identify local government context after jurisdiction selection. -"
      },
      {
        "title": "State ID, Driver’s License, and Vehicle Services After a Move",
        "reason": "connects a related but separate state-service task. -"
      },
      {
        "title": "Voting and Civic Participation",
        "reason": "a future topic for general election participation information, if developed with election sources."
      }
    ]
  },
  {
    "slug": "getting-around-a-new-city-by-public-transit",
    "title": "Getting Around a New City by Public Transit",
    "domain": "general",
    "summary": "Helps a member identify the official transit authority and learn how to begin checking routes, fares, rider alerts, accessibility information, and local trip-planning tools for a selected place.",
    "iconKey": "compass",
    "sortOrder": 76,
    "isFeatured": false,
    "sourceStandard": "Use the selected transit agency’s official website, current rider alerts, fare policy, and trip-planning tools as controlling sources. Use BTS National Transit Map only for national discovery, coverage research, or verification of the existence of a fixed-route/fixed-guideway feed; BTS says it is not meant to replace customer services or real-time navigation. Do not publish schedules, fares, transfer advice, accessibility availability, operating status, route coverage, or safety claims without a current, local operator source. Exclude scraped schedule sites and commercial map claims as primary evidence.",
    "safetyNotes": "Do not infer whether a member drives, can use a given service, has a disability, is traveling alone, or is in immediate danger. A Library page is not real-time navigation, a service alert, or an emergency-response tool. For an active emergency, use local emergency services and the operator’s emergency guidance as applicable.",
    "candidateSources": [
      {
        "url": "https://www.bts.gov/national-transit-map",
        "publisher": "Bureau of Transportation Statistics, U.S. Department of Transportation",
        "purpose": "Authoritative national catalog for discovery and analysis, with an explicit limitation against using it as live navigation."
      },
      {
        "url": "https://geodata.bts.gov/maps/national-transit-map-agencies",
        "publisher": "Bureau of Transportation Statistics, U.S. Department of Transportation",
        "purpose": "Candidate dataset for agency discovery; publication must link onward to an agency’s current rider-facing source."
      },
      {
        "url": "https://www.transit.dot.gov/",
        "publisher": "Federal Transit Administration, U.S. Department of Transportation",
        "purpose": "Federal context for public transportation systems and program information."
      }
    ],
    "nextBricks": [
      {
        "title": "Finding Your Local Government and City Services",
        "reason": "helps connect transportation questions to the selected city/county context. -"
      },
      {
        "title": "Accessible Travel and Transportation Questions",
        "reason": "offers a separate, rights- and access-focused branch without assuming disability. -"
      },
      {
        "title": "Traveling Between Cities",
        "reason": "supports longer-distance journeys beyond a local network. -"
      },
      {
        "title": "State ID, Driver’s License, and Vehicle Services After a Move",
        "reason": "remains available for members who voluntarily ask about driving-related services. -"
      },
      {
        "title": "Neighborhood and City Orientation",
        "reason": "supports learning about a place beyond a route map."
      }
    ]
  },
  {
    "slug": "accessible-travel-and-transportation-questions",
    "title": "Accessible Travel and Transportation Questions",
    "domain": "legal",
    "summary": "Helps a member locate official information about disability-related air-travel protections and identify where to verify current accessibility information for a chosen transportation service.",
    "iconKey": "scale",
    "sortOrder": 77,
    "isFeatured": false,
    "sourceStandard": "Use current U.S. DOT aviation consumer-protection guidance, applicable federal regulations, TSA guidance, and the selected carrier/operator’s current accessibility materials. Separate air-travel rules from local/transit-system practices and do not generalize one to the other. Do not diagnose, identify a person as disabled, decide an accommodation is required, promise a service, or claim that a facility/vehicle is accessible. Exclude self-reported accessibility listings and travel blogs as controlling evidence.",
    "safetyNotes": "Do not request or store diagnoses, medical records, mobility details, assistive-device specifications, or disability status to route this topic. This page is not medical or legal advice and cannot guarantee accommodations. Current carrier, airport, and operator instructions govern a specific trip; an urgent medical issue requires emergency/clinical services, not travel guidance.",
    "candidateSources": [
      {
        "url": "https://www.transportation.gov/individuals/aviation-consumer-protection/traveling-disability",
        "publisher": "U.S. Department of Transportation",
        "purpose": "Primary public guidance on air-travel disability protections, assistance topics, and complaint routing; review for current regulatory status before publication."
      },
      {
        "url": "https://www.transit.dot.gov/ADA",
        "publisher": "Federal Transit Administration, U.S. Department of Transportation",
        "purpose": "Federal starting point for public-transit ADA information."
      },
      {
        "url": "https://www.tsa.gov/travel/tsa-cares",
        "publisher": "Transportation Security Administration",
        "purpose": "Official traveler-support pathway and current screening guidance."
      }
    ],
    "nextBricks": [
      {
        "title": "Airport Identification and Security Screening",
        "reason": "connects to current TSA procedures and support pathways without assuming a medical condition. -"
      },
      {
        "title": "Getting Around a New City by Public Transit",
        "reason": "supports a local-transit follow-up after an air or intercity trip. -"
      },
      {
        "title": "Airline Delays, Cancellations, and Passenger Protections",
        "reason": "offers a separate consumer-protection topic for disrupted flights. -"
      },
      {
        "title": "Traveling Between Cities",
        "reason": "helps compare official information for different modes without ranking providers. -"
      },
      {
        "title": "Finding Your Local Government and City Services",
        "reason": "supports locating official local access information after choosing a jurisdiction."
      }
    ]
  },
  {
    "slug": "airport-identification-and-security-screening",
    "title": "Airport Identification and Security Screening",
    "domain": "general",
    "summary": "Helps a member find current official TSA information about airport checkpoint identification and screening preparation for a domestic trip.",
    "iconKey": "compass",
    "sortOrder": 78,
    "isFeatured": false,
    "sourceStandard": "TSA is the controlling source for U.S. airport security-screening and acceptable-identification guidance. Recheck current identification, screening, liquids, carry-on, and process information immediately before publication; TSA says its acceptable-ID list can change. Use the airline and airport only for their current operational instructions, and do not conflate airline boarding policies with checkpoint rules. Exclude travel hacks, social posts, and dated packing lists.",
    "safetyNotes": "Do not collect identity documents or infer citizenship, immigration status, criminal history, age, disability, or travel plans. This topic does not guarantee boarding or checkpoint access and is not legal advice. For immediate airport-security concerns, follow on-site instructions and official TSA/airport channels.",
    "candidateSources": [
      {
        "url": "https://www.tsa.gov/travel/security-screening/identification",
        "publisher": "Transportation Security Administration",
        "purpose": "Primary current source for adult passenger identification at the checkpoint and related links."
      },
      {
        "url": "https://www.tsa.gov/travel/travel-tips/travel-checklist",
        "publisher": "Transportation Security Administration",
        "purpose": "Primary pre-packing and checkpoint-preparation resource, including links to the current prohibited-items list."
      },
      {
        "url": "https://www.tsa.gov/travel/security-screening/whatcanibring/all",
        "publisher": "Transportation Security Administration",
        "purpose": "Searchable official item-specific screening guidance."
      }
    ],
    "nextBricks": [
      {
        "title": "Accessible Travel and Transportation Questions",
        "reason": "provides optional support information for people who ask about assistance or access. -"
      },
      {
        "title": "Airline Delays, Cancellations, and Passenger Protections",
        "reason": "addresses disruption-related consumer questions separately from screening. -"
      },
      {
        "title": "International Travel Preparation and Travel Advisories",
        "reason": "distinguishes domestic checkpoint preparation from destination-specific international requirements. -"
      },
      {
        "title": "State ID, Driver’s License, and Vehicle Services After a Move",
        "reason": "offers the state-agency pathway for credential questions after a move. -"
      },
      {
        "title": "Traveling Between Cities",
        "reason": "connects airport preparation to broader itinerary choices."
      }
    ]
  },
  {
    "slug": "international-travel-preparation-and-travel-advisories",
    "title": "International Travel Preparation and Travel Advisories",
    "domain": "general",
    "summary": "Helps a member locate current U.S. government destination information, passport information, and voluntary traveler-alert resources before an international trip or period abroad.",
    "iconKey": "compass",
    "sortOrder": 79,
    "isFeatured": false,
    "sourceStandard": "Use U.S. Department of State destination pages, travel advisories, and passport pages as primary U.S. sources, then link to the destination country’s official embassy/consulate or border authority for entry requirements. The State Department describes its advisories as destination-specific risk information for U.S. citizens, and advisory conditions may change; do not apply them to people of other nationalities or claim that they settle an individual’s travel decision.^state-international Use official sources at the time of travel; do not publish visa, entry, health, transit, or safety determinations as evergreen facts. Exclude influencer content, visa agencies, and unverified aggregation sites as controlling sources.",
    "safetyNotes": "Do not infer nationality, citizenship, immigration status, destination, health status, religion, gender identity, ethnicity, or reason for travel. This is not legal, immigration, medical, or security advice; it cannot determine entry permission, visa eligibility, destination safety, or consular assistance. For immediate danger abroad, use local emergency services and the appropriate embassy/consulate guidance.",
    "candidateSources": [
      {
        "url": "https://travel.state.gov/en/international-travel.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Primary destination-information hub for advisories, entry requirements, local laws, embassy information, and help abroad."
      },
      {
        "url": "https://travel.state.gov/en/international-travel/travel-advisories.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Current official advisory list and explanation of the four advisory levels."
      },
      {
        "url": "https://travel.state.gov/en/passports.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Primary source for U.S. passport application, renewal, replacement, and status information."
      },
      {
        "url": "https://travel.state.gov/en/international-travel/travel-advisories/smart-traveler-enrollment-program.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Official voluntary alert/enrollment resource for U.S. citizens and nationals traveling or living abroad."
      }
    ],
    "nextBricks": [
      {
        "title": "Airport Identification and Security Screening",
        "reason": "separates U.S. checkpoint preparation from international destination preparation. -"
      },
      {
        "title": "Travel Documents and Passport Services",
        "reason": "supports a focused inquiry on the U.S. passport process without assuming citizenship or urgency. -"
      },
      {
        "title": "Traveling Between Cities",
        "reason": "retains a domestic/intercity branch for other travel needs. -"
      },
      {
        "title": "Local Culture and Heritage Research",
        "reason": "supports responsible, source-based learning about a destination rather than stereotyping communities. -"
      },
      {
        "title": "Emergency Readiness While Traveling",
        "reason": "a future emergency-preparedness topic can link to official emergency guidance with clear urgency routing."
      }
    ]
  },
  {
    "slug": "local-culture-heritage-and-city-orientation",
    "title": "Local Culture, Heritage, and City Orientation",
    "domain": "history",
    "summary": "Helps a member explore a city’s documented cultural and historical resources—including African American and diaspora-relevant histories—through primary institutional collections and local archives rather than stereotypes or promotional lists.",
    "iconKey": "book-open",
    "sortOrder": 80,
    "isFeatured": false,
    "sourceStandard": "Prefer primary collections and interpretive resources from the relevant city/county/state archive, public library, tribal or community cultural institution, historical society, museum, National Park Service, and Library of Congress. Cross-check contested, community-specific, or place-based claims with more than one reputable institutional source and retain provenance. The Library of Congress’s local-history guides are prepared by reference specialists and point to collections and reputable repositories; NPS recognizes cultural resources across material, landscape, anthropological, and historical forms.^loc-local-history Do not use neighborhood rankings, tourism marketing, unsupported “hidden history” claims, or crowd-sourced lists as authoritative history. Do not frame a community as an attraction or make claims about present-day demographic composition, belonging, safety, political views, or cultural authenticity.",
    "safetyNotes": "Do not infer ancestry, race, ethnicity, religion, immigration history, neighborhood, or personal connection to a historical subject. Historical content may include enslavement, racism, violence, displacement, and other traumatic material; use clear content notes and source context where relevant. This topic is educational and interpretive, not a guarantee about a venue’s current programming, access, safety, or cultural fit.",
    "candidateSources": [
      {
        "url": "https://guides.loc.gov/local-history-genealogy-research-guides",
        "publisher": "Library of Congress",
        "purpose": "Curated research guides and strategies for local and community-history research, with links to collections and repositories."
      },
      {
        "url": "https://www.nps.gov/orgs/1027/cr.htm",
        "publisher": "National Park Service",
        "purpose": "Institutional framing of architecture, archaeology, cultural anthropology, landscapes, history, and museum collections as cultural resources."
      },
      {
        "url": "https://nmaahc.si.edu/explore/collection",
        "publisher": "Smithsonian National Museum of African American History and Culture",
        "purpose": "Searchable institutional collection and digital discovery source for African American history and culture."
      },
      {
        "url": "https://www.nps.gov/subjects/undergroundrailroad/network-to-freedom.htm",
        "publisher": "National Park Service",
        "purpose": "NPS program with listings of sites, facilities, and programs with verifiable connections to the Underground Railroad."
      }
    ],
    "nextBricks": [
      {
        "title": "Finding Your Local Government and City Services",
        "reason": "helps locate official public institutions and city context after choosing a place. -"
      },
      {
        "title": "Getting Around a New City by Public Transit",
        "reason": "supports practical access to public cultural institutions without presenting a route plan. -"
      },
      {
        "title": "African American Civil Rights and Freedom Histories",
        "reason": "a future focused history topic can explore primary NPS and archival resources. -"
      },
      {
        "title": "Family and Community History Research",
        "reason": "supports member-led research through archives and libraries without inferring ancestry. -"
      },
      {
        "title": "Public Libraries, Archives, and Museums",
        "reason": "a future source-literacy topic can explain how to use cultural institutions and collections."
      }
    ]
  },
  {
    "slug": "emergency-alerts-and-calling-for-help",
    "title": "Emergency Alerts and Calling for Help",
    "domain": "general",
    "summary": "Help a member understand official emergency alerts, when emergency calling may be appropriate, and why current local instructions take priority during an incident.",
    "iconKey": "compass",
    "sortOrder": 81,
    "isFeatured": false,
    "sourceStandard": "Use current guidance from FEMA/Ready.gov, the FCC, the National Weather Service, and the relevant state, tribal, territorial, or local emergency-management authority. Prefer official alert-system instructions and incident-specific directives over static explainers. Exclude crowd reports, social posts, commercial alert apps, and unverified screenshots as evidence of an active event. Do not promise that alerts will reach every device or that emergency callers’ locations will always be available.",
    "safetyNotes": "Emergency alerts and local responder instructions override generic Library material. A published summary must distinguish between emergency and non-emergency contact pathways without presenting local numbers unless they are verified in governed data. Do not assume a person has a phone, a compatible device, uninterrupted service, a particular language, or the ability to make a voice call. This topic must avoid implying that 911 or an alert system is available in every location or situation. ---",
    "candidateSources": [
      {
        "url": "https://www.ready.gov/alerts",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Explains Wireless Emergency Alerts, the Emergency Alert System, NOAA Weather Radio, IPAWS, and the FEMA app; it is a primary public-service overview of alert channels."
      },
      {
        "url": "https://www.fcc.gov/general/9-1-1-and-e9-1-1-services",
        "publisher": "Federal Communications Commission",
        "purpose": "Explains the U.S. 911 system, appropriate emergency use, and the evolving role and limits of location and communications technologies."
      },
      {
        "url": "https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/public/wireless-emergency-alerts",
        "publisher": "FEMA",
        "purpose": "Candidate primary source for technical and public guidance about WEA delivery and settings."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Household Emergency Planning",
        "reason": "Alerts are more actionable when a household has already chosen contacts, meeting places, and communication steps."
      },
      {
        "title": "Evacuation and Shelter Planning",
        "reason": "An alert may direct people to evacuate, shelter in place, or seek an official shelter."
      },
      {
        "title": "Emergency Contacts and Important Documents",
        "reason": "A member may want a non-personalized framework for keeping essential contacts and documents accessible."
      },
      {
        "title": "Disaster Recovery and Assistance Navigation",
        "reason": "Some alerts concern a declared disaster and may lead to post-event recovery questions."
      }
    ]
  },
  {
    "slug": "household-emergency-planning",
    "title": "Household Emergency Planning",
    "domain": "general",
    "summary": "Help a member prepare a flexible emergency plan around communication, meeting places, supplies, and the needs they voluntarily choose to consider.",
    "iconKey": "compass",
    "sortOrder": 82,
    "isFeatured": false,
    "sourceStandard": "Prefer FEMA/Ready.gov’s current planning guidance and official state, tribal, territorial, or local emergency-management guidance for area-specific hazards. Treat household composition, language, care responsibilities, access needs, medication, transportation, housing, and immigration-related circumstances as voluntary context only. Exclude prescriptive commercial “survival” lists, product claims, and generalized claims that one plan fits every person or hazard.",
    "safetyNotes": "The Library must not infer family role, disability, health condition, housing status, language, citizenship, income, or caregiving responsibility from a question. Emergency-preparedness content is not medical advice; members should seek qualified professional guidance for individual medical or access planning. Do not ask users to store addresses, medicines, identity documents, contact lists, or emergency plans in the Library unless a separately approved privacy and security design supports that feature. ---",
    "candidateSources": [
      {
        "url": "https://www.ready.gov/plan",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Primary public guidance on assessing local hazards, household communication, meeting places, emergency supplies, documenting, and practicing a plan."
      },
      {
        "url": "https://www.ready.gov/kit",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Candidate official companion source for reviewing emergency-supply considerations without endorsing products or a fixed one-size-fits-all list."
      },
      {
        "url": "https://www.ready.gov/sites/default/files/2025-06/family-communication-plan_fillable-card.pdf",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Candidate official planning tool; any use should make clear that completing or storing it is optional and private."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "A plan can specify how the household will receive and respond to official alerts."
      },
      {
        "title": "Evacuation and Shelter Planning",
        "reason": "A general plan often needs a separate decision path for leaving, sheltering, and transportation."
      },
      {
        "title": "Emergency Contacts and Important Documents",
        "reason": "Contacts and records are practical components of a plan, but should be managed without uploading sensitive details to the Library."
      },
      {
        "title": "Power Outages and Communication Readiness",
        "reason": "A member may want a focused path for communication and information continuity during an outage."
      },
      {
        "title": "Disability, Access, and Emergency Planning",
        "reason": "Optional navigation to access-focused official preparedness guidance should be driven only by a member’s stated needs."
      }
    ]
  },
  {
    "slug": "evacuation-and-shelter-planning",
    "title": "Evacuation and Shelter Planning",
    "domain": "general",
    "summary": "Help a member understand how to prepare for an evacuation or sheltering instruction while emphasizing that local officials direct live incident decisions.",
    "iconKey": "compass",
    "sortOrder": 83,
    "isFeatured": false,
    "sourceStandard": "Use Ready.gov/FEMA and official local emergency-management sources. During a live incident, display current local evacuation orders, shelter status, routes, and accessibility information only when sourced from an official, time-stamped feed or governed public-service data. Do not treat an old map, a community post, or a third-party app as proof that a route or shelter is open. Exclude guarantees about shelters, pets, transportation, accommodations, supplies, or accessibility.",
    "safetyNotes": "Never tell a person to evacuate or stay in place based solely on Library content. Follow current orders from local authorities and emergency responders. A future entry may describe general planning but must not assert that an individual shelter accepts pets, has space, meets a particular access need, or is open; live conditions must be verified independently. Immediate danger requires emergency services when safe and available. ---",
    "candidateSources": [
      {
        "url": "https://www.ready.gov/evacuation",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Primary public guidance on planning departure routes, destinations, go-bags, car and non-car planning, and following local officials."
      },
      {
        "url": "https://www.ready.gov/shelter",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Primary public explanation of mass care sheltering, sheltering in place, and stay-at-home distinctions."
      },
      {
        "url": "https://www.ready.gov/alerts",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Candidate source for the official alert channels through which local instructions may be issued."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Household Emergency Planning",
        "reason": "Evacuation choices work best as part of a previously considered communication and supply plan."
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "Members may need to understand where to obtain current directions and warnings."
      },
      {
        "title": "Transportation During an Emergency",
        "reason": "A focused path can cover contingency thinking for car, transit, walking, or other transportation without promising available rides."
      },
      {
        "title": "Disaster Recovery and Assistance Navigation",
        "reason": "Returning after an event and seeking assistance are different from immediate evacuation decisions."
      },
      {
        "title": "Pets and Animals in Emergencies",
        "reason": "Optional planning can address animal care without assuming a member has animals."
      }
    ]
  },
  {
    "slug": "disaster-recovery-and-assistance-navigation",
    "title": "Disaster Recovery and Assistance Navigation",
    "domain": "general",
    "summary": "Help a member find official post-disaster recovery information and understand that assistance programs, declarations, requirements, and decisions are situation-specific.",
    "iconKey": "compass",
    "sortOrder": 84,
    "isFeatured": false,
    "sourceStandard": "Use FEMA, DisasterAssistance.gov, and the officially designated state, tribal, territorial, or local disaster authority. Every future entry must state that availability and requirements depend on the declared disaster, affected area, program, and individual facts; it must link to the current official source rather than predicting eligibility or payment. Exclude fee-charging application intermediaries, unverified “relief” solicitations, provider marketing, outcome claims, and advice that interprets insurance, benefits, immigration, or legal rights.",
    "safetyNotes": "This is not financial, insurance, legal, tax, or benefits advice and it cannot determine eligibility, required documents, deadlines, award amounts, or appeal prospects. A published page should warn members to use official channels and be alert to impersonation, but it must not assume fraud occurred. Urgent medical, safety, or housing emergencies should be routed to current official emergency or disaster-response information, not to a generic recovery workflow. ---",
    "candidateSources": [
      {
        "url": "https://www.fema.gov/assistance/individual",
        "publisher": "FEMA",
        "purpose": "Primary overview of FEMA’s individual-assistance information, including preparation before applying, application follow-up, appeals, and related recovery programs."
      },
      {
        "url": "https://www.disasterassistance.gov/",
        "publisher": "U.S. government / DisasterAssistance.gov",
        "purpose": "Official public portal for checking and applying for available disaster assistance; use only with live, program-specific verification."
      },
      {
        "url": "https://www.fema.gov/assistance/individual/disaster-fraud",
        "publisher": "FEMA",
        "purpose": "Candidate official source for a fraud-prevention branch associated with disaster recovery."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Evacuation and Shelter Planning",
        "reason": "Immediate safety and temporary shelter questions may precede recovery navigation."
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "Current official disaster declarations and safety instructions can determine the right next step."
      },
      {
        "title": "Disaster Fraud and Scam Awareness",
        "reason": "Disasters can create conditions in which misleading offers and impersonation attempts require extra caution."
      },
      {
        "title": "Important Documents and Records",
        "reason": "A member may want general, privacy-conscious guidance on documenting losses and safeguarding records."
      },
      {
        "title": "Insurance and Disaster Preparedness",
        "reason": "A separate financial-domain topic could explain how to locate official policy information without interpreting coverage."
      }
    ]
  },
  {
    "slug": "safer-driving-and-trip-readiness",
    "title": "Safer Driving and Trip Readiness",
    "domain": "general",
    "summary": "Help a member locate official road-safety information for preparing to drive and reducing common driving risks without judging their skill, vehicle, or circumstances.",
    "iconKey": "compass",
    "sortOrder": 85,
    "isFeatured": false,
    "sourceStandard": "Use NHTSA and other official federal, state, tribal, territorial, or local transportation-safety authorities. Separate broadly applicable safety guidance from state or local traffic laws, which must be current and jurisdiction-specific. Exclude individualized driving assessments, predictions of crash risk, vehicle-repair recommendations, route assurances, law-enforcement advice, and claims about a member’s ability to drive safely. Do not convert a safety explainer into a diagnosis of impairment or fatigue.",
    "safetyNotes": "Do not advise someone to drive when they feel unable to do so, and do not make a clinical or legal judgment about impairment. State and local road laws can differ; a reviewed entry must link to the applicable official jurisdiction rather than summarize law from memory. In severe weather, a crash, a road closure, or another active incident, follow current official instructions and do not rely on static Library content for route status. ---",
    "candidateSources": [
      {
        "url": "https://www.nhtsa.gov/road-safety",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Primary hub for official road-safety materials covering drivers, pedestrians, bicyclists, child safety, motorcycles, and other road users."
      },
      {
        "url": "https://www.nhtsa.gov/risky-driving/distracted-driving",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Primary source defining distracted driving and providing public education on attention while driving; it also notes that state laws vary."
      },
      {
        "url": "https://www.ready.gov/sites/default/files/2020-03/commuter_emergency_plan.pdf",
        "publisher": "FEMA / Ready.gov",
        "purpose": "Candidate official preparedness resource for emergency commuting and travel contingencies, not a substitute for current road-condition advice."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Vehicle Recalls and Safety Defects",
        "reason": "A trip-readiness question may lead to a VIN-specific recall check or a safety-problem report."
      },
      {
        "title": "Walking, Biking, and Transit Safety",
        "reason": "Many trips combine driving with walking, cycling, or public transit."
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "Road conditions and severe-weather alerts can affect travel decisions."
      },
      {
        "title": "Evacuation and Shelter Planning",
        "reason": "Emergency travel needs differ from ordinary trip preparation and must follow official orders."
      },
      {
        "title": "International Travel Readiness",
        "reason": "A member planning to drive abroad needs destination-specific official requirements rather than a generalized U.S. driving answer."
      }
    ]
  },
  {
    "slug": "walking-biking-and-transit-safety",
    "title": "Walking, Biking, and Transit Safety",
    "domain": "general",
    "summary": "Help a member find evidence-based, mode-specific safety information for walking, bicycling, and using public transportation without asserting that a particular route or system is safe.",
    "iconKey": "compass",
    "sortOrder": 86,
    "isFeatured": false,
    "sourceStandard": "Use NHTSA, FTA, and the official operating agency or local transportation authority for current service, accessibility, safety notices, and incident instructions. Include distinct guidance for walkers, bicyclists, drivers, and rail-transit users only when supported by the cited authority. Exclude crowd-sourced safety ratings, crime-risk labels, neighborhood generalizations, and claims that a route, stop, station, sidewalk, bike lane, or transit system is “safe.” Do not substitute static content for active transit alerts or local law.",
    "safetyNotes": "No future page may label a particular neighborhood, route, transit stop, or mode as safe or unsafe, or imply a member’s risk based on location, identity, schedule, disability, gender, or travel pattern. For a current hazard, service disruption, or crime in progress, use official local channels and emergency response as appropriate. Do not list nearby transit agencies, escorts, repair shops, classes, or other services unless governed directory data can support them. ---",
    "candidateSources": [
      {
        "url": "https://www.nhtsa.gov/road-safety/pedestrian-safety",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Primary public guidance on walking near traffic and driver responsibilities around pedestrians."
      },
      {
        "url": "https://www.nhtsa.gov/road-safety/bicycle-safety",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Primary public guidance on bicycle preparation, visibility, road rules, and sharing the road."
      },
      {
        "url": "https://www.transit.dot.gov/regulations-and-guidance/safety/transit-safety-oversight-tso",
        "publisher": "Federal Transit Administration",
        "purpose": "Official overview of the federal transit safety program and its safety oversight role; pair with a local operator’s official materials for any system-specific entry."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Safer Driving and Trip Readiness",
        "reason": "Drivers, pedestrians, and bicyclists share roads and need compatible safety information."
      },
      {
        "title": "Transit Service and Accessibility Navigation",
        "reason": "A separate, governed topic could help interpret agency service information without promising operating conditions."
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "Weather, severe incidents, and local instructions may affect active trips."
      },
      {
        "title": "Route and Location Planning",
        "reason": "Any actual route, lighting, accessibility, or service claim requires current authoritative map or agency data."
      },
      {
        "title": "Bicycle Equipment and Maintenance Basics",
        "reason": "A member may choose a separate educational branch about basic checks and equipment, without endorsing products or repair providers."
      }
    ]
  },
  {
    "slug": "vehicle-recalls-and-safety-defects",
    "title": "Vehicle Recalls and Safety Defects",
    "domain": "general",
    "summary": "Help a member locate official tools for checking safety recalls and reporting potential vehicle, equipment, tire, or car-seat safety problems without diagnosing a defect.",
    "iconKey": "compass",
    "sortOrder": 87,
    "isFeatured": false,
    "sourceStandard": "Use NHTSA’s official recall and safety-problem systems and, where appropriate, a manufacturer’s official recall notice. State clearly that a search result’s scope and limitations are set by the source and may change. Exclude unverified recall lists, dealer marketing, informal repair advice, recall-completion guarantees, price claims, service availability claims, and any assertion that a particular vehicle is roadworthy or defective.",
    "safetyNotes": "This topic does not diagnose a mechanical problem or tell someone whether to continue driving. A recall lookup is not a complete inspection and does not replace current safety instructions from a manufacturer, qualified professional, or emergency official. If there is an immediate road emergency, fire, crash, or danger, emergency response and current official road instructions come first. The Library must not surface repair businesses or claim free service, eligibility, appointment availability, or repair outcomes without governed data and source review. ---",
    "candidateSources": [
      {
        "url": "https://www.nhtsa.gov/recalls",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Primary VIN/license-plate and product recall lookup, with NHTSA’s stated explanations of what searches can and cannot show."
      },
      {
        "url": "https://www.nhtsa.gov/report-a-safety-problem",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Official route for reporting possible vehicle, tire, car-seat, or equipment safety problems."
      },
      {
        "url": "https://www.nhtsa.gov/document/motor-vehicle-safety-defects-and-recalls",
        "publisher": "National Highway Traffic Safety Administration",
        "purpose": "Candidate official explainer on the recall process, rights, and owner responsibilities."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Safer Driving and Trip Readiness",
        "reason": "Recall awareness is one element of vehicle-related trip readiness."
      },
      {
        "title": "Car Seats and Child Passenger Safety",
        "reason": "NHTSA’s recall tools also cover car seats, and a separate topic can handle child-passenger education carefully."
      },
      {
        "title": "Consumer Protection and Auto Repair Decisions",
        "reason": "A separate topic could explain official complaint pathways and consumer-protection sources without recommending businesses."
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "A vehicle defect during an active emergency requires current emergency and road-safety instructions, not a recall lookup alone."
      }
    ]
  },
  {
    "slug": "secure-online-accounts-and-devices",
    "title": "Secure Online Accounts and Devices",
    "domain": "general",
    "summary": "Help a member understand official, broadly applicable steps for strengthening account and device security without asking them to disclose credentials, devices, or private activity.",
    "iconKey": "compass",
    "sortOrder": 88,
    "isFeatured": false,
    "sourceStandard": "Use CISA and other official government cybersecurity guidance, supplemented only after review by recognized standards bodies or primary platform security documentation for platform-specific steps. Separate general practices from guarantees: security measures reduce risk but cannot promise prevention or recovery. Exclude antivirus, VPN, password-manager, device, and identity-monitoring endorsements; product comparisons; unsupported technical claims; instructions that request passwords, recovery codes, account identifiers, or device serial numbers.",
    "safetyNotes": "Never ask a member to share passwords, recovery codes, answers to security questions, device unlock codes, screenshots of account settings, or identity documents. Do not promise that an account cannot be compromised or that a particular security method will work for every provider. A future entry must make clear that account and device interfaces differ and direct members to official provider support for platform-specific actions. Suspected financial or identity misuse belongs in the optional scam/identity-theft branch and, where applicable, official reporting channels. ---",
    "candidateSources": [
      {
        "url": "https://www.cisa.gov/MFA",
        "publisher": "Cybersecurity and Infrastructure Security Agency",
        "purpose": "Primary explanation of multifactor authentication, common terms, and the importance of using more than a password."
      },
      {
        "url": "https://www.cisa.gov/secure-our-world/update-software",
        "publisher": "Cybersecurity and Infrastructure Security Agency",
        "purpose": "Primary public guidance on prompt software updates and automatic-update settings."
      },
      {
        "url": "https://www.cisa.gov/secure-our-world",
        "publisher": "Cybersecurity and Infrastructure Security Agency",
        "purpose": "Candidate hub for reviewed personal cybersecurity guidance, including passwords, phishing, updates, and MFA."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Phishing, Scams, and Identity Theft",
        "reason": "Strong account practices complement recognizing suspicious messages and responding to possible compromise."
      },
      {
        "title": "Privacy and Sharing Information Online",
        "reason": "A member may seek a separate, source-backed explanation of limiting unnecessary data sharing."
      },
      {
        "title": "Account Recovery and Lost Device Planning",
        "reason": "A future topic can address official provider recovery paths and secure preparation without collecting account data."
      },
      {
        "title": "Digital Safety During Travel",
        "reason": "Travel can create added device, connectivity, and account-access questions; the branch should remain optional."
      }
    ]
  },
  {
    "slug": "phishing-scams-and-identity-theft",
    "title": "Phishing, Scams, and Identity Theft",
    "domain": "general",
    "summary": "Help a member recognize common suspicious-message patterns and find official reporting or recovery pathways without determining whether a specific message or event is fraud.",
    "iconKey": "compass",
    "sortOrder": 89,
    "isFeatured": false,
    "sourceStandard": "Use CISA for phishing-recognition guidance and the FTC’s official consumer-reporting and identity-theft recovery services. A future entry may describe indicators and official pathways but must not adjudicate a message, investigate a person, identify a perpetrator, determine liability, or promise recovery. Exclude crowd-sourced scam databases as proof, payment-recovery companies, unverified “fraud investigators,” commercial credit-monitoring referrals, and advice that asks users to upload sensitive evidence to the Library.",
    "safetyNotes": "The Library should say “suspicious” rather than declare that a message is fraudulent unless an official source confirms it. Do not request or retain SSNs, financial-account numbers, driver-license numbers, tax information, passwords, recovery codes, police-report numbers, or screenshots containing sensitive details. This is not legal, financial, credit, or law-enforcement advice. Where money or identity information may be at risk, link to official channels and encourage use of contact details independently verified from an official website rather than those in the suspect message. ---",
    "candidateSources": [
      {
        "url": "https://www.cisa.gov/secure-our-world/recognize-and-report-phishing",
        "publisher": "Cybersecurity and Infrastructure Security Agency",
        "purpose": "Primary public guidance on suspicious-message indicators and safer verification/reporting practices."
      },
      {
        "url": "https://www.identitytheft.gov/",
        "publisher": "Federal Trade Commission",
        "purpose": "Official federal reporting and recovery-plan resource for identity-theft victims; it explains its privacy and reporting functions."
      },
      {
        "url": "https://reportfraud.ftc.gov/",
        "publisher": "Federal Trade Commission",
        "purpose": "Official federal portal for reporting fraud, scams, and bad business practices, with an explanation of how reports may be used."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Secure Online Accounts and Devices",
        "reason": "Account security measures can reduce exposure and are useful after a member has verified official next steps."
      },
      {
        "title": "Account Recovery and Lost Device Planning",
        "reason": "A future branch can frame recovery planning without requesting account credentials."
      },
      {
        "title": "Disaster Recovery and Assistance Navigation",
        "reason": "Disaster-related scams and impersonation are an optional, relevant caution after a declared event."
      },
      {
        "title": "Consumer Complaints and Financial Account Safety",
        "reason": "A separate, carefully sourced financial topic can cover official consumer-protection steps without providing financial advice."
      },
      {
        "title": "Digital Privacy and Data Sharing",
        "reason": "A member may want to learn general practices for reducing unnecessary exposure of personal information."
      }
    ]
  },
  {
    "slug": "international-travel-readiness",
    "title": "International Travel Readiness",
    "domain": "general",
    "summary": "Help a member organize official pre-travel information for an international trip, including destination requirements, alerts, documents, and health preparation, while avoiding assumptions about nationality or eligibility.",
    "iconKey": "compass",
    "sortOrder": 90,
    "isFeatured": false,
    "sourceStandard": "Use the official authority for the traveler’s own nationality or travel document, the destination government or embassy/consulate, the U.S. Department of State for its stated audience, and CDC Travelers’ Health for current destination-specific health information. Make audience and jurisdiction explicit: State Department Travel Advisories are assessments for U.S. citizens, nationals, and legal residents, not universal safety ratings for all travelers. Exclude visa brokers, travel influencers, booking sites, crowd-sourced entry reports, insurance marketing, and any claim about a member’s immigration status, visa eligibility, documentation sufficiency, border outcome, or ability to obtain assistance.",
    "safetyNotes": "This topic is not immigration, visa, passport, customs, legal, insurance, or medical advice. Never infer citizenship, nationality, dual nationality, legal status, family relationship, health condition, religion, race, gender, sexuality, or destination from a member’s question. Travel requirements and security conditions can change; a future entry must use current official sources and date-stamp time-sensitive material. If a traveler faces an immediate emergency abroad, Library content must direct them to local emergency services and the appropriate official consular or diplomatic channel rather than promise protection or evacuation. --- ## Research notes and publication controls The source set above is intentionally weighted toward primary public authorities. It supports a source-governed Library model because these sources can provide stable baseline concepts while live local conditions remain external, current, and clearly labeled. In particular: - Emergency information is time-sensitive. Ready.gov’s planning materials explain preparation, but only current official local instructions should drive a response to an active event. The FCC explains the U.S. 911 system but does not justify a claim that every calling context has the same feature or availability. - Transportation safety is not a location safety rating. NHTSA and FTA materials provide educational and oversight context; they do not permit a Library to label a particular street, neighborhood, transit system, or trip as safe. - Digital safety must avoid data collection. CISA and FTC sources support high-level prevention and official reporting/recovery navigation. They do not justify collecting account credentials, device information, or identity-theft evidence from members. - Diaspora relevance requires scope clarity, not assumptions. State Department content can be useful for eligible U.S. travelers, while CDC pages provide destination-health preparation. A future entry must point all travelers to the applicable official authority for their own travel documents and destination requirements rather than treating a U.S. source as universal. Before any record is published, reviewers should confirm that: (1) the candidate URLs still resolve to the authoritative publisher; (2) at least two sources remain substantively relevant to the precise entry; (3) all current-program, local, and legal/medical/financial boundaries are visible; (4) no ungoverned directory result is presented as evidence; and (5) the mobile and web versions expose the same approved source set, source count, related branches, and official links. ## Source links reviewed for this package 1. Ready.gov — Make a Plan 2. Ready.gov — Emergency Alerts 3. Ready.gov — Evacuation 4. Ready.gov — Shelter 5. FEMA — Individual Assistance 6. DisasterAssistance.gov 7. FCC — 911 and E911 Services 8. NHTSA — Road Safety 9. NHTSA — Distracted Driving 10. NHTSA — Pedestrian Safety 11. NHTSA — Bicycle Safety 12. NHTSA — Check for Recalls 13. FTA — Transit Safety & Oversight 14. CISA — More than a Password 15. CISA — Update Software 16. CISA — Recognize and Report Phishing 17. FTC — IdentityTheft.gov 18. FTC — ReportFraud.ftc.gov 19. U.S. Department of State — International Travel Checklist 20. U.S. Department of State — Travel Advisories 21. CDC Travelers’ Health — Before You Travel Prepared for the Living Library 100-topic starter corpus; this report does not publish content, create a directory record, alter member data, or replace official or professional help.",
    "candidateSources": [
      {
        "url": "https://travel.state.gov/en/international-travel/planning/checklist.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Primary U.S.-government pre-travel checklist covering destination research, STEP, document copies, destination requirements, and planning considerations; explicitly label its U.S.-citizen-oriented scope."
      },
      {
        "url": "https://travel.state.gov/en/international-travel/travel-advisories.html",
        "publisher": "U.S. Department of State, Bureau of Consular Affairs",
        "purpose": "Official explanation of Travel Advisory levels and their stated scope for U.S. citizens, nationals, and legal residents."
      },
      {
        "url": "https://wwwnc.cdc.gov/travel/page/before-travel",
        "publisher": "Centers for Disease Control and Prevention",
        "purpose": "Official destination-health preparation overview, including a link to destination pages and the recommendation to seek individualized advice from a qualified clinician when appropriate."
      },
      {
        "url": "https://mytravel.state.gov/s/step",
        "publisher": "U.S. Department of State",
        "purpose": "Official enrollment service for eligible U.S. travelers; a reviewed entry must describe eligibility and purpose exactly as the current source states."
      }
    ],
    "nextBricks": [
      {
        "title": "---",
        "reason": "---"
      },
      {
        "title": "Emergency Alerts and Calling for Help",
        "reason": "Travelers may need a plan for receiving official alerts and reaching emergency services in the location where they are traveling."
      },
      {
        "title": "Digital Safety During Travel",
        "reason": "Optional preparation for account access, devices, and communications can be relevant while away from home."
      },
      {
        "title": "Travel Documents and Entry Requirements",
        "reason": "A future legal-information topic can explain how to locate official destination and carrier requirements without interpreting a member’s status."
      },
      {
        "title": "Travel Health Preparation",
        "reason": "A medical-domain topic can direct members to official, destination-specific health guidance and qualified clinicians rather than provide medical advice."
      },
      {
        "title": "Returning Home and Post-Travel Planning",
        "reason": "Optional navigation can cover document retention, follow-up, and official updates without assuming a problem occurred."
      }
    ]
  },
  {
    "slug": "business-idea-market-research-and-planning",
    "title": "Business Idea, Market Research, and Business Planning",
    "domain": "general",
    "summary": "Helps a member frame a business idea, examine a potential market, and understand what a business plan can organize before they make business decisions.",
    "iconKey": "compass",
    "sortOrder": 91,
    "isFeatured": false,
    "sourceStandard": "Use current SBA planning guidance and underlying federal statistical or classification sources named by SBA for general process. For a substantive entry, distinguish guidance from any member’s actual market conditions. Exclude claims that a particular idea will be profitable, demand estimates not tied to an identified source and date, paid plan-template promotions, and business success guarantees.",
    "safetyNotes": "Educational planning content is not a prediction of profitability or a recommendation to invest, borrow, form an entity, or leave employment. Do not infer the member’s income, immigration status, disability, ownership identity, or access to capital from the question.",
    "candidateSources": [
      {
        "url": "https://www.sba.gov/counseling/plan-your-business/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Canonical federal starting point for market research, competitive analysis, business-plan formats, and startup-cost planning."
      },
      {
        "url": "https://www.sba.gov/counseling/local-assistance/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Official route to SBA’s assistance network; use only after review of what the current locator represents."
      }
    ],
    "nextBricks": [
      {
        "title": "Choosing a Business Structure",
        "reason": "structure decisions affect paperwork, taxes, and liability considerations"
      },
      {
        "title": "Starting and Registering a U.S. Business",
        "reason": "turns a plan into a sequence of official setup questions"
      },
      {
        "title": "Small-Business Funding and Capital Choices",
        "reason": "connects planning assumptions to how funding is evaluated"
      },
      {
        "title": "Business Taxes, Records, and Worker Obligations",
        "reason": "introduces obligations that may shape operating plans"
      },
      {
        "title": "Selling to the Federal Government",
        "reason": "a distinct market path for members considering public-sector customers."
      }
    ]
  },
  {
    "slug": "starting-and-registering-a-us-business",
    "title": "Starting and Registering a U.S. Business",
    "domain": "legal",
    "summary": "Helps a member understand the official setup questions around business location, name, structure, registration, tax identifiers, and licenses without selecting an answer for them.",
    "iconKey": "scale",
    "sortOrder": 92,
    "isFeatured": false,
    "sourceStandard": "Use current SBA, IRS, and applicable state, territorial, tribal, county, or municipal official sources. Treat entity formation, licensing, zoning, and tax rules as location- and fact-specific. Exclude paid filing-service guidance as authoritative evidence, invented local requirements, claims that one structure is “best,” and assurances about liability or tax results.",
    "safetyNotes": "This is legal and financial education, not legal, tax, or accounting advice. The Library must not choose a structure, say a permit is or is not required, or imply that an online filing creates compliance. Direct members to the authoritative government of the relevant location and to qualified professional advice when their facts require it.",
    "candidateSources": [
      {
        "url": "https://www.sba.gov/counseling/launch-your-business/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Official overview of location, structure, naming, registration, tax ID, license, bank-account, and insurance setup questions."
      },
      {
        "url": "https://www.irs.gov/businesses",
        "publisher": "Internal Revenue Service",
        "purpose": "Official tax-information hub with entry points for EINs and business types."
      }
    ],
    "nextBricks": [
      {
        "title": "Business Idea, Market Research, and Business Planning",
        "reason": "clarifies the plan that may precede setup"
      },
      {
        "title": "Business Taxes, Records, and Worker Obligations",
        "reason": "connects registration choices to ongoing tax administration"
      },
      {
        "title": "Small-Business Funding and Capital Choices",
        "reason": "supports questions that arise after a member identifies the business’s needs"
      },
      {
        "title": "Home-Based Business and Local Rules",
        "reason": "a future related topic if the Library develops it with current local government sources"
      },
      {
        "title": "Selling to the Federal Government",
        "reason": "identifies the additional federal registration path for public contracting."
      }
    ]
  },
  {
    "slug": "business-taxes-records-and-worker-obligations",
    "title": "Business Taxes, Records, and Worker Obligations",
    "domain": "financial",
    "summary": "Helps a member locate official information about federal business tax topics and recognize when state, local, worker-classification, or professional guidance may also be needed.",
    "iconKey": "landmark",
    "sortOrder": 93,
    "isFeatured": false,
    "sourceStandard": "Prioritize current IRS forms, instructions, publications, and business-topic pages, then applicable state and local revenue and labor authorities. Require qualified review before any publication that describes a deadline, filing requirement, payroll obligation, classification rule, deduction, or tax consequence. Exclude tax-saving promises, social-media advice, unreviewed software content, and any individualized filing calculation.",
    "safetyNotes": "Financial and tax information is general education only, not tax, legal, payroll, or accounting advice. Do not calculate tax, classify a worker, recommend a deduction, or infer that a member employs workers. Current official instructions control.",
    "candidateSources": [
      {
        "url": "https://www.irs.gov/businesses",
        "publisher": "Internal Revenue Service",
        "purpose": "Primary federal hub for business and self-employed tax information, including EIN, employment-tax, estimated-tax, filing, and business-type pathways."
      },
      {
        "url": "https://www.sba.gov/counseling/launch-your-business/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Context for the tax-ID and launch steps that precede ongoing administration."
      }
    ],
    "nextBricks": [
      {
        "title": "Starting and Registering a U.S. Business",
        "reason": "connects tax questions to the basic setup sequence"
      },
      {
        "title": "Choosing a Business Structure",
        "reason": "clarifies why business form can be relevant to tax navigation"
      },
      {
        "title": "Small-Business Funding and Capital Choices",
        "reason": "distinguishes operating obligations from borrowing or investment decisions"
      },
      {
        "title": "Business Insurance and Risk Management",
        "reason": "a future separately sourced topic for non-tax operating risks"
      },
      {
        "title": "Selling to the Federal Government",
        "reason": "connects accurate entity information to federal registration and compliance."
      }
    ]
  },
  {
    "slug": "small-business-funding-and-capital-choices",
    "title": "Small-Business Funding and Capital Choices",
    "domain": "financial",
    "summary": "Helps a member identify questions to ask when exploring capital for a business and locate current official SBA information about financing pathways.",
    "iconKey": "landmark",
    "sortOrder": 94,
    "isFeatured": false,
    "sourceStandard": "Prioritize current SBA program pages, program rules, and official lender or intermediary information where relevant. State that availability, terms, underwriting, and eligibility are determined by the applicable program and participating institution, not the Library. Exclude lender advertisements, promises of approval, rate or fee comparisons without date and methodology, unsolicited financing offers, and “guaranteed grant” claims.",
    "safetyNotes": "Financial education only. Do not recommend taking on debt or selling ownership, estimate approval odds, state current rates or fees without a reviewed dated source, or infer financial need or credit status. Advise caution with urgent or unsolicited financing solicitations and route suspected fraud to the appropriate official channel once sourced.",
    "candidateSources": [
      {
        "url": "https://www.sba.gov/funding-programs",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Canonical SBA overview of its loan programs and additional funding pathways, with program-specific links."
      },
      {
        "url": "https://www.sba.gov/counseling/plan-your-business/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Connects startup-cost and business-plan questions to a member’s preparation for funding research."
      }
    ],
    "nextBricks": [
      {
        "title": "Business Idea, Market Research, and Business Planning",
        "reason": "business plans and cost questions often inform funding conversations"
      },
      {
        "title": "Business Taxes, Records, and Worker Obligations",
        "reason": "ongoing obligations affect financial planning"
      },
      {
        "title": "Starting and Registering a U.S. Business",
        "reason": "clarifies the core setup questions that may precede funding"
      },
      {
        "title": "Selling to the Federal Government",
        "reason": "public contracting is a different potential revenue route, not a funding guarantee"
      },
      {
        "title": "Consumer Protection and Fraud Prevention",
        "reason": "a future topic for reviewing questionable funding solicitations with official sources."
      }
    ]
  },
  {
    "slug": "selling-to-the-federal-government",
    "title": "Selling to the Federal Government",
    "domain": "general",
    "summary": "Helps a member understand the distinct research, registration, classification, and compliance questions involved in pursuing federal contracts.",
    "iconKey": "compass",
    "sortOrder": 95,
    "isFeatured": false,
    "sourceStandard": "Use current SBA, SAM.gov/GSA, acquisition.gov, and other controlling federal sources. Publish program-specific eligibility or certification material only after checking the current official rule and source date. Exclude third-party SAM-registration services, sales claims about obtaining contracts, certification guarantees, and old procurement guides.",
    "safetyNotes": "Do not state that a business qualifies as small, is eligible for a certification, or can win a contract. The Library must not upload documents, make representations, or submit registrations for members. Requirements can change and must be verified in the controlling system.",
    "candidateSources": [
      {
        "url": "https://www.sba.gov/counseling/get-started/",
        "publisher": "U.S. Small Business Administration",
        "purpose": "Official introduction to readiness, market research, basic registrations, NAICS, size standards, SAM, and compliance in federal contracting."
      },
      {
        "url": "https://sam.gov/entity-registration",
        "publisher": "U.S. General Services Administration, SAM.gov",
        "purpose": "Primary source for entity registration and Unique Entity ID information for entities seeking federal awards."
      }
    ],
    "nextBricks": [
      {
        "title": "Business Idea, Market Research, and Business Planning",
        "reason": "procurement research is a market-research branch"
      },
      {
        "title": "Starting and Registering a U.S. Business",
        "reason": "connects business formation and tax setup to a possible contracting path"
      },
      {
        "title": "Small-Business Funding and Capital Choices",
        "reason": "helps distinguish capital questions from procurement requirements"
      },
      {
        "title": "Business Taxes, Records, and Worker Obligations",
        "reason": "supports compliance awareness"
      },
      {
        "title": "Federal Contracting Certifications",
        "reason": "a future distinct topic only after current program rules are reviewed."
      }
    ]
  },
  {
    "slug": "preparing-to-buy-a-home",
    "title": "Preparing to Buy a Home",
    "domain": "financial",
    "summary": "Helps a member understand the broad homebuying path and identify official questions about readiness, financing, assistance, counseling, and the purchase process.",
    "iconKey": "landmark",
    "sortOrder": 96,
    "isFeatured": false,
    "sourceStandard": "Use current CFPB and HUD consumer guidance, and official state or local program pages only when a member selects a jurisdiction. Treat assistance-program availability and eligibility as dynamic. Exclude real-estate listings, lender marketing, price forecasts, claims that someone can afford a home, and local provider recommendations.",
    "safetyNotes": "Financial education only, not an affordability finding, lending recommendation, or promise of program eligibility. Do not infer credit, income, family role, citizenship, disability, first-time-buyer status, or preferred location. Members facing pressure to wire funds or disclose sensitive financial information should be routed to current CFPB scam-prevention material after review.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/owning-a-home/",
        "publisher": "Consumer Financial Protection Bureau",
        "purpose": "Federal consumer guide organized from preparing to shop through loan comparison and closing."
      },
      {
        "url": "https://www.hud.gov/helping-americans/buying-a-home",
        "publisher": "U.S. Department of Housing and Urban Development",
        "purpose": "Official homebuying overview with housing-counseling and state-program entry points."
      }
    ],
    "nextBricks": [
      {
        "title": "Comparing Mortgages, Loan Estimates, and Closing",
        "reason": "follows the financing and offer stage"
      },
      {
        "title": "Homebuyer Rights, Housing Discrimination, and Counseling",
        "reason": "connects rights and approved counseling navigation"
      },
      {
        "title": "Homeownership Costs and Budgeting",
        "reason": "a future topic for source-backed cost categories without personal affordability conclusions"
      },
      {
        "title": "Home Repair and Maintenance",
        "reason": "a future practical branch after purchase"
      },
      {
        "title": "Relocation and City Navigation",
        "reason": "connects a move to general location research without inferring a destination."
      }
    ]
  },
  {
    "slug": "comparing-mortgages-loan-estimates-and-closing",
    "title": "Comparing Mortgages, Loan Estimates, and Closing",
    "domain": "financial",
    "summary": "Helps a member locate official explanations of mortgage offers, Loan Estimates, closing documents, and questions to bring to a lender or approved housing counselor.",
    "iconKey": "landmark",
    "sortOrder": 97,
    "isFeatured": false,
    "sourceStandard": "Prioritize CFPB forms, explainers, and current mortgage rules; use HUD-approved counselor information for navigation. Do not simplify a specific loan into a personalized recommendation. Exclude lender advertisements, current-rate claims without a reviewed official dated source, settlement-service referrals, and assertions that any loan feature is right for the member.",
    "safetyNotes": "Financial education only; the Library must not select a loan, calculate closing costs, predict approval, or tell a member to waive review. Published content should clearly distinguish a lender’s estimate from final terms and point members to a HUD-approved counselor locator where current official data supports it.",
    "candidateSources": [
      {
        "url": "https://www.consumerfinance.gov/owning-a-home/compare/review-loan-estimates/",
        "publisher": "Consumer Financial Protection Bureau",
        "purpose": "Primary consumer guidance on reading and comparing Loan Estimates and identifying questions for lenders."
      },
      {
        "url": "https://www.consumerfinance.gov/owning-a-home/",
        "publisher": "Consumer Financial Protection Bureau",
        "purpose": "Official homebuying sequence with tools for loan exploration, comparison, and closing."
      }
    ],
    "nextBricks": [
      {
        "title": "Preparing to Buy a Home",
        "reason": "returns to the earlier homebuying roadmap"
      },
      {
        "title": "Homebuyer Rights, Housing Discrimination, and Counseling",
        "reason": "provides a rights and counseling path"
      },
      {
        "title": "Homeownership Costs and Budgeting",
        "reason": "a future topic to frame recurring and one-time cost questions without personal advice"
      },
      {
        "title": "Mortgage Problems and Payment Help",
        "reason": "a future safety-sensitive topic that needs current official sources"
      },
      {
        "title": "Consumer Protection and Fraud Prevention",
        "reason": "a future branch for source-backed scam and complaint guidance."
      }
    ]
  },
  {
    "slug": "homebuyer-rights-housing-discrimination-and-counseling",
    "title": "Homebuyer Rights, Housing Discrimination, and Counseling",
    "domain": "legal",
    "summary": "Helps a member locate official information about fair-housing protections, complaint pathways, and HUD-approved housing counseling without deciding whether a legal violation occurred.",
    "iconKey": "scale",
    "sortOrder": 98,
    "isFeatured": false,
    "sourceStandard": "Use current HUD statutory-rights and complaint information, CFPB consumer-protection material, and controlling federal, state, or local authority where a member selects a jurisdiction. Clearly label general information as non-legal advice. Exclude diagnosis of discrimination, legal conclusions, attorney or provider recommendations, and stale enforcement summaries.",
    "safetyNotes": "Legal information only. Do not decide that discrimination occurred, assess a deadline, advise litigation, or require members to disclose a protected characteristic or personal history. When a member describes an immediate safety concern, route to emergency services rather than a housing-information workflow.",
    "candidateSources": [
      {
        "url": "https://www.hud.gov/helping-americans/fair-housing-act-overview",
        "publisher": "U.S. Department of Housing and Urban Development",
        "purpose": "Official overview of Fair Housing Act protections in housing and mortgage-related activities, with a complaint route."
      },
      {
        "url": "https://www.consumerfinance.gov/find-a-housing-counselor/",
        "publisher": "Consumer Financial Protection Bureau",
        "purpose": "Counselor locator description that identifies HUD’s official counselor list as its underlying data source."
      }
    ],
    "nextBricks": [
      {
        "title": "Preparing to Buy a Home",
        "reason": "returns to the overall purchase roadmap"
      },
      {
        "title": "Comparing Mortgages, Loan Estimates, and Closing",
        "reason": "supports questions arising during loan shopping and closing"
      },
      {
        "title": "Housing Discrimination and Fair Housing Rights",
        "reason": "a future dedicated legal topic if reviewed against controlling law and enforcement sources"
      },
      {
        "title": "Consumer Complaints and Financial Protection",
        "reason": "a future source-governed route for appropriate complaint systems"
      },
      {
        "title": "Renting, Leases, and Tenant Rights",
        "reason": "a separate future topic that should not be collapsed into homebuying rights."
      }
    ]
  },
  {
    "slug": "voter-registration-and-election-participation",
    "title": "Voter Registration and Election Participation",
    "domain": "general",
    "summary": "Helps a member find current official paths to register, update or check registration, and locate state- or local-election information in a neutral, nonpartisan format.",
    "iconKey": "compass",
    "sortOrder": 99,
    "isFeatured": false,
    "sourceStandard": "Use Vote.gov, EAC, and official state or local election-office sources. Election information is time-sensitive: publish deadline, identification, ballot, polling-place, and absentee information only from the controlling jurisdiction’s current source, with a visible retrieval date. Exclude partisan sources, candidate advocacy, voter-targeting claims, and assumptions about a member’s eligibility or party affiliation.",
    "safetyNotes": "Keep this topic nonpartisan and non-coercive. Do not infer citizenship, age, residence, legal status, prior voting, disability, party preference, or election preference. Never present a deadline or eligibility conclusion as universal; direct the member to the current official authority for their jurisdiction.",
    "candidateSources": [
      {
        "url": "https://vote.gov/register",
        "publisher": "Vote.gov / U.S. Election Assistance Commission",
        "purpose": "Official state and territory gateway for registration, updates, registration checks, and current state-specific information."
      },
      {
        "url": "https://www.eac.gov/voters/register-and-vote-in-your-state",
        "publisher": "U.S. Election Assistance Commission",
        "purpose": "Federal index to state and local election-office information; EAC cautions users to verify current information with linked state and local sources."
      }
    ],
    "nextBricks": [
      {
        "title": "Contacting Elected Officials and Public Participation",
        "reason": "connects voting to other neutral civic-engagement routes"
      },
      {
        "title": "Relocation and City Navigation",
        "reason": "returns to general move-related questions when a member has changed address"
      },
      {
        "title": "Voting While Living Abroad or Serving in the Military",
        "reason": "a future focused topic requiring current Federal Voting Assistance Program sources"
      },
      {
        "title": "Election-Day Planning",
        "reason": "a future current-information topic for official polling-place and ballot options"
      },
      {
        "title": "Understanding Local Government",
        "reason": "a future civics topic about institutions rather than parties or candidates."
      }
    ]
  },
  {
    "slug": "community-service-public-participation-and-elected-officials",
    "title": "Community Service, Public Participation, and Contacting Elected Officials",
    "domain": "general",
    "summary": "Helps a member explore neutral, practical routes to community service and to locating public officials or public-participation channels without endorsing organizations, parties, candidates, or viewpoints.",
    "iconKey": "compass",
    "sortOrder": 100,
    "isFeatured": false,
    "sourceStandard": "For official contacts, use USAGov, Congress.gov, and verified state or local government sources. For volunteer opportunities, preserve AmeriCorps’ stated limitation that its search may include third-party organizations and is not an endorsement. Exclude unverified volunteer listings, political fundraising, endorsements, claims about a group’s impact or ownership, and calls to action framed around any party or candidate.",
    "safetyNotes": "Do not infer political beliefs, voting history, civic capacity, or organizational affiliation. Keep all wording neutral and do not create pressure to volunteer, contact an official, attend a meeting, or join an organization. Any public-meeting schedules or volunteer opportunities are dynamic and require an authoritative, current source.",
    "candidateSources": [
      {
        "url": "https://www.usa.gov/elected-officials",
        "publisher": "USAGov / U.S. General Services Administration",
        "purpose": "Official navigation page for federal, state, and local elected-official contact sources."
      },
      {
        "url": "https://www.americorps.gov/join/find-volunteer-opportunity",
        "publisher": "AmeriCorps",
        "purpose": "Official volunteer-opportunity search entry point and disclosure of its contributing opportunity sources and non-endorsement limitation."
      }
    ],
    "nextBricks": [
      {
        "title": "Voter Registration and Election Participation",
        "reason": "provides an official, nonpartisan election-navigation path"
      },
      {
        "title": "Understanding Local Government",
        "reason": "a future topic on how city and county institutions work"
      },
      {
        "title": "Public Meetings and Public Comment",
        "reason": "a future location-specific topic that must use the relevant government’s current notices"
      },
      {
        "title": "Community Organizations and Mutual Aid",
        "reason": "a future topic only if governed data and community-contribution policy can support it"
      },
      {
        "title": "Serving as a Poll Worker",
        "reason": "a future current-information topic that should route through EAC or local election officials."
      }
    ]
  }
] as const;


export const LIBRARY_STARTER_TOPICS: readonly LibraryStarterTopic[] = [
  ...LIBRARY_PRIMARY_COLLECTION_TOPICS,
  ...LIBRARY_BASE_STARTER_TOPICS,
];
