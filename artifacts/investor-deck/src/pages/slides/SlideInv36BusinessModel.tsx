export default function SlideInv36BusinessModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>36</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>BUSINESS MODEL</div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          Diversified revenue.<br />Built to scale.
        </div>
      </div>

      {/* 3-column layout */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16.5vw", bottom: "5vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0" }}>

        {/* Column 1 — Consumers */}
        <div style={{ paddingRight: "2.5vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.2vw" }}>CONSUMERS</div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Free</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Core app, discovery, community feed, safety intel</div>
          </div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Navigator <span style={{ color: "#CA922B" }}>$9.99/mo</span></div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>KinfolkAI™ recommendations, trip itineraries, premium filters</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Trailblazer <span style={{ color: "#CA922B" }}>$19.99/mo</span></div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Full ecosystem access, Circles, advanced AI, early features</div>
          </div>
        </div>

        {/* Column 2 — Businesses */}
        <div style={{ paddingLeft: "2.5vw", paddingRight: "2.5vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.2vw" }}>BUSINESSES</div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Starter <span style={{ color: "#CA922B" }}>$29/mo</span></div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Verified listing, basic analytics, community reviews</div>
          </div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Professional <span style={{ color: "#CA922B" }}>$99/mo</span></div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>KinfolkAI™ insights, customer intelligence, growth tools</div>
          </div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Featured Placement</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Promoted discovery — top of search, map pins, spotlights</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Marketplace Access</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Direct bookings, reservations, and event ticketing</div>
          </div>
        </div>

        {/* Column 3 — Partners */}
        <div style={{ paddingLeft: "2.5vw" }}>
          <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.2vw" }}>PARTNERS</div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Tourism Boards</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>City and regional tourism partnerships, destination content</div>
          </div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Employers &amp; Relocation</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Enterprise relocation packages for diverse hires</div>
          </div>

          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>City Partnerships</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Economic development, equitable business visibility</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#1C0E06" }}>Branded Experiences</div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#5C3A1A", marginTop: "0.3vw", lineHeight: 1.5 }}>Sponsored content, events, and cultural activations</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] bottom-[1.8vw]">
        <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#A6720F", fontStyle: "italic" }}>
          Every tier creates value for the community — and recurring revenue for the platform.
        </div>
      </div>
    </div>
  );
}
