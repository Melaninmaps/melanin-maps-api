export default function DemoS68OfficerWatchMapScreen() {
  const alerts = [
    { type: "CHECKPOINT", color: "#C0392B", loc: "Georgia Ave & Euclid St NW", conf: 14, time: "3 min ago" },
    { type: "FOOT PATROL", color: "#E67E22", loc: "U Street NW between 14th & 13th", conf: 8, time: "11 min ago" },
    { type: "TRAFFIC STOP", color: "#F39C12", loc: "14th St & Columbia Rd NW", conf: 5, time: "18 min ago" },
  ];

  // Map pins positions (percent of phone screen)
  const pins = [
    { x: 38, y: 32, color: "#C0392B", label: "Checkpoint" },
    { x: 60, y: 52, color: "#E67E22", label: "Foot Patrol" },
    { x: 52, y: 68, color: "#F39C12", label: "Traffic Stop" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>OFFICER WATCH MAP</div>
        <div className="font-display" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          3 active alerts.<br /><span style={{ color: "#CA922B" }}>Shaw right now.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Zara opens Officer Watch before walking from the Metro. She sees a checkpoint on Georgia Ave, a foot patrol on U Street, and a traffic stop on 14th. She plans her route accordingly.
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C1C1C", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        {/* Nav */}
        <div style={{ background: "#1C0E06", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5vw 0.9vw", flexShrink: 0 }}>
          <svg width="0.8vw" height="0.8vw" viewBox="0 0 16 16" fill="none" stroke="#FAF6EF" strokeWidth="2"><path d="M10 3L5 8l5 5"/></svg>
          <div style={{ display: "flex", alignItems: "center", gap: "0.35vw" }}>
            <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#C0392B", boxShadow: "0 0 0.3vw #C0392B" }} />
            <span style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 700 }}>Officer Watch — 3 Active</span>
          </div>
          <div style={{ background: "#CA922B", borderRadius: "0.35vw", padding: "0.15vw 0.4vw" }}>
            <span style={{ color: "#fff", fontSize: "0.42vw", fontWeight: 700 }}>+ Alert</span>
          </div>
        </div>
        {/* Map area */}
        <div style={{ position: "relative", height: "13vw", background: "linear-gradient(180deg,#2D2D2D,#1A1A1A)", flexShrink: 0, overflow: "hidden" }}>
          {/* Grid lines simulating map */}
          {[20,40,60,80].map(p => (
            <div key={p} style={{ position: "absolute", top: `${p}%`, left: 0, right: 0, height: "0.05vw", background: "rgba(255,255,255,0.06)" }} />
          ))}
          {[20,40,60,80].map(p => (
            <div key={p} style={{ position: "absolute", left: `${p}%`, top: 0, bottom: 0, width: "0.05vw", background: "rgba(255,255,255,0.06)" }} />
          ))}
          {/* Road lines */}
          <div style={{ position: "absolute", top: "35%", left: 0, right: 0, height: "0.2vw", background: "rgba(255,255,255,0.12)" }} />
          <div style={{ position: "absolute", top: "55%", left: 0, right: 0, height: "0.12vw", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", left: "45%", top: 0, bottom: 0, width: "0.18vw", background: "rgba(255,255,255,0.12)" }} />
          {/* Pins */}
          {pins.map((pin, i) => (
            <div key={i} style={{ position: "absolute", left: `${pin.x}%`, top: `${pin.y}%`, transform: "translate(-50%,-100%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ background: pin.color, borderRadius: "50% 50% 50% 0", width: "1.2vw", height: "1.2vw", transform: "rotate(-45deg)", boxShadow: `0 0 0.4vw ${pin.color}88`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.5vw" height="0.5vw" viewBox="0 0 16 16" fill="none" stroke="#fff" strokeWidth="2.5"><path d="M8 2C5.8 2 4 3.8 4 6c0 3.3 4 8 4 8s4-4.7 4-8c0-2.2-1.8-4-4-4z"/><circle cx="8" cy="6" r="1.5" fill="#fff"/></svg>
              </div>
              <div style={{ background: pin.color, borderRadius: "0.25vw", padding: "0.1vw 0.3vw", marginTop: "0.15vw" }}>
                <span style={{ color: "#fff", fontSize: "0.35vw", fontWeight: 800 }}>{pin.label}</span>
              </div>
            </div>
          ))}
          {/* User location */}
          <div style={{ position: "absolute", left: "50%", top: "80%", transform: "translate(-50%,-50%)" }}>
            <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: "#3498DB", border: "0.1vw solid #fff", boxShadow: "0 0 0.5vw rgba(52,152,219,0.6)" }} />
          </div>
        </div>
        {/* Alert list */}
        <div style={{ flex: 1, overflowY: "auto", background: "#FAF6EF", padding: "0.4vw 0.6vw", display: "flex", flexDirection: "column", gap: "0.4vw" }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.6vw", padding: "0.5vw 0.65vw", borderLeft: `0.2vw solid ${a.color}`, boxShadow: "0 0.05vw 0.2vw rgba(28,14,6,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.2vw", background: `${a.color}18`, borderRadius: "0.3vw", padding: "0.08vw 0.3vw" }}>
                  <span style={{ color: a.color, fontSize: "0.42vw", fontWeight: 800 }}>{a.type}</span>
                </div>
                <span style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>{a.time}</span>
              </div>
              <div style={{ color: "#1C0E06", fontSize: "0.5vw", marginBottom: "0.15vw" }}>{a.loc}</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>{a.conf} confirmed · Tap to add yours</div>
            </div>
          ))}
        </div>
        {/* Bottom CTA */}
        <div style={{ padding: "0.4vw 0.7vw 0.7vw", background: "#FAF6EF", flexShrink: 0 }}>
          <div style={{ background: "#1C0E06", borderRadius: "0.7vw", padding: "0.55vw", textAlign: "center" }}>
            <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>Submit New Officer Alert</span>
          </div>
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Color-coded by type", "Red = checkpoint (most urgent), orange = foot patrol, yellow = traffic stop — scannable at a glance."],
          ["14 confirmations on the checkpoint", "Community consensus makes each alert more reliable as more members confirm."],
          ["Live user location", "Her blue dot shows her position relative to all active alerts — route intelligently."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>68</div>
    </div>
  );
}
