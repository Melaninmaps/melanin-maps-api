const pillars = [
  "Discover trusted local businesses",
  "Feel at home in new places",
  "Support entrepreneurs",
  "Build stronger neighborhoods",
  "Welcome newcomers",
];

export default function CB01bWhyBuildersMatter() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(202,146,43,0.11) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>02</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "44vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.6vw" }}>WHY COMMUNITY BUILDERS MATTER</div>

        <div className="font-quote" style={{ fontSize: "2.2vw", fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.4, marginBottom: "1.2vw" }}>
          Every movement begins with<br />one conversation.
        </div>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />

        <p className="font-body" style={{ fontSize: "1.15vw", color: "#8B6030", lineHeight: 1.7, marginBottom: "0.6vw" }}>
          The best communities aren&rsquo;t built through advertisements.
        </p>
        <p className="font-body" style={{ fontSize: "1.15vw", color: "#C4935A", lineHeight: 1.7, marginBottom: "2.4vw" }}>
          They&rsquo;re built when one person says:<br />
          <span className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FAF6EF" }}>&ldquo;You should check this out.&rdquo;</span>
        </p>

        <div style={{ padding: "1.4vw 1.8vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.18)", background: "rgba(202,146,43,0.04)" }}>
          <p className="font-display" style={{ fontSize: "1.4vw", fontWeight: 800, color: "#FAF6EF", marginBottom: "1vw" }}>
            You&rsquo;re not selling anything.<br />
            <span style={{ color: "#CA922B" }}>You&rsquo;re opening a door.</span>
          </p>
        </div>
      </div>

      {/* Right: what builders help people do */}
      <div className="absolute flex flex-col justify-center" style={{ right: "7vw", top: "8%", bottom: "8%", width: "33vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "rgba(202,146,43,0.6)", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.6vw" }}>COMMUNITY BUILDERS HELP PEOPLE</div>
        <div className="flex flex-col" style={{ gap: "1.1vw" }}>
          {pillars.map((p, i) => (
            <div key={i} className="flex items-center" style={{ gap: "1.2vw", padding: "0.9vw 1.2vw", borderRadius: "0.5vw", border: "1px solid rgba(202,146,43,0.15)", background: "rgba(250,246,239,0.03)" }}>
              <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B" }} />
              </div>
              <span className="font-body" style={{ fontSize: "1.1vw", color: "#FAF6EF", fontWeight: 500 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
