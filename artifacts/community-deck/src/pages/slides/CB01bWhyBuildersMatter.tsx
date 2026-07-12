const cascade = [
  "One Conversation",
  "One Download",
  "One New Favorite Business",
  "One New Friendship",
  "One Stronger Community",
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

        <div style={{ padding: "1.1vw 1.6vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.22)", background: "rgba(202,146,43,0.05)" }}>
          <p className="font-display" style={{ fontSize: "1.3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.4 }}>
            You&rsquo;re not selling anything.<br />
            <span style={{ color: "#CA922B" }}>You&rsquo;re opening a door.</span>
          </p>
        </div>
      </div>

      {/* Right: cascade */}
      <div className="absolute flex flex-col items-center justify-center" style={{ right: "5vw", top: "6%", bottom: "6%", width: "31vw" }}>
        {cascade.map((step, i) => (
          <div key={step} className="flex flex-col items-center w-full">
            <div style={{
              width: "100%",
              padding: "0.85vw 1.4vw",
              borderRadius: "0.6vw",
              border: i === cascade.length - 1 ? "1.5px solid #CA922B" : "1px solid rgba(202,146,43,0.25)",
              background: i === cascade.length - 1 ? "rgba(202,146,43,0.1)" : "rgba(250,246,239,0.03)",
              textAlign: "center",
            }}>
              <span
                className="font-display"
                style={{
                  fontSize: i === cascade.length - 1 ? "1.25vw" : "1.15vw",
                  fontWeight: i === cascade.length - 1 ? 800 : 600,
                  color: i === cascade.length - 1 ? "#CA922B" : "#FAF6EF",
                  letterSpacing: "0.01em",
                }}
              >
                {step}
              </span>
            </div>
            {i < cascade.length - 1 && (
              <div className="flex flex-col items-center" style={{ padding: "0.4vw 0" }}>
                <div style={{ width: "1px", height: "0.7vw", background: "rgba(202,146,43,0.4)" }} />
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v8M2 6l4 5 4-5" stroke="#CA922B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ width: "1px", height: "0.4vw", background: "rgba(202,146,43,0.4)" }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
