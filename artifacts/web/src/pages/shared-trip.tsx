import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { MapPin, Compass, Shield, Sparkles, ArrowRight, Copy, Check } from "lucide-react";

const BASE = import.meta.env.BASE_URL;

type Business = { name: string; category: string; neighborhood: string; vibe?: string; mustTry?: string; safetyNote?: string };
type Neighborhood = { name: string; vibe: string; highlights?: string[]; safetyNote?: string };
type Recommendations = {
  destination: string;
  summary: string;
  businesses: Business[];
  neighborhoods: Neighborhood[];
  safetyTips: string[];
};

type SharedTrip = {
  title: string | null;
  destination: string | null;
  lastRecommendations: Recommendations | null;
  followUpSuggestions: string[];
};

export default function SharedTrip() {
  const [, params] = useRoute("/shared/trip/:shareId");
  const shareId = params?.shareId;

  const [trip, setTrip] = useState<SharedTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shareId) return;
    fetch(`${BASE}api/kinfolk/shared/${shareId}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json() as Promise<SharedTrip>;
      })
      .then(d => { if (d) setTrip(d); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CA922B] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !trip) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-[#CA922B]" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-[#2B1507] mb-3">Trip not found</h1>
        <p className="text-[#3A1F0E]/60 mb-8">This trip guide may have been removed or the link is invalid.</p>
        <Link href={`${BASE}travel`}
          className="inline-flex items-center gap-2 bg-[#2B1507] text-[#F5EBD8] px-6 py-3 rounded-full font-bold text-sm hover:bg-[#3A1F0E] transition-colors">
          Plan Your Own Trip <ArrowRight size={14} />
        </Link>
      </div>
    );
  }

  const recs = trip.lastRecommendations;
  const destination = recs?.destination ?? trip.destination ?? "Your Destination";
  const title = trip.title ?? `${destination} Trip`;

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#CA922B]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#CA922B]" />
          </div>
          <div>
            <div className="text-white font-serif font-bold text-base leading-tight">KinfolkAI™</div>
            <div className="text-[#F5EBD8]/50 text-[10px] uppercase tracking-widest">Travel Companion</div>
          </div>
        </div>
        <button onClick={copyLink}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#F5EBD8]/80 hover:text-white text-xs font-medium transition-colors">
          {copied ? <Check size={12} className="text-[#CA922B]" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy link"}
        </button>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#2B1507] to-[#3A1F0E] px-4 pt-10 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-[#CA922B]/20 border border-[#CA922B]/40 rounded-full px-3 py-1 mb-4">
          <span className="text-[#CA922B] text-xs font-bold uppercase tracking-wider">Shared Trip Guide</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-serif font-bold text-white mb-3">{destination}</h1>
        <p className="text-[#F5EBD8]/60 text-sm">{title}</p>
      </div>

      <div className="container mx-auto px-4 max-w-2xl -mt-8 pb-16 space-y-5">

        {/* Summary */}
        {recs?.summary && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#3A1F0E]/8">
            <p className="text-[#3A1F0E]/80 text-sm leading-relaxed">{recs.summary}</p>
          </div>
        )}

        {/* Must-Visit Spots */}
        {recs && recs.businesses?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={14} className="text-[#CA922B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Must-Visit Spots</span>
            </div>
            <div className="grid gap-3">
              {recs.businesses.map((b, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-1">
                    <span className="font-bold text-[#3A1F0E] text-sm">{b.name}</span>
                    <span className="bg-[#FAF6EF] text-[#CA922B] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CA922B]/20 shrink-0 ml-2">{b.category}</span>
                  </div>
                  <p className="text-xs text-[#3A1F0E]/50 mb-2">{b.neighborhood}</p>
                  {b.vibe && <p className="text-xs text-[#3A1F0E]/70 italic mb-1">"{b.vibe}"</p>}
                  {b.mustTry && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#CA922B]/70">Must try:</span>
                      <span className="text-xs text-[#3A1F0E]/60">{b.mustTry}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Neighborhoods */}
        {recs && recs.neighborhoods?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Compass size={14} className="text-[#CA922B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Neighborhoods</span>
            </div>
            <div className="grid gap-3">
              {recs.neighborhoods.map((n, i) => (
                <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-bold text-[#3A1F0E] text-sm">{n.name}</span>
                    <span className="bg-[#FAF6EF] text-[#CA922B] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CA922B]/20">{n.vibe}</span>
                  </div>
                  {n.highlights && n.highlights.length > 0 && (
                    <ul className="space-y-1">
                      {n.highlights.map((h, j) => (
                        <li key={j} className="flex items-start gap-2 text-xs text-[#3A1F0E]/65">
                          <span className="text-[#CA922B] mt-0.5">•</span>{h}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Tips */}
        {recs && recs.safetyTips?.length > 0 && (
          <div className="bg-[#2B1507]/5 rounded-2xl p-5 border border-[#2B1507]/10">
            <div className="flex items-center gap-2 mb-3">
              <Shield size={14} className="text-[#CA922B]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Safety Tips</span>
            </div>
            <ul className="space-y-2">
              {recs.safetyTips.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[#3A1F0E]/70">
                  <span className="text-[#CA922B] font-bold mt-0.5">→</span>{t}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA */}
        <div className="bg-[#2B1507] rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#CA922B]/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5 text-[#CA922B]" />
          </div>
          <h3 className="font-serif font-bold text-white text-lg mb-2">Plan Your Own Trip</h3>
          <p className="text-[#F5EBD8]/60 text-sm mb-5">KinfolkAI creates personalized Black-culture travel guides — just tell it where you're going.</p>
          <Link href={`${BASE}travel`}
            className="inline-flex items-center gap-2 bg-[#CA922B] hover:bg-[#B38024] text-white px-6 py-3 rounded-full font-bold text-sm transition-colors shadow-[0_4px_14px_rgba(202,146,43,0.4)]">
            Try KinfolkAI™ <ArrowRight size={14} />
          </Link>
        </div>

        <p className="text-center text-[#3A1F0E]/30 text-xs pb-4">
          Powered by KinfolkAI™ · <a href={`${BASE}`} className="hover:text-[#CA922B] transition-colors">Mapping With Melanin™</a>
        </p>
      </div>
    </div>
  );
}
