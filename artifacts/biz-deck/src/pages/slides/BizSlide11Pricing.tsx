export default function BizSlide11Pricing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 110%, rgba(202,146,43,0.08), transparent 55%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw] right-[6vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>PRICING</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.08 }}>
          Simple. Transparent. Built for small businesses.
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "14.5vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Pricing cards */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16vw", display: "grid", gridTemplateColumns: "1fr 1.08fr 1fr", gap: "1.5vw" }}>

        {/* Free */}
        <div style={{ background: "#FFFFFF", borderRadius: "1.2vw", padding: "2.2vw 1.8vw", border: "1px solid rgba(58,31,14,0.1)" }}>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "1vw" }}>FREE</div>
          <div style={{ marginBottom: "1.2vw" }}>
            <span className="font-display" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1 }}>$0</span>
            <span className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408" }}> / month</span>
          </div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#5C3A1A", lineHeight: 1.6, marginBottom: "1.5vw" }}>
            Get your business on the map. Your profile, your reviews, your community.
          </div>
          <div style={{ borderTop: "1px solid rgba(58,31,14,0.08)", paddingTop: "1.2vw", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
            {["Business profile", "Community reviews", "Trust score", "Map listing", "Verified badge eligibility"].map((f) => (
              <div key={f} style={{ display: "flex", gap: "0.7vw", alignItems: "center" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#5A9A6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="font-body" style={{ fontSize: "0.82vw", color: "#3A1F0E" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Standard — highlighted */}
        <div style={{ background: "#3D2417", borderRadius: "1.2vw", padding: "2.2vw 1.8vw", border: "2px solid #CA922B", position: "relative", boxShadow: "0 0.4vw 2vw rgba(202,146,43,0.2)" }}>
          <div style={{ position: "absolute", top: "-0.8vw", left: "50%", transform: "translateX(-50%)", background: "#CA922B", borderRadius: "2vw", padding: "0.25vw 1.2vw" }}>
            <span className="font-body" style={{ fontSize: "0.7vw", color: "#1C0E06", fontWeight: 800 }}>MOST POPULAR</span>
          </div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "1vw" }}>STANDARD</div>
          <div style={{ marginBottom: "1.2vw" }}>
            <span className="font-display" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1 }}>$49</span>
            <span className="font-body" style={{ fontSize: "0.85vw", color: "#A87A40" }}> / month</span>
          </div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#D9C4A3", lineHeight: 1.6, marginBottom: "1.5vw" }}>
            Everything in Free, plus the tools to grow — analytics, events, and KinfolkAI™.
          </div>
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", paddingTop: "1.2vw", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
            {["Everything in Free", "Performance analytics", "Customer insights", "Events & calendar", "KinfolkAI™ marketing tools", "Owner review responses"].map((f) => (
              <div key={f} style={{ display: "flex", gap: "0.7vw", alignItems: "center" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="font-body" style={{ fontSize: "0.82vw", color: "#FAF6EF" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Founding */}
        <div style={{ background: "#1C0E06", borderRadius: "1.2vw", padding: "2.2vw 1.8vw", border: "1px solid rgba(202,146,43,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", marginBottom: "1vw" }}>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em" }}>FOUNDING BUSINESS</div>
            <div style={{ background: "#CA922B", borderRadius: "2vw", padding: "0.15vw 0.55vw" }}>
              <span className="font-body" style={{ fontSize: "0.55vw", color: "#1C0E06", fontWeight: 800 }}>LIMITED</span>
            </div>
          </div>
          <div style={{ marginBottom: "0.5vw" }}>
            <span className="font-display" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>$29</span>
            <span className="font-body" style={{ fontSize: "0.85vw", color: "#7B5408" }}> / month</span>
          </div>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#5A9A6F", marginBottom: "1vw" }}>Locked in for life — rate never increases</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#A87A40", lineHeight: 1.6, marginBottom: "1.5vw" }}>
            Everything in Standard plus founding badge, priority placement, marketplace access, and permanent community recognition.
          </div>
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.15)", paddingTop: "1.2vw", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
            {["Everything in Standard", "Founding Business Badge", "Priority search placement", "Marketplace early access", "Community recognition", "Founding rate — locked forever"].map((f) => (
              <div key={f} style={{ display: "flex", gap: "0.7vw", alignItems: "center" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span className="font-body" style={{ fontSize: "0.82vw", color: "#D9C4A3" }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Footer note */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div className="font-body" style={{ fontSize: "0.9vw", color: "#A87A40", fontStyle: "italic" }}>
          Founding rate available to the first 500 businesses only. After 500, standard pricing applies to new sign-ups.
        </div>
      </div>
    </div>
  );
}
