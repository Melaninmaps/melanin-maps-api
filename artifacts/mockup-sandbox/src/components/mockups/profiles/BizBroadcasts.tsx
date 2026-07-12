const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";
const ORANGE = "#E67E22";

const TYPES = [
  { id: "event", emoji: "🎉", label: "Event", hint: "Live music, grand opening…" },
  { id: "offer", emoji: "💲", label: "Special Offer", hint: "Flash sale, BOGO, happy hour…" },
  { id: "product", emoji: "🆕", label: "New Product/Service", hint: "New menu item, new collection…" },
  { id: "update", emoji: "📣", label: "Business Update", hint: "New hours, new location…" },
  { id: "community", emoji: "❤️", label: "Community", hint: "Charity drive, cleanup…" },
  { id: "emergency", emoji: "🚨", label: "Emergency Update", hint: "Weather closure — no quota" },
];

function HistoryRow({ type, title, stats, time, last = false }: { type: string; title: string; stats: string; time: string; last?: boolean }) {
  const t = TYPES.find(x => x.id === type) ?? TYPES[0];
  return (
    <div style={{ padding: "12px 16px", borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${ORANGE}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16 }}>
          {t.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: "0 0 2px", fontFamily: "system-ui" }}>{title}</p>
          <p style={{ color: MUTED, fontSize: 10, margin: "0 0 4px" }}>{time}</p>
          <div style={{ display: "flex", gap: 12 }}>
            {stats.split("·").map((s, i) => <span key={i} style={{ color: "rgba(255,255,255,0.5)", fontSize: 10 }}>{s.trim()}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BizBroadcasts() {
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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px 0", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Broadcasts</span>
        </div>
        {/* Quota pill */}
        <div style={{ background: `${ORANGE}18`, border: `1px solid ${ORANGE}40`, borderRadius: 8, padding: "5px 10px" }}>
          <span style={{ color: ORANGE, fontSize: 10, fontWeight: 700 }}>3 / 6 remaining</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", margin: "0 16px", paddingTop: 14, gap: 6 }}>
        {["Compose", "History"].map((tab, i) => (
          <div key={tab} style={{ flex: 1, background: i === 0 ? GOLD : CARD2, border: `1px solid ${i === 0 ? GOLD : BORDER}`, borderRadius: 10, padding: "8px 0", textAlign: "center" }}>
            <span style={{ color: i === 0 ? "#fff" : MUTED, fontSize: 12, fontWeight: 700 }}>{tab}</span>
          </div>
        ))}
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Type picker */}
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Broadcast Type</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TYPES.map((t, i) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, border: `1.5px solid ${i === 0 ? GOLD : BORDER}`, background: i === 0 ? `${GOLD}12` : CARD2 }}>
                <span style={{ fontSize: 18, lineHeight: 1 }}>{t.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ color: i === 0 ? GOLD : "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600, margin: 0 }}>{t.label}</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: "1px 0 0" }}>{t.hint}</p>
                </div>
                {i === 0 && <div style={{ width: 16, height: 16, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }}/></div>}
              </div>
            ))}
          </div>
        </div>

        {/* Compose fields */}
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Message</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, margin: "0 0 5px" }}>Title</p>
              <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "9px 10px" }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0 }}>Grand Opening Night 🎉</p>
              </div>
            </div>
            <div style={{ padding: "12px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, margin: "0 0 5px" }}>Body</p>
              <div style={{ background: `${BG}cc`, borderRadius: 8, border: `1px solid rgba(255,255,255,0.12)`, padding: "9px 10px", minHeight: 70 }}>
                <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, margin: 0, lineHeight: 1.5 }}>Join us this Saturday for live music, free tastings, and community love. Doors open at 6pm.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Send btn */}
        <div style={{ padding: "16px 16px 0" }}>
          <div style={{ background: GOLD, borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Send to 284 Followers</span>
          </div>
        </div>

        {/* Recent history teaser */}
        <div style={{ margin: "20px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Recent Sends</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <HistoryRow type="offer" title="Weekend Special — 20% off" stats="212 sent · 89 viewed · 34 clicks" time="3 days ago" />
            <HistoryRow type="event" title="Community Potluck" stats="212 sent · 104 viewed · 51 clicks" time="2 weeks ago" last />
          </div>
        </div>
      </div>
    </div>
  );
}
