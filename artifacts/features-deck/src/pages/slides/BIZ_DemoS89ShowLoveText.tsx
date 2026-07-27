export default function DemoS89ShowLoveText() {
  const points = [
    { head: "Recognition over popularity", body: "Show Love isn't a vote count. It shows 'Recommended by 47 community members' — not 4,327 votes. The emphasis is on trust and authentic impact, not viral metrics." },
    { head: "4 forms of appreciation", body: "Members express recognition in four specific ways: Show Love (heartfelt connection), I Support (aligning values), Saved (want to visit/engage), and Visited (personal experience confirmed)." },
    { head: "Why People Show Love — signature section", body: "Every profile has a 'Why People Show Love' section surfacing short, authentic testimonials. 'She introduced me to my favorite bookstore.' These stories carry weight that numbers never will." },
    { head: "Linked to Community Impact", body: "Consistent, genuine Show Love nominations increase the nominee's Community Impact score — connecting recognition directly to the platform's trust architecture without pay-to-play shortcuts." },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 40%, rgba(202,146,43,0.10), transparent 58%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "8vw", right: "8vw", top: "12%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.24em", fontWeight: 700, marginBottom: "2vw" }}>COMMUNITY JOURNEY · SHOW LOVE</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.5vw", textShadow: "0 0 40px rgba(202,146,43,0.2)" }}>
          Celebrate the people<br />making a difference.
        </div>
        <div style={{ width: "5vw", height: "2px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.2vw 4vw" }}>
          {points.map((p, i) => (
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
      <div style={{ position: "absolute", bottom: "3.5vh", right: "4vw", color: "rgba(202,146,43,0.3)", fontSize: "0.65vw", fontWeight: 700, letterSpacing: "0.12em" }}>89 / 91</div>
    </div>
  );
}
