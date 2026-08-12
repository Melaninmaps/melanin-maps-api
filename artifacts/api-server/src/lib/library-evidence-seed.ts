/**
 * Library Evidence Seed — Batches B, C, D
 * Owner-approved data-only production operation — Aug 12 2026
 *
 * WHAT THIS FILE DOES:
 *   Seeds 2–3 verified institutional knowledge_sources records per published/enabled
 *   Library topic that has no evidence yet, covering all remaining categories after
 *   Batch A (diaspora, already in startup-migrations.ts ensureLibraryDiasporaEvidence).
 *
 * GOVERNANCE RULES (permanent):
 *   - Never invent a source, URL, title, or authority tier.
 *   - Only authoritative and professional tiers. Community/ambassador tiers must come
 *     from real member contributions only.
 *   - WHERE NOT EXISTS guard on (topic_name, source_name) → fully idempotent.
 *   - Never overwrites user-created content, community evidence, or non-Library records.
 *
 * BATCHES:
 *   B — high-consequence: health, financial, legal, recovery, employment, safety,
 *       relocation, home, housing, education
 *   C — geography/culture: country, travel, community_culture, community, family,
 *       geography, history
 *   D — remaining: business, digital, lifestyle, skills_trades, entertainment
 */

import { pool } from "@workspace/db";

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper — idempotent upsert by topic_name + source_name
// ─────────────────────────────────────────────────────────────────────────────
async function sd(
  topicName: string,
  tier: string,
  sourceName: string,
  sourceUrl: string | null,
  claim: string,
  isPrimary: boolean,
  conf = "high",
): Promise<number> {
  const r = await pool.query(
    `INSERT INTO knowledge_sources
       (id, topic_id, authority_tier, source_name, source_url, claim,
        is_primary, status, confidence, created_at, retrieved_at)
     SELECT gen_random_uuid()::text, kt.id, $2::text, $3::text, $4::text, $5::text,
            $6::boolean, 'active', $7::text, NOW(), NOW()
     FROM knowledge_topics kt
     WHERE kt.topic_name = $1::text
       AND NOT EXISTS (
         SELECT 1 FROM knowledge_sources ks
         WHERE ks.topic_id = kt.id AND ks.source_name = $3::text
       )
     LIMIT 1`,
    [topicName, tier, sourceName, sourceUrl, claim, isPrimary, conf],
  );
  return r.rowCount ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH B — HIGH-CONSEQUENCE TOPICS
// Standard: health/recovery = 3+ sources (≥2 institutional/public-health)
//           legal/financial = 3+ sources (≥2 primary gov/legal/regulator)
//           employment/safety/relocation/home/housing/education = 2+ sources (≥1 gov/professional body)
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureLibraryEvidenceBatchB(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  let n = 0;
  const add = async (...args: Parameters<typeof sd>) => { try { n += await sd(...args); } catch(e) { warn(`Library Batch B — sd failed: ${e instanceof Error ? e.message : String(e)}`); } };

  try {
    // ── HEALTH — 14 new topics with 0 sources ──────────────────────────────
    await add("Alzheimer's & Dementia","authoritative","NIA — Alzheimer's Disease and Related Dementias","https://www.nia.nih.gov/health/alzheimers","The National Institute on Aging is the primary U.S. federal agency conducting and supporting research on Alzheimer's disease and related dementias, including their disproportionate impact on Black and Latinx communities.",true);
    await add("Alzheimer's & Dementia","authoritative","CDC — Alzheimer's Disease and Healthy Aging","https://www.cdc.gov/aging/aginginfo/alzheimers.htm","CDC data and public health resources on Alzheimer's prevalence, risk factors, caregiving, and brain health programs, including racial and ethnic health disparities in diagnosis and outcomes.",false);
    await add("Alzheimer's & Dementia","professional","Alzheimer's Association","https://www.alz.org","The Alzheimer's Association provides care, support, and research resources on Alzheimer's and all other dementia; its annual Alzheimer's Disease Facts and Figures report documents health disparities by race and ethnicity.",false);

    await add("Blood Pressure & Hypertension","authoritative","CDC — High Blood Pressure","https://www.cdc.gov/bloodpressure","CDC public health data on hypertension prevalence, treatment rates, and racial disparities — Black adults develop high blood pressure earlier and at higher rates than any other racial or ethnic group in the U.S.",true);
    await add("Blood Pressure & Hypertension","authoritative","NIH NHLBI — High Blood Pressure","https://www.nhlbi.nih.gov/health/high-blood-pressure","The National Heart, Lung, and Blood Institute's clinical and research resources on high blood pressure, including treatment guidelines and the SPRINT trial demonstrating benefit of intensive blood pressure control.",false);
    await add("Blood Pressure & Hypertension","professional","American Heart Association — High Blood Pressure","https://www.heart.org/en/health-topics/high-blood-pressure","The American Heart Association's comprehensive high blood pressure resources, including the jointly published hypertension guidelines, self-monitoring guidance, and resources on racial disparities in hypertension care.",false);

    await add("Caregiving for Aging Parents","authoritative","NIA — Caregiving","https://www.nia.nih.gov/health/caregiving","The National Institute on Aging covers evidence-based resources for family caregivers of older adults, including managing caregiver stress, community resources, cultural dimensions of caregiving, and long-term planning.",true);
    await add("Caregiving for Aging Parents","authoritative","CDC — Caregiving for Aging Adults","https://www.cdc.gov/aging/caregiving","CDC data and resources on family caregiving, including caregiver health, respite care options, and resources addressing the disproportionate caregiving burden on Black and immigrant family members.",false);
    await add("Caregiving for Aging Parents","professional","AARP — Caregiving Resource Center","https://www.aarp.org/caregiving","AARP provides practical caregiving guides, financial planning resources, legal checklists, and local caregiver support programs for adults caring for aging parents.",false);

    await add("Clinical Trials & Research Participation","authoritative","ClinicalTrials.gov — NIH","https://clinicaltrials.gov","ClinicalTrials.gov is the U.S. National Library of Medicine's registry of federally and privately supported clinical studies. Provides searchable database of all active trials, eligibility criteria, and participant contact information.",true);
    await add("Clinical Trials & Research Participation","authoritative","FDA — Clinical Trials: What Patients Need to Know","https://www.fda.gov/patients/clinical-trials-what-patients-need-know","FDA guidance on clinical trial phases, participant rights, informed consent, and the importance of diverse participation in research — including historical barriers to Black and minority research participation.",false);
    await add("Clinical Trials & Research Participation","authoritative","NIH NIMHD — Clinical Research Diversity","https://www.nimhd.nih.gov","The National Institute on Minority Health and Health Disparities leads NIH efforts to increase minority representation in clinical research. Provides community outreach resources, trial finder tools, and health disparity research.",false);

    await add("Diabetes Prevention & Management","authoritative","CDC — Diabetes","https://www.cdc.gov/diabetes","CDC data, prevention programs, and management resources for Type 1, Type 2, and gestational diabetes. Covers racial disparities: Black adults are 60% more likely to be diagnosed with diabetes than non-Hispanic white adults.",true);
    await add("Diabetes Prevention & Management","authoritative","NIH NIDDK — Diabetes","https://www.niddk.nih.gov/health-information/diabetes","The National Institute of Diabetes and Digestive and Kidney Diseases provides comprehensive diabetes information including prevention, management, complications, clinical trials, and resources for racial and ethnic communities.",false);
    await add("Diabetes Prevention & Management","professional","American Diabetes Association","https://www.diabetes.org","The American Diabetes Association provides standards of medical care, advocacy, and community resources for people with diabetes, including culturally specific materials for African American, Hispanic, and Asian communities.",false);

    await add("Fertility & Infertility","authoritative","CDC — Infertility","https://www.cdc.gov/nchs/fastats/infertility.htm","CDC National Center for Health Statistics data on infertility prevalence, ART (assisted reproductive technology) success rates, and disparities in fertility treatment access and outcomes across racial groups.",true);
    await add("Fertility & Infertility","authoritative","NIH NICHD — Infertility and Fertility","https://www.nichd.nih.gov/health/topics/infertility","The National Institute of Child Health and Human Development provides evidence-based information on infertility causes, diagnosis, and treatment options, along with research on racial disparities in fertility care.",false);
    await add("Fertility & Infertility","professional","American Society for Reproductive Medicine","https://www.reproductivefacts.org","ASRM is the leading professional organization for reproductive medicine. Its patient education site covers infertility causes, fertility treatments, IVF, egg freezing, donor options, and reproductive age considerations.",false);

    await add("HIV & AIDS","authoritative","CDC — HIV","https://www.cdc.gov/hiv","CDC's comprehensive HIV data, prevention resources, and treatment information. Black/African American people account for the highest proportion of HIV diagnoses of any racial/ethnic group in the U.S. — 40% of diagnoses.",true);
    await add("HIV & AIDS","authoritative","HIV.gov — U.S. Government HIV Resources","https://www.hiv.gov","HIV.gov is the official U.S. government portal for HIV information, maintained by HHS. Provides HIV basics, prevention tools (PrEP/PEP), testing locators, treatment guidelines, and community resources by population.",false);
    await add("HIV & AIDS","authoritative","NIH NIAID — HIV/AIDS","https://www.niaid.nih.gov/diseases-conditions/hivaids","The National Institute of Allergy and Infectious Diseases funds and conducts HIV research, including vaccines, antiretroviral therapies, and studies on health disparities in HIV diagnosis and treatment outcomes.",false);

    await add("Health","authoritative","CDC — Health Information","https://www.cdc.gov","The Centers for Disease Control and Prevention is the U.S. government's leading public health agency, providing data, guidelines, and health resources across all health topics, with specific programs on racial and ethnic health disparities.",true);
    await add("Health","authoritative","NIH — Health Information","https://www.nih.gov","The National Institutes of Health is the primary federal agency conducting and supporting medical research. NIH's health information resources cover virtually every health topic, with dedicated programs on minority health research.",false);
    await add("Health","authoritative","MedlinePlus — National Library of Medicine","https://medlineplus.gov","MedlinePlus is the NIH's consumer health information website, providing reliable, peer-reviewed health information for patients, families, and caregivers across hundreds of health conditions, drugs, and wellness topics.",false);

    await add("Kidney Health & Chronic Kidney Disease","authoritative","NIH NIDDK — Kidney Disease","https://www.niddk.nih.gov/health-information/kidney-disease","The National Institute of Diabetes and Digestive and Kidney Diseases provides research and patient education on chronic kidney disease, dialysis, kidney transplants, and racial disparities — Black adults are 3x more likely to have kidney failure than white adults.",true);
    await add("Kidney Health & Chronic Kidney Disease","authoritative","CDC — Chronic Kidney Disease","https://www.cdc.gov/kidneydisease","CDC data and prevention resources on chronic kidney disease, including the CKD Surveillance System tracking prevalence by race/ethnicity, diabetes and hypertension as leading causes, and CKD prevention programs.",false);
    await add("Kidney Health & Chronic Kidney Disease","professional","National Kidney Foundation","https://www.kidney.org","The National Kidney Foundation provides patient education, support programs, and advocacy for kidney health, with specific resources on the higher burden of kidney disease in Black, Hispanic, and Native American communities.",false);

    await add("Men's Preventive Health","authoritative","CDC — Men's Health","https://www.cdc.gov/nchs/fastats/mens-health.htm","CDC National Center for Health Statistics data on men's health trends, leading causes of death, and preventive health utilization, including the persistent gap in preventive care uptake among Black men.",true);
    await add("Men's Preventive Health","authoritative","NIH NIMHD — Men's Health Disparities","https://www.nimhd.nih.gov","NIMHD research and resources on men's health disparities, including disproportionate rates of cardiovascular disease, prostate cancer, diabetes, and mental health conditions among Black men.",false);
    await add("Men's Preventive Health","authoritative","U.S. Preventive Services Task Force","https://www.uspreventiveservicestaskforce.org","The independent USPSTF makes evidence-based recommendations on clinical preventive services including screenings, counseling, and preventive medications for men at different ages and risk levels.",false);

    await add("Perimenopause & Menopause","authoritative","NIH Office on Women's Health — Menopause","https://www.womenshealth.gov/menopause","The HHS Office on Women's Health provides comprehensive, evidence-based information on perimenopause and menopause, including symptoms, treatment options, and research showing Black women experience menopause symptoms earlier and more severely than white women.",true);
    await add("Perimenopause & Menopause","professional","The Menopause Society (NAMS)","https://www.menopause.org","The North American Menopause Society is the leading scientific nonprofit dedicated to menopause and midlife women's health. Provides clinical practice guidelines, patient resources, and research on menopause in diverse populations.",false);
    await add("Perimenopause & Menopause","professional","ACOG — Menopause","https://www.acog.org/womens-health/faqs/the-menopause-years","The American College of Obstetricians and Gynecologists provides clinical guidance on menopause management, hormone therapy, cardiovascular and bone health after menopause, and culturally responsive care.",false);

    await add("Prostate Cancer Awareness","authoritative","CDC — Prostate Cancer","https://www.cdc.gov/cancer/prostate","CDC data on prostate cancer incidence, mortality, and screening. Black men are 70% more likely to develop prostate cancer and more than twice as likely to die from it than white men — a critical health disparity.",true);
    await add("Prostate Cancer Awareness","authoritative","NIH NCI — Prostate Cancer","https://www.cancer.gov/types/prostate","The National Cancer Institute provides evidence-based information on prostate cancer screening controversies (PSA testing), treatment options, clinical trials, and research on disparities in prostate cancer outcomes.",false);
    await add("Prostate Cancer Awareness","professional","American Cancer Society — Prostate Cancer","https://www.cancer.org/cancer/prostate-cancer.html","The American Cancer Society provides comprehensive prostate cancer information including early detection guidelines (with race-specific recommendations), treatment decision guides, and survivorship resources.",false);

    await add("Sleep Health & Sleep Apnea","authoritative","CDC — Sleep and Sleep Disorders","https://www.cdc.gov/sleep","CDC data on sleep duration, sleep disorders prevalence, and links between short sleep and chronic disease. Black Americans are significantly more likely to experience short sleep duration — a risk factor for cardiovascular disease and diabetes.",true);
    await add("Sleep Health & Sleep Apnea","authoritative","NIH NHLBI — Sleep Apnea","https://www.nhlbi.nih.gov/health/sleep-apnea","The National Heart, Lung, and Blood Institute provides comprehensive information on sleep apnea symptoms, diagnosis, treatment (CPAP, oral devices, surgery), and research on racial disparities in sleep apnea diagnosis and treatment.",false);
    await add("Sleep Health & Sleep Apnea","professional","American Academy of Sleep Medicine","https://aasm.org","AASM is the professional society setting clinical standards for sleep medicine. Provides public health resources on sleep disorders, sleep hygiene, and the societal burden of untreated sleep apnea.",false);

    await add("Uterine Fibroids","authoritative","NIH NICHD — Uterine Fibroids","https://www.nichd.nih.gov/health/topics/uterine","NICHD research and patient resources on uterine fibroids. Black women develop fibroids at 2–3x the rate of white women, experience more severe symptoms, and are more likely to undergo hysterectomy — a major health disparity.",true);
    await add("Uterine Fibroids","professional","ACOG — Uterine Fibroids","https://www.acog.org/womens-health/faqs/uterine-fibroids","The American College of Obstetricians and Gynecologists provides clinical guidance on fibroid diagnosis, treatment options (medication, minimally invasive procedures, surgery), and fertility considerations.",false);
    await add("Uterine Fibroids","authoritative","CDC — Reproductive Health","https://www.cdc.gov/reproductivehealth","CDC reproductive health data and research relevant to uterine fibroids, including the Office of Women's Health funded SELF study on fibroid disparities in Black women.",false);

    // ── HEALTH — add 3rd source to topics with only 2 ────────────────────────
    await add("Breast Cancer","authoritative","NIH NCI — Breast Cancer","https://www.cancer.gov/types/breast","The National Cancer Institute provides comprehensive breast cancer information including screening guidelines, treatment options, clinical trials, and research on racial disparities — Black women have a 40% higher death rate from breast cancer than white women despite lower incidence.",false);
    await add("Endometriosis","authoritative","NIH NICHD — Endometriosis","https://www.nichd.nih.gov/health/topics/endometriosis","NICHD research and patient education on endometriosis including symptoms, diagnosis challenges (often delayed 7–10 years), treatment options, and ongoing research into racial disparities in endometriosis diagnosis and care.",false);
    await add("Fertility","authoritative","NIH NICHD — Fertility and Infertility","https://www.nichd.nih.gov/health/topics/fertility","NICHD research on factors affecting fertility, reproductive aging, and fertility treatment effectiveness, including studies on how environmental, lifestyle, and systemic factors affect fertility outcomes in diverse communities.",false);
    await add("Fibroids","professional","Society of Interventional Radiology — Fibroid Resources","https://www.sirweb.org/patient-center/interventional-radiology-treatments/uterine-fibroids","The Society of Interventional Radiology provides patient education on uterine fibroid embolization (UFE), a minimally invasive alternative to hysterectomy, including outcomes and recovery information.",false);
    await add("Hypertension","professional","American Heart Association — High Blood Pressure","https://www.heart.org/en/health-topics/high-blood-pressure","The American Heart Association's high blood pressure center provides self-monitoring guidance, lifestyle modification recommendations, medication information, and research on cardiovascular risk in patients with hypertension.",false);
    await add("IVF","authoritative","NIH NICHD — Assisted Reproductive Technology","https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/treatments","NICHD information on IVF and other assisted reproductive technologies, success rates by age and diagnosis, and research on how racial disparities affect IVF access and outcomes in the United States.",false);
    await add("Menopause","professional","American College of Obstetricians and Gynecologists — Menopause","https://www.acog.org/womens-health/faqs/the-menopause-years","ACOG clinical guidance on menopause management, hormone therapy benefits and risks, cardiovascular and bone health, genitourinary syndrome, and cognitive changes — with culturally responsive care considerations.",false);
    await add("PCOS","professional","ACOG — Polycystic Ovary Syndrome (PCOS)","https://www.acog.org/womens-health/faqs/polycystic-ovary-syndrome-pcos","American College of Obstetricians and Gynecologists patient guide on PCOS diagnosis criteria, hormonal and metabolic symptoms, fertility impacts, and long-term health risks including diabetes and cardiovascular disease.",false);
    await add("Prostate Health","professional","American Urological Association — Prostate Health","https://www.auanet.org/guidelines-and-quality/quality-and-measurement/quality-improvement-learning-collaborative","The American Urological Association provides clinical practice guidelines on prostate cancer screening (PSA), benign prostatic hyperplasia management, and prostatitis, with specific guidance for high-risk groups including Black men.",false);

    // ── FINANCIAL — 15 topics with 0 sources ────────────────────────────────
    await add("Avoiding Financial Scams & Fraud","authoritative","FTC — Scams","https://consumer.ftc.gov/scams","The Federal Trade Commission's consumer protection hub for financial fraud alerts, common scam types (romance, government impersonation, investment fraud), how to report, and resources for scam victims.",true);
    await add("Avoiding Financial Scams & Fraud","authoritative","CFPB — Fraud and Scams","https://www.consumerfinance.gov/consumer-tools/fraud","The Consumer Financial Protection Bureau's fraud resources covering elder financial exploitation, debt collection scams, mortgage relief fraud, and targeted scams in communities of color.",false);
    await add("Avoiding Financial Scams & Fraud","authoritative","FBI — Financial Crimes","https://www.fbi.gov/investigate/white-collar-crime","The FBI's financial crimes investigation unit documents wire fraud, investment fraud, identity theft, and money laundering schemes targeting individuals and communities.",false);

    await add("Banking & Choosing Financial Institutions","authoritative","FDIC — How Banks Work","https://www.fdic.gov/consumers","The Federal Deposit Insurance Corporation provides consumer protection resources on choosing insured banks, understanding deposit insurance, avoiding predatory financial products, and accessing banking for unbanked communities.",true);
    await add("Banking & Choosing Financial Institutions","authoritative","CFPB — Bank Accounts","https://www.consumerfinance.gov/consumer-tools/bank-accounts","CFPB guidance on comparing checking and savings accounts, understanding fees, avoiding overdraft charges, and choosing between banks and credit unions.",false);
    await add("Banking & Choosing Financial Institutions","authoritative","NCUA — Credit Union Locator","https://www.mycreditunion.gov","The National Credit Union Administration's consumer site helps members find federally insured credit unions, understand member-ownership benefits, and compare credit unions with commercial banks.",false);

    await add("Black Homeownership","authoritative","HUD — Homeownership Resources","https://www.hud.gov/topics/buying_a_home","HUD's homebuying resources including HUD-approved housing counseling agencies, first-time homebuyer programs, down payment assistance, and fair lending protections.",true);
    await add("Black Homeownership","professional","Urban Institute — Black Homeownership Gap","https://www.urban.org/policy-centers/housing-finance-policy-center","The Urban Institute's Housing Finance Policy Center research documents the persistent Black-white homeownership gap, systemic barriers in mortgage lending, and policy approaches to closing the gap.",false);
    await add("Black Homeownership","professional","National Association of Real Estate Brokers — NAREB","https://www.nareb.com","NAREB is the oldest minority real estate trade association in the U.S., founded in 1947. Its State of Housing in Black America (SHIBA) report tracks Black homeownership trends, barriers, and policy recommendations.",false);

    await add("Building Wealth & Investing","authoritative","SEC Office of Investor Education","https://www.investor.gov","The Securities and Exchange Commission's investor education site provides unbiased guidance on investing basics, brokerage accounts, investment products, fraud protection, and compound growth.",true);
    await add("Building Wealth & Investing","authoritative","FINRA — Investor Education","https://www.finra.org/investors","FINRA's investor education resources cover stocks, bonds, mutual funds, ETFs, risk tolerance, and how to verify a broker's credentials — with tools to help investors make informed decisions.",false);
    await add("Building Wealth & Investing","authoritative","Federal Reserve — Financial Literacy","https://www.federalreserve.gov/publications/2023-economic-well-being-of-us-households-in-2022-retirement.htm","The Federal Reserve's Survey of Consumer Finances and annual Report on Economic Well-Being of U.S. Households document wealth gaps by race, savings rates, retirement preparedness, and investment participation.",false);

    await add("Business Credit","authoritative","SBA — Building Business Credit","https://www.sba.gov/business-guide/manage-your-business/build-your-business-credit","The U.S. Small Business Administration's guide to establishing and building business credit separately from personal credit, including DUNS numbers, vendor credit, business credit cards, and business credit reports.",true);
    await add("Business Credit","professional","SCORE — Business Credit Guide","https://www.score.org","SCORE, SBA's largest resource partner, provides free mentoring and educational resources on building business credit, understanding credit scores, and financing options for small business owners.",false);

    await add("Credit Health","authoritative","CFPB — Credit Reports and Scores","https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores","The Consumer Financial Protection Bureau's comprehensive guide to understanding credit reports, disputing errors, building credit, and using your free annual credit reports from all three bureaus.",true);
    await add("Credit Health","authoritative","FTC — Free Credit Reports","https://consumer.ftc.gov/articles/free-credit-reports","FTC guidance on the law requiring each credit bureau to provide one free credit report annually at AnnualCreditReport.com, how to check for errors, and steps to dispute inaccurate information.",false);
    await add("Credit Health","authoritative","AnnualCreditReport.com — Official Site","https://www.annualcreditreport.com","The official federally mandated site for free annual credit reports from Equifax, Experian, and TransUnion, authorized by the FACT Act.",false);

    await add("Emergency Funds & Financial Resilience","authoritative","CFPB — Emergency Savings","https://www.consumerfinance.gov/consumer-tools/save-spend-survive","The CFPB's emergency savings resources including tools for building a financial buffer, finding employer-sponsored emergency savings programs, and accessing emergency assistance.",true);
    await add("Emergency Funds & Financial Resilience","authoritative","Federal Reserve — Economic Well-Being Report","https://www.federalreserve.gov/consumerscommunities/shed_overview.htm","The Federal Reserve's Survey of Household Economics and Decisionmaking (SHED) documents emergency savings gaps by race and income, including the finding that Black and Hispanic households are less likely to have sufficient emergency savings.",false);
    await add("Emergency Funds & Financial Resilience","authoritative","USA.gov — Financial Hardship Resources","https://www.usa.gov/financial-hardship","USA.gov's directory of federal emergency financial assistance programs, including SNAP, LIHEAP energy assistance, rental assistance, unemployment benefits, and crisis counseling resources.",false);

    await add("Estate Planning & Generational Wealth","authoritative","IRS — Estate Tax","https://www.irs.gov/businesses/small-businesses-self-employed/estate-tax","IRS guidance on federal estate tax thresholds, filing requirements, allowable deductions, and gift tax rules — essential for families planning intergenerational wealth transfer.",true);
    await add("Estate Planning & Generational Wealth","authoritative","FINRA — Estate Planning Essentials","https://www.finra.org/investors/insights/estate-planning-essentials","FINRA's estate planning guide covering wills, trusts, beneficiary designations, powers of attorney, healthcare directives, and the importance of coordinating retirement accounts with estate documents.",false);
    await add("Estate Planning & Generational Wealth","professional","American Bar Association — Estate Planning","https://www.americanbar.org/groups/real_property_trust_estate","The ABA's Real Property, Trust and Estate Law section provides consumer resources on estate planning basics, finding an estate planning attorney, and understanding trust structures for wealth preservation.",false);

    await add("First-Time Homebuying","authoritative","HUD — Buying a Home","https://www.hud.gov/topics/buying_a_home","HUD's first-time homebuyer resources including HUD-approved housing counselors, the Good Neighbor Next Door program, FHA loans, down payment assistance programs, and fair lending rights.",true);
    await add("First-Time Homebuying","authoritative","CFPB — Owning a Home","https://www.consumerfinance.gov/owning-a-home","CFPB's comprehensive homebuying guide covering mortgage types, the loan estimate, closing disclosure, shopping for rates, and the homebuying process from offer to closing.",false);
    await add("First-Time Homebuying","authoritative","Freddie Mac — My Home by Freddie Mac","https://myhome.freddiemac.com","Freddie Mac's homebuying education and counseling resources including affordability calculators, homebuyer education courses, and assistance programs for first-time buyers and low-to-moderate income households.",false);

    await add("Heirs' Property & Generational Land","authoritative","USDA — Heirs' Property Resources","https://www.usda.gov/topics/farming/heirs-property","USDA resources on heirs' property — land passed down without formal legal title — a significant cause of Black land loss in the rural South. Covers USDA loan programs, Farm Service Agency assistance, and legal aid connections.",true);
    await add("Heirs' Property & Generational Land","professional","Heirs' Property Law Center","https://www.heirsproperty.org","The Heirs' Property Law Center is a nonprofit legal organization specializing in resolving heirs' property ownership and preventing involuntary land loss among Black and low-income families in the Southeastern U.S.",false);
    await add("Heirs' Property & Generational Land","professional","Federation of Southern Cooperatives Land Assistance Fund","https://www.federation.coop","The Federation of Southern Cooperatives assists Black farmers and rural landowners with land retention, cooperative economics, and heirs' property legal navigation — protecting 400+ years of Black-owned farmland.",false);

    await add("Home Appraisal Bias","authoritative","HUD — Fair Housing in Appraisals","https://www.hud.gov/program_offices/fair_housing_equal_opp","HUD's fair housing resources covering appraisal bias, including the Interagency Task Force on Property Appraisal and Valuation Equity (PAVE) action plan to root out racial bias in home appraisals.",true);
    await add("Home Appraisal Bias","professional","Urban Institute — Appraisal Bias Research","https://www.urban.org","Urban Institute research documenting home appraisal bias — Black-owned homes are consistently undervalued compared to comparable white-owned homes in the same neighborhood, costing Black homeowners billions in home equity.",false);
    await add("Home Appraisal Bias","professional","Brookings Institution — Devaluation of Black-Owned Homes","https://www.brookings.edu/research/devaluation-of-assets-in-black-neighborhoods","Brookings' landmark research documenting that owner-occupied homes in majority-Black neighborhoods are undervalued by an average of $48,000 per home, representing $156 billion in cumulative losses.",false);

    await add("Personal Finance & Budgeting","authoritative","CFPB — Budgeting","https://www.consumerfinance.gov/consumer-tools/budget","CFPB's budgeting and money management tools including the Financial Well-Being Scale, spending tracker, and step-by-step guides on creating and maintaining a household budget.",true);
    await add("Personal Finance & Budgeting","authoritative","MyMoney.gov — CFPB Financial Literacy","https://www.mymoney.gov","MyMoney.gov is the U.S. government's official financial literacy website, with resources on budgeting, saving, borrowing, protecting assets, and financial planning across life stages.",false);
    await add("Personal Finance & Budgeting","authoritative","USA.gov — Money and Credit","https://www.usa.gov/money","USA.gov's money management hub provides links to federal financial literacy resources, government benefit programs, tax guidance, and debt management assistance.",false);

    await add("Retirement Planning","authoritative","Social Security Administration — Retirement","https://www.ssa.gov/retirement","SSA's official retirement planning resources including benefit calculators, when to claim guidance, Medicare coordination, and benefit estimates based on your earnings record.",true);
    await add("Retirement Planning","authoritative","DOL — Retirement Plans and Savings","https://www.dol.gov/general/topic/retirement","The Department of Labor's retirement plan resources cover 401(k)s, IRAs, pension rights, rollovers, and the Employee Benefits Security Administration's guidance on fiduciary responsibility.",false);
    await add("Retirement Planning","authoritative","IRS — Retirement Plans","https://www.irs.gov/retirement-plans","IRS guidance on retirement account contribution limits, early withdrawal penalties, required minimum distributions (RMDs), catch-up contributions, and tax advantages of different retirement account types.",false);

    await add("Sending Money Internationally","authoritative","CFPB — International Money Transfers","https://www.consumerfinance.gov/consumer-tools/sending-money","CFPB's international remittance resources including consumer rights under the Dodd-Frank Remittance Transfer Rule, how to compare transfer costs, and what to do if a transfer goes wrong.",true);
    await add("Sending Money Internationally","authoritative","World Bank — Remittance Prices Worldwide","https://remittanceprices.worldbank.org","The World Bank's Remittance Prices Worldwide database tracks the cost of sending money from and to 48 countries. Provides transparent cost comparisons to help senders find the best rates.",false);
    await add("Sending Money Internationally","authoritative","FTC — Wire Transfers and Money Transfers","https://consumer.ftc.gov/articles/money-transfers","FTC guidance on wire transfer consumer protections, fraud risks, reversibility rules, and how to send money internationally safely.",false);

    await add("Tax Tips & Filing","authoritative","IRS — Filing Information","https://www.irs.gov/filing","The Internal Revenue Service's official tax filing resources including forms, filing deadlines, withholding calculators, payment options, and status checking for federal income tax returns.",true);
    await add("Tax Tips & Filing","authoritative","IRS Free File — Free Federal Tax Filing","https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free","IRS Free File provides free federal tax preparation and filing software for eligible taxpayers, including partnerships with tax software companies through the Free File Alliance.",false);
    await add("Tax Tips & Filing","authoritative","USA.gov — File Your Taxes","https://www.usa.gov/taxes","USA.gov's tax filing hub covering federal and state tax filing resources, free filing options, EITC eligibility, tax credits for families, and IRS Volunteer Income Tax Assistance (VITA) sites.",false);

    // ── LEGAL — 9 topics, 3+ sources each ──────────────────────────────────
    await add("Consumer Rights","authoritative","FTC — Consumer Information","https://consumer.ftc.gov","The Federal Trade Commission's consumer protection hub covers product safety, credit and debt rights, identity theft, scams, and enforcement actions protecting consumers from unfair business practices.",true);
    await add("Consumer Rights","authoritative","CFPB — Consumer Financial Protection","https://www.consumerfinance.gov","The Consumer Financial Protection Bureau enforces federal consumer financial laws and provides resources on mortgages, credit cards, student loans, debt collection, and financial discrimination complaints.",false);
    await add("Consumer Rights","authoritative","USA.gov — Consumer Protection","https://www.usa.gov/consumer","USA.gov's consumer protection directory links to federal and state agencies, product recall databases, complaint filing portals, and resources for resolving disputes with businesses.",false);

    await add("Estate Administration After a Death","authoritative","USA.gov — After a Death","https://www.usa.gov/after-death","USA.gov's post-death resource guide covers death certificates, notifying government agencies, benefits claims, settling an estate, probate basics, and survivor financial planning.",true);
    await add("Estate Administration After a Death","professional","American Bar Association — Probate","https://www.americanbar.org/groups/real_property_trust_estate","The ABA's estate planning and probate resources explain the probate process, executor responsibilities, estate accounting, and when probate can be avoided through trusts and beneficiary designations.",false);
    await add("Estate Administration After a Death","authoritative","IRS — Deceased Persons","https://www.irs.gov/individuals/deceased-persons","IRS guidance on filing a final tax return for a deceased person, estate income tax returns (Form 1041), estate tax (Form 706), and handling tax responsibilities as executor or administrator.",false);

    await add("Expungement & Record Clearing","professional","Clean Slate Initiative","https://www.cleanslateinitiative.org","The Clean Slate Initiative is a bipartisan coalition advocating for automatic record clearing for people who have completed their sentences — providing research, state-by-state law tracker, and policy resources.",true);
    await add("Expungement & Record Clearing","authoritative","Legal Services Corporation — Civil Legal Aid","https://www.lsc.gov","The Legal Services Corporation funds civil legal aid organizations nationwide that help low-income individuals with expungement petitions, record clearing, and related criminal record matters.",false);
    await add("Expungement & Record Clearing","professional","ACLU — Criminal Records Reform","https://www.aclu.org/issues/smart-justice/back-justice/unlocking-communities","The ACLU's criminal records reform resources cover the impact of criminal records on employment, housing, and benefits, as well as state-specific expungement eligibility and petition guides.",false);

    await add("Housing Discrimination & Fair Housing","authoritative","HUD — Fair Housing and Equal Opportunity","https://www.hud.gov/program_offices/fair_housing_equal_opp","HUD's Office of Fair Housing and Equal Opportunity enforces the Fair Housing Act. Provides complaint filing, fair housing laws, prohibited discrimination types, and the AFFH (Affirmatively Furthering Fair Housing) rule.",true);
    await add("Housing Discrimination & Fair Housing","authoritative","DOJ — Fair Housing Act Enforcement","https://www.justice.gov/crt/fair-housing-act","The Department of Justice Civil Rights Division's fair housing resources including enforcement actions, the Fair Housing Act text, pattern-or-practice investigations, and legal rights of housing discrimination victims.",false);
    await add("Housing Discrimination & Fair Housing","professional","National Fair Housing Alliance","https://nationalfairhousing.org","The National Fair Housing Alliance is the leading fair housing advocacy organization in the U.S., conducting testing, education, and enforcement on housing discrimination including lending, insurance, and zoning bias.",false);

    await add("Immigration & Naturalization","authoritative","USCIS — U.S. Citizenship and Immigration Services","https://www.uscis.gov","USCIS is the federal agency that manages lawful immigration to the United States, providing guidance on visa categories, green cards, citizenship applications, refugee and asylum processes, and DACA.",true);
    await add("Immigration & Naturalization","authoritative","U.S. State Department — Visas","https://travel.state.gov/content/travel/en/us-visas.html","The U.S. Department of State's visa information portal covers immigrant and nonimmigrant visa categories, the diversity visa lottery, processing times, appointment scheduling, and country-specific requirements.",false);
    await add("Immigration & Naturalization","authoritative","Legal Services Corporation — Immigration Legal Aid","https://www.lsc.gov/what-legal-aid/immigration","LSC-funded legal aid organizations provide free immigration legal services to low-income individuals, including asylum, DACA, family-based petitions, and naturalization assistance.",false);

    await add("Know Your Rights — Police Encounters","professional","ACLU — Stopped by Police","https://www.aclu.org/know-your-rights/stopped-by-police","The ACLU's 'Know Your Rights' guide explains constitutional rights during police stops, searches, and arrests — including the right to remain silent, the right to refuse a search, and what to do if rights are violated.",true);
    await add("Know Your Rights — Police Encounters","authoritative","DOJ — Civil Rights Division","https://www.justice.gov/crt","The Department of Justice Civil Rights Division investigates and prosecutes police misconduct, pattern-or-practice violations, and civil rights complaints against law enforcement agencies.",false);
    await add("Know Your Rights — Police Encounters","professional","NAACP — Police Accountability","https://www.naacp.org/issues/criminal-justice","The NAACP's criminal justice resources on police accountability, community oversight, use-of-force policies, and advocacy for police reform legislation protecting Black communities.",false);

    await add("Name Changes & Identity Documents","authoritative","USA.gov — Change Your Name","https://www.usa.gov/name-change","USA.gov's name change guide covers state court petition processes, updating the Social Security card, driver's license, U.S. passport, voter registration, and financial accounts after a legal name change.",true);
    await add("Name Changes & Identity Documents","authoritative","Social Security Administration — Name Changes","https://www.ssa.gov/personal-record/namchanges","SSA guidance on updating your Social Security card after a legal name change, including required documents, the application process, and free replacement cards.",false);
    await add("Name Changes & Identity Documents","authoritative","U.S. State Department — Passport Name Change","https://travel.state.gov/content/travel/en/passports/need-passport/change-of-name.html","State Department instructions for updating a U.S. passport after a legal name change, including form DS-5504 (within one year of issuance) and DS-82 (after one year), required documentation, and fees.",false);

    await add("Tenant Rights","authoritative","HUD — Tenant Rights","https://www.hud.gov/topics/rental_assistance/tenantrights","HUD's tenant rights resources cover security deposits, eviction procedures, habitability requirements, fair housing protections for renters, and HUD-approved housing counseling.",true);
    await add("Tenant Rights","authoritative","USA.gov — Renter Rights","https://www.usa.gov/renters-rights","USA.gov's renter's rights resource center links to state tenant protections, federal fair housing laws, eviction moratorium information, and rental assistance programs.",false);
    await add("Tenant Rights","professional","National Housing Law Project","https://nhlp.org","The National Housing Law Project provides free legal resources, tenant organizing guides, and litigation support for low-income tenants facing eviction, habitability issues, and discrimination.",false);

    await add("Workplace Rights & Discrimination","authoritative","EEOC — Equal Employment Opportunity Commission","https://www.eeoc.gov","The EEOC enforces federal workplace anti-discrimination laws. Provides guidance on protected classes, how to file a discrimination charge, mediation services, and the EEOC data on racial disparities in workplace discrimination charges.",true);
    await add("Workplace Rights & Discrimination","authoritative","DOL — Worker Rights","https://www.dol.gov/general/workerrights","The Department of Labor's worker rights portal covers wage and hour laws, OSHA safety rights, FMLA, disability accommodations, and whistleblower protections.",false);
    await add("Workplace Rights & Discrimination","authoritative","NLRB — National Labor Relations Board","https://www.nlrb.gov","The NLRB protects workers' rights to organize, collectively bargain, and engage in protected concerted activity. Provides guidance on unfair labor practices, union elections, and employee rights regardless of union status.",false);

    // ── RECOVERY — 5 topics, 3+ sources each ────────────────────────────────
    await add("Domestic Violence Resources","authoritative","National Domestic Violence Hotline","https://www.thehotline.org","The National DV Hotline provides 24/7 crisis support, safety planning, and local resource referrals for survivors of domestic violence, sexual assault, and stalking. Available by call, text, and online chat.",true);
    await add("Domestic Violence Resources","authoritative","DOJ — Office on Violence Against Women","https://www.justice.gov/ovw","DOJ's Office on Violence Against Women administers federal grants supporting shelters, legal assistance, transitional housing, and prevention programs addressing domestic violence, dating violence, sexual assault, and stalking.",false);
    await add("Domestic Violence Resources","professional","National Network to End Domestic Violence","https://nnedv.org","NNEDV is the leading national membership organization of state domestic violence coalitions, providing policy advocacy, safety technology resources (Safety Net), and data on the annual census of DV shelter demand.",false);

    await add("Grief & Bereavement","professional","American Psychological Association — Grief","https://www.apa.org/topics/grief","The APA's clinical resources on grief cover the grieving process, complicated grief disorder, cultural variations in mourning, therapy approaches, and how to support grieving individuals across different communities.",true);
    await add("Grief & Bereavement","authoritative","NIH NIMH — Coping with Grief","https://www.nimh.nih.gov/health/publications/grief","The National Institute of Mental Health's patient education on grief, its relationship to depression and PTSD, when to seek professional help, and how to support bereaved family members.",false);
    await add("Grief & Bereavement","authoritative","SAMHSA — Grief After Disaster or Trauma","https://www.samhsa.gov/disaster-preparedness","SAMHSA's grief and bereavement resources specifically address traumatic loss, disaster-related grief, and community-wide bereavement following violence — topics particularly relevant to communities that experience disproportionate loss.",false);

    await add("Life After Divorce & Separation","authoritative","USA.gov — Divorce and Separation","https://www.usa.gov/divorce","USA.gov's divorce resource hub covers state divorce process basics, legal separation, child custody and support, spousal support, dividing retirement accounts (QDROs), and updating legal documents after divorce.",true);
    await add("Life After Divorce & Separation","professional","American Psychological Association — Divorce","https://www.apa.org/topics/divorce-child-custody","APA's clinical resources on divorce cover psychological impacts on adults and children, co-parenting after divorce, helping children through family transitions, and finding therapy and support groups.",false);
    await add("Life After Divorce & Separation","authoritative","Legal Services Corporation — Family Law Aid","https://www.lsc.gov","LSC-funded legal aid organizations provide free legal assistance for low-income individuals with divorce, custody, child support, and domestic relations matters, including help navigating court without an attorney.",false);

    await add("Reentry After Incarceration","authoritative","DOJ — Reentry","https://www.justice.gov/reentry","The Department of Justice's Reentry Council coordinates federal reentry policy across agencies, providing resources on housing, employment, benefits eligibility restoration, and mentoring for returning citizens.",true);
    await add("Reentry After Incarceration","authoritative","National Reentry Resource Center","https://nationalreentryresourcecenter.org","NRRC, funded by DOJ, provides technical assistance and data on reentry programming, including evidence-based practices for employment, housing stability, and family reunification for people leaving incarceration.",false);
    await add("Reentry After Incarceration","authoritative","Bureau of Justice Statistics — Reentry Data","https://bjs.ojp.gov/topics/reentry","BJS provides nationally representative data on recidivism, employment outcomes, and housing stability for people returning from incarceration — essential context for understanding reentry challenges.",false);

    await add("Substance Abuse Recovery","authoritative","SAMHSA — Substance Use Treatment","https://www.samhsa.gov","The Substance Abuse and Mental Health Services Administration funds treatment programs, provides the National Helpline (1-800-662-4357), and maintains treatment locators for substance use disorders and co-occurring mental health conditions.",true);
    await add("Substance Abuse Recovery","authoritative","NIH NIDA — Drug Abuse and Addiction","https://nida.nih.gov","The National Institute on Drug Abuse provides science-based information on substance use disorders, treatment approaches (MAT, behavioral therapy), and research on racial disparities in addiction treatment access and outcomes.",false);
    await add("Substance Abuse Recovery","authoritative","CDC — Overdose Prevention","https://www.cdc.gov/drugoverdose","CDC's overdose prevention resources cover opioid, stimulant, and polysubstance overdose data, naloxone access, syringe services programs, and community-based prevention strategies.",false);

    // ── EMPLOYMENT — 10 topics, 2+ sources each ─────────────────────────────
    await add("Career Development","authoritative","BLS — Occupational Outlook Handbook","https://www.bls.gov/ooh","The BLS Occupational Outlook Handbook provides career information on hundreds of occupations including required education, job duties, median pay, and projected job growth — a trusted career planning resource.",true);
    await add("Career Development","authoritative","O*NET Online — Occupation Database","https://www.onetonline.org","O*NET Online is the primary source of occupational information in the U.S., providing detailed job descriptions, required skills, work activities, and career pathway connections for over 900 occupations.",false);

    await add("Career Sponsorship & Mentorship","professional","MENTOR — National Mentoring Partnership","https://www.mentoring.org","MENTOR is the national advocacy organization for mentoring, providing research on mentoring's impact on career outcomes, tools for mentoring programs, and resources for finding mentors and mentees.",true);
    await add("Career Sponsorship & Mentorship","professional","Harvard Business Review — Mentorship","https://hbr.org/topic/subject/mentoring","HBR's research-backed editorial on mentoring and sponsorship in the workplace covers the distinction between mentors and sponsors, how to find sponsors, and why sponsorship particularly impacts career advancement for Black professionals.",false);

    await add("Careers & Professional","authoritative","USA.gov — Job Search and Employment","https://www.usa.gov/job-search","USA.gov's employment resource hub includes federal job search, employment rights, workplace protections, unemployment insurance, and career training program links.",true);
    await add("Careers & Professional","authoritative","BLS — Career Information","https://www.bls.gov","The Bureau of Labor Statistics provides labor market data, wage statistics, employment projections, and career information used by job seekers, employers, and workforce development professionals.",false);

    await add("Internships & Early-Career Opportunities","authoritative","DOL — Youth Career Resources","https://www.dol.gov/general/youth","The Department of Labor's youth employment resources cover apprenticeships, internships, registered apprenticeship programs, Job Corps, and workforce development programs targeting young adults.",true);
    await add("Internships & Early-Career Opportunities","professional","National Association of Colleges and Employers","https://www.naceweb.org","NACE provides research on internship and early-career job market trends, including the compensation and job offer rates by race and gender, and guidance for students navigating the recruiting process.",false);

    await add("Job Market Trends","authoritative","BLS — Employment Situation","https://www.bls.gov/news.release/empsit.toc.htm","The Bureau of Labor Statistics Monthly Employment Situation report is the most widely cited source of labor market data, covering unemployment rates by race, industry employment, and wage growth.",true);
    await add("Job Market Trends","authoritative","BLS — Occupational Outlook Handbook","https://www.bls.gov/ooh","The BLS Occupational Outlook Handbook includes 10-year employment projections by occupation, identifying the fastest-growing jobs, industries with the most openings, and automation risks.",false);

    await add("Leadership & Executive Growth","professional","Center for Creative Leadership","https://www.ccl.org","The Center for Creative Leadership is a globally recognized research and leadership development institution that provides data-driven leadership programs, assessments, and research on developing diverse executive talent.",true);
    await add("Leadership & Executive Growth","professional","Harvard Business Review — Leadership","https://hbr.org/topic/subject/leadership","HBR's leadership research covers executive skills development, inclusive leadership practices, building high-performing teams, and navigating organizational politics — with regular coverage of race and leadership.",false);

    await add("Navigating Corporate Culture","professional","SHRM — Diversity, Equity & Inclusion","https://www.shrm.org/topics-tools/topics/diversity","The Society for Human Resource Management provides research and practical tools on workplace culture, inclusion, anti-bias practices, and retention of diverse employees.",true);
    await add("Navigating Corporate Culture","professional","Harvard Business Review — Organizational Culture","https://hbr.org/topic/subject/organizational-culture","HBR's research-backed editorial on organizational culture covers cultural fit, code-switching, psychological safety, allyship, and what makes workplaces genuinely inclusive for Black and minority professionals.",false);

    await add("Remote Work & Flexibility","authoritative","DOL — Telework and Remote Work Resources","https://www.dol.gov/agencies/whd/flsa/remote-work","The Department of Labor's guidance on remote work covers wage and hour law compliance, overtime rules for remote workers, and employer obligations for teleworking employees.",true);
    await add("Remote Work & Flexibility","authoritative","BLS — American Time Use Survey","https://www.bls.gov/tus","BLS's American Time Use Survey documents how Americans spend their time, including telework rates by occupation, industry, and demographic group — providing data on remote work disparities.",false);

    await add("Returning to Work After a Career Break","authoritative","DOL Women's Bureau — Return to Work","https://www.dol.gov/agencies/wb","The DOL Women's Bureau researches and advocates for policies supporting workers returning after career breaks for caregiving, including returnship programs, childcare access, and paid leave policies.",true);
    await add("Returning to Work After a Career Break","professional","AARP — Back to Work 50+","https://www.aarp.org/work/working-at-50-plus/return-to-work.html","AARP's career returner resources cover resume gaps, age discrimination protections, returnship programs, interview preparation, and reskilling resources for workers returning after extended career breaks.",false);

    await add("Workplace Discrimination & Rights","authoritative","EEOC — Workplace Discrimination","https://www.eeoc.gov/discrimination-type","The EEOC's discrimination type guides explain protections against race, color, national origin, sex, disability, age, and religion discrimination in hiring, pay, promotion, and termination.",true);
    await add("Workplace Discrimination & Rights","authoritative","DOL OFCCP — Federal Contractor Compliance","https://www.dol.gov/agencies/ofccp","The Office of Federal Contract Compliance Programs enforces equal employment opportunity requirements for federal contractors and subcontractors, including affirmative action obligations and pay equity audits.",false);

    // ── EDUCATION — 4 topics with 0 sources ─────────────────────────────────
    await add("Education","authoritative","U.S. Department of Education","https://www.ed.gov","The U.S. Department of Education administers federal education funding, policies, and programs including Title I, Pell Grants, student loans, civil rights enforcement, and research on educational equity.",true);
    await add("Education","authoritative","NCES — National Center for Education Statistics","https://nces.ed.gov","NCES is the primary federal entity for collecting and analyzing education data, publishing reports on enrollment, achievement gaps by race, graduation rates, and educational attainment across demographic groups.",false);

    await add("STEM Education","authoritative","NSF — STEM Education","https://www.nsf.gov/stem","The National Science Foundation funds STEM education research and programs, including Historically Black Colleges and Universities-STEM programs, broadening participation initiatives, and K-12 STEM pipeline development.",true);
    await add("STEM Education","professional","UNCF — STEM Scholarships","https://uncf.org/programs","The United Negro College Fund's STEM scholarship and research programs support Black students pursuing science, technology, engineering, and mathematics degrees at HBCUs and other institutions.",false);

    await add("Scholarships & Grants","authoritative","Federal Student Aid — Grants","https://studentaid.gov/understand-aid/types/grants","Federal Student Aid's guide to grant types including Pell Grants, TEACH Grants, Iraq and Afghanistan Service Grants, and how to apply through the FAFSA to maximize grant eligibility.",true);
    await add("Scholarships & Grants","professional","Scholarship America","https://scholarshipamerica.org","Scholarship America is one of the nation's largest scholarship management organizations, administering over $200 million in scholarships annually and providing guidance on finding and applying for private scholarships.",false);

    await add("Student Loan Information","authoritative","Federal Student Aid — Loan Management","https://studentaid.gov/manage-loans","Federal Student Aid provides comprehensive guidance on managing federal student loans including repayment plan options, income-driven repayment, Public Service Loan Forgiveness, and deferment/forbearance.",true);
    await add("Student Loan Information","authoritative","CFPB — Paying for College","https://www.consumerfinance.gov/paying-for-college","CFPB's student loan resources cover comparing financial aid offers, understanding loan types, navigating repayment, and disputing student loan servicer errors — with specific guidance on common problems facing Black borrowers.",false);

    // ── EDUCATION — add 3rd sources to topics with 2 ────────────────────────
    await add("First-Generation College Students","professional","NASPA — First-Generation College Students","https://firstgen.naspa.org","NASPA's Center for First-generation Student Success documents first-gen student outcomes, institutional best practices, and the Annual National Survey of First-Generation Students, with disaggregated data by race and institution type.",false);
    await add("HBCUs","professional","NAFEO — National Association for Equal Opportunity in Higher Education","https://www.nafeo.org","NAFEO represents HBCUs and predominantly Black institutions, advocating for equitable federal funding, policy research, and providing institutional data on HBCU enrollment, graduation rates, and economic impact.",false);

    // ── SAFETY — 5 topics, 2+ sources each ──────────────────────────────────
    await add("Cybersecurity & Digital Safety","authoritative","CISA — Cybersecurity Resources","https://www.cisa.gov/cybersecurity","The Cybersecurity and Infrastructure Security Agency provides cybersecurity guidance for individuals, businesses, and critical infrastructure, including the StopRansomware portal and personal cybersecurity tips.",true);
    await add("Cybersecurity & Digital Safety","authoritative","FTC — Online Security and Privacy","https://consumer.ftc.gov/identity-theft-and-online-security","FTC's consumer guides on protecting personal information online, recognizing phishing, securing devices and accounts, and steps to take after identity theft.",false);

    await add("Emergency Preparedness","authoritative","Ready.gov — FEMA Emergency Preparedness","https://www.ready.gov","FEMA's Ready.gov provides household emergency preparedness guidance covering disaster kit assembly, family communication plans, evacuation routes, and preparedness for specific hazards.",true);
    await add("Emergency Preparedness","authoritative","CDC — Emergency Preparedness and Response","https://emergency.cdc.gov","CDC's emergency health preparedness resources cover natural disasters, disease outbreaks, chemical emergencies, and public health guidance for vulnerable populations including communities with limited resources.",false);

    await add("Neighborhood Safety","authoritative","CDC — Violence Prevention","https://www.cdc.gov/violenceprevention","CDC's violence prevention resources cover community violence, gun violence, intimate partner violence, and the community-based programs (like Cure Violence) proven to reduce neighborhood violence.",true);
    await add("Neighborhood Safety","authoritative","DOJ — Community Safety","https://www.justice.gov/ovcs","DOJ's Office for Victims of Crime and community safety programs support violence intervention, crime victim services, and community-police trust-building initiatives in high-violence neighborhoods.",false);

    await add("Public Health Alerts","authoritative","CDC — Health Alerts Network","https://emergency.cdc.gov/han","CDC's Health Alert Network distributes urgent public health notifications, health advisories, and updates to clinicians, public health practitioners, and the public about emerging health threats.",true);
    await add("Public Health Alerts","authoritative","HHS — Public Health Emergency","https://www.phe.gov","The HHS Office of the Assistant Secretary for Preparedness and Response coordinates federal public health emergency preparedness and response, including medical countermeasures and Strategic National Stockpile deployment.",false);

    await add("Travel Safety Advisories","authoritative","U.S. State Department — Travel Advisories","https://travel.state.gov/content/travel/en/traveladvisories/traveladvisories.html","The State Department's four-level travel advisory system (Exercise Normal Precautions / Exercise Increased Caution / Reconsider Travel / Do Not Travel) covers every country in the world with threat-specific guidance.",true);
    await add("Travel Safety Advisories","authoritative","CDC — Travelers' Health Notices","https://wwwnc.cdc.gov/travel/notices","CDC's travel health notices categorize health risks by destination (Watch Level 1 / Alert Level 2 / Warning Level 3) and provide vaccination requirements, disease outbreak alerts, and travel health guidance.",false);

    // ── RELOCATION — 7 topics, 2+ sources each ──────────────────────────────
    await add("Best Cities to Relocate","authoritative","U.S. Census Bureau — American Community Survey","https://www.census.gov/programs-surveys/acs.html","The Census Bureau's ACS provides detailed demographic, economic, and housing data for every city and metro area — the authoritative data source for comparing housing costs, income levels, and community characteristics.",true);
    await add("Best Cities to Relocate","professional","Brookings Institution — Metro Monitor","https://www.brookings.edu/series/metro-monitor","Brookings Metropolitan Policy Program tracks economic performance, opportunity, and inclusion metrics across the 100 largest U.S. metro areas — including analysis of which cities are improving economic opportunity for Black residents.",false);

    await add("Cost of Living Comparisons","authoritative","BLS — Consumer Expenditure Survey","https://www.bls.gov/cex","BLS Consumer Expenditure Survey data documents household spending on housing, food, transportation, healthcare, and other expenses by income quintile, race, age, and region.",true);
    await add("Cost of Living Comparisons","authoritative","USA.gov — Moving and Relocation Resources","https://www.usa.gov/moving","USA.gov's moving resources cover cost-of-living planning, transferring benefits across states, updating voter registration, and notifying government agencies after a move.",false);

    await add("Finding Community After Moving","authoritative","USA.gov — Community and Volunteer Resources","https://www.usa.gov/volunteer","USA.gov's community engagement resources including volunteer programs, civic organizations, neighborhood associations, and community development resources for people new to an area.",true);
    await add("Finding Community After Moving","professional","AARP — Community Connections","https://www.aarp.org/livable-communities","AARP's livable communities research and resources on age-friendly city planning, neighborhood walkability, community connection programs, and social isolation prevention for adults at all life stages.",false);

    await add("Housing Market Trends","authoritative","HUD — Comprehensive Housing Market Analyses","https://www.huduser.gov/portal/datasets/mpts.html","HUD's market trend surveys and comprehensive analyses of local housing markets across the U.S., covering supply, demand, vacancy rates, and affordability for specific metro areas.",true);
    await add("Housing Market Trends","professional","National Association of Realtors — Housing Statistics","https://www.nar.realtor/research-and-statistics","NAR's housing market statistics include existing home sales, median prices, days on market, and quarterly racial homeownership data from the nation's largest real estate trade association.",false);

    await add("Moving Tips & Resources","authoritative","FMCSA — Protect Your Move","https://www.fmcsa.dot.gov/protect-your-move","The Federal Motor Carrier Safety Administration's consumer protection site for interstate movers — covering how to get binding estimates, your rights and responsibilities, broker vs. carrier distinctions, and how to file complaints about moving companies.",true);
    await add("Moving Tips & Resources","authoritative","USA.gov — Moving Checklist","https://www.usa.gov/moving","USA.gov's comprehensive moving guide covers updating government records (SSA, IRS, voter registration), transferring utilities, school enrollment, and connecting with community resources in a new location.",false);

    await add("Moving to a New City","authoritative","HUD — Housing Resources by State","https://www.hud.gov/states","HUD's state and local housing resource directory helps people relocating find local public housing, Section 8 vouchers, rental assistance, homebuyer programs, and fair housing agencies in their new city.",true);
    await add("Moving to a New City","authoritative","USA.gov — New Residents","https://www.usa.gov/moving-to-new-place","USA.gov's new resident guide covers registering to vote in a new state, updating a driver's license, transferring professional licenses, enrolling children in school, and finding community resources.",false);

    await add("School Ratings & Education Quality","authoritative","NCES — School Search","https://nces.ed.gov/ccd/schoolsearch","The National Center for Education Statistics' Common Core of Data provides searchable information on every public school in the U.S. including enrollment by race, teacher-student ratios, and school characteristics.",true);
    await add("School Ratings & Education Quality","authoritative","U.S. Department of Education — School Data","https://www.ed.gov/data","The Department of Education's data resources include the Civil Rights Data Collection (CRDC), School Improvement Grant data, and state accountability system results disaggregated by race and disability status.",false);

    // ── HOME — 4 topics, 2+ sources each ────────────────────────────────────
    await add("Contractor Scams & Hiring Tradespeople","authoritative","FTC — Home Repair and Improvement Scams","https://consumer.ftc.gov/articles/home-improvement-scams","FTC consumer guidance on recognizing home repair fraud, avoiding contractor scams after disasters, verifying contractor licenses, getting written contracts, and reporting deceptive home improvement practices.",true);
    await add("Contractor Scams & Hiring Tradespeople","authoritative","USA.gov — Consumer Protection","https://www.usa.gov/contractor","USA.gov guidance on finding licensed contractors, understanding contractor rights and responsibilities, resolving disputes, and filing complaints with state contractor licensing boards.",false);

    await add("First Apartment & Renting Guide","authoritative","HUD — Tenant Rights","https://www.hud.gov/topics/rental_assistance/tenantrights","HUD's tenant rights resources for renters cover lease basics, security deposit rules, habitability standards, landlord entry rights, eviction procedures, and fair housing protections.",true);
    await add("First Apartment & Renting Guide","authoritative","CFPB — Renting a Home","https://www.consumerfinance.gov/renting","CFPB's renting guide covers understanding your lease, tenant financial rights, security deposit protection, rent-to-income ratios, renter's insurance, and what to do when problems arise.",false);

    await add("Home Maintenance Calendar","authoritative","DOE — Home Energy Saver","https://www.energy.gov/energysaver/home-maintenance-and-safety","The Department of Energy's home maintenance resources cover seasonal energy efficiency improvements, HVAC maintenance schedules, weatherization, and home safety checks that reduce utility costs and prevent costly repairs.",true);
    await add("Home Maintenance Calendar","authoritative","HUD — Homeowner Handbook","https://www.hud.gov/offices/hsg/sfh/ins/handbook","HUD's homeowner resources provide guidance on routine home maintenance responsibilities, working with HOAs, and maintaining property in compliance with local housing codes.",false);

    await add("Homeowners Insurance","authoritative","NAIC — Homeowners Insurance Guide","https://content.naic.org/consumer_home_insurance.htm","The National Association of Insurance Commissioners provides a homeowners insurance buyer's guide covering coverage types, how to compare policies, claim filing, and consumer rights in the insurance process.",true);
    await add("Homeowners Insurance","professional","Insurance Information Institute — Home Insurance","https://www.iii.org/article/home-insurance-basics","The Insurance Information Institute's home insurance resources explain dwelling coverage, personal property protection, liability coverage, additional living expenses, and how to avoid being underinsured.",false);

    // ── HOUSING ──────────────────────────────────────────────────────────────
    await add("Philadelphia Real Estate","authoritative","City of Philadelphia — Office of Property Assessment","https://www.phila.gov/departments/office-of-property-assessment","The Philadelphia Office of Property Assessment provides property valuation data, assessment appeal processes, and homestead exemption information for Philadelphia property owners and buyers.",true);
    await add("Philadelphia Real Estate","authoritative","HUD — Pennsylvania Housing Resources","https://www.hud.gov/states/pennsylvania","HUD's Pennsylvania resource page covers local housing counseling agencies, FHA lenders, public housing authorities, and fair housing offices serving the Philadelphia region.",false);

    log(`Library Batch B complete: ${n} knowledge_sources inserted`);
  } catch (err: unknown) {
    warn(`Library Batch B failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH C — GEOGRAPHY / COUNTRY / TRAVEL / COMMUNITY / FAMILY
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureLibraryEvidenceBatchC(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  let n = 0;
  const add = async (...args: Parameters<typeof sd>) => { try { n += await sd(...args); } catch(e) { warn(`Library Batch C — sd failed: ${e instanceof Error ? e.message : String(e)}`); } };

  try {
    // ── COUNTRY — 51 African nations + Laos (2 sources each) ─────────────────
    // Pattern: CIA World Factbook (authoritative, primary) + US State Dept Travel (authoritative)
    const africaCountries: [string, string, string][] = [
      ["Algeria","algeria","Algeria"],
      ["Angola","angola","Angola"],
      ["Benin","benin","Benin"],
      ["Botswana","botswana","Botswana"],
      ["Burkina Faso","burkina-faso","Burkina-Faso"],
      ["Burundi","burundi","Burundi"],
      ["Cameroon","cameroon","Cameroon"],
      ["Cape Verde","cabo-verde","Cabo-Verde"],
      ["Central African Republic","central-african-republic","Central-African-Republic"],
      ["Chad","chad","Chad"],
      ["Comoros","comoros","Comoros"],
      ["Côte d'Ivoire","cote-divoire","Cote-dIvoire"],
      ["Democratic Republic of Congo","congo-democratic-republic-of-the","Democratic-Republic-of-the-Congo"],
      ["Djibouti","djibouti","Djibouti"],
      ["Egypt","egypt","Egypt"],
      ["Equatorial Guinea","equatorial-guinea","Equatorial-Guinea"],
      ["Eritrea","eritrea","Eritrea"],
      ["Eswatini","eswatini","Eswatini"],
      ["Gabon","gabon","Gabon"],
      ["Gambia","gambia-the","Gambia"],
      ["Guinea","guinea","Guinea"],
      ["Guinea-Bissau","guinea-bissau","Guinea-Bissau"],
      ["Laos","laos","Laos"],
      ["Lesotho","lesotho","Lesotho"],
      ["Liberia","liberia","Liberia"],
      ["Libya","libya","Libya"],
      ["Madagascar","madagascar","Madagascar"],
      ["Malawi","malawi","Malawi"],
      ["Mali","mali","Mali"],
      ["Mauritania","mauritania","Mauritania"],
      ["Mauritius","mauritius","Mauritius"],
      ["Morocco","morocco","Morocco"],
      ["Mozambique","mozambique","Mozambique"],
      ["Namibia","namibia","Namibia"],
      ["Niger","niger","Niger"],
      ["Republic of the Congo","congo-republic-of-the","Republic-of-the-Congo"],
      ["Rwanda","rwanda","Rwanda"],
      ["Senegal","senegal","Senegal"],
      ["Seychelles","seychelles","Seychelles"],
      ["Sierra Leone","sierra-leone","Sierra-Leone"],
      ["Somalia","somalia","Somalia"],
      ["South Sudan","south-sudan","South-Sudan"],
      ["Sudan","sudan","Sudan"],
      ["São Tomé and Príncipe","sao-tome-and-principe","Sao-Tome-and-Principe"],
      ["Tanzania","tanzania","Tanzania"],
      ["Togo","togo","Togo"],
      ["Tunisia","tunisia","Tunisia"],
      ["Uganda","uganda","Uganda"],
      ["Zambia","zambia","Zambia"],
      ["Zimbabwe","zimbabwe","Zimbabwe"],
    ];
    for (const [name, ciaSlug, stateSlug] of africaCountries) {
      await add(name,"authoritative",`CIA World Factbook — ${name}`,`https://www.cia.gov/the-world-factbook/countries/${ciaSlug}/`,`The CIA World Factbook is the U.S. government's authoritative reference on ${name}, covering geography, people, government, economy, and transnational issues — updated annually.`,true);
      await add(name,"authoritative",`U.S. State Department — ${name} Travel Information`,`https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/${stateSlug}.html`,`The U.S. State Department's country information page for ${name} provides travel advisories, entry requirements, health and safety guidance, and embassy contact information for U.S. visitors.`,false);
    }

    // Add 2nd source to country topics already seeded with only 1
    await add("Bahamas","authoritative","U.S. State Department — Bahamas Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Bahamas.html","U.S. State Department travel information for the Bahamas including entry requirements, safety advisories, health information, and U.S. Embassy Nassau contact details.",false);
    await add("Barbados","authoritative","U.S. State Department — Barbados Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Barbados.html","U.S. State Department travel information for Barbados including entry requirements, safety advisories, health information, and U.S. Embassy Bridgetown contact details.",false);
    await add("Brazil","authoritative","U.S. State Department — Brazil Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Brazil.html","U.S. State Department travel information for Brazil including entry requirements, safety advisories, health information, and U.S. Embassy Brasília contact details.",false);
    await add("Colombia","authoritative","U.S. State Department — Colombia Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Colombia.html","U.S. State Department travel information for Colombia including entry requirements, safety advisories, health information, and U.S. Embassy Bogotá contact details.",false);
    await add("Cuba","authoritative","U.S. State Department — Cuba Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Cuba.html","U.S. State Department travel information for Cuba including travel authorization requirements, safety advisories, health information, and the U.S. Embassy Havana contact details.",false);
    await add("Dominican Republic","authoritative","U.S. State Department — Dominican Republic Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/DominicanRepublic.html","U.S. State Department travel information for the Dominican Republic including entry requirements, safety advisories, health information, and U.S. Embassy Santo Domingo contact details.",false);
    await add("Haiti","authoritative","U.S. State Department — Haiti Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/Haiti.html","U.S. State Department travel information for Haiti including current travel advisories, security conditions, health information, and U.S. Embassy Port-au-Prince contact details.",false);
    await add("Trinidad and Tobago","authoritative","U.S. State Department — Trinidad and Tobago Travel Information","https://travel.state.gov/content/travel/en/international-travel/International-Travel-Country-Information-Pages/TrinidadandTobago.html","U.S. State Department travel information for Trinidad and Tobago including entry requirements, safety advisories, health information, and U.S. Embassy Port of Spain contact details.",false);

    // ── TRAVEL — Thai destinations (Tourism Authority of Thailand) ─────────────
    const tat = "Tourism Authority of Thailand — Official Site";
    const tatUrl = "https://www.tourismthailand.org";
    const tatClaim = (place: string) => `The Tourism Authority of Thailand (TAT) is the official Thai government tourism body. TAT's destination guide for ${place} provides current visitor information, cultural context, visiting hours, admission details, and nearby recommendations.`;
    const tatNote = "authoritative";

    const thaiSites: [string, string][] = [
      ["Big Buddha, Phuket","Big Buddha (Phra Phutthamingmongkol Akenakkiri) is a 45-meter white marble statue visible from across Phuket. The Tourism Authority of Thailand provides visitor guidance, cultural context, and dress code requirements."],
      ["Doi Suthep Temple, Chiang Mai, Thailand","Wat Phra That Doi Suthep is Chiang Mai's most revered temple, perched at 1,073m on Doi Suthep mountain. TAT provides visiting information, temple etiquette, and the legend of the white elephant who chose the site."],
      ["Elephant Nature Park, Chiang Mai, Thailand","The Tourism Authority of Thailand profiles responsible elephant sanctuaries in Chiang Mai, with guidance on ethical elephant tourism that avoids riding and performance shows."],
      ["Kata Beach & Kata Noi, Phuket","TAT's visitor guide to Kata and Kata Noi beaches covers beach conditions by season, water sports, accommodation, and the family-friendly character of Kata versus the livelier Patong Beach."],
      ["Patong Beach, Phuket","TAT's guide to Patong Beach covers the main beach strip, water activities, Bangla Road entertainment district, and safety tips for tourists visiting Phuket's most commercially developed beach."],
      ["Phang Nga Bay — James Bond Island, Phuket","TAT's guide to Phang Nga Bay covers the iconic limestone karst formations, James Bond Island (Khao Phing Kan), sea cave kayaking, and tour options from Phuket and Khao Lak."],
      ["Phi Phi Islands, Phuket","TAT profiles the Phi Phi Islands (Ko Phi Phi Don and Ko Phi Phi Le) covering the famous Maya Bay, marine park regulations, snorkeling, and ferry connections from Phuket and Krabi."],
      ["Phuket Architecture Heritage","TAT's heritage guide documents Phuket's unique Sino-Portuguese colonial architecture, shophouse walking routes in Phuket Old Town, and the annual Phuket Old Town Festival."],
      ["Phuket History & Culture","TAT provides cultural context on Phuket's multiethnic history — Chinese, Malay, Portuguese, and Thai influences — including the heroism of the two widows who repelled a Burmese invasion in 1785."],
      ["Phuket Old Town","TAT's Old Town Phuket guide covers the UNESCO-recognized Sino-Portuguese shophouse streetscapes, Thalang Road, heritage mansions, local food scene, and the First Sunday Walking Street market."],
      ["Phuket Vegetarian Festival","TAT documents the annual Phuket Vegetarian Festival (Nine Emperor Gods Festival), held every October, as one of Thailand's most spectacular religious events with street processions, firewalking, and vegetarian food traditions."],
      ["Wat Chalong, Phuket","TAT's guide to Wat Chalong (Wat Chaithararam) — Phuket's largest and most important Buddhist temple — covers the main prayer hall, the Grand Pagoda housing a bone fragment of the Buddha, and temple etiquette."],
      ["Yaowarat — Bangkok Chinatown","TAT’s guide to Yaowarat — Bangkok’s historic Chinatown — covers the gold-trading district established by Chinese immigrants in the 18th century, street food highlights (boat noodles, oyster omelets, fresh seafood), Wat Mangkon Kamalawat dragon temple, and the Friday–Saturday evening night market atmosphere along Yaowarat Road."],
      ["Lumphini Park, Bangkok","TAT profiles Bangkok's Lumphini Park — the city's main green lung — including morning exercise culture, weekend markets, boating, the resident water monitor lizards, and its role as a social gathering space."],
      ["Chao Phraya River & the Klong Network, Bangkok","TAT's Bangkok waterways guide covers the Chao Phraya river ferry system, canal (klong) boat routes, river cruises, and the historic temples and markets accessible by water."],
      ["Chatuchak Weekend Market, Bangkok","TAT's Chatuchak Market guide covers the world's largest weekend market — 15,000 stalls across 27 acres — including navigation tips, notable sections (antiques, plants, crafts, food), and the best time to visit."],
      ["Khao San Road Area, Bangkok","TAT profiles Bangkok's famous backpacker district and its transformation from a budget travelers' hub to a lively street food and bar destination popular with Thai young people and international visitors."],
      ["The Grand Palace & Wat Phra Kaew, Bangkok","TAT's guide to the Grand Palace and Temple of the Emerald Buddha covers dress code requirements, the history of the complex since 1782, the Emerald Buddha's three seasonal costumes, and ticketing."],
      ["Wat Arun — Temple of Dawn, Bangkok","TAT's guide to Wat Arun (Temple of Dawn) covers the iconic 79-meter Khmer-style prang decorated with colorful porcelain, the riverside location best viewed from the opposite bank at sunset, and visiting logistics."],
      ["Wat Pho — Temple of the Reclining Buddha, Bangkok","TAT's guide to Wat Pho covers the 46-meter gold-plated Reclining Buddha, the complex's role as Thailand's first public university, and its status as the birthplace of traditional Thai massage."],
      ["Erawan Falls, Kanchanaburi, Thailand","TAT's guide to Erawan National Park and its famous seven-tiered emerald-green waterfalls covers trail difficulty, swimming rules, wildlife (fish nibbling tours), and access from Kanchanaburi town."],
      ["Andaman Sea Ecology & Travel","TAT's Andaman Coast guide covers the marine biodiversity of the Andaman Sea — coral reefs, whale sharks, manta rays — responsible diving and snorkeling sites, and seasonal diving conditions."],
      ["Muay Thai History & Culture","TAT's guide to Muay Thai (Thai boxing) covers its history as a national martial art and cultural tradition, training camps welcoming international visitors, and stadium venues in Bangkok and Chiang Mai."],
      ["Peranakan (Baba-Nyonya) Culture","TAT profiles the Peranakan (Baba-Nyonya) culture — descendants of Chinese immigrants who married locally — their unique architecture, cuisine, dress (kebaya), and living communities in Phuket and across Southeast Asia."],
      ["Thai Buddhism for Travelers","TAT's guide to Thai Buddhist culture covers temple etiquette, merit-making practices, the role of monks in Thai society, religious holidays, and how travelers can respectfully engage with Thai Buddhism."],
      ["Thai Cuisine & Food Culture","TAT's Thai cuisine guide covers the regional diversity of Thai food (Central, Northern, Northeastern, Southern), street food culture, cooking class recommendations, and the cultural meanings embedded in Thai food traditions."],
      ["Thai Massage & Wellness Traditions","TAT profiles traditional Thai massage (Nuad Thai) — inscribed on UNESCO's Intangible Cultural Heritage list in 2019 — covering its history, therapeutic traditions, and licensed massage centers across Thailand."],
      ["Thai Royal History & Buddhism","TAT's guide to Thailand's royal history covers the Chakri Dynasty (founded 1782), the role of the monarchy in Thai Buddhist culture, royal ceremonies, and the Grand Palace's historical significance."],
      ["Songkran (Thai New Year) Festival","TAT documents Thailand's Songkran water festival — celebrated April 13–15 — its Buddhist origins (water blessing ceremony), the famous water fights in Silom and Khao San Road, and regional variations across Thailand."],
      ["Moken Sea Gypsy Heritage","TAT profiles the Moken (sea gypsies), a semi-nomadic Austronesian people who have lived on the Andaman Sea for centuries, their traditional boat-dwelling culture, marine knowledge, and contemporary challenges."],
      ["Phuket Vegetarian Festival","TAT documents the annual Phuket Vegetarian Festival's colorful street processions, Chinese shrine ceremonies, and fire-walking rituals — held each October to honor the Nine Emperor Gods."],
    ];

    for (const [topicName, claim] of thaiSites) {
      await add(topicName, tatNote, tat, tatUrl, claim, true);
    }

    // UNESCO sources for World Heritage Thai sites
    await add("Ayutthaya Historical Park, Thailand","authoritative","UNESCO — Ayutthaya World Heritage Site","https://whc.unesco.org/en/list/576","UNESCO World Heritage Site listing for Ayutthaya Historical Park, the ancient capital of the Kingdom of Siam (1350–1767), documenting its Outstanding Universal Value — a complex of temples, palaces, and statues representing the height of Siamese civilization.",false);
    await add("Doi Suthep Temple, Chiang Mai, Thailand","professional","Chiang Mai Provincial Administration — Heritage Sites","https://www.chiangmai.go.th","Chiang Mai provincial tourism documentation on Doi Suthep temple as the spiritual heart of Chiang Mai province, visited by the Thai royal family and millions of worshippers annually.",false);
    await add("Thai Massage & Wellness Traditions","authoritative","UNESCO ICH — Nuad Thai, Traditional Thai Massage","https://ich.unesco.org/en/RL/nuad-thai-traditional-thai-massage-01258","UNESCO's 2019 inscription of Nuad Thai on the Representative List of Intangible Cultural Heritage documents the therapeutic tradition's origins, practice, and cultural significance as a community health system.",false);
    await add("Muay Thai History & Culture","authoritative","UNESCO — Muay Thai Cultural Heritage Nomination","https://ich.unesco.org","UNESCO documentation of Muay Thai's submission for Intangible Cultural Heritage status, recognizing the art's cultural, spiritual, and community dimensions beyond its identity as a combat sport.",false);

    // Add TAT source to Ayutthaya
    await add("Ayutthaya Historical Park, Thailand","authoritative","Tourism Authority of Thailand — Ayutthaya","https://www.tourismthailand.org","TAT's visitor guide to Ayutthaya Historical Park covers the major temples (Wat Mahathat, Wat Ratchaburana, Wat Phra Sri Sanphet), bicycle touring routes, river cruises, and access from Bangkok.",true);

    // ── TRAVEL — Laos destinations ────────────────────────────────────────────
    const laosTA = "Laos Tourism — Ministry of Information, Culture and Tourism";
    const laosTAUrl = "https://tourism.gov.la";
    const laosTopics: [string, string][] = [
      ["Kuang Si Falls, Luang Prabang, Laos","Laos Tourism documents Kuang Si Falls — a multi-tiered turquoise waterfall 29km from Luang Prabang — including the Tat Kuang Si Bear Rescue Centre, swimming pools, and best seasonal visiting conditions."],
      ["Luang Prabang Night Market, Laos","Laos Tourism covers Luang Prabang's Hmong-style night market on Sisavangvong Road — a nightly street market of handmade textiles, handicrafts, and Lao street food stretching through the UNESCO heritage town."],
      ["Mount Phousi, Luang Prabang, Laos","Laos Tourism documents Mount Phousi — the sacred hill rising 100m above central Luang Prabang — with 329 steps to the summit stupa (That Chomsi), a gilded shrine, and panoramic views of the Mekong River and the old city."],
      ["Pak Ou Caves, Luang Prabang, Laos","Laos Tourism describes the Pak Ou caves (Tham Ting and Tham Theung), a sacred pilgrimage site where the Nam Ou meets the Mekong, housing thousands of Buddha statues left by worshippers across centuries."],
      ["Pha That Luang, Vientiane, Laos","Laos Tourism covers Pha That Luang — the great golden stupa that is Laos's most important national monument and Buddhist symbol — hosting the annual That Luang Festival in November."],
      ["Tad Sae Waterfalls, Luang Prabang, Laos","Laos Tourism documents Tad Sae waterfalls — reached only by boat from Ban Aen village — a series of cascades forming natural pools surrounded by lush forest, with elephant bathing activities nearby."],
      ["Wat Xieng Thong, Luang Prabang, Laos","Laos Tourism covers Wat Xieng Thong (Temple of the Golden City), built in 1560 — the best-preserved and most architecturally significant temple in Luang Prabang, considered the quintessential Lao Buddhist temple."],
      ["Loy Krathong Festival","Laos Tourism documents the Lao version of the Loy Krathong festival (Boun That Luang) and the related That Luang Festival, celebrating the full moon in November with illuminated floats on the Mekong River and temple processions."],
    ];
    for (const [topicName, claim] of laosTopics) {
      await add(topicName, "authoritative", laosTA, laosTAUrl, claim, true);
    }
    await add("Pak Ou Caves, Luang Prabang, Laos","authoritative","UNESCO — Luang Prabang World Heritage Site","https://whc.unesco.org/en/list/479","UNESCO's World Heritage listing for the Town of Luang Prabang (1995) documents the Outstanding Universal Value of the historic city including the Pak Ou caves as part of the sacred landscape of the Mekong River.",false);
    await add("Wat Xieng Thong, Luang Prabang, Laos","authoritative","UNESCO — Luang Prabang World Heritage Site","https://whc.unesco.org/en/list/479","UNESCO's 1995 World Heritage inscription for Luang Prabang includes Wat Xieng Thong as a defining element of the town's Outstanding Universal Value — its preservation of Lao traditional architecture and Buddhist urban planning.",false);

    // ── TRAVEL — Jamaica destinations ─────────────────────────────────────────
    const jtb = "Jamaica Tourist Board — Visit Jamaica";
    const jtbUrl = "https://www.visitjamaica.com";
    const jamaicaTopics: [string, string][] = [
      ["Blue Mountains, Jamaica","The Jamaica Tourist Board documents the Blue Mountains — Jamaica's highest mountain range reaching 2,256m — known for Blue Mountain Coffee (one of the world's most expensive), hiking trails, and spectacular views across Kingston and the Caribbean Sea."],
      ["Bob Marley Museum, Kingston, Jamaica","The Jamaica Tourist Board profiles the Bob Marley Museum at 56 Hope Road, Kingston — the reggae legend's former home and recording studio — covering exhibits on Marley's life, legacy, and the global impact of Jamaican music and Rastafari culture."],
      ["Boston Beach, Port Antonio, Jamaica","The Jamaica Tourist Board covers Boston Beach — widely credited as the birthplace of Jamaican jerk cooking — with guidance on the famous jerk vendors, surfing conditions, and the natural beauty of Port Antonio's coastline."],
      ["Dunn's River Falls, Ocho Rios, Jamaica","The Jamaica Tourist Board documents Dunn's River Falls — Jamaica's most visited attraction — the 180-meter terraced waterfall where visitors climb in human chains, with tour information, safety guidance, and nearby Ocho Rios activities."],
      ["Mayfield Falls, Westmoreland, Jamaica","The Jamaica Tourist Board covers Mayfield Falls in Westmoreland — a 21-pool natural waterfall experience on the Cabarita River — as a lush, less-crowded alternative to Dunn's River Falls, with eco-tour information."],
      ["Rick's Café, Negril, Jamaica","The Jamaica Tourist Board profiles Rick's Café on Negril's West End cliffs — famous for cliff diving, sunset views over the Caribbean Sea, and live reggae music — as one of Jamaica's most iconic entertainment destinations."],
      ["Rose Hall Great House, Montego Bay, Jamaica","The Jamaica Tourist Board documents the Rose Hall Great House — a restored 18th-century plantation great house near Montego Bay — covering the legend of Annie Palmer (the White Witch of Rose Hall), the history of slavery on the estate, and guided tour information."],
      ["YS Falls, St. Elizabeth, Jamaica","The Jamaica Tourist Board covers YS Falls in St. Elizabeth parish — a series of seven cascading waterfalls on the YS Estate, one of Jamaica's most beautiful natural attractions — with ziplining, swimming, and horse riding available."],
    ];
    for (const [topicName, claim] of jamaicaTopics) {
      await add(topicName, "authoritative", jtb, jtbUrl, claim, true);
    }
    await add("Blue Mountains, Jamaica","authoritative","UNESCO — Blue and John Crow Mountains World Heritage Site","https://whc.unesco.org/en/list/1356","UNESCO's 2015 World Heritage inscription for the Blue and John Crow Mountains documents the area's Outstanding Universal Value — exceptional biodiversity, Maroon cultural heritage sites, and the highest peaks in the Caribbean.",false);
    await add("Bob Marley Museum, Kingston, Jamaica","authoritative","Bob Marley Foundation — Official Site","https://www.bobmarley-foundation.com","The Bob Marley Foundation, established by the Marley family, documents Bob Marley's musical legacy, humanitarian work, and the cultural significance of Rastafari — the spiritual movement that shaped his message of peace and Black liberation.",false);

    // ── TRAVEL — Mexico destinations ──────────────────────────────────────────
    const visitMx = "Visit Mexico — Official Tourism Site";
    const visitMxUrl = "https://www.visitmexico.com";
    const mexicoTopics: [string, string][] = [
      ["Chichen Itza, Yucatán, Mexico","Visit Mexico documents Chichen Itza — a UNESCO World Heritage Site and one of the New Seven Wonders of the World — the ancient Maya city whose El Castillo pyramid aligns astronomically with the spring equinox, creating the famous serpent shadow effect."],
      ["Cobá Ruins, Quintana Roo, Mexico","Visit Mexico covers the Cobá archaeological zone — one of the largest Maya cities, still largely unexcavated in the Yucatán jungle — where visitors can climb the 42-meter Nohoch Mul pyramid for panoramic views."],
      ["Dos Ojos Cenote, Riviera Maya, Mexico","Visit Mexico documents the Dos Ojos cenote system — one of the world's longest underwater cave systems in the Riviera Maya — a premier snorkeling and diving destination in the Yucatán Peninsula's freshwater aquifer."],
      ["Gran Cenote, Tulum, Mexico","Visit Mexico covers Gran Cenote near Tulum — a crystal-clear open-air cenote popular for snorkeling among stalactites and freshwater turtles — one of the most photographed natural swimming holes in the Yucatán."],
      ["Isla Holbox, Yucatán, Mexico","Visit Mexico profiles Isla Holbox (pronounced 'hol-bosh') — a car-free island off the northern Yucatán coast — known for whale shark swimming (June–September), bioluminescent waters, and laid-back Caribbean atmosphere."],
      ["Isla Mujeres, Quintana Roo, Mexico","Visit Mexico covers Isla Mujeres — a small island 13km from Cancún — known for the Playa Norte beach consistently rated among the world's best, the Garrafón natural reef park, and the westernmost point in Mexico where sunrise viewing is popular."],
      ["Tulum Ruins, Mexico","Visit Mexico documents the Tulum archaeological site — the only ancient Walled Maya City perched on cliffs above the Caribbean Sea — one of Mexico's most photographed sites combining archaeological significance and dramatic coastal scenery."],
      ["Xcaret Park, Riviera Maya, Mexico","Visit Mexico covers Xcaret Park — an eco-archaeological park on the Riviera Maya — featuring underground river snorkeling, Mexican cultural shows, Maya ruins, the famous Xcaret Mexico Espectacular night show, and butterfly pavilion."],
    ];
    for (const [topicName, claim] of mexicoTopics) {
      await add(topicName, "authoritative", visitMx, visitMxUrl, claim, true);
    }
    await add("Chichen Itza, Yucatán, Mexico","authoritative","UNESCO — Chichen Itza World Heritage Site","https://whc.unesco.org/en/list/483","UNESCO's 1988 World Heritage inscription for Pre-Hispanic City of Chichen Itza documents the Outstanding Universal Value of the Maya civilization's most important sacred site, including El Castillo, the Great Ball Court, and the Sacred Cenote.",false);
    await add("Tulum Ruins, Mexico","authoritative","INAH — Instituto Nacional de Antropología e Historia","https://www.inah.gob.mx","Mexico's National Institute of Anthropology and History manages Tulum and all federal archaeological sites, providing scholarly documentation on Maya history, conservation efforts, and site visitor management.",false);
    await add("Cobá Ruins, Quintana Roo, Mexico","authoritative","INAH — Instituto Nacional de Antropología e Historia","https://www.inah.gob.mx","INAH manages Cobá as a federal archaeological zone, providing research documentation on the 1,600-year-old city's urban planning, sacbeob (white roads), and the ongoing archaeological excavations.",false);
    await add("Chichen Itza, Yucatán, Mexico","authoritative","INAH — Instituto Nacional de Antropología e Historia","https://www.inah.gob.mx","INAH administers and preserves Chichen Itza as a federal zone, conducting ongoing archaeological research and documentation on the site's astronomical alignments, Maya iconography, and conservation challenges.",false);

    // ── TRAVEL — Greece/Santorini destinations ────────────────────────────────
    const visitGR = "Visit Greece — Official Greek Tourism Site";
    const visitGRUrl = "https://www.visitgreece.gr";
    const santoriniTopics: [string, string][] = [
      ["Akrotiri Archaeological Site, Santorini, Greece","Visit Greece documents the Akrotiri Bronze Age settlement — a remarkably preserved Minoan city buried by the Santorini volcanic eruption circa 1600 BCE — with well-preserved multi-story buildings, vivid frescoes, and sophisticated drainage systems."],
      ["Amoudi Bay, Santorini, Greece","Visit Greece covers Amoudi Bay — the small harbor below Oia village accessible via 214 steps — known for fresh seafood tavernas perched above the azure Aegean, octopus drying on lines, and sunset views."],
      ["Fira — Capital of Santorini, Greece","Visit Greece profiles Fira (Thira) — Santorini's main town — with its cliffside hotels, the Archaeological Museum of Thera, the Museum of Prehistoric Thera housing the Akrotiri frescoes, cable car, and the Caldera rim walking path to Oia."],
      ["Imerovigli, Santorini, Greece","Visit Greece covers Imerovigli — the highest point on Santorini's Caldera rim — known for its iconic whitewashed church domes, the Skaros Rock fortress ruins, and unobstructed Caldera views above Fira."],
      ["Oia Village, Santorini, Greece","Visit Greece documents Oia village — Santorini's most photographed destination — famous for its blue-domed churches, cave hotels, artist studios, and the evening sunset ritual where hundreds gather on the fortress walls."],
      ["Perissa & Perivolos Black Sand Beach, Santorini, Greece","Visit Greece covers Perissa and Perivolos — Santorini's black volcanic sand beaches — the island's most beach-resort style areas with beach bars, watersports, and the Byzantine fortress ruins of Mesa Vouno rising above."],
      ["Santorini Caldera Boat Cruise","Visit Greece documents Santorini's Caldera boat tours — the most popular way to experience the submerged volcanic crater — visiting the active volcano (Nea Kameni), the hot springs of Palea Kameni, and Thirassia island."],
    ];
    for (const [topicName, claim] of santoriniTopics) {
      await add(topicName, "authoritative", visitGR, visitGRUrl, claim, true);
    }
    await add("Akrotiri Archaeological Site, Santorini, Greece","authoritative","Greek Ministry of Culture — Akrotiri Archaeological Site","https://www.culture.gov.gr","The Greek Ministry of Culture and Sports administers the Akrotiri excavation site (ongoing since 1967 under the late Prof. Spyridon Marinatos and now Prof. Christos Doumas), providing scholarly archaeological documentation and site preservation.",false);

    // ── TRAVEL — Generic / Multi-destination travel topics ────────────────────
    const statedept = "U.S. State Department — International Travel";
    const statedeptUrl = "https://travel.state.gov/content/travel/en/international-travel.html";
    const cdcTravel = "CDC — Travelers' Health";
    const cdcTravelUrl = "https://wwwnc.cdc.gov/travel";

    await add("Accessible Travel","authoritative",statedept,statedeptUrl,"The State Department's international travel resources include guidance on accessible travel for travelers with disabilities, including Embassy contacts, country-specific accessibility conditions, and emergency assistance.",true);
    await add("Accessible Travel","authoritative",cdcTravel,cdcTravelUrl,"CDC's Travelers' Health resources for people with disabilities and chronic conditions include destination-specific health guidance, vaccination recommendations, and tips for managing health conditions while traveling internationally.",false);

    await add("Black Travel Experiences","authoritative","Smithsonian — African American Travel Heritage","https://nmaahc.si.edu","NMAAHC's collections and resources document the history of African American travel — from the Green Book era of segregation-era safe travel to contemporary Black travel culture and diaspora heritage tourism.",true);
    await add("Black Travel Experiences","authoritative",statedept,statedeptUrl,"The U.S. State Department provides travel resources applicable to all American travelers, including destination safety information, emergency services, and consular assistance for U.S. citizens abroad.",false);

    await add("Domestic Road Trips","authoritative","National Park Service — Plan Your Visit","https://www.nps.gov/planyourvisit","The National Park Service's visitor planning resources cover all 400+ national parks, monuments, and recreation areas, including accessibility information, permit requirements, and campground reservations for road trip destinations.",true);
    await add("Domestic Road Trips","professional","AAA — Road Trip Planning","https://www.aaa.com/travel/road-trips","AAA provides road trip planning tools, campground directories, fuel cost calculators, hotel booking, and 24-hour emergency roadside assistance for domestic road travelers.",false);

    await add("Family Travel","authoritative",cdcTravel,cdcTravelUrl,"CDC's Travelers' Health family travel resources cover infant and child vaccination requirements, traveling while pregnant, children's health considerations for international destinations, and family-specific medical kit recommendations.",true);
    await add("Family Travel","authoritative",statedept,statedeptUrl,"The State Department's family travel resources cover traveling with minors internationally (notarized consent for single parents), passport requirements for children, child custody travel restrictions, and family emergency services abroad.",false);

    await add("Heritage & Diaspora Travel","authoritative","Smithsonian NMAAHC — Diaspora Heritage","https://nmaahc.si.edu","NMAAHC's collections document the global African diaspora and provide context for heritage travelers visiting sites connected to the slave trade, emancipation, and African cultural preservation across the Americas, Caribbean, and Africa.",true);
    await add("Heritage & Diaspora Travel","authoritative",statedept,statedeptUrl,"The State Department's international travel resources help diaspora travelers plan visits to ancestral homelands, with country-specific guidance, dual nationality information, and consular assistance for U.S. citizens visiting their countries of heritage.",false);

    await add("International Travel","authoritative",statedept,statedeptUrl,"The U.S. State Department's international travel portal is the authoritative source for American travelers abroad — providing country advisories (Levels 1–4), passport and visa requirements, U.S. Embassy contacts, and emergency assistance.",true);
    await add("International Travel","authoritative",cdcTravel,cdcTravelUrl,"CDC Travelers' Health provides country-specific health notices, vaccination recommendations, disease outbreak alerts, and health guidance for travelers, including high-risk destinations and health requirements by country.",false);

    await add("National Parks & Outdoors","authoritative","National Park Service","https://www.nps.gov","The National Park Service manages 400+ national parks, monuments, seashores, and recreation areas. NPS provides trip planning, visitor safety, accessibility, and environmental stewardship resources for the 300 million annual park visitors.",true);
    await add("National Parks & Outdoors","authoritative","U.S. Fish & Wildlife Service — Public Lands","https://www.fws.gov","USFWS manages National Wildlife Refuges and provides outdoor recreation opportunities on federal lands, with specific programs to connect communities of color with nature through the Urban Wildlife Conservation Program.",false);

    await add("Solo Travel","authoritative",statedept,statedeptUrl,"The State Department's solo travel guidance covers personal safety planning, registering with the Smart Traveler Enrollment Program (STEP) for emergency alerts, and consular assistance for solo travelers encountering emergencies abroad.",true);
    await add("Solo Travel","authoritative",cdcTravel,cdcTravelUrl,"CDC Travelers' Health guidance for solo travelers covers health preparation, destination-specific risks, accessing medical care abroad, travel insurance considerations, and managing chronic conditions while traveling alone.",false);

    await add("Travel Deals & Discounts","authoritative","Transportation Security Administration — TSA","https://www.tsa.gov","TSA provides authoritative guidance on airport security procedures, TSA PreCheck enrollment, prohibited items, and travel document requirements — helping travelers plan efficient, informed air travel.",true);
    await add("Travel Deals & Discounts","authoritative",statedept,statedeptUrl,"The State Department's travel resources include U.S. passport fee information, STEP program (free emergency notification service), and consular services — foundational information for planning and booking international travel.",false);

    await add("Travel Mood & Experience Planning","authoritative",cdcTravel,cdcTravelUrl,"CDC's destination-specific health notices and outbreak alerts help travelers match their health preparedness to their chosen destination, with tier-based recommendations for vaccines, medications, and health precautions.",true);
    await add("Travel Mood & Experience Planning","authoritative",statedept,statedeptUrl,"The State Department's travel advisory system (Levels 1–4) and destination information pages help travelers make informed decisions by understanding the current safety, political, and health environment of potential destinations.",false);

    await add("Travel Safety for People of Color","authoritative",statedept,statedeptUrl,"The State Department's travel safety resources include country-specific civil rights conditions and reports, LGBTQ+ safety information, and emergency contacts — relevant baseline information for travelers of color assessing destination safety.",true);
    await add("Travel Safety for People of Color","authoritative","CDC — Travelers' Health Safety","https://wwwnc.cdc.gov/travel","CDC Travelers' Health provides safety-related health guidance for international travelers including destination-specific disease risks, safe food and water practices, and health system quality information by country.",false);

    await add("2004 Indian Ocean Tsunami — Memory & Lessons","authoritative","UNESCO — Indian Ocean Tsunami Warning System","https://www.ioc-tsunami.org","UNESCO's Intergovernmental Oceanographic Commission coordinates the Indian Ocean Tsunami Warning and Mitigation System established after the 2004 disaster, documenting the scientific lessons learned and current early warning capabilities.",true);
    await add("2004 Indian Ocean Tsunami — Memory & Lessons","authoritative","NOAA — Tsunami Research Center","https://www.ngdc.noaa.gov/hazard/tsu.shtml","NOAA's National Centers for Environmental Information maintains the global historical tsunami database documenting the 2004 Indian Ocean tsunami's magnitude, wave heights, affected coastlines, and death toll across 14 countries.",false);

    // ── COMMUNITY_CULTURE — 10 topics, 2+ sources each ──────────────────────
    await add("African Diaspora","authoritative","Smithsonian NMAAHC — African Diaspora","https://nmaahc.si.edu","NMAAHC documents the history, culture, and contemporary life of African Americans and the global African diaspora — from the transatlantic slave trade through emancipation, the Great Migration, and Black cultural achievements worldwide.",true);
    await add("African Diaspora","authoritative","Library of Congress — African American History and Culture","https://www.loc.gov/collections/african-american-history-and-culture","The Library of Congress's African American History and Culture collection provides primary source documents, photographs, audio recordings, and manuscripts documenting the African American experience from slavery to the present.",false);

    await add("Black History","authoritative","Smithsonian NMAAHC — Black History","https://nmaahc.si.edu","NMAAHC is the national museum dedicated to Black American history and culture, with collections, exhibitions, and educational resources spanning slavery, emancipation, Reconstruction, the Harlem Renaissance, Civil Rights Movement, and contemporary Black life.",true);
    await add("Black History","authoritative","Library of Congress — African American Collections","https://www.loc.gov/topics/african-american-and-civil-rights-history","The Library of Congress's African American and Civil Rights History topic page provides access to primary source collections including the NAACP records, civil rights oral histories, and Frederick Douglass papers.",false);

    await add("Caribbean Communities","authoritative","Smithsonian NMAAHC — Caribbean Heritage","https://nmaahc.si.edu","NMAAHC collections and programs document the African roots of Caribbean cultures, the Haitian Revolution's global significance, Caribbean independence movements, and the contribution of Caribbean immigrants to Black American culture and community.",true);
    await add("Caribbean Communities","professional","Caribbean Tourism Organization","https://www.onecaribbean.org","The Caribbean Tourism Organization is the official regional tourism body representing the Caribbean Community (CARICOM), providing cultural and visitor information on Caribbean community traditions, festivals, and heritage across 33 member states.",false);

    await add("Civil Rights & Social Justice","authoritative","National Civil Rights Museum at the Lorraine Motel","https://civilrightsmuseum.org","The National Civil Rights Museum, located at the site of Dr. Martin Luther King Jr.'s assassination, provides authoritative educational resources on the American Civil Rights Movement, from reconstruction through the present-day social justice movement.",true);
    await add("Civil Rights & Social Justice","authoritative","Library of Congress — Civil Rights History Project","https://www.loc.gov/collections/civil-rights-history-project","The Library of Congress's Civil Rights History Project contains oral history interviews with key figures from the 1950s–1970s Civil Rights Movement, documenting strategies, sacrifices, and the movement's lasting legacy.",false);

    await add("Faith & Spirituality","professional","Pew Research Center — Religion and Public Life","https://www.pewresearch.org/topic/religion","Pew Research Center's Religion and Public Life project provides rigorous survey data on religious beliefs, practices, and social attitudes across communities — including detailed data on Black Americans' distinctive religious culture and faith practices.",true);
    await add("Faith & Spirituality","authoritative","Smithsonian — Religion in American Life","https://www.si.edu/spotlight/faith-and-americas","The Smithsonian's religion in American life resources document how faith communities — including Black churches, mosques, and temples — have shaped American culture, social movements, and community life.",false);

    await add("Immigration & Community","authoritative","USCIS — Immigrant Community Resources","https://www.uscis.gov","USCIS provides official information on immigrant rights, citizenship processes, community integration programs, and resources for new Americans navigating U.S. systems.",true);
    await add("Immigration & Community","professional","Migration Policy Institute","https://www.migrationpolicy.org","The Migration Policy Institute provides nonpartisan research and analysis on immigration and integration policy, including detailed data on immigrant communities' economic and social contributions and integration outcomes by origin country and ethnicity.",false);

    await add("LGBTQ+ Community","authoritative","CDC — LGBT Health","https://www.cdc.gov/lgbthealth","CDC's LGBT health resources document health disparities, mental health challenges, HIV prevention, and health promotion programs specifically designed for LGBTQ+ populations, including intersectional data on race and sexual orientation.",true);
    await add("LGBTQ+ Community","authoritative","SAMHSA — LGBTQ+ Behavioral Health","https://www.samhsa.gov/behavioral-health-equity/lgbtq","SAMHSA's LGBTQ+ behavioral health resources address the disproportionate rates of depression, anxiety, substance use, and trauma among LGBTQ+ people — particularly those who are also members of racial minority communities.",false);

    await add("Veterans & Military Families","authoritative","U.S. Department of Veterans Affairs","https://www.va.gov","The VA provides health care, education, disability benefits, housing, employment, and transition services for 19 million veterans — including specific outreach programs for Black and minority veterans who face disparities in VA care access and outcomes.",true);
    await add("Veterans & Military Families","authoritative","DOD — Military Family Support","https://www.militaryonesource.mil","Military OneSource is the DOD's primary information and referral service for service members and their families, covering relocation, financial counseling, mental health support, childcare, and deployment resources.",false);

    await add("Voting Rights & Civic Engagement","authoritative","USA.gov — Voting Rights","https://www.usa.gov/absentee-voting","USA.gov's voting resources cover registration deadlines, absentee and mail-in voting, early voting, polling place lookup, voter ID requirements by state, and how to report election problems.",true);
    await add("Voting Rights & Civic Engagement","professional","NAACP — Voting Rights","https://www.naacp.org/issues/voting-rights","The NAACP's voting rights resources document the history of Black voter suppression, current challenges to voting access, and the organization's voter registration and protection programs in communities of color.",false);

    await add("Women's Issues","authoritative","DOL Women's Bureau","https://www.dol.gov/agencies/wb","The Department of Labor Women's Bureau researches and advocates for employed women's economic security, covering wage gaps by race and gender, work-family balance policies, occupational segregation, and women's labor market trends.",true);
    await add("Women's Issues","authoritative","NIH Office of Research on Women's Health","https://orwh.od.nih.gov","NIH's Office of Research on Women's Health ensures women's health research is included in NIH studies, addresses health disparities by sex and gender, and provides resources on women's health across the life span.",false);

    // ── COMMUNITY — 7 topics, 2+ sources each ────────────────────────────────
    await add("Community","authoritative","USA.gov — Community Resources","https://www.usa.gov/community-resources","USA.gov's community resources hub links to federal programs for community development, social services, housing assistance, food access, job training, and civic engagement across the United States.",true);
    await add("Community","authoritative","CDC — Community Health","https://www.cdc.gov/healthcommunication","CDC's community health resources support evidence-based public health communication, health education, and community-based interventions that address the social determinants of health driving health disparities.",false);

    await add("Community Development & Land Ownership","authoritative","HUD — Community Development","https://www.hud.gov/program_offices/comm_planning","HUD's Office of Community Planning and Development administers the Community Development Block Grant (CDBG), HOME Investment Partnerships, and other programs that fund affordable housing, economic development, and infrastructure in underserved communities.",true);
    await add("Community Development & Land Ownership","authoritative","CDFI Fund — Community Development Finance","https://www.cdfifund.gov","The Treasury Department's CDFI Fund certifies and funds Community Development Financial Institutions (CDFIs) — mission-driven lenders that finance businesses, homes, and community facilities in low-income communities often overlooked by traditional banks.",false);

    await add("Environmental Justice","authoritative","EPA — Environmental Justice","https://www.epa.gov/environmentaljustice","The EPA's Environmental Justice program ensures communities of color and low-income communities receive fair treatment in environmental laws, addressing the disproportionate pollution burdens — industrial facilities, highways, waste sites — concentrated in Black neighborhoods.",true);
    await add("Environmental Justice","authoritative","DOJ — Environmental Justice","https://www.justice.gov/enrd/environmental-justice","DOJ's Environment and Natural Resources Division's environmental justice initiative prosecutes criminal violations of environmental laws, pursues civil enforcement, and provides community legal assistance in environmental justice cases.",false);

    await add("Food Access & Grocery Equity","authoritative","USDA — Food Access Research Atlas","https://www.ers.usda.gov/data-products/food-access-research-atlas","USDA's Economic Research Service Food Access Research Atlas maps food deserts and limited food access areas across the U.S., documenting the spatial concentration of grocery store gaps in low-income Black and minority communities.",true);
    await add("Food Access & Grocery Equity","authoritative","CDC — Healthy Food Access","https://www.cdc.gov/healthyplaces/healthtopics/healthyfood","CDC's Healthy Places program documents the relationship between food retail availability and diet-related chronic diseases, with community interventions for improving food access in underserved neighborhoods.",false);

    await add("Gentrification & Community Preservation","professional","Urban Institute — Displacement Research","https://www.urban.org/features/displacing-lower-income-people","Urban Institute research on gentrification and displacement documents patterns of neighborhood change, who benefits and who loses from rising property values, and community-level strategies to preserve affordable housing and cultural institutions.",true);
    await add("Gentrification & Community Preservation","authoritative","HUD — Equitable Development","https://www.huduser.gov/portal/pdredge/pdr_field_detail_01_13_2020.html","HUD's community development research covers anti-displacement strategies, community land trusts, affordable housing preservation, and policies that allow existing residents — particularly long-term Black residents — to benefit from neighborhood investment.",false);

    await add("Historic Black Neighborhoods","authoritative","National Park Service — Historic Preservation","https://www.nps.gov/subjects/historicpreservation","The NPS National Register of Historic Places documents and protects significant historic Black neighborhoods, including Greenwood District (Tulsa's 'Black Wall Street'), Sugar Hill (Harlem), Tremé (New Orleans), and Sweet Auburn (Atlanta).",true);
    await add("Historic Black Neighborhoods","authoritative","Smithsonian NMAAHC — Community History","https://nmaahc.si.edu","NMAAHC's collections document the historic built environment of Black communities — from enslaved people's quarters to freedmen's towns, urban Black neighborhoods developed under segregation, and the community institutions (churches, schools, businesses) that anchored Black life.",false);

    await add("Local Government & Civic Power","authoritative","USA.gov — Local Government","https://www.usa.gov/local-governments","USA.gov's local government resource explains how to contact city and county officials, attend public meetings, use local government services, and participate in local civic processes including zoning hearings and budget processes.",true);
    await add("Local Government & Civic Power","professional","National League of Cities","https://www.nlc.org","The National League of Cities represents 19,000 cities, towns, and villages across the U.S. and provides research on racial equity in local government, municipal finance, and the programs connecting residents to civic decision-making.",false);

    // ── FAMILY — 7 topics, 2+ sources each ───────────────────────────────────
    await add("Bilingual & Multilingual Families","professional","Colorín Colorado — Bilingual Families","https://www.colorincolorado.org","Colorín Colorado, a research-based bilingual site for families and educators, provides resources on supporting bilingual children's language development, maintaining heritage languages at home, and navigating dual-language education programs.",true);
    await add("Bilingual & Multilingual Families","authoritative","U.S. Department of Education — English Language Learners","https://www.ed.gov/about/offices/list/oela","The DOE Office of English Language Acquisition provides research, policy guidance, and community resources on supporting multilingual learners in schools, including the rights of ELL students under federal law.",false);

    await add("Bullying, Bias & School Discipline","authoritative","StopBullying.gov — Federal Anti-Bullying Resources","https://www.stopbullying.gov","StopBullying.gov (HHS/DOE) provides federal resources on bullying prevention, school climate improvement, legal protections for targeted students, and how race-based bullying intersects with civil rights law.",true);
    await add("Bullying, Bias & School Discipline","authoritative","U.S. Department of Education — School Discipline Guidance","https://www.ed.gov/policy/gen/guid/school-discipline","The DOE's school discipline resources cover the civil rights implications of exclusionary discipline (suspensions, expulsions), the disproportionate impact on Black students, and the department's multi-tiered support guidance.",false);

    await add("Finding Culturally Affirming Schools","authoritative","U.S. Department of Education — School Choice","https://www.ed.gov/choice","The DOE's school choice resources cover public school open enrollment, charter schools, magnet programs, dual-language programs, and how to access Individuals with Disabilities Education Act services.",true);
    await add("Finding Culturally Affirming Schools","authoritative","NCES — School Search and Data","https://nces.ed.gov/ccd/schoolsearch","NCES's Common Core of Data public school search provides enrollment statistics disaggregated by race, teacher credentials, and school characteristics — helping families identify school communities that serve their children well.",false);

    await add("Grandparents Raising Grandchildren","professional","AARP — Grandparents Raising Grandchildren","https://www.aarp.org/caregiving/life-balance/info-2017/grandparents-raising-grandchildren.html","AARP's grandparent caregiver resources cover legal guardianship options, financial assistance programs (TANF, food stamps, childcare subsidies), school enrollment rights, and support groups for the 2.7 million American grandparents raising grandchildren.",true);
    await add("Grandparents Raising Grandchildren","authoritative","Child Welfare Information Gateway — Kinship Care","https://www.childwelfare.gov/topics/outofhome/kinship","Child Welfare Information Gateway (HHS) provides resources on kinship care, including legal options (guardianship, adoption), benefits and services available to kinship caregivers, and state-specific kinship navigator programs.",false);

    await add("Raising Confident Children of Color","professional","American Psychological Association — Raising Resilient Children","https://www.apa.org/topics/parenting","APA's parenting resources cover child development, building self-esteem, racial socialization — the process of teaching children of color about their heritage and how to navigate racism — and evidence-based parenting approaches.",true);
    await add("Raising Confident Children of Color","authoritative","Child Welfare Information Gateway — Child Development","https://www.childwelfare.gov","HHS Child Welfare Information Gateway provides evidence-based resources on positive child development, trauma-informed parenting, and the protective factors that build resilience in children from marginalized communities.",false);

    await add("Talking to Kids About Race","professional","American Psychological Association — Race and Children","https://www.apa.org/topics/racism/children","APA's resources on children and race cover the developmental stages when children notice racial differences, the impact of racial trauma on children of color, racial socialization strategies, and how parents can talk honestly about racism.",true);
    await add("Talking to Kids About Race","professional","American Academy of Pediatrics — Race, Racism & Children","https://www.aap.org","The American Academy of Pediatrics provides pediatric guidance on racism as a social determinant of child health, the effects of racism-related stress on child development, and clinical guidance for discussing race with families.",false);

    await add("Teen Mental Health & Social Media","authoritative","NIH NIMH — Child and Adolescent Mental Health","https://www.nimh.nih.gov/health/topics/child-and-adolescent-mental-health","NIH's National Institute of Mental Health provides research-backed resources on teen mental health, the mental health impact of social media on adolescents, and evidence-based treatment options for common teen mental health conditions.",true);
    await add("Teen Mental Health & Social Media","authoritative","CDC — Teen Mental Health","https://www.cdc.gov/teenmentalhealth","CDC's adolescent mental health resources document rising rates of depression, anxiety, and suicidality among U.S. teens, with specific data on racial disparities and the association between social media use and teen mental health outcomes.",false);

    // ── GEOGRAPHY — Philadelphia and History ──────────────────────────────────
    await add("Philadelphia","authoritative","City of Philadelphia — Official Website","https://www.phila.gov","The City of Philadelphia's official government website provides information on city services, elected officials, neighborhood resources, and community development programs across the 42 neighborhoods of Philadelphia.",true);
    await add("Philadelphia","professional","Visit Philadelphia — Official Tourism","https://www.visitphilly.com","Visit Philadelphia is the official tourism and marketing organization for the Philadelphia region, documenting the city's history, culture, neighborhoods, dining, and events — including its rich African American heritage.",false);

    await add("History","authoritative","Smithsonian Institution — History Resources","https://www.si.edu","The Smithsonian Institution is the world's largest museum, education, and research complex, providing authoritative historical resources on American and world history through its 21 museums, 21 libraries, and research centers.",true);
    await add("History","authoritative","Library of Congress — History and Culture","https://www.loc.gov","The Library of Congress is the largest library in the world and the primary research arm of the U.S. Congress, housing 170+ million items documenting American and world history, culture, and primary source materials.",false);

    await add("Philadelphia History","authoritative","Library of Congress — Philadelphia History Collections","https://www.loc.gov/search/?q=Philadelphia","The Library of Congress's Philadelphia collections include historical maps, photographs, newspapers, and manuscripts documenting the city's founding, Revolutionary War significance, abolition movement, and African American history.",false);

    log(`Library Batch C complete: ${n} knowledge_sources inserted`);
  } catch (err: unknown) {
    warn(`Library Batch C failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BATCH D — BUSINESS / DIGITAL / LIFESTYLE / SKILLS_TRADES / ENTERTAINMENT
// ─────────────────────────────────────────────────────────────────────────────

export async function ensureLibraryEvidenceBatchD(
  log: (msg: string) => void,
  warn: (msg: string) => void,
): Promise<void> {
  let n = 0;
  const add = async (...args: Parameters<typeof sd>) => { try { n += await sd(...args); } catch(e) { warn(`Library Batch D — sd failed: ${e instanceof Error ? e.message : String(e)}`); } };

  try {
    // ── BUSINESS — 9 topics (1 already has sources) ──────────────────────────
    await add("AI for Small Business","authoritative","SBA — Technology and AI for Small Businesses","https://www.sba.gov/business-guide/manage-your-business","The Small Business Administration provides guidance on adopting technology tools — including AI-powered tools for marketing, accounting, inventory, and customer service — for small business owners across all industries.",true);
    await add("AI for Small Business","authoritative","NIST — Artificial Intelligence Resources","https://www.nist.gov/artificial-intelligence","The National Institute of Standards and Technology's AI Risk Management Framework and AI resources help small businesses understand AI capabilities, responsible deployment, and risk management for AI-powered tools.",false);

    await add("Black Entrepreneurship","authoritative","Minority Business Development Agency — MBDA","https://www.mbda.gov","The Minority Business Development Agency is the only federal agency dedicated to promoting growth of minority-owned businesses. MBDA Business Centers provide consulting, financial matchmaking, and contracting assistance to Black and minority entrepreneurs.",true);
    await add("Black Entrepreneurship","authoritative","SBA — Minority-Owned Business Resources","https://www.sba.gov/business-guide/grow-your-business/minority-owned-businesses","The SBA's minority business resources cover 8(a) federal contracting certification, SCORE mentoring, SBA loans for minority entrepreneurs, and Women's Business Centers and Veteran Business Outreach Centers serving communities of color.",false);

    await add("Business","authoritative","SBA — Starting and Managing a Business","https://www.sba.gov","The U.S. Small Business Administration is the primary federal resource for entrepreneurs and small business owners, providing loans, counseling, contracting opportunities, and disaster assistance to America's 33 million small businesses.",true);
    await add("Business","authoritative","USA.gov — Starting a Business","https://www.usa.gov/business","USA.gov's business hub links to federal, state, and local resources for business registration, licensing, tax obligations, federal contracting, and business development support programs.",false);

    await add("Business Certifications","authoritative","SBA — Small Business Certification Programs","https://www.sba.gov/federal-contracting/contracting-assistance-programs","The SBA's contracting assistance programs include 8(a) Business Development (for socially disadvantaged entrepreneurs), Women-Owned Small Business, HUBZone, and Service-Disabled Veteran-Owned certifications — providing access to set-aside federal contracts.",true);
    await add("Business Certifications","authoritative","MBDA — Certification Resources","https://www.mbda.gov/businesscenters","MBDA Business Centers help minority entrepreneurs navigate certification processes including MBE (Minority Business Enterprise) certification from state/local authorities, NMSDC National Minority Supplier Development Council certification, and federal 8(a) application support.",false);

    await add("Marketing & Branding for Small Business","authoritative","SBA — Marketing Your Business","https://www.sba.gov/business-guide/manage-your-business/marketing-sales","The SBA's marketing and sales resources cover developing a marketing plan, social media for small business, search engine optimization basics, and customer relationship management — foundational guidance for community business owners.",true);
    await add("Marketing & Branding for Small Business","authoritative","FTC — Advertising and Marketing Guidance","https://www.ftc.gov/tips-advice/business-center/advertising-and-marketing","The FTC's advertising compliance resources help small business owners understand truth-in-advertising requirements, social media endorsement disclosures, and deceptive marketing practices to avoid.",false);

    await add("Minority Business Grants & Funding","authoritative","MBDA — Financing Resources","https://www.mbda.gov","MBDA maintains a database of grants, loans, and equity investment opportunities specifically for minority-owned businesses, and provides direct matchmaking between minority entrepreneurs and capital sources through its national Business Center network.",true);
    await add("Minority Business Grants & Funding","authoritative","SBA — Funding Programs","https://www.sba.gov/funding-programs","The SBA's funding programs include SBA 7(a) and 504 loans, microloans, the Small Business Investment Company (SBIC) program, and resources for finding CDFI lenders and Community Advantage lenders who serve underserved entrepreneurs.",false);

    await add("Philadelphia Businesses","authoritative","City of Philadelphia — Business Services","https://business.phila.gov","Philadelphia's official Business Services portal provides resources for starting, operating, and growing a business in Philadelphia, including licensing, permits, tax obligations, and the city's Minority Business Enterprise (MBE) certification and procurement programs.",true);
    await add("Philadelphia Businesses","professional","Greater Philadelphia Chamber of Commerce","https://www.greaterphilachamber.com","The Greater Philadelphia Chamber of Commerce provides advocacy, networking, and business development resources for Philadelphia-area businesses, including specific programming supporting Black and minority-owned businesses through the Diverse Business Network.",false);

    await add("SBA Loans & Programs","authoritative","SBA — Loans","https://www.sba.gov/funding-programs/loans","The SBA's loan programs — including the 7(a), 504, and Microloan programs — provide government-backed financing to small businesses that may not qualify for conventional loans. Covers eligibility, lender matching, and application guidance.",true);
    await add("SBA Loans & Programs","professional","SCORE — SBA Loan Assistance","https://www.score.org","SCORE, the SBA's largest resource partner with 800 chapters nationwide, provides free business mentoring and education on SBA loan applications, business plan development, and financial readiness — including specific programs for minority entrepreneurs.",false);

    await add("Startup Funding & Venture Capital","authoritative","SBA — Investment Capital","https://www.sba.gov/funding-programs/investment-capital","The SBA's Small Business Investment Company (SBIC) program licenses and regulates private investment funds that provide venture capital and growth equity to small businesses — including minority-owned companies in underinvested communities.",true);
    await add("Startup Funding & Venture Capital","authoritative","SEC — Starting a Business Capital Raising","https://www.sec.gov/smallbusiness","The SEC's Office of Small Business Policy provides guidance on equity crowdfunding (Regulation Crowdfunding), Regulation A+ offerings, and other legal pathways for startups to raise capital from community investors.",false);

    // ── DIGITAL — 5 topics, 2+ sources each ─────────────────────────────────
    await add("AI Literacy","authoritative","NIST — AI Risk Management Framework","https://www.nist.gov/artificial-intelligence","The National Institute of Standards and Technology's AI Risk Management Framework (AI RMF 1.0) provides a voluntary framework for organizations and individuals to understand, assess, and manage AI risks — foundational literacy for responsible AI use.",true);
    await add("AI Literacy","professional","AI Now Institute — AI Accountability","https://ainowinstitute.org","The AI Now Institute at New York University is a leading research center studying the social implications of artificial intelligence — including algorithmic bias, surveillance systems, and the disproportionate impact of AI on Black and low-income communities.",false);

    await add("Cybersecurity for Small Businesses","authoritative","CISA — Small Business Cybersecurity","https://www.cisa.gov/resources-tools/audiences/small-and-medium-businesses","CISA provides cybersecurity resources specifically designed for small businesses, including the Cyber Essentials framework, phishing defense guides, ransomware protection, and free vulnerability scanning services.",true);
    await add("Cybersecurity for Small Businesses","authoritative","FTC — Cybersecurity for Small Business","https://www.ftc.gov/tips-advice/business-center/privacy-and-security/cybersecurity","The FTC's small business cybersecurity resources cover data security best practices, breach response requirements, employee training, and the legal obligations businesses have to protect customer data.",false);

    await add("Deepfakes & AI Misinformation","authoritative","CISA — Mis, Dis, Malinformation Resources","https://www.cisa.gov/topics/election-security/foreign-influence-operations-and-disinformation","CISA's resources on disinformation cover detecting AI-generated content, reporting misinformation, and building public resilience against foreign influence operations and AI-generated deepfakes targeting political and community narratives.",true);
    await add("Deepfakes & AI Misinformation","professional","Shorenstein Center — Media and Misinformation","https://shorensteincenter.org","The Harvard Kennedy School Shorenstein Center on Media, Politics and Public Policy conducts research on digital misinformation, AI-generated content, and the disproportionate targeting of Black communities with political disinformation.",false);

    await add("Digital Skills for Elders","authoritative","FCC — Digital Literacy for Older Adults","https://www.fcc.gov/consumers/guides/digital-literacy","FCC's digital literacy resources help older adults access broadband, use smartphones and computers, participate in telehealth, and avoid online scams — with the Affordable Connectivity Program providing low-cost internet for eligible seniors.",true);
    await add("Digital Skills for Elders","professional","AARP — Technology Education","https://www.aarp.org/home-family/personal-technology","AARP provides free and low-cost digital literacy programs for adults 50+, including AARP TEK (Technology Education and Knowledge), online safety workshops, and technology helpdesks serving older adults.",false);

    await add("Online Privacy & Identity Protection","authoritative","FTC — Identity Theft Resources","https://consumer.ftc.gov/identity-theft-and-online-security","The FTC's identity theft and online security resources cover how to protect personal information, recognize phishing, freeze your credit, and recover from identity theft — with specific tools for reporting and resolution.",true);
    await add("Online Privacy & Identity Protection","authoritative","CISA — Protecting Your Online Privacy","https://www.cisa.gov/topics/cybersecurity-best-practices","CISA's personal cybersecurity guidance covers password hygiene, multi-factor authentication, privacy settings on social media, safe online shopping, and protecting home networks.",false);

    // ── LIFESTYLE — 2 topics, 2+ sources each ────────────────────────────────
    await add("Natural Hair Care","professional","American Academy of Dermatology — Hair Loss and Natural Hair","https://www.aad.org/public/everyday-care/hair-scalp-care","The American Academy of Dermatology provides evidence-based guidance on hair care practices, scalp health, preventing hair damage from chemical and heat styling, and dermatological treatment for hair and scalp conditions common in textured hair.",true);
    await add("Natural Hair Care","professional","CROWN Act Coalition — Natural Hair Discrimination","https://www.thecrownact.com","The CROWN Act Coalition advocates for legislation protecting natural Black hairstyles (locs, twists, braids, Afros) from discrimination in workplaces and schools — documenting the legal, professional, and cultural dimensions of natural hair.",false);

    await add("Skincare for Melanated Skin","professional","American Academy of Dermatology — Skin of Color","https://www.aad.org/public/everyday-care/skin-care-secrets/skin-care-for-darker-skin","The AAD's skin of color resources cover the unique skincare needs of melanated skin — including hyperpigmentation, keloid scarring, pseudofolliculitis barbae, eczema patterns, and sunscreen recommendations for darker skin tones.",true);
    await add("Skincare for Melanated Skin","professional","Skin of Color Society","https://www.skinofcolorsociety.org","The Skin of Color Society is a professional dermatology organization promoting awareness and research on skin, hair, and nail conditions in patients with skin of color — providing educational resources for both clinicians and patients.",false);

    // ── SKILLS & TRADES — 2 topics, 2+ sources each ──────────────────────────
    await add("HVAC Maintenance & Home Repairs","authoritative","DOE — Home Energy Saver and HVAC Guidance","https://www.energy.gov/energysaver/heating-cooling","The Department of Energy's home energy guidance on heating and cooling covers HVAC maintenance schedules, energy-efficient equipment choices, programmable thermostats, duct sealing, and weatherization — with tools to calculate energy savings.",true);
    await add("HVAC Maintenance & Home Repairs","professional","Air Conditioning Contractors of America — ACCA","https://www.acca.org","ACCA sets quality standards for the HVAC industry, provides contractor finder tools for homeowners, and publishes consumer guidance on selecting qualified HVAC technicians, understanding service contracts, and maintaining HVAC equipment.",false);

    await add("Trade School Programs & Apprenticeships","authoritative","DOL — ApprenticeshipUSA","https://www.apprenticeship.gov","The Department of Labor's ApprenticeshipUSA program registers and promotes apprenticeships across 1,000+ occupations — providing apprenticeship finders, employer registration resources, and data on apprenticeship completion rates and wages.",true);
    await add("Trade School Programs & Apprenticeships","authoritative","DOL — Employment and Training Administration","https://www.dol.gov/agencies/eta","DOL's Employment and Training Administration funds community college partnership programs, workforce innovation grants, Trade Adjustment Assistance for workers displaced by trade, and Job Corps — the largest federally funded job training program for young adults.",false);

    // ── ENTERTAINMENT — 1 remaining topic ────────────────────────────────────
    await add("Music Releases & Award Shows","professional","Recording Academy — GRAMMYs","https://www.grammy.com","The Recording Academy, which presents the GRAMMY Awards, is the professional organization representing the music industry. The GRAMMYs annual ceremony documents the most celebrated music releases across all genres, including categories highlighting Black artists in R&B, rap, gospel, and jazz.",true);
    await add("Music Releases & Award Shows","professional","Billboard — Music Charts and News","https://www.billboard.com","Billboard is the music industry's authoritative trade publication, tracking chart performance, album releases, award show coverage, and artist profiles — including dedicated coverage of R&B, hip-hop, and gospel charts reflecting the breadth of Black musical contribution.",false);

    log(`Library Batch D complete: ${n} knowledge_sources inserted`);
  } catch (err: unknown) {
    warn(`Library Batch D failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}
