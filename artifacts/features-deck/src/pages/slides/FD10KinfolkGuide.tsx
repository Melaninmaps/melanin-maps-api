const pillars = [
  { word: "Learns", desc: "From the lived experiences of your community — not generic training data" },
  { word: "Guides", desc: "Neighborhoods, businesses, routes, people — tailored to your life" },
  { word: "Protects", desc: "Flags patterns before they become your experience" },
  { word: "Connects", desc: "Links you to the right people at the right moment" },
  { word: "Grows", desc: "Smarter with every member who joins — your trust compounds" },
];

export default function FD10KinfolkGuide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 45%, rgba(202,146,43,0.13) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>10</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "38vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "1.6vw" }}>KINFOLKAI&trade;</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2vw" }}>
          It doesn&rsquo;t replace<br />your community.<br />
          <span style={{ color: "#CA922B" }}>It learns from it.</span>
        </h2>
        <div style={{ width: "4vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <div style={{ padding: "1.5vw 1.8vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.22)", background: "rgba(202,146,43,0.05)" }}>
          <p className="font-quote" style={{ fontSize: "1.4vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.6 }}>
            &ldquo;Not an algorithm that doesn&rsquo;t know your community. A guide built from the people who live it.&rdquo;
          </p>
        </div>
      </div>

      {/* Right: pillars */}
      <div className="absolute flex flex-col justify-center" style={{ right: "7vw", top: "10%", bottom: "10%", width: "36vw" }}>
        {pillars.map((p, i) => (
          <div key={p.word} style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "1.25vw 0", borderBottom: i < pillars.length - 1 ? "1px solid rgba(202,146,43,0.12)" : "none" }}>
            <div className="font-display" style={{ fontSize: "1.8vw", fontWeight: 800, color: "#CA922B", width: "7.5vw", flexShrink: 0, lineHeight: 1 }}>
              {p.word}
            </div>
            <div className="font-body" style={{ fontSize: "0.98vw", color: "#7B5408", lineHeight: 1.55, paddingTop: "0.3vw" }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
