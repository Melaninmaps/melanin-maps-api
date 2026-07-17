export default function FD04KinfolkAI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(202,146,43,0.16) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.25 }}>03</div>

      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "6%", bottom: "6%", width: "42vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.5vw" }}>KINFOLKAI&trade;</div>
        <div className="font-display" style={{ fontSize: "7vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 0.95, marginBottom: "2vw" }}>Kinfolk.</div>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <div style={{ padding: "1.6vw 2vw", border: "1px solid rgba(202,146,43,0.28)", background: "rgba(202,146,43,0.06)", marginBottom: "2.5vw" }}>
          <div className="font-quote" style={{ fontSize: "1.25vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.6 }}>
            &ldquo;Most AI tells you what exists. Kinfolk helps you understand what belongs.&rdquo;
          </div>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", lineHeight: 1.75, fontWeight: 400 }}>
          Kinfolk is not built to answer questions. It learns your preferences, understands your community, and surfaces experiences that reflect your values &mdash; before you even know to ask.
        </div>
      </div>

      <div className="absolute flex flex-col justify-center" style={{ right: "6vw", top: "6%", bottom: "6%", width: "36vw" }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.4vw 0", borderBottom: "1px solid rgba(202,146,43,0.12)" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>Understands</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, paddingTop: "0.3vw" }}>Context, not just keywords &mdash; who you are shapes every answer</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.4vw 0", borderBottom: "1px solid rgba(202,146,43,0.12)" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>Learns</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, paddingTop: "0.3vw" }}>From your community&rsquo;s lived experiences, not generic training data</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.4vw 0", borderBottom: "1px solid rgba(202,146,43,0.12)" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>Prepares</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, paddingTop: "0.3vw" }}>You before you arrive &mdash; itineraries, insights, and community context</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.4vw 0", borderBottom: "1px solid rgba(202,146,43,0.12)" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>Connects</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, paddingTop: "0.3vw" }}>You to the right people, places, and moments for your journey</div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.4vw 0" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>Belongs</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, paddingTop: "0.3vw" }}>To your community &mdash; it grows smarter with every member who joins</div>
          </div>
        </div>

        <div style={{ marginTop: "2vw", padding: "1.2vw 1.6vw", background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.25)" }}>
          <div className="font-body" style={{ fontSize: "0.8vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "0.5vw" }}>AVAILABLE ON</div>
          <div className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#FAF6EF" }}>Explorer &middot; Navigator &middot; Trailblazer tiers</div>
          <div className="font-body" style={{ fontSize: "0.78vw", color: "#5C3A1A", marginTop: "0.3vw" }}>Depth of personalization scales with membership tier</div>
        </div>
      </div>
    </div>
  );
}
