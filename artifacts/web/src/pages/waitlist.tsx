import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Shield, MapPin, Users, Sparkles, Copy, Check, ArrowLeft, Facebook, Linkedin, Link2 } from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const SITE_URL = "https://mappingwithmelanin.com";

const BENEFITS = [
  { icon: Shield, label: "Safety Intelligence", desc: "Community-powered neighborhood safety scores and verified reviews" },
  { icon: MapPin, label: "2,400+ Businesses", desc: "Verified minority-owned businesses across 48 states" },
  { icon: Users, label: "10K+ Members", desc: "A growing community of travelers, entrepreneurs, and creators" },
  { icon: Sparkles, label: "KinfolkAI™", desc: "AI travel planning that understands your culture and community" },
];

function openShare(platform: string, url: string) {
  const text = encodeURIComponent("Join me on Mapping with Melanin™ — find trusted businesses, safety intel, and community everywhere you go:");
  const encodedUrl = encodeURIComponent(url);
  const links: Record<string, string> = {
    X: `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`,
    Facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };
  if (links[platform]) window.open(links[platform], "_blank", "noopener,noreferrer,width=600,height=500");
  else navigator.clipboard.writeText(url).catch(() => {});
}

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);
  const refParsed = useRef(false);

  useEffect(() => {
    fetch(`${BASE}api/waitlist/count`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { count: number }) => setWaitlistCount(d.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (refParsed.current) return;
    refParsed.current = true;
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferredBy(ref.toUpperCase());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          city: city.trim() || undefined,
          state: state.trim().toUpperCase() || undefined,
          isBusinessOwner,
          websiteUrl: isBusinessOwner ? websiteUrl.trim() : undefined,
          referredBy: referredBy.trim() || undefined,
        }),
      });
      const data = await res.json() as { position?: number; referralCode?: string };
      setPosition(data.position ?? null);
      setReferralCode(data.referralCode ?? null);
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const referralLink = referralCode ? `${SITE_URL}/waitlist?ref=${referralCode}` : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <div className="min-h-screen bg-[#2B1507] flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5 text-[#F5EBD8] hover:text-[#CA922B] transition-colors">
          <div className="w-9 h-9 rounded-full bg-[#FAF6EF] border-2 border-[#CA922B] overflow-hidden shrink-0">
            <img src="/images/logo-transparent.png" alt="Mapping with Melanin" className="w-full h-full object-cover object-top scale-110" />
          </div>
          <span className="font-serif font-bold text-base">Mapping with Melanin™</span>
        </Link>
        <Link href="/" className="flex items-center gap-1.5 text-[#F5EBD8]/60 hover:text-[#F5EBD8] text-sm font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </nav>

      <div className="flex-1 flex flex-col lg:flex-row items-start gap-0 max-w-7xl mx-auto w-full px-4 pb-20 pt-4">
        {/* Left — benefits */}
        <div className="lg:flex-1 pt-10 lg:pt-16 lg:pr-16 mb-12 lg:mb-0">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#CA922B]/40 bg-[#CA922B]/10 text-[#CA922B] text-xs font-bold tracking-widest uppercase mb-6">
            Early Access
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white leading-tight mb-4">
            Join the waitlist.<br />
            <span className="text-[#CA922B]">Be first in.</span>
          </h1>
          <p className="text-[#F5EBD8]/70 text-lg leading-relaxed mb-10 max-w-md">
            Mapping with Melanin™ is invite-only during our early access period. Join the waitlist, get approved, and unlock the full platform.
          </p>

          {waitlistCount !== null && waitlistCount > 0 && (
            <div className="flex items-center gap-2 mb-10">
              <div className="flex -space-x-2">
                {["#CA922B", "#8B5E3C", "#3A1F0E"].map((c) => (
                  <div key={c} className="w-8 h-8 rounded-full border-2 border-[#2B1507]" style={{ backgroundColor: c }} />
                ))}
              </div>
              <span className="text-[#F5EBD8]/60 text-sm font-medium">
                <span className="text-[#CA922B] font-bold">{waitlistCount.toLocaleString()}+</span> people already on the list
              </span>
            </div>
          )}

          <div className="space-y-4">
            {BENEFITS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#CA922B]/15 border border-[#CA922B]/25 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#CA922B]" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm mb-0.5">{label}</p>
                  <p className="text-[#F5EBD8]/50 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — form or confirmation */}
        <div className="w-full lg:w-[440px] shrink-0 pt-10 lg:pt-16">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10">
            {!submitted ? (
              <>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-1">Request Early Access</h2>
                <p className="text-[#3A1F0E]/50 text-sm mb-6 leading-relaxed">
                  Already have an account?{" "}
                  <a href="/login" className="text-[#CA922B] font-semibold hover:underline">Sign in</a>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">First Name</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        placeholder="Nia"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">Last Name</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        placeholder="Wilson"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">
                      Email Address <span className="text-[#CA922B]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                      autoComplete="email"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        placeholder="Atlanta"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={e => setState(e.target.value.toUpperCase())}
                        placeholder="GA"
                        maxLength={2}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                      />
                    </div>
                  </div>

                  {/* Business owner toggle */}
                  <button
                    type="button"
                    onClick={() => { setIsBusinessOwner(v => !v); setWebsiteUrl(""); }}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors ${isBusinessOwner ? "border-[#CA922B]/40 bg-[#CA922B]/5" : "border-[#3A1F0E]/10 bg-[#FAF6EF]"}`}
                  >
                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#3A1F0E]">I'm a business owner</p>
                      <p className="text-xs text-[#3A1F0E]/50">Get listed as a minority-owned business</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors flex items-center ${isBusinessOwner ? "bg-[#CA922B]" : "bg-[#3A1F0E]/20"}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform mx-1 ${isBusinessOwner ? "translate-x-4" : "translate-x-0"}`} />
                    </div>
                  </button>

                  {isBusinessOwner && (
                    <div>
                      <label className="block text-xs font-semibold text-[#3A1F0E]/60 mb-1.5 uppercase tracking-wide">
                        Website or Social Media <span className="text-[#CA922B]">*</span>
                      </label>
                      <input
                        type="text"
                        required={isBusinessOwner}
                        value={websiteUrl}
                        onChange={e => setWebsiteUrl(e.target.value)}
                        placeholder="https://yourbusiness.com or @handle"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-[#CA922B]/30 bg-[#FAF6EF] text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:ring-2 focus:ring-[#CA922B]/30 text-sm"
                        autoCapitalize="none"
                        autoCorrect="off"
                      />
                    </div>
                  )}

                  {referredBy && (
                    <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#CA922B]/8 border border-[#CA922B]/20">
                      <Users className="w-4 h-4 text-[#CA922B] shrink-0" />
                      <span className="text-xs text-[#3A1F0E]/70 font-medium">
                        Referred by code <span className="font-bold text-[#CA922B]">{referredBy}</span>
                      </span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!email || submitting}
                    className="w-full py-3.5 rounded-xl bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 text-[#1C0E06] font-bold text-sm transition-colors"
                  >
                    {submitting ? "Joining…" : "Request Early Access →"}
                  </button>

                  <p className="text-center text-xs text-[#3A1F0E]/40 leading-relaxed">
                    By joining you agree to our{" "}
                    <a href="/terms" className="underline hover:text-[#CA922B]">Terms</a> and{" "}
                    <a href="/privacy-policy" className="underline hover:text-[#CA922B]">Privacy Policy</a>.
                  </p>
                </form>
              </>
            ) : (
              /* ── Confirmation state ── */
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full bg-[#CA922B]/15 flex items-center justify-center mx-auto mb-5">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#CA922B]" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">You're on the list!</h2>
                {position && (
                  <p className="text-[#CA922B] font-bold text-lg mb-1">Position #{position.toLocaleString()}</p>
                )}
                <p className="text-[#3A1F0E]/60 text-sm leading-relaxed mb-6">
                  Check your email for a confirmation and your referral code. We'll notify you the moment you're approved.
                </p>

                {referralCode && referralLink && (
                  <div className="bg-[#2B1507] rounded-2xl p-5 mb-6 text-left">
                    <p className="text-[#CA922B]/80 text-[10px] font-bold uppercase tracking-widest mb-1">Move up the list — share your link</p>
                    <p className="text-white font-mono font-bold text-base mb-3">{referralCode}</p>

                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#F5EBD8] text-sm font-semibold transition-colors mb-3"
                    >
                      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      {copied ? "Copied!" : "Copy Referral Link"}
                    </button>

                    <div className="flex gap-2">
                      {[
                        { label: "X", platform: "X", icon: <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
                        { label: "Facebook", platform: "Facebook", icon: <Facebook size={13} /> },
                        { label: "LinkedIn", platform: "LinkedIn", icon: <Linkedin size={13} /> },
                        { label: "Copy", platform: "Copy", icon: <Link2 size={13} /> },
                      ].map(({ label, platform, icon }) => (
                        <button
                          key={platform}
                          onClick={() => platform === "Copy" ? handleCopy() : openShare(platform, referralLink)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5EBD8]/60 hover:text-[#CA922B] text-xs font-semibold transition-colors"
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <a
                  href="/login"
                  className="block w-full py-3 rounded-xl border border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white font-semibold text-sm transition-colors text-center"
                >
                  Sign In
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
