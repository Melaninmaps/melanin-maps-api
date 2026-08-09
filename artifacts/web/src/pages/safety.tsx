import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetCurrentAuthUser } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, AlertTriangle, Radio, Users, MapPin, Phone, ChevronRight,
  X, CheckCircle, Loader2, Eye, EyeOff, Navigation, Flag, Building2,
  Heart, BookOpen, AlertCircle, Star, Clock
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;

// ── Report Types ───────────────────────────────────────────────────────────
type ReportSheet = "none" | "safety" | "police" | "space" | "experience";

const SAFETY_TYPES = [
  { value: "Safety Concern", label: "Safety Concern", desc: "Suspicious activity, threats, crime" },
  { value: "Sundown Town Warning", label: "Sundown Town Warning", desc: "Historical or active restricted area" },
  { value: "Discrimination", label: "Discrimination", desc: "Race-based discrimination or profiling" },
  { value: "Business Update", label: "Business Update", desc: "Safety-related business change" },
  { value: "Community Resource", label: "Community Resource", desc: "Share a helpful resource" },
  { value: "Positive Safety Tip", label: "Positive Safety Tip", desc: "Share a welcoming place or experience" },
];

const POLICE_TYPES = [
  { value: "Police Stop/Questioning", label: "Police Stop / Questioning" },
  { value: "ICE Activity", label: "ICE Activity" },
  { value: "Racial Profiling", label: "Racial Profiling" },
  { value: "Excessive Force/Misconduct", label: "Excessive Force / Misconduct" },
  { value: "Checkpoint/Roadblock", label: "Checkpoint / Roadblock" },
  { value: "Other Encounter", label: "Other Encounter" },
];

const SPACE_CATEGORIES = [
  "Restaurant / Café", "Retail Store", "Venue / Club", "Entertainment", "Hotel / Stay", "Other",
];

const SPACE_CONCERNS = [
  "Racial Profiling", "Hostile Staff", "Unsafe Environment", "Discrimination", "Price Gouging", "Other",
];

const EXPERIENCE_CHIPS = [
  "I felt unsafe", "I was followed", "I was ignored or dismissed", "Staff was rude or hostile",
  "I felt racially profiled", "I felt welcomed", "I felt seen and respected",
  "The space felt inclusive", "I'd go back", "I'd warn others", "Something else happened",
];

// Context-specific spoken severity options — map to internal API severity values
const SEVERITY_GENERAL = [
  { label: "Something felt off", desc: "Uncomfortable, suspicious, or something the community should know", value: "low" },
  { label: "I felt unsafe", desc: "Threatening behavior, harassment, or discriminatory treatment", value: "medium" },
  { label: "I needed to leave or get help", desc: "Escalating threat, followed, physical confrontation, or needed assistance", value: "high" },
  { label: "Someone could be in immediate danger", desc: "Active threat, violence, weapon, or urgent danger to others", value: "critical" },
];

const SEVERITY_SUNDOWN = [
  { label: "Sharing historical or local context", desc: "Contributing history or local knowledge, not a current incident", value: "low" },
  { label: "Recent experiences made me concerned", desc: "Recent community experiences or patterns worth reviewing", value: "medium" },
  { label: "I felt targeted or unsafe here", desc: "Personal or witnessed incident involving fear, discrimination, or threats", value: "high" },
  { label: "There may be an immediate danger", desc: "Active or recent threat requiring urgent review", value: "critical" },
];

const SEVERITY_POLICE = [
  { label: "The interaction concerned me", desc: "Inappropriate questioning, unusual stop, or troubling officer behavior", value: "low" },
  { label: "I felt targeted or unsafe", desc: "Racial profiling, discriminatory questioning, or intimidation", value: "medium" },
  { label: "Force, detention, or serious misconduct occurred", desc: "Excessive force, unlawful detention, physical misconduct, or serious rights violation — routed to priority review", value: "high" },
  { label: "There is an immediate safety threat", desc: "Active dangerous encounter; someone may be seriously harmed", value: "critical" },
];

