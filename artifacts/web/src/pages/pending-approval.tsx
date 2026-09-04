import { Button } from "@/components/ui/button";
import { Clock, Mail, Users, Copy, Check, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { getSocialShareUrl, type SharePlatform } from "@/lib/socialLinks";

const BASE = import.meta.env.BASE_URL;
const SITE_URL = "https://mappingwithmelanin.com";

interface WaitlistEntry {
  id: string;
  email: string;
  firstName: string | null;
  referralCode: string | null;
  referralCount: number;
  status: string;
  position?: number;
}

function openShare(platform: string, url: string) {
  const text = "I just joined the Mapping with Melanin™ waitlist! Use my link to get early access:";
  if (platform === "Threads" || platform === "Facebook" || platform === "LinkedIn") {
    window.open(getSocialShareUrl(platform as SharePlatform, text, url), "_blank", "noopener,noreferrer,width=600,height=500");
  }
}

export default function PendingApproval() {
  const { data: auth } = useGetCurrentAuthUser();
  const [entry, setEntry] = useState<WaitlistEntry | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch(`${BASE}api/waitlist/my-entry`, { credentials: "include" })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { entry: WaitlistEntry | null }) => { if (d.entry) setEntry(d.entry); })
      .catch(() => {})
      .finally(() => setLoadingEntry(false));
  }, []);

  const referralLink = entry?.referralCode
    ? `${SITE_URL}/waitlist?ref=${entry.referralCode}`
    : null;

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = () => {
    window.location.href = `${BASE}api/logout`;
  };

  const firstName = auth?.user?.firstName ?? entry?.firstName ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] p-4 relative overflow-hidden">
      <div
        className="absolute inset-0 bg-[#2B1507]/5"
        style={{
          backgroundImage: "radial-gradient(circle at center, #CA922B 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.08)] border border-[#2B1507]/5 p-10 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-[#CA922B]/10 border border-[#CA922B]/20 flex items-center justify-center rounded-full mb-6 text-[#CA922B]">
            <Clock size={40} />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-3">
            {firstName ? `You're on the list, ${firstName}!` : "You're on the List"}
          </h1>
          <p className="text-[#3A1F0E]/60 text-base leading-relaxed font-light">
            Your account is pending approval. We review early access applications in batches — you'll get an email the moment you're approved.
          </p>
        </div>

        {/* Steps */}
        <div className="bg-[#FAF6EF] rounded-2xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#CA922B] text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</div>
            <p className="text-sm text-[#3A1F0E]/70">Your account is in the review queue.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#3A1F0E]/20 text-[#3A1F0E]/40 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</div>
            <p className="text-sm text-[#3A1F0E]/50">Our team reviews and approves your access (usually within 24 hours).</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-[#3A1F0E]/20 text-[#3A1F0E]/40 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</div>
            <p className="text-sm text-[#3A1F0E]/50">You'll receive an approval email — then sign in here to explore.</p>
          </div>
        </div>

        {/* Referral card */}
        {!loadingEntry && referralLink && (
          <div className="bg-[#2B1507] rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-[#CA922B]" />
              <p className="text-[#CA922B] font-bold text-xs uppercase tracking-widest">Move Up the List</p>
            </div>
            <p className="text-[#F5EBD8]/70 text-sm mb-4 leading-relaxed">
              Each friend you refer bumps you closer to the front. You've referred <span className="text-[#CA922B] font-bold">{entry!.referralCount} {entry!.referralCount === 1 ? "person" : "people"}</span> so far.
            </p>

            {/* Referral code */}
            <div className="bg-white/5 rounded-xl p-3 mb-4">
              <p className="text-[#CA922B]/70 text-[10px] font-bold uppercase tracking-widest mb-1">Your Referral Code</p>
              <p className="text-white font-mono font-bold text-lg">{entry!.referralCode}</p>
            </div>

            {/* Copy link */}
            <button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-[#F5EBD8] text-sm font-semibold transition-colors mb-3"
            >
              {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Referral Link"}
            </button>

            {/* Share buttons */}
            <div className="flex gap-2">
              {[
                { label: "Threads", platform: "Threads", icon: <span className="text-sm font-bold" aria-hidden="true">@</span> },
                { label: "Facebook", platform: "Facebook", icon: <Share2 size={14} /> },
                { label: "LinkedIn", platform: "LinkedIn", icon: <Share2 size={14} /> },
              ].map(({ label, platform, icon }) => (
                <button
                  key={platform}
                  onClick={() => openShare(platform, referralLink)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#F5EBD8]/70 hover:text-[#CA922B] text-xs font-semibold transition-colors"
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No waitlist entry — guide them to the signup */}
        {!loadingEntry && !entry && (
          <div className="bg-[#2B1507] rounded-2xl p-5 mb-6">
            <p className="text-[#CA922B] font-bold text-sm mb-1">Not on the waitlist yet?</p>
            <p className="text-[#F5EBD8]/70 text-sm leading-relaxed mb-3">
              Join the waitlist to secure your spot and get an approval email.
            </p>
            <a href="/waitlist" className="block w-full py-2.5 rounded-xl bg-[#CA922B] hover:bg-[#B38024] text-center text-[#1C0E06] font-bold text-sm transition-colors">
              Join the Waitlist
            </a>
          </div>
        )}

        {/* Contact */}
        <a href="mailto:hello@mappingwithmelanin.com" className="block w-full mb-4">
          <Button variant="outline" className="w-full h-12 rounded-full border-[#CA922B] text-[#CA922B] hover:bg-[#CA922B] hover:text-white">
            <Mail className="mr-2 h-4 w-4" /> Contact Us
          </Button>
        </a>

        <button
          onClick={handleLogout}
          className="block w-full text-sm text-[#3A1F0E]/40 hover:text-[#3A1F0E] transition-colors text-center"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
