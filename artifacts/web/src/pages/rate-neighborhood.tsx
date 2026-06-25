import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, CheckCircle, EyeOff, ChevronRight, ChevronLeft, Shield } from "lucide-react";
import { Link } from "wouter";

const CITIES = [
  "Atlanta", "Houston", "Chicago", "Washington DC", "New York",
  "New Orleans", "Los Angeles", "Miami", "Dallas", "Philadelphia",
  "Detroit", "Baltimore", "Memphis", "Charlotte", "Other",
];
const VISIT_PURPOSES = [
  "Dining out", "Shopping", "Nightlife", "Sightseeing",
  "Staying nearby", "Commuting", "Just passing through",
];
const VISIT_FREQ = ["First time", "Occasionally", "Regularly", "I live here"];
const ATMOSPHERES = [
  { id: "very_welcoming", label: "Very welcoming", emoji: "😊" },
  { id: "mostly_welcoming", label: "Mostly welcoming", emoji: "🙂" },
  { id: "neutral", label: "Neutral", emoji: "😐" },
  { id: "slightly_unwelcoming", label: "Slightly unwelcoming", emoji: "😕" },
  { id: "uncomfortable", label: "Uncomfortable", emoji: "😟" },
];
const ATMOSPHERE_SCORES: Record<string, number> = {
  very_welcoming: 5, mostly_welcoming: 4, neutral: 3, slightly_unwelcoming: 2, uncomfortable: 1,
};
const POLICE_VISIBILITY_OPTIONS = [
  { id: "very_visible", label: "Very visible" },
  { id: "moderately_visible", label: "Moderately visible" },
  { id: "occasionally_visible", label: "Occasionally visible" },
  { id: "rarely_visible", label: "Rarely visible" },
  { id: "not_observed", label: "Not observed" },
];
const POLICE_IMPACT_OPTIONS = [
  { id: "increased", label: "Increased my sense of safety" },
  { id: "no_impact", label: "Had no impact" },
  { id: "decreased", label: "Decreased my sense of safety" },
  { id: "unsure", label: "Unsure" },
];
const ACCESSIBILITY_FEATURES = [
  "Wheelchair accessible sidewalks", "Good street lighting", "Accessible public transit",
  "Gender-neutral restrooms nearby", "Family-friendly spaces", "LGBTQ+ friendly businesses", "None noticed",
];
const VISITOR_TIPS = [
  "Great for solo travelers", "Better with a group at night", "Keep valuables hidden",
  "Use rideshare after dark", "Parking can be tricky", "Very family friendly",
  "Active street life", "Quiet and residential",
];

const TOTAL_STEPS = 4;

