export default function SlideInv35MarketOpportunity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>35</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>MARKET OPPORTUNITY</div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.1, marginTop: "0.5vw" }}>
          Building at the intersection<br />of six massive markets.
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#7B5408", marginTop: "0.7vw", maxWidth: "62vw" }}>
          Our growth isn't dependent on a single industry — we create value across multiple connected markets.
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#CA922B", fontWeight: 600, marginTop: "0.35vw", letterSpacing: "0.04em" }}>
          No single competitor owns all six. We do.
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "19vw", height: "1px", background: "rgba(202,146,43,0.3)" }} />

      {/* 6 Market tiles — 3 columns × 2 rows */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "21vw", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.8vw 3vw" }}>

        {/* 1 — Minority Consumer Spending */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18" />
            <path d="M16 10a4 4 0 01-8 0" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$3.9T</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Minority Consumer Spending</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>Annual US spending power</div>
        </div>

        {/* 2 — Travel & Tourism */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.66A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$1.9T</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Travel &amp; Tourism</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>US travel industry annually</div>
        </div>

        {/* 3 — Local Discovery */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$54B</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Local Discovery</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>Local search &amp; business discovery</div>
        </div>

        {/* 4 — Relocation Services */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$86B</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Relocation Services</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>US relocation market</div>
        </div>

        {/* 5 — Creator Economy */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$480B</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Creator Economy</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>Global creator economy</div>
        </div>

        {/* 6 — Business Enablement */}
        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.2vw" }}>
          <svg viewBox="0 0 24 24" style={{ width: "1.6vw", height: "1.6vw", fill: "none", stroke: "#CA922B", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round", marginBottom: "0.4vw" }}>
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
          </svg>
          <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B" }}>$73B</div>
          <div className="font-display" style={{ fontSize: "1.15vw", fontWeight: 700, color: "#1C0E06", marginTop: "0.2vw" }}>Business Enablement</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", marginTop: "0.25vw" }}>SMB technology &amp; tools market</div>
        </div>

      </div>

      {/* Market convergence bar */}
      <div className="absolute left-[6vw] right-[6vw]" style={{ bottom: "4.5vw", background: "#1C0E06", borderRadius: "0.5vw", padding: "1.1vw 2vw" }}>
        <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.45vw" }}>
          Each market reinforces the others.
        </div>
        <div className="font-body" style={{ fontSize: "0.88vw", color: "#A87A40", lineHeight: 1.5 }}>
          Travelers discover businesses &nbsp;·&nbsp; Businesses create experiences &nbsp;·&nbsp; Creators drive discovery &nbsp;·&nbsp; Communities generate trust &nbsp;·&nbsp; Relocation expands lifetime value
        </div>
      </div>

      {/* Sources footnote */}
      <div className="absolute left-[6vw] right-[6vw]" style={{ bottom: "2vw" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#B09060", opacity: 0.75 }}>
          Sources: U.S. Census Bureau, McKinsey, Grand View Research, Statista, Fortune Business Insights, and industry reports (2025–2026 estimates).
        </div>
      </div>
    </div>
  );
}
