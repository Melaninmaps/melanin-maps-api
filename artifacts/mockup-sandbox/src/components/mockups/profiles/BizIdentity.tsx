const GOLD = "#CA922B";
const BG = "#0F0800";
const CARD2 = "#231200";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.4)";
const GREEN = "#2D7A4F";
const PURPLE = "#7B5EA7";

function ChipGroup({ label, chips, selected }: { label: string; chips: string[]; selected: number[] }) {
  return (
    <div style={{ padding: "14px 16px", borderBottom: `1px solid ${BORDER}` }}>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: "0 0 10px", fontFamily: "system-ui" }}>{label}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {chips.map((chip, i) => {
          const on = selected.includes(i);
          return (
            <div key={chip} style={{ padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${on ? GOLD : BORDER}`, background: on ? `${GOLD}18` : "transparent" }}>
              <span style={{ color: on ? GOLD : MUTED, fontSize: 11, fontWeight: on ? 700 : 400, fontFamily: "system-ui" }}>{chip}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BizIdentity() {
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
          <span style={{ color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Georgia, serif" }}>Identity & Vibes</span>
        </div>
        <div style={{ background: GOLD, borderRadius: 8, padding: "7px 16px" }}>
          <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>Save</span>
        </div>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {/* Diaspora flags */}
        <div style={{ margin: "16px 16px 0" }}>
          <p style={{ color: GOLD, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 10px", fontFamily: "Georgia, serif" }}>Diaspora Heritage</p>
          <div style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px" }}>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "0 0 10px", lineHeight: 1.4 }}>Select the countries your ownership heritage represents. Shows as flag icons on your listing.</p>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ flag: "🇺🇸", label: "USA" }, { flag: "🇯🇲", label: "Jamaica" }, { flag: "🇳🇬", label: "Nigeria" }].map(({ flag, label }) => (
                <div key={label} style={{ padding: "8px 14px", borderRadius: 12, border: `1.5px solid ${GOLD}`, background: `${GOLD}15`, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 18 }}>{flag}</span>
                  <span style={{ color: GOLD, fontSize: 11, fontWeight: 600 }}>{label}</span>
                </div>
              ))}
              <div style={{ padding: "8px 14px", borderRadius: 12, border: `1.5px dashed ${BORDER}`, display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span style={{ color: MUTED, fontSize: 11 }}>Add</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ margin: "16px 16px 0", background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          <ChipGroup label="Ownership Designations" selected={[0, 1, 4]}
            chips={["Black-Owned", "Minority-Owned", "Woman-Owned", "Veteran-Owned", "Family-Owned", "LGBTQ+-Owned", "Nonprofit", "Melanated Diaspora-Owned"]} />
          <ChipGroup label="Community Values" selected={[0, 2, 3]}
            chips={["Community", "Family", "Culture", "Education", "Health", "Wellness", "Creativity", "Entrepreneurship"]} />
          <ChipGroup label="Who You Serve" selected={[0, 2]}
            chips={["Families", "Solo Travelers", "Professionals", "Tourists", "College Students", "Seniors", "Children", "Large Groups"]} />
          <ChipGroup label="Accessibility" selected={[0, 1, 4]}
            chips={["Wheelchair Accessible", "Service Animals Welcome", "Gender-Neutral Restroom", "Outdoor Seating", "Kid Friendly", "Quiet Environment", "Parking Available"]} />
          <ChipGroup label="Vibe / Atmosphere" selected={[0, 2, 3]}
            chips={["☕ Cozy", "🎉 Lively", "💼 Professional", "👨‍👩‍👧 Family Friendly", "🎶 Great Music", "💕 Romantic", "🌿 Relaxed", "💎 Luxury"]} />
          <ChipGroup label="Business Highlights" selected={[3, 5]}
            chips={["Celebrating 10+ years", "Newly opened", "Locally owned & operated", "Award-winning", "Currently expanding", "Recently renovated"]} />
          <div style={{ padding: "14px 16px" }}>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: 600, margin: "0 0 8px" }}>Giving Back</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {["Donates to local orgs", "Hosts community events", "Youth mentorship", "Partners with nonprofits"].map((chip, i) => (
                <div key={chip} style={{ padding: "5px 11px", borderRadius: 20, border: `1.5px solid ${i < 2 ? GOLD : BORDER}`, background: i < 2 ? `${GOLD}18` : "transparent" }}>
                  <span style={{ color: i < 2 ? GOLD : MUTED, fontSize: 11, fontWeight: i < 2 ? 700 : 400 }}>{chip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
