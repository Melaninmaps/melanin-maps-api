const reasons = [
  { label: "Not minority-owned", desc: "Business doesn't qualify for our directory", selected: true },
  { label: "Incorrect information", desc: "Wrong hours, address, or ownership", selected: false },
  { label: "Business is closed", desc: "Permanently shut down", selected: false },
  { label: "Misleading photos", desc: "Images don't represent the real experience", selected: false },
  { label: "Abusive owner response", desc: "Response violates community guidelines", selected: false },
  { label: "Other", desc: "Something else not listed here", selected: false },
];

export default function DemoS64ReportStep2Screen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>STEP 2 OF 3</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Select<br />the reason.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Six structured report categories keep the community process fair and actionable. "Not minority-owned" is the most critical flag — it's selected here. Zara adds her reason with one tap.
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", padding: "0.55vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Report Business</span>
        </div>
        <div style={{ padding: "0.6vw 0.8vw 0.3vw", flexShrink: 0 }}>
          <div style={{ color: "#1C0E06", fontSize: "0.58vw", fontWeight: 700, marginBottom: "0.15vw" }}>Urban Eats Kitchen</div>
          <div style={{ color: "#8C6A3A", fontSize: "0.44vw" }}>Why are you reporting this business?</div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.3vw 0.7vw 0.5vw", display: "flex", flexDirection: "column", gap: "0.4vw" }}>
          {reasons.map((r, i) => (
            <div key={i} style={{ background: r.selected ? "#FFF3E0" : "#fff", border: `0.08vw solid ${r.selected ? "#CA922B" : "#E8DDD0"}`, borderRadius: "0.6vw", padding: "0.55vw 0.7vw", display: "flex", alignItems: "center", gap: "0.5vw" }}>
              <div style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", border: `0.12vw solid ${r.selected ? "#CA922B" : "#C8B49A"}`, background: r.selected ? "#CA922B" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {r.selected && <div style={{ width: "0.3vw", height: "0.3vw", borderRadius: "50%", background: "#fff" }} />}
              </div>
              <div>
                <div style={{ color: r.selected ? "#CA922B" : "#1C0E06", fontSize: "0.52vw", fontWeight: r.selected ? 800 : 600 }}>{r.label}</div>
                <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "0.5vw 0.7vw 0.8vw", flexShrink: 0 }}>
          <div style={{ background: "#CA922B", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center" }}>
            <span style={{ color: "#fff", fontSize: "0.55vw", fontWeight: 700 }}>Continue →</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["6 structured categories", "Every report maps to a defined type — no open-ended abuse, no ambiguity."],
          ["Not minority-owned selected", "The most important flag in our directory — triggers a higher-priority review queue."],
          ["Review queue activated", "Once submitted, three confirmations from other members move it to formal community review."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>64</div>
    </div>
  );
}
