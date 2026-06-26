import { useState } from "react";

const PRIMARY = "#C4622D";
const PRIMARY_GOLD = "#C9922B";
const BG = "#1A0E07";
const CARD = "#2A1508";
const BORDER = "#3D2010";
const TEXT = "#FBF7F0";
const MUTED = "#A08070";
const GREEN = "#2D7A4F";

function StarRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ color: TEXT, fontSize: 13, fontWeight: 500, marginBottom: 8 }}>{label}</p>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
              fontSize: 26, lineHeight: 1,
              color: n <= (hover || value) ? "#D4873A" : BORDER,
              transition: "color 0.15s",
            }}
          >★</button>
        ))}
      </div>
    </div>
  );
}

function Chip({ label, selected, onSelect, danger }: { label: string; selected: boolean; onSelect: () => void; danger?: boolean }) {
  const activeColor = danger ? "#DC2626" : PRIMARY;
  return (
    <button
      onClick={onSelect}
      style={{
        padding: "8px 16px",
        borderRadius: 20,
        border: `1px solid ${selected ? activeColor : BORDER}`,
        backgroundColor: selected ? activeColor : CARD,
        color: selected ? TEXT : MUTED,
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.15s",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

function YesNoChip({ label, active, onSelect, color }: { label: string; active: boolean; onSelect: () => void; color: string }) {
  return (
    <button
      onClick={onSelect}
      style={{
        flex: 1, padding: "10px 0", borderRadius: 14,
        border: `1px solid ${active ? color : BORDER}`,
        backgroundColor: active ? color : CARD,
        color: active ? TEXT : MUTED,
        fontSize: 14, fontWeight: 600, cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </button>
  );
}

const TIMES = ["Morning", "Afternoon", "Evening", "Night"];
const GROUPS = ["Solo", "With Partner", "With Friends", "With Family", "With Kids"];

const STEPS = ["Safety Ratings", "Cultural Experience", "Visit Context", "Comments"];

interface SurveyData {
  overallSafety: number;
  returnAlone: number;
  wouldRecommend: number;
  feltWelcomed: number;
  culturallyInclusive: number;
  staffReflects: number;
  timeOfDay: string;
  groupType: string;
  incidentOccurred: boolean | null;
  comments: string;
}

export function BlackOwnedSurvey() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState<SurveyData>({
    overallSafety: 0, returnAlone: 0, wouldRecommend: 0,
    feltWelcomed: 0, culturallyInclusive: 0, staffReflects: 0,
    timeOfDay: "", groupType: "", incidentOccurred: null, comments: "",
  });

  const canNext = () => {
    if (step === 0) return data.overallSafety > 0 && data.returnAlone > 0 && data.wouldRecommend > 0;
    if (step === 1) return data.feltWelcomed > 0 && data.culturallyInclusive > 0 && data.staffReflects > 0;
    if (step === 2) return data.timeOfDay !== "" && data.groupType !== "" && data.incidentOccurred !== null;
    return true;
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) { setStep(step + 1); return; }
    setSubmitted(true);
  };

  const reset = () => { setStep(0); setSubmitted(false); setData({ overallSafety: 0, returnAlone: 0, wouldRecommend: 0, feltWelcomed: 0, culturallyInclusive: 0, staffReflects: 0, timeOfDay: "", groupType: "", incidentOccurred: null, comments: "" }); };

  return (
    <div style={{
      minHeight: "100vh", backgroundColor: "#0D0704",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', system-ui, sans-serif", padding: "16px",
    }}>
      <div style={{
        width: 390, minHeight: 700,
        backgroundColor: BG, borderRadius: 24,
        border: `1px solid ${BORDER}`,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 20px 14px",
          borderBottom: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <button onClick={reset} style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: 0 }}>Rate Your Experience</p>
            <p style={{ color: PRIMARY_GOLD, fontSize: 12, margin: "2px 0 0", fontWeight: 500 }}>Soul Food Kitchen — Black-Owned</p>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: PRIMARY + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✊🏾</div>
        </div>

        {/* Black-owned badge */}
        <div style={{
          margin: "12px 20px 0",
          padding: "8px 14px",
          borderRadius: 12,
          background: `linear-gradient(135deg, ${PRIMARY}22, ${PRIMARY_GOLD}18)`,
          border: `1px solid ${PRIMARY}33`,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>🖤</span>
          <p style={{ color: PRIMARY_GOLD, fontSize: 12, fontWeight: 600, margin: 0 }}>
            This survey includes community experience questions for Black-owned businesses
          </p>
        </div>

        {/* Step bar */}
        {!submitted && (
          <div style={{ display: "flex", alignItems: "center", padding: "14px 24px 10px", gap: 4 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{
                  height: 8, borderRadius: 4,
                  width: i === step ? 28 : 8,
                  backgroundColor: i <= step ? PRIMARY : BORDER,
                  transition: "all 0.3s",
                }} />
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
              <p style={{ color: TEXT, fontSize: 24, fontWeight: 800, margin: 0 }}>Thank You!</p>
              <p style={{ color: PRIMARY_GOLD, fontSize: 13, fontWeight: 600, margin: 0 }}>Soul Food Kitchen</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Your review helps our community find and support Black-owned businesses with confidence. Every voice matters. 🖤
              </p>
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 20,
                backgroundColor: PRIMARY + "15", border: `1px solid ${PRIMARY}30`,
              }}>
                <span style={{ fontSize: 14 }}>🏆</span>
                <span style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>+15 community points earned</span>
              </div>
              <button
                onClick={reset}
                style={{ marginTop: 8, padding: "12px 40px", borderRadius: 14, backgroundColor: GREEN, border: "none", color: TEXT, fontSize: 15, fontWeight: 700, cursor: "pointer" }}
              >
                Done
              </button>
            </div>
          ) : step === 0 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>How safe did you feel?</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Rate your safety experience at this business</p>
              <div style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                <StarRow label="Overall Safety" value={data.overallSafety} onChange={(v) => setData({ ...data, overallSafety: v })} />
                <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />
                <StarRow label="Comfortable returning alone?" value={data.returnAlone} onChange={(v) => setData({ ...data, returnAlone: v })} />
                <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />
                <StarRow label="Would recommend to others?" value={data.wouldRecommend} onChange={(v) => setData({ ...data, wouldRecommend: v })} />
              </div>
            </div>
          ) : step === 1 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Community Experience</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 4 }}>As a Black customer, how did this business make you feel?</p>
              <div style={{ backgroundColor: PRIMARY + "10", border: `1px solid ${PRIMARY}25`, borderRadius: 12, padding: "8px 12px", marginBottom: 16, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ fontSize: 14, marginTop: 1 }}>✊🏾</span>
                <p style={{ color: PRIMARY_GOLD, fontSize: 11, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                  These questions help our community understand which businesses truly celebrate and affirm Black culture.
                </p>
              </div>
              <div style={{ backgroundColor: CARD, borderRadius: 16, padding: 16, border: `1px solid ${BORDER}` }}>
                <StarRow label="Did you feel welcomed & affirmed as a Black customer?" value={data.feltWelcomed} onChange={(v) => setData({ ...data, feltWelcomed: v })} />
                <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />
                <StarRow label="Was the space culturally inclusive & representative?" value={data.culturallyInclusive} onChange={(v) => setData({ ...data, culturallyInclusive: v })} />
                <div style={{ height: 1, backgroundColor: BORDER, margin: "4px 0 18px" }} />
                <StarRow label="Did staff reflect & respect the community they serve?" value={data.staffReflects} onChange={(v) => setData({ ...data, staffReflects: v })} />
              </div>
            </div>
          ) : step === 2 ? (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Tell us about your visit</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Context helps surface more accurate safety scores</p>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Time of visit</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {TIMES.map((t) => <Chip key={t} label={t} selected={data.timeOfDay === t} onSelect={() => setData({ ...data, timeOfDay: t })} />)}
              </div>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Who were you with?</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {GROUPS.map((g) => <Chip key={g} label={g} selected={data.groupType === g} onSelect={() => setData({ ...data, groupType: g })} />)}
              </div>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Did any incident occur?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <YesNoChip label="No" active={data.incidentOccurred === false} onSelect={() => setData({ ...data, incidentOccurred: false })} color={GREEN} />
                <YesNoChip label="Yes" active={data.incidentOccurred === true} onSelect={() => setData({ ...data, incidentOccurred: true })} color="#DC2626" />
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: TEXT, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Anything else to share?</p>
              <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.6, marginBottom: 16 }}>Optional — your comments help future visitors feel confident</p>
              <textarea
                placeholder="Describe your experience — what made you feel welcomed, safe, or at home..."
                value={data.comments}
                onChange={(e) => setData({ ...data, comments: e.target.value })}
                style={{
                  width: "100%", minHeight: 130, padding: 14, borderRadius: 14,
                  border: `1px solid ${BORDER}`, backgroundColor: CARD, color: TEXT,
                  fontSize: 14, lineHeight: 1.6, resize: "vertical", boxSizing: "border-box",
                  fontFamily: "inherit", outline: "none",
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        {!submitted && (
          <div style={{
            display: "flex", gap: 10, padding: "14px 20px 20px",
            borderTop: `1px solid ${BORDER}`,
          }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  padding: "14px 20px", borderRadius: 14, border: `1px solid ${BORDER}`,
                  backgroundColor: "transparent", color: TEXT, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canNext()}
              style={{
                flex: 1, padding: 14, borderRadius: 14, border: "none",
                backgroundColor: canNext() ? PRIMARY : BORDER,
                color: canNext() ? TEXT : MUTED,
                fontSize: 15, fontWeight: 700, cursor: canNext() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: "inherit", transition: "background-color 0.2s",
              }}
            >
              {step === STEPS.length - 1 ? "Submit Survey" : "Next"} {step < STEPS.length - 1 && "→"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
