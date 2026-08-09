import { useEffect, useRef, useState, useCallback, Component, type ReactNode } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import {
  Sparkles, Send, Plus, MapPin, ChevronRight, ThumbsUp, ThumbsDown,
  Clock, Compass, ShieldCheck, Lightbulb, Loader2, Lock, MessageSquare,
  Settings, X, Copy, Check, History, Menu, Share2, ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";

const BASE = import.meta.env.BASE_URL;

// ─── Types ────────────────────────────────────────────────────────────────────
interface Business { name: string; category: string; description: string; neighborhood: string; mustTry: string }
interface Neighborhood { name: string; vibe: string; highlights: string[]; safetyNote: string }
interface Event { name: string; type: string; description: string; timing: string }
interface Recommendations {
  destination: string; summary: string;
  businesses: Business[]; neighborhoods: Neighborhood[];
  events: Event[]; safetyTips: string[]; localInsights: string[];
}
interface Message {
  id: string; role: "user" | "assistant";
  content: string; recommendations?: Recommendations | null;
  followUpSuggestions?: string[]; timestamp: string;
}
interface Session { id: string; title: string; destination?: string; createdAt: string }
interface Prefs {
  favoriteCategories: string[]; favoriteCities: string[];
  avoidCategories: string[]; budgetRange: string;
  tripStyle: string[]; travelCompanion: string; dietaryNotes: string | null;
  // Kinfolk personalization — what I care about, used to promote the right businesses
  ownershipTypes: string[]; lifestyleServices: string[];
}

const DEFAULT_PREFS: Prefs = {
  favoriteCategories: [], favoriteCities: [], avoidCategories: [],
  budgetRange: "any", tripStyle: [], travelCompanion: "solo", dietaryNotes: null,
  ownershipTypes: [], lifestyleServices: [],
};

const ALL_CATEGORIES = ["Food & Drink","Nightlife","Culture & Art","Music & Live Events","Beauty & Wellness","History","Outdoors","Family-Friendly","Shopping","Coffee","Spiritual","Sports"];
const AVOID_OPTS = ["Nightlife","Bars & Clubs","Loud venues","Crowded spaces","Tourist spots","Chains","Expensive dining"];
const BUDGET_OPTS = [{ id: "budget", label: "Budget 💵" }, { id: "mid", label: "Mid-range 💳" }, { id: "luxury", label: "Luxury ✨" }, { id: "any", label: "No limit" }];
const TRIP_STYLES = [{ id: "solo", label: "Solo" }, { id: "couple", label: "Couple" }, { id: "family", label: "Family" }, { id: "group", label: "Friend group" }, { id: "business", label: "Work trip" }, { id: "spiritual", label: "Spiritual" }];
const COMPANIONS = [{ id: "solo", label: "Solo" }, { id: "partner", label: "Partner" }, { id: "family", label: "Family" }, { id: "friends", label: "Friends" }, { id: "colleagues", label: "Colleagues" }];

// ─── Kinfolk Identity Defaults ─────────────────────────────────────────────────
// PERMANENT — Do not remove or edit without explicit founder authorization.
// These are stored here so they are never lost between sessions or deploys.

/** The standard Kinfolk greeting for a first-time or new-session user. */
export const KINFOLK_DEFAULT_GREETING =
  "Hey! I'm Kinfolk — your community companion. I can help you find trusted businesses, " +
  "keep you safe in unfamiliar places, connect you with your community, or just talk. " +
  "What's on your mind?";

/** Body-only version (heading "Hey! I'm Kinfolk." is shown separately). */
const KINFOLK_DEFAULT_GREETING_BODY =
  "I can help you find trusted businesses, keep you safe in unfamiliar places, " +
  "connect you with your community, or just talk. What's on your mind?";

/** Greeting for a returning user with no specific context. */
export const kinfolkReturningGreeting = (firstName: string | null | undefined) =>
  firstName ? `Welcome back, ${firstName}! What can I help with today?` : "Welcome back! What can I help with today?";

/** Greeting for a returning user whose last session topic is known. */
export const kinfolkReturningWithContext = (firstName: string | null | undefined, topic: string) =>
  firstName
    ? `Hey ${firstName}! Last time we talked about "${topic}." Want to pick up where we left off, or is there something new on your mind?`
    : `Hey! Last time we talked about "${topic}." Want to pick up where we left off, or something new?`;

/**
 * Primary life-category chips — emoji + label + tap-to-send prompt.
 * Mirrors the mobile LIFE_CHIPS. Not travel-only.
 * PERMANENT — do not remove without founder authorization.
 */
const KINFOLK_LIFE_CHIPS: { emoji: string; label: string; prompt: string }[] = [
  { emoji: "🏠", label: "I'm Moving",       prompt: "I'm thinking about relocating" },
  { emoji: "✈️",  label: "I'm Traveling",   prompt: "I'm planning a trip" },
  { emoji: "💼", label: "My Career",         prompt: "I need help with my career" },
  { emoji: "🛍", label: "Find Businesses",  prompt: "Help me find minority-owned businesses near me" },
  { emoji: "🤝", label: "Community",         prompt: "I want to connect with my community" },
  { emoji: "🛡", label: "Stay Safe",         prompt: "I want to check safety info for my area" },
  { emoji: "❤️", label: "Healthcare",        prompt: "I need healthcare recommendations" },
  { emoji: "🎓", label: "Schools",           prompt: "I need help finding good schools" },
];

/**
 * Secondary example-prompt chips shown under "Or try asking:".
 * Mirrors the mobile WELCOME_CHIPS. PERMANENT.
 */
const KINFOLK_EXAMPLE_CHIPS = [
  "Where's good to eat in Atlanta?",
  "Best minority-owned hotels in Houston",
  "What's the vibe in New Orleans?",
  "Hidden gems in DC",
  "Family spots in Chicago",
  "Would my community like this city?",
];

/**
 * Rotating welcome headlines for the empty state — one is picked randomly per mount.
 * Mirrors the mobile WELCOME_HEADLINES. PERMANENT.
 */
const KINFOLK_WELCOME_HEADLINES = [
  "What are you navigating today?",
  "Looking for your next favorite place?",
  "Planning a move?",
  "Need a trusted recommendation?",
  "Looking for community?",
  "Tell me where you're headed.",
  "Need help deciding?",
  "Looking for hidden gems?",
  "Let's map it out.",
  "Ready for your next chapter?",
  "What's on your mind?",
  "How can I help today?",
];

// ─── Chip toggle helper ───────────────────────────────────────────────────────
// selected defaults to [] so a null/undefined value from the API never crashes.
function ChipSet({ options, selected = [], onChange, label }: { options: string[]; selected: string[]; onChange: (v: string[]) => void; label?: string }) {
  const safeSelected = Array.isArray(selected) ? selected : [];
  const toggle = (v: string) => onChange(safeSelected.includes(v) ? safeSelected.filter(x => x !== v) : [...safeSelected, v]);
  return (
    <div>
      {label && <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">{label}</div>}
      <div className="flex flex-wrap gap-1.5">
        {options.map(o => (
          <button key={o} onClick={() => toggle(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${safeSelected.includes(o) ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/10 hover:border-[#CA922B]/30 hover:text-[#CA922B]"}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Preferences panel ────────────────────────────────────────────────────────
function PreferencesPanel({ open, onClose, prefs, onSave }: { open: boolean; onClose: () => void; prefs: Prefs; onSave: (p: Prefs) => Promise<void> }) {
  const [local, setLocal] = useState<Prefs>(prefs);
  const [cityInput, setCityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { setLocal(prefs); }, [prefs]);

  const addCity = () => {
    const city = cityInput.trim();
    if (city && !local.favoriteCities.includes(city)) setLocal(p => ({ ...p, favoriteCities: [...p.favoriteCities, city] }));
    setCityInput("");
  };

  const save = async () => {
    setSaving(true);
    await onSave(local);
    setSaving(false); setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3A1F0E]/8 shrink-0">
          <div>
            <div className="font-bold text-[#3A1F0E] text-base">Your Taste Profile</div>
            <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider mt-0.5">KinfolkAI uses this to personalize every recommendation</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#FAF6EF] text-[#3A1F0E]/40 hover:text-[#3A1F0E]"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          <ChipSet label="Favorite experiences" options={ALL_CATEGORIES} selected={local.favoriteCategories} onChange={v => setLocal(p => ({ ...p, favoriteCategories: v }))} />
          <ChipSet label="Skip these" options={AVOID_OPTS} selected={local.avoidCategories} onChange={v => setLocal(p => ({ ...p, avoidCategories: v }))} />

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Budget vibe</div>
            <div className="grid grid-cols-2 gap-2">
              {BUDGET_OPTS.map(o => (
                <button key={o.id} onClick={() => setLocal(p => ({ ...p, budgetRange: o.id }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-colors ${local.budgetRange === o.id ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">How you travel</div>
            <div className="flex flex-wrap gap-1.5">
              {TRIP_STYLES.map(o => (
                <button key={o.id} onClick={() => setLocal(p => ({ ...p, tripStyle: p.tripStyle.includes(o.id) ? p.tripStyle.filter(x => x !== o.id) : [...p.tripStyle, o.id] }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${local.tripStyle.includes(o.id) ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Who you travel with</div>
            <div className="flex flex-wrap gap-1.5">
              {COMPANIONS.map(o => (
                <button key={o.id} onClick={() => setLocal(p => ({ ...p, travelCompanion: o.id }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${local.travelCompanion === o.id ? "bg-[#CA922B] text-white" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Cities you love</div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {local.favoriteCities.map(c => (
                <span key={c} className="flex items-center gap-1 bg-[#2B1507] text-[#F5EBD8] px-3 py-1 rounded-full text-xs font-medium">
                  {c}
                  <button onClick={() => setLocal(p => ({ ...p, favoriteCities: p.favoriteCities.filter(x => x !== c) }))} className="hover:text-[#CA922B] ml-0.5"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={cityInput} onChange={e => setCityInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addCity()}
                placeholder="Add a city…"
                className="flex-1 h-9 px-3 text-xs bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-xl text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/40" />
              <button onClick={addCity} className="px-3 h-9 bg-[#CA922B] text-white rounded-xl text-xs font-bold hover:bg-[#B38024] transition-colors">Add</button>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Dietary notes (optional)</div>
            <input value={local.dietaryNotes ?? ""} onChange={e => setLocal(p => ({ ...p, dietaryNotes: e.target.value || null }))}
              placeholder="e.g. vegan, halal, gluten-free…"
              className="w-full h-10 px-3 text-xs bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-xl text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/40" />
          </div>

          {/* ── Community identity — what KinfolkAI uses to promote the right businesses ── */}
          <div className="pt-2 border-t border-[#3A1F0E]/8">
            <div className="text-[11px] font-bold text-[#3A1F0E] mb-0.5">Who I Love to Support</div>
            <div className="text-[10px] text-[#3A1F0E]/40 mb-3">KinfolkAI uses this to prioritize businesses that match your values — not just your location.</div>
            <ChipSet
              label="Businesses I prioritize"
              options={[
                "Black-owned", "Women-owned", "Veteran-owned",
                "Immigrant-owned", "LGBTQ+-owned", "Indigenous-owned",
                "Latino-owned", "Disability-owned", "Family-owned",
              ]}
              selected={local.ownershipTypes}
              onChange={v => setLocal(p => ({ ...p, ownershipTypes: v }))}
            />
          </div>

          <ChipSet
            label="Lifestyle services I use regularly"
            options={[
              "Hair salon", "Barbershop", "Nail salon", "Spa & massage",
              "Personal trainer", "Yoga & fitness", "Therapy & counseling",
              "Tax prep", "Legal services", "Financial advisor",
              "Tutoring", "Childcare", "Home cleaning", "Auto repair",
            ]}
            selected={local.lifestyleServices}
            onChange={v => setLocal(p => ({ ...p, lifestyleServices: v }))}
          />
        </div>

        <div className="px-5 py-4 border-t border-[#3A1F0E]/8 shrink-0">
          <button onClick={save} disabled={saving}
            className="w-full h-11 rounded-full bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Sparkles size={15} />}
            {saved ? "Saved!" : saving ? "Saving…" : "Save Taste Profile"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Business card ────────────────────────────────────────────────────────────
function BusinessCard({ biz, onFeedback, feedback }: { biz: Business; onFeedback: (n: string, c: string, r: "like" | "dislike") => void; feedback: Record<string, "like" | "dislike"> }) {
  const reaction = feedback[biz.name];
  return (
    <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 p-4">
        <div className="w-1 self-stretch bg-[#CA922B] rounded-full shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="font-bold text-[#3A1F0E] text-sm leading-tight">{biz.name}</span>
            <span className="bg-[#2B1507] text-[#F5EBD8] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">{biz.category}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider font-bold mb-2"><MapPin size={9} />{biz.neighborhood}</div>
          <p className="text-xs text-[#3A1F0E]/70 leading-relaxed mb-3">{biz.description}</p>
          <div className="bg-[#FAF6EF] rounded-xl p-2.5 text-xs text-[#3A1F0E]/80 flex items-start gap-1.5 mb-3">
            <Sparkles size={12} className="text-[#CA922B] shrink-0 mt-0.5" />
            <span><strong>Try:</strong> {biz.mustTry}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onFeedback(biz.name, biz.category, "like")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${reaction === "like" ? "bg-green-100 text-green-700 border border-green-200" : "bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-green-600 hover:bg-green-50"}`}>
              <ThumbsUp size={11} /> Love it
            </button>
            <button onClick={() => onFeedback(biz.name, biz.category, "dislike")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${reaction === "dislike" ? "bg-red-100 text-red-700 border border-red-200" : "bg-[#FAF6EF] text-[#3A1F0E]/50 hover:text-red-600 hover:bg-red-50"}`}>
              <ThumbsDown size={11} /> Pass
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Recommendation cards ─────────────────────────────────────────────────────
function RecommendationCards({ recs, onFeedback, feedback, onCopy, onShare }: { recs: Recommendations; onFeedback: (n: string, c: string, r: "like" | "dislike") => void; feedback: Record<string, "like" | "dislike">; onCopy: (recs: Recommendations) => void; onShare?: () => void }) {
  return (
    <div className="mt-3 space-y-4">
      <div className="bg-[#2B1507] rounded-2xl p-4 text-white">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-[#CA922B] mb-1">Your Guide to</div>
            <div className="text-xl font-serif font-bold text-white mb-2">{recs.destination}</div>
            <p className="text-[#F5EBD8]/80 text-sm leading-relaxed">{recs.summary}</p>
          </div>
          <div className="flex flex-col gap-1.5 shrink-0 mt-1">
            {onShare && (
              <button onClick={onShare} title="Share trip"
                className="p-2 rounded-lg bg-[#CA922B]/20 hover:bg-[#CA922B]/30 text-[#CA922B] transition-colors">
                <Share2 size={13} />
              </button>
            )}
            <button onClick={() => onCopy(recs)} title="Copy trip summary"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-[#F5EBD8]/70 hover:text-white transition-colors">
              <Copy size={13} />
            </button>
          </div>
        </div>
      </div>

      {recs.businesses?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2"><MapPin size={14} className="text-[#CA922B]" /><span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Must-Visit Spots</span></div>
          <div className="grid gap-2">{recs.businesses.map((b, i) => <BusinessCard key={i} biz={b} onFeedback={onFeedback} feedback={feedback} />)}</div>
        </div>
      )}

      {recs.neighborhoods?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2"><Compass size={14} className="text-[#CA922B]" /><span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Neighborhoods</span></div>
          <div className="grid gap-2">
            {recs.neighborhoods.map((n, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-[#3A1F0E] text-sm">{n.name}</span>
                  <span className="bg-[#FAF6EF] text-[#CA922B] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-[#CA922B]/20">{n.vibe}</span>
                </div>
                <p className="text-xs text-[#3A1F0E]/60 mb-2"><strong className="text-[#3A1F0E]/40 uppercase text-[9px] tracking-wider">Highlights:</strong> {n.highlights.join(", ")}</p>
                <div className="bg-[#FAF6EF] rounded-xl p-2.5 text-xs text-[#3A1F0E]/70 italic border-l-2 border-[#CA922B]">"{n.safetyNote}"</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recs.events?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2"><Clock size={14} className="text-[#CA922B]" /><span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Events & Happenings</span></div>
          <div className="grid gap-2">
            {recs.events.map((e, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-1">
                  <span className="font-bold text-[#3A1F0E] text-sm">{e.name}</span>
                  <span className="text-[10px] text-[#CA922B] font-bold">{e.timing}</span>
                </div>
                <div className="text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider font-bold mb-1">{e.type}</div>
                <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(recs.safetyTips?.length > 0 || recs.localInsights?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-3">
          {recs.safetyTips?.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><ShieldCheck size={14} className="text-[#CA922B]" /><span className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/60">Safety Tips</span></div>
              <ul className="space-y-2">{recs.safetyTips.map((t, i) => <li key={i} className="flex items-start gap-2 text-xs text-[#3A1F0E]/70 leading-relaxed"><div className="w-1 h-1 rounded-full bg-[#CA922B] mt-1.5 shrink-0" />{t}</li>)}</ul>
            </div>
          )}
          {recs.localInsights?.length > 0 && (
            <div className="bg-[#2B1507] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Lightbulb size={14} className="text-[#CA922B]" /><span className="text-xs font-bold uppercase tracking-wider text-[#F5EBD8]/60">Local Insights</span></div>
              <ul className="space-y-2">{recs.localInsights.map((t, i) => <li key={i} className="flex items-start gap-2 text-xs text-[#F5EBD8]/70 leading-relaxed"><div className="w-1 h-1 rounded-full bg-[#CA922B] mt-1.5 shrink-0" />{t}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KinfolkAI local error boundary ──────────────────────────────────────────
// Isolates any KinfolkAI crash from the global app-wide ErrorBoundary.
// A preferences crash, API contract mismatch, or render error shows a soft
// Kinfolk-specific message and a reload button — the rest of the site stays up.
class KinfolkErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch(error: Error) { console.error("[KinfolkAI] crashed:", error); }
  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF6EF] flex items-center justify-center mb-4">
            <span className="text-2xl">🤝</span>
          </div>
          <h2 className="font-bold text-[#3A1F0E] text-lg mb-2">Kinfolk needs a moment</h2>
          <p className="text-sm text-[#3A1F0E]/60 mb-6 max-w-xs leading-relaxed">
            Something went sideways loading your Kinfolk experience. The rest of the site is fine.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2.5 rounded-full bg-[#CA922B] text-white text-sm font-semibold hover:bg-[#B38024] transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────
function TravelPage() {
  const { data: authData, isLoading: authLoading } = useGetCurrentAuthUser();
  const isLoggedIn = !authLoading && !!authData?.user;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike">>({});
  const [showPrefs, setShowPrefs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  // Pick one welcome headline per mount — stays stable for the session
  const [kinfolkWelcomeHeadline] = useState(() =>
    KINFOLK_WELCOME_HEADLINES[Math.floor(Math.random() * KINFOLK_WELCOME_HEADLINES.length)]
  );

  const msgContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load preferences — always merge with DEFAULT_PREFS so every array field is
  // guaranteed to be an array even if the DB row predates a field addition.
  const loadPrefs = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const r = await fetch(`${BASE}api/kinfolk/preferences`, { credentials: "include" });
      if (r.ok) {
        const d = await r.json() as { preferences: Record<string, unknown> };
        const raw = d.preferences ?? {};
        const ensureArr = (v: unknown): string[] => Array.isArray(v) ? v as string[] : [];
        setPrefs({
          ...DEFAULT_PREFS,
          ...raw,
          // Guarantee every array field is always an array
          favoriteCategories: ensureArr(raw.favoriteCategories),
          favoriteCities:     ensureArr(raw.favoriteCities),
          avoidCategories:    ensureArr(raw.avoidCategories),
          tripStyle:          ensureArr(raw.tripStyle),
          ownershipTypes:     ensureArr(raw.ownershipTypes),
          lifestyleServices:  ensureArr(raw.lifestyleServices),
        });
      }
    } finally { setPrefsLoaded(true); }
  }, [isLoggedIn]);

  const savePrefs = useCallback(async (p: Prefs) => {
    setPrefs(p);
    await fetch(`${BASE}api/kinfolk/preferences`, {
      method: "PUT", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
  }, []);

  // Load session list
  const loadSessions = useCallback(async () => {
    if (!isLoggedIn) return;
    setSessionsLoading(true);
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions`, { credentials: "include" });
      if (r.ok) { const d = await r.json() as { sessions: Session[] }; setSessions(d.sessions); }
    } finally { setSessionsLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { loadSessions(); loadPrefs(); }, [loadSessions, loadPrefs]);

  // Scroll the message container — not the window — when messages or sending
  // state change. Using scrollTop directly on the container ref prevents
  // scrollIntoView from escalating past the container to the browser window,
  // which was exposing the global site footer on every message send.
  useEffect(() => {
    const el = msgContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    // 30-second client-side timeout — Kinfolk must never spin forever.
    // The server has its own 25s AbortSignal on the OpenAI call, but if the
    // request hangs before reaching that point (e.g. pool wait), the browser
    // fetch has no built-in deadline. This abort controller guarantees the UI
    // always resolves and shows a recoverable error message.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("timeout"), 30000);

    try {
      const r = await fetch(`${BASE}api/kinfolk/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ sessionId, message: trimmed, neighborVoice: true }),
        signal: controller.signal,
      });

      // Always check r.ok — a 4xx/5xx response contains { error: "..." } not
      // { reply: "..." }. Without this check, data.reply is undefined and the
      // assistant message renders blank/invisible.
      if (!r.ok) {
        let errMsg = "Kinfolk is having trouble answering that right now. Try again.";
        try {
          const errData = await r.json() as { error?: string };
          if (r.status === 429 && errData.error) errMsg = errData.error;
          else if (r.status === 504) errMsg = "Kinfolk took a little too long on that one. Try again in a moment.";
        } catch { /* ignore parse error */ }
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: errMsg, timestamp: new Date().toISOString() }]);
        return;
      }

      const data = await r.json() as { sessionId?: string; reply: string; recommendations?: Recommendations | null; followUpSuggestions?: string[] };

      // Guard: if reply is somehow missing, show a recoverable message rather than blank
      const replyContent = data.reply?.trim() ? data.reply : "Kinfolk is having trouble answering that right now. Try again.";

      if (data.sessionId && data.sessionId !== sessionId) { setSessionId(data.sessionId); loadSessions(); }
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: replyContent, recommendations: data.recommendations ?? null,
        followUpSuggestions: data.followUpSuggestions ?? [], timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "AbortError";
      const msg = isTimeout
        ? "Kinfolk is taking longer than expected. Try again in a moment."
        : "Something went sideways on my end — try again in a sec.";
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: msg, timestamp: new Date().toISOString() }]);
    } finally {
      clearTimeout(timeoutId);
      setSending(false);
    }
  }, [sending, sessionId, loadSessions]);

  const loadSession = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions/${id}`, { credentials: "include" });
      if (!r.ok) return;
      const d = await r.json() as { session: { id: string; messages: Message[] } };
      setSessionId(d.session.id); setMessages(d.session.messages ?? []);
      setShowHistory(false);
    } catch { /* ignore */ }
  }, []);

  const newChat = () => { setSessionId(undefined); setMessages([]); setInput(""); setShowHistory(false); };

  const handleFeedback = async (name: string, cat: string, reaction: "like" | "dislike") => {
    setFeedback(prev => ({ ...prev, [name]: reaction }));
    if (!isLoggedIn) return;
    await fetch(`${BASE}api/kinfolk/feedback`, {
      method: "POST", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, businessName: name, category: cat, reaction }),
    });
  };

  const shareTrip = async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions/${sessionId}/share`, {
        method: "POST", credentials: "include",
      });
      if (r.ok) {
        const { shareId } = await r.json() as { shareId: string; shareUrl: string };
        const url = `${window.location.origin}${BASE}shared/trip/${shareId}`;
        setShareLink(url);
      }
    } catch { /* ignore */ }
  };

  const copyTrip = (recs: Recommendations) => {
    const lines = [
      `🗺️ KinfolkAI Guide: ${recs.destination}`,
      `\n${recs.summary}`,
      recs.businesses.length ? `\n📍 Must-Visit Spots:\n${recs.businesses.map(b => `• ${b.name} (${b.category}) — ${b.neighborhood}`).join("\n")}` : "",
      recs.neighborhoods.length ? `\n🏘️ Neighborhoods:\n${recs.neighborhoods.map(n => `• ${n.name} — ${n.vibe}`).join("\n")}` : "",
      recs.safetyTips.length ? `\n🛡️ Safety Tips:\n${recs.safetyTips.map(t => `• ${t}`).join("\n")}` : "",
      `\nPowered by KinfolkAI™ at mappingwithmelanin.com`,
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines).then(() => { setCopyToast("Copied to clipboard!"); setTimeout(() => setCopyToast(null), 2500); });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const hasPrefs = prefs.favoriteCategories.length > 0 || prefs.favoriteCities.length > 0;
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-screen bg-[#FAF6EF] overflow-hidden">
      {/* Copy toast */}
      {copyToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#2B1507] text-[#F5EBD8] px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-lg">
          <Check size={14} className="text-[#CA922B]" />{copyToast}
        </div>
      )}

      {/* Share modal */}
      {shareLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShareLink(null)}>
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#CA922B]/10 flex items-center justify-center">
                  <Share2 size={13} className="text-[#CA922B]" />
                </div>
                <span className="font-serif font-bold text-[#2B1507] text-base">Share This Trip</span>
              </div>
              <button onClick={() => setShareLink(null)} className="p-1.5 rounded-lg hover:bg-[#FAF6EF] text-[#3A1F0E]/40">
                <X size={15} />
              </button>
            </div>
            <p className="text-xs text-[#3A1F0E]/50 mb-3">Anyone with this link can view your KinfolkAI trip guide.</p>
            <div className="flex items-center gap-2 bg-[#FAF6EF] rounded-xl px-3 py-2.5 border border-[#3A1F0E]/8 mb-4">
              <span className="text-xs text-[#3A1F0E]/60 truncate flex-1 font-mono">{shareLink}</span>
              <button
                onClick={() => { navigator.clipboard.writeText(shareLink); setCopyToast("Link copied!"); setTimeout(() => setCopyToast(null), 2000); }}
                className="shrink-0 px-3 py-1.5 bg-[#2B1507] text-white text-xs font-bold rounded-lg hover:bg-[#3A1F0E] transition-colors">
                Copy
              </button>
            </div>
            <a href={shareLink} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#CA922B]/30 text-[#CA922B] text-sm font-medium hover:bg-[#CA922B]/5 transition-colors">
              Preview trip page <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}

      {/* Preferences panel */}
      {isLoggedIn && <PreferencesPanel open={showPrefs} onClose={() => setShowPrefs(false)} prefs={prefs} onSave={savePrefs} />}

      {/* Header */}
      <div className="bg-[#2B1507] px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#CA922B]/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#CA922B]" />
          </div>
          <div>
            <div className="text-white font-serif font-bold text-base leading-tight">KinfolkAI™</div>
            <div className="text-[#F5EBD8]/50 text-[10px] uppercase tracking-widest">Your Community Companion</div>
          </div>
        </div>
        {isLoggedIn && (
          <div className="flex items-center gap-2">
            {/* Mobile history toggle */}
            <button onClick={() => setShowHistory(v => !v)}
              className="md:hidden flex items-center gap-1.5 text-xs font-bold text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#CA922B]/30">
              <History size={13} />
            </button>
            <button onClick={() => setShowPrefs(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#CA922B]/30">
              <Settings size={13} />
              <span className="hidden sm:inline">Preferences</span>
            </button>
            <button onClick={newChat}
              className="flex items-center gap-1.5 text-xs font-bold text-[#F5EBD8]/70 hover:text-[#CA922B] transition-colors px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#CA922B]/30">
              <Plus size={13} /><span className="hidden sm:inline">New Chat</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile history drawer overlay */}
        {showHistory && (
          <div className="fixed inset-0 z-30 md:hidden bg-black/40" onClick={() => setShowHistory(false)} />
        )}

        {/* Sidebar — session history */}
        <div className={`
          ${showHistory ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:flex
          fixed md:relative top-0 left-0 h-full z-30
          flex flex-col w-64 bg-white border-r border-[#3A1F0E]/8 overflow-y-auto shrink-0
          transition-transform duration-300 shadow-xl md:shadow-none
        `}>
          <div className="px-3 py-3 border-b border-[#3A1F0E]/8 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40">Past Conversations</span>
            <button onClick={newChat} className="flex items-center gap-1 text-[10px] text-[#CA922B] hover:text-[#B38024] font-bold">
              <Plus size={10} /> New
            </button>
          </div>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 size={16} className="text-[#CA922B] animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#3A1F0E]/30">Nothing yet — start a conversation!</div>
          ) : (
            <div className="py-1">
              {sessions.map(s => (
                <button key={s.id} onClick={() => loadSession(s.id)}
                  className={`w-full text-left px-3 py-2.5 hover:bg-[#FAF6EF] transition-colors border-b border-[#3A1F0E]/4 ${sessionId === s.id ? "bg-[#FAF6EF] border-l-2 border-l-[#CA922B]" : ""}`}>
                  <div className="text-xs font-semibold text-[#3A1F0E] truncate leading-tight">{s.title}</div>
                  {s.destination && <div className="text-[10px] text-[#CA922B] font-medium mt-0.5">{s.destination}</div>}
                  <div className="text-[10px] text-[#3A1F0E]/30 mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Not logged in */}
          {!authLoading && !isLoggedIn && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-3xl border border-[#3A1F0E]/8 shadow-sm max-w-md w-full text-center p-10">
                <div className="w-14 h-14 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mx-auto mb-5">
                  <Lock className="w-6 h-6 text-[#CA922B]" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-3">Sign in to chat with KinfolkAI™</h2>
                <p className="text-[#3A1F0E]/60 mb-8 text-sm leading-relaxed">
                  Your community companion — finding trusted businesses, keeping you safe, connecting you with your community, and so much more. Personalized just for you.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href={`${BASE}login`}><button className="bg-[#CA922B] hover:bg-[#B38024] text-white px-8 py-2.5 rounded-full font-semibold text-sm transition-colors">Sign In to Continue</button></Link>
                  <Link href={`${BASE}`}><button className="border border-[#2B1507]/20 text-[#3A1F0E] hover:border-[#CA922B] hover:text-[#CA922B] px-8 py-2.5 rounded-full text-sm transition-colors">Explore First</button></Link>
                </div>
              </div>
            </div>
          )}

          {/* Chat */}
          {isLoggedIn && (
            <>
              <div ref={msgContainerRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
                {isEmpty && (
                  <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                    <div className="w-16 h-16 rounded-2xl bg-[#CA922B]/10 flex items-center justify-center mb-5">
                      <Sparkles className="w-7 h-7 text-[#CA922B]" />
                    </div>
                    {/* Contextual greeting — new user vs returning user vs returning with context */}
                    <h2 className="text-2xl font-serif font-bold text-[#3A1F0E] mb-2">
                      {sessions.length > 0 && (authData?.user as { firstName?: string })?.firstName
                        ? `Welcome back, ${(authData.user as { firstName?: string }).firstName}!`
                        : sessions.length > 0
                        ? "Welcome back!"
                        : kinfolkWelcomeHeadline}
                    </h2>
                    <p className="text-[#3A1F0E]/50 text-sm mb-4 max-w-md leading-relaxed">
                      {sessions.length > 0 && sessions[0]?.title
                        ? `Last time we talked about "${sessions[0].title}." Want to pick up where we left off, or is there something new on your mind?`
                        : sessions.length > 0
                        ? "What can I help with today?"
                        : KINFOLK_DEFAULT_GREETING_BODY}
                    </p>
                    {prefsLoaded && !hasPrefs && (
                      <button onClick={() => setShowPrefs(true)} className="mb-4 flex items-center gap-1.5 text-xs text-[#CA922B] font-semibold hover:underline">
                        <Settings size={12} /> Set your taste profile to get personalized picks →
                      </button>
                    )}
                    {prefsLoaded && hasPrefs && (
                      <p className="mb-4 text-xs text-[#CA922B] font-medium">✓ Personalized based on your taste profile</p>
                    )}
                    {/* Life-category chips — primary CTAs, mirrors mobile LIFE_CHIPS */}
                    <div className="grid grid-cols-4 gap-2 max-w-lg mb-5 w-full">
                      {KINFOLK_LIFE_CHIPS.map(chip => (
                        <button key={chip.label} onClick={() => send(chip.prompt)}
                          className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white border border-[#3A1F0E]/10 rounded-2xl text-center hover:border-[#CA922B]/40 hover:bg-[#CA922B]/5 transition-colors shadow-sm">
                          <span className="text-xl leading-none">{chip.emoji}</span>
                          <span className="text-[10px] font-semibold text-[#3A1F0E]/60 leading-tight">{chip.label}</span>
                        </button>
                      ))}
                    </div>
                    {/* Example prompts — secondary, mirrors mobile WELCOME_CHIPS */}
                    <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/30 mb-2 self-start ml-1">Or try asking:</div>
                    <div className="flex flex-wrap gap-2 justify-start max-w-lg">
                      {KINFOLK_EXAMPLE_CHIPS.map(chip => (
                        <button key={chip} onClick={() => send(chip)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-[#3A1F0E]/10 rounded-full text-xs text-[#3A1F0E]/60 hover:border-[#CA922B]/40 hover:text-[#CA922B] transition-colors shadow-sm">
                          <ChevronRight size={10} className="text-[#CA922B] shrink-0" />{chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-[#2B1507] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                        <Sparkles size={13} className="text-[#CA922B]" />
                      </div>
                    )}
                    <div className={msg.role === "user" ? "max-w-[70%]" : "max-w-[85%]"}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#2B1507] text-[#F5EBD8] rounded-br-sm"
                          : "bg-white border border-[#3A1F0E]/8 text-[#3A1F0E] rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.content}
                      </div>
                      {msg.recommendations && (
                        <RecommendationCards recs={msg.recommendations} onFeedback={handleFeedback} feedback={feedback} onCopy={copyTrip} onShare={isLoggedIn && sessionId ? shareTrip : undefined} />
                      )}
                      {msg.followUpSuggestions && msg.followUpSuggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {msg.followUpSuggestions.map((s, i) => (
                            <button key={i} onClick={() => send(s)}
                              className="flex items-center gap-1 px-3 py-1.5 bg-white border border-[#3A1F0E]/10 rounded-full text-xs text-[#3A1F0E]/60 hover:border-[#CA922B]/40 hover:text-[#CA922B] transition-colors shadow-sm">
                              <MessageSquare size={10} className="text-[#CA922B]" />{s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[#2B1507] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                      <Sparkles size={13} className="text-[#CA922B]" />
                    </div>
                    <div className="bg-white border border-[#3A1F0E]/8 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#CA922B] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
                      </div>
                      <span className="text-xs text-[#3A1F0E]/40 italic ml-1">KinfolkAI is thinking…</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="border-t border-[#3A1F0E]/8 bg-white px-4 py-3 shrink-0">
                <div className="flex items-end gap-3 max-w-3xl mx-auto">
                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Kinfolk anything — businesses, safety, community, recommendations…"
                    rows={1}
                    className="flex-1 resize-none bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/50 transition-colors"
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                    onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                  />
                  <button onClick={() => send(input)} disabled={!input.trim() || sending}
                    className="w-11 h-11 rounded-2xl bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
                    <Send size={16} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#3A1F0E]/25 mt-2">Enter to send · Shift+Enter for new line</p>
                <DisclaimerBanner type="ai" className="mt-2 mx-auto max-w-3xl" />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Travel() {
  return (
    <KinfolkErrorBoundary>
      <TravelPage />
    </KinfolkErrorBoundary>
  );
}
