const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD = "#1A0E00";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.45)";

const SAMPLE_PROMPTS = [
  "Why did you start this business? What happened in your life that made you decide this needed to exist?",
  "What do you hope people feel when they walk through your door?",
  "How do you give back to your community?",
  "What keeps you motivated on difficult days?",
  "If someone remembers only one thing about you after watching this video — what do you hope it is?",
];

export function BizFeaturedVideo() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto" }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px 4px" }}>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <div style={{ width: 24, height: 12, border: "1px solid rgba(255,255,255,0.6)", borderRadius: 2, position: "relative" }}><div style={{ position: "absolute", left: 2, top: 2, bottom: 2, width: 16, background: "white", borderRadius: 1 }}/></div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Featured Video</span>
      </div>

      <div style={{ padding: "16px 16px 60px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* KinfolkAI card */}
        <div style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 16, padding: "18px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>K</span>
            </div>
            <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>KinfolkAI</span>
          </div>
          <p style={{ color: "#fff", fontSize: 17, fontWeight: 700, margin: 0, fontFamily: "Georgia, serif" }}>Need some inspiration?</p>
          <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.65 }}>
            People connect with stories more than sales. Talk as if you're welcoming a new neighbor into your business for the first time.
          </p>
          <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.65 }}>
            You don't have to be perfect. Just be yourself.
          </p>
        </div>

        {/* Conversation starters card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column" }}>
          <p style={{ color: "#fff", fontSize: 15, fontWeight: 700, margin: "0 0 4px", fontFamily: "Georgia, serif" }}>Your conversation starters</p>
          <p style={{ color: MUTED, fontSize: 12, margin: "0 0 14px", lineHeight: 1.5 }}>Pick any 2–5 to answer. Pause between each one.</p>

          {SAMPLE_PROMPTS.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderTop: i > 0 ? `1px solid ${BORDER}` : "none" }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: `${GOLD}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: GOLD, fontSize: 11, fontWeight: 800 }}>{i + 1}</span>
              </div>
              <p style={{ color: i === SAMPLE_PROMPTS.length - 1 ? GOLD : "rgba(255,255,255,0.85)", fontSize: 13, margin: 0, lineHeight: 1.6, fontStyle: i === SAMPLE_PROMPTS.length - 1 ? "italic" : "normal" }}>{q}</p>
            </div>
          ))}
        </div>

        {/* No rush hint */}
        <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: 0, lineHeight: 1.6 }}>
          No rush — come back when you're in the setting, lighting, and attire that represents your brand.
        </p>

        {/* CTA: Ready */}
        <div style={{ background: GOLD, borderRadius: 14, padding: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>I'm ready — let's film</span>
        </div>

        {/* Ghost CTA: Save & come back */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 6 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          <span style={{ color: MUTED, fontSize: 13 }}>Save my prompts & come back later</span>
        </div>
      </div>
    </div>
  );
}
