import { Router } from "express";

const router = Router();

export const DISCLAIMERS = [
  {
    id: "general",
    title: "General Information",
    short:
      "Information on this platform is for general purposes only. Verify important details before making personal decisions.",
    full: "Information provided through Mapping with Melanin™ is for general informational purposes only. While we strive to provide accurate and timely information, we cannot guarantee the completeness, accuracy, or availability of all content. Users should independently verify information before making personal, financial, legal, medical, travel, employment, or safety decisions.",
  },
  {
    id: "medical",
    title: "Medical",
    short:
      "We do not provide medical advice. Always consult a qualified healthcare professional.",
    full: "Mapping with Melanin™ does not provide medical advice, diagnosis, or treatment. Content on this platform is intended for informational purposes only and should not replace the advice of a qualified healthcare professional. If you are experiencing a medical emergency, call emergency services immediately.",
  },
  {
    id: "legal",
    title: "Legal",
    short:
      "We are not a law firm and do not provide legal advice. Consult a licensed attorney for your circumstances.",
    full: "Mapping with Melanin™ is not a law firm and does not provide legal advice. Information shared through the platform should not be relied upon as legal counsel. Please consult a licensed attorney regarding your specific circumstances.",
  },
  {
    id: "financial",
    title: "Financial",
    short:
      "Grants, scholarships, and financial resources are informational only. Verify eligibility directly with the sponsoring organization.",
    full: "Financial resources, grants, scholarships, and business opportunities are provided for informational purposes only. Mapping with Melanin™ does not guarantee eligibility, approval, funding, or financial outcomes. Users should verify all requirements directly with the sponsoring organization.",
  },
  {
    id: "employment",
    title: "Employment",
    short:
      "Employer reviews reflect individual user experiences. Exercise your own judgment when evaluating employers.",
    full: "Employer reviews and workplace experiences reflect the opinions and experiences of individual users. Mapping with Melanin™ does not independently verify every review and does not endorse or guarantee the accuracy of user-submitted content. Users should exercise their own judgment when evaluating employers.",
  },
  {
    id: "safety",
    title: "Safety",
    short:
      "Safety ratings are based on user reports at a point in time. Conditions change — always follow guidance from local authorities.",
    full: "Safety ratings, neighborhood information, and community reports are based on user experiences and available data at a particular point in time. Conditions may change rapidly. Always exercise your own judgment and follow guidance from local authorities.",
  },
  {
    id: "travel",
    title: "Travel",
    short:
      "Travel details may change without notice. Confirm hours, reservations, and requirements directly with the business or organization.",
    full: "Travel information, business hours, events, transportation, and destination details may change without notice. Users should confirm reservations, operating hours, and travel requirements directly with the applicable business or organization before making plans.",
  },
  {
    id: "ai",
    title: "AI (KinfolkAI)",
    short:
      "KinfolkAI responses may contain inaccuracies. Do not rely on them as professional advice.",
    full: "KinfolkAI is designed to provide helpful guidance and recommendations. AI-generated responses may contain inaccuracies or outdated information and should not be relied upon as professional advice. Always verify important information with trusted sources.",
  },
  {
    id: "community",
    title: "Community Content",
    short:
      "Posts, reviews, and opinions belong to their authors and do not reflect the views of Mapping with Melanin™.",
    full: "Community posts, reviews, recommendations, and opinions belong to their respective authors and do not necessarily reflect the views of Mapping with Melanin™.",
  },
  {
    id: "business",
    title: "Business Verification",
    short:
      "Verification confirms requirements were met at time of review — it is not an endorsement or guarantee of future conduct.",
    full: "Business verification confirms that a business met our verification requirements at the time of review. Verification should not be interpreted as an endorsement, guarantee of quality, or guarantee of future conduct.",
  },
  {
    id: "emergency",
    title: "Emergency Services",
    short:
      "We are not an emergency response service. If you are in danger, contact local emergency services immediately.",
    full: "Mapping with Melanin™ is not an emergency response service. If you are experiencing an emergency, contact your local emergency services immediately.",
  },
  {
    id: "resource",
    title: "Resource Directory",
    short:
      "Listed resources are for discovery only. Inclusion is not an endorsement — availability and eligibility may change.",
    full: "Resources, organizations, scholarships, grants, and community services listed within Mapping with Melanin™ are provided to help users discover opportunities. Inclusion does not constitute an endorsement, and availability, eligibility, or services may change at any time.",
  },
  {
    id: "external",
    title: "External Links",
    short:
      "External links are provided for convenience. We are not responsible for third-party content or availability.",
    full: "Links to external websites and social media platforms are provided for convenience. Mapping with Melanin™ is not responsible for the content, privacy practices, or availability of third-party websites or services.",
  },
  {
    id: "promotions",
    title: "Promotions & Partnerships",
    short:
      "Sponsored content is clearly identified where applicable and does not affect our commitment to community-first discovery.",
    full: "Some businesses, organizations, or experiences may participate in promotional partnerships with Mapping with Melanin™. Sponsored content will be clearly identified where applicable. Partnerships do not affect our commitment to highlighting minority-owned businesses in accordance with our platform policies.",
  },
  {
    id: "recognition",
    title: "Community Recognition",
    short:
      "Badges and rankings celebrate engagement and should not be interpreted as endorsements or quality guarantees.",
    full: "Community recognition, badges, and rankings are based on user participation and platform activity. These recognitions are intended to celebrate community engagement and should not be interpreted as endorsements or guarantees of quality or conduct.",
  },
] as const;

export type DisclaimerId = (typeof DISCLAIMERS)[number]["id"];

router.get("/legal/disclaimers", (req, res) => {
  res.json({ disclaimers: DISCLAIMERS });
});

router.get("/legal/disclaimers/:id", (req, res) => {
  const disclaimer = DISCLAIMERS.find((d) => d.id === req.params.id);
  if (!disclaimer) {
    res.status(404).json({ error: "Disclaimer not found" });
    return;
  }
  res.json(disclaimer);
});

export default router;
