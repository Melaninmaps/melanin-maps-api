export default function SlideInv36BusinessModel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>36</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>BUSINESS MODEL</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.45vw" }}>
          Multiple customer groups.<br />Multiple revenue streams.
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", marginTop: "0.6vw" }}>
          Four distinct customer segments — each generating recurring, scalable revenue on the same platform.
        </div>
      </div>

      {/* 4-column grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0" }}>

        {/* ── Col 1: Consumers ── */}
        <div style={{ paddingRight: "2vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          {/* Header pill */}
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.6vw 1vw", display: "inline-block", marginBottom: "0.9vw" }}>
            <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700 }}>CONSUMERS</div>
          </div>
          {/* Arrow */}
          <div className="font-display" style={{ fontSize: "1.1vw", color: "#CA922B", marginBottom: "1vw", paddingLeft: "0.3vw" }}>↓</div>

          {/* Stream 1 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Subscriptions</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>FREE · $9.99 · $19.99/mo</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Discovery, trip planning, Circles, KinfolkAI™ recommendations</div>
          </div>

          {/* Stream 2 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>AI Premium</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>TRAILBLAZER TIER</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Advanced KinfolkAI™, full ecosystem access, early features</div>
          </div>

          {/* Stream 3 */}
          <div>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Marketplace</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>TRANSACTION FEES</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Bookings, event tickets, reservations through the platform</div>
          </div>
        </div>

        {/* ── Col 2: Businesses ── */}
        <div style={{ paddingLeft: "2vw", paddingRight: "2vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.6vw 1vw", display: "inline-block", marginBottom: "0.9vw" }}>
            <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700 }}>BUSINESSES</div>
          </div>
          <div className="font-display" style={{ fontSize: "1.1vw", color: "#CA922B", marginBottom: "1vw", paddingLeft: "0.3vw" }}>↓</div>

          {/* Stream 1 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Memberships</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>$29 · $99/mo</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Verified listings, reviews, customer intelligence, growth tools</div>
          </div>

          {/* Stream 2 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Promotions</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>PLACEMENT · SPOTLIGHT</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Top of search, map pins, curated spotlights, homepage features</div>
          </div>

          {/* Stream 3 */}
          <div>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Analytics &amp; Events</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>INSIGHTS · TICKETING</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Community performance data, event creation, direct ticket sales</div>
          </div>
        </div>

        {/* ── Col 3: Cities & Organizations ── */}
        <div style={{ paddingLeft: "2vw", paddingRight: "2vw", borderRight: "1px solid rgba(58,31,14,0.12)" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.6vw 1vw", display: "inline-block", marginBottom: "0.9vw" }}>
            <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700 }}>CITIES &amp; ORGS</div>
          </div>
          <div className="font-display" style={{ fontSize: "1.1vw", color: "#CA922B", marginBottom: "1vw", paddingLeft: "0.3vw" }}>↓</div>

          {/* Stream 1 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Tourism Partnerships</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>DESTINATION DEALS</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>City and regional tourism boards, destination content licensing</div>
          </div>

          {/* Stream 2 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Economic Development</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>EQUITY PROGRAMS</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Equitable business visibility, minority district promotion</div>
          </div>

          {/* Stream 3 */}
          <div>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Community Programs</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>CULTURAL ACTIVATION</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Sponsored events, cultural content, neighborhood programming</div>
          </div>
        </div>

        {/* ── Col 4: Enterprise ── */}
        <div style={{ paddingLeft: "2vw" }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.6vw 1vw", display: "inline-block", marginBottom: "0.9vw" }}>
            <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700 }}>ENTERPRISE</div>
          </div>
          <div className="font-display" style={{ fontSize: "1.1vw", color: "#CA922B", marginBottom: "1vw", paddingLeft: "0.3vw" }}>↓</div>

          {/* Stream 1 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Employer Transparency</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>WORKPLACE SCORES</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Community-powered DEI and workplace culture ratings for employers</div>
          </div>

          {/* Stream 2 */}
          <div style={{ marginBottom: "1.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Recruiting</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>TALENT PIPELINE</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Access to engaged melanated diaspora talent and community reach</div>
          </div>

          {/* Stream 3 */}
          <div>
            <div className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#1C0E06" }}>Community Engagement</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#CA922B", fontWeight: 600, marginTop: "0.15vw", letterSpacing: "0.05em" }}>BRAND ACTIVATION</div>
            <div className="font-body" style={{ fontSize: "0.88vw", color: "#5C3A1A", marginTop: "0.2vw", lineHeight: 1.45 }}>Corporate team programs, ERG activations, authentic brand presence</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw]" style={{ bottom: "2.2vw", borderTop: "1px solid rgba(202,146,43,0.25)", paddingTop: "0.9vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#7B5408", fontStyle: "italic" }}>
          Four customer groups. Four revenue streams. One platform powering them all.
        </div>
        <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.1em" }}>
          RECURRING &nbsp;·&nbsp; SCALABLE &nbsp;·&nbsp; COMPOUNDING
        </div>
      </div>
    </div>
  );
}
