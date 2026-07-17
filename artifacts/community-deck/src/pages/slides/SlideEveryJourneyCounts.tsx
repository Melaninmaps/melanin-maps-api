const journeys = [
  "Finding a new favorite coffee shop.",
  "Supporting a local entrepreneur.",
  "Moving to a new city.",
  "Visiting family.",
  "Attending college.",
  "Taking a business trip.",
  "Exploring your own hometown.",
  "Building a life.",
];

export default function SlideEveryJourneyCounts() {
  const half = Math.ceil(journeys.length / 2);
  const left = journeys.slice(0, half);
  const right = journeys.slice(half);

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(202,146,43,0.12) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        04
      </div>

      {/* Header */}
      <div className="absolute left-[7vw]" style={{ top: "6.5vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "0.7vw" }}>
          EVERY JOURNEY COUNTS
        </div>
        <h1 className="font-display" style={{ fontSize: "4.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05 }}>
          This isn&rsquo;t only for vacations.
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginTop: "1.4vw" }} />
      </div>

      {/* Two-column journey list */}
      <div className="absolute left-[7vw] right-[7vw]" style={{ top: "24vw", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 5vw" }}>
        {[left, right].map((col, ci) => (
          <div key={ci} className="flex flex-col" style={{ gap: "1.4vw" }}>
            {col.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1.2vw" }}>
                <div
                  style={{
                    flexShrink: 0,
                    width: "1.4vw",
                    height: "1.4vw",
                    borderRadius: "50%",
                    background: "rgba(202,146,43,0.12)",
                    border: "1px solid rgba(202,146,43,0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", background: "#CA922B" }} />
                </div>
                <span className="font-body" style={{ fontSize: "1.3vw", color: "#FAF6EF", fontWeight: 400, lineHeight: 1.3 }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom statement */}
      <div
        className="absolute left-[7vw] right-[7vw] flex items-center justify-center"
        style={{ bottom: "5.5vw", padding: "1.4vw 2vw", background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.3)" }}
      >
        <p className="font-display text-center" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.4 }}>
          They&rsquo;re all expressions of one idea: helping people feel like they belong wherever life takes them.
        </p>
      </div>
    </div>
  );
}
