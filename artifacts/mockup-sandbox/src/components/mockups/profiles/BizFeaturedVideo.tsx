const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";

const PURPOSES = [
  { id: "intro", label: "Owner Introduction", hint: "Say hello and tell your story" },
  { id: "product", label: "Product / Service Demo", hint: "Show off what you offer" },
  { id: "testimonial", label: "Customer Testimonial", hint: "Let a happy customer speak" },
  { id: "behind_scenes", label: "Behind the Scenes", hint: "A day in the life of your business" },
  { id: "event", label: "Event Highlight", hint: "Recap a recent event" },
  { id: "community", label: "Community Impact", hint: "Share how you give back" },
];

export function BizFeaturedVideo() {
  return (
    <div style={{ minHeight: "100vh", background: BG, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Status bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 24px 4px" }}>
        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>9:41</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="3" width="3" height="8" rx="1" fill="white" opacity="0.4"/><rect x="4" y="2" width="3" height="9" rx="1" fill="white" opacity="0.6"/><rect x="8" y="0" width="3" height="11" rx="1" fill="white" opacity="0.8"/><rect x="12" y="0" width="3" height="11" rx="1" fill="white"/></svg>
          <div style={{ width: 24, height: 12, border: "1px solid rgba(255,255,255,0.6)", borderRadius: 2, position: "relative" }}><div style={{ position: "absolute", left: 2, top: 2, bottom: 2, width: 16, background: "white", borderRadius: 1 }}/></div>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Featured Video</span>
        </div>
        <div style={{ background: GOLD, borderRadius: 8, padding: "7px 16px" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Save</span>
        </div>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Explainer */}
        <div style={{ margin: "16px 16px 0", background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>What is a Featured Video?</p>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: 0, lineHeight: 1.5 }}>A pinned video card shown at the top of your business listing. Link to YouTube, TikTok, Instagram, Facebook, or Vimeo.</p>
        </div>

        {/* Current video preview */}
        <div style={{ margin: "16px 16px 0", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, margin: "0 0 8px" }}>Current Featured Video</p>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 56, height: 40, borderRadius: 8, background: "#1A0A00", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER}` }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill={`${GOLD}20`}/><polygon points="10 8 16 12 10 16 10 8" fill={GOLD}/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>Behind the scenes 🍳</p>
                <p style={{ color: MUTED, fontSize: 10, margin: "0 0 2px" }}>youtube.com/@dejakitchen/watch…</p>
                <div style={{ display: "inline-flex", background: `${GOLD}18`, borderRadius: 4, padding: "1px 6px" }}>
                  <span style={{ color: GOLD, fontSize: 9, fontWeight: 700 }}>Behind the Scenes</span>
                </div>
              </div>
              <div style={{ padding: "5px 10px", background: "rgba(220,53,69,0.12)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 8 }}>
                <span style={{ color: "#DC3545", fontSize: 10, fontWeight: 600 }}>Remove</span>
              </div>
            </div>
          </div>
        </div>

        {/* URL field */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Update Video</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, margin: 0 }}>Video URL</p>
                <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GOLD, fontWeight: 700 }}>URL</span>
              </div>
              <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "9px 10px" }}>
                <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Paste a YouTube, TikTok, Instagram, Facebook, or Vimeo URL…</p>
              </div>
              <p style={{ color: MUTED, fontSize: 10, margin: "6px 0 0" }}>Supported: YouTube · TikTok · Instagram · Facebook · Vimeo</p>
            </div>

            {/* Title */}
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, margin: "0 0 6px" }}>Video Title</p>
              <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "9px 10px" }}>
                <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>What's this video about?</p>
              </div>
            </div>

            {/* Purpose picker */}
            <div style={{ padding: "12px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: 600, margin: "0 0 10px" }}>Video Purpose</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {PURPOSES.map((p, i) => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", borderRadius: 10, border: `1.5px solid ${i === 3 ? GOLD : BORDER}`, background: i === 3 ? `${GOLD}12` : "transparent" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${i === 3 ? GOLD : BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {i === 3 && <div style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD }} />}
                    </div>
                    <div>
                      <p style={{ color: i === 3 ? GOLD : "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: i === 3 ? 700 : 400, margin: 0 }}>{p.label}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: "1px 0 0" }}>{p.hint}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
