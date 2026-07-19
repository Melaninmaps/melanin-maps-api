import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, Shield, Star, Zap, Building2, Crown, Users, Award, ArrowRight, Clock, Heart, GraduationCap, Stethoscope, Briefcase, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const BASE = import.meta.env.BASE_URL;

type CurrentUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  approved: boolean;
  role: "user" | "tester" | "admin";
} | null;

const WELCOME_COPY = `As a tester for Mapping with Melanin™, your experience, feedback, and insights are essential to shaping what this platform becomes. You're not just trying out features — you're helping build the foundation of something that will genuinely serve and empower our community.

During this testing phase, we ask that you:

• Explore every corner of the app with curiosity and intention
• Submit honest, detailed feedback — what works, what doesn't, and what's missing
• Report any bugs, broken flows, or confusing moments you encounter
• Share your thoughts on how the platform makes you feel as a member of this community
• Treat your access as the privilege it is — this is a closed beta

Your role is to help us get this right before we open the doors to the broader community. The decisions you help us make now will directly impact thousands of people who will depend on this platform to find trusted businesses, navigate their communities, and connect with people who share their values.

We appreciate your time, your trust, and your commitment to the mission. Let's build something great together.

— The Mapping with Melanin™ Team`;

const EXPLORER_FEATURES = [
  "Business search & maps",
  "Read & leave community reviews",
  "Basic safety alerts",
  "Community feed & discussions",
  "View destination guides",
  "Save up to 10 favorite locations",
  "Follow destinations",
  "Discover Black-owned businesses near you",
  "Basic recommendations",
];

const NAVIGATOR_DISCOVERY = [
  "Unlimited saved favorites — never lose a recommendation",
  "Advanced filters by safety score, rating, and category",
  "Enhanced event discovery and cultural experiences",
  "Personalized recommendations based on your interests",
];

const NAVIGATOR_SAFETY = [
  "Enhanced safety insights and neighborhood ratings",
  "Community-sourced safety reports for your destinations",
  "Alerts when travel advisories affect saved destinations",
];

const NAVIGATOR_COMMUNITY = [
  "Navigator profile badge",
  "Priority support",
  "Early access to new features",
];

const TRAILBLAZER_EXTRAS = [
  "KinfolkAI Assistant — personalized travel guidance",
  "Premium travel itineraries tailored to your style",
  "Advanced relocation insights",
  "First access to every new feature",
  "Trailblazer profile badge",
  "Exclusive partner discounts",
  "Priority support",
  "Everything in Navigator, included",
];

const BIZ_COMMUNITY_FEATURES = [
  "Business profile",
  "Basic contact information",
  "Website link",
  "Business category listing",
  "Community reviews",
  "Ability to claim profile",
  "1 photo",
  "Basic map placement",
];

const BIZ_GROWTH_EXTRAS = [
  "Up to 10 photos",
  "Business description",
  "Social media links",
  "Ability to respond to reviews",
  "Basic analytics",
  "Event posting",
  "Special offers & coupons",
  '"Verified Business" eligibility',
];

const BIZ_PREMIUM_EXTRAS = [
  "Featured placement in search",
  "Featured placement on maps",
  "Advanced analytics",
  "Customer lead tracking",
  "Unlimited events",
  "Unlimited offers",
  "Priority support",
  "Community recommendation boosts",
  "Promotional campaigns",
];

const BIZ_ENTERPRISE_EXTRAS = [
  "Multiple business locations",
  "Organization profile",
  "Sponsorship opportunities",
  "Dedicated account support",
  "Regional advertising opportunities",
  "Community partnership badge",
  "Enhanced reporting",
  "Early access to new features",
];

const FOUNDING_FEATURES = [
  "Lifetime access — pay once, never again",
  "Exclusive Founding Member badge on your profile",
  "Locked-in introductory pricing forever",
  "Roadmap input & early feature access",
  "Direct line to the founding team",
  "All future premium features included",
  "Founder's Circle private community",
];

