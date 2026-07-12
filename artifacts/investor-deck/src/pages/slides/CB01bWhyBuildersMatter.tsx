const outcomes = [
  "Help someone discover a business they\u2019ll love",
  "Help a family feel at home in a new city",
  "Help an entrepreneur be seen",
  "Help strengthen a neighborhood",
  "Help someone feel like they belong",
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

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "1.6vw" }} />

        {/* Body copy — rhythmic, shorter sentences */}
        <div className="flex flex-col" style={{ gap: "0.55vw", marginBottom: "1.8vw" }}>
          <p className="font-body" style={{ fontSize: "1.1vw", color: "#C4935A", lineHeight: 1.6 }}>
            The strongest communities aren&rsquo;t built through advertising.
          </p>
          <p className="font-body" style={{ fontSize: "1.1vw", color: "#8B6030", lineHeight: 1.6 }}>
            They&rsquo;re built when someone says,
          </p>
          <p className="font-display" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.3vw" }}>
            &ldquo;You should check this out.&rdquo;
          </p>
          <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.6 }}>
            One recommendation becomes one new customer.
          </p>
          <p className="font-body" style={{ fontSize: "1.05vw", color: "#8B6030", lineHeight: 1.6 }}>
            One customer becomes another recommendation.
          </p>
          <p className="font-body" style={{ fontSize: "1.05vw", color: "#C4935A", lineHeight: 1.6, fontWeight: 500 }}>
            That&rsquo;s how trust grows.
          </p>
          <p className="font-body" style={{ fontSize: "1.05vw", color: "#C4935A", lineHeight: 1.6, fontWeight: 500 }}>
            That&rsquo;s how communities grow.
          </p>
        </div>

        {/* Box */}
        <div style={{ padding: "1.1vw 1.6vw", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.22)", background: "rgba(202,146,43,0.05)" }}>
          <p className="font-display" style={{ fontSize: "1.3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.4 }}>
            You&rsquo;re not selling anything.<br />
            <span style={{ color: "#CA922B" }}>You&rsquo;re opening a door.</span>
          </p>
        </div>
      </div>

      {/* Right: outcome list */}
      <div className="absolute flex flex-col justify-center" style={{ right: "5vw", top: "6%", bottom: "6%", width: "32vw" }}>
        <div className="font-body" style={{ fontSize: "0.8vw", color: "rgba(202,146,43,0.6)", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.8vw" }}>EVERY RECOMMENDATION CAN&hellip;</div>
        <div className="flex flex-col" style={{ gap: "1.05vw" }}>
          {outcomes.map((outcome, i) => (
            <div key={i} className="flex items-center" style={{ gap: "1.1vw", padding: "1vw 1.3vw", borderRadius: "0.5vw", border: i === outcomes.length - 1 ? "1px solid rgba(202,146,43,0.35)" : "1px solid rgba(202,146,43,0.15)", background: i === outcomes.length - 1 ? "rgba(202,146,43,0.07)" : "rgba(250,246,239,0.025)" }}>
              <svg style={{ flexShrink: 0 }} width="1.3vw" height="1.3vw" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" stroke="#CA922B" strokeWidth="1.3"/>
                <path d="M5 9l3 3 5-5" stroke="#CA922B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="font-body" style={{ fontSize: "1.05vw", color: i === outcomes.length - 1 ? "#FAF6EF" : "#C4935A", fontWeight: i === outcomes.length - 1 ? 600 : 400, lineHeight: 1.4 }}>
                {outcome}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
