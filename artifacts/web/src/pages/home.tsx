import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield, Search, Calendar, MapPin, Sparkles, Bell, ArrowRight, Check, Users, Navigation, Compass, Star, Facebook, Linkedin, Instagram, Link2, ChevronDown, Music, Ticket, MessageSquare, UserPlus, Building2, Globe, BookOpen } from "lucide-react";
import { useListBusinesses } from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";

const BASE_URL = import.meta.env.BASE_URL;

interface ImpactStats { businesses: number; cities: number; reviews: number; community: number; }

function ImpactCounter() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  useEffect(() => {
    fetch(`${BASE_URL}api/impact`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);
  const items = [
    { icon: Building2, label: "Businesses Listed", value: stats?.businesses ?? 0, suffix: "+" },
    { icon: Globe, label: "Cities Covered", value: stats?.cities ?? 0, suffix: "" },
    { icon: BookOpen, label: "Community Reviews", value: stats?.reviews ?? 0, suffix: "+" },
    { icon: Users, label: "Community Members", value: stats?.community ?? 0, suffix: "+" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {items.map(({ icon: Icon, label, value, suffix }) => (
        <div key={label} className="text-center p-6 rounded-2xl bg-white/5 border border-white/10">
          <Icon className="w-6 h-6 text-[#CA922B] mx-auto mb-3" />
          <div className="text-4xl font-serif font-bold text-white mb-1">
            {value > 0 ? `${value.toLocaleString()}${suffix}` : "—"}
          </div>
          <div className="text-[#F5EBD8]/60 text-sm">{label}</div>
        </div>
      ))}
    </div>
  );
}

const SITE_URL = "https://mappingwithmelanin.com";
const SHARE_TEXT = encodeURIComponent("Join Mapping with Melanin — discover trusted businesses, travel safely, and connect with the community. 🌍✊🏾");

function openShare(platform: string) {
  const url = encodeURIComponent(SITE_URL);
  const urls: Record<string, string> = {
    X: `https://twitter.com/intent/tweet?text=${SHARE_TEXT}&url=${url}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
  };
  if (urls[platform]) {
    window.open(urls[platform], "_blank", "noopener,noreferrer,width=600,height=500");
  } else {
    navigator.clipboard.writeText(SITE_URL).catch(() => {});
  }
}

const BASE = import.meta.env.BASE_URL;

interface WaitlistStats {
  count: number;
  cities: { city: string; count: number }[];
}

const FALLBACK_CITIES = [
  { city: "Atlanta, GA" }, { city: "Houston, TX" }, { city: "Chicago, IL" },
  { city: "Washington, DC" }, { city: "Los Angeles, CA" }, { city: "New York, NY" },
  { city: "Charlotte, NC" }, { city: "Dallas, TX" },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  return `${n}+`;
}

export default function Home() {
  const { data: businessesData, isLoading } = useListBusinesses({ limit: 3 });
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referredBy, setReferredBy] = useState("");
  const [waitlistStats, setWaitlistStats] = useState<WaitlistStats | null>(null);
  const referredByRef = useRef(false);

  useEffect(() => {
    fetch(`${BASE}api/waitlist/count`)
      .then(r => r.json())
      .then((data: WaitlistStats) => setWaitlistStats(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (referredByRef.current) return;
    referredByRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferredBy(ref.toUpperCase());
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined, city, state, isBusinessOwner, referredBy: referredBy.trim() || undefined }),
      });
      const data = await res.json();
      setPosition(data.position ?? null);
      setReferralCode(data.referralCode ?? null);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#FAF6EF]">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[110vh] flex items-center pt-20 pb-32 overflow-hidden bg-[#2B1507]">
        <img src={`${import.meta.env.BASE_URL}images/hero-home-bg.png`} alt="" className="absolute inset-0 w-full h-full object-cover object-bottom scale-150 origin-bottom" />
        <div className="absolute inset-0 bg-[#2B1507]/82 z-0" />
        
        <div className="relative z-10 container mx-auto px-6 md:px-10 max-w-5xl flex flex-col items-start text-left">
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10">
              <Shield className="w-3 h-3 text-[#CA922B]" />
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">SAFETY-FIRST COMMUNITY INTELLIGENCE</span>
            </div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10">
              <Users className="w-3 h-3 text-[#F5EBD8]" />
              <span className="text-xs font-bold text-[#F5EBD8]">
                {waitlistStats && waitlistStats.count >= 1000 ? `${formatCount(waitlistStats.count)} community members waiting` : "10,000+ community members waiting"}
              </span>
            </div>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white mb-6 leading-tight">
            Map Your Life.<br />
            <span style={{ color: '#CA922B' }}>Connect Deeper.</span><br />
            Live With Purpose.
          </h1>

          <p className="text-base md:text-lg text-[#F5EBD8] mb-3 max-w-2xl font-semibold leading-relaxed">
            Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences and community-driven insights.
          </p>
          <p className="text-sm md:text-base text-[#F5EBD8] mb-10 max-w-2xl font-semibold leading-relaxed">
            Most platforms tell you where to go. We help you understand what's really there — and direct your dollars to businesses that reflect your culture and community.
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-2.5 mb-10 max-w-3xl">
            {[
              "Find Businesses", "Discover Events", "Join Groups", "Network Professionally", 
              "Find Travel Partners", "Safety Intelligence", "Real-Time Alerts", "AI Recommendations"
            ].map((label, idx) => (
              <div key={idx} className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/20 border border-white/15 text-[#F5EBD8] text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-[#CA922B] shrink-0" />
                <span>{label}</span>
                <ArrowRight className="w-3 h-3 opacity-60 shrink-0" />
              </div>
            ))}
          </div>

          {/* Waitlist Form */}
          <div className="w-full max-w-lg space-y-3">
            {submitted ? (
              <div className="bg-[#CA922B]/20 border border-[#CA922B]/40 rounded-2xl px-6 py-5 text-center">
                <div className="text-2xl mb-2">🎉</div>
                <p className="text-white font-bold text-lg">You're on the list!</p>
                {position && <p className="text-[#CA922B] font-bold text-sm mt-1">#{position} in line</p>}
                <p className="text-[#F5EBD8]/70 text-sm mt-1">We'll reach out when your city launches. Tell a friend!</p>
                {referralCode && <p className="text-[#F5EBD8]/50 text-xs mt-2">Your referral code: <span className="font-bold text-[#CA922B]">{referralCode}</span></p>}
              </div>
            ) : (
            <>
            {/* Email + CTA row */}
            <form onSubmit={handleWaitlist}>
            {/* First + Last name row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60"
                placeholder="First name"
              />
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60"
                placeholder="Last name"
              />
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60"
                placeholder="Enter your email address"
              />
              <Button type="submit" disabled={submitting} className="shrink-0 h-[50px] px-5 rounded-xl bg-[#CA922B] hover:bg-[#B38024] text-white font-bold text-sm whitespace-nowrap">
                {submitting ? "Joining..." : "Join the Waitlist"}
              </Button>
            </div>

            {/* City + State row */}
            <div className="flex gap-2">
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60"
                placeholder="Your city"
              />
              <input
                type="text"
                value={state}
                onChange={e => setState(e.target.value)}
                maxLength={2}
                className="w-28 bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60 uppercase"
                placeholder="STATE"
              />
            </div>
            <p className="text-xs text-[#F5EBD8]/50">What city and state are you from? We're testing in select locations first.</p>

            {/* Business owner toggle */}
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                onClick={() => setIsBusinessOwner(b => !b)}
                className={`w-10 h-6 rounded-full transition-colors shrink-0 flex items-center ${isBusinessOwner ? "bg-[#CA922B]" : "bg-white/20"}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm mx-1 transition-transform ${isBusinessOwner ? "translate-x-4" : "translate-x-0"}`} />
              </div>
              <span className="text-sm text-[#F5EBD8]/80">I own or operate a Minority-owned business</span>
            </label>

            {/* Referral code input */}
            <div className="space-y-1">
              <input
                type="text"
                value={referredBy}
                onChange={e => setReferredBy(e.target.value.toUpperCase())}
                maxLength={12}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60 uppercase tracking-widest"
                placeholder="REFERRAL CODE (optional)"
              />
              <p className="text-xs text-[#F5EBD8]/40">Have a friend's referral code? Enter it above to move up the list.</p>
            </div>

            {/* Referral row */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#F5EBD8]/70 shrink-0">Know someone? Refer them:</span>
              <div className="flex items-center gap-2">
                {[
                  { icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "X" },
                  { icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
                  { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
                  { icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
                  { icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.21 8.21 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/></svg>, label: "TikTok" },
                  { icon: <Link2 className="w-4 h-4" />, label: "Copy link" },
                ].map((s, i) => (
                  <button key={i} title={s.label} onClick={() => openShare(s.label)} className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-[#F5EBD8] flex items-center justify-center hover:bg-[#CA922B]/20 hover:border-[#CA922B]/40 transition-colors">
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-[#F5EBD8]/50">Free to join. No spam, ever.</p>

            {/* Spread the word row */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-sm font-semibold text-[#F5EBD8] shrink-0">Spread the word</span>
              <div className="flex items-center gap-2">
                {[
                  { icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.912-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "X" },
                  { icon: <Facebook className="w-4 h-4" />, label: "Facebook" },
                  { icon: <Linkedin className="w-4 h-4" />, label: "LinkedIn" },
                  { icon: <Instagram className="w-4 h-4" />, label: "Instagram" },
                  { icon: <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.21 8.21 0 0 0 4.79 1.52V6.76a4.85 4.85 0 0 1-1.02-.07z"/></svg>, label: "TikTok" },
                  { icon: <Link2 className="w-4 h-4" />, label: "Copy link" },
                ].map((s, i) => (
                  <button key={i} title={s.label} onClick={() => openShare(s.label)} className="w-8 h-8 rounded-full bg-white/10 border border-white/15 text-[#F5EBD8] flex items-center justify-center hover:bg-[#CA922B]/20 hover:border-[#CA922B]/40 transition-colors">
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>
            </form>
            </>
            )}
          </div>

          {/* Scroll indicator */}
          <div className="mt-12 flex flex-col items-center gap-1 text-[#F5EBD8]/40 self-center">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Scroll</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[#3A1F0E] py-8 border-y border-white/5">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-white/10">
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">
                {waitlistStats && waitlistStats.count >= 1000 ? `${formatCount(waitlistStats.count)} Members` : "10K+ Community Members"}
              </div>
              <div className="text-sm text-[#F5EBD8]/70">And growing every day</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">200+ Cities Covered</div>
              <div className="text-sm text-[#F5EBD8]/70">Across the US and beyond</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">96/100 Avg. Confidence Score</div>
              <div className="text-sm text-[#F5EBD8]/70">For top-rated destinations</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">100% Community-Sourced</div>
              <div className="text-sm text-[#F5EBD8]/70">Every insight, every review</div>
            </div>
          </div>
        </div>
      </section>

      {/* City / State Social Proof Strip */}
      <section className="bg-[#FAF6EF] py-10 border-b border-[#3A1F0E]/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-center text-xs font-bold tracking-widest uppercase text-[#3A1F0E]/50 mb-5">
            Cities already on the waitlist
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(waitlistStats?.cities.length ? waitlistStats.cities : FALLBACK_CITIES).map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#3A1F0E]/10 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#CA922B]" />
                <span className="text-sm font-semibold text-[#3A1F0E]">{c.city}</span>
                {waitlistStats?.cities.length ? (
                  <span className="text-xs text-[#3A1F0E]/50 font-bold">{(c as { city: string; count: number }).count} waiting</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral CTA Section */}
      <section className="py-20 bg-[#2B1507] text-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <UserPlus className="w-3.5 h-3.5 text-[#CA922B]" />
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Move Up the List</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">
            Invite Friends. Move Up. Get In First.
          </h2>
          <p className="text-[#F5EBD8]/70 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Already on the waitlist? Every friend you invite moves you higher. The more you share, the sooner you get access — and first-in members unlock <span className="text-[#CA922B] font-bold">Founding Member</span> perks: discounted membership, early feature access, and a permanent community badge.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { num: "1", title: "Join the Waitlist", desc: "Sign up above and grab your unique referral code." },
              { num: "2", title: "Share With Your Network", desc: "Post your referral link on social, text friends, or drop it in a group chat." },
              { num: "3", title: "Move to the Front", desc: "Each confirmed referral bumps you up. Top referrers unlock Founding Member status." },
            ].map((step, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left">
                <div className="w-10 h-10 rounded-full bg-[#CA922B] text-white font-bold flex items-center justify-center font-serif text-lg mb-4">{step.num}</div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-[#F5EBD8]/60 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
          <a href="#waitlist-form">
            <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-14 text-base font-bold">
              Join & Get Your Referral Link
            </Button>
          </a>
          <p className="text-[#F5EBD8]/40 text-xs mt-4">Already signed up? Check your confirmation email for your referral code.</p>
        </div>
      </section>

      {/* "More Than a Travel App" */}
      <section className="py-0 bg-[#FAF6EF] overflow-hidden">
        <div className="grid lg:grid-cols-2 min-h-[420px]">
          <div className="relative h-72 lg:h-auto">
            <img
              src="https://images.pexels.com/photos/6579020/pexels-photo-6579020.jpeg?auto=compress&cs=tinysrgb&w=1200&h=800&dpr=1"
              alt="Happy young African American couple sharing a joyful moment together"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-[#2B1507]/10" />
          </div>
          <div className="flex flex-col justify-center px-10 py-16 lg:py-20 bg-[#FAF6EF]">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">More Than a Travel App</h2>
            <p className="text-lg md:text-xl text-[#3A1F0E]/80 leading-relaxed">
              Mapping with Melanin™ helps you map your life — exposing you to the real culture within your local and global communities so you can make conscious decisions on where you live, where you buy, and where you travel, while keeping Minority dollars circulating within Minority communities.
            </p>
          </div>
        </div>
      </section>

      {/* Why We Built This */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">WHY WE BUILT THIS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Life Shouldn't Require Guesswork.</h2>
            <div className="space-y-6 text-lg text-[#3A1F0E]/80 text-left">
              <p>Finding welcoming businesses, trusted recommendations, cultural experiences, and reliable information shouldn't depend on luck — whether you're exploring a new city or navigating your own neighborhood.</p>
              <p>Consumers are increasingly intentional about where they spend their money and how they engage with their communities. Mapping with Melanin™ was built to meet that moment — providing a trusted platform for discovering businesses, employers, destinations, and communities that align with your preferences, interests, and values.</p>
              <p>Mapping with Melanin™ is a community-powered platform that helps people discover trusted businesses, meaningful connections, welcoming communities, and new opportunities. Through shared experiences, local insights, and technology-driven discovery, we empower individuals to make informed decisions about where they live, work, travel, and thrive. Our mission is to foster connection, economic empowerment, and belonging by helping people navigate the world with greater confidence and community support.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every dollar you spend is a vote. We make it easy to cast that vote for Minority-owned businesses, melanated entrepreneurs, and community-rooted spaces that reinvest in the culture — so the economic power of the Minority dollar stays where it belongs."</p>
            </div>
            <div className="bg-[#FAF6EF] p-8 rounded-2xl border border-[#3A1F0E]/5 shadow-sm">
              <p className="text-xl font-serif text-[#3A1F0E] leading-relaxed italic">"Every score, review, and recommendation on this platform comes from people who've actually been there. That's not a feature. That's the foundation."</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE PROBLEM</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">People Lack Trusted Information When It Matters Most.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Consumers are increasingly intentional about where they spend their money and how they engage with their communities — yet the trusted, values-aligned information they need to act on that intention simply doesn't exist in one place.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Travel Destinations</h3>
              <p className="text-[#3A1F0E]/70">People don't know if a destination is truly welcoming, safe, or culturally aligned — until they're already there.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Relocation Decisions</h3>
              <p className="text-[#3A1F0E]/70">Moving to a new city is one of life's biggest decisions. Yet there's no trusted community-sourced intelligence to guide it.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Employers & Workplaces</h3>
              <p className="text-[#3A1F0E]/70">Individuals lack transparent, community-verified insight into whether an employer's culture actually reflects their values.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
              <h3 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-4">Community Fit</h3>
              <p className="text-[#3A1F0E]/70">Finding your people — the businesses, neighborhoods, and networks that reflect your identity — shouldn't require luck.</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">THE SOLUTION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Mapping with Melanin™ Helps You Make Conscious Decisions.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Mapping with Melanin™ provides a trusted platform for discovering businesses, employers, destinations, and communities that align with your preferences, interests, and values — so every decision you make is an informed, intentional one.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Discover Places", desc: "Community-verified destinations, neighborhoods, and local gems — rated by people who've actually been there." },
              { title: "Evaluate Cities", desc: "Deep relocation intelligence: safety scores, community culture, cost of living context, and neighborhood fit." },
              { title: "Review Employers", desc: "Transparent employer profiles with community-sourced culture ratings, inclusion scores, and career opportunities." },
              { title: "Build Community", desc: "Find your people — connect with like-minded individuals who share your values, interests, and identity." },
              { title: "Connect Before You Arrive", desc: "Build relationships, join local groups, and get insider knowledge before you ever set foot in a new city." },
            ].map((item, idx) => (
              <div key={idx} className="bg-[#FAF6EF] p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5">
                <div className="w-12 h-12 rounded-full bg-white border border-[#CA922B]/20 flex items-center justify-center mb-6">
                  <Check className="w-6 h-6 text-[#CA922B]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{item.title}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Future Vision */}
      <section className="py-24 bg-[#2B1507] text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">FUTURE VISION</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-6">A Platform Built to Scale Across Every Dimension of Life.</h2>
            <p className="text-lg text-[#F5EBD8]/70 max-w-3xl mx-auto mb-10">
              As intentional spending and values-driven community engagement become the norm, Mapping with Melanin™ is positioned to be the trusted infrastructure that connects conscious consumers to the businesses, employers, and communities that reflect who they are — at every stage of life.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {["Travel", "Relocation", "Social Networking", "Local Commerce", "Events", "Community Building"].map(topic => (
                <div key={topic} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm">
                  {topic}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-4 mb-16">
            {[
              { phase: "Phase 1", title: "Community Platform", desc: "Consumer subscriptions · Business memberships · Safety intelligence · Community reviews" },
              { phase: "Phase 2", title: "Commerce & Discovery", desc: "Sponsored recommendations · Featured business listings · Relocation services · Employer profiles" },
              { phase: "Phase 3", title: "Marketplace & Transactions", desc: "Marketplace sales tools · Travel bookings · Merchandise shops · Event ticketing" },
              { phase: "Phase 4", title: "Ecosystem & Scale", desc: "AI-powered recommendations · Enterprise partnerships · Business growth tools · Global expansion" }
            ].map((p, idx) => (
              <div key={idx} className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="text-[#CA922B] font-bold text-xs uppercase tracking-wider mb-2">{p.phase}</div>
                <h3 className="text-xl font-serif font-bold mb-4">{p.title}</h3>
                <p className="text-[#F5EBD8]/60 text-sm leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <h3 className="text-3xl md:text-4xl font-serif font-bold text-[#CA922B] italic">"Map Your World™ — Discover businesses, communities, opportunities, and experiences that help you thrive wherever you land."</h3>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PLATFORM FEATURES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Everything You Need. Nothing You Don't.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Six pillars that set Mapping with Melanin™ apart from every other travel platform on the market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Real-Time Safety Alerts",
                desc: "Receive real-time alerts about incidents, travel disruptions, weather events, public safety concerns, and community-reported conditions that may impact your journey.",
                bullets: ["Real-time notifications", "Community safety reports", "Travel disruption alerts", "Location-based warnings", "Emergency resource information"],
                label: "Key Differentiator"
              },
              {
                title: "Community Safety Intelligence",
                desc: "Access insights from community members who share experiences, recommendations, and observations that help others travel more confidently.",
                bullets: ["Neighborhood insights", "Local recommendations", "Community ratings", "Traveler experiences", "Trusted perspectives"],
                label: "Powered By Real Experiences"
              },
              {
                title: "Community Confidence Ratings",
                desc: "Discover businesses, destinations, events, and community spaces recommended by people who value inclusion, hospitality, and positive experiences.",
                bullets: ["Inclusivity ratings", "Welcoming venues", "Community-vetted spaces", "Cultural landmarks", "Community-recommended destinations"],
                label: "Find Places Where You Feel Welcome"
              },
              {
                title: "Verified Business Directory",
                desc: "Connect with verified businesses, service providers, and entrepreneurs while exploring new cities and communities.",
                bullets: ["Business verification", "Customer reviews", "Community recommendations", "Featured local businesses", "Direct contact info"],
                label: "Support Trusted Businesses"
              },
              {
                title: "Smart Trip Planning",
                desc: "Combine destination discovery with safety insights, local recommendations, events, and community intelligence for every trip.",
                bullets: ["Integrated safety data", "Local event discovery", "Community itineraries", "Destination scores", "Personalized suggestions"],
                label: "Plan With More Than Just Maps"
              },
              {
                title: "Emergency Resource Hub",
                desc: "Quick access to emergency contacts, nearby hospitals, urgent care centers, emergency services, transportation resources, and support services.",
                bullets: ["Emergency contacts", "Nearby hospitals", "Urgent care locator", "Transportation resources", "Support services"],
                label: "Help When You Need It Most · Key Differentiator"
              }
            ].map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5 flex flex-col">
                <div className="text-xs font-bold tracking-widest text-[#CA922B] uppercase mb-4">{f.label}</div>
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E] mb-3">{f.title}</h3>
                <p className="text-[#3A1F0E]/70 text-sm leading-relaxed mb-6 flex-1">{f.desc}</p>
                <ul className="space-y-2 text-sm text-[#3A1F0E]/60 border-t border-[#3A1F0E]/5 pt-4">
                  {f.bullets.map(b => (
                    <li key={b} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KinfolkAI Feature Section */}
      <section className="py-24 bg-[#2B1507] overflow-hidden relative">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 70% 50%, #CA922B 0%, transparent 60%)" }} />
        <div className="container mx-auto px-4 max-w-6xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <Sparkles className="w-3 h-3 text-[#CA922B]" />
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">KinfolkAI™ — Exclusive Feature</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-6 leading-tight">
                Your AI travel guide that actually knows the culture.
              </h2>
              <p className="text-[#F5EBD8]/70 text-lg mb-8 leading-relaxed">
                Ask KinfolkAI where to eat, stay, explore, and how to stay safe — and get recommendations shaped by your tastes, your budget, and the real community behind each city.
              </p>
              <div className="space-y-3 mb-10">
                {[
                  "Plan a full weekend itinerary with Black-owned spots only",
                  "Get neighborhood safety scores before you arrive",
                  "Discover hidden gems your family will actually love",
                  "Personalized to your vibe, budget & dietary needs",
                ].map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#CA922B]/20 border border-[#CA922B]/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-[#CA922B]" />
                    </div>
                    <span className="text-[#F5EBD8]/80 text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/travel">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white font-bold px-8 h-12 text-base">
                  Chat with KinfolkAI <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                  <div className="w-8 h-8 rounded-full bg-[#CA922B] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">KinfolkAI™</div>
                    <div className="text-[#F5EBD8]/40 text-xs">Your cultural travel companion</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-[#CA922B]/20 border border-[#CA922B]/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                      <p className="text-[#F5EBD8] text-sm">"Plan me a Black-owned food crawl in Atlanta this Saturday — soul food and brunch spots, under $30 a person"</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[90%] space-y-2">
                      <p className="text-[#F5EBD8] text-sm font-medium">Here's your Saturday crawl, kin! 🙌🏾</p>
                      <p className="text-[#F5EBD8]/70 text-xs leading-relaxed">
                        <span className="text-[#CA922B] font-bold">11am</span> — Busy Bee Cafe (West End) — iconic soul food, cash-only, go early<br />
                        <span className="text-[#CA922B] font-bold">1:30pm</span> — Slutty Vegan on Edgewood — plant-based, huge energy, Black-founded<br />
                        <span className="text-[#CA922B] font-bold">3pm</span> — Sweet Auburn Market — browse, snack, community vibe<br />
                        <span className="text-[#CA922B] font-bold">Safety note:</span> all spots rated 4.5+ by the community ✓
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-white/10">
                  {["Add dinner options", "Show me the map", "What about DC instead?"].map(chip => (
                    <Link key={chip} href="/travel">
                      <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-[#F5EBD8]/70 text-xs hover:bg-[#CA922B]/20 hover:border-[#CA922B]/40 hover:text-[#CA922B] transition-colors cursor-pointer">
                        {chip}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <p className="text-center text-[#F5EBD8]/30 text-xs">Navigator+ members get full KinfolkAI access with saved trips & personalization</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-[#3A1F0E] mb-4">Why Mapping with Melanin™ — The Platform Others Can't Match</h2>
            <p className="text-lg text-[#3A1F0E]/70">See exactly what sets us apart from those other apps.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 bg-[#FAF6EF] font-bold text-[#3A1F0E] rounded-tl-xl border-b border-[#3A1F0E]/10">Feature</th>
                  <th className="py-4 px-6 bg-[#FAF6EF] font-bold text-[#3A1F0E] text-center border-b border-[#3A1F0E]/10">Traditional Apps</th>
                  <th className="py-4 px-6 bg-[#2B1507] font-bold text-white text-center rounded-tr-xl border-b border-[#2B1507]">Mapping with Melanin™</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3A1F0E]/10">
                {[
                  { f: "Navigation", t: "✓", m: "✓" },
                  { f: "Business Discovery", t: "✓", m: "✓" },
                  { f: "Community Reviews", t: "✓", m: "✓" },
                  { f: "Real-Time Safety Alerts", t: "Limited", m: "✓" },
                  { f: "Community Safety Insights", t: "✗", m: "✓" },
                  { f: "Community Confidence Ratings", t: "✗", m: "✓" },
                  { f: "Verified Business Network", t: "Limited", m: "✓" },
                  { f: "Emergency Resources", t: "✗", m: "✓" },
                  { f: "Cultural Discovery", t: "Limited", m: "✓" },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-[#FAF6EF]/50">
                    <td className="py-4 px-6 font-medium text-[#3A1F0E]">{row.f}</td>
                    <td className="py-4 px-6 text-center text-[#3A1F0E]/60">{row.t}</td>
                    <td className="py-4 px-6 text-center text-[#CA922B] font-bold bg-[#FAF6EF]/30">{row.m}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Community Score Explainer */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">OUR STRONGEST DIFFERENTIATOR</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">How Community Scores Work</h2>
              <p className="text-lg text-[#3A1F0E]/70 mb-10">
                A 96/100 Community Score isn't a star rating — it's a composite signal built from six layers of real community data. Google Maps doesn't have it. TripAdvisor doesn't have it. Yelp doesn't have it.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Safety Ratings", desc: "Members rate how safe they felt at every location they visit. Scores are updated as new community feedback is submitted and reviewed." },
                  { title: "Recommendation Rate", desc: "The percentage of visitors who would recommend this place to others in the community." },
                  { title: "Would Return Alone %", desc: "A unique metric — would a solo traveler feel comfortable returning unaccompanied? One of many factors we weigh." },
                  { title: "Verified Reviews", desc: "Reviews from authenticated community members carry more weight. Verification reflects information submitted and reviewed according to our standards." },
                  { title: "Community Engagement", desc: "Active, responsive businesses and frequently-visited locations score higher — a signal of ongoing community trust." },
                  { title: "Recent Activity", desc: "Scores reflect current conditions, not just historical data. Rankings should be considered one of many factors when evaluating a destination." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0 mt-1">
                      <Star className="w-4 h-4 text-[#CA922B]" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#3A1F0E]">{item.title}</h4>
                      <p className="text-sm text-[#3A1F0E]/70 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/safety"><Button className="mt-8 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">See Scores in Action</Button></Link>
            </div>
            
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#3A1F0E]/5">
              <div className="text-xs font-bold text-[#3A1F0E]/40 uppercase tracking-widest mb-4">Live Example</div>
              <div className="bg-[#2B1507] rounded-2xl p-6 text-white mb-6">
                <div className="text-3xl font-serif font-bold mb-1">The Gathering Table</div>
                <div className="text-[#F5EBD8]/70 text-sm mb-6">Restaurant · Atlanta, GA</div>
                <div className="flex items-end gap-4 mb-2">
                  <div className="text-6xl font-bold text-[#CA922B] leading-none">96</div>
                  <div className="text-xl font-serif text-[#F5EBD8]/80 pb-1">/100</div>
                </div>
                <div className="text-sm font-bold tracking-widest uppercase text-[#F5EBD8]/50">Community Score</div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Recommend</span>
                  <span className="font-bold text-[#3A1F0E]">97%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Return Alone</span>
                  <span className="font-bold text-[#3A1F0E]">94%</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-[#3A1F0E]/5">
                  <span className="text-[#3A1F0E]/70 font-medium">Safety Rating</span>
                  <span className="font-bold text-[#3A1F0E] flex items-center gap-1">4.9/5 <Star className="w-4 h-4 text-[#CA922B] fill-current" /></span>
                </div>
                <div className="flex flex-wrap gap-2 pt-4">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">✓ Yes Verified</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">🛡️ Community Trusted</span>
                  <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-bold rounded-full">⭐ Highly Recommended</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Intelligence */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1 rounded-3xl text-white relative overflow-hidden h-full flex flex-col justify-end min-h-[480px]">
              <img
                src="https://images.pexels.com/photos/1820978/pexels-photo-1820978.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Carefree young Minority woman exploring the city"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2B1507]/90 via-[#2B1507]/30 to-transparent"></div>
              <div className="relative z-10 p-8">
                <div className="inline-block bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-left w-full">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                    <span className="font-bold text-lg">All Clear</span>
                  </div>
                  <div className="text-sm text-[#F5EBD8]/80 mb-4">Atlanta, GA</div>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-[#CA922B]/20 text-[#CA922B] text-xs font-bold px-2 py-1 rounded">4.9 Community Trust Score</span>
                    <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded">10K+ Early Members</span>
                    <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded">Community Intelligence</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">SAFETY INTELLIGENCE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Know Before You Go. Every Time.</h2>
              <p className="text-lg text-[#3A1F0E]/70 mb-10">
                Most travel apps focus on where to go. Mapping with Melanin™ focuses on helping you make informed decisions before you arrive. Community-driven safety intelligence means real people sharing real experiences — so you always know what to expect.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Real-Time Safety Alerts", desc: "Incidents, disruptions, and community-reported conditions delivered instantly" },
                  { title: "Community Safety Scores", desc: "Aggregated ratings for neighborhoods, cities, and destinations" },
                  { title: "Verified Member Program", desc: "Trusted interactions with authenticated members through liveness checks and anti-fraud protection" },
                  { title: "Emergency Resource Hub", desc: "Hospitals, urgent care, emergency services, and support services — one tap away" }
                ].map((item, i) => (
                  <div key={i}>
                    <h4 className="font-bold text-[#3A1F0E] text-lg">{item.title}</h4>
                    <p className="text-[#3A1F0E]/70">{item.desc}</p>
                  </div>
                ))}
              </div>
              <Link href="/safety"><Button className="mt-10 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12">Explore Safety Features</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY INTELLIGENCE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">People Return Because They Contribute</h2>
          <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto mb-16">
            The most powerful feature of Mapping with Melanin™ is its community. Members don't just consume information — they create it, verify it, and share it so everyone travels better.
          </p>

          {/* Community photo strip */}
          <div className="grid grid-cols-3 gap-3 mb-12 rounded-2xl overflow-hidden" style={{ height: "420px" }}>
            <div className="relative overflow-hidden rounded-xl">
              <img
                src="https://images.pexels.com/photos/3894383/pexels-photo-3894383.jpeg?auto=compress&cs=tinysrgb&w=700&h=900&fit=crop&dpr=1"
                alt="African American women collaborating in a business setting"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 15%" }}
              />
            </div>
            <div className="relative overflow-hidden rounded-xl">
              <img
                src="https://images.pexels.com/photos/6140968/pexels-photo-6140968.jpeg?auto=compress&cs=tinysrgb&w=700&h=900&fit=crop&dpr=1"
                alt="Two African American men enjoying a moment together, laughing and sharing"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 15%" }}
              />
            </div>
            <div className="relative overflow-hidden rounded-xl">
              <img
                src="https://images.pexels.com/photos/2731372/pexels-photo-2731372.jpeg?auto=compress&cs=tinysrgb&w=700&h=900&fit=crop&dpr=1"
                alt="Stylish African American women enjoying life in vibrant outfits"
                className="w-full h-full object-cover"
                style={{ objectPosition: "center 5%" }}
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 text-left mb-12">
            {[
              { title: "Community Reports", desc: "Report safety concerns, share positive experiences, recommend locations" },
              { title: "Local Ambassadors", desc: "City Ambassadors, Community Contributors, and Business Champions" },
              { title: "Safety Scores", desc: "Location confidence scores based on reports, ratings, and verified data" },
              { title: "Networking", desc: "Connect with professionals and entrepreneurs who share your values" },
              { title: "Local Meetups", desc: "Join events and gatherings in cities around the world" }
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-[#3A1F0E]/5">
                <h4 className="font-bold text-[#3A1F0E] mb-2">{item.title}</h4>
                <p className="text-sm text-[#3A1F0E]/70">{item.desc}</p>
              </div>
            ))}
          </div>
          <Link href="/community"><Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-12">Join the Community</Button></Link>
        </div>
      </section>

      {/* Business Directory Preview — Photo Grid */}
      <section className="py-16 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top grid: big left + two stacked right */}
          <div className="grid grid-cols-5 gap-3 mb-3">
            {/* Big left — Minority-Owned Businesses */}
            <div className="col-span-3 relative rounded-2xl overflow-hidden h-[420px] group cursor-pointer">
              <img src="https://images.pexels.com/photos/8636601/pexels-photo-8636601.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&fit=crop&dpr=1" alt="Diverse multiracial business team in a focused professional meeting" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ objectPosition: "center 20%" }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="font-serif font-bold text-xl text-white mb-1">Minority-Owned Businesses</h3>
                <p className="text-sm text-white/80">Support entrepreneurs who reflect your values</p>
              </div>
            </div>

            {/* Right column — two stacked */}
            <div className="col-span-2 flex flex-col gap-3">
              {/* Cultural Landmarks */}
              <div className="relative rounded-2xl overflow-hidden h-[204px] group cursor-pointer">
                <img src="https://images.pexels.com/photos/5261131/pexels-photo-5261131.jpeg?auto=compress&cs=tinysrgb&w=800&h=500&fit=crop&dpr=1" alt="Historic Harlem brownstone facade, iconic Minority neighborhood" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" style={{ objectPosition: "center 30%" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="font-serif font-bold text-base text-white mb-0.5">Cultural Landmarks</h3>
                  <p className="text-xs text-white/80">Heritage sites &amp; historic destinations</p>
                </div>
              </div>
              {/* Restaurants & Nightlife */}
              <div className="relative rounded-2xl overflow-hidden h-[204px] group cursor-pointer">
                <img src={`${import.meta.env.BASE_URL}images/cat-restaurants.jpg`} alt="Restaurants & Nightlife" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="font-serif font-bold text-base text-white mb-0.5">Restaurants &amp; Nightlife</h3>
                  <p className="text-xs text-white/80">Dine and unwind where you belong</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom grid: Hotels + Hidden Gems */}
          <div className="grid grid-cols-5 gap-3 mb-8">
            {/* Hotels & Stays */}
            <div className="col-span-2 relative rounded-2xl overflow-hidden h-[220px] group cursor-pointer">
              <img src={`${import.meta.env.BASE_URL}images/cat-hotels.jpg`} alt="Hotels & Stays" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-serif font-bold text-base text-white mb-0.5">Hotels &amp; Stays</h3>
                <p className="text-xs text-white/80">Rest easy at welcoming accommodations</p>
              </div>
            </div>
            {/* Hidden Gems */}
            <div className="col-span-3 relative rounded-2xl overflow-hidden h-[220px] group cursor-pointer">
              <img src={`${import.meta.env.BASE_URL}images/cat-hidden-gems.jpg`} alt="Hidden Gems" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="font-serif font-bold text-base text-white mb-0.5">Hidden Gems</h3>
                <p className="text-xs text-white/80">Discover places only locals know</p>
              </div>
            </div>
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-3">
            {["Professional Services", "Community Events", "Tour Operators", "Realtors & Attorneys"].map(cat => (
              <span key={cat} className="px-5 py-2.5 bg-white text-[#3A1F0E] rounded-full text-sm font-medium border border-[#3A1F0E]/10 hover:border-[#CA922B]/40 cursor-pointer transition-colors">{cat}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Every Part */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">PLATFORM PREVIEW</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">Built for Every Part of Your Journey.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              From discovery to safety to community — Mapping with Melanin™ is a complete platform, not just a map.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {[
              { title: "Discover", label: "Find Minority-Owned Businesses", desc: "Search by city, category, or keyword. Every listing is community-verified." },
              { title: "Safety", label: "Real-Time Safety Intelligence", desc: "Community-sourced scores, alerts, and the 'Would Return Alone' metric." },
              { title: "Personalized", label: "Your Curated Feed", desc: "AI-powered picks based on your identity, interests, and travel goals." },
              { title: "Community", label: "Connect & Network", desc: "Join groups, attend meetups, and build relationships before you arrive." }
            ].map((c, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-[#3A1F0E]/5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-[#CA922B] font-serif">{i+1}</span>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">{c.title}</div>
                  <h4 className="font-bold text-[#3A1F0E] text-lg mb-2">{c.label}</h4>
                  <p className="text-[#3A1F0E]/70 text-sm">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/explore"><Button className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-12 mb-8">Explore the Platform</Button></Link>
            <p className="text-xs text-[#3A1F0E]/50">* A Minority-owned business is defined as any business that is 51% or more owned and operated by a Minority person or persons.</p>
          </div>
        </div>
      </section>

      {/* Events & Community Teaser */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-[#CA922B]" />
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMING SOON</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">
              Events. Groups. Community Feed.
            </h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Mapping with Melanin™ is more than a directory — it's a living community. We're building the tools to help you gather, connect, and belong. Here's a preview of what's coming.
            </p>
          </div>

          {/* Community event photo banner */}
          <div className="relative rounded-3xl overflow-hidden h-56 mb-10">
            <img
              src="https://images.pexels.com/photos/33556355/pexels-photo-33556355/free-photo-of-joyful-beach-play-in-black-and-white.jpeg?auto=compress&cs=tinysrgb&w=1260&h=400&dpr=1"
              alt="Minority children joyfully splashing and playing in the water"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#2B1507]/80 via-[#2B1507]/40 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-center px-10">
              <p className="text-[#CA922B] font-bold text-xs uppercase tracking-widest mb-2">Join 10,000+ Members</p>
              <p className="text-white font-serif font-bold text-2xl md:text-3xl max-w-md">Real people. Real places. Real connection.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {/* Events preview card */}
            <div className="bg-white rounded-3xl border border-[#3A1F0E]/5 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#2B1507] to-[#3A1F0E] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-[#CA922B]" />
                    <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Events</span>
                  </div>
                  <span className="text-xs font-bold text-white/40 bg-white/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                {[
                  { title: "ATL Minority Business Expo", date: "Aug 2026", loc: "Atlanta, GA", tag: "Business" },
                  { title: "Melanin & Mimosas Social", date: "Jul 2026", loc: "Houston, TX", tag: "Social" },
                  { title: "Travel While Minority Summit", date: "Sep 2026", loc: "New York, NY", tag: "Travel" },
                ].map((ev, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-white text-sm">{ev.title}</p>
                        <p className="text-[#F5EBD8]/50 text-xs mt-0.5">{ev.date} · {ev.loc}</p>
                      </div>
                      <span className="text-xs font-bold text-[#CA922B] bg-[#CA922B]/10 px-2 py-0.5 rounded-full shrink-0">{ev.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">Discover and RSVP to local events, expos, and community gatherings near you — or anywhere you're planning to travel.</p>
              </div>
            </div>

            {/* Groups preview card */}
            <div className="bg-white rounded-3xl border border-[#3A1F0E]/5 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#2B1507] to-[#3A1F0E] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#CA922B]" />
                    <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Groups</span>
                  </div>
                  <span className="text-xs font-bold text-white/40 bg-white/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                {[
                  { name: "Minority Travel Collective", members: "1.2K", type: "Travel" },
                  { name: "Melanated Entrepreneurs", members: "890", type: "Business" },
                  { name: "HBCU Alumni Network", members: "2.4K", type: "Network" },
                ].map((g, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="font-bold text-white text-sm">{g.name}</p>
                      <p className="text-[#F5EBD8]/50 text-xs mt-0.5">{g.members} members</p>
                    </div>
                    <span className="text-xs font-bold text-[#CA922B] bg-[#CA922B]/10 px-2 py-0.5 rounded-full shrink-0">{g.type}</span>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">Join groups built around travel, entrepreneurship, professional networking, and community interests — and connect before you arrive anywhere.</p>
              </div>
            </div>

            {/* Community Feed preview card */}
            <div className="bg-white rounded-3xl border border-[#3A1F0E]/5 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-br from-[#2B1507] to-[#3A1F0E] p-6 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#CA922B]" />
                    <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Community Feed</span>
                  </div>
                  <span className="text-xs font-bold text-white/40 bg-white/10 px-2 py-1 rounded-full">Coming Soon</span>
                </div>
                {[
                  { user: "Aaliyah T.", post: "Just discovered the best soul food spot in Charlotte 🙌 Adding it to my list!", time: "2m ago" },
                  { user: "Marcus J.", post: "Safety score just updated for Midtown ATL — looking great for this weekend!", time: "15m ago" },
                  { user: "Simone R.", post: "Our Dallas group is organizing a meetup next month. Who's in?", time: "1h ago" },
                ].map((p, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-[#CA922B]/30 text-[#CA922B] flex items-center justify-center text-[9px] font-bold shrink-0">{p.user[0]}</div>
                      <span className="text-xs font-bold text-[#F5EBD8]">{p.user}</span>
                      <span className="text-xs text-white/30 ml-auto">{p.time}</span>
                    </div>
                    <p className="text-[#F5EBD8]/70 text-xs leading-relaxed">{p.post}</p>
                  </div>
                ))}
              </div>
              <div className="p-5">
                <p className="text-sm text-[#3A1F0E]/70 leading-relaxed">A real-time feed of community posts, local tips, safety updates, and business recommendations from members in cities across the country.</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[#3A1F0E]/50 text-sm mb-6">These features are in development. Join the waitlist to be the first to access them when they launch.</p>
            <button
              onClick={() => document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center justify-center rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-12 font-medium text-sm transition-colors"
            >
              Join the Waitlist for Early Access
            </button>
          </div>
        </div>
      </section>

      {/* App Coming Soon */}
      <section className="py-24 bg-[#2B1507] text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMING SOON</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              The App Is Coming.
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Mapping with Melanin™ is headed to iOS and Android. Get early access the moment we launch — join the waitlist now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-14">
            {/* App Store badge */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 min-w-[220px]">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-white shrink-0" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Coming Soon</p>
                <p className="text-white font-bold text-lg leading-tight">App Store</p>
                <p className="text-white/60 text-xs">iOS</p>
              </div>
            </div>

            {/* Google Play badge */}
            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-8 py-5 min-w-[220px]">
              <svg viewBox="0 0 24 24" className="w-9 h-9 text-white shrink-0" fill="currentColor">
                <path d="M3.18 23.76c.3.17.64.22.98.15l13.27-7.67-2.88-2.88L3.18 23.76zm-1.5-20.3C1.25 3.83 1 4.28 1 4.86v14.28c0 .58.25 1.03.68 1.4l.08.07L9.6 12.7v-.18L1.76 4.69l-.08.77zm18.52 7.46l-2.42-1.4-3.22 3.22 3.22 3.22 2.44-1.41c.7-.4.7-1.06 0-1.46l-.02-.17zM4.16.24L17.43 7.9l-2.88 2.88L3.18.24C3.48.07 3.83.12 4.16.24z"/>
              </svg>
              <div>
                <p className="text-white/50 text-xs font-medium uppercase tracking-widest">Coming Soon</p>
                <p className="text-white font-bold text-lg leading-tight">Google Play</p>
                <p className="text-white/60 text-xs">Android</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-white/50 text-sm mb-5">Be the first to know when the app drops.</p>
            <a href="#waitlist-form" onClick={e => { e.preventDefault(); document.getElementById("waitlist-form")?.scrollIntoView({ behavior: "smooth" }); }}>
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-12 text-base font-semibold">
                Join the Waitlist →
              </Button>
            </a>
            <p className="text-white/30 text-xs mt-8 max-w-xl mx-auto leading-relaxed">
              Apple and the Apple logo are trademarks of Apple Inc., registered in the U.S. and other countries. App Store is a service mark of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC. Mapping with Melanin™ is not affiliated with, endorsed by, or sponsored by Apple Inc. or Google LLC. App availability, launch timing, and features are subject to change without notice. Joining the waitlist does not guarantee access or constitute a purchase agreement.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Counter */}
      <section className="py-16 bg-[#2B1507]">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/40 bg-[#CA922B]/10 mb-4">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Community Impact</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white">Growing Every Day</h2>
          </div>
          <ImpactCounter />
        </div>
      </section>

      {/* Community Voices */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMMUNITY VOICES</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">The Community Has Spoken.</h2>
            <p className="text-lg text-[#3A1F0E]/70 max-w-3xl mx-auto">
              Early members share why Mapping with Melanin™ is the platform they've been waiting for.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { 
                quote: "Finally a platform that actually understands what it means to travel while Minority. The safety scores alone are worth it — I checked three cities before my last trip and felt genuinely prepared.",
                name: "Aaliyah T.", role: "Frequent Traveler", loc: "Atlanta, GA", initials: "AT"
              },
              { 
                quote: "I've been looking for something like this for years. Being able to find Minority-owned restaurants, hotels, and shops in cities I've never visited — and know they're community-verified — is a game changer.",
                name: "Marcus J.", role: "Digital Nomad", loc: "Houston, TX", initials: "MJ"
              },
              { 
                quote: "The relocation intelligence is what sold me. I was moving from Chicago to Charlotte and had no idea where to start. Mapping with Melanin gave me neighborhood insights I couldn't find anywhere else.",
                name: "Simone R.", role: "Relocating Professional", loc: "Charlotte, NC", initials: "SR"
              },
              { 
                quote: "As a business owner, being listed on this platform has been incredible. I've seen new customers specifically say they found me here because they wanted to support verified Minority-owned businesses.",
                name: "DeShawn M.", role: "Business Owner", loc: "New Orleans, LA", initials: "DM"
              }
            ].map((t, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-3xl border border-[#3A1F0E]/5">
                <div className="text-4xl font-serif text-[#CA922B] opacity-50 mb-4">"</div>
                <p className="text-[#3A1F0E]/80 text-lg italic leading-relaxed mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <img
                    src={[
                      "https://images.pexels.com/photos/1820978/pexels-photo-1820978.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1",
                      "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1",
                      "https://images.pexels.com/photos/12895422/pexels-photo-12895422.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1",
                      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1",
                    ][i]}
                    alt={t.name}
                    className="w-12 h-12 rounded-full object-cover object-top"
                  />
                  <div>
                    <div className="font-bold text-[#3A1F0E]">{t.name}</div>
                    <div className="text-sm text-[#3A1F0E]/60">{t.role} · {t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
