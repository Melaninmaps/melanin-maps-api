export default function DemoS16TravelSafetyText() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 85% 40%, rgba(202,146,43,0.1), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "10%", bottom: "10%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · TRAVEL WITH CONFIDENCE</div>

        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0.8vw" }}>
          Travel with backup.<br />Always.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "2vw", opacity: 0.8 }} />

        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.75, marginBottom: "3vw", maxWidth: "62vw" }}>
          Women of the melanated diaspora are statistically among the most targeted demographics for travel-related harm — and the least served by mainstream safety apps. Mapping With Melanin™ was built, in part, to change that.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {[
            { head: "Before you leave: Know the area", body: "Neighborhood Safety surveys give community-sourced confidence scores for any zip code or city — before you book a hotel or accept a meeting invite." },
            { head: "While you're there: Check-In active", body: "Schedule a safety check-in with a trusted contact. If you don't confirm by the time you set, they're alerted immediately — no app required on their end." },
            { head: "In the moment: Share your location", body: "One tap sends a live location link to anyone — a friend, a family member, a community circle. They see exactly where you are, in real time, for exactly as long as you choose." },
            { head: "If something happens: Tools exist", body: "Anonymous report, Report an Unsafe Space, and Submit Safety Tip give women of the diaspora a voice that actually reaches other community members — not just a report that disappears into a form." },
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

      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>16 / 36</div>
    </div>
  );
}
