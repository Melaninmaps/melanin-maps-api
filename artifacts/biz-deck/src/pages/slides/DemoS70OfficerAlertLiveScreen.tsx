export default function DemoS70OfficerAlertLiveScreen() {
  const comments = [
    { init: "TL", text: "Confirmed — just drove through, 4 cars backed up", time: "1m" },
    { init: "KR", text: "Stay safe kin. Coming from Sherman Ave instead", time: "2m" },
    { init: "AM", text: "Route changed, thanks for the heads up 🙏", time: "3m" },
    { init: "DW", text: "Still active as of 9:38am", time: "4m" },
  ];
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>ALERT LIVE</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Submitted.<br />Community<br /><span style={{ color: "#CA922B" }}>confirming.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Zara's checkpoint alert went live in seconds. 14 community members confirmed it. Four shared route alternatives. The community protected each other — without a single app notification from Zara.
        </div>
        <div style={{ marginTop: "1.5vw", paddingLeft: "1vw", borderLeft: "0.15vw solid #CA922B" }}>
          <div style={{ color: "#CA922B", fontSize: "0.85vw", fontStyle: "italic", fontWeight: 600 }}>
            This is what safety looks like when the community owns it.
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
        <div style={{ background: "#FAF6EF", display: "flex", alignItems: "center", padding: "0.5vw 0.9vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#1C0E06" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700, marginLeft: "0.5vw" }}>Alert Detail</span>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.6vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {/* Alert card */}
          <div style={{ background: "#FFF3E0", border: "0.08vw solid #C0392B", borderRadius: "0.7vw", padding: "0.7vw 0.8vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.3vw" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.2vw", background: "#C0392B", borderRadius: "0.3vw", padding: "0.1vw 0.35vw" }}>
                <span style={{ color: "#fff", fontSize: "0.42vw", fontWeight: 800 }}>CHECKPOINT</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.25vw" }}>
                <div style={{ width: "0.4vw", height: "0.4vw", borderRadius: "50%", background: "#C0392B", boxShadow: "0 0 0.3vw #C0392B" }} />
                <span style={{ color: "#C0392B", fontSize: "0.42vw", fontWeight: 700 }}>LIVE</span>
              </div>
            </div>
            <div style={{ color: "#1C0E06", fontSize: "0.58vw", fontWeight: 700, marginBottom: "0.2vw" }}>Georgia Ave & Euclid St NW</div>
            <div style={{ color: "#8C6A3A", fontSize: "0.44vw", marginBottom: "0.5vw" }}>4 vehicles, northbound lane, ID checks · Anonymous</div>
            {/* Confirmation bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
              <div style={{ flex: 1, background: "#E8DDD0", borderRadius: "0.5vw", height: "0.4vw" }}>
                <div style={{ width: "82%", height: "100%", background: "#C0392B", borderRadius: "0.5vw" }} />
              </div>
              <span style={{ color: "#C0392B", fontSize: "0.5vw", fontWeight: 800, flexShrink: 0 }}>14 confirmed</span>
            </div>
          </div>
          {/* Confirm button */}
          <div style={{ background: "#1C0E06", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4vw" }}>
            <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>✓ Confirm this alert</span>
          </div>
          {/* Anonymous shield */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4vw", padding: "0.35vw 0.5vw", background: "#F5EEE4", borderRadius: "0.5vw" }}>
            <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>Your confirmation is anonymous</span>
          </div>
          {/* Community thread */}
          <div style={{ color: "#5C3A1A", fontSize: "0.48vw", fontWeight: 700, marginBottom: "0.1vw" }}>Community ({comments.length})</div>
          {comments.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: "0.45vw" }}>
              <div style={{ width: "1.3vw", height: "1.3vw", borderRadius: "50%", background: "linear-gradient(135deg,#CA922B,#5C3A1A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.35vw", fontWeight: 800 }}>{c.init}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#1C0E06", fontSize: "0.46vw", lineHeight: 1.5 }}>{c.text}</div>
                <div style={{ color: "#A87A40", fontSize: "0.38vw" }}>{c.time} ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["14 confirmations in minutes", "Community consensus builds instantly — each confirmation raises the alert's credibility score."],
          ["Route alternatives shared", "Community members don't just confirm — they help each other navigate around the situation."],
          ["Anonymous confirmations", "Even confirming an alert protects the user's identity — no fear of retaliation from reporting."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>70</div>
    </div>
  );
}
