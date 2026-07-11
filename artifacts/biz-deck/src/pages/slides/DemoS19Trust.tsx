const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS19Trust() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.07), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>TRUST & VERIFICATION</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          The verified badge isn't cosmetic.<br /><span style={{ color: "#CA922B" }}>It's earned.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          A badge that anyone can claim is worthless. The Trust Score is a living measurement — earned through consistent community behavior, not purchased or self-assigned. A score of 94 means 94 points of evidence that this business treats the community right.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Trust Score is the community's collective vote — not a platform opinion",
            "Five components — reviews, saves, check-ins, response rate, verification",
            "DocuSign verification provides legal accountability for business claims",
            "Verified badge requires real documentation — not just a profile claim",
            "Trust compounds — consistent businesses gain more visibility over time",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Trust Score breakdown */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Trust Score</div>
              <div style={{ background: "#CA922B", borderRadius: "0.6vw", padding: "0.2vw 0.6vw" }}>
                <span style={{ color: "#1C0E06", fontSize: "0.85vw", fontWeight: 800 }}>94</span>
              </div>
            </div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Top 8% of all businesses in your category</div>
            {/* Circular progress placeholder */}
            <div style={{ height: "5vw", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(202,146,43,0.05)", borderRadius: "0.7vw", border: "1px solid rgba(202,146,43,0.15)" }}>
              <svg viewBox="0 0 120 120" style={{ width: "4.5vw", height: "4.5vw" }}>
                <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(202,146,43,0.15)" strokeWidth="8" />
                <circle cx="60" cy="60" r="50" fill="none" stroke="#CA922B" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 50 * 0.94} ${2 * Math.PI * 50}`} transform="rotate(-90 60 60)" />
                <text x="60" y="67" textAnchor="middle" fill="#CA922B" fontSize="22" fontWeight="800">94</text>
              </svg>
            </div>
            {/* Component breakdown */}
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>SCORE COMPONENTS</div>
            {[
              { label: "Community Reviews", score: 98, weight: "35%" },
              { label: "Saves & Favorites", score: 92, weight: "20%" },
              { label: "Check-In Rate", score: 88, weight: "15%" },
              { label: "Response Rate", score: 95, weight: "20%" },
              { label: "Verification Status", score: 100, weight: "10%" },
            ].map((c, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.1vw" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.48vw" }}>{c.label}</span>
                  <div style={{ display: "flex", gap: "0.5vw" }}>
                    <span style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{c.weight}</span>
                    <span style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700 }}>{c.score}</span>
                  </div>
                </div>
                <div style={{ height: "0.25vw", background: "rgba(255,255,255,0.07)", borderRadius: "0.12vw" }}>
                  <div style={{ width: `${c.score}%`, height: "100%", background: "#CA922B", borderRadius: "0.12vw" }} />
                </div>
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — Verification + DocuSign */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Business Verification</div>
              <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" stroke="#1C0E06" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
            </div>
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.7vw", padding: "0.55vw", border: "1px solid rgba(202,146,43,0.35)", textAlign: "center" }}>
              <div style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>VERIFIED BUSINESS</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.48vw", marginTop: "0.15vw" }}>Marcus's Barber Studio · Verified Jan 2025</div>
            </div>
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>VERIFICATION INCLUDES</div>
            {["Business license confirmation", "Owner identity verification", "Physical location confirmation", "Black ownership attestation"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5vw" }}>
                <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>{item}</span>
              </div>
            ))}
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>DOCUMENT SIGNING</div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.55vw", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3vw" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>Founding Business Agreement</span>
                <div style={{ background: "rgba(46,140,46,0.15)", borderRadius: "0.3vw", padding: "0.06vw 0.3vw", border: "1px solid rgba(46,140,46,0.35)" }}>
                  <span style={{ color: "#4CAF50", fontSize: "0.4vw" }}>SIGNED</span>
                </div>
              </div>
              <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Signed via DocuSign · Jan 12, 2025</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.55vw", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>Seller Agreement</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>Required for Growth Tools</div>
                </div>
                <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.1vw 0.4vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>Sign →</span>
                </div>
              </div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
