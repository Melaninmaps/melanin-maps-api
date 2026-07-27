const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS18Reviews() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 50%, rgba(202,146,43,0.1), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>REVIEW MANAGEMENT</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Every review is a<br />conversation.<br /><span style={{ color: "#CA922B" }}>Show up for it.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          A review isn't just feedback — it's the community speaking to future customers. When an owner responds thoughtfully, they're demonstrating community commitment. KinfolkAI makes that sustainable for owners already stretched thin.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Response rate directly influences Trust Score ranking",
            "Compliment chips show which qualities the community values most",
            "KinfolkAI drafts responses in the owner's voice — never generic",
            "Owner presence in reviews signals accountability and care",
            "Review trends reveal what the community wants more of",
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
        {/* Phone 1 — Compliment chips + review list */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Reviews & Feedback</div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw" }}>Marcus's Barber Studio · 47 reviews</div>
            {/* Compliment chip breakdown */}
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>WHAT THE COMMUNITY SAYS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35vw" }}>
              {[
                { label: "Welcoming", count: 41 },
                { label: "Skilled", count: 38 },
                { label: "Clean Space", count: 34 },
                { label: "On Time", count: 29 },
                { label: "Fair Price", count: 26 },
                { label: "Come Back", count: 44 },
              ].map((chip, i) => (
                <div key={i} style={{ padding: "0.25vw 0.5vw", borderRadius: "2vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", gap: "0.3vw", alignItems: "center" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.44vw" }}>{chip.label}</span>
                  <span style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>×{chip.count}</span>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            {/* Reviews with owner response option */}
            {[
              { name: "Alicia M.", stars: 5, text: "Best barber in DC, period. Marcus listens and delivers every time.", responded: true },
              { name: "Jordan T.", stars: 5, text: "Fresh cut, great conversation. The vibe in this shop is unmatched.", responded: false },
            ].map((r, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.55vw" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2vw" }}>
                  <span style={{ color: "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>{r.name}</span>
                  <div style={{ display: "flex", gap: "0.12vw" }}>
                    {[...Array(r.stars)].map((_, si) => (
                      <svg key={si} width="0.5vw" height="0.5vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    ))}
                  </div>
                </div>
                <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.4, marginBottom: "0.3vw" }}>{r.text}</div>
                {r.responded ? (
                  <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.4vw", padding: "0.28vw 0.4vw", borderLeft: "2px solid #CA922B" }}>
                    <div style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>OWNER RESPONSE</div>
                    <div style={{ color: "#D9C4A3", fontSize: "0.46vw" }}>Thank you Alicia — means everything coming from you.</div>
                  </div>
                ) : (
                  <div style={{ background: "rgba(202,146,43,0.06)", borderRadius: "0.4vw", padding: "0.25vw 0.4vw", border: "1px solid rgba(202,146,43,0.2)", display: "inline-flex", alignItems: "center", gap: "0.25vw" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.42vw" }}>KinfolkAI: Draft a response →</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — Owner response draft */}
        <Phone>
          <div style={{ padding: "0.7vw 0.8vw", display: "flex", alignItems: "center", gap: "0.4vw", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
            <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>KinfolkAI™ — Response Draft</div>
          </div>
          <div style={{ flex: 1, padding: "0.7vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            {/* Original review */}
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.4vw", fontWeight: 700, marginBottom: "0.15vw" }}>REVIEWING</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.52vw", fontWeight: 700 }}>Jordan T.</div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.4, marginTop: "0.1vw" }}>"Fresh cut, great conversation. The vibe in this shop is unmatched."</div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.8vw 0.8vw 0.1vw 0.8vw", padding: "0.45vw 0.6vw", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.52vw" }}>Draft a warm response for Jordan. Keep it real.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.35vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>K</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw 0.8vw 0.8vw 0.1vw", padding: "0.5vw 0.6vw", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.5 }}>Based on your previous responses, here's a draft:</span>
              </div>
            </div>
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.7vw", padding: "0.6vw", border: "1px solid rgba(202,146,43,0.3)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700, marginBottom: "0.3vw" }}>DRAFT RESPONSE</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.56vw", lineHeight: 1.55 }}>Jordan — real talk, that means a lot. The conversation is just as important to us as the cut. See you next time, and bring somebody through.</div>
              <div style={{ display: "flex", gap: "0.4vw", marginTop: "0.4vw" }}>
                <div style={{ flex: 1, background: "#CA922B", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 800 }}>Post Response</span>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: "#A87A40", fontSize: "0.52vw" }}>Edit</span>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(202,146,43,0.06)", borderRadius: "0.5vw", padding: "0.4vw", border: "1px solid rgba(202,146,43,0.15)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>IMPACT</div>
              <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>Responding increases your Trust Score by ~1.2 pts on average.</div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
