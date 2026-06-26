import { useState } from "react";

const PRIMARY = "#C4622D";
const GOLD = "#C9922B";
const BG = "#1A0E07";
const CARD = "#2A1508";
const BORDER = "#3D2010";
const TEXT = "#FBF7F0";
const MUTED = "#A08070";
const GREEN = "#2D7A4F";
const RED = "#DC2626";
const BLUE = "#3B6EA5";

const CAPTIONS = [
  "Must Support", "It's a Vibe", "Hidden Gem", "Great Hospitality",
  "Above & Beyond", "Community Favorite", "Worth Every Visit",
  "Family Friendly", "Solo Friendly", "Black Excellence", "I'll Be Back",
];

const CONCERN_TYPES = [
  "Customer service", "Product or service quality", "Long wait time",
  "Pricing", "Communication", "Cleanliness", "Safety concern",
  "Accessibility", "Other",
];

const IMPROVEMENTS = [
  "Better communication", "Faster service", "More appointment availability",
  "Expanded menu", "Additional staff", "Extended hours", "Nothing — they were great!",
];

const SAFETY_TYPES = ["Safety concern"];

const ROUTING_INFO = {
  private: {
    icon: "🔒", label: "Private first — 72-hour response window",
    color: "#4ADE80", bg: "#2D7A4F12", border: "#2D7A4F35",
    body: "Your feedback goes privately to the business first. They have 72 hours to respond, apologize, or make it right. You'll be notified and can then choose to post it publicly, keep it private, or mark it resolved.",
  },
  moderation: {
    icon: "📋", label: "Moderation review — community guidelines apply",
    color: "#FCD34D", bg: "#D9770612", border: "#D9770635",
    body: "Your feedback goes to our moderation team first — not instantly public. If it follows community guidelines, it can be posted. The business is notified and can respond publicly, but does not get the private resolution window.",
  },
  priority: {
    icon: "⚠️", label: "Priority moderation review",
    color: "#C4B5FD", bg: "#7C3AED12", border: "#7C3AED35",
    body: "This type of concern goes to moderation immediately for review, regardless of your selection above. The business can still respond publicly, but the platform reviews it before anything posts.",
  },
};

const RECOMMEND_OPTS = ["Definitely", "Probably", "Maybe", "Probably Not", "Definitely Not"];
const RETURN_OPTS = ["Absolutely", "Yes", "Maybe", "Probably Not", "No"];
const CONCERN_LEVELS = ["No concerns", "Minor concern", "Significant concern"];

interface SurveyData {
  overallRating: number;
  recommend: string;
  wouldReturn: string;
  concernLevel: string;
  captions: string[];
  concernTypes: string[];
  businessResponse: string;
  whatHappened: string;
  improvements: string[];
}

const EMPTY: SurveyData = {
  overallRating: 0, recommend: "", wouldReturn: "", concernLevel: "",
  captions: [], concernTypes: [], businessResponse: "",
  whatHappened: "", improvements: [],
};

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

function StarBlock({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 4 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 40, lineHeight: 1, color: n <= (hover || value) ? "#D4873A" : BORDER, transition: "color 0.12s" }}>
          ★
        </button>
      ))}
    </div>
  );
}

