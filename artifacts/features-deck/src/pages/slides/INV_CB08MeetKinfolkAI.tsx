const attributes = [
  { word: "Learns", desc: "From your community's experiences, not generic data" },
  { word: "Suggests", desc: "Businesses, neighborhoods, and connections tailored to you" },
  { word: "Protects", desc: "Flags safety concerns before they become your experience" },
  { word: "Connects", desc: "Links you to the right people, places, and moments" },
  { word: "Grows", desc: "Smarter with every member who joins the community" },
];

export default function CB08MeetKinfolkAI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, rgba(202,146,43,0.14) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>08</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "38vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.6vw" }}>MEET</div>
        <h1 className="font-display" style={{ fontSize: "5.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.8vw" }}>
          KinfolkAI&trade;
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <div style={{ padding: "1.6vw 2vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.05)", marginBottom: "2vw" }}>
          <p className="font-quote" style={{ fontSize: "1.55vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.55 }}>
            &ldquo;KinfolkAI doesn&rsquo;t replace your community. It learns from it.&rdquo;
          </p>
        </div>
        <p className="font-body" style={{ fontSize: "1.1vw", color: "#6B4420", lineHeight: 1.65, fontWeight: 400 }}>
          Not generic recommendations from an algorithm that doesn&rsquo;t know your community. Hyper-personalized guidance built from the lived experiences of people just like you.
        </p>
      </div>

      {/* Right: the 5 words */}
      <div className="absolute flex flex-col justify-center" style={{ right: "7vw", top: "10%", bottom: "10%", width: "36vw", gap: 0 }}>
        {attributes.map((a, i) => (
          <div key={a.word} style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.3vw 0", borderBottom: i < attributes.length - 1 ? "1px solid rgba(202,146,43,0.12)" : "none" }}>
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "8vw", flexShrink: 0, lineHeight: 1 }}>
              {a.word}
            </div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.5, paddingTop: "0.3vw" }}>{a.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
