const stories = [
  "\u201CI found my first barber before I unpacked.\u201D",
  "\u201CA small business gained a lifelong customer.\u201D",
  "\u201CSomeone stopped feeling like a stranger.\u201D",
  "\u201CA family found home faster.\u201D",
  "\u201COne recommendation strengthened an entire community.\u201D",
];

export default function CB01bWhyBuildersMatter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(202,146,43,0.11) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>02</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "6%", bottom: "6%", width: "43vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.3vw" }}>WHY COMMUNITY BUILDERS MATTER</div>

        <div className="font-quote" style={{ fontSize: "2vw", fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.35, marginBottom: "1.1vw" }}>
          Every movement begins with one conversation.
        </div>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "1.3vw" }} />

        {/* Visual middle */}
        <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.65, marginBottom: "0.85vw" }}>
          Think about the last place someone recommended to you.
        </p>

        <div className="flex flex-wrap" style={{ gap: "0.45vw 0.8vw", marginBottom: "0.85vw" }}>
          {["A restaurant.", "A barber.", "A neighborhood.", "A church.", "A small business.", "A new city."].map((item) => (
            <span key={item} className="font-body" style={{ fontSize: "1.05vw", color: "#C4935A", fontWeight: 500 }}>{item}</span>
          ))}
        </div>

        <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.65, marginBottom: "0.4vw" }}>
          It probably didn&rsquo;t start with an advertisement.
        </p>
        <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.65, marginBottom: "0.5vw" }}>
          It started with someone you trusted saying,
        </p>
        <p className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.5vw" }}>
          &ldquo;You should check this out.&rdquo;
        </p>
        <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.65, marginBottom: "1.4vw" }}>
          That&rsquo;s how communities grow.
        </p>

        {/* Box */}
        <div style={{ padding: "1.1vw 1.6vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.22)", background: "rgba(202,146,43,0.05)" }}>
          <p className="font-display" style={{ fontSize: "1.3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.4 }}>
            You&rsquo;re not selling anything.<br />
            <span style={{ color: "#CA922B" }}>You&rsquo;re opening a door.</span>
          </p>
        </div>
      </div>

      {/* Right: 5 tiny stories */}
      <div className="absolute flex flex-col justify-center" style={{ right: "5vw", top: "6%", bottom: "6%", width: "33vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "rgba(202,146,43,0.6)", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.6vw" }}>EVERY CONVERSATION CAN HELP SOMEONE&hellip;</div>
        <div className="flex flex-col" style={{ gap: "1vw" }}>
          {stories.map((story, i) => (
            <div key={i} style={{ padding: "1vw 1.3vw", borderRadius: "0.5vw", border: "1px solid rgba(202,146,43,0.15)", background: "rgba(250,246,239,0.03)" }}>
              <div className="flex items-start" style={{ gap: "0.9vw" }}>
                <svg style={{ flexShrink: 0, marginTop: "0.15vw" }} width="1.1vw" height="1.1vw" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" stroke="#CA922B" strokeWidth="1.2"/>
                  <path d="M4.5 8l2.5 2.5L11.5 5.5" stroke="#CA922B" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="font-quote" style={{ fontSize: "1.05vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.5 }}>{story}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
