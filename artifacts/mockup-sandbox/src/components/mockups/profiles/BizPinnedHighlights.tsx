const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";

const AVATAR_COLORS = ["#CA922B", "#2D7A4F", "#7B3F00", "#1D4ED8"];

function Stars({ n }: { n: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= n ? GOLD : "rgba(255,255,255,0.15)"}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      ))}
    </div>
  );
}

function PinnedCard({ author, initials, color, rating, text, daysLeft, type }: { author: string; initials: string; color: string; rating: number; text: string; daysLeft: number; type: "review" | "video" }) {
  const urgent = daysLeft <= 3;
  return (
    <div style={{ margin: "0 16px 12px", background: CARD2, border: `1.5px solid ${GOLD}40`, borderRadius: 16, padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>
          <span style={{ color: GOLD, fontSize: 11, fontWeight: 700 }}>Pinned {type === "video" ? "Video" : "Review"}</span>
        </div>
        <div style={{ background: urgent ? "rgba(220,53,69,0.15)" : "rgba(255,255,255,0.06)", border: `1px solid ${urgent ? "rgba(220,53,69,0.4)" : BORDER}`, borderRadius: 6, padding: "2px 8px" }}>
          <span style={{ color: urgent ? "#DC3545" : MUTED, fontSize: 10, fontWeight: 600 }}>{daysLeft}d left</span>
        </div>
      </div>
      {type === "review" ? (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{initials}</span>
            </div>
            <div>
              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>{author}</p>
              <Stars n={rating} />
            </div>
          </div>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.5 }}>"{text}"</p>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 52, height: 38, borderRadius: 8, background: "#1A0A00", display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${BORDER}` }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" fill="rgba(201,146,43,0.15)"/><polygon points="10 8 16 12 10 16 10 8" fill={GOLD}/></svg>
          </div>
          <div>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>Behind the scenes 🍳</p>
            <p style={{ color: MUTED, fontSize: 10, margin: "2px 0 0" }}>youtube.com/@dejakitchen</p>
          </div>
        </div>
      )}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <div style={{ flex: 1, background: "rgba(220,53,69,0.12)", border: "1px solid rgba(220,53,69,0.3)", borderRadius: 8, padding: "7px", textAlign: "center" }}>
          <span style={{ color: "#DC3545", fontSize: 11, fontWeight: 600 }}>Unpin</span>
        </div>
        <div style={{ flex: 1, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 8, padding: "7px", textAlign: "center" }}>
          <span style={{ color: GOLD, fontSize: 11, fontWeight: 600 }}>Renew Pin</span>
        </div>
      </div>
    </div>
  );
}

function AvailableRow({ author, initials, color, rating, text }: { author: string; initials: string; color: string; rating: number; text: string }) {
  return (
    <div style={{ padding: "12px 16px", borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: "#fff", fontSize: 11, fontWeight: 700 }}>{initials}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, margin: 0 }}>{author}</p>
            <Stars n={rating} />
          </div>
          <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 8px", lineHeight: 1.4 }}>"{text}"</p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: `${GOLD}15`, border: `1px solid ${GOLD}40`, borderRadius: 8, padding: "5px 10px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span style={{ color: GOLD, fontSize: 10, fontWeight: 700 }}>Pin for 30 days</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BizPinnedHighlights() {
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
        <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Pinned Highlights</span>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Currently pinned */}
        <div style={{ padding: "16px 0 4px" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 16px 12px", fontFamily: "Georgia, serif" }}>Currently Pinned (2/3)</p>
          <PinnedCard author="Marcus T." initials="MT" color={AVATAR_COLORS[0]} rating={5} text="Best soul food in DC, hands down. The smothered chicken is life-changing." daysLeft={11} type="review" />
          <PinnedCard author="" initials="" color="" rating={0} text="" daysLeft={2} type="video" />
        </div>

        {/* Available to pin */}
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Available Reviews to Pin</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <AvailableRow author="Keisha R." initials="KR" color={AVATAR_COLORS[1]} rating={5} text="Every single thing we ordered was perfect. Already planning our return trip." />
            <AvailableRow author="Darnell W." initials="DW" color={AVATAR_COLORS[2]} rating={4} text="Great vibes, fast service. The cornbread alone is worth the trip." />
            <div style={{ padding: "12px 16px" }}>
              <AvailableRow author="Aisha M." initials="AM" color={AVATAR_COLORS[3]} rating={5} text="Took my whole family here for Sunday dinner. Everyone left happy and full." />
            </div>
          </div>
        </div>

        {/* Info note */}
        <div style={{ margin: "16px 16px 0", background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Pinned items appear at the top of your reviews section for 30 days. Growth and Premium plans get up to 3 pins at a time.</p>
        </div>
      </div>
    </div>
  );
}