function Chip({ label, selected, onSelect, color, disabled }: { label: string; selected: boolean; onSelect: () => void; color?: string; disabled?: boolean }) {
  const c = color ?? PRIMARY;
  return (
    <button onClick={disabled ? undefined : onSelect}
      style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${selected ? c : BORDER}`, backgroundColor: selected ? c : CARD, color: selected ? TEXT : disabled ? BORDER : MUTED, fontSize: 13, fontWeight: 500, cursor: disabled ? "default" : "pointer", transition: "all 0.15s", fontFamily: "inherit", opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left", fontFamily: "inherit" }}>
      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? PRIMARY : BORDER}`, backgroundColor: checked ? PRIMARY : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
        {checked && <span style={{ color: TEXT, fontSize: 11, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ color: checked ? TEXT : MUTED, fontSize: 13, lineHeight: 1.5 }}>{label}</span>
    </button>
  );
}

const ratingLabel = (r: number) => ["", "Fair", "Okay", "Good", "Great", "Excellent"][r] ?? "";

export function BlackOwnedSurvey() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<SurveyData>({ ...EMPTY });

  const isSignificant = data.concernLevel === "Significant concern";
  const hasConcern = data.concernLevel === "Minor concern" || data.concernLevel === "Significant concern";

  // Significant concern skips Community Captions and goes straight to Concern Details
  const STEPS = isSignificant
    ? ["Rate & Recommend", "Concern Details", "How to Earn 5 Stars"]
    : hasConcern
      ? ["Rate & Recommend", "Community Captions", "Concern Details", "How to Earn 5 Stars"]
      : ["Rate & Recommend", "Community Captions", "How to Earn 5 Stars"];

  const showCaptions = !isSignificant && step === 1;
  const showConcernDetails = hasConcern && (isSignificant ? step === 1 : step === 2);
  const isImprovementStep = step === STEPS.length - 1 && step > 0;

  const canNext = () => {
    if (step === 0) return data.overallRating > 0 && data.recommend !== "" && data.wouldReturn !== "" && data.concernLevel !== "";
    if (showCaptions) return data.captions.length > 0;
    if (showConcernDetails) return data.concernTypes.length > 0 && data.businessResponse !== "" && data.whatHappened.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setSubmitted(true);
  };

  const reset = () => { setStep(0); setSubmitted(false); setData({ ...EMPTY }); };

  const charLen = data.whatHappened.length;
  const isSafetyConcern = SAFETY_TYPES.some(t => data.concernTypes.includes(t));
  const routingKey: keyof typeof ROUTING_INFO | "" = isSafetyConcern ? "priority" : data.businessResponse === "Yes" ? "private" : data.businessResponse === "No" ? "moderation" : "";
  const routing = routingKey ? ROUTING_INFO[routingKey] : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D0704", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
      <div style={{ width: 390, minHeight: 700, backgroundColor: BG, borderRadius: 24, border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0 }}>Community Check-In</p>
            <p style={{ color: GOLD, fontSize: 12, margin: "2px 0 0", fontWeight: 600 }}>Soul Food Kitchen · Black-Owned ✊🏾</p>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: GOLD + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⭐</div>
        </div>

        {/* Step bar */}
        {!submitted && (
          <div style={{ display: "flex", alignItems: "center", padding: "14px 24px 10px", gap: 4 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ height: 8, borderRadius: 4, width: i === step ? 28 : 8, backgroundColor: i <= step ? PRIMARY : BORDER, transition: "all 0.3s" }} />
                {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: i < step ? PRIMARY : BORDER }} />}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 8px" }}>

          {/* ── SUBMITTED ── */}
          {submitted ? (
            <div style={{ textAlign: "center", padding: "28px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
              <p style={{ color: TEXT, fontSize: 24, fontWeight: 800, margin: 0 }}>Check-In Submitted</p>
              <p style={{ color: GOLD, fontSize: 13, fontWeight: 600, margin: 0 }}>Soul Food Kitchen</p>
              {data.captions.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", maxWidth: 280 }}>
                  {data.captions.map(c => (
                    <span key={c} style={{ padding: "4px 12px", borderRadius: 16, backgroundColor: GOLD + "20", border: `1px solid ${GOLD}40`, color: GOLD, fontSize: 12, fontWeight: 600 }}>✦ {c}</span>
                  ))}
                </div>
              )}

              {/* Routing outcome — only shown if a concern was reported */}
              {hasConcern && routingKey && (
                <div style={{ width: "100%", maxWidth: 300, backgroundColor: routing!.bg, border: `1px solid ${routing!.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", textAlign: "left" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{routing!.icon}</span>
                  <div>
                    <p style={{ color: routing!.color, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>{routing!.label}</p>
                    <p style={{ color: routing!.color, fontSize: 11, margin: 0, lineHeight: 1.6, opacity: 0.85 }}>
                      {routingKey === "private" && "The business has 72 hours to respond. You'll be notified when they do."}
                      {routingKey === "moderation" && "Our team will review your concern before it's posted publicly."}
                      {routingKey === "priority" && "Our team is reviewing this now. The business will be notified after review."}
                    </p>
                  </div>
                </div>
              )}

              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0, maxWidth: 280 }}>
                Your voice helps our community find, celebrate, and support Black-owned businesses. Every check-in matters.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, backgroundColor: PRIMARY + "15", border: `1px solid ${PRIMARY}30` }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>+15 community points earned</span>
              </div>
              <button onClick={reset} style={{ marginTop: 4, padding: "12px 40px", borderRadius: 14, backgroundColor: GREEN, border: "none", color: TEXT, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Done</button>
            </div>

          ) : step === 0 ? (
            /* ── STEP 0: RATE & RECOMMEND ── */
            <div>
              {/* Mission banner */}
              <div style={{ backgroundColor: GOLD + "12", border: `1px solid ${GOLD}28`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>✊🏾</span>
                <p style={{ color: GOLD, fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
                  Our goal isn't to collect complaints — it's to help great businesses become even better while celebrating the ones our community loves.
                </p>
              </div>

              {/* Stars */}
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, textAlign: "center", marginBottom: 4 }}>Overall Experience</p>
              <StarBlock value={data.overallRating} onChange={(v) => setData({ ...data, overallRating: v })} />
              {data.overallRating > 0 && (
                <p style={{ color: GOLD, fontSize: 14, fontWeight: 700, textAlign: "center", marginBottom: 16 }}>{ratingLabel(data.overallRating)}</p>
              )}
              {data.overallRating === 0 && <div style={{ marginBottom: 16 }} />}

              <div style={{ height: 1, backgroundColor: BORDER, margin: "8px 0 18px" }} />

              {/* Recommend */}
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Would you recommend this business?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {RECOMMEND_OPTS.map((o) => (
                  <Chip key={o} label={o} selected={data.recommend === o} onSelect={() => setData({ ...data, recommend: o })}
                    color={o === "Definitely" ? GREEN : o === "Definitely Not" ? RED : PRIMARY} />
                ))}
              </div>

              {/* Would return */}
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Would you return?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                {RETURN_OPTS.map((o) => (
                  <Chip key={o} label={o} selected={data.wouldReturn === o} onSelect={() => setData({ ...data, wouldReturn: o })}
                    color={o === "Absolutely" ? GREEN : o === "No" ? RED : PRIMARY} />
                ))}
              </div>

              {/* Concern level */}
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Did you experience a concern?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CONCERN_LEVELS.map((o) => (
                  <Chip key={o} label={o} selected={data.concernLevel === o}
                    onSelect={() => setData({ ...data, concernLevel: o, concernTypes: [], businessResponse: "", whatHappened: "" })}
                    color={o === "No concerns" ? GREEN : o === "Significant concern" ? RED : "#D97706"} />
                ))}
              </div>
              {data.concernLevel === "No concerns" && (
                <p style={{ color: GREEN, fontSize: 12, fontWeight: 600, marginTop: 8 }}>✓ Great! Tap Next to share your community captions.</p>
              )}
              {data.concernLevel !== "" && data.concernLevel !== "No concerns" && (
                <p style={{ color: "#D97706", fontSize: 12, fontWeight: 500, marginTop: 8 }}>We'll ask one follow-up so the business can make it right.</p>
              )}
            </div>

          ) : showCaptions ? (
            /* ── STEP 1: COMMUNITY CAPTIONS (skipped for Significant concern) ── */
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Community Captions</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>Choose up to 3 that describe this business</p>
              <div style={{ backgroundColor: PRIMARY + "10", border: `1px solid ${PRIMARY}25`, borderRadius: 12, padding: "8px 12px", marginBottom: 16, display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontSize: 14 }}>✦</span>
                <p style={{ color: PRIMARY, fontSize: 11, fontWeight: 600, margin: 0 }}>
                  {data.captions.length}/3 selected — {data.captions.length === 0 ? "pick at least one" : data.captions.length === 3 ? "maximum reached!" : "keep going or tap Next"}
                </p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {CAPTIONS.map((c) => {
                  const isSelected = data.captions.includes(c);
                  const maxReached = data.captions.length >= 3 && !isSelected;
                  return (
                    <Chip key={c} label={c} selected={isSelected} disabled={maxReached}
                      onSelect={() => { if (!maxReached) setData({ ...data, captions: toggle(data.captions, c) }); }}
                      color={GOLD} />
                  );
                })}
              </div>
            </div>

          ) : showConcernDetails ? (
            /* ── CONCERN DETAILS (step 1 for Significant, step 2 for Minor) ── */
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Tell us what happened</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>This stays between you and the business until you decide otherwise</p>

              {/* Policy note */}
              <div style={{ backgroundColor: BLUE + "12", border: `1px solid ${BLUE}28`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16, marginTop: 1 }}>🔄</span>
                <p style={{ color: "#7EB0DD", fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                  The business has an opportunity to respond. If the issue is resolved, you can update or remove your concern. Reports automatically expire after 6 months.
                </p>
              </div>

              {/* Concern checkboxes */}
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>What best describes your concern?</p>
              <p style={{ color: MUTED, fontSize: 12, marginBottom: 10 }}>Check all that apply</p>
              {CONCERN_TYPES.map((t) => (
                <CheckRow key={t} label={t} checked={data.concernTypes.includes(t)} onToggle={() => setData({ ...data, concernTypes: toggle(data.concernTypes, t) })} />
              ))}

              <div style={{ height: 1, backgroundColor: BORDER, margin: "16px 0" }} />

              {/* Business response */}
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Would you like the business to have an opportunity to respond before your concern becomes public?</p>
              <p style={{ color: MUTED, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>Your choice determines how this concern is handled — see the explanation below.</p>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {["Yes", "No"].map((o) => (
                  <button key={o} onClick={() => setData({ ...data, businessResponse: o })}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: `1px solid ${data.businessResponse === o ? (o === "Yes" ? GREEN : RED) : BORDER}`, backgroundColor: data.businessResponse === o ? (o === "Yes" ? GREEN : RED) : CARD, color: data.businessResponse === o ? TEXT : MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                    {o}
                  </button>
                ))}
              </div>

              {/* Routing info card — shown once a choice is made, or always for safety concerns */}
              {routing && (
                <div style={{ backgroundColor: routing.bg, border: `1px solid ${routing.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{routing.icon}</span>
                  <div>
                    <p style={{ color: routing.color, fontSize: 12, fontWeight: 700, margin: "0 0 5px" }}>{routing.label}</p>
                    <p style={{ color: routing.color, fontSize: 11, margin: 0, lineHeight: 1.65, opacity: 0.9 }}>{routing.body}</p>
                    {isSafetyConcern && data.businessResponse !== "" && (
                      <p style={{ color: routing.color, fontSize: 11, margin: "6px 0 0", fontWeight: 600, opacity: 0.85 }}>
                        Your selection above is noted, but safety-related concerns are always reviewed by the platform first.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {!routing && (
                <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                    Select Yes or No above to see exactly how your concern will be handled before you submit.
                  </p>
                </div>
              )}

              {/* Description */}
              <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Tell us what happened.</p>
              <p style={{ color: MUTED, fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>Focus on what you personally experienced or observed. Up to 500 characters.</p>
              <textarea
                placeholder="Describe what happened..."
                value={data.whatHappened}
                maxLength={500}
                onChange={(e) => setData({ ...data, whatHappened: e.target.value })}
                style={{ width: "100%", minHeight: 110, padding: 12, borderRadius: 12, border: `1px solid ${charLen >= 100 ? GREEN : BORDER}`, backgroundColor: CARD, color: TEXT, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <span style={{ color: charLen >= 100 ? GREEN : MUTED, fontSize: 11 }}>{charLen >= 100 ? "✓ Good detail" : `${charLen} characters`}</span>
                <span style={{ color: MUTED, fontSize: 11 }}>{charLen}/500</span>
              </div>
            </div>

          ) : (
            /* ── FINAL STEP: HOW TO EARN 5 STARS ── */
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>How can this business earn your 5-star support?</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>Instead of ending with criticism — what could they do to improve your experience?</p>

              <div style={{ backgroundColor: GOLD + "10", border: `1px solid ${GOLD}25`, borderRadius: 12, padding: "10px 14px", marginBottom: 18, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 16 }}>💡</span>
                <p style={{ color: GOLD, fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
                  This gives business owners actionable feedback to grow — select as many as apply, or "Nothing — they were great!" to celebrate excellence.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {IMPROVEMENTS.map((imp) => {
                  const isGreat = imp === "Nothing — they were great!";
                  const isSelected = data.improvements.includes(imp);
                  return (
                    <button key={imp} onClick={() => {
                      if (isGreat) {
                        setData({ ...data, improvements: isSelected ? [] : ["Nothing — they were great!"] });
                      } else {
                        const withoutGreat = toggle(data.improvements.filter(v => v !== "Nothing — they were great!"), imp);
                        setData({ ...data, improvements: withoutGreat });
                      }
                    }}
                      style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 12, border: `1px solid ${isSelected ? (isGreat ? GOLD : PRIMARY) : BORDER}`, backgroundColor: isSelected ? (isGreat ? GOLD + "18" : PRIMARY + "15") : CARD, cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all 0.15s", marginBottom: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, border: `2px solid ${isSelected ? (isGreat ? GOLD : PRIMARY) : BORDER}`, backgroundColor: isSelected ? (isGreat ? GOLD : PRIMARY) : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isSelected && <span style={{ color: TEXT, fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ color: isSelected ? TEXT : MUTED, fontSize: 13, fontWeight: isGreat ? 700 : 400 }}>{isGreat ? "⭐ " : ""}{imp}</span>
                    </button>
                  );
                })}
              </div>

              {data.overallRating > 0 && (
                <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 12, backgroundColor: CARD, border: `1px solid ${BORDER}` }}>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Your rating summary</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span style={{ color: "#D4873A", fontSize: 16 }}>{"★".repeat(data.overallRating)}{"☆".repeat(5 - data.overallRating)}</span>
                    <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{ratingLabel(data.overallRating)}</span>
                    {data.captions.slice(0, 2).map(c => (
                      <span key={c} style={{ padding: "2px 8px", borderRadius: 10, backgroundColor: GOLD + "20", color: GOLD, fontSize: 11, fontWeight: 600 }}>✦ {c}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{ display: "flex", gap: 10, padding: "14px 20px 20px", borderTop: `1px solid ${BORDER}` }}>
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                style={{ padding: "14px 20px", borderRadius: 14, border: `1px solid ${BORDER}`, backgroundColor: "transparent", color: TEXT, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Back
              </button>
            )}
            <button onClick={handleNext} disabled={!canNext()}
              style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", backgroundColor: canNext() ? (isImprovementStep ? GREEN : PRIMARY) : BORDER, color: canNext() ? TEXT : MUTED, fontSize: 15, fontWeight: 700, cursor: canNext() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "background-color 0.2s" }}>
              {isImprovementStep ? "Submit Check-In ✓" : "Next →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
