import { useState } from "react";
import { useLocation } from "wouter";
import { Map, Shield, Star, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Map,
    title: "Discover Minority-Owned Businesses Near You",
    body: "Search hundreds of verified businesses by category, city, and safety rating. Every listing is community-reviewed and kept up to date.",
    cta: "Explore the Map",
    action: "/discover",
    color: "#CA922B",
    checks: [
      "Filter by category, neighborhood, and price",
      "View full business profiles with photos & hours",
      "Read community reviews and safety context",
    ],
  },
  {
    icon: Shield,
    title: "Know What to Expect Before You Arrive",
    body: "Community Intelligence gives you real context from people who've actually been there — arrival experiences, practical conditions, and what members have shared firsthand.",
    cta: "View Community Intelligence",
    action: "/safety",
    color: "#2B6CB0",
    checks: [
      "Member-sourced arrival and access experiences",
      "Community atmosphere and practical local context",
      "Shared observations from people who live and work there",
    ],
  },
  {
    icon: Star,
    title: "Share Your Experience with the Community",
    body: "Your reviews and safety reports help thousands of people make informed decisions. Every contribution earns points toward community recognition.",
    cta: "Write Your First Review",
    action: "/discover",
    color: "#38A169",
    checks: [
      "Rate businesses you've visited",
      "Submit neighborhood safety reports",
      "Earn community points for every contribution",
    ],
  },
];

export default function Welcome() {
  const [step, setStep] = useState(0);
  const [, navigate] = useLocation();
  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#FAF6EF] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-10 text-center">
        <p className="text-xs font-bold tracking-widest text-[#CA922B] uppercase mb-1">Welcome to</p>
        <h1 className="text-2xl font-serif font-bold text-[#2B1507]">Mapping with Melanin™</h1>
      </div>

      {/* Step progress dots */}
      <div className="flex gap-2 mb-8">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? "w-8 bg-[#CA922B]" : i < step ? "w-3 bg-[#CA922B]/50" : "w-3 bg-[#3A1F0E]/20"}`} />
        ))}
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-[0_20px_60px_rgba(43,21,7,0.10)] max-w-md w-full overflow-hidden">
        {/* Icon header */}
        <div className="p-10 pb-6 text-center" style={{ background: `linear-gradient(135deg, ${current.color}15, ${current.color}05)` }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: `${current.color}20` }}>
            <Icon className="w-8 h-8" style={{ color: current.color }} />
          </div>
          <h2 className="text-xl font-serif font-bold text-[#2B1507] leading-snug">{current.title}</h2>
        </div>

        <div className="px-8 pb-8 pt-4">
          <p className="text-[#3A1F0E]/70 text-sm leading-relaxed mb-6">{current.body}</p>

          <ul className="space-y-3 mb-8">
            {current.checks.map((c, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-[#3A1F0E]/80">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${current.color}20` }}>
                  <Check className="w-3 h-3" style={{ color: current.color }} />
                </div>
                {c}
              </li>
            ))}
          </ul>

          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}
                className="flex-1 rounded-full border-[#3A1F0E]/20 text-[#3A1F0E]/60 hover:text-[#3A1F0E]">
                Back
              </Button>
            )}
            <Button
              onClick={() => isLast ? navigate(current.action) : setStep(step + 1)}
              className="flex-1 rounded-full font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
              style={{ background: current.color }}
            >
              {isLast ? (
                <>{current.cta} <ArrowRight className="w-4 h-4 ml-1" /></>
              ) : (
                <>Next <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>

          {!isLast && (
            <button onClick={() => navigate("/discover")}
              className="w-full text-center text-[#3A1F0E]/40 text-xs mt-4 hover:text-[#3A1F0E]/60 transition-colors">
              Skip intro
            </button>
          )}
        </div>
      </div>

      <p className="text-[#3A1F0E]/30 text-xs mt-8">Step {step + 1} of {STEPS.length}</p>
    </div>
  );
}
