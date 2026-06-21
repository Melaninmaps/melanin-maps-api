import { Button } from "@/components/ui/button";
import { Clock, Check, Shield, Crown, Building2, Award, Star } from "lucide-react";
import { Link, useLocation } from "wouter";

const BASE = import.meta.env.BASE_URL;

type PlanConfig = {
  icon: React.ReactNode;
  label: string;
  badgeText: string;
  badgeColor: string;
  trialHeadline: string;
  trialSubline: string;
  renewalText: string;
  perks: string[];
  ctaText: string;
};

const PLANS: Record<string, PlanConfig> = {
  individual: {
    icon: <Shield className="w-8 h-8 text-[#CA922B]" />,
    label: "Explorer",
    badgeText: "14-Day Free Trial",
    badgeColor: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30",
    trialHeadline: "Your 14-day free trial starts today.",
    trialSubline:
      "Full Premium access from day one — no credit card required until your trial ends. After 14 days, your Explorer membership continues at $9.99/month. Cancel anytime before then and you owe nothing.",
    renewalText: "After trial: $9.99/month or $79/year. Cancel anytime.",
    perks: [
      "Unlimited business listings & profiles",
      "Full neighborhood safety scores",
      "Submit reviews & safety reports",
      "KinfolkAI travel planning",
      "Save businesses & build collections",
    ],
    ctaText: "Create Free Account — Start Trial",
  },
  business: {
    icon: <Building2 className="w-8 h-8 text-[#CA922B]" />,
    label: "Business Starter",
    badgeText: "30-Day Free Trial",
    badgeColor: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30",
    trialHeadline: "Your 30-day free trial starts today.",
    trialSubline:
      "We know businesses need more time to see real results. Your 30 days gives you the space to claim your profile, upload photos, respond to reviews, and see whether leads and traffic are actually being generated. No credit card required until day 31.",
    renewalText: "After trial: $29.99/month or $249/year. Cancel anytime.",
    perks: [
      "Claim & verify your business profile",
      "Upload photos, menus & services",
      "Respond to reviews & reports",
      "View analytics & engagement data",
      "Post jobs and events",
    ],
    ctaText: "Create Business Account — Start Trial",
  },
  founding: {
    icon: <Crown className="w-8 h-8 text-[#CA922B]" />,
    label: "Founding Member",
    badgeText: "90 Days Free — Launch Promo",
    badgeColor: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30",
    trialHeadline: "Welcome, Founding Member. 90 days free.",
    trialSubline:
      "As one of the first 500 members of Mapping with Melanin™, you'll enjoy 90 full days of Premium access — completely free. No credit card required until day 91. After your trial, you'll lock in our introductory rate for life and keep your permanent Founding Member badge forever.",
    renewalText: "After 90 days: locked-in introductory rate. Badge is permanent.",
    perks: [
      "90 days of full Premium — free",
      "Permanent Founding Member badge",
      "Locked-in introductory pricing for life",
      "Roadmap input & early feature access",
      "Founder's Circle community",
    ],
    ctaText: "Claim Your Founding Member Spot",
  },
  beta: {
    icon: <Award className="w-8 h-8 text-[#CA922B]" />,
    label: "Beta Tester",
    badgeText: "6–12 Months Free",
    badgeColor: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30",
    trialHeadline: "Thank you for helping us build this.",
    trialSubline:
      "As a Beta Tester for Mapping with Melanin™, you're part of the core team that's shaping the platform before it launches publicly. In return, you receive 6–12 months of full Premium access — free. Your Beta Tester badge will be permanently attached to your profile.",
    renewalText: "After your beta period: standard monthly rate. Badge is permanent.",
    perks: [
      "6–12 months of Premium — free",
      "Exclusive Beta Tester badge",
      "Founder's Circle eligibility",
      "Direct feedback channel to the team",
    ],
    ctaText: "Join as Beta Tester",
  },
  business_referral: {
    icon: <Star className="w-8 h-8 text-[#CA922B]" />,
    label: "Business Referral Partner",
    badgeText: "12 Months Free",
    badgeColor: "bg-[#CA922B]/10 text-[#CA922B] border-[#CA922B]/30",
    trialHeadline: "12 months free — and you can bring your community.",
    trialSubline:
      "As a Business Referral Partner, you receive 12 months of full Premium access free, plus the ability to refer up to 20 users who'll also receive extended trial access. Your Founding Business badge will be permanently visible on your profile and your business listing.",
    renewalText: "After 12 months: $29.99/month. Referral perks are permanent.",
    perks: [
      "12 months of Premium — free",
      "Refer up to 20 users",
      "Founding Business badge",
      "Priority placement during launch",
    ],
    ctaText: "Become a Referral Partner",
  },
};

