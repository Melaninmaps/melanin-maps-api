import { Router, type IRouter, type Request, type Response } from "express";

const router: IRouter = Router();

const INCLUDED_BENEFITS = [
  { icon: "map-pin",       label: "Business Profile" },
  { icon: "user",          label: "One Matching Community Membership" },
  { icon: "globe",         label: "FREE Website Clicks — 0% referral fee" },
  { icon: "bar-chart-2",   label: "Analytics Dashboard" },
  { icon: "star",          label: "Community Reviews" },
  { icon: "calendar",      label: "Events" },
  { icon: "link",          label: "Website & Social Links" },
  { icon: "check-circle",  label: "Claim Your Business" },
  { icon: "heart",         label: "Show Love Recognition" },
  { icon: "message-circle",label: "Business Messaging" },
  { icon: "users",         label: "Support Local Campaigns" },
];

const MATCHING_TIERS: Record<string, string> = {
  biz_free:          "Explorer",
  growth_business:   "Community Builder",
  premium_business:  "Legacy Member",
  founding_business: "Legacy Member",
};

const FEE_SCHEDULE = [
  { type: "website",   label: "Website clicks",              fee: "0%",  highlight: true,  note: "Always free — we never charge for sending traffic to your site" },
  { type: "bookings",  label: "In-app bookings",             fee: "10%", highlight: false, note: null },
  { type: "physical_small", label: "Physical products (under $25)", fee: "5%",  highlight: false, note: null },
  { type: "physical_large", label: "Physical products ($25+)",      fee: "10%", highlight: false, note: null },
  { type: "digital",   label: "Digital products & downloads",fee: "10%", highlight: false, note: null },
  { type: "tickets",   label: "Event tickets",               fee: "6%",  highlight: false, note: null },
  { type: "donations", label: "Donations (nonprofits)",      fee: "3%",  highlight: false, note: null },
];

const MISSION_ITEMS = [
  { icon: "home",      label: "Sponsor local community events" },
  { icon: "book-open", label: "Support scholarships" },
  { icon: "briefcase", label: "Promote minority-owned businesses" },
  { icon: "map",       label: "Expand to new cities" },
  { icon: "shield",    label: "Build new safety features" },
];

router.get("/business-membership-info", (_req: Request, res: Response) => {
  res.json({
    includedBenefits: INCLUDED_BENEFITS,
    matchingTiers: MATCHING_TIERS,
    feeSchedule: FEE_SCHEDULE,
    missionItems: MISSION_ITEMS,
  });
});

export default router;
