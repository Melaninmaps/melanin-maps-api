export default function DemoS63ReportStep1Screen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>STEP 1 OF 3</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Flag it.<br /><span style={{ color: "#CA922B" }}>Tap Report.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          On any business profile, the "⋯" menu includes a Report option. Zara spots a business that doesn't belong in the directory — it's not minority-owned. She taps Report.
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        {/* Nav */}
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.55vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700 }}>Urban Eats Kitchen</span>
          <div style={{ display: "flex", gap: "0.4vw", alignItems: "center" }}>
            <svg width="0.7vw" height="0.7vw" viewBox="0 0 16 16" fill="none" stroke="#CA922B" strokeWidth="2"><circle cx="8" cy="8" r="6"/><path d="M8 5v3M8 11h.01"/></svg>
            {/* Highlight the ... menu */}
            <div style={{ background: "#FFF3E0", borderRadius: "0.35vw", padding: "0.15vw 0.4vw", border: "0.08vw solid #CA922B" }}>
              <span style={{ color: "#CA922B", fontSize: "0.6vw", fontWeight: 700 }}>⋯</span>
            </div>
          </div>
        </div>
        {/* Business hero */}
        <div style={{ height: "5.5vw", background: "linear-gradient(135deg,#3A2210,#1C0E06)", display: "flex", alignItems: "flex-end", padding: "0.5vw 0.8vw", flexShrink: 0 }}>
          <div>
            <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Urban Eats Kitchen</div>
            <div style={{ color: "#A87A40", fontSize: "0.45vw" }}>Restaurant · Columbia Heights</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#5C3A1A", borderRadius: "0.4vw", padding: "0.2vw 0.5vw" }}>
            <span style={{ color: "#D4B483", fontSize: "0.52vw", fontWeight: 800 }}>71</span>
          </div>
        </div>
        {/* Dropdown menu overlay */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ position: "absolute", top: 0, right: "0.6vw", background: "#fff", borderRadius: "0.6vw", boxShadow: "0 0.3vw 1.2vw rgba(28,14,6,0.18)", zIndex: 20, minWidth: "8vw", border: "0.05vw solid #E8DDD0" }}>
            {[
              { label: "Share Business", icon: "↗" },
              { label: "Save to Collection", icon: "♡" },
              { label: "Report Business", icon: "⚑", highlight: true },
            ].map((item, i) => (
              <div key={i} style={{ padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", gap: "0.4vw", background: item.highlight ? "#FFF3E0" : "transparent", borderRadius: i === 2 ? "0 0 0.6vw 0.6vw" : "0", borderTop: i > 0 ? "0.05vw solid #F0E8DC" : "none" }}>
                <span style={{ color: item.highlight ? "#C0392B" : "#5C3A1A", fontSize: "0.5vw" }}>{item.icon}</span>
                <span style={{ color: item.highlight ? "#C0392B" : "#1C0E06", fontSize: "0.5vw", fontWeight: item.highlight ? 700 : 500 }}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Business body */}
        <div style={{ flex: 1, padding: "1.5vw 0.8vw 0.5vw", display: "flex", flexDirection: "column", gap: "0.5vw" }}>
          <div style={{ display: "flex", gap: "0.4vw" }}>
            {["Restaurant","$$","Columbia Heights"].map((t,i) => (
              <span key={i} style={{ background: "#F0E8DC", color: "#5C3A1A", fontSize: "0.4vw", padding: "0.15vw 0.35vw", borderRadius: "0.4vw" }}>{t}</span>
            ))}
          </div>
          <div style={{ color: "#8C6A3A", fontSize: "0.48vw", lineHeight: 1.5 }}>General American cuisine restaurant. Open Mon–Sat 11am–9pm.</div>
          <div style={{ background: "#FFF3E0", borderRadius: "0.5vw", padding: "0.4vw 0.6vw", display: "flex", gap: "0.4vw", alignItems: "center" }}>
            <span style={{ color: "#C0392B", fontSize: "0.5vw" }}>⚑</span>
            <span style={{ color: "#C0392B", fontSize: "0.48vw", fontWeight: 600 }}>Report this business</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Available on every listing", "The Report option lives in the ⋯ menu on any business profile — one tap away for any member."],
          ["Trust Score signals it", "A Trust Score of 71 on a restaurant with no community chips is a warning sign worth investigating."],
          ["Anonymous by default", "The business never sees who filed the report — only that a review was initiated."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>63</div>
    </div>
  );
}
