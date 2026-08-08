/**
 * Kinfolk AI Knowledge Library — Comprehensive Topic Seed
 *
 * Sources:
 *   • MWM Kinfolk AI Knowledge Library Specification (PDF, 2026)
 *   • Kinfolk AI Knowledge Library Expansion Review (TXT, 2026)
 *
 * These are the BUILT-IN topics for the Knowledge Library. They are seeded on
 * every boot via ensureKnowledgeTopics() in startup-migrations.ts and are
 * dedup-safe (matched by lower-cased topic name). All topics marked tier:"free".
 *
 * Categories used:
 *   health | financial | education | employment | family | legal | lifestyle
 *   community | recovery | travel | relocation | business | entertainment
 *   home | safety | digital | diaspora | platform | community_culture
 */

export type KnowledgeTopicSeed = {
  topicName: string;
  category: string;
  description: string;
  keywords: string[];
  notificationPriority: "breaking" | "standard" | "digest" | "immediate";
  trustedSources: { name: string; domain: string }[];
};

export const KNOWLEDGE_LIBRARY_SEED: KnowledgeTopicSeed[] = [

  // ── HEALTH & WELLNESS ───────────────────────────────────────────────────────

  {
    topicName: "Blood Pressure & Hypertension",
    category: "health",
    description: "Blood pressure management resources for communities disproportionately affected by hypertension — prevention, diet, medication, and culturally competent care.",
    keywords: ["hypertension Black Americans", "high blood pressure management African American", "blood pressure diet minority health", "hypertension prevention"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CDC", domain: "cdc.gov" },
      { name: "American Heart Association", domain: "heart.org" },
      { name: "BlackDoctor.org", domain: "blackdoctor.org" },
      { name: "Mayo Clinic", domain: "mayoclinic.org" },
    ],
  },
  {
    topicName: "Diabetes Prevention & Management",
    category: "health",
    description: "Type 2 diabetes prevention, management, and culturally relevant nutrition for Black and Hispanic/Latino communities facing disproportionate diagnosis rates.",
    keywords: ["Type 2 diabetes prevention Black community", "diabetes management Hispanic", "A1C culturally relevant diet", "diabetes minority health"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "American Diabetes Association", domain: "diabetes.org" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "NIH", domain: "nih.gov" },
      { name: "BlackDoctor.org", domain: "blackdoctor.org" },
    ],
  },
  {
    topicName: "Sickle Cell Disease",
    category: "health",
    description: "Medical breakthroughs, pain management, clinical trial access, and community resources for sickle cell disease — which disproportionately affects people of African descent.",
    keywords: ["sickle cell pain management", "SCD clinical trials Black community", "sickle cell trait testing", "sickle cell disease support"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Sickle Cell Disease Association", domain: "sicklecelldisease.org" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "NIH", domain: "nih.gov" },
    ],
  },
  {
    topicName: "Uterine Fibroids",
    category: "health",
    description: "Treatment comparisons, holistic approaches, and patient stories for uterine fibroids — which affect up to 80–90% of Black women by age 50.",
    keywords: ["fibroids treatment Black women", "non-surgical fibroid options", "uterine health African American", "fibroid symptoms"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Mayo Clinic", domain: "mayoclinic.org" },
      { name: "BlackDoctor.org", domain: "blackdoctor.org" },
      { name: "NIH", domain: "nih.gov" },
    ],
  },
  {
    topicName: "Prostate Cancer Awareness",
    category: "health",
    description: "Screening guidelines, early detection, and survivor stories for prostate cancer — Black men are more than twice as likely to die from it and often diagnosed younger.",
    keywords: ["prostate cancer screening Black men", "early detection prostate cancer African American", "prostate cancer survivor", "urologist advice"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "American Cancer Society", domain: "cancer.org" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "BlackDoctor.org", domain: "blackdoctor.org" },
    ],
  },
  {
    topicName: "Kidney Health & Chronic Kidney Disease",
    category: "health",
    description: "Prevention, screening, and treatment for kidney disease — which disproportionately affects communities of color and is closely connected to diabetes and hypertension.",
    keywords: ["kidney disease Black Americans", "CKD diabetes hypertension", "kidney screening minority health", "Black kidney transplant disparities"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "NIDDK / NIH", domain: "niddk.nih.gov" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "National Kidney Foundation", domain: "kidney.org" },
    ],
  },
  {
    topicName: "Alzheimer's & Dementia",
    category: "health",
    description: "Early signs, caregiver support, and research updates on Alzheimer's and related dementias — Black Americans have higher population-level rates while facing disparities in diagnosis.",
    keywords: ["Alzheimer's Black families", "dementia signs Black adults", "Latino dementia caregiving", "memory loss culturally competent care"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "National Institute on Aging", domain: "nia.nih.gov" },
      { name: "Alzheimer's Association", domain: "alz.org" },
      { name: "CDC", domain: "cdc.gov" },
    ],
  },
  {
    topicName: "Caregiving for Aging Parents",
    category: "health",
    description: "Practical, emotional, and financial resources for family caregivers — multigenerational caregiving is common across many cultures and creates real pressures.",
    keywords: ["caregiving aging parents", "Black family caregiver resources", "Latino caregiver support", "elder care financial planning"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "National Institute on Aging", domain: "nia.nih.gov" },
      { name: "Administration for Community Living", domain: "acl.gov" },
      { name: "AARP", domain: "aarp.org" },
    ],
  },
  {
    topicName: "Men's Preventive Health",
    category: "health",
    description: "Screening timelines, physician Q&As, and prevention resources for men — with a focus on conditions like hypertension, diabetes, and cancers that disproportionately affect minority men.",
    keywords: ["Black men preventive health", "men health screenings by age", "Black men doctor visits", "minority men wellness"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CDC", domain: "cdc.gov" },
      { name: "NIH", domain: "nih.gov" },
      { name: "American Cancer Society", domain: "cancer.org" },
    ],
  },
  {
    topicName: "Sleep Health & Sleep Apnea",
    category: "health",
    description: "Sleep apnea symptoms, testing, and treatment resources — poor sleep affects cardiovascular and mental health, with barriers to diagnosis varying across communities.",
    keywords: ["sleep apnea Black adults", "sleep health minority communities", "snoring sleep apnea", "CPAP alternatives"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "NHLBI / NIH", domain: "nhlbi.nih.gov" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "American Academy of Sleep Medicine", domain: "aasm.org" },
    ],
  },
  {
    topicName: "Fertility & Infertility",
    category: "health",
    description: "Fertility treatment options, insurance coverage, and culturally competent providers — fertility care can be expensive, emotionally difficult, and culturally sensitive.",
    keywords: ["infertility Black women", "fertility treatment minority women", "IVF disparities", "fertility insurance coverage"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "American Society for Reproductive Medicine", domain: "asrm.org" },
      { name: "CDC", domain: "cdc.gov" },
      { name: "American College of OB-GYNs", domain: "acog.org" },
    ],
  },
  {
    topicName: "Perimenopause & Menopause",
    category: "health",
    description: "Symptoms, treatment options, and community conversations about perimenopause and menopause — which can significantly affect quality of life but remain under-discussed.",
    keywords: ["Black women menopause", "perimenopause symptoms", "menopause treatment options", "menopause workplace"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "American College of OB-GYNs", domain: "acog.org" },
      { name: "Office on Women's Health", domain: "womenshealth.gov" },
      { name: "National Institute on Aging", domain: "nia.nih.gov" },
    ],
  },
  {
    topicName: "Clinical Trials & Research Participation",
    category: "health",
    description: "Transparent information about clinical trials for communities historically excluded from medical research — what they are, participant rights, risks, and opportunities.",
    keywords: ["clinical trials Black participants", "minority clinical research", "how clinical trials work", "patient rights clinical trials"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "ClinicalTrials.gov", domain: "clinicaltrials.gov" },
      { name: "NIH", domain: "nih.gov" },
      { name: "FDA", domain: "fda.gov" },
    ],
  },
  {
    topicName: "Natural Hair Care",
    category: "lifestyle",
    description: "Product reviews, styling tutorials, and dermatologist advice for natural hair — a profound cultural identifier that requires specialized knowledge and care.",
    keywords: ["protective styles natural hair", "type 4 hair care", "loc maintenance", "natural hair products"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Essence", domain: "essence.com" },
      { name: "Naturally Curly", domain: "naturallycurly.com" },
      { name: "The Root", domain: "theroot.com" },
    ],
  },
  {
    topicName: "Skincare for Melanated Skin",
    category: "lifestyle",
    description: "Dermatologist-approved skincare guidance for hyperpigmentation, keloids, and other conditions specific to melanated skin tones.",
    keywords: ["hyperpigmentation treatment Black skin", "sunscreen for dark skin", "dermatologist skin of color", "keloid treatment"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "BlackDoctor.org", domain: "blackdoctor.org" },
      { name: "American Academy of Dermatology", domain: "aad.org" },
      { name: "Essence", domain: "essence.com" },
    ],
  },

  // ── FINANCIAL LITERACY & WEALTH BUILDING ───────────────────────────────────

  {
    topicName: "First-Time Homebuying",
    category: "financial",
    description: "Step-by-step guides, mortgage calculator tools, and resources for first-time homebuyers — with a focus on overcoming systemic barriers and accessing down payment programs.",
    keywords: ["first time homebuyer grants minorities", "FHA loans Black buyers", "overcoming redlining", "down payment assistance homebuyer"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "HUD", domain: "hud.gov" },
      { name: "Black Enterprise", domain: "blackenterprise.com" },
    ],
  },
  {
    topicName: "Home Appraisal Bias",
    category: "financial",
    description: "Discriminatory appraisal practices can significantly affect equity and generational wealth. Know your rights, how to challenge a low appraisal, and federal fair-housing protections.",
    keywords: ["racial appraisal bias", "home appraisal discrimination", "challenge home appraisal", "Black homeowner appraisal"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "HUD", domain: "hud.gov" },
      { name: "CFPB", domain: "consumerfinance.gov" },
    ],
  },
  {
    topicName: "Avoiding Financial Scams & Fraud",
    category: "financial",
    description: "Recognize investment scams, romance fraud, business grant scams, and identity theft before money is lost — and how to report and recover.",
    keywords: ["investment scam warning signs", "romance scam", "business grant scam", "identity theft recovery"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "FTC", domain: "ftc.gov" },
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "SEC Investor Education", domain: "investor.gov" },
    ],
  },
  {
    topicName: "Banking & Choosing Financial Institutions",
    category: "financial",
    description: "Understanding checking accounts, overdraft fees, credit unions, minority depository institutions, and banking alternatives — including Black-owned banks.",
    keywords: ["Black owned bank", "minority depository institution", "credit union vs bank", "checking account fees"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "FDIC", domain: "fdic.gov" },
      { name: "NCUA", domain: "ncua.gov" },
      { name: "CFPB", domain: "consumerfinance.gov" },
    ],
  },
  {
    topicName: "Emergency Funds & Financial Resilience",
    category: "financial",
    description: "Savings challenges, calculators, and budgeting strategies for building an emergency fund — many financial emergencies become debt crises without accessible savings.",
    keywords: ["build emergency fund", "emergency savings low income", "unexpected expenses budget", "financial resilience"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "FDIC", domain: "fdic.gov" },
    ],
  },
  {
    topicName: "Business Credit",
    category: "financial",
    description: "Step-by-step guides to building business credit, separating personal and business finances, and improving lending readiness for minority entrepreneurs.",
    keywords: ["build business credit", "business credit score", "separate business personal finances", "business lending readiness"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "SBA", domain: "sba.gov" },
      { name: "FDIC", domain: "fdic.gov" },
      { name: "SCORE", domain: "score.org" },
    ],
  },
  {
    topicName: "Heirs' Property & Generational Land",
    category: "financial",
    description: "How families can lose property without clear title or estate planning — especially relevant to historically Black landownership — and how to protect it.",
    keywords: ["heirs property Black families", "clear inherited property title", "partition sale heirs property", "land retention resources"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "USDA", domain: "usda.gov" },
      { name: "CFPB", domain: "consumerfinance.gov" },
    ],
  },
  {
    topicName: "Sending Money Internationally",
    category: "financial",
    description: "Compare remittance costs, exchange rates, and consumer protections for diaspora families who regularly send money across borders.",
    keywords: ["remittance fees", "send money internationally safely", "money transfer exchange rate", "diaspora remittance"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "World Bank", domain: "worldbank.org" },
    ],
  },

  // ── EDUCATION & CAREER ──────────────────────────────────────────────────────

  {
    topicName: "HBCU Admissions & Scholarships",
    category: "education",
    description: "Scholarship deadlines, campus tour guides, and alumni networking tips for HBCUs — which provide culturally affirming environments and produce disproportionate numbers of Black professionals.",
    keywords: ["HBCU scholarships", "HBCU college tours", "applying to HBCUs", "HBCU admissions guide"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "UNCF", domain: "uncf.org" },
      { name: "Thurgood Marshall College Fund", domain: "tmcf.org" },
      { name: "College Board", domain: "collegeboard.org" },
    ],
  },
  {
    topicName: "FAFSA & Financial Aid Navigation",
    category: "education",
    description: "Deadline alerts, walkthroughs, and financial aid explainers for FAFSA — which provides access to federal grants, work-study, and loans.",
    keywords: ["FAFSA help", "Pell Grant eligibility", "financial aid first generation students", "FAFSA contributor"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Federal Student Aid", domain: "studentaid.gov" },
      { name: "College Board", domain: "collegeboard.org" },
    ],
  },
  {
    topicName: "First-Generation College Students",
    category: "education",
    description: "Application guides, student stories, mentorship, and campus resource explainers for students whose families haven't previously navigated college.",
    keywords: ["first generation college student", "college first gen resources", "minority college success", "first gen college application"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Federal Student Aid", domain: "studentaid.gov" },
      { name: "UNCF", domain: "uncf.org" },
    ],
  },
  {
    topicName: "Trade School Programs & Apprenticeships",
    category: "education",
    description: "Career outlooks, apprenticeship listings, and day-in-the-life videos for skilled trades — high-paying paths without the burden of massive student debt.",
    keywords: ["HVAC apprenticeships minority", "trade school scholarships", "plumbing career paths", "electrician apprenticeship"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CareerOneStop", domain: "careeronestop.org" },
      { name: "Apprenticeship.gov", domain: "apprenticeship.gov" },
    ],
  },
  {
    topicName: "Internships & Early-Career Opportunities",
    category: "employment",
    description: "Paid internship listings, application tips, and alumni videos for minority students — access to internships and networks significantly affects early career mobility.",
    keywords: ["paid internships minority students", "summer internship HBCU", "early career fellowship", "entry level opportunities"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "USAJobs", domain: "usajobs.gov" },
      { name: "CareerOneStop", domain: "careeronestop.org" },
    ],
  },
  {
    topicName: "Navigating Corporate Culture",
    category: "employment",
    description: "Unwritten workplace norms, networking, sponsorship, code-switching pressures, and psychological safety for Black professionals in corporate environments.",
    keywords: ["Black professionals workplace", "sponsorship vs mentorship", "code switching workplace", "career advancement minority professionals"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Harvard Business Review", domain: "hbr.org" },
      { name: "EEOC", domain: "eeoc.gov" },
    ],
  },
  {
    topicName: "Career Sponsorship & Mentorship",
    category: "employment",
    description: "The difference between someone who advises you and someone who actively advocates for your advancement — and how to find both.",
    keywords: ["career sponsor vs mentor", "Black professional mentorship", "executive sponsorship", "career advocacy"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Harvard Business Review", domain: "hbr.org" },
      { name: "SCORE", domain: "score.org" },
    ],
  },
  {
    topicName: "Returning to Work After a Career Break",
    category: "employment",
    description: "Returnship programs, resume help, and coaching for people re-entering the workforce after caregiving, military service, health issues, or layoffs.",
    keywords: ["returnship programs", "resume after career break", "return to workforce parents", "re-entering workforce"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CareerOneStop", domain: "careeronestop.org" },
      { name: "Department of Labor", domain: "dol.gov" },
    ],
  },

  // ── PARENTING & FAMILY ──────────────────────────────────────────────────────

  {
    topicName: "Talking to Kids About Race",
    category: "family",
    description: "Age-appropriate guides, book lists, and child psychologist advice for raising children with cultural pride and helping them navigate a world where identity shapes their experience.",
    keywords: ["talking to children about racism", "affirming Black identity in kids", "raising bilingual children", "positive racial identity"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "PBS", domain: "pbs.org" },
      { name: "American Psychological Association", domain: "apa.org" },
      { name: "EmbraceRace", domain: "embracerace.org" },
    ],
  },
  {
    topicName: "Raising Confident Children of Color",
    category: "family",
    description: "Resources for building positive cultural identity in children — books, activities, and guidance from child psychologists on affirming environments.",
    keywords: ["positive racial identity children", "Black child self esteem", "cultural identity parenting", "raising confident kids"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "American Psychological Association", domain: "apa.org" },
      { name: "EmbraceRace", domain: "embracerace.org" },
      { name: "Smithsonian NMAAHC", domain: "nmaahc.si.edu" },
    ],
  },
  {
    topicName: "Finding Culturally Affirming Schools",
    category: "family",
    description: "Evaluation checklists, advocacy guides, and parent reviews for finding schools that celebrate a child's heritage and lead to better academic and psychological outcomes.",
    keywords: ["diverse school districts", "evaluating school cultural competence", "advocating for Black students", "culturally affirming school"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "GreatSchools", domain: "greatschools.org" },
      { name: "NAACP", domain: "naacp.org" },
      { name: "US Dept of Education", domain: "ed.gov" },
    ],
  },
  {
    topicName: "Bullying, Bias & School Discipline",
    category: "family",
    description: "Helping families distinguish ordinary conflict from discriminatory discipline, and understanding escalation pathways and student civil rights protections.",
    keywords: ["racial bullying school", "school discipline discrimination", "student civil rights complaint", "school discipline bias"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "StopBullying.gov", domain: "stopbullying.gov" },
      { name: "US Dept of Education Office for Civil Rights", domain: "ed.gov" },
    ],
  },
  {
    topicName: "Teen Mental Health & Social Media",
    category: "family",
    description: "Evidence-based guidance for families on teen anxiety, depression, cyberbullying, and healthy technology use — with resources for Black teens and their parents.",
    keywords: ["teen mental health social media", "Black teen mental health", "cyberbullying parents", "teen anxiety resources"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "HHS", domain: "hhs.gov" },
      { name: "American Psychological Association", domain: "apa.org" },
      { name: "American Academy of Pediatrics", domain: "aap.org" },
    ],
  },
  {
    topicName: "Grandparents Raising Grandchildren",
    category: "family",
    description: "Benefit guides, custody explainers, and support resources for grandparents and kinship caregivers raising children — including legal and schooling challenges.",
    keywords: ["grandparents raising grandchildren", "kinship caregiver benefits", "kinship care legal rights", "grandparent custody"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Child Welfare Information Gateway", domain: "childwelfare.gov" },
      { name: "Administration for Community Living", domain: "acl.gov" },
    ],
  },
  {
    topicName: "Bilingual & Multilingual Families",
    category: "family",
    description: "Family activities, school guides, and expert interviews for diaspora families wanting children to maintain heritage languages while succeeding in English-speaking environments.",
    keywords: ["raising bilingual children", "heritage language children", "dual language school", "heritage Spanish"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "US Dept of Education", domain: "ed.gov" },
      { name: "Colorín Colorado", domain: "colorincolorado.org" },
    ],
  },

  // ── LEGAL & RIGHTS ──────────────────────────────────────────────────────────

  {
    topicName: "Know Your Rights — Police Encounters",
    category: "legal",
    description: "Printable rights cards, legal expert videos, and policy updates for understanding rights during law enforcement encounters — a critical safety necessity for many communities.",
    keywords: ["ACLU know your rights police", "traffic stop rights minority", "recording police laws", "police encounter rights"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "ACLU", domain: "aclu.org" },
      { name: "NAACP", domain: "naacp.org" },
      { name: "Legal Aid", domain: "lawhelp.org" },
    ],
  },
  {
    topicName: "Expungement & Record Clearing",
    category: "legal",
    description: "Step-by-step legal guides, free clinic announcements, and success stories for clearing criminal records — essential for equitable access to housing and employment.",
    keywords: ["criminal record expungement process", "second chance employment", "clearing criminal record", "expungement eligibility"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Legal Aid", domain: "lawhelp.org" },
      { name: "State Attorney General sites", domain: "naag.org" },
    ],
  },
  {
    topicName: "Housing Discrimination & Fair Housing",
    category: "legal",
    description: "Rights cards, complaint walkthroughs, and documentation checklists for housing discrimination — federal law prohibits discrimination based on race, color, and national origin.",
    keywords: ["housing discrimination complaint", "racial discrimination apartment", "Fair Housing Act rights", "fair housing complaint"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "HUD", domain: "hud.gov" },
      { name: "DOJ", domain: "justice.gov" },
    ],
  },
  {
    topicName: "Workplace Rights & Discrimination",
    category: "legal",
    description: "EEOC protections, documentation checklists, and complaint-process guides for workplace discrimination and retaliation — including hair discrimination and racial bias.",
    keywords: ["race discrimination at work", "workplace retaliation rights", "hair discrimination workplace", "file EEOC complaint"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "EEOC", domain: "eeoc.gov" },
      { name: "Department of Labor", domain: "dol.gov" },
    ],
  },
  {
    topicName: "Immigration & Naturalization",
    category: "legal",
    description: "Official process guides, legal service locators, and deadline reminders for naturalization, green card renewal, and immigration navigation — prioritizing current official sources.",
    keywords: ["citizenship naturalization process", "green card renewal", "immigration legal aid", "USCIS citizenship class"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "USCIS", domain: "uscis.gov" },
      { name: "DOJ Executive Office for Immigration Review", domain: "justice.gov" },
      { name: "ACLU", domain: "aclu.org" },
    ],
  },
  {
    topicName: "Consumer Rights",
    category: "legal",
    description: "Complaint templates, agency links, and rights explainers for debt collectors, deceptive businesses, warranties, subscriptions, and everyday consumer issues.",
    keywords: ["consumer complaint", "debt collector rights", "subscription cancellation rights", "fraud refund consumer"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "FTC", domain: "ftc.gov" },
    ],
  },
  {
    topicName: "Name Changes & Identity Documents",
    category: "legal",
    description: "State checklists and document timelines for coordinating legal name changes across government records — for marriage, divorce, gender transition, adoption, or personal choice.",
    keywords: ["legal name change documents", "update Social Security name", "passport name change", "gender marker change"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Social Security Administration", domain: "ssa.gov" },
      { name: "State Department", domain: "state.gov" },
    ],
  },
  {
    topicName: "Estate Administration After a Death",
    category: "legal",
    description: "Checklists, court resources, and attorney referrals for navigating probate, property, debt, and beneficiary questions — at an often emotionally difficult time.",
    keywords: ["what to do when parent dies", "probate process", "estate executor checklist", "estate administration"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "IRS", domain: "irs.gov" },
      { name: "Nolo", domain: "nolo.com" },
    ],
  },
  {
    topicName: "Tenant Rights",
    category: "legal",
    description: "Lease basics, security deposit rights, eviction protections, and habitability standards — practical legal knowledge for renters facing discriminatory or negligent landlords.",
    keywords: ["tenant rights eviction", "security deposit laws", "habitability landlord", "renter rights state"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "HUD", domain: "hud.gov" },
      { name: "Legal Aid", domain: "lawhelp.org" },
    ],
  },

  // ── LIFESTYLE, CULTURE & DIASPORA ──────────────────────────────────────────

  {
    topicName: "Genealogy & Family History",
    category: "diaspora",
    description: "Archive tutorials, genealogy workshops, and community stories for reconnecting with migration stories, relatives, and cultural identity through family-history research.",
    keywords: ["African American genealogy", "Caribbean genealogy records", "Freedmen's Bureau records", "family history research Black"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "National Archives", domain: "archives.gov" },
      { name: "Library of Congress", domain: "loc.gov" },
      { name: "Smithsonian", domain: "si.edu" },
    ],
  },
  {
    topicName: "African Diaspora History",
    category: "diaspora",
    description: "Museum collections, documentaries, and historian videos on diaspora history — the connections among Africa, the Caribbean, Latin America, Europe, and the Americas.",
    keywords: ["African diaspora history", "Afro Caribbean history", "Afro Latino history", "Black migration history"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Smithsonian NMAAHC", domain: "nmaahc.si.edu" },
      { name: "UNESCO", domain: "unesco.org" },
      { name: "Library of Congress", domain: "loc.gov" },
    ],
  },
  {
    topicName: "Heritage Language Learning",
    category: "diaspora",
    description: "Lessons, creator videos, and local classes for diaspora community members who want to learn or maintain Haitian Creole, Yoruba, Amharic, Spanish, Twi, or other heritage languages.",
    keywords: ["learn Haitian Creole", "learn Yoruba", "heritage Spanish", "Amharic beginner", "learn Twi"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Peace Corps resources", domain: "peacecorps.gov" },
    ],
  },
  {
    topicName: "Cultural Etiquette & Customs",
    category: "diaspora",
    description: "Short explainers and local voices on cultural norms for travelers and diaspora members — Ghana, Dominican Republic, Ethiopia, Caribbean, and more — without relying on stereotypes.",
    keywords: ["Ghana cultural etiquette", "Dominican customs", "Ethiopian traditions", "Caribbean etiquette"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "US State Department Travel", domain: "travel.state.gov" },
    ],
  },
  {
    topicName: "Festivals & Cultural Celebrations",
    category: "diaspora",
    description: "Event calendars, history explainers, and travel guides for Carnival, Juneteenth, Caribbean festivals, powwows, and other celebrations that connect people to community.",
    keywords: ["Black cultural festivals near me", "Caribbean carnival", "Juneteenth events", "powwow calendar", "Afrobeats festival"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Smithsonian", domain: "si.edu" },
      { name: "National Park Service", domain: "nps.gov" },
    ],
  },
  {
    topicName: "Black & Diaspora Foodways",
    category: "diaspora",
    description: "Recipes, chef videos, history pieces, and restaurant connections celebrating food as migration, family history, and cultural exchange — Gullah Geechee, West African, Caribbean, Afro-Brazilian, and more.",
    keywords: ["Gullah Geechee food history", "Afro Brazilian cuisine", "West African food history", "Caribbean food traditions"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Smithsonian", domain: "si.edu" },
    ],
  },
  {
    topicName: "Cultural Preservation & Oral History",
    category: "diaspora",
    description: "Guides for recording oral histories, preserving family videos, and contributing to community archives before elders and institutions are lost.",
    keywords: ["record oral history family", "preserve Black history", "community archive", "oral history elders"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Library of Congress", domain: "loc.gov" },
      { name: "Smithsonian", domain: "si.edu" },
      { name: "National Archives", domain: "archives.gov" },
    ],
  },

  // ── HOME & LIVING ───────────────────────────────────────────────────────────

  {
    topicName: "HVAC Maintenance & Home Repairs",
    category: "home",
    description: "DIY guides, energy-saving tips, and contractor hiring advice for home maintenance — trusted trade information that prevents predatory pricing.",
    keywords: ["HVAC seasonal maintenance", "energy efficient heating", "troubleshooting AC", "home repair DIY"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "This Old House", domain: "thisoldhouse.com" },
      { name: "Energy.gov", domain: "energy.gov" },
    ],
  },
  {
    topicName: "Contractor Scams & Hiring Tradespeople",
    category: "home",
    description: "Hiring checklists, estimate comparison guides, and scam alerts for homeowners — contractor fraud can cost thousands.",
    keywords: ["contractor scam warning signs", "verify contractor license", "home improvement contract", "hire reliable contractor"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "FTC", domain: "ftc.gov" },
      { name: "State licensing boards", domain: "usa.gov" },
    ],
  },
  {
    topicName: "Homeowners Insurance",
    category: "home",
    description: "Coverage explainers, claim checklists, and calculators for understanding homeowners insurance — including deductibles, exclusions, flood insurance, and disaster risk.",
    keywords: ["homeowners insurance coverage", "insurance claim denied", "flood insurance", "replacement cost insurance"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "NAIC", domain: "naic.org" },
      { name: "FEMA", domain: "fema.gov" },
    ],
  },
  {
    topicName: "Home Maintenance Calendar",
    category: "home",
    description: "Monthly checklists, DIY videos, and local professional referrals for seasonal home maintenance — preventive care reduces expensive emergencies and protects property value.",
    keywords: ["annual home maintenance checklist", "seasonal home maintenance", "home maintenance tips", "property maintenance schedule"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Energy.gov", domain: "energy.gov" },
      { name: "This Old House", domain: "thisoldhouse.com" },
    ],
  },
  {
    topicName: "First Apartment & Renting Guide",
    category: "home",
    description: "Move-in checklists, budget tools, and tenant guides for first-time renters — leases, utilities, deposits, insurance, and documenting property condition.",
    keywords: ["first apartment checklist", "security deposit rights", "renter insurance", "lease basics first apartment"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "HUD", domain: "hud.gov" },
      { name: "CFPB", domain: "consumerfinance.gov" },
    ],
  },

  // ── COMMUNITY & SOCIAL ISSUES ───────────────────────────────────────────────

  {
    topicName: "Gentrification & Community Preservation",
    category: "community",
    description: "Policy explainers, organizing toolkits, and documentary clips on fighting displacement, supporting community land trusts, and advocating for affordable housing.",
    keywords: ["fighting gentrification", "community land trusts", "affordable housing advocacy", "neighborhood displacement"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "NAACP", domain: "naacp.org" },
      { name: "Urban Institute", domain: "urban.org" },
    ],
  },
  {
    topicName: "Historic Black Neighborhoods",
    category: "community",
    description: "Maps, oral histories, and landmark guides on historic Black neighborhoods — documenting and preserving culturally significant communities facing development and displacement.",
    keywords: ["historic Black neighborhoods", "Black neighborhood preservation", "African American historic district", "Greenwood Tulsa"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "National Park Service", domain: "nps.gov" },
      { name: "Smithsonian", domain: "si.edu" },
    ],
  },
  {
    topicName: "Food Access & Grocery Equity",
    category: "community",
    description: "Food maps, SNAP benefit information, and local resources addressing food deserts — access to affordable, nutritious food varies dramatically by neighborhood.",
    keywords: ["food access Black neighborhoods", "food desert grocery access", "farmers market SNAP", "food equity"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "USDA", domain: "usda.gov" },
      { name: "CDC", domain: "cdc.gov" },
    ],
  },
  {
    topicName: "Environmental Justice",
    category: "community",
    description: "Local data, explainers, and community organizing resources on pollution, heat exposure, and industrial siting that disproportionately affect historically marginalized neighborhoods.",
    keywords: ["environmental justice neighborhood", "air pollution minority communities", "lead exposure community", "environmental racism"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "EPA", domain: "epa.gov" },
      { name: "CDC", domain: "cdc.gov" },
    ],
  },
  {
    topicName: "Community Development & Land Ownership",
    category: "community",
    description: "Case studies, financing explainers, and toolkit videos on community land trusts, cooperatives, and neighborhood investment models that help communities retain assets.",
    keywords: ["community land trust", "community ownership development", "anti displacement strategies", "community cooperative"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "HUD", domain: "hud.gov" },
      { name: "Urban Institute", domain: "urban.org" },
    ],
  },
  {
    topicName: "Local Government & Civic Power",
    category: "community",
    description: "Civic explainers, meeting calendars, and official-contact tools for understanding who controls zoning, schools, policing, transit, and property taxes at the local level.",
    keywords: ["city council responsibilities", "school board powers", "county commissioner role", "local government meeting"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "USA.gov", domain: "usa.gov" },
    ],
  },
  {
    topicName: "Substance Abuse Recovery",
    category: "recovery",
    description: "Meeting locators, inspirational stories, and mental health resources for addiction recovery — with an emphasis on culturally competent treatment over criminalization.",
    keywords: ["substance abuse recovery minority", "culturally competent addiction treatment", "sober living communities", "recovery Black community"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "SAMHSA", domain: "samhsa.gov" },
      { name: "Narcotics Anonymous", domain: "na.org" },
    ],
  },

  // ── RECOVERY, SUPPORT & LIFE TRANSITIONS ───────────────────────────────────

  {
    topicName: "Grief & Bereavement",
    category: "recovery",
    description: "Support groups, therapist interviews, and coping resources for grief — with a focus on culturally responsive support that may be difficult to locate.",
    keywords: ["Black grief support", "bereavement resources", "grieving parent", "culturally competent grief counselor"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "American Psychological Association", domain: "apa.org" },
      { name: "SAMHSA", domain: "samhsa.gov" },
    ],
  },
  {
    topicName: "Reentry After Incarceration",
    category: "recovery",
    description: "Local directories, job resources, legal clinics, and personal stories for reentry — employment, housing, identification, benefits, record clearing, and family reunification.",
    keywords: ["reentry resources after prison", "second chance jobs", "housing after incarceration", "restore ID after release"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "DOJ", domain: "justice.gov" },
      { name: "Department of Labor", domain: "dol.gov" },
      { name: "Legal Aid", domain: "lawhelp.org" },
    ],
  },
  {
    topicName: "Domestic Violence Resources",
    category: "recovery",
    description: "Discreet, trustworthy pathways to emergency housing, safety planning, and advocacy for users experiencing domestic violence — including financial abuse.",
    keywords: ["domestic violence safety plan", "emergency shelter domestic violence", "financial abuse resources", "DV hotline"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "National DV Hotline", domain: "thehotline.org" },
      { name: "Office on Violence Against Women", domain: "justice.gov" },
    ],
  },
  {
    topicName: "Life After Divorce & Separation",
    category: "recovery",
    description: "Financial checklists, support groups, and parenting resources for navigating the simultaneous impact of separation on housing, finances, mental health, and co-parenting.",
    keywords: ["financial recovery divorce", "co parenting after separation", "divorce support group", "life after divorce"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CFPB", domain: "consumerfinance.gov" },
      { name: "American Psychological Association", domain: "apa.org" },
    ],
  },

  // ── TRAVEL, RELOCATION & PLACE INTELLIGENCE ─────────────────────────────────

  {
    topicName: "Travel Safety for People of Color",
    category: "travel",
    description: "Destination-specific safety guides, local laws, and community networks for Black and minority travelers — practical information beyond generic tourism advice.",
    keywords: ["Black traveler safety city", "LGBTQ travel laws destination", "minority travel safety", "travel while Black tips"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "US State Department", domain: "travel.state.gov" },
      { name: "Black Travel Alliance", domain: "blacktravelalliance.com" },
    ],
  },
  {
    topicName: "Moving to a New City",
    category: "relocation",
    description: "City guides, neighborhood comparisons, and resident videos on schools, culture, healthcare, community, transportation, and belonging — relocation is about more than housing.",
    keywords: ["moving to Atlanta Black families", "best neighborhoods cultural community", "relocation minority professionals", "city comparison Black families"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Census Bureau", domain: "census.gov" },
      { name: "HUD", domain: "hud.gov" },
    ],
  },
  {
    topicName: "Finding Community After Moving",
    category: "relocation",
    description: "Group recommendations, community events, and local ambassador connections for people who feel isolated after relocating and have lost established cultural networks.",
    keywords: ["Black professional groups city", "Caribbean community city", "HBCU alumni chapter city", "find Black community after moving"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "Mapping With Melanin", domain: "mappingwithmelanin.com" },
    ],
  },
  {
    topicName: "Heritage & Diaspora Travel",
    category: "travel",
    description: "Heritage itineraries, historian videos, and museum connections for travelers wanting experiences that connect them to ancestry, historic migration, and cultural heritage.",
    keywords: ["African diaspora heritage travel", "Black heritage trail", "Gullah Geechee travel", "Afro Brazilian heritage travel"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "UNESCO", domain: "unesco.org" },
      { name: "Smithsonian", domain: "si.edu" },
      { name: "National Park Service", domain: "nps.gov" },
    ],
  },
  {
    topicName: "Travel Mood & Experience Planning",
    category: "travel",
    description: "Kinfolk itineraries, destination collections, and business matches for planning by mood — relaxing, romantic, adventurous, culturally immersive, nightlife, family, and more.",
    keywords: ["romantic Black owned weekend", "relaxing culturally rich vacation", "adventure travel Black travelers", "mood based travel"],
    notificationPriority: "digest",
    trustedSources: [
      { name: "Mapping With Melanin", domain: "mappingwithmelanin.com" },
      { name: "Travel Noire", domain: "travelnoire.com" },
    ],
  },

  // ── DIGITAL LIFE, TECHNOLOGY & AI (NEW CATEGORY) ────────────────────────────

  {
    topicName: "AI Literacy",
    category: "digital",
    description: "Tutorials and explainers for understanding how AI works, fact-checking AI outputs, and using generative AI tools at work — AI increasingly affects employment, education, and media.",
    keywords: ["AI literacy beginners", "generative AI fact checking", "AI workplace tools", "ChatGPT how it works"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "NIST", domain: "nist.gov" },
      { name: "FTC", domain: "ftc.gov" },
    ],
  },
  {
    topicName: "Online Privacy & Identity Protection",
    category: "digital",
    description: "Privacy checkups, security guides, and alerts for protecting personal information, location data, photos, and financial data from fraud and unwanted surveillance.",
    keywords: ["protect personal information online", "identity theft prevention", "location privacy phone", "data breach response"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "FTC", domain: "ftc.gov" },
      { name: "CISA", domain: "cisa.gov" },
    ],
  },
  {
    topicName: "Deepfakes & AI Misinformation",
    category: "digital",
    description: "Scam warnings and verification tutorials for AI-generated audio/video that can impersonate family members, public figures, or businesses to facilitate fraud.",
    keywords: ["deepfake scam", "AI voice scam", "verify viral video", "AI misinformation"],
    notificationPriority: "breaking",
    trustedSources: [
      { name: "FTC", domain: "ftc.gov" },
      { name: "CISA", domain: "cisa.gov" },
    ],
  },
  {
    topicName: "Cybersecurity for Small Businesses",
    category: "digital",
    description: "Security checklists, owner training, and incident guides for minority-owned businesses that hold customer, payment, and employee data but lack dedicated security teams.",
    keywords: ["small business cybersecurity", "phishing business", "ransomware prevention small business", "data security small business"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "CISA", domain: "cisa.gov" },
      { name: "FTC", domain: "ftc.gov" },
      { name: "SBA", domain: "sba.gov" },
    ],
  },
  {
    topicName: "Digital Skills for Elders",
    category: "digital",
    description: "Simple tutorials, scam alerts, and family teaching guides for older relatives — helping them benefit from technology while protecting them from fraud and confusing systems.",
    keywords: ["online safety seniors", "smartphone basics older adults", "elder financial scam", "technology seniors"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "FTC", domain: "ftc.gov" },
      { name: "AARP", domain: "aarp.org" },
      { name: "CISA", domain: "cisa.gov" },
    ],
  },

  // ── ENTERTAINMENT & CULTURE ─────────────────────────────────────────────────

  {
    topicName: "Music Releases & Award Shows",
    category: "entertainment",
    description: "Album reviews, red carpet galleries, and artist interviews keeping the community connected to Hip Hop, Afrobeats, R&B, gospel, and global Black music culture.",
    keywords: ["new Hip Hop releases", "Afrobeats trending", "BET awards highlights", "R&B new music"],
    notificationPriority: "standard",
    trustedSources: [
      { name: "BET", domain: "bet.com" },
      { name: "Blavity", domain: "blavity.com" },
      { name: "The Root", domain: "theroot.com" },
    ],
  },
];
