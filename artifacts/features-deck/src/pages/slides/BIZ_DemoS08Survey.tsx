const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS08Survey() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 60%, rgba(202,146,43,0.06), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>NEIGHBORHOOD SURVEYS</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          Safety intel from the people who actually live there.
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          Crime statistics reflect police behavior — not community experience. They don't tell you if you'll be followed in a store or if the neighborhood genuinely welcomes you. Only the community can report that. Now it does.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Welcoming ratings capture cultural inclusion, not just absence of crime", "Night-time scores reflect when conditions actually change", "Police presence scores help the community navigate bias risk", "Aggregate reports create statistical weight for each neighborhood", "Survey data feeds directly into the safety map overlay"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Survey form */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Rate This Neighborhood</div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Shaw — Washington, DC</div>
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            {[
              { label: "Welcoming for minorities", val: 85 },
              { label: "Safety at night", val: 62 },
              { label: "Police interactions", val: 48 },
              { label: "Business district vibe", val: 78 },
              { label: "Would recommend to family", val: 71 },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{item.label}</span>
                  <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>{item.val}</span>
                </div>
                <div style={{ height: "0.3vw", background: "rgba(255,255,255,0.07)", borderRadius: "0.15vw", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, width: `${item.val}%`, height: "100%", background: item.val > 70 ? "#CA922B" : item.val > 50 ? "rgba(202,146,43,0.6)" : "rgba(190,60,40,0.7)", borderRadius: "0.15vw" }} />
                  <div style={{ position: "absolute", left: `${item.val}%`, top: "50%", transform: "translate(-50%,-50%)", width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: "#CA922B", border: "1.5px solid #FAF6EF" }} />
                </div>
              </div>
            ))}
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Additional notes (optional)</div>
              <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.5vw", padding: "0.45vw", border: "1px solid rgba(255,255,255,0.08)", height: "2.5vw" }}>
                <span style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Great vibe during the day. Be cautious after 10PM...</span>
              </div>
            </div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Submit Survey</span>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Neighborhood results */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Neighborhood Scores</div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Shaw · 847 community reports</div>
            {/* Score cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4vw" }}>
              {[
                { label: "Overall", val: "78", color: "#CA922B" },
                { label: "Welcoming", val: "91", color: "#4CAF50" },
                { label: "Night Safety", val: "62", color: "rgba(202,146,43,0.8)" },
                { label: "Police", val: "51", color: "rgba(190,60,40,0.9)" },
              ].map((s, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ color: s.color, fontSize: "1.1vw", fontWeight: 800 }}>{s.val}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>COMMUNITY INSIGHTS</div>
            {["Great for daytime dining and culture", "Park area feels safe for families", "Check community alerts after 10 PM", "Business district is thriving and vibrant"].map((insight, i) => (
              <div key={i} style={{ display: "flex", gap: "0.4vw", alignItems: "flex-start" }}>
                <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.3vw", flexShrink: 0 }} />
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.4 }}>{insight}</span>
              </div>
            ))}
            <div style={{ marginTop: "auto", background: "rgba(202,146,43,0.12)", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center", border: "1px solid rgba(202,146,43,0.3)" }}>
              <span style={{ color: "#CA922B", fontSize: "0.56vw", fontWeight: 700 }}>Add Your Report</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
