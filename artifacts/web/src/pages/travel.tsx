import React, { useEffect, useRef, useState, useCallback, Component, type ReactNode } from "react";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import {
  Sparkles, Send, Plus, MapPin, ChevronRight, ThumbsUp, ThumbsDown,
  Clock, Compass, ShieldCheck, Lightbulb, Loader2, Lock, MessageSquare,
  Settings, X, Copy, Check, History, Menu, Share2, ArrowRight, Volume2,
  Mic, MicOff, Square, ImagePlus,
} from "lucide-react";
import {
  MwmHome, MwmPlane, MwmBriefcase, MwmStore,
  MwmCommunity, MwmShield, MwmHeart, MwmGraduationCap,
} from "@/components/icons/mwm-icons";
import { Link } from "wouter";
import { GoldFeatherMark } from "@/components/brand/GoldFeatherMark";
import { DisclaimerBanner } from "@/components/DisclaimerBanner";
import { getWebToken } from "@/lib/webAuth";
import KinfolkHairLossCarePaths from "@/components/kinfolk/KinfolkHairLossCarePaths";
import { KinfolkMemoryManager } from "@/components/kinfolk/KinfolkMemoryManager";
import { KinfolkContextClarifier } from "@/features/kinfolk/KinfolkContextClarifier";
import { businessClarificationContinuation } from "@/features/kinfolk/businessClarificationContinuation";
import {
  hasItineraryDays,
  isSerializedItineraryContent,
  KinfolkAssistantText,
  KinfolkContextualContent,
  KinfolkItinerary as KinfolkItineraryRenderer,
  KinfolkSourceLinks,
  KinfolkStaffDemoBadge,
  safeExternalSourceHref,
  KINFOLK_RESPONSE_STATUS_DELAYS_MS,
  KINFOLK_RESPONSE_STATUS_STAGES,
  type KinfolkItinerary as KinfolkItineraryResponse,
  type KinfolkMediaLink,
  type KinfolkRelatedConnection,
  type KinfolkResearchStatus,
  type KinfolkStaffDemoExperience,
  type KinfolkStructuredContent,
} from "@/components/kinfolk/KinfolkChatPresentation";
import {
  AAVE_LEVEL_OPTIONS,
  composerValueFromTranscript,
  KINFOLK_VOICE_OPTIONS,
  normalizeWebRegionalFlavor,
  normalizeWebVoice,
  REGIONAL_LANGUAGE_OPTIONS,
  shouldAutoSpeakNewReply,
} from "@/lib/kinfolkVoicePreferences";

const BASE = import.meta.env.BASE_URL;