export default function Signup() {
  const [location] = useLocation();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const planKey = params.get("plan") ?? "individual";
  const plan = PLANS[planKey] ?? PLANS.individual;

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-full max-w-lg relative z-10">
        {/* Plan badge */}
        <div className="flex justify-center mb-4">
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${plan.badgeColor}`}>
            <Clock className="w-3.5 h-3.5" />
            {plan.badgeText}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 overflow-hidden">
          {/* Header */}
          <div className="bg-[#2B1507] px-10 py-8 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 border border-white/20 flex items-center justify-center rounded-2xl mb-5">
              {plan.icon}
            </div>
            <div className="text-[#CA922B] text-xs font-bold uppercase tracking-widest mb-2">{plan.label}</div>
            <h1 className="text-2xl font-serif font-bold text-white leading-snug">
              {plan.trialHeadline}
            </h1>
          </div>

          {/* Trial explanation */}
          <div className="px-10 pt-8 pb-6 border-b border-[#3A1F0E]/8">
            <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">
              {plan.trialSubline}
            </p>
          </div>

          {/* What's included */}
          <div className="px-10 py-6 border-b border-[#3A1F0E]/8">
            <p className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-wider mb-4">What's included in your trial</p>
            <ul className="space-y-2.5">
              {plan.perks.map((perk, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-[#CA922B]" />
                  </div>
                  <span className="text-sm text-[#3A1F0E]/80">{perk}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Sign up CTA */}
          <div className="px-10 py-8">
            <a href={`${BASE}api/login?plan=${planKey}`} className="block w-full">
              <Button className="w-full h-14 text-base rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold shadow-[0_4px_14px_rgba(202,146,43,0.35)]">
                {plan.ctaText}
              </Button>
            </a>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px bg-[#3A1F0E]/10" />
              <span className="text-xs text-[#3A1F0E]/40 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-[#3A1F0E]/10" />
            </div>

            <p className="mt-4 text-sm text-center text-[#3A1F0E]/60">
              Already have an account?{" "}
              <Link href="/login">
                <span className="text-[#CA922B] font-semibold hover:underline cursor-pointer">Sign In</span>
              </Link>
            </p>

            {/* Renewal reminder */}
            <div className="mt-6 bg-[#FAF6EF] rounded-2xl p-4 text-center">
              <p className="text-xs text-[#3A1F0E]/50 leading-relaxed">
                💡 <strong className="text-[#3A1F0E]/70">Renewal reminder:</strong> {plan.renewalText} We'll email you 3 days before your trial ends with full pricing details and an easy way to continue.
              </p>
            </div>

            <p className="text-xs text-center text-[#3A1F0E]/35 mt-5 font-light">
              By signing up, you agree to our{" "}
              <Link href="/terms"><span className="underline cursor-pointer">Terms of Service</span></Link>
              {" "}and{" "}
              <Link href="/privacy-policy"><span className="underline cursor-pointer">Privacy Policy</span></Link>.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-[#3A1F0E]/40 mt-6">
          Want a different plan?{" "}
          <Link href="/membership">
            <span className="text-[#CA922B] hover:underline cursor-pointer">View all plans →</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
