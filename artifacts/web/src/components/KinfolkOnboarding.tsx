import { useState, useCallback, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check, MapPin, Heart, Coffee, Users, Briefcase, Leaf, Zap } from "lucide-react";
import { useAgeAssurance } from "@/hooks/useAgeAssurance";

const BASE = import.meta.env.BASE_URL;

interface Props {
  firstName?: string | null;
  onComplete: () => void;
}

// ── Option lists ───────────────────────────────────────────────────────────

const PURPOSES = [
  "Discovering businesses", "Planning travel", "Exploring relocation",
  "Building community", "Safety & awareness", "Finding events",
  "Culture & history", "Career & opportunity", "Other",
];

const CATEGORIES = [
  "Restaurants & Dining", "Beauty & Wellness", "Arts & Entertainment",
  "Shopping & Retail", "Faith & Spiritual", "Fitness & Health",
  "Nightlife & Music", "Education & Learning", "Professional Services",
  "Community Organizations", "Cultural Sites", "Family Activities",
];

const AVOID = [
  "Crowded venues", "Chain restaurants", "Tourist traps", "Loud nightlife",
  "Far from transit", "Cash-only places", "No outdoor seating", "Nothing to avoid",
];

const BUDGET_OPTIONS = [
  { value: "budget", label: "Budget-friendly", sub: "$ deals & hidden gems" },
  { value: "mid", label: "Moderate", sub: "$$ everyday quality" },
  { value: "luxury", label: "Upscale", sub: "$$$ elevated experiences" },
  { value: "any", label: "Mix it up", sub: "Depends on the occasion" },
];

const STYLE_OPTIONS = [
  { value: "solo", label: "Solo", sub: "Built around my pace" },
  { value: "couple", label: "Couple", sub: "Time with a partner" },
  { value: "family", label: "Family", sub: "Family-friendly planning" },
  { value: "group", label: "Friend group", sub: "Something the group can enjoy" },
  { value: "business", label: "Work trip", sub: "Useful around work plans" },
  { value: "spiritual", label: "Spiritual", sub: "Reflective and meaningful" },
];

const COMPANION_OPTIONS = [
  { value: "solo", label: "Solo" },
  { value: "partner", label: "Partner / Spouse" },
  { value: "friends", label: "Friends" },
  { value: "family", label: "Family" },
  { value: "colleagues", label: "Colleagues" },
];

const RECOMMENDATION_LIFE_STAGES = [
  { value: "unspecified" as const, label: "Prefer not to say" },
  { value: "18_39" as const, label: "18–39" },
  { value: "40_64" as const, label: "40–64" },
  { value: "65_plus" as const, label: "65+" },
];

const ATMOSPHERE_OPTIONS = [
  { value: "explorer", label: "Adventurous & new" },
  { value: "cozy", label: "Cozy & intimate" },
  { value: "vibrant", label: "Vibrant & social" },
  { value: "cultural", label: "Cultural & meaningful" },
  { value: "relaxed", label: "Relaxed & low-key" },
  { value: "upscale", label: "Elevated & refined" },
];

const OWNERSHIP_OPTIONS = [
  "Black-owned", "Women-owned", "Latinx-owned", "Indigenous-owned",
  "LGBTQ+-owned", "Veteran-owned", "Community co-op", "Any minority-owned",
];

const LIFESTYLE_OPTIONS = [
  "Childcare & Early Education", "Mental wellness", "Physical health & fitness",
  "Financial literacy", "Legal aid", "Immigration services",
  "Housing & real estate", "Career & workforce", "Faith services",
  "Senior care", "Disability services", "Substance recovery",
];