// Header helper for kinfolk fetch() calls.
// Auth is handled via the HttpOnly `sid` session cookie (credentials: "include").
// Do NOT inject a Bearer token here — the localStorage token can go stale after
// a Railway redeploy / rolling session renewal and will override the valid cookie
// in getSessionId(), causing 401s for logged-in users.
function kinfolkAuthHeaders(extra?: HeadersInit): HeadersInit {
  return extra ?? {};
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface Business {
  id?: string;
  name: string;
  category: string;
  description: string;
  neighborhood: string;
  mustTry: string;
  website?: string | null;
  detailUrl?: string;
  verified?: boolean;
  matchReasons?: string[];
}
interface Neighborhood { name: string; vibe: string; highlights: string[]; safetyNote: string }
interface Event { name: string; type: string; description: string; timing: string }
interface Recommendations {
  destination: string; summary: string;
  businesses: Business[]; neighborhoods: Neighborhood[];
  events: Event[]; safetyTips: string[]; localInsights: string[];
}
interface CultureAction { type: "save_roots"; detectedCommunity: string }
interface LibraryAction {
  type: "open_library_node" | "suggest_to_library";
  // open_library_node
  topicId?: string;
  label?: string;
  // suggest_to_library
  subject?: string;
  category?: string;
}
interface KinfolkSource { title: string; url: string }
interface KinfolkLibraryEntry { url: string; readMoreLabel: string }
// Returned only to eligible staff-demo participants. This is display metadata,
// not a client-side authorization check or security boundary.
type KinfolkExperience = KinfolkStaffDemoExperience;
interface HairLossCarePlan {
  educationalMessage: string;
  medicalDisclaimer: string;
  sourceLinks: KinfolkSource[];
  optionalPaths: Array<{ id: string; title: string; question: string; supportingText: string }>;
}
// ClarificationStep matches the server type from kinfolk/intentClarification.ts.
// Kept as a local interface to avoid importing server code into the web bundle.
interface ClarificationOption { value: string; label: string }
interface ClarificationStep {
  id: string; question: string; explanation?: string;
  options: ClarificationOption[]; skippable: boolean;
  persistence: "temporary" | "optional_member_memory";
}
interface Message {
  id: string; role: "user" | "assistant";
  content: string; recommendations?: Recommendations | null;
  /** Optional structured API payload; old free-text messages remain valid. */
  itinerary?: KinfolkItineraryResponse | null;
  structuredContent?: KinfolkStructuredContent | null;
  mediaLinks?: KinfolkMediaLink[];
  relatedConnections?: KinfolkRelatedConnection[];
  researchStatus?: KinfolkResearchStatus | null;
  followUpSuggestions?: string[]; timestamp: string;
  cultureAction?: CultureAction | null;
  libraryAction?: LibraryAction | null;
  intentClass?: string | null;
  provenanceNote?: string | null;
  sourceNote?: string | null;
  // Research sources + library entry link (Living Library branch)
  sources?: KinfolkSource[] | null;
  libraryEntry?: KinfolkLibraryEntry | null;
  // Hair-loss / alopecia care paths
  hairLossCarePlan?: HairLossCarePlan | null;
  // Adaptive depth fields (Show more / Show less)
  answerPlanId?: string | null;
  depth?: "brief" | "standard" | "deep";
  canShowMore?: boolean;
  canShowLess?: boolean;
  // Resolved location — present when Kinfolk resolved a city from this message
  // (alias, explicit mention, or session carry-forward)
  location?: { city: string; state: string | null; source: string } | null;
  locationSource?: string | null;
  // Optional personalization offer — rendered after general answer, never a gate.
  clarificationSteps?: ClarificationStep[];
  needsClarification?: boolean;
  originalQuery?: string;
  imageUrls?: string[];
  experience?: KinfolkExperience | null;
}
interface Session { id: string; title: string; destination?: string; createdAt: string }
interface Prefs {
  favoriteCategories: string[]; favoriteCities: string[];
  avoidCategories: string[]; budgetRange: string;
  tripStyle: string[]; travelCompanion: string; dietaryNotes: string | null;
  // Kinfolk personalization — what I care about, used to promote the right businesses
  ownershipTypes: string[]; lifestyleServices: string[];
  // How Kinfolk talks to me
  communicationStyle: string; personalityMode: string;
  emojiLevel: string; humorLevel: string; regionalFlavor: string;
  kinfolkVoice: string; autoSpeak: boolean; aaveLevel: number;
}

const DEFAULT_PREFS: Prefs = {
  favoriteCategories: [], favoriteCities: [], avoidCategories: [],
  budgetRange: "any", tripStyle: [], travelCompanion: "solo", dietaryNotes: null,
  ownershipTypes: [], lifestyleServices: [],
  communicationStyle: "friendly", personalityMode: "neighborhood_guide",
  emojiLevel: "some", humorLevel: "light", regionalFlavor: "off",
  kinfolkVoice: "onyx", autoSpeak: false, aaveLevel: 0,
};

const ALL_CATEGORIES = ["Food & Drink","Nightlife","Culture & Art","Music & Live Events","Beauty & Wellness","History","Outdoors","Family-Friendly","Shopping","Coffee","Spiritual","Sports"];
const AVOID_OPTS = ["Nightlife","Bars & Clubs","Loud venues","Crowded spaces","Tourist spots","Chains","Expensive dining"];
const BUDGET_OPTS = [{ id: "budget", label: "Budget 💵" }, { id: "mid", label: "Mid-range 💳" }, { id: "luxury", label: "Luxury ✨" }, { id: "any", label: "No limit" }];
const TRIP_STYLES = [{ id: "solo", label: "Solo" }, { id: "couple", label: "Couple" }, { id: "family", label: "Family" }, { id: "group", label: "Friend group" }, { id: "business", label: "Work trip" }, { id: "spiritual", label: "Spiritual" }];
const COMPANIONS = [{ id: "solo", label: "Solo" }, { id: "partner", label: "Partner" }, { id: "family", label: "Family" }, { id: "friends", label: "Friends" }, { id: "colleagues", label: "Colleagues" }];
const COMMUNICATION_STYLES = [{ id: "friendly", label: "Conversational" }, { id: "concise", label: "Concise" }, { id: "detailed", label: "Detailed" }, { id: "professional", label: "Professional" }];

// ─── Response-style bridge: API "responseStyle" ↔ internal "communicationStyle" ──
// The internal id for the "Conversational" label is "friendly" (not "conversational").
// ACTIVE_ID_TO_RESPONSE_STYLE maps internal → API for the /response-style PUT.
// RESPONSE_STYLE_TO_ACTIVE_ID maps API → internal so loadPrefs can set communicationStyle.
const ACTIVE_ID_TO_RESPONSE_STYLE: Record<string, string> = {
  friendly: "conversational", concise: "concise", detailed: "detailed", professional: "professional",
};
const RESPONSE_STYLE_TO_ACTIVE_ID: Record<string, string> = {
  conversational: "friendly", concise: "concise", detailed: "detailed", professional: "professional",
};

/**
 * Convert the server preference envelope into the exact internal communicationStyle id
 * used by the active TasteProfilePanel component.
 *
 * PRECEDENCE: responseStyle (new persisted field) → deliveryProfile → legacy communicationStyle.
 * KEY: "conversational" from the API maps to "friendly" internally.
 */
function resolveActiveCommunicationStyle(
  envelope: {
    responseStyle?: string | null;
    deliveryProfile?: { detailLevel?: string | null; detail_level?: string | null; tonePreference?: string | null; tone_preference?: string | null } | null;
  },
  legacyStyle: unknown,
): string {
  const mapped = RESPONSE_STYLE_TO_ACTIVE_ID[envelope.responseStyle ?? ""];
  if (mapped) return mapped;
  const dp = envelope.deliveryProfile;
  const dl = dp?.detailLevel ?? dp?.detail_level;
  const tp = dp?.tonePreference ?? dp?.tone_preference;
  if (tp === "professional") return "professional";
  if (dl === "deep")  return "detailed";
  if (dl === "quick") return "concise";
  if (typeof legacyStyle === "string" && ACTIVE_ID_TO_RESPONSE_STYLE[legacyStyle]) return legacyStyle;
  return "friendly";
}
const PERSONALITY_MODES = [{ id: "neighborhood_guide", label: "Neighborhood Guide" }, { id: "cultural_curator", label: "Cultural Curator" }, { id: "travel_companion", label: "Travel Companion" }, { id: "community", label: "Community Voice" }];
const EMOJI_LEVELS = [{ id: "none", label: "None" }, { id: "some", label: "Balanced" }, { id: "lots", label: "Expressive" }];
const HUMOR_LEVELS = [{ id: "none", label: "Straightforward" }, { id: "light", label: "Light" }, { id: "playful", label: "Playful" }];

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
 * Primary life-category chips — MWM gold icon + label + tap-to-send prompt.
 * Mirrors the mobile LIFE_CHIPS. Not travel-only.
 * PERMANENT — do not remove without founder authorization.
 * Icons use the approved MWM visual language (stroke #CA922B, fill none, rounded).
 */
const KINFOLK_LIFE_CHIPS: { Icon: React.ComponentType<{ size?: number; color?: string }>; label: string; prompt: string }[] = [
  { Icon: MwmHome,          label: "I'm Moving",       prompt: "I'm thinking about relocating" },
  { Icon: MwmPlane,         label: "I'm Traveling",    prompt: "I'm planning a trip" },
  { Icon: MwmBriefcase,     label: "My Career",        prompt: "I need help with my career" },
  { Icon: MwmStore,         label: "Find Businesses",  prompt: "Help me find minority-owned businesses near me" },
  { Icon: MwmCommunity,     label: "Community",        prompt: "I want to connect with my community" },
  { Icon: MwmShield,        label: "Stay Safe",        prompt: "I want to check safety info for my area" },
  { Icon: MwmHeart,         label: "Healthcare",       prompt: "I need healthcare recommendations" },
  { Icon: MwmGraduationCap, label: "Schools",          prompt: "I need help finding good schools" },
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
function PreferencesPanel({ open, onClose, prefs, onSave, hydrated }: {
  open: boolean; onClose: () => void; prefs: Prefs; onSave: (p: Prefs) => Promise<void>;
  /** True once loadPrefs has resolved; gates the buttons and save action. */
  hydrated: boolean;
}) {
  const [local, setLocal] = useState<Prefs>(prefs);
  const [cityInput, setCityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  useEffect(() => { setLocal(prefs); }, [prefs]);

  const addCity = () => {
    const city = cityInput.trim();
    if (city && !local.favoriteCities.includes(city)) setLocal(p => ({ ...p, favoriteCities: [...p.favoriteCities, city] }));
    setCityInput("");
  };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSave(local);
      setSaved(true);
      setTimeout(() => { setSaved(false); onClose(); }, 800);
    } catch {
      setSaveError("Kinfolk could not save those preferences. Please try again.");
    } finally {
      setSaving(false);
    }
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

          {/* ── How Kinfolk Talks to You ── */}
          <div className="pt-2 border-t border-[#3A1F0E]/8">
            <div className="text-[11px] font-bold text-[#3A1F0E] mb-0.5">How Kinfolk Talks to You</div>
            <div className="text-[10px] text-[#3A1F0E]/40 mb-4">Customize Kinfolk's tone and communication style.</div>
            <div className="space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Response style</div>
                <div className="flex flex-wrap gap-1.5">
                  {COMMUNICATION_STYLES.map(option => {
                    const selected = local.communicationStyle === option.id;
                    const rsId = ACTIVE_ID_TO_RESPONSE_STYLE[option.id] ?? option.id;
                    return (
                      <button key={option.id}
                        type="button"
                        data-testid={`kinfolk-response-style-${rsId}`}
                        aria-pressed={selected}
                        disabled={!hydrated || saving}
                        onClick={() => setLocal(p => ({ ...p, communicationStyle: option.id }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors disabled:opacity-40 ${selected ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Kinfolk style</div>
                <div className="flex flex-wrap gap-1.5">
                  {PERSONALITY_MODES.map(o => (
                    <button key={o.id} onClick={() => setLocal(p => ({ ...p, personalityMode: o.id }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${local.personalityMode === o.id ? "bg-[#CA922B] text-white" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Emoji in responses</div>
                <div className="flex gap-1.5">
                  {EMOJI_LEVELS.map(o => (
                    <button key={o.id} onClick={() => setLocal(p => ({ ...p, emojiLevel: o.id }))}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${local.emojiLevel === o.id ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">Tone</div>
                <div className="flex gap-1.5">
                  {HUMOR_LEVELS.map(o => (
                    <button key={o.id} onClick={() => setLocal(p => ({ ...p, humorLevel: o.id }))}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium transition-colors ${local.humorLevel === o.id ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2">AAVE register</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {AAVE_LEVEL_OPTIONS.map(o => (
                    <button key={o.id} type="button" onClick={() => setLocal(p => ({ ...p, aaveLevel: o.id }))}
                      aria-pressed={local.aaveLevel === o.id}
                      className={`rounded-xl px-3 py-2 text-left transition-colors ${local.aaveLevel === o.id ? "bg-[#2B1507] text-[#F5EBD8]" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                      <span className="block text-xs font-semibold">{o.label}</span>
                      <span className="block text-[9px] opacity-70">{o.description}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] leading-relaxed text-[#3A1F0E]/45">One member-selected register. Kinfolk never uses profanity, performs, stereotypes, or imitates an accent.</p>
              </div>
              <div>
                <label htmlFor="kinfolk-regional-language" className="text-[10px] font-bold uppercase tracking-widest text-[#3A1F0E]/40 mb-2 block">Regional Language</label>
                <select id="kinfolk-regional-language" value={local.regionalFlavor}
                  onChange={e => setLocal(p => ({ ...p, regionalFlavor: e.target.value }))}
                  className="w-full h-10 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] px-3 text-xs text-[#3A1F0E]">
                  {REGIONAL_LANGUAGE_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                </select>
                <p className="mt-2 text-[10px] leading-relaxed text-[#3A1F0E]/45">With your opt-in, Kinfolk may use one occasional local word such as Philadelphia “jawn” or Memphis “mane.” Voice timbre stays the same everywhere.</p>
              </div>
            </div>
          </div>

          {/* ── Kinfolk's Voice ── */}
          <div className="pt-2 border-t border-[#3A1F0E]/8">
            <div className="text-[11px] font-bold text-[#3A1F0E] mb-0.5">Kinfolk's Voice</div>
            <div className="text-[10px] text-[#3A1F0E]/40 mb-3">Choose a stable synthetic voice for every location. No human voice or identity is cloned.</div>
            <div className="grid gap-1.5">
              {KINFOLK_VOICE_OPTIONS.map(o => (
                <button key={o.id} type="button" onClick={() => setLocal(p => ({ ...p, kinfolkVoice: o.id }))}
                  aria-pressed={local.kinfolkVoice === o.id}
                  className={`rounded-xl px-3 py-2 text-left transition-colors ${local.kinfolkVoice === o.id ? "bg-[#CA922B] text-white" : "bg-[#FAF6EF] text-[#3A1F0E]/60 border border-[#3A1F0E]/8 hover:border-[#CA922B]/30"}`}>
                  <span className="block text-xs font-semibold">{o.label}{o.feminine ? " · Feminine" : ""}</span>
                  <span className="block text-[9px] opacity-75">{o.description}</span>
                </button>
              ))}
            </div>
            <label className="mt-3 flex items-start gap-2 rounded-xl border border-[#3A1F0E]/10 bg-[#FAF6EF] p-3">
              <input type="checkbox" checked={local.autoSpeak} onChange={e => setLocal(p => ({ ...p, autoSpeak: e.target.checked }))} className="mt-0.5" />
              <span>
                <span className="block text-xs font-semibold text-[#3A1F0E]">Automatically speak new replies</span>
                <span className="block text-[10px] leading-relaxed text-[#3A1F0E]/50">Off by default. Only newly returned answers play; history and error messages never autoplay.</span>
              </span>
            </label>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-[#3A1F0E]/8 shrink-0">
          {saveError && <p role="alert" className="mb-2 text-xs text-red-700">{saveError}</p>}
          <button onClick={save} disabled={saving}
            data-testid="kinfolk-save-taste-profile"
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
            {biz.detailUrl ? (
              <Link href={biz.detailUrl} className="font-bold text-[#3A1F0E] text-sm leading-tight hover:text-[#9A6818] hover:underline">{biz.name}</Link>
            ) : (
              <span className="font-bold text-[#3A1F0E] text-sm leading-tight">{biz.name}</span>
            )}
            <span className="bg-[#2B1507] text-[#F5EBD8] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">{biz.category}</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] text-[#3A1F0E]/40 uppercase tracking-wider font-bold mb-2"><MapPin size={9} />{biz.neighborhood}</div>
          <p className="text-xs text-[#3A1F0E]/70 leading-relaxed mb-3">{biz.description}</p>
          {biz.verified === false && <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#7A4B16]">Founder-listed · Unclaimed · Not MWM verified</p>}
          {biz.matchReasons && biz.matchReasons.length > 0 && (
            <p className="mb-3 text-[11px] leading-relaxed text-[#3A1F0E]/65"><strong>Why it surfaced:</strong> {biz.matchReasons.join(" · ")}</p>
          )}
          <div className="bg-[#FAF6EF] rounded-xl p-2.5 text-xs text-[#3A1F0E]/80 flex items-start gap-1.5 mb-3">
            <Sparkles size={12} className="text-[#CA922B] shrink-0 mt-0.5" />
            <span><strong>Try:</strong> {biz.mustTry}</span>
          </div>
          <div className="mb-3 flex flex-wrap gap-2">
            {biz.detailUrl && <Link href={biz.detailUrl} className="inline-flex items-center gap-1 rounded-full bg-[#2B1507] px-3 py-1 text-xs font-semibold text-white">View details <ChevronRight size={11} /></Link>}
            {biz.website && safeExternalSourceHref(biz.website) && <a href={safeExternalSourceHref(biz.website)!} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-[#CA922B]/40 bg-[#CA922B]/10 px-3 py-1 text-xs font-semibold text-[#7A4B16]">Visit website <ChevronRight size={11} /></a>}
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
            <MwmCommunity size={28} color="#CA922B" aria-hidden />
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

  // Pre-fill from ?q= URL param — set once on mount (map/business search handoff)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q?.trim()) setInput(q.trim());
  }, []);

  const [sending, setSending] = useState(false);
  const [responseStatus, setResponseStatus] = useState<(typeof KINFOLK_RESPONSE_STATUS_STAGES)[number]>(
    KINFOLK_RESPONSE_STATUS_STAGES[0],
  );
  const [kinfolkMode, setKinfolkMode] = useState<"community" | "professor" | "business_manager" | "best_friend">("community");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [rememberThis, setRememberThis] = useState(false);
  const [showMemoryManager, setShowMemoryManager] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "like" | "dislike">>({});
  const [showPrefs, setShowPrefs] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  // Pick one welcome headline per mount — stays stable for the session
  const [kinfolkWelcomeHeadline] = useState(() =>
    KINFOLK_WELCOME_HEADLINES[Math.floor(Math.random() * KINFOLK_WELCOME_HEADLINES.length)]
  );

  const msgContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const responseStatusTimersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const activeChatControllerRef = useRef<AbortController | null>(null);

  const clearResponseStatusTimers = useCallback((resetStatus = true) => {
    responseStatusTimersRef.current.forEach(clearTimeout);
    responseStatusTimersRef.current = [];
    if (resetStatus) setResponseStatus(KINFOLK_RESPONSE_STATUS_STAGES[0]);
  }, []);

  const startResponseStatusTimers = useCallback(() => {
    clearResponseStatusTimers();
    responseStatusTimersRef.current = [
      setTimeout(
        () => setResponseStatus(KINFOLK_RESPONSE_STATUS_STAGES[1]),
        KINFOLK_RESPONSE_STATUS_DELAYS_MS.connectingConversation,
      ),
      setTimeout(
        () => setResponseStatus(KINFOLK_RESPONSE_STATUS_STAGES[2]),
        KINFOLK_RESPONSE_STATUS_DELAYS_MS.puttingAnswerTogether,
      ),
    ];
  }, [clearResponseStatusTimers]);

  // TTS state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [voiceStatus, setVoiceStatus] = useState<Record<string, string>>({});
  // Tracks which assistant message ID has pending clarification steps to offer.
  // Null when no clarifier is active. Cleared on any answer or skip.
  const [pendingClarificationMsgId, setPendingClarificationMsgId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const autoSpokenMessageIdsRef = useRef(new Set<string>());

  const releaseAudio = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    audioRef.current = null;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }, []);

  // ── Voice input state ──────────────────────────────────────────────────────
  type VoiceState = "idle" | "notice" | "requesting" | "denied" | "recording" | "processing";
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const mediaRecorderRef        = useRef<MediaRecorder | null>(null);
  const audioChunksRef          = useRef<Blob[]>([]);
  const recordingStartedAtRef   = useRef<number | null>(null); // wall-clock ms for duration
  const elapsedTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const privacyNoticeSeen = useRef(false); // shown once per session

  // Load preferences — always merge with DEFAULT_PREFS so every array field is
  // guaranteed to be an array even if the DB row predates a field addition.
  const loadPrefs = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const r = await fetch(`${BASE}api/kinfolk/preferences`, { credentials: "include", headers: kinfolkAuthHeaders() });
      if (r.ok) {
        const d = await r.json() as {
          preferences: Record<string, unknown>;
          // New delivery-profile fields (added with Kinfolk Router)
          responseStyle?: string;
          deliveryProfile?: {
            detailLevel?: string; detail_level?: string;
            tonePreference?: string; tone_preference?: string;
          };
        };
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
          communicationStyle: resolveActiveCommunicationStyle(d, raw.communicationStyle),
          personalityMode:    typeof raw.personalityMode === "string" ? raw.personalityMode : DEFAULT_PREFS.personalityMode,
          emojiLevel:         typeof raw.emojiLevel === "string" ? raw.emojiLevel : DEFAULT_PREFS.emojiLevel,
          humorLevel:         typeof raw.humorLevel === "string" ? raw.humorLevel : DEFAULT_PREFS.humorLevel,
          regionalFlavor:     normalizeWebRegionalFlavor(raw.regionalFlavor),
          kinfolkVoice:       normalizeWebVoice(raw.kinfolkVoice),
          autoSpeak:          raw.autoSpeak === true,
          aaveLevel:          Number.isInteger(raw.aaveLevel) && Number(raw.aaveLevel) >= 0 && Number(raw.aaveLevel) <= 3 ? Number(raw.aaveLevel) : 0,
        });
        setPreferencesHydrated(true);
      }
    } finally { setPrefsLoaded(true); }
  }, [isLoggedIn]);

  const savePrefs = useCallback(async (p: Prefs) => {
    // Map ownershipTypes → preferredOwnershipTypes (API field name)
    const response = await fetch(`${BASE}api/kinfolk/preferences`, {
      method: "PUT", credentials: "include",
      headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ ...p, preferredOwnershipTypes: p.ownershipTypes }),
    });
    if (!response.ok) throw new Error("PREFERENCE_SAVE_FAILED");
    // The primary preferences endpoint persists communicationStyle into the
    // delivery profile transactionally, so a second partial save is unnecessary.
    setPrefs(p);
  }, []);

  // ── Voice: stop recording and clean up ─────────────────────────────────────
  const stopRecording = useCallback(() => {
    if (elapsedTimerRef.current) { clearInterval(elapsedTimerRef.current); elapsedTimerRef.current = null; }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    // Revoke any MediaStream tracks to release the mic indicator
    mediaRecorderRef.current?.stream?.getTracks().forEach(t => t.stop());
  }, []);

  // ── Voice: encode captured chunks and call /transcribe ─────────────────────
  // Uses multipart/form-data (binary — no base64 expansion) + wall-clock
  // duration so a 2-second clip is never labelled "over 60 seconds" due to
  // a proxy payload size limit. Error classification reads the response body
  // `error` code, not the HTTP status alone.
  const MAX_VOICE_DURATION_MS = 60_000;
  const MAX_VOICE_BYTES = 4 * 1024 * 1024; // 4 MB binary

  function classifyVoiceError(status: number, body: { error?: string; message?: string }): string {
    if (body.error === "AUDIO_DURATION_EXCEEDED") return "That recording is over 60 seconds. Please send a shorter clip.";
    if (body.error === "AUDIO_PAYLOAD_TOO_LARGE" || status === 413) return "This voice clip is too large to upload. Please try a shorter or lower-quality recording.";
    if (body.error === "AUDIO_UNREADABLE" || status === 400) return "Kinfolk could not read that audio. Please try again or type your question.";
    if (status === 429) return "Voice input limit reached. Give it a few minutes.";
    return "Voice transcription is unavailable right now. You can still type your question.";
  }

  const finishRecording = useCallback(async (chunks: Blob[], mimeType: string) => {
    setVoiceState("processing");
    // Wall-clock duration from the ref set when recording started
    const durationMs = recordingStartedAtRef.current !== null
      ? Math.max(0, Math.round(performance.now() - recordingStartedAtRef.current))
      : 0;
    recordingStartedAtRef.current = null;

    try {
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size < 100) { setVoiceState("idle"); return; }

      // Client-side preflight: reject before sending
      if (durationMs > MAX_VOICE_DURATION_MS) {
        setInput("That recording is over 60 seconds. Please send a shorter clip.");
        setVoiceState("idle");
        return;
      }
      if (blob.size > MAX_VOICE_BYTES) {
        setInput("This voice clip is too large to upload. Please try a shorter or lower-quality recording.");
        setVoiceState("idle");
        return;
      }

      // Multipart binary upload — avoids base64 expansion that causes spurious 413s
      const ext = mimeType.includes("mp4") ? "m4a" : "webm";
      const form = new FormData();
      form.append("audio", blob, `kinfolk-voice.${ext}`);
      form.append("durationMs", String(durationMs));
      form.append("mimeType", mimeType || "audio/webm");

      const r = await fetch(`${BASE}api/kinfolk/transcribe`, {
        method: "POST",
        credentials: "include",
        // Do NOT set Content-Type manually — browser must supply the multipart boundary
        body: form,
      });

      if (!r.ok) {
        const body = await r.json().catch(() => ({})) as { error?: string; message?: string };
        setInput(classifyVoiceError(r.status, body));
        setVoiceState("idle");
        return;
      }

      const data = await r.json() as { text?: string; audioRetained?: boolean };
      const transcript = data.text?.trim() ?? "";
      if (!transcript) { setVoiceState("idle"); return; }

      // Populate the composer with only the transcript for member review — never send automatically.
      setInput(composerValueFromTranscript(transcript));
      setVoiceState("idle");

      // Focus input so member can edit before sending
      setTimeout(() => inputRef.current?.focus(), 50);
    } catch {
      setInput("Transcription failed — please type your question.");
      setVoiceState("idle");
    } finally {
      audioChunksRef.current = [];
    }
  }, []);

  // ── Voice: request permission and start recording ──────────────────────────
  // This function intentionally does not contain the first-use notice gate so
  // accepting the notice can proceed directly to the browser permission prompt.
  const beginVoiceRecording = useCallback(async () => {
    setVoiceState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Choose the best supported MIME type
      const preferredTypes = ["audio/webm", "audio/mp4", "audio/wav", "audio/ogg"];
      const mimeType = preferredTypes.find(t => MediaRecorder.isTypeSupported(t)) ?? "";
      const options = mimeType ? { mimeType } : {};

      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];
      audioChunksRef.current = chunks;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => finishRecording(chunks, mimeType || "audio/webm");

      recorder.start(250); // collect chunks every 250ms
      recordingStartedAtRef.current = performance.now(); // wall-clock start for duration
      setVoiceState("recording");
      setRecordingElapsed(0);

      elapsedTimerRef.current = setInterval(() => {
        setRecordingElapsed(prev => {
          if (prev >= 59) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setVoiceState("denied");
      setTimeout(() => setVoiceState("idle"), 4000);
    }
  }, [stopRecording, finishRecording]);

  // ── Voice: primary tap handler ──────────────────────────────────────────────
  const handleVoiceTap = useCallback(async () => {
    // Stop recording if already recording
    if (voiceState === "recording") {
      stopRecording();
      return;
    }
    // Dismiss notice without acting
    if (voiceState === "notice") { setVoiceState("idle"); return; }
    if (voiceState === "processing" || voiceState === "requesting") return;

    // Show privacy notice once per session before requesting mic permission
    if (!privacyNoticeSeen.current) {
      setVoiceState("notice");
      return;
    }

    await beginVoiceRecording();
  }, [voiceState, stopRecording, beginVoiceRecording]);

  // ── Voice: proceed from privacy notice ─────────────────────────────────────
  const handleVoiceNoticeAccept = useCallback(async () => {
    privacyNoticeSeen.current = true;
    await beginVoiceRecording();
  }, [beginVoiceRecording]);

  // Cleanup on unmount
  useEffect(() => () => {
    stopRecording();
    releaseAudio();
    if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
  }, [releaseAudio, stopRecording]);

  // Clear client-only status timers and abort any in-flight request on unmount.
  useEffect(() => () => {
    clearResponseStatusTimers(false);
    activeChatControllerRef.current?.abort("unmount");
  }, [clearResponseStatusTimers]);

  // TTS playback. Manual Listen remains available even when auto-speak is off.
  const playMessage = useCallback(async (msgId: string, content: string, source: "manual" | "auto" = "manual") => {
    if (!content.trim()) return;
    if (source === "manual" && playingId === msgId) {
      releaseAudio();
      setPlayingId(null);
      setVoiceStatus(prev => ({ ...prev, [msgId]: "" }));
      return;
    }
    releaseAudio();
    setPlayingId(msgId);
    setVoiceStatus(prev => ({ ...prev, [msgId]: source === "auto" ? "Preparing voice…" : "" }));
    try {
      const r = await fetch(`${BASE}api/kinfolk/speak`, {
        method: "POST", credentials: "include",
        headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ text: content.slice(0, 600), voice: prefs.kinfolkVoice || "onyx" }),
      });
      if (!r.ok) throw new Error("TTS request failed");
      const d = await r.json() as { audio?: string };
      if (!d.audio) throw new Error("No audio returned");
      const bytes = Uint8Array.from(atob(d.audio), char => char.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
      const audio = new Audio(url);
      audioRef.current = audio;
      audioUrlRef.current = url;
      const finish = () => {
        releaseAudio();
        setPlayingId(null);
        setVoiceStatus(prev => ({ ...prev, [msgId]: "" }));
      };
      audio.onended = finish;
      audio.onerror = () => {
        releaseAudio();
        setPlayingId(null);
        setVoiceStatus(prev => ({ ...prev, [msgId]: "Tap Listen" }));
      };
      await audio.play();
      setVoiceStatus(prev => ({ ...prev, [msgId]: "" }));
    } catch {
      releaseAudio();
      setPlayingId(null);
      setVoiceStatus(prev => ({ ...prev, [msgId]: "Tap Listen" }));
    }
  }, [playingId, prefs.kinfolkVoice, releaseAudio]);

  // Load session list
  const loadSessions = useCallback(async () => {
    if (!isLoggedIn) return;
    setSessionsLoading(true);
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions`, { credentials: "include", headers: kinfolkAuthHeaders() });
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

  const uploadKinfolkImage = useCallback(async (file: File) => {
    if (imageUrls.length >= 2 || uploadingImage) return;
    setUploadingImage(true);
    setImageError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`${BASE}api/media/upload?purpose=kinfolk_question`, {
        method: "POST", credentials: "include", body: form,
      });
      const body = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "Could not upload that image.");
      setImageUrls((items) => items.includes(body.url!) ? items : [...items, body.url!].slice(0, 2));
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : "Could not upload that image.");
    } finally {
      setUploadingImage(false);
    }
  }, [imageUrls.length, uploadingImage]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setInput("");
    if (inputRef.current) { inputRef.current.style.height = "auto"; }

    const attachedImages = [...imageUrls];
    const shouldRemember = rememberThis;
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed, timestamp: new Date().toISOString(), imageUrls: attachedImages };
    setMessages(prev => [...prev, userMsg]);
    // Status stages describe only local elapsed request time. Clear any prior
    // stage before starting a new request so stale copy can never linger.
    clearResponseStatusTimers();
    activeChatControllerRef.current?.abort("superseded");
    setSending(true);
    startResponseStatusTimers();

    // 30-second client-side timeout — Kinfolk must never spin forever.
    // The server has its own 25s AbortSignal on the OpenAI call, but if the
    // request hangs before reaching that point (e.g. pool wait), the browser
    // fetch has no built-in deadline. This abort controller guarantees the UI
    // always resolves and shows a recoverable error message.
    const controller = new AbortController();
    activeChatControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort("timeout"), 30000);

    try {
      const r = await fetch(`${BASE}api/kinfolk/chat`, {
        method: "POST", headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }), credentials: "include",
        body: JSON.stringify({ sessionId, message: trimmed, neighborVoice: true, voiceMode: kinfolkMode, imageUrls: attachedImages }),
        signal: controller.signal,
      });

      // Always check r.ok — a 4xx/5xx response contains { error: "..." } not
      // { reply: "..." }. Without this check, data.reply is undefined and the
      // assistant message renders blank/invisible.
      if (!r.ok) {
        let errMsg = "Kinfolk is having trouble answering that right now. Try again.";
        let isBusy = false;
        try {
          const errData = await r.json() as { error?: string; code?: string };
          const isBusyCode = errData.code === "KINFOLK_BUSY" || errData.code === "KINFOLK_RATE_LIMITED";
          if (r.status === 503 && isBusyCode) {
            // Restore the question so the user can retry without retyping
            setInput(trimmed);
            if (inputRef.current) { inputRef.current.style.height = "auto"; }
            errMsg = "Kinfolk is helping a few people right now — your message is restored above. Try again in about 20 seconds.";
            isBusy = true;
          } else if (r.status === 429 && errData.error) {
            errMsg = errData.error;
          } else if (r.status === 504) {
            errMsg = "Kinfolk took a little too long on that one. Try again in a moment.";
          }
        } catch { /* ignore parse error */ }
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: errMsg, timestamp: new Date().toISOString() }]);
        if (isBusy) return; // Input already restored — don't clear it in finally
        return;
      }

      const data = await r.json() as {
        sessionId?: string; reply?: string;
        recommendations?: Recommendations | null;
        /** Structured itinerary payload is additive to legacy recommendations. */
        itinerary?: KinfolkItineraryResponse | null;
        structuredContent?: KinfolkStructuredContent | null;
        mediaLinks?: KinfolkMediaLink[];
        relatedConnections?: KinfolkRelatedConnection[];
        researchStatus?: KinfolkResearchStatus | null;
        followUpSuggestions?: string[];
        cultureAction?: CultureAction | null;
        libraryAction?: LibraryAction | null;
        intentClass?: string | null;
        provenanceNote?: string | null;
        sourceNote?: string | null;
        // Research sources + library entry link
        sources?: KinfolkSource[] | null;
        libraryEntry?: KinfolkLibraryEntry | null;
        // Hair-loss care plan
        hairLossCarePlan?: HairLossCarePlan | null;
        // Optional personalization clarifier steps
        clarificationSteps?: ClarificationStep[] | null;
        needsClarification?: boolean;
        originalQuery?: string;
        // Adaptive depth (Show more / Show less)
        answerPlanId?: string | null;
        depth?: "brief" | "standard" | "deep";
        canShowMore?: boolean;
        canShowLess?: boolean;
        // Resolved location — present when a city was resolved from this message
        location?: { city: string; state: string | null; source: string } | null;
        locationSource?: string | null;
        experience?: KinfolkExperience | null;
        degraded?: boolean;
        degradedReason?: string | null;
      };

      // A structured itinerary may intentionally omit conversational copy. Legacy replies
      // retain the recoverable fallback rather than ever rendering a blank message.
      const replyContent = data.reply?.trim()
        ? data.reply
        : hasItineraryDays(data.itinerary)
        ? ""
        : "Kinfolk is having trouble answering that right now. Try again.";

      if (data.sessionId && data.sessionId !== sessionId) { setSessionId(data.sessionId); loadSessions(); }
      setImageUrls([]);
      if (shouldRemember) {
        fetch(`${BASE}api/kinfolk/memories`, {
          method: "POST", credentials: "include", headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ consent: true, content: trimmed, purpose: "ongoing_context", sessionId: data.sessionId ?? sessionId }),
        }).catch(() => {});
        setRememberThis(false);
      }
      // Capture the ID so we can wire the clarifier to this specific message.
      const assistantMsgId = crypto.randomUUID();
      setMessages(prev => [...prev, {
        id: assistantMsgId, role: "assistant",
        content: replyContent, recommendations: data.recommendations ?? null,
        itinerary: data.itinerary ?? null,
        structuredContent: data.structuredContent ?? null,
        mediaLinks: data.mediaLinks ?? [],
        relatedConnections: data.relatedConnections ?? [],
        researchStatus: data.researchStatus ?? null,
        followUpSuggestions: data.followUpSuggestions ?? [], timestamp: new Date().toISOString(),
        cultureAction: data.cultureAction ?? null,
        libraryAction: data.libraryAction ?? null,
        intentClass: data.intentClass ?? null,
        provenanceNote: data.provenanceNote ?? null,
        sourceNote: data.sourceNote ?? null,
        sources: data.sources ?? null,
        libraryEntry: data.libraryEntry ?? null,
        hairLossCarePlan: data.hairLossCarePlan ?? null,
        answerPlanId: data.answerPlanId ?? null,
        depth: data.depth,
        canShowMore: data.canShowMore ?? false,
        canShowLess: data.canShowLess ?? false,
        location: data.location ?? null,
        locationSource: data.locationSource ?? null,
        clarificationSteps: data.clarificationSteps ?? undefined,
        needsClarification: data.needsClarification === true,
        originalQuery: data.originalQuery ?? trimmed,
        experience: data.experience ?? null,
      }]);
      if (shouldAutoSpeakNewReply({
        autoSpeak: prefs.autoSpeak,
        isNewAssistantReply: true,
        content: replyContent,
        degraded: data.degraded === true,
        errorFallback: !data.reply?.trim(),
      }) && !autoSpokenMessageIdsRef.current.has(assistantMsgId)) {
        autoSpokenMessageIdsRef.current.add(assistantMsgId);
        void playMessage(assistantMsgId, replyContent, "auto");
      }
      // Show the optional clarifier if steps were returned.
      if (data.clarificationSteps && data.clarificationSteps.length > 0) {
        setPendingClarificationMsgId(assistantMsgId);
      }
    } catch (err) {
      // New-chat and unmount aborts are intentional; avoid adding a stale error
      // after the conversation has been cleared. A timeout remains recoverable.
      const wasAborted = controller.signal.aborted || (err instanceof Error && err.name === "AbortError");
      const isTimeout = controller.signal.reason === "timeout";
      if (!wasAborted || isTimeout) {
        const msg = isTimeout
          ? "Kinfolk is taking longer than expected. Try again in a moment."
          : "Something went sideways on my end — try again in a sec.";
        setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: msg, timestamp: new Date().toISOString() }]);
      }
    } finally {
      clearTimeout(timeoutId);
      if (activeChatControllerRef.current === controller) activeChatControllerRef.current = null;
      clearResponseStatusTimers();
      setSending(false);
    }
  }, [sending, sessionId, loadSessions, imageUrls, rememberThis, kinfolkMode, clearResponseStatusTimers, startResponseStatusTimers, playMessage, prefs.autoSpeak]);

  // Change the depth of an existing answer (Show more / Show less).
  // Records the event server-side and updates the local message state optimistically.
  const changeAnswerDepth = useCallback(async (
    msgId: string,
    answerPlanId: string,
    action: "show_more" | "show_less",
  ) => {
    try {
      await fetch(`${BASE}api/kinfolk/answer-plans/${answerPlanId}/depth`, {
        method: "PATCH",
        headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }),
        credentials: "include",
        body: JSON.stringify({ action }),
      });
    } catch { /* non-critical — UI still updates */ }
    // Optimistic local update
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId || !m.depth) return m;
      const depthOrder: Array<"brief" | "standard" | "deep"> = ["brief", "standard", "deep"];
      const idx = depthOrder.indexOf(m.depth);
      const newDepth = action === "show_more"
        ? depthOrder[Math.min(idx + 1, 2)]
        : depthOrder[Math.max(idx - 1, 0)];
      return {
        ...m,
        depth: newDepth,
        canShowMore: newDepth !== "deep",
        canShowLess: newDepth !== "brief",
      };
    }));
  }, []);

  const loadSession = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions/${id}`, { credentials: "include", headers: kinfolkAuthHeaders() });
      if (!r.ok) return;
      const d = await r.json() as { session: { id: string; messages: Message[] } };
      setSessionId(d.session.id); setMessages(d.session.messages ?? []);
      setShowHistory(false);
    } catch { /* ignore */ }
  }, []);

  const newChat = () => {
    clearResponseStatusTimers();
    activeChatControllerRef.current?.abort("new_chat");
    releaseAudio();
    autoSpokenMessageIdsRef.current.clear();
    setSessionId(undefined); setMessages([]); setInput(""); setShowHistory(false); setPendingClarificationMsgId(null);
  };

  // Library suggestions — track which message IDs have been responded to
  const [respondedLibrarySuggestions, setRespondedLibrarySuggestions] = useState<Set<string>>(new Set());
  const suggestToLibrary = useCallback(async (msgId: string, subject: string, category: string) => {
    setRespondedLibrarySuggestions(prev => new Set([...prev, msgId]));
    try {
      await fetch(`${BASE}api/library/suggest`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category }),
      });
    } catch { /* non-fatal */ }
  }, []);

  const handleFeedback = async (name: string, cat: string, reaction: "like" | "dislike") => {
    setFeedback(prev => ({ ...prev, [name]: reaction }));
    if (!isLoggedIn) return;
    await fetch(`${BASE}api/kinfolk/feedback`, {
      method: "POST", credentials: "include",
      headers: kinfolkAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ sessionId, businessName: name, category: cat, reaction }),
    });
  };

  const shareTrip = async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(`${BASE}api/kinfolk/sessions/${sessionId}/share`, {
        method: "POST", credentials: "include",
        headers: kinfolkAuthHeaders(),
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
      {isLoggedIn && <PreferencesPanel open={showPrefs} onClose={() => setShowPrefs(false)} prefs={prefs} onSave={savePrefs}
        hydrated={preferencesHydrated} />}

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
                          className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white border border-[#3A1F0E]/10 rounded-2xl text-center hover:border-[#CA922B]/40 hover:bg-[#CA922B]/5 transition-colors shadow-sm group">
                          <chip.Icon size={20} color="#CA922B" aria-hidden />
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
                        <GoldFeatherMark size={15} label="Kinfolk" />
                      </div>
                    )}
                    <div className={msg.role === "user" ? "max-w-[70%]" : "max-w-[min(48rem,90%)]"}>
                      <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#2B1507] text-[#F5EBD8] rounded-br-sm"
                          : "bg-white border border-[#3A1F0E]/8 text-[#3A1F0E] rounded-bl-sm shadow-sm"
                      }`}>
                        {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className="mb-2 grid grid-cols-2 gap-2">
                            {msg.imageUrls.map((url) => <img key={url} src={url} alt="Image shared with Kinfolk" className="max-h-44 w-full rounded-xl object-cover" />)}
                          </div>
                        )}
                        {msg.role === "assistant" ? (
                          <>
                            <KinfolkStaffDemoBadge experience={msg.experience} />
                            {msg.content && (!hasItineraryDays(msg.itinerary) || !isSerializedItineraryContent(msg.content)) && (
                              <KinfolkAssistantText content={msg.content} />
                            )}
                          </>
                        ) : (
                          <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "assistant" && isLoggedIn && msg.content.trim() && (
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            onClick={() => playMessage(msg.id, msg.content)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
                              playingId === msg.id
                                ? "text-[#CA922B] bg-[#CA922B]/8 border border-[#CA922B]/20"
                                : "text-[#3A1F0E]/30 hover:text-[#CA922B] hover:bg-[#CA922B]/5"
                            }`}
                          >
                            <Volume2 size={10} />
                            {playingId === msg.id ? "Stop" : "Listen"}
                          </button>
                          {voiceStatus[msg.id] && <span aria-live="polite" className="text-[10px] text-[#3A1F0E]/40">{voiceStatus[msg.id]}</span>}
                        </div>
                      )}
                      {hasItineraryDays(msg.itinerary) && (
                        <KinfolkItineraryRenderer itinerary={msg.itinerary!} />
                      )}
                      {msg.role === "assistant" && (
                        <KinfolkContextualContent
                          structuredContent={msg.structuredContent}
                          mediaLinks={msg.mediaLinks}
                          relatedConnections={msg.relatedConnections}
                          researchStatus={msg.researchStatus}
                        />
                      )}
                      {msg.recommendations && !hasItineraryDays(msg.itinerary) && (
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
                      {/* Show more / Show less — adaptive depth controls */}
                      {msg.role === "assistant" && msg.answerPlanId && (msg.canShowMore || msg.canShowLess) && (
                        <div className="flex items-center gap-2 mt-2">
                          {msg.canShowLess && (
                            <button
                              onClick={() => changeAnswerDepth(msg.id, msg.answerPlanId!, "show_less")}
                              className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium border border-[#3A1F0E]/10 text-[#3A1F0E]/40 hover:border-[#CA922B]/30 hover:text-[#CA922B] transition-colors bg-white"
                            >
                              <ChevronRight size={9} className="rotate-90" />Show less
                            </button>
                          )}
                          {msg.canShowMore && (
                            <button
                              onClick={() => changeAnswerDepth(msg.id, msg.answerPlanId!, "show_more")}
                              className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-medium border border-[#3A1F0E]/10 text-[#3A1F0E]/40 hover:border-[#CA922B]/30 hover:text-[#CA922B] transition-colors bg-white"
                            >
                              <ChevronRight size={9} className="-rotate-90" />Show more
                            </button>
                          )}
                        </div>
                      )}
                      {/* Source citations — shown for Living Library research answers */}
                      {msg.role === "assistant" && msg.sources && msg.sources.length > 0 && (
                        <KinfolkSourceLinks sources={msg.sources} />
                      )}
                      {/* Library entry link — "Read the full source-cited entry" */}
                      {msg.role === "assistant" && msg.libraryEntry && (
                        <Link
                          href={msg.libraryEntry.url}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#8D5C17] underline hover:text-[#CA922B] transition-colors"
                        >
                          <GoldFeatherMark label="Library" size={10} />
                          {msg.libraryEntry.readMoreLabel}
                        </Link>
                      )}
                      {/* Hair-loss care paths — rendered when Kinfolk detects an alopecia/hair-loss question */}
                      {msg.role === "assistant" && msg.intentClass === "hair_loss_care" && msg.hairLossCarePlan && (
                        <KinfolkHairLossCarePaths />
                      )}
                      {/* Library suggestion — shown when Kinfolk identifies a topic not yet in the Library */}
                      {msg.role === "assistant" && msg.libraryAction?.type === "suggest_to_library" &&
                       msg.libraryAction.subject && !respondedLibrarySuggestions.has(msg.id) && (
                        <div className="mt-3 bg-[#F5F0FF] border border-[#7C5CBA]/20 rounded-2xl px-4 py-3">
                          <div className="flex items-start gap-2 mb-2">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 mt-[1px]" stroke="#7C5CBA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 2h10a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"/><line x1="5" y1="6" x2="11" y2="6"/><line x1="5" y1="9" x2="8" y2="9"/>
                            </svg>
                            <p className="text-xs text-[#3A1F0E]/70 leading-relaxed">
                              <span className="font-semibold text-[#2B1507]">{msg.libraryAction.subject}</span> isn't in the Community Library yet. Want to suggest it so others can learn from it too?
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => suggestToLibrary(msg.id, msg.libraryAction!.subject!, msg.libraryAction!.category ?? "general")}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-[#7C5CBA] text-white hover:bg-[#6A4DA8] transition-colors"
                            >
                              Yes, suggest it for the Library
                            </button>
                            <button
                              onClick={() => setRespondedLibrarySuggestions(prev => new Set([...prev, msg.id]))}
                              className="text-[10px] font-semibold px-3 py-1.5 rounded-full text-[#3A1F0E]/40 hover:text-[#3A1F0E]/70 transition-colors"
                            >
                              No thanks
                            </button>
                          </div>
                        </div>
                      )}
                      {/* Diaspora-first context clarifier — optional offer after general answers.
                          Only shown for the specific message that returned clarification steps.
                          Every step is skippable. Answers are sent as a follow-up message,
                          never stored to member memory automatically. */}
                      {msg.role === "assistant" && msg.id === pendingClarificationMsgId &&
                       msg.clarificationSteps && msg.clarificationSteps.length > 0 && (
                        <div className="mt-3">
                          <KinfolkContextClarifier
                            steps={msg.clarificationSteps}
                            onComplete={(answers) => {
                              setPendingClarificationMsgId(null);
                              // Format non-skipped answers into a brief context sentence.
                              const contextParts = msg.clarificationSteps!
                                .filter(s => answers[s.id] && answers[s.id] !== "skip")
                                .map(s => {
                                  const chosen = s.options.find(o => o.value === answers[s.id]);
                                  return chosen?.label ?? answers[s.id];
                                })
                                .join(" · ");
                              const originalQuery = msg.originalQuery?.trim() || "Keep my last local business search broad";
                              void send(businessClarificationContinuation(originalQuery, contextParts));
                            }}
                          />
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
                      <span data-testid="kinfolk-response-status" aria-live="polite" className="text-xs text-[#3A1F0E]/55 italic ml-1">{responseStatus}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input bar */}
              <div className="border-t border-[#3A1F0E]/8 bg-white px-4 py-3 shrink-0">
                {/* Voice privacy notice — shown once before first recording */}
                {voiceState === "notice" && (
                  <div role="dialog" aria-label="Voice privacy notice" className="mb-3 max-w-3xl mx-auto bg-[#FFF8EC] border border-[#CA922B]/30 rounded-2xl px-4 py-3">
                    <p className="text-xs text-[#3A1F0E]/80 leading-relaxed mb-2">
                      <strong className="text-[#3A1F0E]">Before you speak —</strong> your audio is used only to turn your question into text. It is not posted to your profile, Circle, business page, or Library, and is never stored.
                    </p>
                    <div className="flex gap-2">
                      <button onClick={handleVoiceNoticeAccept}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-[#CA922B] text-white hover:bg-[#B38024] transition-colors">
                        Got it — open mic
                      </button>
                      <button onClick={() => setVoiceState("idle")}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white border border-[#3A1F0E]/12 text-[#3A1F0E]/60 hover:border-[#CA922B]/40 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Recording status bar */}
                {(voiceState === "recording" || voiceState === "processing") && (
                  <div aria-live="polite" className="mb-3 max-w-3xl mx-auto flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-2xl">
                    {voiceState === "recording" ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" aria-hidden />
                        <span className="text-xs text-red-700 font-medium flex-1">
                          Recording… {recordingElapsed}s / 60s
                        </span>
                        <button onClick={stopRecording}
                          aria-label="Stop recording"
                          className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 hover:text-red-800 px-2 py-1 rounded-full hover:bg-red-100 transition-colors">
                          <Square size={10} fill="currentColor" /> Stop
                        </button>
                      </>
                    ) : (
                      <>
                        <Loader2 size={12} className="text-[#CA922B] animate-spin shrink-0" aria-hidden />
                        <span className="text-xs text-[#3A1F0E]/60 italic">Turning your voice into text…</span>
                      </>
                    )}
                  </div>
                )}

                {/* Mic denied fallback */}
                {voiceState === "denied" && (
                  <div aria-live="polite" className="mb-3 max-w-3xl mx-auto px-4 py-2 bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-2xl">
                    <p className="text-xs text-[#3A1F0E]/60">
                      <MicOff size={10} className="inline mr-1" aria-hidden />
                      Microphone access was denied. You can still type your question below.
                    </p>
                  </div>
                )}

                <div className="mb-2 flex max-w-3xl flex-wrap items-center gap-2 mx-auto">
                  {([[
                    "community", "Big Cousin"
                  ], ["professor", "Professor"], ["business_manager", "Business Manager"], ["best_friend", "Best Friend"]] as const).map(([value, label]) => (
                    <button key={value} onClick={() => setKinfolkMode(value)} className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${kinfolkMode === value ? "bg-[#2B1507] text-white" : "border border-[#3A1F0E]/10 bg-white text-[#3A1F0E]/50"}`}>{label}</button>
                  ))}
                  <div className="ml-auto flex items-center gap-3">
                    <label className="flex items-center gap-2 text-[11px] text-[#3A1F0E]/55" title="Only this account can use this memory. You can forget it any time.">
                      <input type="checkbox" checked={rememberThis} onChange={(event) => setRememberThis(event.target.checked)} />
                      Remember this privately
                    </label>
                    <button onClick={() => setShowMemoryManager(true)} className="text-[11px] font-bold text-[#CA922B] hover:underline">Manage</button>
                  </div>
                </div>

                {imageUrls.length > 0 && <div className="mb-2 flex max-w-3xl gap-2 mx-auto">
                  {imageUrls.map((url) => <div key={url} className="relative"><img src={url} alt="Ready to ask Kinfolk about" className="h-20 w-20 rounded-xl object-cover" /><button onClick={() => setImageUrls((items) => items.filter((item) => item !== url))} aria-label="Remove image" className="absolute -right-1 -top-1 rounded-full bg-[#2B1507] p-1 text-white"><X size={11} /></button></div>)}
                </div>}
                {imageError && <p className="mb-2 max-w-3xl mx-auto text-xs text-red-600">{imageError}</p>}

                <div className="flex items-end gap-2 max-w-3xl mx-auto">
                  <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadKinfolkImage(file); event.target.value = ""; }} />
                  {isLoggedIn && <button data-testid="kinfolk-image-upload" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage || imageUrls.length >= 2 || sending} aria-label="Add an image" title="Ask Kinfolk about an image" className="w-11 h-11 rounded-2xl bg-[#FAF6EF] hover:bg-[#CA922B]/10 border border-[#3A1F0E]/10 text-[#3A1F0E]/50 hover:text-[#CA922B] flex items-center justify-center disabled:opacity-40 shrink-0">{uploadingImage ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={16} />}</button>}
                  {/* Microphone button */}
                  {isLoggedIn && (
                    <button
                      onClick={handleVoiceTap}
                      aria-label={voiceState === "recording" ? "Stop recording" : "Speak to Kinfolk"}
                      aria-pressed={voiceState === "recording"}
                      disabled={voiceState === "processing" || voiceState === "requesting"}
                      title={voiceState === "recording" ? "Stop recording" : "Speak to Kinfolk"}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                        voiceState === "recording"
                          ? "bg-red-500 hover:bg-red-600 text-white"
                          : voiceState === "processing" || voiceState === "requesting"
                          ? "bg-[#FAF6EF] text-[#3A1F0E]/30 cursor-wait"
                          : "bg-[#FAF6EF] hover:bg-[#CA922B]/10 text-[#3A1F0E]/50 hover:text-[#CA922B] border border-[#3A1F0E]/10 hover:border-[#CA922B]/30"
                      }`}>
                      {voiceState === "recording"
                        ? <Square size={15} fill="white" className="text-white" />
                        : voiceState === "processing" || voiceState === "requesting"
                        ? <Loader2 size={15} className="animate-spin" />
                        : <Mic size={15} />}
                    </button>
                  )}

                  <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
                    data-testid="kinfolk-chat-input"
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Kinfolk anything — businesses, safety, community, recommendations…"
                    rows={1}
                    className="flex-1 resize-none bg-[#FAF6EF] border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm text-[#3A1F0E] placeholder-[#3A1F0E]/30 focus:outline-none focus:border-[#CA922B]/50 transition-colors"
                    style={{ maxHeight: "120px", overflowY: "auto" }}
                    onInput={e => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 120) + "px"; }}
                  />

                  <button
                    onClick={() => send(input)}
                    disabled={!input.trim() || sending || uploadingImage}
                    data-testid="kinfolk-send"
                    className="w-11 h-11 rounded-2xl bg-[#CA922B] hover:bg-[#B38024] disabled:opacity-40 flex items-center justify-center transition-colors shrink-0">
                    <Send size={16} className="text-white" />
                  </button>
                </div>
                <p className="text-center text-[10px] text-[#3A1F0E]/25 mt-2">
                  {isLoggedIn ? "Enter to send · Shift+Enter for new line · Add up to 2 images · Memory is opt-in" : "Enter to send · Shift+Enter for new line"}
                </p>
                <DisclaimerBanner type="ai" className="mt-2 mx-auto max-w-3xl" />
                {showMemoryManager && <KinfolkMemoryManager onClose={() => setShowMemoryManager(false)} />}
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