export default function Membership() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);
  const [spotsRemaining, setSpotsRemaining] = useState<number>(500);
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState<string | null>(null);
  const [checkoutCancelled, setCheckoutCancelled] = useState(false);
  const [, navigate] = useLocation();

  useEffect(() => {
    fetch(`${BASE}api/auth/user`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setCurrentUser(data.user ?? null))
      .catch(() => {});

    fetch(`${BASE}api/membership/stats`)
      .then((r) => r.json())
      .then((data) => setSpotsRemaining(data.spotsRemaining ?? 500))
      .catch(() => {});

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "1") {
      setCheckoutSuccess(params.get("plan") ?? "navigator");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("checkout_cancelled") === "1") {
      setCheckoutCancelled(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const isTester = currentUser?.approved === true && currentUser?.role === "tester";

  async function handleStartMembership(plan: string) {
    if (isTester) {
      setPendingPlan(plan);
      setModalOpen(true);
      return;
    }
    if (!currentUser) {
      window.location.href = `/login?redirect=/membership`;
      return;
    }
    if (plan === "individual") {
      navigate("/discover");
      return;
    }
    if (plan === "business") {
      navigate("/business/signup");
      return;
    }
    setCheckoutLoading(plan);
    try {
      const res = await fetch(`${BASE}api/billing/checkout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval: billing }),
      });
      const d = await res.json() as { checkoutUrl?: string; error?: string };
      if (d.checkoutUrl) {
        window.location.href = d.checkoutUrl;
      } else {
        alert(d.error ?? "Could not start checkout. Please try again.");
      }
    } catch {
      alert("Could not connect to checkout. Please try again.");
    } finally {
      setCheckoutLoading(null);
    }
  }

  function handlePlanClick(_plan: string) {
    void handleStartMembership(_plan);
  }

  function handleContinue() {
    setModalOpen(false);
    setPendingPlan(null);
    window.location.href = "/#waitlist-form";
  }

  const spotsPercent = Math.round(((500 - spotsRemaining) / 500) * 100);

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FAF6EF]">
      {checkoutSuccess && (
        <div className="bg-[#2B6B3A] text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-[#6EE7A0] flex-shrink-0" />
            <span className="text-sm font-medium">
              Welcome to{" "}
              <strong className="capitalize">
                {checkoutSuccess === "trailblazer" ? "Trailblazer" : "Navigator"}
              </strong>
              ! Your membership is now active. Reload the page to see your updated access.
            </span>
          </div>
          <button onClick={() => setCheckoutSuccess(null)} className="ml-4 text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
      {checkoutCancelled && (
        <div className="bg-[#7C3009]/90 text-white px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm">Your checkout was cancelled — no charge was made. You can upgrade whenever you're ready.</span>
          </div>
          <button onClick={() => setCheckoutCancelled(false)} className="ml-4 text-white/70 hover:text-white text-lg leading-none">&times;</button>
        </div>
      )}
      {/* Tester Welcome Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl bg-[#FAF6EF] border border-[#CA922B]/30 rounded-3xl p-0 overflow-hidden">
          <div className="bg-[#2B1507] px-8 py-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-serif font-bold text-white text-left">
                Hi {currentUser?.firstName ?? "there"}, welcome to the team. 👋🏾
              </DialogTitle>
              <DialogDescription className="text-[#F5EBD8]/70 text-sm text-left mt-1">
                Before you continue, please read this important message from our team.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="px-8 py-6">
            <div className="space-y-4 text-[#3A1F0E]/80 text-sm leading-relaxed whitespace-pre-line">
              {WELCOME_COPY}
            </div>
            <div className="mt-8 flex justify-end">
              <Button
                onClick={handleContinue}
                className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 font-bold shadow-[0_4px_14px_rgba(202,146,43,0.39)]"
              >
                I Understand — Continue
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hero */}
      <section className="bg-[#2B1507] py-24 relative overflow-hidden">
        <img src={`${import.meta.env.BASE_URL}images/hero-community-bg.jpg`} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-[#2B1507]/88 z-0" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-8">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Membership Plans</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-tight max-w-4xl">
            Find Your<br />
            <span className="text-[#CA922B]">Community.</span><br />
            Choose Your Plan.
          </h1>
          <p className="text-[#F5EBD8]/80 text-lg md:text-xl max-w-2xl font-light">
            Every plan starts with a free trial — no credit card required. Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── MISSION / IMPACT SECTION ── */}
      <div className="bg-[#1A4731] py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 mb-5">
              <Heart className="w-3.5 h-3.5 text-[#CA922B]" />
              <span className="text-xs font-bold tracking-widest text-white/80 uppercase">Your Membership Makes This Possible</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
              Subscribing on the web funds our community.
            </h2>
            <p className="text-white/65 text-base md:text-lg max-w-2xl mx-auto font-light leading-relaxed">
              When you subscribe at mappingwithmelanin.com instead of through an app store, more of every dollar stays in the community — funding programs that change lives.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white/8 rounded-2xl p-6 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-[#CA922B]/20 flex items-center justify-center mb-4">
                <GraduationCap className="w-5 h-5 text-[#CA922B]" />
              </div>
              <h3 className="font-bold text-white mb-2">MWM Scholarship Program</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Funding education for the next generation of leaders in medicine, law, business, and the trades. Every web subscription directly contributes.
              </p>
            </div>
            <div className="bg-white/8 rounded-2xl p-6 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-[#CA922B]/20 flex items-center justify-center mb-4">
                <Stethoscope className="w-5 h-5 text-[#CA922B]" />
              </div>
              <h3 className="font-bold text-white mb-2">Community Health Initiatives</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Connecting underserved neighborhoods with trusted doctors, wellness resources, and care networks — starting locally, expanding nationally.
              </p>
            </div>
            <div className="bg-white/8 rounded-2xl p-6 border border-white/10">
              <div className="w-11 h-11 rounded-xl bg-[#CA922B]/20 flex items-center justify-center mb-4">
                <Briefcase className="w-5 h-5 text-[#CA922B]" />
              </div>
              <h3 className="font-bold text-white mb-2">Business Grants</h3>
              <p className="text-white/55 text-sm leading-relaxed">
                Direct financial support for verified Black-owned businesses in their critical first years — the years when most fail for lack of capital.
              </p>
            </div>
          </div>

          <div className="bg-white/8 rounded-2xl px-6 py-4 border border-white/10 flex items-center gap-4 max-w-2xl mx-auto">
            <div className="w-10 h-10 rounded-xl bg-[#CA922B] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-sm">~$11</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              <strong className="text-white">Each web subscriber saves ~$11/year in app store fees</strong> that stay in our community programs instead — compounding with every renewal.
            </p>
          </div>
        </div>
      </div>

      {/* ── BILLING TOGGLE ── */}
      <div className="flex justify-center pt-14 pb-2">
        <div className="inline-flex items-center bg-white border border-[#3A1F0E]/10 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${billing === "monthly" ? "bg-[#2B1507] text-white shadow" : "text-[#3A1F0E]/60 hover:text-[#3A1F0E]"}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billing === "annual" ? "bg-[#2B1507] text-white shadow" : "text-[#3A1F0E]/60 hover:text-[#3A1F0E]"}`}
          >
            Annual
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${billing === "annual" ? "bg-[#CA922B] text-white" : "bg-[#CA922B]/20 text-[#CA922B]"}`}>Save 34%</span>
          </button>
        </div>
      </div>

      {/* ── INDIVIDUAL PLANS ── */}
      <div className="container mx-auto px-4 max-w-6xl pt-8 pb-4">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-[#CA922B]" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#2B1507]">Individual Memberships</h2>
            <p className="text-[#3A1F0E]/60 text-sm">For community members, travelers, and explorers</p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">

          {/* ── Explorer (Free) ── */}
          <div className="bg-white rounded-3xl p-8 border border-[#3A1F0E]/10 shadow-[0_8px_30px_rgba(43,21,7,0.05)] flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#3A1F0E]/40" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/40">🧭 Explorer</span>
            </div>
            <p className="text-[#3A1F0E]/50 text-sm mb-3">Start discovering and supporting the community</p>
            <div className="text-4xl font-serif font-bold text-[#3A1F0E] mb-1">Free <span className="text-lg font-sans font-normal text-[#3A1F0E]/40">forever</span></div>
            <p className="text-[#3A1F0E]/40 text-xs mb-6">Always free. No trial needed.</p>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">What's Included</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {EXPLORER_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#3A1F0E]/70">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full rounded-full border-[#3A1F0E]/20 text-[#3A1F0E] hover:bg-[#3A1F0E] hover:text-white h-11 mt-auto font-bold"
              onClick={() => handlePlanClick("individual")}
            >
              Join Free
            </Button>
          </div>

          {/* ── Navigator ── */}
          <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col relative transform md:-translate-y-4 border border-[#CA922B]/40 shadow-[0_16px_48px_rgba(202,146,43,0.15)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CA922B] text-white text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap">
              Most Popular
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">🌍 Navigator</span>
            </div>
            <p className="text-[#3A1F0E]/50 text-sm mb-3">For active users who want deeper insights</p>
            <div className="text-4xl font-serif font-bold text-[#CA922B] mb-1">
              {billing === "annual" ? "$63" : "$7.99"}
              <span className="text-lg text-[#3A1F0E]/40 font-sans font-normal">{billing === "annual" ? "/yr" : "/month"}</span>
            </div>
            <p className="text-[#3A1F0E]/40 text-xs mb-1">
              {billing === "annual" ? "That's $5.25/month — save 34%" : "or $63/year (save 34%)"}
            </p>
            <div className="inline-flex items-center gap-1.5 bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-full px-3 py-1 mb-6 w-fit">
              <Clock className="w-3 h-3 text-[#CA922B]" />
              <span className="text-xs font-bold text-[#CA922B]">14-Day Free Trial</span>
            </div>

            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B] mb-2">✦ Enhanced Discovery</p>
            <ul className="space-y-2 mb-4">
              {NAVIGATOR_DISCOVERY.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#3A1F0E]/75">{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B] mb-2">🛡 Safety Intelligence</p>
            <ul className="space-y-2 mb-4">
              {NAVIGATOR_SAFETY.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#3A1F0E]/75">{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B] mb-2">👥 Community Benefits</p>
            <ul className="space-y-2 mb-8 flex-1">
              {NAVIGATOR_COMMUNITY.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#3A1F0E]/75">{f}</span>
                </li>
              ))}
            </ul>

            <Button
              className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-auto font-bold shadow-[0_4px_14px_rgba(202,146,43,0.39)] disabled:opacity-60"
              onClick={() => handlePlanClick("navigator")}
              disabled={checkoutLoading === "navigator"}
            >
              {checkoutLoading === "navigator"
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening checkout…</>
                : "Become a Navigator"}
            </Button>
            <p className="text-[#3A1F0E]/30 text-xs text-center mt-3">Secure checkout via Stripe · Cancel anytime.</p>
          </div>

          {/* ── Trailblazer ── */}
          <div className="bg-[#2B1507] rounded-3xl p-8 border border-[#CA922B]/20 shadow-[0_8px_30px_rgba(43,21,7,0.25)] flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-[#CA922B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">👑 Trailblazer</span>
            </div>
            <p className="text-[#F5EBD8]/50 text-sm mb-3">For power users and frequent travelers</p>
            <div className="text-4xl font-serif font-bold text-[#CA922B] mb-1">
              {billing === "annual" ? "$119" : "$14.99"}
              <span className="text-lg text-[#F5EBD8]/40 font-sans font-normal">{billing === "annual" ? "/yr" : "/month"}</span>
            </div>
            <p className="text-[#F5EBD8]/40 text-xs mb-6">
              {billing === "annual" ? "That's $9.92/month — save 34%" : "or $119/year (save 34%)"}
            </p>

            <p className="text-xs font-bold uppercase tracking-wider text-[#CA922B]/70 mb-3">Everything in Navigator, plus</p>
            <ul className="space-y-2.5 mb-8 flex-1">
              {TRAILBLAZER_EXTRAS.map((f, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#F5EBD8]/85">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 mt-auto font-bold shadow-[0_4px_14px_rgba(202,146,43,0.39)] disabled:opacity-60"
              onClick={() => handlePlanClick("trailblazer")}
              disabled={checkoutLoading === "trailblazer"}
            >
              {checkoutLoading === "trailblazer"
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Opening checkout…</>
                : "Become a Trailblazer"}
            </Button>
            <p className="text-[#F5EBD8]/30 text-xs text-center mt-3">Secure checkout via Stripe · Cancel anytime.</p>
          </div>
        </div>
      </div>

      {/* ── FEATURE COMPARISON TABLE ── */}
      <div className="container mx-auto px-4 max-w-5xl py-8 pb-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-full px-4 py-1.5 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Compare Plans</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-[#2B1507] mb-2">Everything You Get</h2>
          <p className="text-[#3A1F0E]/50 text-sm">A full breakdown of features across every individual plan.</p>
        </div>

        <div className="bg-white rounded-3xl border border-[#3A1F0E]/10 shadow-[0_8px_30px_rgba(43,21,7,0.06)] overflow-hidden">
          {/* Header row */}
          <div className="grid grid-cols-4 bg-[#2B1507]">
            <div className="p-5" />
            {[
              { icon: "🧭", label: "Explorer", sub: "Free" },
              { icon: "🌍", label: "Navigator", sub: "$7.99/mo", highlight: true },
              { icon: "👑", label: "Trailblazer", sub: "Contact us" },
            ].map(({ icon, label, sub, highlight }) => (
              <div key={label} className={`p-5 text-center border-l border-white/10 ${highlight ? "bg-[#CA922B]/20" : ""}`}>
                <div className="text-lg mb-0.5">{icon}</div>
                <div className={`font-serif font-bold text-sm ${highlight ? "text-[#CA922B]" : "text-white"}`}>{label}</div>
                <div className="text-[#F5EBD8]/50 text-xs">{sub}</div>
              </div>
            ))}
          </div>

          {/* Feature rows */}
          {[
            {
              section: "Discovery",
              rows: [
                { label: "Business search & maps", explorer: true, navigator: true, trailblazer: true },
                { label: "Community reviews (read & write)", explorer: true, navigator: true, trailblazer: true },
                { label: "Destination guides", explorer: true, navigator: true, trailblazer: true },
                { label: "Save favorite locations", explorer: "Up to 10", navigator: "Unlimited", trailblazer: "Unlimited" },
                { label: "Advanced filters (safety, rating, price)", explorer: false, navigator: true, trailblazer: true },
                { label: "Personalized recommendations", explorer: false, navigator: true, trailblazer: true },
              ],
            },
            {
              section: "Safety Intelligence",
              rows: [
                { label: "Basic safety alerts", explorer: true, navigator: true, trailblazer: true },
                { label: "Community safety reports", explorer: true, navigator: true, trailblazer: true },
                { label: "Enhanced neighborhood ratings", explorer: false, navigator: true, trailblazer: true },
                { label: "Travel advisories for saved places", explorer: false, navigator: true, trailblazer: true },
              ],
            },
            {
              section: "KinfolkAI™",
              rows: [
                { label: "AI travel assistant", explorer: false, navigator: false, trailblazer: true },
                { label: "Personalized itineraries", explorer: false, navigator: false, trailblazer: true },
                { label: "Shareable trip guides", explorer: false, navigator: false, trailblazer: true },
                { label: "Relocation insights", explorer: false, navigator: false, trailblazer: true },
              ],
            },
            {
              section: "Community & Perks",
              rows: [
                { label: "Community feed & events", explorer: true, navigator: true, trailblazer: true },
                { label: "Profile badge", explorer: false, navigator: "Navigator", trailblazer: "Trailblazer" },
                { label: "Priority support", explorer: false, navigator: true, trailblazer: true },
                { label: "Early access to new features", explorer: false, navigator: true, trailblazer: true },
                { label: "Roadmap voting & input", explorer: false, navigator: false, trailblazer: true },
                { label: "All future premium features", explorer: false, navigator: false, trailblazer: true },
              ],
            },
          ].map(({ section, rows }) => (
            <div key={section}>
              <div className="grid grid-cols-4 bg-[#FAF6EF] border-t border-[#3A1F0E]/8">
                <div className="px-5 py-2.5 col-span-4">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#CA922B]">{section}</span>
                </div>
              </div>
              {rows.map(({ label, explorer, navigator, trailblazer }, i) => (
                <div key={i} className={`grid grid-cols-4 border-t border-[#3A1F0E]/6 ${i % 2 === 1 ? "bg-[#FAF6EF]/40" : ""}`}>
                  <div className="px-5 py-3.5 text-sm text-[#3A1F0E]/70 font-medium">{label}</div>
                  {[explorer, navigator, trailblazer].map((val, j) => (
                    <div key={j} className={`px-5 py-3.5 flex items-center justify-center border-l border-[#3A1F0E]/6 ${j === 1 ? "bg-[#CA922B]/4" : ""}`}>
                      {val === true ? (
                        <div className="w-5 h-5 rounded-full bg-[#CA922B]/15 flex items-center justify-center">
                          <Check className="w-3 h-3 text-[#CA922B]" />
                        </div>
                      ) : val === false ? (
                        <span className="text-[#3A1F0E]/20 text-lg font-light">—</span>
                      ) : (
                        <span className="text-xs font-semibold text-[#3A1F0E]/70 text-center">{val}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {/* CTA row */}
          <div className="grid grid-cols-4 border-t border-[#3A1F0E]/10 bg-[#FAF6EF]/60">
            <div className="px-5 py-5" />
            {[
              { label: "Join Free", variant: "outline" as const, action: "individual" },
              { label: "Start Navigator", variant: "gold" as const, action: "individual" },
              { label: "Become Trailblazer", variant: "dark" as const, action: "trailblazer" },
            ].map(({ label, variant, action }) => (
              <div key={label} className={`px-4 py-5 flex justify-center border-l border-[#3A1F0E]/6 ${variant === "gold" ? "bg-[#CA922B]/4" : ""}`}>
                <button
                  onClick={() => handlePlanClick(action as "individual" | "trailblazer" | "founding")}
                  className={`text-xs font-bold px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                    variant === "gold"
                      ? "bg-[#CA922B] text-white hover:bg-[#B38024] shadow-[0_4px_14px_rgba(202,146,43,0.35)]"
                      : variant === "dark"
                      ? "bg-[#2B1507] text-white hover:bg-[#3A1F0E]"
                      : "border border-[#3A1F0E]/20 text-[#3A1F0E] hover:bg-[#3A1F0E] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOUNDING MEMBER LAUNCH PROMO ── */}
      <div className="container mx-auto px-4 max-w-6xl py-16">
        <div className="bg-gradient-to-br from-[#2B1507] via-[#3A1F0E] to-[#2B1507] rounded-3xl p-10 md:p-14 relative overflow-hidden border border-[#CA922B]/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CA922B]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#CA922B]/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#CA922B]/20 border border-[#CA922B]/40 rounded-full px-4 py-1.5 mb-6">
                <Zap className="w-3.5 h-3.5 text-[#CA922B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Launch Promotion — Limited Time</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                Founding Member<br />
                <span className="text-[#CA922B]">90-Day Free Premium</span>
              </h2>
              <p className="text-[#F5EBD8]/70 text-base leading-relaxed mb-6 max-w-xl">
                The first <strong className="text-white">500 members</strong> to join receive 90 days of full Premium access — completely free. No credit card required. After your 90-day trial, you'll lock in a <strong className="text-[#CA922B]">1% discount off standard rates for 3 years</strong> and receive a permanent <strong className="text-[#CA922B]">Founding Member badge</strong> on your profile.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "90 days of full Premium access — free",
                  "Permanent Founding Member badge on your profile",
                  "Locked-in introductory pricing when subscription begins",
                  "Priority placement for early feature requests",
                  "Exclusive Founder's Circle community access",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#CA922B]" />
                    </div>
                    <span className="text-[#F5EBD8]/80 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-13 px-8 font-bold shadow-[0_4px_20px_rgba(202,146,43,0.5)] text-base"
                onClick={() => handlePlanClick("founding")}
              >
                Claim Your Founding Member Spot →
              </Button>
            </div>

            <div className="md:w-64 shrink-0 flex flex-col items-center text-center bg-white/5 border border-[#CA922B]/20 rounded-2xl p-8">
              <div className="text-6xl font-serif font-bold text-[#CA922B] mb-1">{spotsRemaining}</div>
              <div className="text-white font-bold text-lg mb-1">spots remaining</div>
              <div className="text-[#F5EBD8]/50 text-xs mb-6">out of 500 total</div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="bg-[#CA922B] h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${spotsPercent}%` }}
                />
              </div>
              <p className="text-[#F5EBD8]/50 text-xs">
                {500 - spotsRemaining} of 500 claimed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BUSINESS PLANS ── */}
      <div className="container mx-auto px-4 max-w-6xl py-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#CA922B]" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-[#2B1507]">Business Memberships</h2>
            <p className="text-[#3A1F0E]/60 text-sm">For business owners, operators, and entrepreneurs</p>
          </div>
        </div>
        <p className="text-[#3A1F0E]/50 text-sm mb-10">All paid plans include a <strong className="text-[#3A1F0E]/70">30-day free trial</strong> — no credit card required to start.</p>

        {/* 4-tier grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch mb-16">

          {/* Tier 1 — Community Listing (Free) */}
          <div className="bg-white rounded-3xl p-7 border border-[#3A1F0E]/10 shadow-[0_8px_30px_rgba(43,21,7,0.05)] flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/40">Tier 1</span>
              <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mt-1">Community Listing</h3>
              <p className="text-[#3A1F0E]/50 text-xs mt-1">Best for businesses wanting visibility</p>
            </div>
            <div className="text-3xl font-serif font-bold text-[#3A1F0E] mb-1">Free</div>
            <p className="text-[#3A1F0E]/40 text-xs mb-5">$0/month, always</p>
            <ul className="space-y-2 flex-1 mb-6">
              {BIZ_COMMUNITY_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#3A1F0E]/70">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              className="w-full rounded-full border-[#3A1F0E]/20 text-[#3A1F0E] hover:bg-[#3A1F0E] hover:text-white h-10 text-sm font-bold mt-auto"
              onClick={() => handlePlanClick("business")}
            >
              Claim Free Listing
            </Button>
          </div>

          {/* Tier 2 — Growth */}
          <div className="bg-white rounded-3xl p-7 border border-[#CA922B]/30 shadow-[0_8px_30px_rgba(202,146,43,0.08)] flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Tier 2</span>
              <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mt-1">Growth</h3>
              <p className="text-[#3A1F0E]/50 text-xs mt-1">Small businesses seeking more exposure</p>
            </div>
            <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">
              {billing === "annual" ? "$199" : "$19.99"}
              <span className="text-base text-[#3A1F0E]/40 font-sans font-normal">{billing === "annual" ? "/yr" : "/mo"}</span>
            </div>
            <p className="text-[#3A1F0E]/40 text-xs mb-2">{billing === "annual" ? "That's $16.58/mo — save 17%" : "or $199/year (save 17%)"}</p>
            <div className="inline-flex items-center gap-1 bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-full px-2.5 py-0.5 mb-5 w-fit">
              <Clock className="w-3 h-3 text-[#CA922B]" />
              <span className="text-[10px] font-bold text-[#CA922B]">30-Day Free Trial</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B] mb-2">Everything in Free, plus</p>
            <ul className="space-y-2 flex-1 mb-6">
              {BIZ_GROWTH_EXTRAS.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#3A1F0E]/70">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-10 text-sm font-bold mt-auto shadow-[0_4px_14px_rgba(202,146,43,0.3)]"
              onClick={() => handlePlanClick("business")}
            >
              Start Free Trial
            </Button>
          </div>

          {/* Tier 3 — Premium (featured) */}
          <div className="bg-[#2B1507] rounded-3xl p-7 border border-[#CA922B]/30 shadow-2xl flex flex-col relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#CA922B] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
              Most Popular
            </div>
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Tier 3</span>
              <h3 className="font-serif font-bold text-xl text-white mt-1">Premium</h3>
              <p className="text-[#F5EBD8]/50 text-xs mt-1">Established businesses wanting growth</p>
            </div>
            <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">
              {billing === "annual" ? "$499" : "$49.99"}
              <span className="text-base text-[#F5EBD8]/40 font-sans font-normal">{billing === "annual" ? "/yr" : "/mo"}</span>
            </div>
            <p className="text-[#F5EBD8]/40 text-xs mb-2">{billing === "annual" ? "That's $41.58/mo — save 17%" : "or $499/year (save 17%)"}</p>
            <div className="inline-flex items-center gap-1 bg-[#CA922B]/20 border border-[#CA922B]/40 rounded-full px-2.5 py-0.5 mb-5 w-fit">
              <Clock className="w-3 h-3 text-[#CA922B]" />
              <span className="text-[10px] font-bold text-[#CA922B]">30-Day Free Trial</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B]/70 mb-2">Everything in Growth, plus</p>
            <ul className="space-y-2 flex-1 mb-6">
              {BIZ_PREMIUM_EXTRAS.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#F5EBD8]/80">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-10 text-sm font-bold mt-auto shadow-[0_4px_14px_rgba(202,146,43,0.39)]"
              onClick={() => handlePlanClick("business")}
            >
              Start Free Trial
            </Button>
            <p className="text-[#F5EBD8]/30 text-[10px] text-center mt-2">No credit card required.</p>
          </div>

          {/* Tier 4 — Enterprise */}
          <div className="bg-gradient-to-b from-[#FAF6EF] to-white rounded-3xl p-7 border border-[#CA922B]/20 shadow-[0_8px_30px_rgba(43,21,7,0.06)] flex flex-col">
            <div className="mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Tier 4</span>
              <h3 className="font-serif font-bold text-xl text-[#3A1F0E] mt-1">Enterprise</h3>
              <p className="text-[#3A1F0E]/50 text-xs mt-1">Multi-location, franchises & orgs</p>
            </div>
            <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">
              {billing === "annual" ? "$1,499" : "$149.99"}
              <span className="text-base text-[#3A1F0E]/40 font-sans font-normal">{billing === "annual" ? "/yr" : "/mo"}</span>
            </div>
            <p className="text-[#3A1F0E]/40 text-xs mb-2">{billing === "annual" ? "That's $124.92/mo — save 17%" : "or $1,499/year (save 17%)"}</p>
            <div className="inline-flex items-center gap-1 bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-full px-2.5 py-0.5 mb-5 w-fit">
              <Clock className="w-3 h-3 text-[#CA922B]" />
              <span className="text-[10px] font-bold text-[#CA922B]">30-Day Free Trial</span>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#CA922B] mb-2">Everything in Premium, plus</p>
            <ul className="space-y-2 flex-1 mb-6">
              {BIZ_ENTERPRISE_EXTRAS.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-[#CA922B] shrink-0 mt-0.5" />
                  <span className="text-xs text-[#3A1F0E]/70">{f}</span>
                </li>
              ))}
            </ul>
            <Button
              className="w-full rounded-full bg-[#3A1F0E] hover:bg-[#1a0c04] text-white h-10 text-sm font-bold mt-auto"
              onClick={() => handlePlanClick("business")}
            >
              Contact Us
            </Button>
          </div>
        </div>

        {/* ── FOUNDING BUSINESS LAUNCH OFFER ── */}
        <div className="bg-gradient-to-br from-[#2B1507] via-[#3A1F0E] to-[#2B1507] rounded-3xl p-10 md:p-14 relative overflow-hidden border border-[#CA922B]/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#CA922B]/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#CA922B]/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-start gap-10">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-[#CA922B]/20 border border-[#CA922B]/40 rounded-full px-4 py-1.5 mb-6">
                <Award className="w-3.5 h-3.5 text-[#CA922B]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#CA922B]">Founding Business Program — First 250 Only</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">
                12 Months of Premium.<br />
                <span className="text-[#CA922B]">Completely Free.</span>
              </h2>
              <p className="text-[#F5EBD8]/70 text-base leading-relaxed mb-6 max-w-xl">
                The first <strong className="text-white">250 businesses</strong> to join receive 12 months of full Premium access at no cost — including featured placement, analytics, and event tools. After your free year, lock in a <strong className="text-[#CA922B]">1% discount off standard rates for 3 years</strong> and keep your <strong className="text-[#CA922B]">Founding Business badge</strong> permanently on your profile.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "12 months of Premium access — free",
                  "Founding Business badge on your profile",
                  "Priority placement during launch",
                  "Ability to refer up to 20 users",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/20 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#CA922B]" />
                    </div>
                    <span className="text-[#F5EBD8]/80 text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-12 px-8 font-bold shadow-[0_4px_20px_rgba(202,146,43,0.5)] text-base"
                onClick={() => handlePlanClick("business_referral")}
              >
                Claim Your Founding Business Spot →
              </Button>
            </div>
            <div className="md:w-56 shrink-0 flex flex-col items-center text-center bg-white/5 border border-[#CA922B]/20 rounded-2xl p-8">
              <div className="text-5xl font-serif font-bold text-[#CA922B] mb-1">250</div>
              <div className="text-white font-bold mb-1">total spots</div>
              <div className="text-[#F5EBD8]/50 text-xs mb-4">Limited launch offer</div>
              <div className="w-full bg-white/10 rounded-full h-2 mb-3">
                <div className="bg-[#CA922B] h-2 rounded-full w-[8%]" />
              </div>
              <p className="text-[#F5EBD8]/50 text-xs">Spots filling fast</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOW TRIALS WORK ── */}
      <div className="container mx-auto px-4 max-w-4xl py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-[#2B1507] mb-3">How Free Trials Work</h2>
          <p className="text-[#3A1F0E]/60 text-base">Simple, transparent, no surprises.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {[
            {
              step: "1",
              title: "Start Your Trial",
              body: "Choose your plan and create your free account. No credit card required to begin — just sign up and explore.",
            },
            {
              step: "2",
              title: "Explore Everything",
              body: "Use every feature without restriction during your trial. Discover businesses, submit reviews, plan travel, and build your community.",
            },
            {
              step: "3",
              title: "Decide When Ready",
              body: "We'll send you a reminder 3 days before your trial ends with pricing details. Continue at your plan rate, or cancel — no questions asked.",
            },
          ].map((s) => (
            <div key={s.step} className="bg-white rounded-2xl p-8 border border-[#3A1F0E]/8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#CA922B]/10 text-[#CA922B] font-serif font-bold text-xl flex items-center justify-center mx-auto mb-5">
                {s.step}
              </div>
              <h3 className="font-bold text-[#2B1507] mb-2">{s.title}</h3>
              <p className="text-sm text-[#3A1F0E]/60 leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#FAF6EF] border border-[#CA922B]/20 rounded-3xl p-10">
          <h3 className="text-xl font-serif font-bold text-[#2B1507] mb-6">Trial Periods at a Glance</h3>
          <div className="space-y-4">
            {[
              { label: "Explorer (Individual)", trial: "Always free", price: "$0 — no trial needed", icon: "🧭" },
              { label: "Navigator (Individual)", trial: "14-day free trial", price: "$7.99/month after", icon: "🌍" },
              { label: "Trailblazer (Individual)", trial: "14-day free trial", price: "$14.99/month after", icon: "👑" },
              { label: "Founding Member (first 500)", trial: "90-day free trial", price: "Locked-in intro rate after", icon: "🏅" },
              { label: "Business Community Listing", trial: "Always free", price: "$0 — no trial needed", icon: "🏢" },
              { label: "Business Growth", trial: "30-day free trial", price: "$19.99/month after", icon: "📈" },
              { label: "Business Premium", trial: "30-day free trial", price: "$49.99/month after", icon: "⭐" },
              { label: "Business Enterprise", trial: "30-day free trial", price: "$149.99/month after", icon: "🏛" },
              { label: "Founding Business (first 250)", trial: "12 months free", price: "Intro rate after", icon: "🤝🏾" },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-[#3A1F0E]/8 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{row.icon}</span>
                  <span className="font-medium text-[#2B1507] text-sm">{row.label}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#CA922B]">{row.trial}</div>
                  <div className="text-xs text-[#3A1F0E]/50">{row.price}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-[#2B1507]/5 rounded-2xl p-6 text-center">
          <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">
            <strong className="text-[#2B1507]">When your trial ends,</strong> you'll receive an email with your renewal pricing and a direct link to continue your membership. If you choose not to renew, your account reverts to the free Community plan — you never lose access to the directory entirely.
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#2B1507] py-20">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-4xl font-serif font-bold text-white mb-4">
            Ready to find your community?
          </h2>
          <p className="text-[#F5EBD8]/70 text-lg mb-10 font-light">
            Start free. Explore everything. Stay because you love it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white h-14 px-10 font-bold text-base shadow-[0_4px_20px_rgba(202,146,43,0.4)]"
              onClick={() => handlePlanClick("individual")}
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              className="rounded-full border-white/30 text-white hover:bg-white/10 h-14 px-10 text-base"
              onClick={() => handlePlanClick("business")}
            >
              I'm a Business Owner
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
