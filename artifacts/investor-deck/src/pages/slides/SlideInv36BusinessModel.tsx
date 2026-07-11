export default function SlideInv36BusinessModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>36</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>BUSINESS MODEL</div>
        <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.45vw" }}>
          Multiple customer groups.<br />Multiple revenue streams.
        </div>
        <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.55vw" }}>
          Four distinct customer segments — each generating recurring, scalable revenue on the same platform.
        </div>
      </div>

      {/* Metric strip */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "14.5vw", display: "flex", alignItems: "center", gap: "0" }}>
        <div style={{ flex: 1, background: "rgba(202,146,43,0.09)", border: "1px solid rgba(202,146,43,0.28)", borderRadius: "0.4vw 0 0 0.4vw", padding: "0.8vw 1.2vw", display: "flex", alignItems: "center", gap: "0.9vw" }}>
          <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>4</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", fontWeight: 600, lineHeight: 1.3 }}>Customer<br />Segments</div>
        </div>
        <div style={{ width: "0.6vw", height: "4vw", background: "#FAF6EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 700 }}>›</div>
        </div>
        <div style={{ flex: 1, background: "rgba(202,146,43,0.09)", border: "1px solid rgba(202,146,43,0.28)", borderLeft: "none", padding: "0.8vw 1.2vw", display: "flex", alignItems: "center", gap: "0.9vw" }}>
          <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>12+</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", fontWeight: 600, lineHeight: 1.3 }}>Revenue<br />Opportunities</div>
        </div>
        <div style={{ width: "0.6vw", height: "4vw", background: "#FAF6EF", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 700 }}>›</div>
        </div>
        <div style={{ flex: 1, background: "rgba(202,146,43,0.09)", border: "1px solid rgba(202,146,43,0.28)", borderLeft: "none", borderRadius: "0 0.4vw 0.4vw 0", padding: "0.8vw 1.2vw", display: "flex", alignItems: "center", gap: "0.9vw" }}>
          <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>1</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#1C0E06", fontWeight: 600, lineHeight: 1.3 }}>Shared<br />Platform</div>
        </div>
      </div>

      {/* Revenue type strip */}
      <div className="absolute font-body" style={{ left: "6vw", right: "6vw", top: "19.3vw", textAlign: "center", fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.15em", fontWeight: 700 }}>
        SUBSCRIPTIONS &nbsp;&nbsp;|&nbsp;&nbsp; MARKETPLACE &nbsp;&nbsp;|&nbsp;&nbsp; SAAS &nbsp;&nbsp;|&nbsp;&nbsp; ENTERPRISE
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "20.8vw", height: "1px", background: "rgba(202,146,43,0.3)" }} />

      {/* 4-column grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "22vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0" }}>

        {/* ── Col 1: Consumers ── */}
        <div style={{ paddingRight: "1.8vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.55vw 1vw", display: "inline-block", marginBottom: "0.7vw" }}>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.15em", fontWeight: 700 }}>CONSUMERS</div>
          </div>
          <div className="font-display" style={{ fontSize: "1vw", color: "#CA922B", marginBottom: "0.6vw", paddingLeft: "0.2vw" }}>↓</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.2vw" }}>RECURRING SUBSCRIPTION REVENUE</div>
          <div className="font-body" style={{ fontSize: "0.83vw", color: "#3D2417", fontStyle: "italic", fontWeight: 600, marginBottom: "1.1vw", lineHeight: 1.45 }}>
            Pay for convenience, personalization,<br />and premium access.
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Subscriptions</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>Free → Premium</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Discovery, AI planning, Circles, trip itineraries</div>
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>AI Premium</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>TRAILBLAZER+</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Advanced KinfolkAI™, full ecosystem access</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Marketplace</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>TRANSACTION FEES</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Bookings, event tickets, reservations</div>
          </div>
        </div>

        {/* ── Col 2: Businesses ── */}
        <div style={{ paddingLeft: "1.8vw", paddingRight: "1.8vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.55vw 1vw", display: "inline-block", marginBottom: "0.7vw" }}>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.15em", fontWeight: 700 }}>BUSINESSES</div>
          </div>
          <div className="font-display" style={{ fontSize: "1vw", color: "#CA922B", marginBottom: "0.6vw", paddingLeft: "0.2vw" }}>↓</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.2vw" }}>SAAS REVENUE</div>
          <div className="font-body" style={{ fontSize: "0.83vw", color: "#3D2417", fontStyle: "italic", fontWeight: 600, marginBottom: "1.1vw", lineHeight: 1.45 }}>
            Pay to reach engaged customers<br />and grow visibility.
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Memberships</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>Free → Enterprise</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Verified listings, analytics, AI insights</div>
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Promotions</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>PLACEMENT · SPOTLIGHT</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Top of search, map pins, homepage features</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Analytics &amp; Events</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>INSIGHTS · TICKETING</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Customer intelligence, event ticket sales</div>
          </div>
        </div>

        {/* ── Col 3: Cities & Organizations ── */}
        <div style={{ paddingLeft: "1.8vw", paddingRight: "1.8vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.55vw 1vw", display: "inline-block", marginBottom: "0.7vw" }}>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.15em", fontWeight: 700 }}>CITIES &amp; ORGS</div>
          </div>
          <div className="font-display" style={{ fontSize: "1vw", color: "#CA922B", marginBottom: "0.6vw", paddingLeft: "0.2vw" }}>↓</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.2vw" }}>GOVERNMENT &amp; INSTITUTIONAL REVENUE</div>
          <div className="font-body" style={{ fontSize: "0.83vw", color: "#3D2417", fontStyle: "italic", fontWeight: 600, marginBottom: "1.1vw", lineHeight: 1.45 }}>
            Pay to promote tourism and<br />strengthen local economies.
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Tourism Partnerships</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>DESTINATION DEALS</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>City & regional boards, destination licensing</div>
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Economic Development</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>EQUITY PROGRAMS</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Minority district promotion, equitable visibility</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Community Programs</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>CULTURAL ACTIVATION</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Sponsored events, neighborhood programming</div>
          </div>
        </div>

        {/* ── Col 4: Enterprise ── */}
        <div style={{ paddingLeft: "1.8vw" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.55vw 1vw", display: "inline-block", marginBottom: "0.7vw" }}>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.15em", fontWeight: 700 }}>ENTERPRISE</div>
          </div>
          <div className="font-display" style={{ fontSize: "1vw", color: "#CA922B", marginBottom: "0.6vw", paddingLeft: "0.2vw" }}>↓</div>
          <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.2vw" }}>ENTERPRISE CONTRACTS</div>
          <div className="font-body" style={{ fontSize: "0.83vw", color: "#3D2417", fontStyle: "italic", fontWeight: 600, marginBottom: "1.1vw", lineHeight: 1.45 }}>
            Pay for workforce insights<br />and community engagement.
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Employer Transparency</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>WORKPLACE SCORES</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Community-powered DEI and culture ratings</div>
          </div>

          <div style={{ marginBottom: "1.5vw" }}>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Recruiting</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>TALENT PIPELINE</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>Access to engaged melanated diaspora talent</div>
          </div>

          <div>
            <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06" }}>Community Engagement</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 600, marginTop: "0.1vw" }}>BRAND ACTIVATION</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#5C3A1A", marginTop: "0.15vw", lineHeight: 1.4 }}>ERG activations, authentic brand presence</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw]" style={{ bottom: "2.2vw", borderTop: "1px solid rgba(202,146,43,0.25)", paddingTop: "0.85vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#7B5408", fontStyle: "italic" }}>
          One platform. Four customer segments. Multiple recurring revenue streams.
        </div>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.1em" }}>
          RECURRING &nbsp;·&nbsp; SCALABLE &nbsp;·&nbsp; COMPOUNDING
        </div>
      </div>
    </div>
  );
}
