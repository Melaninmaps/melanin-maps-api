export default function DemoS65ReportStep3Screen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>STEP 3 OF 3</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Add context.<br /><span style={{ color: "#CA922B" }}>Stay anonymous.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Optional evidence helps our community team verify the report faster — but it's never required. Anonymous mode is on by default. Zara submits with zero fear of retaliation.
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
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Add Details</span>
        </div>
        <div style={{ flex: 1, padding: "0.7vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.7vw" }}>
          {/* Selected reason recap */}
          <div style={{ background: "#FFF3E0", border: "0.08vw solid #CA922B", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
            <span style={{ color: "#CA922B", fontSize: "0.55vw" }}>⚑</span>
            <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>Not minority-owned</span>
          </div>
          {/* Evidence field */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Additional context <span style={{ color: "#8C6A3A", fontWeight: 400 }}>(optional)</span></div>
            <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", minHeight: "3.5vw" }}>
              <div style={{ color: "#3A2210", fontSize: "0.48vw", lineHeight: 1.6 }}>
                Ownership is listed under a different LLC on public business registrations. The original owner sold in 2024.
              </div>
            </div>
          </div>
          {/* Anonymous toggle */}
          <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.6vw", padding: "0.55vw 0.7vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700 }}>Submit anonymously</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Business never sees your name</div>
            </div>
            <div style={{ width: "1.8vw", height: "0.95vw", background: "#CA922B", borderRadius: "1vw", position: "relative" }}>
              <div style={{ position: "absolute", right: "0.1vw", top: "0.1vw", width: "0.75vw", height: "0.75vw", background: "#fff", borderRadius: "50%" }} />
            </div>
          </div>
          {/* What happens next */}
          <div style={{ background: "#F5EEE4", borderRadius: "0.6vw", padding: "0.55vw 0.7vw" }}>
            <div style={{ color: "#5C3A1A", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.2vw" }}>What happens next</div>
            {["Your report enters the community review queue","3 confirmations → formal platform review","Confirmed flags add a visible indicator to the listing"].map((s,i) => (
              <div key={i} style={{ color: "#8C6A3A", fontSize: "0.42vw", lineHeight: 1.6 }}>· {s}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: "0.4vw 0.7vw 0.8vw", flexShrink: 0 }}>
          <div style={{ background: "#C0392B", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center" }}>
            <span style={{ color: "#fff", fontSize: "0.55vw", fontWeight: 700 }}>Submit Report</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Context accelerates review", "Public records, photos, or descriptions move reports through the queue 3x faster."],
          ["Anonymous is the default", "We designed for protection first — members shouldn't have to think about this."],
          ["Transparent process", "The reporter sees exactly what happens next — no black box, no silence."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>65</div>
    </div>
  );
}
