const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";

const PURPOSES = [
  { id: "intro", label: "Owner Introduction", emoji: "👋" },
  { id: "product", label: "Product / Service Demo", emoji: "✨" },
  { id: "testimonial", label: "Customer Testimonial", emoji: "💬" },
  { id: "behind_scenes", label: "Behind the Scenes", emoji: "🎬" },
  { id: "event", label: "Event Highlight", emoji: "🎉" },
  { id: "community", label: "Community Impact", emoji: "❤️" },
];

function Tab({ label, icon, active }: { label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "9px 0", borderRadius: 9, background: active ? GOLD : "transparent" }}>
      {icon}
      <span style={{ color: active ? "#fff" : MUTED, fontSize: 12, fontWeight: 700, fontFamily: "system-ui" }}>{label}</span>
    </div>
  );
}

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
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px 14px", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Featured Video</span>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Mode tabs */}
        <div style={{ margin: "14px 16px 0", background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, display: "flex", gap: 4 }}>
          <Tab label="Upload to Platform" active={true}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>} />
          <Tab label="Link to Social" active={false}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>} />
        </div>

        {/* Explainer */}
        <div style={{ margin: "14px 16px 0", background: `${GOLD}0C`, border: `1px solid ${GOLD}25`, borderRadius: 16, padding: "18px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>🏠</div>
          <p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 6px", fontFamily: "Georgia, serif" }}>Community Introduction</p>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            Upload a video directly to the platform — no YouTube, no public feed. Speak directly to our community in a space that's built for you.
          </p>
        </div>

        {/* Bullets */}
        <div style={{ margin: "12px 16px 0", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            "Hosted privately — only visible inside Mapping With Melanin",
            "Great for personal intros you wouldn't post publicly",
            "Up to 5 minutes, any common video format",
            "Plays inline on your business listing",
          ].map(b => (
            <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 1.5, fontFamily: "system-ui" }}>{b}</span>
            </div>
          ))}
        </div>

        {/* Upload button */}
        <div style={{ margin: "14px 16px 0", background: GOLD, borderRadius: 14, padding: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
          <span style={{ color: "#fff", fontSize: 15, fontWeight: 700 }}>Choose Video from Library</span>
        </div>

        {/* Caption field */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>Video Caption (optional)</p>
          <div style={{ background: CARD2, border: `1px solid rgba(255,255,255,0.12)`, borderRadius: 12, padding: "10px 12px" }}>
            <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>e.g. "Meet the Owner" or "Why We Do This"</p>
          </div>
        </div>

        {/* Purpose picker */}
        <div style={{ margin: "14px 16px 0" }}>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>What does this video showcase?</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PURPOSES.map((p, i) => (
              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: `1.5px solid ${i === 0 ? GOLD : BORDER}`, background: i === 0 ? `${GOLD}18` : "transparent" }}>
                <span style={{ fontSize: 13 }}>{p.emoji}</span>
                <span style={{ color: i === 0 ? GOLD : MUTED, fontSize: 12, fontWeight: i === 0 ? 700 : 400, fontFamily: "system-ui" }}>{p.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OR divider to hint at link tab */}
        <div style={{ margin: "20px 16px 0", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ color: MUTED, fontSize: 11, fontWeight: 600 }}>OR link to social instead</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>
        <div style={{ margin: "10px 16px 0", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span style={{ color: MUTED, fontSize: 12 }}>Switch to "Link to Social" tab to pin a YouTube, TikTok, or Instagram video</span>
        </div>
      </div>
    </div>
  );
}
