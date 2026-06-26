import { useState } from "react";

const PRIMARY = "#C4622D";
const BG = "#1A0E07";
const CARD = "#2A1508";
const BORDER = "#3D2010";
const TEXT = "#FBF7F0";
const MUTED = "#A08070";
const GREEN = "#2D7A4F";
const BLUE = "#3B6EA5";
const RED = "#DC2626";

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => onChange(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, fontSize: 26, lineHeight: 1, color: n <= (hover || value) ? "#D4873A" : BORDER, transition: "color 0.15s" }}>★</button>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, selected, onSelect, color }: { label: string; selected: boolean; onSelect: () => void; color?: string }) {
  const activeColor = color ?? PRIMARY;
  return (
    <button onClick={onSelect}
      style={{ padding: "8px 14px", borderRadius: 20, border: `1px solid ${selected ? activeColor : BORDER}`, backgroundColor: selected ? activeColor : CARD, color: selected ? TEXT : MUTED, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit" }}>
      {label}
    </button>
  );
}

function YesNoChip({ label, active, onSelect, color }: { label: string; active: boolean; onSelect: () => void; color: string }) {
  return (
    <button onClick={onSelect}
      style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: `1px solid ${active ? color : BORDER}`, backgroundColor: active ? color : CARD, color: active ? TEXT : MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
      {label}
    </button>
  );
}

function CheckRow({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle}
      style={{ display: "flex", alignItems: "flex-start", gap: 10, width: "100%", background: "none", border: "none", cursor: "pointer", padding: "6px 0", textAlign: "left", fontFamily: "inherit" }}>
      <div style={{
        width: 18, height: 18, borderRadius: 4, border: `2px solid ${checked ? PRIMARY : BORDER}`,
        backgroundColor: checked ? PRIMARY : "transparent", flexShrink: 0, marginTop: 1,
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
      }}>
        {checked && <span style={{ color: TEXT, fontSize: 11, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ color: checked ? TEXT : MUTED, fontSize: 13, lineHeight: 1.5 }}>{label}</span>
    </button>
  );
}

const SERIOUS_INCIDENT_TYPES = [
  "Felt unsafe", "Harassment by another customer", "Threatening behavior",
  "Physical altercation", "Security concern", "I believe I may have experienced discrimination",
];

const GEN_ROUTING_INFO = {
  private: {
    icon: "🔒", label: "Private first — 72-hour response window",
    color: "#4ADE80", bg: "#2D7A4F12", border: "#2D7A4F35",
    body: "Your report goes privately to the business first. They have 72 hours to respond, apologize, or make it right. You'll be notified and can then choose to post it publicly, keep it private, or mark it resolved.",
  },
  moderation: {
    icon: "📋", label: "Moderation review — community guidelines apply",
    color: "#FCD34D", bg: "#D9770612", border: "#D9770635",
    body: "Your report goes to our moderation team first — not instantly public. If it follows community guidelines, it can be posted. The business is notified and can respond publicly, but does not get the private resolution window.",
  },
  priority: {
    icon: "⚠️", label: "Priority moderation review",
    color: "#C4B5FD", bg: "#7C3AED12", border: "#7C3AED35",
    body: "This type of incident goes to moderation immediately for review, regardless of your selection above. The business can still respond publicly, but the platform reviews it before anything posts.",
  },
};

const INCIDENT_CATEGORIES = [
  {
    group: "Customer Service",
    items: ["Staff was rude or dismissive", "Long wait or lack of assistance", "Service was inconsistent", "Refused service", "Other customer service concern"],
  },
  {
    group: "Safety",
    items: ["Felt unsafe", "Harassment by another customer", "Threatening behavior", "Theft or property concern", "Physical altercation", "Security concern"],
  },
  {
    group: "Business Experience",
    items: ["Pricing or billing issue", "Product or service quality issue", "Appointment or reservation problem", "Accessibility concern", "Cleanliness concern"],
  },
  {
    group: "Respect & Inclusion",
    items: ["Felt unwelcome", "Inappropriate comments or language", "Unequal treatment", "Cultural insensitivity", "I believe I may have experienced discrimination", "Other concern"],
  },
];

const INCIDENT_PARTIES = ["Employee", "Manager", "Business Owner", "Another Customer", "Security", "Unknown"];
const SEVERITIES = ["Minor", "Moderate", "Significant", "Serious"];
const REPORTED_OPTS = ["Yes", "No", "I attempted to"];
const RESOLVED_OPTS = ["Completely", "Partially", "No", "Not Applicable"];
const RETURN_OPTS = ["Yes", "Maybe", "No"];

const CATEGORY_QUESTIONS = [
  { label: "Easy to talk to", key: "easyToTalkTo" },
  { label: "Listened to my concerns", key: "listenedToConcerns" },
  { label: "Clean & professional environment", key: "cleanEnvironment" },
  { label: "Respectful of my time", key: "respectfulOfTime" },
];

const STEPS = ["Safety Ratings", "Visit Context", "Comments", "Healthcare Experience"];

interface SurveyData {
  overallSafety: number;
  returnAlone: number;
  wouldRecommend: number;
  timeOfDay: string;
  groupType: string;
  incidentOccurred: boolean | null;
  incidentCategories: string[];
  incidentParties: string[];
  incidentSeverity: string;
  reportedToBusiness: string;
  issueResolved: string;
  wouldReturn: string;
  businessWantsResponse: string;
  incidentDescription: string;
  evidenceLinks: string;
  comments: string;
  categoryRatings: Record<string, number>;
}

const EMPTY: SurveyData = {
  overallSafety: 0, returnAlone: 0, wouldRecommend: 0,
  timeOfDay: "", groupType: "", incidentOccurred: null,
  incidentCategories: [], incidentParties: [], incidentSeverity: "",
  reportedToBusiness: "", issueResolved: "", wouldReturn: "", businessWantsResponse: "",
  incidentDescription: "", evidenceLinks: "",
  comments: "", categoryRatings: {},
};

function toggle(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];
}

export function GeneralSurvey() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<SurveyData>({ ...EMPTY });

  const canNext = () => {
    if (step === 0) return data.overallSafety > 0 && data.returnAlone > 0;
    if (step === 1) return data.timeOfDay !== "" && data.groupType !== "" && data.incidentOccurred !== null;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setSubmitted(true);
  };

  const reset = () => { setStep(0); setSubmitted(false); setData({ ...EMPTY }); };

  const descLen = data.incidentDescription.length;
  const isSeriousIncident = SERIOUS_INCIDENT_TYPES.some(t => data.incidentCategories.includes(t));
  const genRoutingKey: keyof typeof GEN_ROUTING_INFO | "" = isSeriousIncident ? "priority" : data.businessWantsResponse === "Yes" ? "private" : data.businessWantsResponse === "No" ? "moderation" : "";
  const genRouting = genRoutingKey ? GEN_ROUTING_INFO[genRoutingKey] : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0D0704", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', system-ui, sans-serif", padding: "16px" }}>
      <div style={{ width: 390, minHeight: 700, backgroundColor: BG, borderRadius: 24, border: `1px solid ${BORDER}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>

        {/* Header */}
        <div style={{ padding: "18px 20px 14px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0 }}>Rate Safety Experience</p>
            <p style={{ color: MUTED, fontSize: 12, margin: "2px 0 0", fontWeight: 400 }}>City Diner</p>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: BLUE + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🛡️</div>
        </div>

        {/* Info badge */}
        <div style={{ margin: "12px 20px 0", padding: "8px 12px", borderRadius: 12, background: `${BLUE}15`, border: `1px solid ${BLUE}30`, display: "flex", gap: 8, alignItems: "flex-start" }}>
          <span style={{ fontSize: 14, marginTop: 1 }}>ℹ️</span>
          <p style={{ color: "#7EB0DD", fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>Your safety report helps the community discover safer places to visit. All responses are anonymous.</p>
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
          {submitted ? (
            <div style={{ textAlign: "center", padding: "32px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
              <div style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: GREEN + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>✅</div>
              <p style={{ color: TEXT, fontSize: 24, fontWeight: 800, margin: 0 }}>Report Submitted</p>
              <p style={{ color: PRIMARY, fontSize: 13, fontWeight: 600, margin: 0 }}>City Diner</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0 }}>Your experience has been added to the community safety score. Every report helps our community travel smarter and live with confidence.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 20, backgroundColor: PRIMARY + "15", border: `1px solid ${PRIMARY}30` }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>+10 community points earned</span>
              </div>
              <button onClick={reset} style={{ marginTop: 8, padding: "12px 40px", borderRadius: 14, backgroundColor: GREEN, border: "none", color: TEXT, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Done</button>
            </div>

          ) : step === 0 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>How safe did you feel?</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Rate your safety experience at this business</p>
              <div style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                <StarRow label="Overall Safety" value={data.overallSafety} onChange={(v) => setData({ ...data, overallSafety: v })} />
                <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />
                <StarRow label="Comfortable returning alone?" value={data.returnAlone} onChange={(v) => setData({ ...data, returnAlone: v })} />
              </div>
            </div>

          ) : step === 1 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Tell us about your visit</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Context helps surface more accurate safety scores</p>

              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Time of visit</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {["Morning", "Afternoon", "Evening", "Night"].map((t) => <Chip key={t} label={t} selected={data.timeOfDay === t} onSelect={() => setData({ ...data, timeOfDay: t })} />)}
              </div>

              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Who were you with?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {["Solo", "With Partner", "With Friends", "With Family", "With Kids"].map((g) => <Chip key={g} label={g} selected={data.groupType === g} onSelect={() => setData({ ...data, groupType: g })} />)}
              </div>

              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Did an incident occur during your visit?</p>
              <div style={{ display: "flex", gap: 10, marginBottom: data.incidentOccurred ? 20 : 4 }}>
                <YesNoChip label="No" active={data.incidentOccurred === false} onSelect={() => setData({ ...data, incidentOccurred: false, incidentCategories: [], incidentParties: [], incidentSeverity: "", reportedToBusiness: "", issueResolved: "", wouldReturn: "", businessWantsResponse: "", incidentDescription: "", evidenceLinks: "" })} color={GREEN} />
                <YesNoChip label="Yes" active={data.incidentOccurred === true} onSelect={() => setData({ ...data, incidentOccurred: true })} color={RED} />
              </div>

              {/* ─── Incident Detail (only when Yes) ─── */}
              {data.incidentOccurred === true && (
                <div>
                  {/* Platform policy note */}
                  <div style={{ backgroundColor: BLUE + "12", border: `1px solid ${BLUE}28`, borderRadius: 12, padding: "10px 14px", marginBottom: 20, display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontSize: 16, marginTop: 1 }}>🔄</span>
                    <div>
                      <p style={{ color: "#7EB0DD", fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>How reports work on this platform</p>
                      <p style={{ color: "#7EB0DD", fontSize: 11, margin: 0, lineHeight: 1.6, opacity: 0.9 }}>
                        The business receives your report and may respond publicly — to explain, apologize, or share what they've done to address the concern. If you agree the issue is resolved, you can update or remove your report. Reports automatically expire after 6 months unless there's ongoing community concern.
                      </p>
                    </div>
                  </div>

                  {/* What happened */}
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>What best describes what happened?</p>
                  <p style={{ color: MUTED, fontSize: 12, marginBottom: 12 }}>Select all that apply</p>

                  {INCIDENT_CATEGORIES.map((cat) => (
                    <div key={cat.group} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <div style={{ height: 1, flex: 1, backgroundColor: BORDER }} />
                        <p style={{ color: PRIMARY, fontSize: 11, fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{cat.group}</p>
                        <div style={{ height: 1, flex: 1, backgroundColor: BORDER }} />
                      </div>
                      {cat.items.map((item) => (
                        <CheckRow
                          key={item}
                          label={item}
                          checked={data.incidentCategories.includes(item)}
                          onToggle={() => setData({ ...data, incidentCategories: toggle(data.incidentCategories, item) })}
                        />
                      ))}
                    </div>
                  ))}

                  {/* Who was involved */}
                  <div style={{ height: 1, backgroundColor: BORDER, margin: "8px 0 16px" }} />
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Who was involved?</p>
                  {INCIDENT_PARTIES.map((p) => (
                    <CheckRow key={p} label={p} checked={data.incidentParties.includes(p)} onToggle={() => setData({ ...data, incidentParties: toggle(data.incidentParties, p) })} />
                  ))}

                  {/* Severity */}
                  <div style={{ height: 1, backgroundColor: BORDER, margin: "16px 0" }} />
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>How severe was the incident?</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {SEVERITIES.map((s) => (
                      <Chip key={s} label={s} selected={data.incidentSeverity === s}
                        onSelect={() => setData({ ...data, incidentSeverity: s })}
                        color={s === "Serious" ? RED : s === "Significant" ? "#D97706" : PRIMARY}
                      />
                    ))}
                  </div>

                  {/* Reported to business */}
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Did you report the concern to the business?</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {REPORTED_OPTS.map((o) => <Chip key={o} label={o} selected={data.reportedToBusiness === o} onSelect={() => setData({ ...data, reportedToBusiness: o })} />)}
                  </div>

                  {/* Issue resolved */}
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Was the issue resolved during your visit?</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {RESOLVED_OPTS.map((o) => <Chip key={o} label={o} selected={data.issueResolved === o} onSelect={() => setData({ ...data, issueResolved: o })} color={o === "Completely" ? GREEN : PRIMARY} />)}
                  </div>

                  {/* Would return */}
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Would you return if the issue were addressed?</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    {RETURN_OPTS.map((o) => <Chip key={o} label={o} selected={data.wouldReturn === o} onSelect={() => setData({ ...data, wouldReturn: o })} color={o === "Yes" ? GREEN : o === "No" ? RED : PRIMARY} />)}
                  </div>

                  {/* Would you like the business to respond first? */}
                  <div style={{ height: 1, backgroundColor: BORDER, margin: "8px 0 16px" }} />
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Would you like the business to have an opportunity to respond before your report becomes public?</p>
                  <p style={{ color: MUTED, fontSize: 11, marginBottom: 10, lineHeight: 1.5 }}>Your choice determines how this report is handled — see the explanation below.</p>
                  <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                    {["Yes", "No"].map((o) => (
                      <button key={o} onClick={() => setData({ ...data, businessWantsResponse: o })}
                        style={{ flex: 1, padding: "10px 0", borderRadius: 14, border: `1px solid ${data.businessWantsResponse === o ? (o === "Yes" ? GREEN : RED) : BORDER}`, backgroundColor: data.businessWantsResponse === o ? (o === "Yes" ? GREEN : RED) : CARD, color: data.businessWantsResponse === o ? TEXT : MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                        {o}
                      </button>
                    ))}
                  </div>

                  {genRouting ? (
                    <div style={{ backgroundColor: genRouting.bg, border: `1px solid ${genRouting.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 18, display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{genRouting.icon}</span>
                      <div>
                        <p style={{ color: genRouting.color, fontSize: 12, fontWeight: 700, margin: "0 0 5px" }}>{genRouting.label}</p>
                        <p style={{ color: genRouting.color, fontSize: 11, margin: 0, lineHeight: 1.65, opacity: 0.9 }}>{genRouting.body}</p>
                        {isSeriousIncident && data.businessWantsResponse !== "" && (
                          <p style={{ color: genRouting.color, fontSize: 11, margin: "6px 0 0", fontWeight: 600, opacity: 0.85 }}>
                            Your selection above is noted, but safety or discrimination incidents are always reviewed by the platform first.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", marginBottom: 18 }}>
                      <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.6 }}>
                        Select Yes or No above to see exactly how your report will be handled before you submit.
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div style={{ height: 1, backgroundColor: BORDER, margin: "8px 0 16px" }} />
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Please describe what happened.</p>
                  <p style={{ color: MUTED, fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>
                    Describe the events as accurately as possible — what occurred, where it happened, and who was involved. Focus on what you personally experienced or observed.
                  </p>
                  <textarea
                    placeholder="500–1,000 characters recommended..."
                    value={data.incidentDescription}
                    onChange={(e) => setData({ ...data, incidentDescription: e.target.value.slice(0, 1000) })}
                    style={{ width: "100%", minHeight: 120, padding: 12, borderRadius: 12, border: `1px solid ${descLen >= 500 ? GREEN : BORDER}`, backgroundColor: CARD, color: TEXT, fontSize: 13, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, marginBottom: 16 }}>
                    <span style={{ color: descLen >= 500 ? GREEN : MUTED, fontSize: 11 }}>{descLen >= 500 ? "✓ Good length" : `${descLen}/500 minimum`}</span>
                    <span style={{ color: MUTED, fontSize: 11 }}>{descLen}/1,000</span>
                  </div>

                  {/* Evidence links */}
                  <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Supporting evidence</p>
                  <p style={{ color: MUTED, fontSize: 12, marginBottom: 8, lineHeight: 1.5 }}>Add a link to a supporting video, social media post, or news article (optional)</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px" }}>
                    <span style={{ fontSize: 16 }}>🔗</span>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={data.evidenceLinks}
                      onChange={(e) => setData({ ...data, evidenceLinks: e.target.value })}
                      style={{ flex: 1, background: "none", border: "none", color: TEXT, fontSize: 13, outline: "none", fontFamily: "inherit" }}
                    />
                  </div>
                </div>
              )}
            </div>

          ) : step === 2 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Anything else to share?</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Optional — your comments help future visitors</p>
              <textarea
                placeholder="Describe your experience, what made you feel safe or unsafe..."
                value={data.comments}
                onChange={(e) => setData({ ...data, comments: e.target.value })}
                style={{ width: "100%", minHeight: 130, padding: 14, borderRadius: 14, border: `1px solid ${BORDER}`, backgroundColor: CARD, color: TEXT, fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }}
              />
            </div>

          ) : (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Healthcare Experience</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>Optional — rate specific aspects of your visit</p>
              <div style={{ backgroundColor: BLUE + "10", border: `1px solid ${BLUE}25`, borderRadius: 12, padding: "8px 12px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>⭐</span>
                <p style={{ color: "#7EB0DD", fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>These questions are tailored to healthcare visits. Skip any you'd rather not answer — all are optional.</p>
              </div>
              <div style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                {CATEGORY_QUESTIONS.map((q, i) => (
                  <div key={q.key}>
                    {i > 0 && <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />}
                    <StarRow label={q.label} value={data.categoryRatings[q.key] ?? 0} onChange={(v) => setData({ ...data, categoryRatings: { ...data.categoryRatings, [q.key]: v } })} />
                  </div>
                ))}
              </div>
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
              style={{ flex: 1, padding: 14, borderRadius: 14, border: "none", backgroundColor: canNext() ? PRIMARY : BORDER, color: canNext() ? TEXT : MUTED, fontSize: 15, fontWeight: 700, cursor: canNext() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: "inherit", transition: "background-color 0.2s" }}>
              {step === STEPS.length - 1 ? "Submit Survey" : "Next"} {step < STEPS.length - 1 && "→"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