// ── General Safety Report Form ─────────────────────────────────────────────
function SafetyReportForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/reports`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: type, targetType: "neighborhood", targetName: `${neighborhood ? neighborhood + ", " : ""}${city}`, description, severity: severity || "medium" }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
      else { toast({ title: "Could not submit", description: "Please try again.", variant: "destructive" }); }
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <p className="font-bold text-[#2B1507] text-lg">Report submitted</p>
      <p className="text-sm text-[#3A1F0E]/60 mt-1">Your report is under review. Thank you for keeping the community informed.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {step === 1 && (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Report Type</p>
            <div className="space-y-2">
              {SAFETY_TYPES.map(t => (
                <button key={t.value} onClick={() => setType(t.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                    type === t.value ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white hover:border-[#CA922B]/30"
                  }`}>
                  <p className="font-bold text-sm text-[#2B1507]">{t.label}</p>
                  <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <button disabled={!type} onClick={() => setStep(2)}
            className="w-full py-3 bg-[#CA922B] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-[#B38024] transition-colors">
            Next
          </button>
        </>
      )}
      {step === 2 && (
        <>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">How serious is this?</p>
            <div className="space-y-2">
              {(type === "Sundown Town Warning" ? SEVERITY_SUNDOWN : SEVERITY_GENERAL).map(opt => (
                <button key={opt.value} onClick={() => setSeverity(opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                    severity === opt.value ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white hover:border-[#CA922B]/30"
                  }`}>
                  <p className="font-bold text-sm text-[#2B1507]">{opt.label}</p>
                  <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 block mb-2">City *</label>
            <input value={city} onChange={e => setCity(e.target.value)} placeholder="City, State"
              className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 block mb-2">Neighborhood (optional)</label>
            <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Neighborhood or street"
              className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 block mb-2">Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Describe what happened..."
              className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] resize-none" />
          </div>
          <button onClick={() => setIsAnonymous(a => !a)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border transition-colors ${isAnonymous ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white"}`}>
            {isAnonymous ? <EyeOff className="w-4 h-4 text-[#CA922B]" /> : <Eye className="w-4 h-4 text-[#3A1F0E]/40" />}
            <div className="text-left">
              <p className="text-sm font-bold text-[#2B1507]">{isAnonymous ? "Anonymous report" : "Non-anonymous report"}</p>
              <p className="text-xs text-[#3A1F0E]/50">{isAnonymous ? "Your identity is protected" : "Your name may be visible to moderators"}</p>
            </div>
          </button>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-[#3A1F0E]/10 rounded-2xl text-sm font-bold text-[#3A1F0E]/60 hover:bg-[#FAF6EF]">Back</button>
            <button disabled={!city || !severity || submitting} onClick={submit}
              className="flex-2 flex-1 py-3 bg-[#CA922B] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-[#B38024] flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Submit Report
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Police / ICE Encounter Form ────────────────────────────────────────────
function PoliceReportForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [encounterType, setEncounterType] = useState("");
  const [severity, setSeverity] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (!description || description.length < 10) { toast({ title: "Please provide a description (min 10 chars)", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/reports`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "police", encounterType, targetType: "neighborhood", targetName: `${neighborhood ? neighborhood + ", " : ""}${city}`, description, severity: severity || "medium" }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
      else toast({ title: "Could not submit", variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <p className="font-bold text-[#2B1507] text-lg">Encounter reported</p>
      <p className="text-sm text-[#3A1F0E]/60 mt-1">This helps the community stay informed and protected. Your report has been received.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">This information helps keep the community informed. Reports are reviewed by our moderation team.</p>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Encounter Type</p>
        <div className="space-y-2">
          {POLICE_TYPES.map(t => (
            <button key={t.value} onClick={() => setEncounterType(t.value)}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${encounterType === t.value ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white hover:border-[#CA922B]/30"}`}>
              <p className="font-bold text-sm text-[#2B1507]">{t.label}</p>
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">How serious is this?</p>
        <div className="space-y-2">
          {SEVERITY_POLICE.map(opt => (
            <button key={opt.value} onClick={() => setSeverity(opt.value)}
              className={`w-full text-left px-4 py-3 rounded-2xl border transition-colors ${
                severity === opt.value ? "border-[#DC2626] bg-[#DC2626]/5" : "border-[#3A1F0E]/10 bg-white hover:border-[#DC2626]/30"
              }`}>
              <p className="font-bold text-sm text-[#2B1507]">{opt.label}</p>
              <p className="text-xs text-[#3A1F0E]/50 mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="City, State *"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Neighborhood or cross street (optional)"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <div>
        <label className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 block mb-2">What happened? *</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
          placeholder="Describe the encounter in detail (min 10 characters)..."
          className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] resize-none" />
        <p className="text-[10px] text-[#3A1F0E]/35 mt-1">{description.length} characters</p>
      </div>
      <button onClick={() => setIsAnonymous(a => !a)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border ${isAnonymous ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white"}`}>
        {isAnonymous ? <EyeOff className="w-4 h-4 text-[#CA922B]" /> : <Eye className="w-4 h-4 text-[#3A1F0E]/40" />}
        <div className="text-left">
          <p className="text-sm font-bold text-[#2B1507]">{isAnonymous ? "Anonymous report" : "Non-anonymous"}</p>
          <p className="text-xs text-[#3A1F0E]/50">{isAnonymous ? "Your identity is protected" : "Your name visible to moderators"}</p>
        </div>
      </button>
      <button disabled={!encounterType || !city || !severity || description.length < 10 || submitting} onClick={submit}
        className="w-full py-3 bg-[#DC2626] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-red-700 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
        Submit Encounter Report
      </button>
    </div>
  );
}

// ── Unsafe Space Form ──────────────────────────────────────────────────────
function SpaceReportForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [spaceName, setSpaceName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [concerns, setConcerns] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleConcern = (c: string) => setConcerns(cs => cs.includes(c) ? cs.filter(x => x !== c) : [...cs, c]);

  const submit = async () => {
    if (description.length < 10) { toast({ title: "Please describe what happened (min 10 chars)", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/space-reports`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spaceName, address, city, category, concernTypes: concerns, description, isAnonymous }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
      else toast({ title: "Could not submit", variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <p className="font-bold text-[#2B1507] text-lg">Space reported</p>
      <p className="text-sm text-[#3A1F0E]/60 mt-1">3 or more reports trigger a community warning. Thank you for keeping us safe.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Business or Venue Type</p>
        <div className="grid grid-cols-2 gap-2">
          {SPACE_CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold text-left border transition-colors ${category === c ? "border-[#CA922B] bg-[#CA922B]/8 text-[#CA922B]" : "border-[#3A1F0E]/10 bg-white text-[#3A1F0E]/60 hover:border-[#CA922B]/30"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <input value={spaceName} onChange={e => setSpaceName(e.target.value)} placeholder="Business or venue name *"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Address (optional)"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="City, State *"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">What happened? (select all that apply)</p>
        <div className="flex flex-wrap gap-2">
          {SPACE_CONCERNS.map(c => (
            <button key={c} onClick={() => toggleConcern(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${concerns.includes(c) ? "bg-[#CA922B] text-white border-[#CA922B]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#CA922B]/40"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
        placeholder="Describe what happened (min 10 characters) *"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] resize-none" />
      <button onClick={() => setIsAnonymous(a => !a)}
        className={`flex items-center gap-3 w-full px-4 py-3 rounded-2xl border ${isAnonymous ? "border-[#CA922B] bg-[#CA922B]/8" : "border-[#3A1F0E]/10 bg-white"}`}>
        {isAnonymous ? <EyeOff className="w-4 h-4 text-[#CA922B]" /> : <Eye className="w-4 h-4 text-[#3A1F0E]/40" />}
        <p className="text-sm font-bold text-[#2B1507]">{isAnonymous ? "Anonymous report" : "Non-anonymous"}</p>
      </button>
      <button disabled={!spaceName || !city || description.length < 10 || submitting} onClick={submit}
        className="w-full py-3 bg-[#DC2626] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-red-700 flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
        Submit Space Report
      </button>
    </div>
  );
}

// ── Unified Experience Form ────────────────────────────────────────────────
function ExperienceReportForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { toast } = useToast();
  const [chip, setChip] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${BASE}api/safety-tips`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ experienceChip: chip, city, description: description || undefined }),
      });
      if (res.ok) { setSuccess(true); setTimeout(() => { onSuccess(); onClose(); }, 2000); }
      else toast({ title: "Could not submit", variant: "destructive" });
    } catch { toast({ title: "Network error", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  if (success) return (
    <div className="text-center py-8">
      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
      <p className="font-bold text-[#2B1507] text-lg">Experience shared</p>
      <p className="text-sm text-[#3A1F0E]/60 mt-1">Thank you. Your experience helps others in the community.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">What best describes your experience?</p>
        <div className="flex flex-wrap gap-2">
          {EXPERIENCE_CHIPS.map(c => (
            <button key={c} onClick={() => setChip(c)}
              className={`px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${chip === c ? "bg-[#CA922B] text-white border-[#CA922B]" : "bg-white text-[#3A1F0E]/60 border-[#3A1F0E]/10 hover:border-[#CA922B]/40 hover:text-[#CA922B]"}`}>
              {c}
            </button>
          ))}
        </div>
      </div>
      <input value={city} onChange={e => setCity(e.target.value)} placeholder="City, State (optional)"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF]" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
        placeholder="Want to add more detail? (optional)"
        className="w-full border border-[#3A1F0E]/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#CA922B]/50 bg-[#FAF6EF] resize-none" />
      <p className="text-xs text-[#3A1F0E]/40">Your experience is submitted anonymously unless you've turned off anonymous mode in settings.</p>
      <button disabled={!chip || submitting} onClick={submit}
        className="w-full py-3 bg-[#CA922B] text-white rounded-2xl font-bold disabled:opacity-40 hover:bg-[#B38024] flex items-center justify-center gap-2">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
        Share Experience
      </button>
    </div>
  );
}

// ── Report Modal Wrapper ───────────────────────────────────────────────────
function ReportModal({ sheet, onClose }: { sheet: ReportSheet; onClose: () => void }) {
  const { toast } = useToast();
  if (sheet === "none") return null;

  const titles: Record<ReportSheet, string> = {
    none: "",
    safety: "Submit a Safety Report",
    police: "Report Police / ICE Encounter",
    space: "Report an Unsafe Space",
    experience: "Share an Experience",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90dvh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3A1F0E]/8 sticky top-0 bg-white rounded-t-3xl">
          <h2 className="font-serif font-bold text-[#2B1507]">{titles[sheet]}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#FAF6EF] flex items-center justify-center hover:bg-[#3A1F0E]/8">
            <X className="w-4 h-4 text-[#3A1F0E]/60" />
          </button>
        </div>
        <div className="p-5">
          {sheet === "safety" && <SafetyReportForm onClose={onClose} onSuccess={() => toast({ title: "Report submitted. Thank you." })} />}
          {sheet === "police" && <PoliceReportForm onClose={onClose} onSuccess={() => toast({ title: "Encounter reported. Thank you." })} />}
          {sheet === "space" && <SpaceReportForm onClose={onClose} onSuccess={() => toast({ title: "Space report submitted." })} />}
          {sheet === "experience" && <ExperienceReportForm onClose={onClose} onSuccess={() => toast({ title: "Experience shared. Thank you." })} />}
        </div>
      </div>
    </div>
  );
}

// ── Safety Feature Cards ───────────────────────────────────────────────────
type FeatureCard = { icon: React.ElementType; label: string; color: string; bg: string; action?: () => void; href?: string; external?: string };

// ── Main Safety Hub ────────────────────────────────────────────────────────
export default function Safety() {
  const { data: auth } = useGetCurrentAuthUser();
  const [activeSheet, setActiveSheet] = useState<ReportSheet>("none");
  const [alerts, setAlerts] = useState<Array<{id:string; type:string; description?:string; city?:string; createdAt:string; confirmCount:number}>>([]);
  const isAuthenticated = !!(auth?.user);

  useEffect(() => {
    fetch(`${BASE}api/community-alerts/nearby?lat=39.9526&lng=-75.1652&radius=50`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.alerts) setAlerts(d.alerts.slice(0, 5)); })
      .catch(() => {});
  }, []);

  const FEATURE_CARDS: FeatureCard[] = [
    { icon: Radio, label: "Community Intelligence", color: "#CA922B", bg: "#CA922B18", href: "#alerts" },
    { icon: AlertCircle, label: "Submit Safety Tip", color: "#CA922B", bg: "#CA922B18", action: () => setActiveSheet("experience") },
    { icon: Flag, label: "Anonymous Report", color: "#DC2626", bg: "#DC262618", action: () => setActiveSheet("safety") },
    { icon: Users, label: "Report Police / ICE", color: "#DC2626", bg: "#DC262618", action: () => setActiveSheet("police") },
    { icon: Building2, label: "Report Unsafe Space", color: "#7C3AED", bg: "#7C3AED18", action: () => setActiveSheet("space") },
    { icon: Star, label: "Share an Experience", color: "#059669", bg: "#05906918", action: () => setActiveSheet("experience") },
    { icon: BookOpen, label: "Neighborhood Safety", color: "#0891B2", bg: "#0891B218", href: "/rate-neighborhood" },
    { icon: Heart, label: "Mental Health Resources", color: "#EC4899", bg: "#EC489918", href: "/resources" },
    { icon: Navigation, label: "Cultural Heritage Map", color: "#CA922B", bg: "#CA922B18", href: "/map" },
    { icon: Clock, label: "Officer Watch", color: "#6B7280", bg: "#6B728018", href: "/map" },
  ];

  function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "Just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF]">
      {/* Header */}
      <div className="bg-[#2B1507] text-white px-4 pt-8 pb-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl text-white">Safety Hub</h1>
              <p className="text-[#F5EBD8]/60 text-xs">Community-powered, experience-based safety</p>
            </div>
          </div>
          {!isAuthenticated && (
            <div className="mt-4 bg-white/10 rounded-2xl px-4 py-3 flex items-start gap-3">
              <Eye className="w-4 h-4 text-[#CA922B] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">No account needed to report</p>
                <p className="text-xs text-[#F5EBD8]/70 mt-0.5">Every report below is fully anonymous. No sign-in required. Just submit and go.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
        {/* Emergency SOS */}
        <a href="tel:911"
          className="flex items-center gap-4 bg-red-600 text-white rounded-2xl p-4 hover:bg-red-700 transition-colors active:scale-98">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold">Emergency SOS</p>
            <p className="text-xs text-white/70">Tap to call 911 immediately</p>
          </div>
          <ChevronRight className="w-5 h-5 text-white/60" />
        </a>

        {/* Quick Report Buttons */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Quick Report</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Safety Report", desc: "Neighborhood or community concern", sheet: "safety" as ReportSheet, color: "#CA922B" },
              { label: "Police / ICE Encounter", desc: "Report a stop, checkpoint, or encounter", sheet: "police" as ReportSheet, color: "#DC2626" },
              { label: "Unsafe Business", desc: "Report discrimination or unsafe space", sheet: "space" as ReportSheet, color: "#7C3AED" },
              { label: "Share an Experience", desc: "Good or bad — your voice matters", sheet: "experience" as ReportSheet, color: "#059669" },
            ].map(btn => (
              <button key={btn.sheet} onClick={() => setActiveSheet(btn.sheet)}
                className="text-left bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 hover:shadow-sm transition-shadow active:scale-98">
                <div className="w-8 h-8 rounded-xl mb-2 flex items-center justify-center" style={{ backgroundColor: `${btn.color}18` }}>
                  <Flag className="w-4 h-4" style={{ color: btn.color }} />
                </div>
                <p className="font-bold text-sm text-[#2B1507]">{btn.label}</p>
                <p className="text-[10px] text-[#3A1F0E]/50 mt-0.5 leading-snug">{btn.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Community Intelligence / Nearby Alerts */}
        <div id="alerts">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50">Community Intelligence</p>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#CA922B]">
              <Radio className="w-3 h-3" /> Live
            </div>
          </div>
          {alerts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#2B1507]">All clear nearby</p>
              <p className="text-xs text-[#3A1F0E]/50 mt-1">No active community alerts in your area</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map(alert => (
                <div key={alert.id} className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#2B1507] capitalize">{alert.type?.replace(/_/g, " ")}</p>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${alert.confirmCount >= 3 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                          {alert.confirmCount >= 3 ? "Confirmed" : "Possible"}
                        </span>
                      </div>
                      {alert.description && <p className="text-xs text-[#3A1F0E]/60 mt-0.5 line-clamp-2">{alert.description}</p>}
                      <div className="flex items-center gap-2 text-[10px] text-[#3A1F0E]/35 mt-1">
                        <span>{timeAgo(alert.createdAt)}</span>
                        {alert.city && <><span>·</span><span>{alert.city}</span></>}
                        <span>· {alert.confirmCount} confirmed</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Safety Features Grid */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#3A1F0E]/50 mb-3">Safety Features</p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURE_CARDS.map((card, i) => {
              const Icon = card.icon;
              const content = (
                <div className="bg-white rounded-2xl border border-[#3A1F0E]/8 p-4 hover:shadow-sm transition-shadow text-left">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: card.bg }}>
                    <Icon className="w-4 h-4" style={{ color: card.color }} />
                  </div>
                  <p className="font-bold text-xs text-[#2B1507] leading-snug">{card.label}</p>
                </div>
              );
              if (card.action) return <button key={i} onClick={card.action}>{content}</button>;
              if (card.href?.startsWith("http") || card.external) return <a key={i} href={card.external ?? card.href} target="_blank" rel="noopener noreferrer">{content}</a>;
              return <Link key={i} href={card.href ?? "#"}><div className="cursor-pointer">{content}</div></Link>;
            })}
          </div>
        </div>

        {/* Community pledge */}
        <div className="bg-[#2B1507] rounded-2xl p-5 text-center">
          <Shield className="w-8 h-8 text-[#CA922B] mx-auto mb-2" />
          <p className="font-bold text-white text-sm mb-1">We look out for each other</p>
          <p className="text-xs text-[#F5EBD8]/60 leading-relaxed">
            Safety on this platform is community-powered. Every report, tip, and experience you share helps protect someone else.
          </p>
        </div>

        <p className="text-[10px] text-[#3A1F0E]/30 text-center pb-4">
          In a life-threatening emergency, always call 911. Community safety data is experience-based and does not reflect current conditions or official crime statistics.
        </p>
      </div>

      {/* Report Modals */}
      <ReportModal sheet={activeSheet} onClose={() => setActiveSheet("none")} />
    </div>
  );
}
