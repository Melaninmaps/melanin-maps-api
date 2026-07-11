export default function DemoS66ReportConfirmScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>REPORT SUBMITTED</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Zara did<br />her part.<br /><span style={{ color: "#CA922B" }}>The index stays clean.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          One member report. Zero friction. The report enters the community review queue. When three members confirm it, a "Community Review" badge appears on the business. The platform investigates.
        </div>
        <div style={{ marginTop: "1.5vw", paddingLeft: "1vw", borderLeft: "0.15vw solid #CA922B" }}>
          <div style={{ color: "#CA922B", fontSize: "0.85vw", fontStyle: "italic", fontWeight: 600 }}>
            This is how the index self-corrects without a full-time moderation team.
          </div>
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", left: "40vw", top: "50%", transform: "translateY(-50%)", width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1vw 1.2vw", gap: "0.8vw" }}>
          {/* Success checkmark */}
          <div style={{ width: "4vw", height: "4vw", borderRadius: "50%", background: "linear-gradient(135deg,#27AE60,#1E8449)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0.3vw 1vw rgba(39,174,96,0.3)" }}>
            <svg width="2vw" height="2vw" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#1C0E06", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>Report Submitted</div>
            <div style={{ color: "#8C6A3A", fontSize: "0.48vw", lineHeight: 1.6 }}>Thank you for keeping our<br />community accurate.</div>
          </div>
          {/* Report ID */}
          <div style={{ background: "#F5EEE4", borderRadius: "0.6vw", padding: "0.45vw 0.8vw", width: "100%" }}>
            <div style={{ color: "#5C3A1A", fontSize: "0.42vw", fontWeight: 700, marginBottom: "0.2vw" }}>Report #MWM-2024-8847</div>
            <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>Urban Eats Kitchen · Not minority-owned · Anonymous</div>
          </div>
          {/* What happens next */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.45vw" }}>
            <div style={{ color: "#5C3A1A", fontSize: "0.48vw", fontWeight: 700, marginBottom: "0.1vw" }}>What happens next</div>
            {[
              { step: "1", label: "Enters community review queue", done: true },
              { step: "2", label: "2 more confirmations needed", done: false },
              { step: "3", label: "Platform review & decision", done: false },
            ].map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", background: s.done ? "#CA922B" : "#E8DDD0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: s.done ? "#fff" : "#8C6A3A", fontSize: "0.38vw", fontWeight: 800 }}>{s.done ? "✓" : s.step}</span>
                </div>
                <span style={{ color: s.done ? "#1C0E06" : "#8C6A3A", fontSize: "0.46vw" }}>{s.label}</span>
              </div>
            ))}
          </div>
          {/* Anonymous badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35vw", background: "#1C0E06", borderRadius: "0.5vw", padding: "0.35vw 0.6vw" }}>
            <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 700 }}>Your identity is protected</span>
          </div>
        </div>
        <div style={{ padding: "0.4vw 0.7vw 0.8vw", flexShrink: 0 }}>
          <div style={{ background: "#F5EEE4", borderRadius: "0.7vw", padding: "0.55vw", textAlign: "center" }}>
            <span style={{ color: "#5C3A1A", fontSize: "0.52vw", fontWeight: 600 }}>Continue Exploring</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Report ID assigned", "Every report gets a traceable ID so the reporter can check status — transparency without exposure."],
          ["3-confirmation threshold", "Community consensus required before any action — prevents bad-faith takedowns."],
          ["Identity shielded", "The anonymous badge confirms protection. No fear of retaliation from the business."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>66</div>
    </div>
  );
}
