import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Shield, Users, MapPin, Star, ArrowRight, Check } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

interface ReferrerInfo { firstName: string; memberSince: string | null; }
interface WaitlistStats { count: number; }

function formatCount(n: number) {
  if (n >= 1000) return `${Math.floor(n / 100) * 100}+`;
  return `${n}+`;
}

export default function ReferralLanding() {
  const params = useParams<{ code: string }>();
  const [, navigate] = useLocation();
  const code = params.code?.toUpperCase() ?? "";

  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null);
  const [stats, setStats] = useState<WaitlistStats | null>(null);
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [userReferralCode, setUserReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!code) { navigate("/"); return; }
    fetch(`${BASE}api/referrals/preview/${code}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setReferrer(d ?? { firstName: "A friend", memberSince: null }))
      .catch(() => setReferrer({ firstName: "A friend", memberSince: null }));
    fetch(`${BASE}api/waitlist/count`)
      .then(r => r.json()).then(setStats).catch(() => {});
  }, [code, navigate]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, city, referredBy: code }),
      });
      const data = await res.json();
      setPosition(data.position ?? null);
      setUserReferralCode(data.referralCode ?? null);
      setSubmitted(true);
    } catch { setSubmitted(true); }
    finally { setSubmitting(false); }
  };

  const firstName = referrer?.firstName ?? "A friend";

  return (
    <div className="min-h-screen bg-[#2B1507] flex flex-col">
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <a href="/" className="font-serif font-bold text-[#CA922B] text-xl tracking-tight">Mapping With Melanin™</a>
        <a href="/login" className="text-[#F5EBD8]/60 text-sm hover:text-[#F5EBD8] transition-colors">Sign In</a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-8">

          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#CA922B]/20 border border-[#CA922B]/40">
              <Users className="w-4 h-4 text-[#CA922B]" />
              <span className="text-sm font-bold text-[#CA922B] uppercase tracking-wider">Personal Invite</span>
            </div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CA922B] to-[#8B5E1A] flex items-center justify-center mx-auto shadow-2xl">
              <span className="text-3xl font-serif font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-3 leading-tight">
                {firstName} invited you<br /><span className="text-[#CA922B]">to the community.</span>
              </h1>
              <p className="text-[#F5EBD8]/70 text-lg">
                Join {stats ? formatCount(stats.count) : "10,000+"} people discovering minority-owned businesses,
                planning journeys safely, and supporting community-driven culture.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: MapPin, label: "Find trusted minority-owned businesses nearby" },
              { icon: Shield, label: "Community safety intel for every neighborhood" },
              { icon: Star, label: "KinfolkAI™ plans trips around your culture" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center space-y-2">
                <Icon className="w-5 h-5 text-[#CA922B] mx-auto" />
                <p className="text-[#F5EBD8]/80 text-xs leading-snug">{label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/[0.08] border border-white/15 rounded-3xl p-8 backdrop-blur-sm">
            {submitted ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#CA922B]/20 border border-[#CA922B]/40 flex items-center justify-center mx-auto">
                  <Check className="w-8 h-8 text-[#CA922B]" />
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white mb-1">You're in! 🎉</h2>
                  {position && <p className="text-[#CA922B] font-bold text-lg">#{position} in line</p>}
                  <p className="text-[#F5EBD8]/70 text-sm mt-2">We'll reach out when we launch in your city.</p>
                  {userReferralCode && (
                    <div className="mt-4 p-4 bg-[#CA922B]/10 border border-[#CA922B]/30 rounded-2xl">
                      <p className="text-[#F5EBD8]/60 text-xs mb-1">Your referral code — share it to move up the list</p>
                      <p className="text-[#CA922B] font-bold text-2xl tracking-[0.2em]">{userReferralCode}</p>
                    </div>
                  )}
                </div>
                <a href="/" className="inline-flex items-center gap-2 text-sm text-[#CA922B] font-semibold hover:text-[#E0A84D] transition-colors">
                  Explore the platform <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-white mb-1">Claim your spot</h2>
                  <p className="text-[#F5EBD8]/60 text-sm">{firstName}'s invite moves you ahead in line.</p>
                </div>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="Your email address"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60" />
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="Your city (optional)"
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#CA922B]/60" />
                <div className="bg-[#CA922B]/10 border border-[#CA922B]/25 rounded-xl px-4 py-3 flex items-center gap-3">
                  <Star className="w-4 h-4 text-[#CA922B] shrink-0" />
                  <p className="text-[#F5EBD8]/80 text-xs">
                    Joining via invite from <span className="font-bold text-[#CA922B]">{firstName}</span> — code <span className="font-mono font-bold text-[#CA922B]">{code}</span> applied automatically
                  </p>
                </div>
                <button type="submit" disabled={submitting || !email}
                  className="w-full py-4 rounded-xl bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white font-bold text-base transition-colors flex items-center justify-center gap-2">
                  {submitting ? "Joining…" : <><span>Join the Waitlist</span><ArrowRight className="w-4 h-4" /></>}
                </button>
                <p className="text-center text-[#F5EBD8]/40 text-xs">Free to join. No spam, ever.</p>
                <p className="text-center text-[#F5EBD8]/30 text-xs mt-1">We don't sell your attention—we help our community discover great businesses.</p>
              </form>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
