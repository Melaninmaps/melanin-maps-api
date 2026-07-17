const base = import.meta.env.BASE_URL;

export default function DemoS15KinfolkScreen() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>15</div>

      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "34vw" }}>
        <h1 className="font-display leading-tight" style={{ fontSize: "5.2vw", fontWeight: 700, color: "#1C0E06" }}>KinfolkAI&trade;.</h1>
        <div className="font-display leading-tight mt-[1.2vw]" style={{ fontSize: "2.2vw", fontWeight: 700, color: "#A6720F" }}>
          Culture-aware. Voice-enabled. Always learning.
        </div>
        <div className="font-body mt-[1.4vw]" style={{ fontSize: "1.25vw", color: "#7B5408", lineHeight: 1.55 }}>
          Not a generic chatbot with a new name. Kinfolk remembers your Taste Profile, learns from your thumbs-up feedback, and now reads responses back to you in your membership tier&rsquo;s voice allowance.
        </div>
        <div className="inv-rule mt-[2vw] mb-[1.2vw]" style={{ width: "5vw" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-start" }}>
            <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Taste Profile</strong> — set your categories, budget, trip style, and companion before you even ask the first question.</span>
          </div>
          <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-start" }}>
            <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Kinfolk Voice</strong> — tap Listen on any AI message to hear it read aloud. Character allowance tracked by tier.</span>
          </div>
          <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-start" }}>
            <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Session History</strong> — every conversation saved. Pick up any past session right where you left it.</span>
          </div>
          <div style={{ display: "flex", gap: "0.7vw", alignItems: "flex-start" }}>
            <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "0.92vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Spot feedback</strong> — thumbs up or down on any recommended business. Kinfolk adapts every future answer to what you actually liked.</span>
          </div>
        </div>
      </div>

      <div className="absolute flex items-center" style={{ right: "5.5vw", top: "5%", bottom: "5%" }}>
        <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between", background: "#0D0805" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "80%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>

          <div className="flex-1 flex flex-col" style={{ background: "#0D0805", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6vw", padding: "0.9vw 1vw", borderBottom: "1px solid rgba(202,146,43,0.18)", flexShrink: 0 }}>
              <div style={{ width: "2vw", height: "2vw", borderRadius: "50%", background: "linear-gradient(135deg,#CA922B,#7B5408)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span className="font-display" style={{ fontSize: "0.75vw", color: "#FAF6EF", fontWeight: 800 }}>K</span>
              </div>
              <div style={{ flex: 1 }}>
                <div className="font-body" style={{ fontSize: "0.68vw", color: "#FAF6EF", fontWeight: 700 }}>KinfolkAI™</div>
                <div style={{ width: "100%", height: "2px", background: "rgba(202,146,43,0.15)", borderRadius: "1px", marginTop: "0.25vw", position: "relative" }}>
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "62%", background: "#CA922B", borderRadius: "1px" }} />
                </div>
                <div className="font-body" style={{ fontSize: "0.38vw", color: "#A87A40", marginTop: "0.1vw" }}>Kinfolk Voice — 62% remaining</div>
              </div>
              <div style={{ display: "flex", gap: "0.4vw" }}>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "0.3vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                </div>
                <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "0.3vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round"><polyline points="12 8 6 12 12 16"/><polyline points="19 8 13 12 19 16"/></svg>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: "0.8vw 0.9vw", display: "flex", flexDirection: "column", gap: "0.6vw", overflow: "hidden" }}>
              <div style={{ maxWidth: "85%", background: "rgba(255,255,255,0.07)", borderRadius: "0.85vw 0.85vw 0.85vw 0.12vw", padding: "0.6vw 0.75vw", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="font-body" style={{ color: "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.5 }}>Hey Zara — based on your Taste Profile I know you love outdoor dining, soul food, and keeping it under $$. Here are 3 spots in DC that your network loves.</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", marginTop: "0.4vw" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2vw", padding: "0.15vw 0.4vw", background: "rgba(202,146,43,0.12)", borderRadius: "2vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                    <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    <span style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>Listen</span>
                  </div>
                </div>
              </div>

              <div style={{ background: "rgba(250,246,239,0.05)", borderRadius: "0.7vw", padding: "0.65vw 0.8vw", border: "1px solid rgba(202,146,43,0.18)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="font-body" style={{ fontSize: "0.58vw", fontWeight: 800, color: "#FAF6EF" }}>Copper &amp; Oak Bistro</div>
                    <div className="font-body" style={{ fontSize: "0.44vw", color: "#A87A40" }}>Soul Food · $$ · 0.4 mi · Trust 97</div>
                  </div>
                  <div style={{ display: "flex", gap: "0.3vw" }}>
                    <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
                    </div>
                    <div style={{ width: "1vw", height: "1vw", borderRadius: "50%", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="3" strokeLinecap="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "80%", background: "#CA922B", borderRadius: "0.85vw 0.85vw 0.12vw 0.85vw", padding: "0.6vw 0.75vw" }}>
                  <span className="font-body" style={{ color: "#FFF", fontSize: "0.52vw", lineHeight: 1.5 }}>Add it to Saturday — and find me somewhere close for afters</span>
                </div>
              </div>

              <div style={{ maxWidth: "85%", background: "rgba(255,255,255,0.07)", borderRadius: "0.85vw 0.85vw 0.85vw 0.12vw", padding: "0.6vw 0.75vw", border: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="font-body" style={{ color: "#D9C4A3", fontSize: "0.52vw", lineHeight: 1.5 }}>Done — added to Saturday. For afters, Melanin &amp; More Bakery is 0.2mi away, Trust 94. Community says Outstanding Vibes. Add that too?</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5vw", marginTop: "0.4vw" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.2vw", padding: "0.15vw 0.4vw", background: "rgba(202,146,43,0.12)", borderRadius: "2vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                    <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
                    <span style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>Listen</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.35vw", flexWrap: "wrap" }}>
                {["Yes, add it","Build the full Saturday","Show me the map"].map((chip, i) => (
                  <div key={i} style={{ borderRadius: "2vw", padding: "0.25vw 0.55vw", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.35)" }}>
                    <span className="font-body" style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 600 }}>{chip}</span>
                  </div>
                ))}
              </div>

              <div style={{ padding: "0.5vw 0.7vw", background: "rgba(202,146,43,0.06)", borderRadius: "0.5vw", border: "1px solid rgba(202,146,43,0.15)" }}>
                <div className="font-body" style={{ fontSize: "0.4vw", color: "#A87A40", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "0.2vw" }}>NEIGHBOR VOICE — ON</div>
                <div className="font-body" style={{ fontSize: "0.42vw", color: "#7B5408" }}>Answers informed by people in your network who know these neighborhoods</div>
              </div>
            </div>

            <div style={{ padding: "0.7vw 0.9vw", borderTop: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
              <div style={{ borderRadius: "2vw", padding: "0.55vw 0.85vw", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span className="font-body" style={{ fontSize: "0.48vw", color: "rgba(250,246,239,0.25)" }}>Ask anything about DC...</span>
                <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="0.55vw" height="0.55vw" viewBox="0 0 24 24" fill="none" stroke="#0D0805" strokeWidth="2.5" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around", background: "#0D0805" }}>
            {["Home","Map","Community","Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 2 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-[1.6vw]" style={{ marginLeft: "2.4vw", width: "12vw" }}>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.88vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Taste Profile</strong> personalizes every answer before Zara types a word.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.88vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>"Listen"</strong> on every AI bubble — voice meter tracks her monthly allowance.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.88vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Thumbs up on Copper &amp; Oak</strong> — Kinfolk learns what she actually likes.</span>
          </div>
          <div className="flex items-center gap-[0.5vw]">
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", opacity: 0.4 }} />
            <span className="font-body" style={{ fontSize: "0.88vw", color: "#B4832A", fontWeight: 500, lineHeight: 1.35 }}><strong style={{ fontWeight: 700, color: "#A6720F" }}>Neighbor Voice on</strong> — responses carry the weight of community experience.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
