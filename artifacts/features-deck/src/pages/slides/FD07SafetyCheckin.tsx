const steps = [
  { num: "01", headline: "Zara is meeting someone she has never met before.", sub: "She schedules a check-in before she walks out the door." },
  { num: "02", headline: "Her sister receives the live link.", sub: "Real-time location, no app required on the other end." },
  { num: "03", headline: "If Zara forgets —", sub: "Someone already knows. An automatic alert goes out." },
  { num: "04", headline: "She checks in safe.", sub: "One tap. Her sister breathes. The community holds each other." },
];

export default function FD07SafetyCheckin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 40% 60%, rgba(202,146,43,0.1) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>07</div>

      <div className="absolute flex flex-col" style={{ left: "7vw", top: "9%", right: "7vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "1.4vw" }}>SAFETY CHECK-IN</div>
        <h2 className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "0.8vw" }}>
          She doesn&rsquo;t travel alone.
        </h2>
        <p className="font-body" style={{ fontSize: "1.2vw", color: "#6B4420", lineHeight: 1.6, marginBottom: "3vw", maxWidth: "55vw" }}>
          Even when she&rsquo;s the only one in the room.
        </p>
      </div>

      {/* Story arc — horizontal steps */}
      <div className="absolute flex items-start gap-0" style={{ left: "7vw", right: "7vw", top: "40%", bottom: "9%" }}>
        {steps.map((s, i) => (
          <div key={s.num} style={{ flex: 1, position: "relative", paddingRight: i < steps.length - 1 ? "2vw" : 0 }}>
            {/* Connector line */}
            {i < steps.length - 1 && (
              <div style={{ position: "absolute", top: "1.2vw", right: "0.5vw", left: "calc(2.6vw + 1vw)", height: "2px", background: "rgba(202,146,43,0.25)" }} />
            )}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
              <div style={{ width: "2.6vw", height: "2.6vw", borderRadius: "50%", border: "2px solid #CA922B", background: "rgba(202,146,43,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="font-display" style={{ fontSize: "0.9vw", color: "#CA922B", fontWeight: 700 }}>{s.num}</span>
              </div>
            </div>
            <div style={{ marginTop: "1.2vw", paddingRight: "1vw" }}>
              <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.3, marginBottom: "0.7vw" }}>{s.headline}</div>
              <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.6 }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
