export default function DemoS67OfficerWatchText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#130A03" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(202,146,43,0.12) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "12%", bottom: "12%", maxWidth: "54vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "2vw" }}>OFFICER WATCH</div>
        <div className="font-display" style={{ fontSize: "5.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "2vw" }}>
          Real-time accountability<br />from <span style={{ color: "#CA922B" }}>real people.</span>
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2.5vw", opacity: 0.8 }} />
        <div style={{ fontSize: "1.15vw", color: "#C4A06A", lineHeight: 1.75, marginBottom: "2.5vw", maxWidth: "46vw" }}>
          When community members spot law enforcement activity, they submit real-time Officer Watch alerts. Type, location, confirmation count — surfaced to everyone nearby in seconds. No scanner app. No police blotter. Community-sourced and community-confirmed.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw 3vw", maxWidth: "46vw" }}>
          {[
            ["Checkpoint", "Vehicle stops with ID checks — reported by type and location."],
            ["Foot Patrol", "Officers on foot in a specific area — good to know before you walk."],
            ["Traffic Stop", "Pull-overs in progress — includes intersection and direction."],
            ["Stop & Question", "Individual stops without clear cause — the most critical to document."],
          ].map(([h, b], i) => (
            <div key={i}>
              <div style={{ color: "#CA922B", fontSize: "0.78vw", fontWeight: 800, marginBottom: "0.25vw" }}>{h}</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.7vw", lineHeight: 1.5 }}>{b}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "2.5vw", paddingLeft: "1.2vw", borderLeft: "0.18vw solid #CA922B" }}>
          <div style={{ color: "#CA922B", fontSize: "1.0vw", fontStyle: "italic", fontWeight: 600 }}>
            All alerts are anonymous by default. Community confirmations make them more reliable — not police validation.
          </div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.3 }}>67</div>
    </div>
  );
}