function ScaleRating({ value, onChange, lowLabel, highLabel }: {
  value: number; onChange: (v: number) => void; lowLabel: string; highLabel: string;
}) {
  return (
    <div>
      <div className="flex gap-3 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-12 h-12 rounded-xl font-bold text-sm border-2 transition-all ${
              n <= value
                ? "bg-[#CA922B] border-[#CA922B] text-white"
                : "bg-white border-[#3A1F0E]/15 text-[#3A1F0E]/50 hover:border-[#CA922B]/50"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#3A1F0E]/50">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function Chip({ label, selected, onClick, multi = false }: {
  label: string; selected: boolean; onClick: () => void; multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
        selected
          ? "bg-[#CA922B] border-[#CA922B] text-white"
          : "bg-white border-[#3A1F0E]/15 text-[#3A1F0E] hover:border-[#CA922B]/50"
      }`}
    >
      {multi && selected && "✓ "}{label}
    </button>
  );
}

function computeScores(daytime: number, nighttime: number, walkability: number, transit: number, atmosphereScore: number) {
  const s = (v: number) => (v / 5) * 100;
  const safety = daytime && nighttime
    ? Math.round(s(daytime) * 0.3 + s(nighttime) * 0.4 + s(walkability || 0) * 0.2 + s(transit || 0) * 0.1)
    : 0;
  const community = atmosphereScore ? Math.round(s(atmosphereScore)) : 0;
  const walk = walkability ? Math.round(s(walkability) * 0.7 + s(transit || 0) * 0.3) : 0;
  return { safety, community, walk };
}

export default function RateNeighborhood() {
  const BASE = import.meta.env.BASE_URL;
  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [visitPurpose, setVisitPurpose] = useState("");
  const [visitFreq, setVisitFreq] = useState("");
  const [daytimeSafety, setDaytimeSafety] = useState(0);
  const [nighttimeSafety, setNighttimeSafety] = useState(0);
  const [walkability, setWalkability] = useState(0);
  const [transitSafety, setTransitSafety] = useState(0);
  const [atmosphere, setAtmosphere] = useState("");
  const [policeVisibility, setPoliceVisibility] = useState("");
  const [policeImpact, setPoliceImpact] = useState("");
  const [accessibility, setAccessibility] = useState<string[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const atmObj = ATMOSPHERES.find((a) => a.id === atmosphere);
  const scores = computeScores(daytimeSafety, nighttimeSafety, walkability, transitSafety, ATMOSPHERE_SCORES[atmosphere] ?? 0);

  const canNext1 = city.length > 0 && visitPurpose.length > 0;
  const canNext2 = daytimeSafety > 0 && nighttimeSafety > 0;
  const canNext3 = atmosphere.length > 0;
  const canGoNext = step === 1 ? canNext1 : step === 2 ? canNext2 : step === 3 ? canNext3 : true;

  const toggleMulti = (arr: string[], setArr: (v: string[]) => void, val: string) => {
    setArr(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val]);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${BASE}api/surveys`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          city, neighborhood: neighborhood || undefined,
          visitPurpose, visitFreq: visitFreq || undefined,
          daytimeSafety, nighttimeSafety,
          walkability: walkability || undefined,
          transitSafety: transitSafety || undefined,
          atmosphere, policeVisibility, policeImpact,
          accessibility, tips,
          comments: comments || undefined,
        }),
      });
      if (res.status === 401 || res.status === 403) {
        setError("waitlist");
      } else if (!res.ok) {
        setError("Something went wrong. Please try again.");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#3A1F0E] mb-3">Survey Submitted!</h1>
          <p className="text-[#3A1F0E]/70 mb-8">
            Thank you for helping the community make safer, more informed decisions.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Safety Score", val: scores.safety },
              { label: "Community", val: scores.community },
              { label: "Walkability", val: scores.walk },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-4 border border-[#CA922B]/20">
                <div className="text-2xl font-serif font-bold text-[#CA922B]">{s.val || "—"}</div>
                <div className="text-xs text-[#3A1F0E]/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/safety">
              <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-11">View Safety Scores</Button>
            </Link>
            <Button variant="outline" className="rounded-full border-[#3A1F0E]/20 text-[#3A1F0E] px-8 h-11"
              onClick={() => { setSubmitted(false); setStep(1); setCity(""); setNeighborhood(""); setVisitPurpose(""); setVisitFreq(""); setDaytimeSafety(0); setNighttimeSafety(0); setWalkability(0); setTransitSafety(0); setAtmosphere(""); setPoliceVisibility(""); setPoliceImpact(""); setAccessibility([]); setTips([]); setComments(""); }}>
              Rate Another
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Hero */}
      <section className="bg-[#2B1507] py-16 text-white text-center">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#CA922B]/50 bg-[#CA922B]/10 mb-6">
            <Shield className="w-3.5 h-3.5 text-[#CA922B]" />
            <span className="text-xs font-bold tracking-widest text-[#CA922B] uppercase">Community Safety Survey</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Rate a Neighborhood</h1>
          <p className="text-white/70 text-lg">
            Your anonymous report helps the community navigate cities with confidence.
          </p>
        </div>
      </section>

      {/* Progress bar */}
      <div className="bg-[#1c0d04] h-1.5">
        <div
          className="h-full bg-[#CA922B] transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="container mx-auto px-4 max-w-2xl py-12">
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8">
          {["Location", "Safety", "Community", "Tips"].map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i + 1 < step ? "bg-[#CA922B] text-white" :
                i + 1 === step ? "bg-[#2B1507] text-white" :
                "bg-[#3A1F0E]/10 text-[#3A1F0E]/40"
              }`}>
                {i + 1 < step ? "✓" : i + 1}
              </div>
              <span className={`text-sm font-medium hidden sm:block ${i + 1 === step ? "text-[#3A1F0E]" : "text-[#3A1F0E]/40"}`}>{label}</span>
              {i < 3 && <ChevronRight className="w-4 h-4 text-[#3A1F0E]/20 ml-1 hidden sm:block" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-[#3A1F0E]/8 p-8 shadow-sm">

          {/* Step 1 — Location */}
          {step === 1 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-1">📍 Location</h2>
                <p className="text-[#3A1F0E]/60 text-sm">City and visit type are required — neighborhood is optional</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">City</label>
                <div className="flex flex-wrap gap-2">
                  {CITIES.map((c) => (
                    <button key={c} type="button" onClick={() => setCity(c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                        city === c ? "bg-[#2B1507] border-[#2B1507] text-white" : "bg-white border-[#3A1F0E]/15 text-[#3A1F0E] hover:border-[#CA922B]/50"
                      }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-2">
                  Neighborhood / Area <span className="font-normal text-[#3A1F0E]/50">(optional)</span>
                </label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Old Fourth Ward, Harlem, Hyde Park…"
                  className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">What were you doing in this area?</label>
                <div className="flex flex-wrap gap-2">
                  {VISIT_PURPOSES.map((p) => (
                    <Chip key={p} label={p} selected={visitPurpose === p} onClick={() => setVisitPurpose(p)} />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">
                  How often do you visit this area? <span className="font-normal text-[#3A1F0E]/50">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {VISIT_FREQ.map((f) => (
                    <Chip key={f} label={f} selected={visitFreq === f} onClick={() => setVisitFreq(f)} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 — Safety Ratings */}
          {step === 2 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-1">⭐ Safety Ratings</h2>
                <p className="text-[#3A1F0E]/60 text-sm">
                  {neighborhood ? `${neighborhood}, ${city}` : city} — daytime and nighttime are required
                </p>
              </div>

              {[
                { label: "Daytime safety", val: daytimeSafety, set: setDaytimeSafety, weight: "30% of Safety Score" },
                { label: "Nighttime safety", val: nighttimeSafety, set: setNighttimeSafety, weight: "40% of Safety Score" },
                { label: "Walkability", val: walkability, set: setWalkability, weight: "20% of Safety Score", optional: true },
                { label: "Public transit safety", val: transitSafety, set: setTransitSafety, weight: "10% of Safety Score", optional: true },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-2xl border border-[#3A1F0E]/8 bg-[#FAF6EF]">
                  <div className="flex justify-between items-start mb-4">
                    <span className="font-bold text-[#3A1F0E] text-sm">
                      {item.label}{item.optional && <span className="font-normal text-[#3A1F0E]/50"> (optional)</span>}
                    </span>
                    <span className="text-xs text-[#CA922B] font-medium">{item.weight}</span>
                  </div>
                  <ScaleRating value={item.val} onChange={item.set} lowLabel="Unsafe" highLabel="Very Safe" />
                </div>
              ))}

              {daytimeSafety > 0 && nighttimeSafety > 0 && (
                <div className="bg-[#CA922B]/10 border border-[#CA922B]/25 rounded-2xl p-4 flex items-center justify-between">
                  <span className="text-sm text-[#3A1F0E]/70 font-medium">Safety Score Preview</span>
                  <span className="text-2xl font-serif font-bold text-[#CA922B]">{scores.safety}<span className="text-base text-[#3A1F0E]/40">/100</span></span>
                </div>
              )}
            </div>
          )}

          {/* Step 3 — Community Experience */}
          {step === 3 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-1">🏘️ Community Experience</h2>
                <p className="text-[#3A1F0E]/60 text-sm">Atmosphere is required — accessibility is optional</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">Overall atmosphere</label>
                <div className="space-y-2">
                  {ATMOSPHERES.map((a) => (
                    <button key={a.id} type="button" onClick={() => setAtmosphere(a.id)}
                      className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all text-left ${
                        atmosphere === a.id ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white hover:border-[#CA922B]/40"
                      }`}>
                      <span className="font-medium text-[#3A1F0E]">{a.emoji} {a.label}</span>
                      {atmosphere === a.id && <CheckCircle className="w-5 h-5 text-[#CA922B]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">
                  Accessibility features noticed <span className="font-normal text-[#3A1F0E]/50">(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {ACCESSIBILITY_FEATURES.map((f) => (
                    <Chip key={f} label={f} selected={accessibility.includes(f)} onClick={() => toggleMulti(accessibility, setAccessibility, f)} multi />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4 — Tips & Comments */}
          {step === 4 && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-1">💬 Tips & Comments</h2>
                <p className="text-[#3A1F0E]/60 text-sm">Completely optional — help other visitors know what to expect</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-3">Quick tips for visitors</label>
                <div className="flex flex-wrap gap-2">
                  {VISITOR_TIPS.map((t) => (
                    <Chip key={t} label={t} selected={tips.includes(t)} onClick={() => toggleMulti(tips, setTips, t)} multi />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#3A1F0E] mb-2">Anything else the community should know?</label>
                <textarea
                  value={comments}
                  onChange={(e) => e.target.value.length <= 500 && setComments(e.target.value)}
                  placeholder="Share what visitors should know about this neighborhood…"
                  rows={5}
                  className="w-full border border-[#3A1F0E]/15 rounded-xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/40 focus:outline-none focus:border-[#CA922B] bg-[#FAF6EF] resize-none"
                />
                <p className="text-xs text-[#3A1F0E]/40 text-right mt-1">{comments.length}/500</p>
              </div>

              <div className="flex items-center gap-3 bg-[#FAF6EF] rounded-xl px-4 py-3">
                <EyeOff className="w-4 h-4 text-[#3A1F0E]/40 shrink-0" />
                <p className="text-sm text-[#3A1F0E]/60">Surveys are always shared anonymously with the community</p>
              </div>

              {error === "waitlist" && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-amber-800 font-medium text-sm mb-3">You need a Mapping with Melanin™ account to submit a survey.</p>
                  <Link href="/#waitlist-form">
                    <Button className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-6 h-10 text-sm">Join the Waitlist for Early Access</Button>
                  </Link>
                </div>
              )}
              {error && error !== "waitlist" && (
                <p className="text-red-600 text-sm text-center">{error}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-[#3A1F0E]/8">
            {step > 1 ? (
              <button type="button" onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-2 text-sm font-medium text-[#3A1F0E]/60 hover:text-[#3A1F0E] transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <Link href="/businesses">
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-[#3A1F0E]/60 hover:text-[#3A1F0E] transition-colors">
                  <ChevronLeft className="w-4 h-4" /> Cancel
                </button>
              </Link>
            )}

            {step < TOTAL_STEPS ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={!canGoNext}
                className="rounded-full bg-[#2B1507] hover:bg-[#1a0c04] text-white px-8 h-11 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-[#CA922B] hover:bg-[#B38024] text-white px-8 h-11 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit Survey"}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-[#3A1F0E]/40 mt-6">
          All survey responses are anonymous and used only to generate community safety scores.
        </p>
      </div>
    </div>
  );
}
