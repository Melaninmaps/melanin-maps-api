export default function SlideInv44WhatWeDoForYou() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.13), transparent 55%)" }} />

      {/* Left — Copy */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "36vw" }}>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600, marginBottom: "1.1vw" }}>
          THE SOLUTION
        </div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1.8vw" }}>
          Your business.<br />
          <span style={{ color: "#CA922B" }}>Trusted. Found. Chosen.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.15vw", color: "#D9C4A3", lineHeight: 1.7, marginBottom: "2vw" }}>
          Your next customer isn't looking for another ad. They're looking for a recommendation.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.3vw" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}>
              <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <div>
              <div className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", fontWeight: 700, marginBottom: "0.2vw" }}>Be found by people who are looking</div>
              <div className="font-body" style={{ fontSize: "0.92vw", color: "#A87A40", lineHeight: 1.5 }}>Your verified profile surfaces in community searches by category, neighborhood, and trust score</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}>
              <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
            <div>
              <div className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", fontWeight: 700, marginBottom: "0.2vw" }}>Build a reputation that compounds</div>
              <div className="font-body" style={{ fontSize: "0.92vw", color: "#A87A40", lineHeight: 1.5 }}>Every review, save, and recommendation from the community strengthens your trust score over time</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "0.15vw" }}>
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            <div>
              <div className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", fontWeight: 700, marginBottom: "0.2vw" }}>Grow with insights that matter</div>
              <div className="font-body" style={{ fontSize: "0.92vw", color: "#A87A40", lineHeight: 1.5 }}>KinfolkAI helps you understand your customers, strengthen your reputation, and grow with confidence.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Business profile phone mockup */}
      <div className="absolute flex items-center" style={{ right: "7vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 0.4vw 1.2vw rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>

            {/* Hero banner */}
            <div style={{ background: "linear-gradient(135deg, #3D2417 0%, #1C0E06 100%)", height: "9vw", flexShrink: 0, position: "relative", display: "flex", alignItems: "flex-end", padding: "0.8vw" }}>
              <div style={{ position: "absolute", top: "0.6vw", left: "0.8vw", display: "flex", gap: "0.4vw" }}>
                <div style={{ width: "1.8vw", height: "0.6vw", background: "rgba(202,146,43,0.6)", borderRadius: "0.3vw" }} />
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.8vw", width: "100%" }}>
                <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "0.6vw", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid rgba(255,255,255,0.2)" }}>
                  <span className="font-display" style={{ fontSize: "1.5vw", color: "#1C0E06", fontWeight: 800 }}>S</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-display" style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1 }}>SoulFire Kitchen</div>
                  <div className="font-body" style={{ fontSize: "0.6vw", color: "#CA922B" }}>Soul Food · Philadelphia, PA</div>
                </div>
              </div>
            </div>

            {/* Trust badge row */}
            <div style={{ padding: "0.6vw 0.8vw", display: "flex", gap: "0.4vw", flexShrink: 0, background: "#FFFFFF", borderBottom: "1px solid rgba(58,31,14,0.08)" }}>
              <div style={{ background: "#CA922B", borderRadius: "2vw", padding: "0.2vw 0.55vw", display: "flex", alignItems: "center", gap: "0.25vw" }}>
                <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span className="font-body" style={{ fontSize: "0.58vw", color: "#1C0E06", fontWeight: 700 }}>Verified</span>
              </div>
              <div style={{ background: "#F5EBD8", borderRadius: "2vw", padding: "0.2vw 0.55vw" }}>
                <span className="font-body" style={{ fontSize: "0.58vw", color: "#7B5408", fontWeight: 600 }}>★ 4.9 · 214 reviews</span>
              </div>
              <div style={{ background: "#F5EBD8", borderRadius: "2vw", padding: "0.2vw 0.55vw" }}>
                <span className="font-body" style={{ fontSize: "0.58vw", color: "#7B5408", fontWeight: 600 }}>$$</span>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ padding: "0.6vw 0.8vw", display: "flex", gap: "0.4vw", flexShrink: 0 }}>
              <div style={{ flex: 1, background: "#CA922B", borderRadius: "0.6vw", padding: "0.45vw", textAlign: "center" }}>
                <span className="font-body" style={{ fontSize: "0.62vw", color: "#1C0E06", fontWeight: 700 }}>Directions</span>
              </div>
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "0.6vw", padding: "0.45vw", textAlign: "center", border: "1px solid rgba(58,31,14,0.15)" }}>
                <span className="font-body" style={{ fontSize: "0.62vw", color: "#7B5408", fontWeight: 600 }}>Call</span>
              </div>
              <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "0.6vw", padding: "0.45vw", textAlign: "center", border: "1px solid rgba(58,31,14,0.15)" }}>
                <span className="font-body" style={{ fontSize: "0.62vw", color: "#7B5408", fontWeight: 600 }}>Save</span>
              </div>
            </div>

            {/* Community trust section */}
            <div style={{ padding: "0.5vw 0.8vw", flexShrink: 0, borderTop: "1px solid rgba(58,31,14,0.06)" }}>
              <div className="font-body" style={{ fontSize: "0.6vw", color: "#A6720F", fontWeight: 700, letterSpacing: "0.06em", marginBottom: "0.45vw" }}>COMMUNITY SAYS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4vw" }}>
                <div style={{ background: "#FFFFFF", borderRadius: "0.7vw", padding: "0.5vw 0.65vw", border: "1px solid rgba(58,31,14,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                    <span className="font-body" style={{ fontSize: "0.6vw", color: "#1C0E06", fontWeight: 700 }}>Marcus T.</span>
                    <span style={{ fontSize: "0.58vw", color: "#CA922B" }}>★★★★★</span>
                  </div>
                  <div className="font-body" style={{ fontSize: "0.58vw", color: "#7B5408", lineHeight: 1.4 }}>"Best soul food in Philly. The community recommended it — they were right."</div>
                </div>
                <div style={{ background: "#FFFFFF", borderRadius: "0.7vw", padding: "0.5vw 0.65vw", border: "1px solid rgba(58,31,14,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                    <span className="font-body" style={{ fontSize: "0.6vw", color: "#1C0E06", fontWeight: 700 }}>Jasmine W.</span>
                    <span style={{ fontSize: "0.58vw", color: "#CA922B" }}>★★★★★</span>
                  </div>
                  <div className="font-body" style={{ fontSize: "0.58vw", color: "#7B5408", lineHeight: 1.4 }}>"Found this through Mapping with Melanin. Now it's my regular spot."</div>
                </div>
              </div>
            </div>

            {/* KinfolkAI banner */}
            <div style={{ margin: "0.5vw 0.8vw", background: "linear-gradient(135deg, #3D2417, #1C0E06)", borderRadius: "0.7vw", padding: "0.6vw 0.8vw", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4vw", marginBottom: "0.2vw" }}>
                <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="font-body" style={{ fontSize: "0.62vw", color: "#CA922B", fontWeight: 700 }}>KinfolkAI™ Insight</span>
              </div>
              <div className="font-body" style={{ fontSize: "0.58vw", color: "#D9C4A3", lineHeight: 1.4 }}>Your profile views are up 34% this week. 18 people saved your business. Ready to send a promotion?</div>
            </div>

            {/* Bottom nav */}
            <div style={{ marginTop: "auto", borderTop: "1px solid rgba(58,31,14,0.1)", padding: "0.45vw 0", display: "flex", justifyContent: "space-around", alignItems: "center", background: "#FFFFFF", flexShrink: 0 }}>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right of phone — stat callouts */}
        <div style={{ marginLeft: "2.8vw", width: "11vw", display: "flex", flexDirection: "column", gap: "1.8vw" }}>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.5)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Free</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>Start building trust today.</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.35)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>5 min</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>to claim your place in the community.</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.2)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Day 1</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>Start appearing in trusted community searches.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[8vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          The best marketing has always been a recommendation.
        </div>
      </div>
    </div>
  );
}
