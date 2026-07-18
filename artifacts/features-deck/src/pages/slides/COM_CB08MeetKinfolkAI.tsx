export default function CB08MeetKinfolkAI() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 40%, rgba(202,146,43,0.14) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        07
      </div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "42vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          MEET KINFOLK
        </div>
        <h1 className="font-display" style={{ fontSize: "6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "2vw" }}>
          Kinfolk.
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.2vw" }} />

        <div
          style={{ padding: "1.6vw 2vw", border: "1px solid rgba(202,146,43,0.28)", background: "rgba(202,146,43,0.06)", marginBottom: "2.4vw" }}
        >
          <p className="font-body" style={{ fontSize: "1.25vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.6, marginBottom: "1.2vw" }}>
            &ldquo;Most AI tells you what exists.<br />
            Kinfolk helps you understand what belongs.&rdquo;
          </p>
          <div style={{ width: "3vw", height: "1.5px", background: "rgba(202,146,43,0.4)" }} />
        </div>

        <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.7, fontWeight: 400 }}>
          Kinfolk isn&rsquo;t built to answer questions.<br />
          It&rsquo;s built to understand context. It learns what matters to you,
          considers where you&rsquo;re going, and helps you discover experiences
          that reflect your interests, your community, and your journey.
        </p>
      </div>

      {/* Right */}
      <div
        className="absolute flex flex-col justify-center"
        style={{ right: "6vw", top: "8%", bottom: "8%", width: "36vw", gap: 0 }}
      >
        {[
          { word: "Understands", desc: "Context, not just keywords — who you are shapes every answer" },
          { word: "Learns", desc: "From your community\u2019s lived experiences, not generic data" },
          { word: "Prepares", desc: "You before you arrive, so you travel with confidence" },
          { word: "Connects", desc: "You to the right people, places, and moments" },
          { word: "Belongs", desc: "To your community \u2014 it grows smarter with every member" },
        ].map((a, i, arr) => (
          <div
            key={a.word}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "1.4vw",
              padding: "1.35vw 0",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(202,146,43,0.12)" : "none",
            }}
          >
            <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", width: "9vw", flexShrink: 0, lineHeight: 1 }}>
              {a.word}
            </div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.55, paddingTop: "0.3vw" }}>
              {a.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
