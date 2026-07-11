export default function SlideInv49Transformation() {
  const rows = [
    { before: "Unknown",           after: "Recommended"                  },
    { before: "Chasing customers", after: "Customers finding you"        },
    { before: "Guessing what works", after: "Knowing what works"         },
    { before: "Buying ads",        after: "Earning trust"                },
    { before: "Working alone",     after: "KinfolkAI™ working beside you" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 54%, rgba(202,146,43,0.13), transparent 55%)" }} />

      {/* Section label */}
      <div className="absolute left-[6vw] right-[6vw] top-[3.5vw] text-center">
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700 }}>SIX MONTHS LATER...</div>
      </div>

      {/* Table */}
      <div style={{ width: "72vw", position: "relative", zIndex: 10 }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0 3vw", marginBottom: "1.8vw", paddingBottom: "1vw", borderBottom: "1px solid rgba(202,146,43,0.2)" }}>
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#5C3A1A", fontWeight: 700, letterSpacing: "0.14em", textAlign: "right" }}>BEFORE</div>
          <div style={{ width: "1.5vw" }} />
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.14em", textAlign: "left" }}>AFTER</div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0 3vw", alignItems: "center", padding: "1.3vw 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none" }}>
            {/* Before */}
            <div style={{ textAlign: "right" }}>
              <span className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "rgba(217,196,163,0.3)", textDecoration: "line-through", textDecorationColor: "rgba(217,196,163,0.2)" }}>{row.before}</span>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "1.5vw" }}>
              <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </div>

            {/* After */}
            <div style={{ textAlign: "left" }}>
              <span className="font-display" style={{ fontSize: "1.6vw", fontWeight: 800, color: "#FAF6EF" }}>{row.after}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Closing statement */}
      <div style={{ marginTop: "3.5vw", width: "72vw", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "2vw" }} />
        <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.25 }}>
          Your community didn't just discover your business.
        </div>
        <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.25 }}>
          They started recommending it.
        </div>
      </div>
    </div>
  );
}
