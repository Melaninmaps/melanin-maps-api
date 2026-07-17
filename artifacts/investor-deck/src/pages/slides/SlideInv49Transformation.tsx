export default function SlideInv49Transformation() {
  const rows = [
    { before: "Unknown in the community",   after: "Frequently recommended"              },
    { before: "Guessing what works",        after: "Community Trust Score growing"       },
    { before: "Buying ads",                 after: "Customers finding you organically"   },
    { before: "Managing reviews manually",  after: "KinfolkAI™ monitoring opportunities" },
    { before: "Hoping customers return",    after: "Your reputation keeps growing"       },
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
          <div style={{ textAlign: "right" }}>
            <div className="font-body" style={{ fontSize: "0.75vw", color: "#5C3A1A", fontWeight: 700, letterSpacing: "0.12em" }}>BEFORE</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#4A2E12", fontWeight: 600, marginTop: "0.2vw" }}>Mapping With Melanin™</div>
          </div>
          <div style={{ width: "1.5vw" }} />
          <div style={{ textAlign: "left" }}>
            <div className="font-body" style={{ fontSize: "0.75vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.12em" }}>AFTER</div>
            <div className="font-body" style={{ fontSize: "0.78vw", color: "#A87A40", fontWeight: 600, marginTop: "0.2vw" }}>Mapping With Melanin™</div>
          </div>
        </div>

        {/* Rows */}
        {rows.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "0 3vw", alignItems: "center", padding: "1.3vw 0", borderBottom: i < rows.length - 1 ? "1px solid rgba(202,146,43,0.08)" : "none" }}>
            {/* Before */}
            <div style={{ textAlign: "right", opacity: 0.22 }}>
              <span className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#D9C4A3", textDecoration: "line-through", textDecorationColor: "rgba(217,196,163,0.5)" }}>{row.before}</span>
            </div>

            {/* Arrow */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2.4vw" }}>
              <span className="font-display" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "-0.1em", opacity: 0.8 }}>&#187;&#187;</span>
            </div>

            {/* After */}
            <div style={{ textAlign: "left" }}>
              <span className="font-display" style={{ fontSize: "1.6vw", fontWeight: 800, color: "#FAF6EF", textShadow: "0 0 28px rgba(202,146,43,0.35)" }}>{row.after}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Closing statement */}
      <div style={{ marginTop: "3.5vw", width: "72vw", textAlign: "center", position: "relative", zIndex: 10 }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "2vw" }} />
        <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.25 }}>
          Your customers didn't just find your business.
        </div>
        <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.25 }}>
          They started bringing the next customer with them.
        </div>
      </div>
    </div>
  );
}
