export default function BizSlide09FoundingBenefits() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(202,146,43,0.07), transparent 50%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>FOUNDING BUSINESS PROGRAM</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.08 }}>
          Benefits built for<br />
          <span style={{ color: "#CA922B" }}>the businesses that build with us.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", lineHeight: 1.6, marginTop: "0.6vw" }}>
          The first 500 businesses to join receive permanent founding status — and everything that comes with it.
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "15.5vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Benefits grid — 2 rows × 3 cols, last row has 2 + 1 wide CTA */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.2vw" }}>

        {/* Badge */}
        <div style={{ background: "#FFFFFF", borderRadius: "1.2vw", padding: "2vw 1.8vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <div style={{ marginBottom: "1.2vw" }}>
            <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="6" /><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
            </svg>
          </div>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.5vw" }}>BADGE</div>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.7vw" }}>Founding Business Badge</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.65 }}>
            A permanent badge displayed on your profile that signals you were among the first businesses to build this community. It never goes away — no matter how big the platform grows.
          </div>
        </div>

        {/* Premium */}
        <div style={{ background: "#FFFFFF", borderRadius: "1.2vw", padding: "2vw 1.8vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <div style={{ marginBottom: "1.2vw" }}>
            <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.5vw" }}>PREMIUM ACCESS</div>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.7vw" }}>Lifetime Premium Features</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.65 }}>
            Full access to analytics, KinfolkAI™, customer insights, and every future feature we ship — locked in at your founding rate for as long as your business is on the platform.
          </div>
        </div>

        {/* Marketplace */}
        <div style={{ background: "#FFFFFF", borderRadius: "1.2vw", padding: "2vw 1.8vw", border: "1px solid rgba(58,31,14,0.08)", borderTop: "3px solid #CA922B" }}>
          <div style={{ marginBottom: "1.2vw" }}>
            <svg width="2.2vw" height="2.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.5vw" }}>MARKETPLACE</div>
          <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.7vw" }}>Marketplace Early Access</div>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", lineHeight: 1.65 }}>
            First access to the Mapping With Melanin™ marketplace when it launches — the direct commerce layer connecting community members to the businesses they already trust.
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "35vw", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw" }}>

        {/* Priority */}
        <div style={{ background: "#3D2417", borderRadius: "1.2vw", padding: "1.8vw", border: "1px solid rgba(202,146,43,0.25)" }}>
          <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
            <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div>
              <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.4vw" }}>PRIORITY</div>
              <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.5vw" }}>Priority Search Placement</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#A87A40", lineHeight: 1.6 }}>Your business ranks higher in community searches within your category and neighborhood — before any paid placements are even considered.</div>
            </div>
          </div>
        </div>

        {/* Recognition */}
        <div style={{ background: "#3D2417", borderRadius: "1.2vw", padding: "1.8vw", border: "1px solid rgba(202,146,43,0.25)" }}>
          <div style={{ display: "flex", gap: "1.2vw", alignItems: "flex-start" }}>
            <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em", marginBottom: "0.4vw" }}>RECOGNITION</div>
              <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.5vw" }}>Community Recognition</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#A87A40", lineHeight: 1.6 }}>Featured in our Founding Business directory — shared with every new user, community partner, and press mention as the platform grows city by city.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
