export default function DemoS72UnsafeSpaceConfirmScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>INCIDENT FILED</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          She was heard.<br /><span style={{ color: "#CA922B" }}>The community acts.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          The Unsafe Space report is filed, anonymized, and enters the community review queue. When two more members confirm a similar experience, a "Community Caution" badge appears publicly on Urban Eats Kitchen's profile — visible to all users before they visit.
        </div>
        <div style={{ marginTop: "1.5vw", paddingLeft: "1vw", borderLeft: "0.15vw solid #CA922B" }}>
          <div style={{ color: "#CA922B", fontSize: "0.85vw", fontStyle: "italic", fontWeight: 600 }}>
            No other platform puts this protection in the same app as the business directory.
          </div>
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0.8vw 1vw", gap: "0.75vw" }}>
          {/* Success icon */}
          <div style={{ width: "4vw", height: "4vw", borderRadius: "50%", background: "linear-gradient(135deg,#8E44AD,#6C3483)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0.3vw 1vw rgba(142,68,173,0.3)" }}>
            <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#1C0E06", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.25vw" }}>Incident Report Filed</div>
            <div style={{ color: "#8C6A3A", fontSize: "0.46vw", lineHeight: 1.6 }}>Your experience has been documented.<br />You are protected.</div>
          </div>
          {/* Report summary */}
          <div style={{ background: "#F5EEE4", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", width: "100%" }}>
            <div style={{ color: "#5C3A1A", fontSize: "0.45vw", fontWeight: 700, marginBottom: "0.25vw" }}>Report #MWM-US-3341</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2vw" }}>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Urban Eats Kitchen · Columbia Heights</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Incident: Racial profiling · July 11, 9:15 AM</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Submitted anonymously · Owner not notified</div>
            </div>
          </div>
          {/* Progress toward caution badge */}
          <div style={{ width: "100%", background: "#fff", border: "0.08vw solid #E8DDD0", borderRadius: "0.6vw", padding: "0.55vw 0.7vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3vw" }}>
              <span style={{ color: "#5C3A1A", fontSize: "0.45vw", fontWeight: 700 }}>Community Caution threshold</span>
              <span style={{ color: "#8E44AD", fontSize: "0.45vw", fontWeight: 700 }}>1 of 3</span>
            </div>
            <div style={{ background: "#E8DDD0", borderRadius: "0.5vw", height: "0.35vw", marginBottom: "0.3vw" }}>
              <div style={{ width: "33%", height: "100%", background: "#8E44AD", borderRadius: "0.5vw" }} />
            </div>
            <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>2 more community reports → public Caution badge appears on this business</div>
          </div>
          {/* What caution badge looks like */}
          <div style={{ width: "100%", background: "#FFF3E0", border: "0.08vw solid #E67E22", borderRadius: "0.6vw", padding: "0.5vw 0.7vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4vw", marginBottom: "0.2vw" }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#E67E22" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <span style={{ color: "#E67E22", fontSize: "0.45vw", fontWeight: 800 }}>Community Caution</span>
            </div>
            <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>Multiple community members have reported concerns about this space. Visit with awareness.</div>
          </div>
          {/* Anonymous shield */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35vw", background: "#1C0E06", borderRadius: "0.5vw", padding: "0.35vw 0.6vw" }}>
            <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>Your identity is completely protected</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Progress toward caution badge", "Reporter sees they are 1 of 3 — they know their report has real, visible impact when confirmed."],
          ["What the badge looks like", "We show the reporter a preview of the 'Community Caution' indicator that will appear publicly."],
          ["Owner not notified (this time)", "The reporter chose not to alert the owner — that toggle gave them full control of the situation."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>72</div>
    </div>
  );
}
