const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD = "#1C0E00";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";

function StatCard({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6, alignItems: "center" }}>
      {icon}
      <span style={{ color: "#fff", fontSize: 22, fontWeight: 800, fontFamily: "Georgia, serif" }}>{value}</span>
      <span style={{ color: MUTED, fontSize: 10, fontWeight: 600, textAlign: "center", fontFamily: "system-ui" }}>{label}</span>
    </div>
  );
}

function MenuRow({ icon, label, sub, color, badge, last = false }: { icon: React.ReactNode; label: string; sub: string; color: string; badge?: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderBottom: last ? "none" : `1px solid ${BORDER}` }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.88)", fontSize: 13, fontWeight: 600, fontFamily: "system-ui" }}>{label}</span>
          {badge && <span style={{ background: `${GOLD}22`, border: `1px solid ${GOLD}44`, borderRadius: 4, padding: "1px 6px", fontSize: 9, color: GOLD, fontWeight: 700 }}>{badge}</span>}
        </div>
        <span style={{ color: MUTED, fontSize: 11, fontFamily: "system-ui" }}>{sub}</span>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
    </div>
  );
}

export function BizOwnerDashboard() {
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
        <div>
          <p style={{ color: "#fff", fontSize: 18, fontWeight: 700, margin: 0, fontFamily: "Georgia, serif" }}>Business Dashboard</p>
          <p style={{ color: MUTED, fontSize: 11, margin: "2px 0 0" }}>Deja's Soul Kitchen</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ background: `${GREEN}18`, border: `1px solid ${GREEN}44`, borderRadius: 8, padding: "5px 10px", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: GREEN }} />
            <span style={{ color: GREEN, fontSize: 10, fontWeight: 700 }}>Active</span>
          </div>
        </div>
      </div>

      <div style={{ overflowY: "auto", paddingBottom: 100 }}>
        {/* Stats */}
        <div style={{ padding: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>This Month</p>
          <div style={{ display: "flex", gap: 8 }}>
            <StatCard label="Profile Views" value="1,284"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
            <StatCard label="Saves" value="47"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7B5EA7" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>} />
            <StatCard label="Reviews" value="12"
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>} />
          </div>
        </div>

        {/* Click analytics */}
        <div style={{ margin: "16px 16px 0", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Link Clicks</p>
          {[
            { label: "Website", val: 38, color: GOLD },
            { label: "Instagram", val: 27, color: "#E1306C" },
            { label: "Phone Calls", val: 19, color: GREEN },
            { label: "TikTok", val: 14, color: "#69C9D0" },
            { label: "Directions", val: 11, color: "#4A90D9" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ color: MUTED, fontSize: 11, width: 70, flexShrink: 0 }}>{label}</span>
              <div style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                <div style={{ width: `${(val / 38) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
              </div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, width: 22, textAlign: "right" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Manage</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
            <MenuRow label="Edit Profile" sub="Name, description, hours, address" color={GOLD}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} />
            <MenuRow label="Identity & Vibes" sub="Ownership badges, accessibility, atmosphere" color="#7B5EA7"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B5EA7" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>} />
            <MenuRow label="Broadcasts" sub="Notify your followers of events & offers" color="#E67E22" badge="3 remaining"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>} />
            <MenuRow label="Pinned Highlights" sub="Feature your best reviews & videos" color={GREEN}
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2"><line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/></svg>} />
            <MenuRow label="Featured Video" sub="Showcase a video on your listing" color="#4A90D9"
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A90D9" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>} />
            <MenuRow label="Preview Listing" sub="See what customers see" color={MUTED} last
              icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>} />
          </div>
        </div>

        {/* Insight nudge */}
        <div style={{ margin: "16px 16px 0", background: `${GOLD}10`, border: `1px solid ${GOLD}30`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>
            <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>Profile 68% complete</p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0, lineHeight: 1.4 }}>Add your Owner Story and weekly schedule to unlock the full confidence score boost.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
