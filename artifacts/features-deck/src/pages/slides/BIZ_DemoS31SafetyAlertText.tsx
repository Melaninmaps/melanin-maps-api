export default function DemoS31SafetyAlertText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 15% 50%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />
      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · REAL-TIME SAFETY ALERTS</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Community Intel.<br />Not a police scanner.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          The Community Intelligence feature lets diaspora members post geo-tagged, real-time alerts to the feed. Not crime stats pulled from a police API. Not algorithmic risk scores. Real people telling each other what's actually happening in their neighborhood right now.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {[
            { head: "What members report", body: "Road closures, construction, protests and marches, cultural celebrations, ICE activity, police presence, severe weather, unsafe spaces, and neighborhood hazards." },
            { head: "Geo-tagged, time-stamped, voted on", body: "Alerts appear on the map within your radius. Other members can confirm or dispute them. Unconfirmed alerts flag automatically after 2 hours." },
            { head: "Travel alerts for moving diaspora members", body: "If Zara is traveling to Houston and sets a destination, she gets safety context for that neighborhood from Houston-based community members — before she arrives." },
            { head: "Push notifications for critical alerts", body: "Opt-in alerts for police/ICE activity and community safety emergencies. Delivered within seconds of being posted by a verified community member nearby." },
          ].map((p, i) => (
            <div key={i} style={{ display: "flex", gap: "1vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                <span className="font-body" style={{ color: "#CA922B", fontSize: "0.65vw", fontWeight: 800 }}>{i + 1}</span>
              </div>
              <div>
                <div className="font-display" style={{ color: "#FAF6EF", fontSize: "1.05vw", fontWeight: 700, marginBottom: "0.35vw" }}>{p.head}</div>
                <div className="font-body" style={{ color: "#7B5408", fontSize: "0.9vw", lineHeight: 1.65 }}>{p.body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>31 / 58</div>
    </div>
  );
}
