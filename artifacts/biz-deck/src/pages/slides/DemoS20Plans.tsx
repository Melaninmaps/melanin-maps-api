const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS20Plans() {
  const features = [
    "Business listing",
    "Community Trust Score",
    "Review management",
    "KinfolkAI™ access",
    "Dashboard analytics",
    "Promotions & growth tools",
    "Priority search placement",
    "Founding badge",
  ];

  const plans = [
    { name: "Free", price: "$0", sub: "forever", vals: [true, true, true, false, false, false, false, false] },
    { name: "Standard", price: "$49", sub: "/month", vals: [true, true, true, true, true, true, false, false] },
    { name: "Founding", price: "$29", sub: "/month · locked", vals: [true, true, true, true, true, true, true, true], highlight: true },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.13), transparent 58%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>MEMBERSHIP PLANS</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Built for small businesses.<br /><span style={{ color: "#CA922B" }}>Priced like it.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Pricing that exploits small businesses is just another form of extraction. We priced our plans to be accessible — because these tools should serve everyone, not just the businesses with the most capital. Founding Members get founder pricing locked forever because they're helping build the community, not just joining it.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Free tier ensures no business is excluded for financial reasons",
            "Standard plan costs less than a single Yelp ad",
            "Founding Business rate locked forever — a thank-you for early faith",
            "KinfolkAI™ available at every level — intelligence isn't a luxury",
            "Business membership directly funds community infrastructure",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Plans comparison */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.5vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Choose Your Plan</div>
            {/* Plan headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "0.3vw", marginTop: "0.2vw" }}>
              <div />
              {plans.map((p, i) => (
                <div key={i} style={{ textAlign: "center", background: p.highlight ? "rgba(202,146,43,0.15)" : "rgba(255,255,255,0.04)", borderRadius: "0.5vw 0.5vw 0 0", padding: "0.4vw 0.2vw", border: `1px solid ${p.highlight ? "rgba(202,146,43,0.4)" : "rgba(255,255,255,0.07)"}`, borderBottom: "none" }}>
                  {p.highlight && <div style={{ color: "#CA922B", fontSize: "0.36vw", fontWeight: 800, marginBottom: "0.1vw" }}>BEST</div>}
                  <div style={{ color: p.highlight ? "#CA922B" : "#FAF6EF", fontSize: "0.5vw", fontWeight: 700 }}>{p.name}</div>
                  <div style={{ color: p.highlight ? "#CA922B" : "#A87A40", fontSize: "0.7vw", fontWeight: 800 }}>{p.price}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>{p.sub}</div>
                </div>
              ))}
            </div>
            {/* Feature rows */}
            {features.map((feat, fi) => (
              <div key={fi} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "0.3vw", borderBottom: "1px solid rgba(202,146,43,0.07)", paddingBottom: "0.2vw" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.44vw", display: "flex", alignItems: "center" }}>{feat}</span>
                {plans.map((p, pi) => (
                  <div key={pi} style={{ textAlign: "center", background: p.highlight ? "rgba(202,146,43,0.07)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", border: pi === 2 ? "0 solid rgba(202,146,43,0.3)" : "none" }}>
                    {p.vals[fi] ? (
                      <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke={p.highlight ? "#CA922B" : "#4CAF50"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <div style={{ width: "0.5vw", height: "1px", background: "rgba(255,255,255,0.15)" }} />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — Founding Business CTA */}
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0.8vw 0.9vw", gap: "0.6vw" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700, letterSpacing: "0.15em" }}>LIMITED AVAILABILITY</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.88vw", fontWeight: 800, lineHeight: 1.2, marginTop: "0.3vw" }}>Founding Business</div>
              <div style={{ color: "#CA922B", fontSize: "1.8vw", fontWeight: 800 }}>$29<span style={{ fontSize: "0.65vw", fontWeight: 400, color: "#A87A40" }}>/mo</span></div>
              <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Locked forever. No price increases.</div>
            </div>
            {/* Spots remaining */}
            <div style={{ background: "rgba(202,146,43,0.12)", borderRadius: "0.7vw", padding: "0.5vw", border: "1px solid rgba(202,146,43,0.35)", textAlign: "center" }}>
              <div style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 700 }}>247 of 500 spots claimed</div>
              <div style={{ height: "0.4vw", background: "rgba(255,255,255,0.08)", borderRadius: "0.2vw", margin: "0.3vw 0" }}>
                <div style={{ width: "49.4%", height: "100%", background: "#CA922B", borderRadius: "0.2vw" }} />
              </div>
              <div style={{ color: "#A87A40", fontSize: "0.46vw" }}>253 spots remaining</div>
            </div>
            {/* What you get */}
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>WHAT FOUNDING MEMBERS GET</div>
            {[
              "Every feature — Day 1 access, nothing gated",
              "Founding Business badge on your profile",
              "Priority placement in search results",
              "$29/mo locked in regardless of future pricing",
              "Founding Member community access",
              "Direct input on platform roadmap",
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
                <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{item}</span>
              </div>
            ))}
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.7vw", padding: "0.6vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.68vw", fontWeight: 800 }}>Claim Your Founding Spot</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
