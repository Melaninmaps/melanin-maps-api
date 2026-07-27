const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS06Map() {
  const pins = [
    { top: 22, left: 30, score: 97, active: false },
    { top: 38, left: 55, score: 94, active: true },
    { top: 55, left: 25, score: 91, active: false },
    { top: 28, left: 70, score: 88, active: false },
    { top: 65, left: 60, score: 85, active: false },
    { top: 45, left: 78, score: 92, active: false },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>THE MAP</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Find places.<br /><span style={{ color: "#CA922B" }}>Feel confident getting there.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Knowing where to eat is only half the information you need. Knowing how it feels to be a minority in that space is the other half. We made that visible — because it always mattered.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Neighborhood safety overlay reflects real community surveys",
            "Geo alert fires automatically when scores drop below threshold",
            "Data from people with lived experience — not crime databases",
            "Safety layers and business pins load together — one complete view",
            "Community intel updates as conditions and reports change",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Full map with pins */}
        <Phone>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            {/* Map background */}
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a2518 0%, #152012 40%, #1c2a18 100%)" }}>
              {/* Road-like lines */}
              <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "45%", width: "1px", background: "rgba(255,255,255,0.1)" }} />
              <div style={{ position: "absolute", top: "65%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              {/* Safety overlay patches */}
              <div style={{ position: "absolute", top: "15%", left: "15%", width: "30%", height: "25%", background: "rgba(46,140,46,0.18)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: "50%", left: "40%", width: "25%", height: "20%", background: "rgba(202,146,43,0.12)", borderRadius: "50%" }} />
              <div style={{ position: "absolute", top: "60%", left: "60%", width: "30%", height: "25%", background: "rgba(190,60,40,0.12)", borderRadius: "50%" }} />
            </div>
            {/* Business pins */}
            {pins.map((pin, i) => (
              <div key={i} style={{ position: "absolute", top: `${pin.top}%`, left: `${pin.left}%`, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>
                <div style={{ background: pin.active ? "#CA922B" : "rgba(202,146,43,0.85)", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", width: `${pin.active ? 2.2 : 1.6}vw`, height: `${pin.active ? 2.2 : 1.6}vw`, border: pin.active ? "2px solid #FAF6EF" : "1px solid rgba(202,146,43,0.4)", boxShadow: pin.active ? "0 0 0.8vw rgba(202,146,43,0.7)" : "none" }} />
                {pin.active && (
                  <div style={{ position: "absolute", top: "-2.2vw", left: "50%", transform: "translateX(-50%)", background: "rgba(13,8,5,0.95)", borderRadius: "0.6vw", padding: "0.3vw 0.6vw", border: "1px solid rgba(202,146,43,0.5)", whiteSpace: "nowrap" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 800 }}>Trust {pin.score}</span>
                  </div>
                )}
              </div>
            ))}
            {/* Search bar overlay */}
            <div style={{ position: "absolute", top: "4%", left: "4%", right: "4%", background: "rgba(13,8,5,0.92)", borderRadius: "0.8vw", padding: "0.5vw 0.8vw", display: "flex", alignItems: "center", gap: "0.5vw", border: "1px solid rgba(202,146,43,0.3)" }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span style={{ color: "#A87A40", fontSize: "0.52vw" }}>Search the map...</span>
            </div>
            {/* Bottom card */}
            <div style={{ position: "absolute", bottom: "3%", left: "4%", right: "4%", background: "rgba(13,8,5,0.95)", borderRadius: "0.8vw", padding: "0.6vw 0.8vw", border: "1px solid rgba(202,146,43,0.4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>Copper & Oak Bistro</div>
                  <div style={{ color: "#A87A40", fontSize: "0.46vw" }}>0.3 mi · Open Now</div>
                </div>
                <div style={{ background: "#CA922B", borderRadius: "0.4vw", padding: "0.15vw 0.4vw" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 800 }}>97</span>
                </div>
              </div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Safety overlay + geo alert */}
        <Phone>
          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, #1a2518 0%, #152012 100%)" }}>
              <div style={{ position: "absolute", top: "30%", left: 0, right: 0, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "1px", background: "rgba(255,255,255,0.08)" }} />
              {/* Safety zone overlays */}
              <div style={{ position: "absolute", top: "10%", left: "5%", width: "40%", height: "30%", background: "rgba(46,140,46,0.22)", border: "1px solid rgba(46,140,46,0.4)", borderRadius: "40%" }} />
              <div style={{ position: "absolute", top: "35%", left: "30%", width: "35%", height: "28%", background: "rgba(202,146,43,0.2)", border: "1px solid rgba(202,146,43,0.4)", borderRadius: "40%" }} />
              <div style={{ position: "absolute", top: "55%", left: "50%", width: "40%", height: "30%", background: "rgba(190,60,40,0.2)", border: "1px solid rgba(190,60,40,0.4)", borderRadius: "40%" }} />
              {/* Legend */}
              <div style={{ position: "absolute", top: "4%", right: "4%", background: "rgba(13,8,5,0.9)", borderRadius: "0.5vw", padding: "0.4vw 0.5vw", display: "flex", flexDirection: "column", gap: "0.25vw" }}>
                {[{ color: "rgba(46,140,46,0.8)", label: "High Safety" }, { color: "rgba(202,146,43,0.8)", label: "Moderate" }, { color: "rgba(190,60,40,0.8)", label: "Use Caution" }].map((l, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.3vw" }}>
                    <div style={{ width: "0.6vw", height: "0.6vw", borderRadius: "0.15vw", background: l.color }} />
                    <span style={{ color: "#A87A40", fontSize: "0.38vw" }}>{l.label}</span>
                  </div>
                ))}
              </div>
              {/* Pins */}
              {[[20, 20], [45, 35], [30, 62]].map(([t, l], i) => (
                <div key={i} style={{ position: "absolute", top: `${t}%`, left: `${l}%`, width: "1.4vw", height: "1.4vw", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: "rgba(202,146,43,0.85)" }} />
              ))}
            </div>
            {/* Geo alert banner */}
            <div style={{ position: "absolute", top: "4%", left: "4%", right: "4%", background: "rgba(180,100,20,0.95)", borderRadius: "0.7vw", padding: "0.55vw 0.7vw", border: "1px solid rgba(202,146,43,0.6)" }}>
              <div style={{ display: "flex", gap: "0.4vw", alignItems: "flex-start" }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 24 24" fill="none" stroke="#FAF6EF" strokeWidth="2" strokeLinecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.5vw", fontWeight: 700 }}>Community Alert</div>
                  <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.46vw", lineHeight: 1.4 }}>Lower safety scores in this area. See community survey data →</div>
                </div>
              </div>
            </div>
            {/* Bottom: safety score for neighborhood */}
            <div style={{ position: "absolute", bottom: "3%", left: "4%", right: "4%", background: "rgba(13,8,5,0.95)", borderRadius: "0.8vw", padding: "0.6vw 0.8vw", border: "1px solid rgba(202,146,43,0.3)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700, marginBottom: "0.2vw" }}>SHAW NEIGHBORHOOD</div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                {[{ label: "Overall", val: "78" }, { label: "At Night", val: "62" }, { label: "Welcoming", val: "91" }].map((s, i) => (
                  <div key={i} style={{ textAlign: "center" }}>
                    <div style={{ color: "#FAF6EF", fontSize: "0.65vw", fontWeight: 800 }}>{s.val}</div>
                    <div style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
