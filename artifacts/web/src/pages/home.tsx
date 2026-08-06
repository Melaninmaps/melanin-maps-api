import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, ArrowRight, Shield, Search, Sparkles, Users, Building2, Globe, BookOpen, Facebook, Linkedin, Instagram, Link2, UserPlus, Trophy, Mail, Send, Store } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { RotatingQuoteBanner } from "@/components/RotatingQuoteBanner";

const BASE = import.meta.env.BASE_URL;
const SITE_URL = "https://mappingwithmelanin.com";
const SHARE_TEXT = encodeURIComponent("Join Mapping with Melanin — discover trusted businesses, travel safely, and connect with the community. 🌍✊🏾");
const BIZ_CATEGORIES = ["Restaurant", "Café", "Retail", "Beauty & Wellness", "Health & Fitness", "Arts & Culture", "Entertainment", "Professional Services", "Tech", "Home Services", "Food & Beverage", "Other"];

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

interface ImpactStats { businesses: number; cities: number; reviews: number; community: number; }

function ImpactCounter() {
  const [stats, setStats] = useState<ImpactStats | null>(null);
  useEffect(() => {
    fetch(`${BASE}api/impact`).then(r => r.ok ? r.json() : Promise.reject()).then(setStats).catch(() => {});
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

function WaveDivider({ fromBg, toBg, flip = false }: { fromBg: string; toBg: string; flip?: boolean }) {
  const d = flip
    ? "M0,40 C360,10 1080,70 1440,30 L1440,80 L0,80 Z"
    : "M0,30 C360,70 1080,10 1440,50 L1440,80 L0,80 Z";
  return (
    <div style={{ backgroundColor: fromBg, display: "block", lineHeight: 0, fontSize: 0 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 80" style={{ display: "block", width: "100%", height: "80px" }} preserveAspectRatio="none">
        <path d={d} fill={toBg} />
      </svg>
    </div>
  );
}

interface WaitlistStats {
  count: number;
  cities: { city: string; count: number }[];
}

const FALLBACK_CITIES = [
  { city: "Philadelphia, PA" }, { city: "Atlanta, GA" }, { city: "Houston, TX" },
  { city: "Chicago, IL" }, { city: "Washington, DC" }, { city: "Los Angeles, CA" },
  { city: "New York, NY" }, { city: "New Orleans, LA" },
];

function formatCount(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  return `${n}+`;
}

interface LeaderboardData {
  builders: { rank: number; firstName: string; referralCode: string; city: string | null; state: string | null; referralCount: number }[];
  cities: { rank: number; city: string; state: string | null; count: number }[];
}

function LeaderboardSection() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [tab, setTab] = useState<"builders" | "cities">("builders");

  useEffect(() => {
    fetch(`${BASE}api/waitlist/leaderboard`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: LeaderboardData) => { if (d && Array.isArray(d.builders)) setData(d); })
      .catch(() => {});
  }, []);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="bg-white border border-[#3A1F0E]/5 rounded-3xl shadow-sm overflow-hidden">
      <div className="flex border-b border-[#3A1F0E]/5">
        <button
          onClick={() => setTab("builders")}
          className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 ${tab === "builders" ? "bg-[#2B1507] text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#3A1F0E]"}`}
        >
          <Trophy className="w-4 h-4" /> Community Builders
        </button>
        <button
          onClick={() => setTab("cities")}
          className={`flex-1 py-4 text-sm font-bold tracking-wide transition-colors flex items-center justify-center gap-2 ${tab === "cities" ? "bg-[#2B1507] text-[#CA922B]" : "text-[#3A1F0E]/50 hover:text-[#3A1F0E]"}`}
        >
          <MapPin className="w-4 h-4" /> Top Cities
        </button>
      </div>

      <div className="divide-y divide-[#3A1F0E]/5">
        {tab === "builders" ? (
          !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-[#3A1F0E]/5 animate-pulse" />
                <div className="flex-1 h-4 rounded bg-[#3A1F0E]/5 animate-pulse" />
                <div className="w-12 h-4 rounded bg-[#3A1F0E]/5 animate-pulse" />
              </div>
            ))
          ) : data.builders.length === 0 ? (
            <div className="py-12 text-center text-[#3A1F0E]/40 text-sm">
              Be the first Community Builder — invite a friend!
            </div>
          ) : (
            data.builders.map((b, i) => (
              <div key={b.referralCode} className="flex items-center gap-4 px-6 py-4">
                <span className="text-xl w-8 text-center">{medals[i] ?? `#${b.rank}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#3A1F0E] text-sm truncate">{b.firstName}</p>
                  {b.city && <p className="text-xs text-[#3A1F0E]/50">{b.city}{b.state ? `, ${b.state}` : ""}</p>}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#CA922B] text-sm">{b.referralCount}</p>
                  <p className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide">{b.referralCount === 1 ? "referral" : "referrals"}</p>
                </div>
              </div>
            ))
          )
        ) : (
          !data ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 rounded-full bg-[#3A1F0E]/5 animate-pulse" />
                <div className="flex-1 h-4 rounded bg-[#3A1F0E]/5 animate-pulse" />
                <div className="w-12 h-4 rounded bg-[#3A1F0E]/5 animate-pulse" />
              </div>
            ))
          ) : data.cities.length === 0 ? (
            <div className="py-12 text-center text-[#3A1F0E]/40 text-sm">
              No cities yet — be the first from yours!
            </div>
          ) : (
            data.cities.map((c, i) => (
              <div key={c.city} className="flex items-center gap-4 px-6 py-4">
                <span className="text-xl w-8 text-center">{medals[i] ?? `#${c.rank}`}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#3A1F0E] text-sm truncate">{c.city}{c.state ? `, ${c.state}` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#CA922B] text-sm">{c.count}</p>
                  <p className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wide">members</p>
                </div>
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
}

export default function Home() {
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
  const [familyEmails, setFamilyEmails] = useState<string[]>([""]);
  const [showFamilySection, setShowFamilySection] = useState(false);
  const [cityNomination, setCityNomination] = useState("");

  const [inviteType, setInviteType] = useState<"friend" | "business">("friend");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteeName, setInviteeName] = useState("");
  const [inviteBizName, setInviteBizName] = useState("");
  const [myCode, setMyCode] = useState("");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [waitlistStats, setWaitlistStats] = useState<WaitlistStats | null>(null);
  const referredByRef = useRef(false);
  const [inviteTab, setInviteTab] = useState<"email" | "social">("email");
  const [socialPlatform, setSocialPlatform] = useState("instagram");
  const [socialHandle, setSocialHandle] = useState("");
  const [socialName, setSocialName] = useState("");
  const [socialReferType, setSocialReferType] = useState<"friend" | "business">("friend");
  const [socialBizName, setSocialBizName] = useState("");
  const [socialSubmitting, setSocialSubmitting] = useState(false);
  const [socialDone, setSocialDone] = useState(false);
  const [socialCopyMsg, setSocialCopyMsg] = useState("");
  const [showRecommend, setShowRecommend] = useState(false);
  const [recBizName, setRecBizName] = useState("");
  const [recWebsite, setRecWebsite] = useState("");
  const [recCity, setRecCity] = useState("");
  const [recState, setRecState] = useState("");
  const [recCategory, setRecCategory] = useState("");
  const [recNote, setRecNote] = useState("");
  const [recBizEmail, setRecBizEmail] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);
  const [recDone, setRecDone] = useState(false);

  useEffect(() => {
    fetch(`${BASE}api/waitlist/count`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: WaitlistStats) => { if (data && Array.isArray(data.cities)) setWaitlistStats(data); })
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
        body: JSON.stringify({ email, firstName: firstName.trim() || undefined, lastName: lastName.trim() || undefined, city, state, isBusinessOwner, referredBy: referredBy.trim() || undefined, cityNomination: cityNomination.trim() || undefined, familyEmails: showFamilySection ? familyEmails.filter(e => e.trim().includes("@") && e.trim().includes(".")).map(e => e.trim().toLowerCase()) : undefined }),
      });
      const data = await res.json();
      setPosition(data.position ?? null);
      const code = data.referralCode ?? null;
      setReferralCode(code);
      if (code) setMyCode(code);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail || !myCode) return;
    setInviteSubmitting(true);
    try {
      const body: Record<string, string> = {
        referralCode: myCode.trim().toUpperCase(),
        inviteeEmail: inviteEmail.trim(),
        type: inviteType,
      };
      if (inviteeName.trim()) body.inviteeName = inviteeName.trim();
      if (inviteType === "business" && inviteBizName.trim()) body.businessName = inviteBizName.trim();

      const res = await fetch(`${BASE}api/waitlist/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setInviteError(data.error ?? "Something went wrong"); return; }
      setInviteSent(true);
      setInviteEmail("");
      setInviteeName("");
      setInviteBizName("");
      setTimeout(() => setInviteSent(false), 4000);
    } catch {
      setInviteError("Failed to send invitation. Please try again.");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recBizName.trim() || recSubmitting) return;
    setRecSubmitting(true);
    try {
      await fetch(`${BASE}api/waitlist/recommend-business`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: recBizName.trim(),
          website: recWebsite.trim() || undefined,
          city: recCity.trim() || undefined,
          state: recState.trim() || undefined,
          category: recCategory || undefined,
          note: recNote.trim() || undefined,
          businessEmail: recBizEmail.trim() || undefined,
        }),
      });
      setRecDone(true);
    } catch {} finally { setRecSubmitting(false); }
  };

  const closeRecommend = () => {
    setShowRecommend(false);
    setRecDone(false);
    setRecBizName(""); setRecWebsite(""); setRecCity(""); setRecState("");
    setRecCategory(""); setRecNote(""); setRecBizEmail("");
  };

  const handleSocialRefer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialHandle.trim() || socialSubmitting) return;
    if (socialReferType === "business" && !socialBizName.trim()) return;
    setSocialSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/waitlist/social-refer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: socialPlatform,
          handleOrUrl: socialHandle.trim(),
          name: socialName.trim() || undefined,
          type: socialReferType,
          referralCode: myCode || referralCode || undefined,
          bizName: socialReferType === "business" ? socialBizName.trim() : undefined,
        }),
      });
      const data = await res.json() as { copyMessage?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setSocialCopyMsg(data.copyMessage ?? "");
      setSocialDone(true);
    } catch {
      setSocialDone(false);
    } finally {
      setSocialSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full bg-[#FAF6EF]">

      {/* ── HERO ── */}
      <section className="relative min-h-[50vh] md:min-h-[110vh] flex items-center pb-32 overflow-hidden bg-[#2B1507]">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-cobblestone.png?v=6"
            alt="Cobblestone street at night with businesses, street lights and puddle"
            className="w-full h-full object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2B1507]/60 via-[#2B1507]/25 to-[#2B1507]" />
        </div>

        <div className="container mx-auto px-4 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex flex-wrap gap-3 mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#CA922B]/40 bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold tracking-widest uppercase">
                  <Shield className="w-3 h-3" /> Safety-First Community Intelligence
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.05] mb-8">
                Map Your Life.<br />
                <span className="text-[#CA922B]">Connect Deeper.</span><br />
                Live With Purpose.
              </h1>

              <p className="text-lg md:text-xl text-[#F5EBD8]/80 font-semibold mb-4 max-w-xl leading-relaxed">
                Mapping with Melanin™ connects people to trusted businesses, meaningful relationships, thriving communities, and new opportunities through the power of shared experiences and community-driven insights.
              </p>
              <p className="text-base text-[#F5EBD8]/60 font-semibold mb-10 max-w-xl leading-relaxed">
                Most platforms tell you where to go. We help you understand what's really there — and direct your dollars to businesses that reflect your culture and community.
              </p>

              {/* Choose Your Experience CTA */}
              <div className="mb-8">
                <a
                  href="/preview"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-[#2B1507] text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg,#CA922B,#daa83a)", boxShadow: "0 8px 32px rgba(202,146,43,.35)" }}
                >
                  <Sparkles className="w-5 h-5" />
                  Choose Your Experience
                  <ArrowRight className="w-5 h-5" />
                </a>
                <p className="text-sm text-[#F5EBD8]/40 mt-3 ml-1">See what the app looks like for your role →</p>
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  { label: "Find Businesses", href: "/businesses", icon: Search },
                  { label: "Safety Intelligence", href: "/safety", icon: Shield },
                  { label: "KinfolkAI™", href: "/travel", icon: Sparkles },
                  { label: "Community", href: "/community", icon: Users },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href}>
                    <div className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 hover:border-[#CA922B]/40 transition-colors cursor-pointer text-sm font-medium text-[#F5EBD8]">
                      <Icon className="w-3.5 h-3.5 text-[#CA922B]" />
                      {label} <ArrowRight className="w-3 h-3 text-[#CA922B]" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Waitlist Form */}
            <div id="waitlist-form" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 shadow-2xl">
              {submitted ? (
                <div data-testid="waitlist-confirmation" className="py-6">
                  <div className="text-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-[#CA922B]/20 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#CA922B]" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20,6 9,17 4,12" /></svg>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-white mb-2">You're In!</h3>
                    {position && <p className="text-[#CA922B] font-bold text-lg mb-2">Position #{position.toLocaleString()}</p>}
                    <p className="text-[#F5EBD8]/70 font-semibold mb-4 text-sm">Check your email for your referral code to move up the list.</p>
                    {referralCode && (
                      <div className="bg-white/5 rounded-xl p-4 mb-4 text-left">
                        <p className="text-xs font-bold text-[#CA922B] uppercase tracking-wider mb-2">Your Referral Code</p>
                        <p className="text-white font-mono font-bold text-xl">{referralCode}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-3">
                      <p className="text-[#F5EBD8]/60 text-xs font-semibold uppercase tracking-widest">Share & move up the list</p>
                      <div className="flex gap-3 justify-center">
                        {[
                          { label: "X", icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, platform: "X" },
                          { label: "Facebook", icon: <Facebook className="w-4 h-4" />, platform: "Facebook" },
                          { label: "LinkedIn", icon: <Linkedin className="w-4 h-4" />, platform: "LinkedIn" },
                          { label: "Copy link", icon: <Link2 className="w-4 h-4" />, platform: "Copy" },
                        ].map(({ label, icon, platform }) => (
                          <button
                            key={platform}
                            onClick={() => openShare(platform)}
                            aria-label={`Share on ${label}`}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-[#CA922B]/20 border border-white/20 hover:border-[#CA922B]/40 flex items-center justify-center text-[#F5EBD8] hover:text-[#CA922B] transition-colors"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-5">
                    <h4 className="text-sm font-bold text-white mb-1">Grow the community</h4>
                    <p className="text-[#F5EBD8]/50 text-xs mb-3">Invite a friend or business — by email or social handle.</p>
                    <div className="flex gap-2 mb-4">
                      <button type="button" onClick={() => setInviteTab("email")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${inviteTab === "email" ? "bg-[#CA922B] text-[#1C0E06]" : "bg-white/10 text-[#F5EBD8]/60 hover:bg-white/20"}`}>
                        ✉️ By Email
                      </button>
                      <button type="button" onClick={() => setInviteTab("social")}
                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${inviteTab === "social" ? "bg-[#CA922B] text-[#1C0E06]" : "bg-white/10 text-[#F5EBD8]/60 hover:bg-white/20"}`}>
                        📲 By Social
                      </button>
                    </div>

                    {inviteTab === "email" ? (
                      <form onSubmit={handleInvite} className="flex flex-col gap-2">
                        <div className="flex gap-2 mb-1">
                          <button type="button" onClick={() => setInviteType("friend")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${inviteType === "friend" ? "bg-white/20 text-white" : "bg-white/5 text-[#F5EBD8]/40"}`}>
                            Friend
                          </button>
                          <button type="button" onClick={() => setInviteType("business")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${inviteType === "business" ? "bg-white/20 text-white" : "bg-white/5 text-[#F5EBD8]/40"}`}>
                            Business
                          </button>
                        </div>
                        <input type="text" placeholder={inviteType === "friend" ? "Their name (optional)" : "Business name"}
                          value={inviteType === "friend" ? inviteeName : inviteBizName}
                          onChange={e => inviteType === "friend" ? setInviteeName(e.target.value) : setInviteBizName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm" />
                        <input type="email" placeholder="Their email address" required value={inviteEmail}
                          onChange={e => setInviteEmail(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm" />
                        {inviteError && <p className="text-red-400 text-xs">{inviteError}</p>}
                        {inviteSent && <p className="text-green-400 text-xs font-semibold">✓ Invite sent!</p>}
                        <button type="submit" disabled={inviteSubmitting || !inviteEmail || !myCode}
                          className="w-full py-2.5 rounded-lg bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-[#1C0E06] font-bold text-sm transition-colors">
                          {inviteSubmitting ? "Sending…" : "Send Invite"}
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSocialRefer} className="flex flex-col gap-2">
                        <div className="flex gap-2 mb-1">
                          <button type="button" onClick={() => setSocialReferType("friend")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${socialReferType === "friend" ? "bg-white/20 text-white" : "bg-white/5 text-[#F5EBD8]/40"}`}>
                            Friend
                          </button>
                          <button type="button" onClick={() => setSocialReferType("business")}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${socialReferType === "business" ? "bg-white/20 text-white" : "bg-white/5 text-[#F5EBD8]/40"}`}>
                            Business
                          </button>
                        </div>
                        {socialReferType === "business" && (
                          <input type="text" placeholder="Business name" required value={socialBizName}
                            onChange={e => setSocialBizName(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm" />
                        )}
                        <input type="text" placeholder="Their name (optional)" value={socialName}
                          onChange={e => setSocialName(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm" />
                        <select value={socialPlatform} onChange={e => setSocialPlatform(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-[#2B1507] border border-white/15 text-white focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm">
                          <option value="instagram">Instagram</option>
                          <option value="tiktok">TikTok</option>
                          <option value="x">X / Twitter</option>
                          <option value="facebook">Facebook</option>
                          <option value="linkedin">LinkedIn</option>
                          <option value="other">Other</option>
                        </select>
                        <input type="text" placeholder="@handle or profile URL" required value={socialHandle}
                          onChange={e => setSocialHandle(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[#CA922B]/50 text-sm" />
                        {socialDone && socialCopyMsg && (
                          <div className="bg-white/5 rounded-lg p-3 border border-[#CA922B]/30">
                            <p className="text-[#CA922B] text-xs font-bold mb-1.5">✓ Logged! Copy this to send them:</p>
                            <p className="text-[#F5EBD8]/80 text-xs leading-relaxed mb-2">{socialCopyMsg}</p>
                            <button type="button" onClick={() => navigator.clipboard.writeText(socialCopyMsg)}
                              className="w-full py-1.5 rounded bg-[#CA922B]/20 hover:bg-[#CA922B]/30 text-[#CA922B] text-xs font-bold transition-colors">
                              Copy Message
                            </button>
                          </div>
                        )}
                        {!socialDone && (
                          <button type="submit" disabled={socialSubmitting || !socialHandle.trim() || (socialReferType === "business" && !socialBizName.trim())}
                            className="w-full py-2.5 rounded-lg bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-[#1C0E06] font-bold text-sm transition-colors">
                            {socialSubmitting ? "Logging…" : "Get Message to Send"}
                          </button>
                        )}
                        {socialDone && (
                          <button type="button" onClick={() => { setSocialDone(false); setSocialHandle(""); setSocialName(""); setSocialBizName(""); setSocialCopyMsg(""); }}
                            className="w-full py-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F5EBD8]/60 text-xs font-bold transition-colors">
                            Refer Another
                          </button>
                        )}
                      </form>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowRecommend(true)}
                    className="mt-3 w-full flex items-center gap-3 text-left group border-t border-white/10 pt-3">
                    <div className="w-9 h-9 rounded-full bg-[#CA922B]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#CA922B]/25 transition-colors">
                      <span className="text-base">🔍</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm group-hover:text-[#CA922B] transition-colors">Who are we missing?</p>
                      <p className="text-[#F5EBD8]/50 text-xs">Know a business that deserves to be on the map? Tell us →</p>
                    </div>
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-serif font-bold text-white mb-2">Join the Waitlist</h2>
                  <p className="text-[#F5EBD8]/60 font-semibold text-sm mb-2">Free to join. No spam, ever.</p>
                  <p className="text-[#F5EBD8]/40 font-medium text-xs mb-6">We don't sell your attention—we help our community discover great businesses.</p>
                  <form data-testid="waitlist-form" onSubmit={handleWaitlist} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input type="text" placeholder="First name" value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                      <input type="text" placeholder="Last name" value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                    </div>
                    <input data-testid="waitlist-email" type="email" placeholder="Enter your email address" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                    <div className="grid grid-cols-2 gap-3">
                      <input data-testid="waitlist-city" type="text" placeholder="Your city" value={city} onChange={e => setCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                      <input type="text" placeholder="STATE" value={state} onChange={e => setState(e.target.value.toUpperCase().slice(0, 2))} maxLength={2}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm uppercase" />
                    </div>
                    <p className="text-xs text-[#F5EBD8]/40 font-medium -mt-1">What city and state are you from? We're testing in select locations first.</p>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div
                        onClick={() => setIsBusinessOwner(!isBusinessOwner)}
                        className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 cursor-pointer ${isBusinessOwner ? "bg-[#CA922B]" : "bg-white/20"}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isBusinessOwner ? "translate-x-5" : "translate-x-0"}`} />
                      </div>
                      <span className="text-sm font-semibold text-[#F5EBD8]/80">I own or operate a minority-owned business</span>
                    </label>
                    <input type="text" placeholder="REFERRAL CODE (OPTIONAL)" value={referredBy} onChange={e => setReferredBy(e.target.value.toUpperCase())}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm uppercase tracking-widest" />
                    <p className="text-xs text-[#F5EBD8]/40 font-medium -mt-1">Have a friend's referral code? Enter it above to move up the list.</p>

                    {/* Family Circle */}
                    <button
                      type="button"
                      onClick={() => setShowFamilySection(v => !v)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white/10 border border-white/20 hover:border-[#CA922B]/50 transition-colors text-left"
                    >
                      <div>
                        <p className="text-sm font-bold text-[#F5EBD8]/90">Add a Family Circle 👨‍👩‍👧‍👦</p>
                        <p className="text-xs text-[#F5EBD8]/50 font-medium mt-0.5">Register your household — reviewed and approved together</p>
                      </div>
                      <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors flex-shrink-0 ${showFamilySection ? "bg-[#CA922B]" : "bg-white/20"}`}>
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${showFamilySection ? "translate-x-4" : "translate-x-0"}`} />
                      </div>
                    </button>
                    {showFamilySection && (
                      <div className="flex flex-col gap-2">
                        <p className="text-xs text-[#F5EBD8]/40 font-medium">Each address joins separately and is reviewed as one family circle. Up to 6 members.</p>
                        {familyEmails.map((fe, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <input
                              type="email"
                              placeholder={`Family member ${i + 1} email`}
                              value={fe}
                              onChange={e => {
                                const next = [...familyEmails];
                                next[i] = e.target.value;
                                setFamilyEmails(next);
                              }}
                              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setFamilyEmails(familyEmails.filter((_, j) => j !== i))}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-[#F5EBD8]/40 hover:text-[#F5EBD8]/80 transition-colors text-lg"
                            >×</button>
                          </div>
                        ))}
                        {familyEmails.length < 6 && (
                          <button
                            type="button"
                            onClick={() => setFamilyEmails([...familyEmails, ""])}
                            className="w-full px-4 py-3 rounded-xl border border-dashed border-white/20 text-[#CA922B] text-sm font-semibold hover:border-[#CA922B]/50 transition-colors"
                          >+ Add family member</button>
                        )}
                      </div>
                    )}

                    {/* City Nomination */}
                    <div className="rounded-2xl bg-white/5 border border-[#CA922B]/30 p-4 mt-1">
                      <p className="text-sm font-bold text-[#CA922B] mb-1">🗺️ Officially put your city on the map</p>
                      <p className="text-xs text-[#F5EBD8]/50 font-medium mb-2">
                        Every city on the Welcome Home Tour gets a permanent community archive built by locals. Nominate yours.
                      </p>
                      <input type="text" placeholder="Nominate a city (e.g. Atlanta, GA)" value={cityNomination ?? ""} onChange={e => setCityNomination(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                    </div>

                    <Button data-testid="waitlist-submit" type="submit" disabled={submitting || !email}
                      className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white h-12 font-bold text-base mt-1">
                      {submitting ? "Joining…" : "Join the Waitlist"}
                    </Button>
                  </form>
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-[#F5EBD8]/40 font-medium mb-2">Know someone? Refer them:</p>
                    <div className="flex gap-2">
                      {[
                        { label: "X", icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>, platform: "X" },
                        { label: "Facebook", icon: <Facebook className="w-3.5 h-3.5" />, platform: "Facebook" },
                        { label: "LinkedIn", icon: <Linkedin className="w-3.5 h-3.5" />, platform: "LinkedIn" },
                        { label: "Instagram", icon: <Instagram className="w-3.5 h-3.5" />, platform: "Instagram" },
                        { label: "Copy", icon: <Link2 className="w-3.5 h-3.5" />, platform: "Copy" },
                      ].map(({ label, icon, platform }) => (
                        <button key={platform} onClick={() => openShare(platform)} aria-label={`Share on ${label}`}
                          className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#CA922B]/20 border border-white/20 flex items-center justify-center text-[#F5EBD8]/60 hover:text-[#CA922B] transition-colors">
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="button" onClick={() => setShowRecommend(true)}
                    className="mt-3 w-full flex items-center gap-3 text-left group border-t border-white/10 pt-3">
                    <div className="w-9 h-9 rounded-full bg-[#CA922B]/15 flex items-center justify-center flex-shrink-0 group-hover:bg-[#CA922B]/25 transition-colors">
                      <span className="text-base">🔍</span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm group-hover:text-[#CA922B] transition-colors">Who are we missing?</p>
                      <p className="text-[#F5EBD8]/50 text-xs">Know a business that deserves to be on the map? Tell us →</p>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-center mt-16 gap-2 text-[#F5EBD8]/30 text-xs uppercase tracking-widest animate-bounce">
            <span>Scroll</span>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12l7 7 7-7" /></svg>
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="bg-[#3A1F0E] py-8 border-y border-white/5">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">Growing</div>
              <div className="text-sm font-semibold text-[#F5EBD8]/70">Every day</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">200+ Cities Covered</div>
              <div className="text-sm font-semibold text-[#F5EBD8]/70">Across the US and beyond</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">96/100 Avg. Confidence Score</div>
              <div className="text-sm font-semibold text-[#F5EBD8]/70">For top-rated destinations</div>
            </div>
            <div className="px-4 py-2">
              <div className="text-3xl font-serif font-bold text-[#CA922B] mb-1">100% Community-Sourced</div>
              <div className="text-sm font-semibold text-[#F5EBD8]/70">Every insight, every review</div>
            </div>
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#3A1F0E" toBg="#FAF6EF" />

      {/* ── CITY PROOF STRIP ── */}
      <section className="bg-[#FAF6EF] py-10 border-b border-[#3A1F0E]/5">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-center text-xs font-bold tracking-widest uppercase text-[#3A1F0E]/50 mb-5">
            Cities already on the waitlist
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {(waitlistStats?.cities?.length ? waitlistStats.cities : FALLBACK_CITIES).map((c, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#3A1F0E]/10 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-[#CA922B]" />
                <span className="text-sm font-semibold text-[#3A1F0E]">{c.city}</span>
                {waitlistStats?.cities?.length ? (
                  <span className="text-xs text-[#3A1F0E]/50 font-bold">{(c as { city: string; count: number }).count} waiting</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#FAF6EF" toBg="#2B1507" flip />

      {/* ── WHAT WE OFFER (Teaser Cards) ── */}
      <section className="py-24 bg-gradient-to-b from-[#3D1F0A] to-[#2B1507] text-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Explore The Platform</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Everything You Need in One Place</h2>
            <p className="text-lg font-semibold text-[#F5EBD8]/70 max-w-2xl mx-auto">
              Discover minority-owned businesses, travel with confidence, connect with community, and make decisions with real intelligence behind every choice.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: Search,
                label: "Discover",
                title: "Find Businesses & Places",
                desc: "Community-verified minority-owned businesses, restaurants, hotels, cultural landmarks, and hidden gems — wherever you are.",
                link: "/businesses",
                cta: "Browse Businesses"
              },
              {
                icon: Shield,
                label: "Safety",
                title: "Travel With Confidence",
                desc: "Real-time safety alerts, community confidence scores, and the 'Would Return Alone' metric. Know before you go.",
                link: "/safety",
                cta: "See Safety Features"
              },
              {
                icon: Sparkles,
                label: "KinfolkAI™",
                title: "Your AI Travel Companion",
                desc: "Ask KinfolkAI where to eat, stay, and explore — personalized to your vibe, budget, and the real culture of every city.",
                link: "/travel",
                cta: "Chat with KinfolkAI"
              },
            ].map(({ icon: Icon, label, title, desc, link, cta }) => (
              <Link key={link} href={link}>
                <div className="bg-white/5 border border-white/10 hover:border-[#CA922B]/40 rounded-3xl p-8 flex flex-col gap-5 cursor-pointer transition-all group h-full">
                  <div className="w-12 h-12 rounded-full bg-[#CA922B]/10 border border-[#CA922B]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#CA922B]" />
                  </div>
                  <div className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">{label}</div>
                  <div>
                    <h3 className="text-xl font-serif font-bold text-white mb-3">{title}</h3>
                    <p className="text-[#F5EBD8]/60 font-semibold text-sm leading-relaxed">{desc}</p>
                  </div>
                  <div className="mt-auto flex items-center gap-2 text-[#CA922B] text-sm font-bold group-hover:gap-3 transition-all">
                    {cta} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: "Our Story & Mission", href: "/about#mission", icon: BookOpen },
              { label: "All Platform Features", href: "/features", icon: Globe },
              { label: "For Business Owners", href: "/for-business-owners", icon: Building2 },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}>
                <div className="flex items-center justify-between px-6 py-4 rounded-2xl border border-white/10 hover:border-[#CA922B]/30 bg-white/5 hover:bg-white/8 cursor-pointer transition-all group">
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-[#CA922B]" />
                    <span className="text-sm font-medium text-[#F5EBD8]">{label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#CA922B] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WaveDivider fromBg="#2B1507" toBg="#FAF6EF" />

      <RotatingQuoteBanner variant="cream" />

      {/* ── HELP SHAPE OUR LAUNCH ── */}
      <section className="py-24 bg-[#FAF6EF]">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <UserPlus className="w-3.5 h-3.5 text-[#CA922B]" />
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Help Shape Our Launch</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#3A1F0E] mb-6">
              Build With Us From Day One.
            </h2>
            <p className="text-[#3A1F0E]/70 text-lg max-w-3xl mx-auto leading-relaxed">
              Mapping With Melanin™ isn't just growing a waitlist — we're building a community. And you can be a part of it from the very beginning.
            </p>
          </div>

          {/* Three pillars */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Users,
                title: "Refer Community Members",
                desc: "Invite friends and family to join the waitlist. Help us grow the community — and move yourself up the list in the process.",
                color: "bg-[#CA922B]/10 border-[#CA922B]/20",
                iconColor: "text-[#CA922B]",
              },
              {
                icon: Store,
                title: "Recommend Community Businesses",
                desc: "Know a business that deserves more visibility? Invite them to join and become part of the movement — we'll reach out directly.",
                color: "bg-[#2B1507]/5 border-[#2B1507]/10",
                iconColor: "text-[#3A1F0E]",
              },
              {
                icon: MapPin,
                title: "Help Build Your City",
                desc: "We're launching city by city, prioritizing communities showing the strongest early engagement. Help put your city on the map.",
                color: "bg-[#CA922B]/10 border-[#CA922B]/20",
                iconColor: "text-[#CA922B]",
              },
            ].map(({ icon: Icon, title, desc, color, iconColor }, i) => (
              <div key={i} className="bg-white border border-[#3A1F0E]/5 rounded-3xl p-8 shadow-sm">
                <div className={`w-12 h-12 rounded-full ${color} border flex items-center justify-center mb-5`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <h3 className="font-bold text-[#3A1F0E] text-lg mb-3">{title}</h3>
                <p className="text-[#3A1F0E]/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Founder CTA banner */}
          <div className="bg-[#2B1507] rounded-3xl p-8 md:p-10 mb-16 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CA922B]/20 border border-[#CA922B]/30 mb-4">
                <Trophy className="w-3.5 h-3.5 text-[#CA922B]" />
                <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Climb the Waitlist</span>
              </div>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-4">
                Every referral earns Community Builder credit.
              </h3>
              <p className="text-[#F5EBD8]/70 text-base leading-relaxed mb-4">
                Members who actively help grow the community may move up the waitlist, unlock exclusive <span className="text-[#CA922B] font-bold">Founding Member</span> recognition, and gain earlier access to the platform.
              </p>
              <p className="text-[#F5EBD8]/50 text-sm italic">
                Because Mapping With Melanin™ isn't being built <em>for</em> the community — it's being built <em>with</em> the community.
              </p>
            </div>
            <div className="shrink-0">
              <a href="#waitlist-form">
                <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-14 text-base font-bold whitespace-nowrap">
                  Join & Get Your Code
                </Button>
              </a>
            </div>
          </div>

          {/* Invite form + Leaderboard side by side */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Invite Form */}
            <div className="bg-white border border-[#3A1F0E]/5 rounded-3xl shadow-sm overflow-hidden">
              <div className="bg-[#2B1507] px-8 py-6">
                <div className="flex items-center gap-3 mb-1">
                  <Mail className="w-5 h-5 text-[#CA922B]" />
                  <h3 className="text-xl font-serif font-bold text-white">Send a Direct Invite</h3>
                </div>
                <p className="text-[#F5EBD8]/60 text-sm">They'll get a personal email from you — with your referral link attached.</p>
              </div>

              <div className="p-8">
                {/* Type tabs */}
                <div className="flex rounded-xl overflow-hidden border border-[#3A1F0E]/10 mb-6">
                  <button
                    onClick={() => setInviteType("friend")}
                    className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${inviteType === "friend" ? "bg-[#CA922B] text-white" : "text-[#3A1F0E]/50 hover:bg-[#3A1F0E]/5"}`}
                  >
                    <Users className="w-3.5 h-3.5" /> Invite a Friend
                  </button>
                  <button
                    onClick={() => setInviteType("business")}
                    className={`flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors ${inviteType === "business" ? "bg-[#CA922B] text-white" : "text-[#3A1F0E]/50 hover:bg-[#3A1F0E]/5"}`}
                  >
                    <Store className="w-3.5 h-3.5" /> Invite a Business
                  </button>
                </div>

                {inviteSent ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-4">
                      <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#CA922B]" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20,6 9,17 4,12" /></svg>
                    </div>
                    <p className="font-bold text-[#3A1F0E] text-lg mb-1">Invitation sent!</p>
                    <p className="text-[#3A1F0E]/60 text-sm">Your {inviteType === "business" ? "business invitation" : "invitation"} is on its way.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInvite} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">Your Referral Code</label>
                      <input
                        type="text"
                        placeholder={submitted && referralCode ? referralCode : "YOUR CODE (e.g. MELANIN123)"}
                        value={myCode}
                        onChange={e => setMyCode(e.target.value.toUpperCase())}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm font-mono tracking-widest uppercase"
                      />
                      {!submitted && <p className="text-xs text-[#3A1F0E]/40 mt-1">Join the waitlist above to get your referral code.</p>}
                    </div>

                    {inviteType === "business" && (
                      <div>
                        <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">Business Name</label>
                        <input
                          type="text"
                          placeholder="Business name"
                          value={inviteBizName}
                          onChange={e => setInviteBizName(e.target.value)}
                          required
                          className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">
                        {inviteType === "business" ? "Business Contact Email" : "Friend's Email"}
                      </label>
                      <input
                        type="email"
                        placeholder={inviteType === "business" ? "business@example.com" : "friend@example.com"}
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                      />
                    </div>

                    {inviteType === "friend" && (
                      <div>
                        <label className="block text-xs font-bold text-[#3A1F0E]/60 uppercase tracking-wider mb-1.5">Their Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="First name"
                          value={inviteeName}
                          onChange={e => setInviteeName(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                        />
                      </div>
                    )}

                    {inviteError && (
                      <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-3">{inviteError}</p>
                    )}

                    <Button
                      type="submit"
                      disabled={inviteSubmitting || !inviteEmail || !myCode || (inviteType === "business" && !inviteBizName)}
                      className="w-full rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white h-12 font-bold text-sm mt-1 flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {inviteSubmitting ? "Sending…" : inviteType === "business" ? "Send Business Invitation" : "Send Friend Invitation"}
                    </Button>
                  </form>
                )}
              </div>
            </div>

            {/* Leaderboard */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Trophy className="w-5 h-5 text-[#CA922B]" />
                <h3 className="text-xl font-serif font-bold text-[#3A1F0E]">Community Leaderboard</h3>
              </div>
              <p className="text-[#3A1F0E]/60 text-sm mb-6 leading-relaxed">
                Top community builders and cities — updated in real time as the waitlist grows.
              </p>
              <LeaderboardSection />
            </div>

          </div>
        </div>
      </section>

      <WaveDivider fromBg="#FAF6EF" toBg="#2B1507" flip />

      {/* ── IMPACT COUNTER ── */}
      <section className="py-16 bg-gradient-to-b from-[#2B1507] to-[#3D1F0A]">
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

      <WaveDivider fromBg="#2B1507" toBg="white" />

      <RotatingQuoteBanner variant="light" />

      {/* ── COMMUNITY VOICES ── */}
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
                name: "Aaliyah T.", role: "Frequent Traveler", loc: "Atlanta, GA",
                img: "https://images.pexels.com/photos/4427622/pexels-photo-4427622.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1"
              },
              {
                quote: "I've been looking for something like this for years. Being able to find minority-owned restaurants, hotels, and shops in cities I've never visited — and know they're community-verified — is a game changer.",
                name: "Marcus J.", role: "Digital Nomad", loc: "Houston, TX",
                img: "https://images.pexels.com/photos/1181391/pexels-photo-1181391.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1"
              },
              {
                quote: "The relocation intelligence is what sold me. I was moving from Chicago to Philadelphia and had no idea where to start. Mapping with Melanin gave me neighborhood insights I couldn't find anywhere else.",
                name: "Simone R.", role: "Relocating Professional", loc: "Philadelphia, PA",
                img: "https://images.pexels.com/photos/7446989/pexels-photo-7446989.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1"
              },
              {
                quote: "As a business owner, being listed on this platform has been incredible. I've seen new customers specifically say they found me here because they wanted to support verified minority-owned businesses.",
                name: "DeShawn M.", role: "Business Owner", loc: "New Orleans, LA",
                img: "https://images.pexels.com/photos/9533888/pexels-photo-9533888.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&dpr=1"
              }
            ].map((t, i) => (
              <div key={i} className="bg-[#FAF6EF] p-8 rounded-3xl border border-[#3A1F0E]/5">
                <div className="text-4xl font-serif text-[#CA922B] opacity-50 mb-4">"</div>
                <p className="text-[#3A1F0E]/80 text-lg italic leading-relaxed mb-8">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <img src={t.img} alt={t.name} className="w-12 h-12 rounded-full object-cover object-top" />
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

      <WaveDivider fromBg="white" toBg="#2B1507" flip />

      <RotatingQuoteBanner variant="dark" />

      {/* ── APP COMING SOON ── */}
      <section className="py-24 bg-gradient-to-b from-[#3D1F0A] to-[#2B1507] text-white overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
              <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">COMING SOON</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">The App Is Coming.</h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Mapping with Melanin™ is headed to iOS and Android. Get early access the moment we launch — join the waitlist now.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-14">
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
            <a href="#waitlist-form">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-10 h-12 text-base font-semibold">
                Join the Waitlist →
              </Button>
            </a>
            <p className="text-white/30 text-xs mt-8 max-w-xl mx-auto leading-relaxed">
              Apple and the Apple logo are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC. Mapping with Melanin™ is not affiliated with Apple Inc. or Google LLC. App availability and launch timing are subject to change.
            </p>
          </div>
        </div>
      </section>


      {showRecommend && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeRecommend} />
          <div className="relative w-full sm:max-w-md bg-[#1C0E06] rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
            <button onClick={closeRecommend} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
            {recDone ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#CA922B]/20 flex items-center justify-center mx-auto mb-4">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#CA922B]" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="20,6 9,17 4,12" /></svg>
                </div>
                <h3 className="text-xl font-serif font-bold text-white mb-2">Thank you!</h3>
                <p className="text-[#F5EBD8]/60 text-sm mb-6">We'll look into adding them to the platform. Community recommendations are how we grow.</p>
                <button onClick={closeRecommend} className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] text-[#1C0E06] font-bold text-sm transition-colors">Done</button>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-serif font-bold text-white mb-1">Recommend a Business</h3>
                <p className="text-[#F5EBD8]/50 text-sm mb-5">Know a minority-owned business that should be on the map? Tell us about them.</p>
                <form onSubmit={handleRecommend} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">Business Name <span className="text-[#CA922B]">*</span></label>
                    <input type="text" required value={recBizName} onChange={e => setRecBizName(e.target.value)}
                      placeholder="e.g. Sweet Auburn Bistro"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">City</label>
                      <input type="text" value={recCity} onChange={e => setRecCity(e.target.value)} placeholder="Atlanta"
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">State</label>
                      <input type="text" value={recState} onChange={e => setRecState(e.target.value.toUpperCase().slice(0, 2))} placeholder="GA" maxLength={2}
                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm uppercase" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">Category</label>
                    <select value={recCategory} onChange={e => setRecCategory(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-[#2B1507] border border-white/15 text-white focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm">
                      <option value="">Select a category…</option>
                      {BIZ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">Website or Social</label>
                    <input type="text" value={recWebsite} onChange={e => setRecWebsite(e.target.value)} placeholder="https:// or @handle"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">Business Email (optional)</label>
                    <input type="email" value={recBizEmail} onChange={e => setRecBizEmail(e.target.value)} placeholder="owner@business.com"
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#F5EBD8]/50 uppercase tracking-wider mb-1 block">Why do you love them? (optional)</label>
                    <textarea value={recNote} onChange={e => setRecNote(e.target.value)} placeholder="Tell us what makes them special…"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/50 text-sm resize-none" />
                  </div>
                  <button type="submit" disabled={recSubmitting || !recBizName.trim()}
                    className="w-full py-3 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-[#1C0E06] font-bold text-sm transition-colors mt-1">
                    {recSubmitting ? "Sending…" : "Submit Recommendation →"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
