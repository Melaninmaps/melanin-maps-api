const activityTypes = [
  { label: "Checkpoint", icon: "🚧", color: "#C0392B", selected: true },
  { label: "Traffic Stop", icon: "🚗", color: "#E67E22", selected: false },
  { label: "Foot Patrol", icon: "👮", color: "#F39C12", selected: false },
  { label: "Stop & Question", icon: "⚠️", color: "#8E44AD", selected: false },
  { label: "Unmarked Vehicle", icon: "🚙", color: "#2C3E50", selected: false },
  { label: "Other", icon: "•••", color: "#7F8C8D", selected: false },
];

export default function DemoS69OfficerSubmitScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>SUBMIT AN ALERT</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Zara sees<br />a checkpoint.<br /><span style={{ color: "#CA922B" }}>She reports it.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Six activity types. Auto-detected location. Optional badge number. Anonymous toggle on by default. Takes under 30 seconds — and immediately protects everyone nearby.
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", left: "40vw", top: "50%", transform: "translateY(-50%)", width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", padding: "0.55vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Submit Officer Alert</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.6vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.65vw" }}>
          {/* Type grid */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.4vw" }}>Activity Type</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.35vw" }}>
              {activityTypes.map((t, i) => (
                <div key={i} style={{ background: t.selected ? `${t.color}18` : "#fff", border: `0.08vw solid ${t.selected ? t.color : "#E8DDD0"}`, borderRadius: "0.55vw", padding: "0.45vw 0.5vw", display: "flex", alignItems: "center", gap: "0.35vw" }}>
                  <span style={{ fontSize: "0.55vw" }}>{t.icon}</span>
                  <span style={{ color: t.selected ? t.color : "#3A2210", fontSize: "0.45vw", fontWeight: t.selected ? 800 : 500 }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Location */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Location</div>
            <div style={{ background: "#fff", border: "0.08vw solid #CA922B", borderRadius: "0.55vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 600 }}>Georgia Ave & Euclid St NW</div>
                <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>Auto-detected · Tap to adjust</div>
              </div>
            </div>
          </div>
          {/* Badge number */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Badge Number <span style={{ color: "#8C6A3A", fontWeight: 400 }}>(optional)</span></div>
            <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.55vw", padding: "0.5vw 0.7vw" }}>
              <span style={{ color: "#C8B49A", fontSize: "0.5vw" }}>e.g. 4728</span>
            </div>
          </div>
          {/* Direction / notes */}
          <div>
            <div style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 700, marginBottom: "0.35vw" }}>Notes <span style={{ color: "#8C6A3A", fontWeight: 400 }}>(optional)</span></div>
            <div style={{ background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.55vw", padding: "0.5vw 0.7vw", minHeight: "2.2vw" }}>
              <span style={{ color: "#3A2210", fontSize: "0.48vw" }}>4 vehicles, northbound lane, checking IDs</span>
            </div>
          </div>
          {/* Anonymous toggle */}
          <div style={{ background: "#1C0E06", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ color: "#FAF6EF", fontSize: "0.5vw", fontWeight: 700 }}>Submit anonymously</div>
              <div style={{ color: "#6B4A2A", fontSize: "0.4vw" }}>Your identity stays protected</div>
            </div>
            <div style={{ width: "1.8vw", height: "0.95vw", background: "#CA922B", borderRadius: "1vw", position: "relative" }}>
              <div style={{ position: "absolute", right: "0.1vw", top: "0.1vw", width: "0.75vw", height: "0.75vw", background: "#fff", borderRadius: "50%" }} />
            </div>
          </div>
        </div>
        <div style={{ padding: "0.4vw 0.7vw 0.7vw", flexShrink: 0 }}>
          <div style={{ background: "#C0392B", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center" }}>
            <span style={{ color: "#fff", fontSize: "0.55vw", fontWeight: 700 }}>Confirm & Submit Alert</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Auto-location detection", "GPS auto-fills the intersection — no typing an address while walking quickly."],
          ["Badge number is optional", "If visible and safe to record, it helps. If not, the report is still valuable."],
          ["Under 30 seconds", "The entire submission flow — select type, confirm location, toggle anonymous, tap submit."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>69</div>
    </div>
  );
}
