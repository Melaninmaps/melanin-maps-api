export default function SlideInv35MarketOpportunity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>35</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>MARKET OPPORTUNITY</div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          We sit at the intersection<br />of six high-growth markets.
        </div>
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#7B5408", marginTop: "0.8vw" }}>
          No single competitor owns all six. We do.
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "18vw", height: "1px", background: "rgba(202,146,43,0.3)" }} />

      {/* 6 Market tiles — 3 columns × 2 rows */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "20vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.6vw 3vw" }}>

        {/* 1 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$3.9T</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Minority Consumer Spending</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>Annual US spending power</div>
        </div>

        {/* 2 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$1.9T</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Travel &amp; Tourism</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>US travel industry annually</div>
        </div>

        {/* 3 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$54B</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Local Discovery &amp; Listings</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>Local search &amp; business discovery</div>
        </div>

        {/* 4 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$86B</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Relocation Services</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>US relocation market</div>
        </div>

        {/* 5 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$480B</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Creator &amp; Community Economy</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>Global creator economy</div>
        </div>

        {/* 6 */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$73B</div>
          <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Small Business Software</div>
          <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", marginTop: "0.3vw" }}>SMB SaaS &amp; tools market</div>
        </div>

      </div>

      {/* Bottom TAM callout */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[3vw]" style={{ background: "#1C0E06", borderRadius: "0.5vw", padding: "1.2vw 2vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>
          Total Addressable Market across all six segments
        </div>
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 800, color: "#CA922B" }}>
          $6.4T+
        </div>
      </div>
    </div>
  );
}