const PERSONALIZATION_OPTIONS = [
  { value: "detailed", label: "High — learn everything about my taste" },
  { value: "friendly", label: "Balanced — blend my prefs with community signals" },
  { value: "concise", label: "Light — keep it simple, not too personalized" },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function Chip({
  label, selected, onClick,
}: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
        selected
          ? "bg-[#CA922B] text-white border-[#CA922B]"
          : "bg-white text-[#2B1507] border-[#E8DDD0] hover:border-[#CA922B]/60"
      }`}
    >
      {label}
    </button>
  );
}

function CardOption({
  label, sub, selected, onClick,
}: { label: string; sub?: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
        selected
          ? "border-[#CA922B] bg-[#CA922B]/8"
          : "border-[#E8DDD0] bg-white hover:border-[#CA922B]/40"
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
        selected ? "border-[#CA922B] bg-[#CA922B]" : "border-[#E8DDD0]"
      }`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <div>
        <p className="font-semibold text-[#2B1507] text-sm">{label}</p>
        {sub && <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function KinfolkOnboarding({ firstName, onComplete }: Props) {
  const ageAssurance = useAgeAssurance(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Accumulated answers
  const [homeCity, setHomeCity] = useState("");
  const [favoriteCities, setFavoriteCities] = useState("");
  const [purposes, setPurposes] = useState<string[]>([]);
  const [favoriteCategories, setFavoriteCategories] = useState<string[]>([]);
  const [specificInterests, setSpecificInterests] = useState("");
  const [recommendationLifeStage, setRecommendationLifeStage] = useState<"unspecified" | "18_39" | "40_64" | "65_plus">("unspecified");
  const [avoidCategories, setAvoidCategories] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState("");
  const [tripStyle, setTripStyle] = useState<string[]>([]);
  const [travelCompanion, setTravelCompanion] = useState("");
  const [atmosphereMode, setAtmosphereMode] = useState("");
  const [ownershipPrefs, setOwnershipPrefs] = useState<string[]>([]);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);
  const [isCommunityOrg, setIsCommunityOrg] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [lifestyleServices, setLifestyleServices] = useState<string[]>([]);
  const [personalizationLevel, setPersonalizationLevel] = useState("friendly");

  useEffect(() => {
    if (ageAssurance.ageBand !== "18_plus") setRecommendationLifeStage("unspecified");
  }, [ageAssurance.ageBand]);

  const TOTAL_STEPS = 15;

  const toggle = useCallback((arr: string[], val: string, set: (v: string[]) => void) => {
    set(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  }, []);

  const saveAndComplete = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const cityList = favoriteCities.split(",").map(c => c.trim()).filter(Boolean);
      const specificInterestList = specificInterests
        .split(/[,\n]/)
        .map(value => value.trim())
        .filter(value => value.length >= 2 && value.length <= 80);
      const savedCategories = [...new Set([...favoriteCategories, ...specificInterestList])].slice(0, 50);
      const personalityMode = atmosphereMode === "cultural"
        ? "cultural_curator"
        : atmosphereMode === "explorer"
          ? "neighborhood_guide"
          : "community";

      // Save preferences first. Profile setup is not marked complete if this fails.
      const preferencesResponse = await fetch(`${BASE}api/kinfolk/preferences`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendationLifeStage,
          favoriteCities: cityList.length > 0 ? cityList : undefined,
          favoriteCategories: savedCategories.length > 0 ? savedCategories : undefined,
          avoidCategories: avoidCategories.length > 0 ? avoidCategories : undefined,
          budgetRange: budgetRange || undefined,
          tripStyle: tripStyle.length > 0 ? tripStyle : undefined,
          travelCompanion: travelCompanion || undefined,
          personalityMode,
          lifestyleServices: lifestyleServices.length > 0 ? lifestyleServices : undefined,
          dietaryNotes: dietaryNotes.trim() || undefined,
          communicationStyle: personalizationLevel,
        }),
      });
      if (!preferencesResponse.ok) throw new Error("PREFERENCE_SAVE_FAILED");

      const profileResponse = await fetch(`${BASE}api/auth/user/setup`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeCity: homeCity.trim() || undefined,
          isBusinessOwner,
          isCommunityOrganizer: isCommunityOrg,
          culturalInterests: purposes,
          preferredOwnershipTypes: ownershipPrefs,
          profileSetupComplete: true,
        }),
      });
      if (!profileResponse.ok) throw new Error("PROFILE_SAVE_FAILED");
      onComplete();
    } catch {
      setSaveError("Kinfolk could not save your preferences. Nothing was marked complete; please try again.");
    } finally {
      setSaving(false);
    }
  }, [homeCity, favoriteCities, purposes, favoriteCategories, specificInterests, recommendationLifeStage, avoidCategories,
      budgetRange, tripStyle, travelCompanion, atmosphereMode, ownershipPrefs,
      isBusinessOwner, isCommunityOrg, dietaryNotes, lifestyleServices,
      personalizationLevel, onComplete]);

  const skipAll = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`${BASE}api/auth/user/setup`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileSetupComplete: true }),
      });
    } finally {
      setSaving(false);
      onComplete();
    }
  }, [onComplete]);

  const next = () => {
    if (step >= TOTAL_STEPS - 1) { saveAndComplete(); return; }
    setStep(s => s + 1);
  };
  const back = () => setStep(s => Math.max(0, s - 1));

  const progress = ((step + 1) / TOTAL_STEPS) * 100;
  const isLast = step === TOTAL_STEPS - 1;

  // ── Step content ───────────────────────────────────────────────────────

  const steps: { title: string; subtitle?: string; content: React.ReactNode }[] = [
    // Step 0 — Welcome
    {
      title: `Welcome${firstName ? `, ${firstName}` : ""}`,
      subtitle: "Kinfolk is your personal guide to the community. A few quick questions help us get things right from day one.",
      content: (
        <div className="flex flex-col items-center gap-5 py-4">
          <div className="w-20 h-20 rounded-full bg-[#CA922B]/15 flex items-center justify-center">
            <span className="text-4xl">✦</span>
          </div>
          <div className="bg-[#2B1507] rounded-2xl px-5 py-4 max-w-xs text-center">
            <p className="text-[#F5EBD8]/90 text-sm leading-relaxed italic">
              "I learn through your saves, searches, and experiences — not just what you tell me now.
              Answer what feels right. Skip what doesn't. Nothing here is permanent."
            </p>
            <p className="text-[#CA922B] text-xs font-bold mt-2">— Kinfolk</p>
          </div>
          <p className="text-xs text-[#3A1F0E]/50 text-center">15 short questions · Skip any time · Edit later in Profile</p>
        </div>
      ),
    },

    // Step 1 — Home city
    {
      title: "Where do you call home?",
      subtitle: "Kinfolk prioritizes local community knowledge here first.",
      content: (
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#CA922B]" />
            <input
              value={homeCity}
              onChange={e => setHomeCity(e.target.value)}
              placeholder="e.g. Philadelphia, PA"
              className="w-full pl-10 pr-4 py-4 rounded-2xl border border-[#E8DDD0] bg-white text-[#2B1507] text-sm focus:outline-none focus:border-[#CA922B] placeholder:text-[#3A1F0E]/30"
            />
          </div>
          <p className="text-xs text-[#3A1F0E]/40 pl-1">City and state, country, or neighborhood</p>
        </div>
      ),
    },

    // Step 2 — Other cities you care about
    {
      title: "Any other cities on your radar?",
      subtitle: "Places you travel to, came from, or keep up with.",
      content: (
        <div className="flex flex-col gap-3">
          <textarea
            value={favoriteCities}
            onChange={e => setFavoriteCities(e.target.value)}
            placeholder="e.g. Atlanta, GA · Kingston, Jamaica · Chicago, IL"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD0] bg-white text-[#2B1507] text-sm focus:outline-none focus:border-[#CA922B] resize-none placeholder:text-[#3A1F0E]/30"
          />
          <p className="text-xs text-[#3A1F0E]/40 pl-1">Separate by comma · International cities welcome</p>
        </div>
      ),
    },

    // Step 3 — What brings you here
    {
      title: "What brings you to Mapping with Melanin?",
      subtitle: "Choose everything that applies.",
      content: (
        <div className="flex flex-wrap gap-2">
          {PURPOSES.map(p => (
            <Chip key={p} label={p} selected={purposes.includes(p)}
              onClick={() => toggle(purposes, p, setPurposes)} />
          ))}
        </div>
      ),
    },

    // Step 4 — Favorite categories
    {
      title: "What do you most like to discover?",
      subtitle: "Kinfolk will emphasize these in your recommendations.",
      content: (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <Chip key={c} label={c} selected={favoriteCategories.includes(c)}
                onClick={() => toggle(favoriteCategories, c, setFavoriteCategories)} />
            ))}
          </div>
          <div>
            <label htmlFor="kinfolk-specific-interests" className="block text-xs font-bold text-[#2B1507] mb-1">Anything specific?</label>
            <textarea id="kinfolk-specific-interests" value={specificInterests} onChange={event => setSpecificInterests(event.target.value)} rows={2}
              placeholder="e.g. author events, candle making, board games"
              className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD0] bg-white text-[#2B1507] text-sm focus:outline-none focus:border-[#CA922B] resize-none placeholder:text-[#3A1F0E]/30" />
            <p className="mt-1 text-xs text-[#3A1F0E]/45">Separate items with commas. This is private taste data and can be removed later.</p>
          </div>
          <div>
            <p className="text-xs font-bold text-[#2B1507] mb-2">Recommendation life stage (optional)</p>
            {ageAssurance.loading ? (
              <p className="mb-2 text-xs text-[#3A1F0E]/50">Checking your age-safety setting…</p>
            ) : ageAssurance.ageBand === "unknown" ? (
              <div className="mb-3 rounded-xl border border-[#E8DDD0] bg-[#FAF6EF] p-3">
                <p className="text-xs leading-relaxed text-[#3A1F0E]/70">Adult brackets require a one-time 18+ self-attestation. We store only the range, never your birth date.</p>
                <button type="button" disabled={ageAssurance.saving} onClick={() => void ageAssurance.attest("18_plus")}
                  className="mt-2 rounded-full bg-[#2B1507] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                  {ageAssurance.saving ? "Saving…" : "I confirm I am 18 or older"}
                </button>
              </div>
            ) : ageAssurance.ageBand === "18_plus" ? (
              <p className="mb-2 text-xs font-semibold text-emerald-700">18+ self-attestation confirmed.</p>
            ) : (
              <p className="mb-2 text-xs leading-relaxed text-[#3A1F0E]/60">This account remains youth-protected, so adult recommendation brackets are unavailable.</p>
            )}
            {ageAssurance.error && <p role="alert" className="mb-2 text-xs text-red-700">{ageAssurance.error}</p>}
            <div className="flex flex-wrap gap-2">
              {RECOMMENDATION_LIFE_STAGES.map(option => {
                const disabled = option.value !== "unspecified" && ageAssurance.ageBand !== "18_plus";
                return (
                  <button key={option.value} type="button" disabled={disabled} aria-pressed={recommendationLifeStage === option.value}
                    onClick={() => setRecommendationLifeStage(option.value)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all disabled:cursor-not-allowed disabled:opacity-40 ${recommendationLifeStage === option.value ? "bg-[#CA922B] text-white border-[#CA922B]" : "bg-white text-[#2B1507] border-[#E8DDD0] hover:border-[#CA922B]/60"}`}>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#3A1F0E]/45">Used only when life stage matters. This does not collect your birth date or infer health, income, mobility, or family status. Choose “Prefer not to say” to opt out.</p>
          </div>
        </div>
      ),
    },

    // Step 5 — Things to avoid
    {
      title: "Anything you usually skip?",
      subtitle: "Optional — helps Kinfolk filter smarter.",
      content: (
        <div className="flex flex-wrap gap-2">
          {AVOID.map(a => (
            <Chip key={a} label={a} selected={avoidCategories.includes(a)}
              onClick={() => toggle(avoidCategories, a, setAvoidCategories)} />
          ))}
        </div>
      ),
    },

    // Step 6 — Budget
    {
      title: "What's your usual budget?",
      content: (
        <div className="flex flex-col gap-3">
          {BUDGET_OPTIONS.map(o => (
            <CardOption key={o.value} label={o.label} sub={o.sub}
              selected={budgetRange === o.value}
              onClick={() => setBudgetRange(o.value)} />
          ))}
        </div>
      ),
    },

    // Step 7 — Discovery style
    {
      title: "How do you like to explore?",
      content: (
        <div className="flex flex-col gap-3">
          {STYLE_OPTIONS.map(o => (
            <CardOption key={o.value} label={o.label} sub={o.sub}
              selected={tripStyle.includes(o.value)}
              onClick={() => toggle(tripStyle, o.value, setTripStyle)} />
          ))}
        </div>
      ),
    },

    // Step 8 — Who you go with
    {
      title: "Who do you usually go out with?",
      content: (
        <div className="flex flex-wrap gap-2">
          {COMPANION_OPTIONS.map(c => (
            <Chip key={c.value} label={c.label} selected={travelCompanion === c.value}
              onClick={() => setTravelCompanion(c.value)} />
          ))}
        </div>
      ),
    },

    // Step 9 — Atmosphere
    {
      title: "What kind of atmosphere fits you?",
      subtitle: "Pick the vibe that feels most like you.",
      content: (
        <div className="grid grid-cols-2 gap-3">
          {ATMOSPHERE_OPTIONS.map(o => (
            <button key={o.value} type="button"
              onClick={() => setAtmosphereMode(o.value)}
              className={`p-4 rounded-2xl border text-sm font-semibold text-left transition-all ${
                atmosphereMode === o.value
                  ? "border-[#CA922B] bg-[#CA922B]/8 text-[#2B1507]"
                  : "border-[#E8DDD0] bg-white text-[#2B1507] hover:border-[#CA922B]/40"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ),
    },

    // Step 10 — Ownership interests
    {
      title: "Any community ownership priorities?",
      subtitle: "Kinfolk can highlight businesses that match your values.",
      content: (
        <div className="flex flex-wrap gap-2">
          {OWNERSHIP_OPTIONS.map(o => (
            <Chip key={o} label={o} selected={ownershipPrefs.includes(o)}
              onClick={() => toggle(ownershipPrefs, o, setOwnershipPrefs)} />
          ))}
        </div>
      ),
    },

    // Step 11 — Community roles
    {
      title: "Are you part of the community in these ways?",
      subtitle: "This unlocks relevant tools — nothing is shared publicly without your choice.",
      content: (
        <div className="flex flex-col gap-3">
          {[
            { label: "I own or operate a business", sub: "Unlocks your business dashboard", val: "biz" },
            { label: "I organize community events or programs", sub: "Connects you with organizer tools", val: "org" },
          ].map(item => (
            <button key={item.val} type="button"
              onClick={() => {
                if (item.val === "biz") setIsBusinessOwner(b => !b);
                else setIsCommunityOrg(o => !o);
              }}
              className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                (item.val === "biz" ? isBusinessOwner : isCommunityOrg)
                  ? "border-[#CA922B] bg-[#CA922B]/8"
                  : "border-[#E8DDD0] bg-white hover:border-[#CA922B]/40"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                (item.val === "biz" ? isBusinessOwner : isCommunityOrg)
                  ? "border-[#CA922B] bg-[#CA922B]"
                  : "border-[#E8DDD0]"
              }`}>
                {(item.val === "biz" ? isBusinessOwner : isCommunityOrg) &&
                  <Check className="w-3 h-3 text-white" />}
              </div>
              <div>
                <p className="font-semibold text-[#2B1507] text-sm">{item.label}</p>
                <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{item.sub}</p>
              </div>
            </button>
          ))}
          <p className="text-xs text-[#3A1F0E]/40 pl-1">Neither applies? Just tap Next.</p>
        </div>
      ),
    },

    // Step 12 — Dietary (optional)
    {
      title: "Any dietary preferences?",
      subtitle: "Optional — helps Kinfolk suggest compatible dining.",
      content: (
        <div className="flex flex-col gap-3">
          <textarea
            value={dietaryNotes}
            onChange={e => setDietaryNotes(e.target.value)}
            placeholder="e.g. vegan, halal, gluten-free, no pork…"
            rows={3}
            className="w-full px-4 py-3 rounded-2xl border border-[#E8DDD0] bg-white text-[#2B1507] text-sm focus:outline-none focus:border-[#CA922B] resize-none placeholder:text-[#3A1F0E]/30"
          />
          <p className="text-xs text-[#3A1F0E]/40 pl-1">This stays private — Kinfolk uses it only when suggesting food</p>
        </div>
      ),
    },

    // Step 13 — Lifestyle services
    {
      title: "Any community services important to you?",
      subtitle: "Optional — Kinfolk surfaces relevant providers.",
      content: (
        <div className="flex flex-wrap gap-2">
          {LIFESTYLE_OPTIONS.map(l => (
            <Chip key={l} label={l} selected={lifestyleServices.includes(l)}
              onClick={() => toggle(lifestyleServices, l, setLifestyleServices)} />
          ))}
        </div>
      ),
    },

    // Step 14 — Personalization level
    {
      title: "How much should Kinfolk personalize?",
      subtitle: "You can always adjust this in your profile.",
      content: (
        <div className="flex flex-col gap-3">
          {PERSONALIZATION_OPTIONS.map(o => (
            <CardOption key={o.value} label={o.label}
              selected={personalizationLevel === o.value}
              onClick={() => setPersonalizationLevel(o.value)} />
          ))}
        </div>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#2B1507]/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#FAF6EF] rounded-3xl shadow-2xl flex flex-col max-h-[90dvh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          {/* Progress */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-1.5 bg-[#E8DDD0] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#CA922B] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#3A1F0E]/40 shrink-0">{step + 1} / {TOTAL_STEPS}</span>
            <button onClick={skipAll} disabled={saving}
              className="text-xs text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 font-medium transition-colors shrink-0 ml-1">
              Skip all
            </button>
          </div>

          <h2 className="font-serif font-bold text-xl text-[#2B1507] leading-snug">{currentStep.title}</h2>
          {currentStep.subtitle && (
            <p className="text-sm text-[#3A1F0E]/55 mt-1 leading-relaxed">{currentStep.subtitle}</p>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 pb-2">
          {currentStep.content}
        </div>

        {saveError && (
          <div role="alert" className="mx-6 mb-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {saveError}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-5 shrink-0 border-t border-[#E8DDD0]/60 flex items-center gap-3">
          {step > 0 && (
            <button onClick={back} disabled={saving}
              className="flex items-center gap-1 px-4 py-3 rounded-full border border-[#E8DDD0] text-[#2B1507] text-sm font-semibold hover:border-[#CA922B]/60 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <div className="flex-1" />
          {!isLast && (
            <button onClick={() => setStep(s => s + 1)} disabled={saving}
              className="text-sm text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 font-medium transition-colors">
              Skip
            </button>
          )}
          <button onClick={next} disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-[#CA922B] text-white rounded-full font-bold text-sm hover:bg-[#B38024] transition-colors disabled:opacity-50">
            {saving ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </span>
            ) : isLast ? (
              <><Check className="w-4 h-4" /> Let's go</>
            ) : (
              <>Next <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
