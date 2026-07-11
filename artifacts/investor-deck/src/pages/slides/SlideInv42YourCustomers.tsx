const SEARCH_RESULTS = [
  { initial: "S", name: "SoulFire Kitchen", category: "Soul Food · $$", rating: "4.9", trust: "Recommended by 214 community members", verified: true },
  { initial: "R", name: "Roots & Remedy Café", category: "Healthy Eats · $", rating: "4.8", trust: "Saved by 89 people in your city", verified: true },
  { initial: "G", name: "The Gold Spoon", category: "Southern Cuisine · $$$", rating: "4.7", trust: "127 five-star reviews from locals", verified: false },
];

export default function SlideInv42YourCustomers() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 75% 50%, rgba(202,146,43,0.13), transparent 55%)" }} />

      {/* Left — Copy */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", maxWidth: "35vw" }}>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600, marginBottom: "1.1vw" }}>
          FOR YOUR BUSINESS
        </div>
        <div className="font-display" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1.8vw" }}>
          Your customers are<br />
          <span style={{ color: "#CA922B" }}>already looking for you.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.25vw", color: "#D9C4A3", lineHeight: 1.65, marginBottom: "2.2vw" }}>
          Every day, people in your city open Mapping with Melanin™ to find trusted businesses — restaurants, salons, doctors, law firms, and more. They're not browsing ads. They're asking their community for recommendations.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1vw" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9vw" }}>
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", marginTop: "0.7vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", lineHeight: 1.5 }}>Community-verified searches happen every day in your city</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9vw" }}>
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", marginTop: "0.7vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", lineHeight: 1.5 }}>Users search by category, trust score, and neighborhood</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.9vw" }}>
            <div style={{ width: "0.7vw", height: "1px", background: "#CA922B", marginTop: "0.7vw", flexShrink: 0 }} />
            <span className="font-body" style={{ fontSize: "1vw", color: "#FAF6EF", lineHeight: 1.5 }}>Your listing is the first step to becoming their trusted go-to</span>
          </div>
        </div>
      </div>

      {/* Right — Phone mockup */}
      <div className="absolute flex items-center" style={{ right: "7vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #1C0E06", background: "#1C0E06", boxShadow: "0 0.4vw 1.2vw rgba(0,0,0,0.45)", overflow: "hidden" }}>
          <div className="absolute inset-0 flex flex-col" style={{ background: "#FAF6EF" }}>

            {/* Status bar */}
            <div className="flex items-center justify-between px-[1.2vw] py-[0.7vw]" style={{ background: "#1C0E06", flexShrink: 0 }}>
              <span className="font-display" style={{ fontSize: "0.72vw", color: "#F5EBD8", fontWeight: 700 }}>Mapping with Melanin™</span>
              <div style={{ display: "flex", gap: "0.3vw", alignItems: "center" }}>
                <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B" }} />
                <span style={{ fontSize: "0.6vw", color: "#CA922B" }}>●●●</span>
              </div>
            </div>

            {/* Search bar */}
            <div className="px-[0.8vw] pt-[0.7vw] pb-[0.5vw]" style={{ flexShrink: 0 }}>
              <div style={{ background: "#FFFFFF", borderRadius: "0.8vw", padding: "0.45vw 0.8vw", border: "1px solid rgba(58,31,14,0.15)", display: "flex", alignItems: "center", gap: "0.4vw" }}>
                <span style={{ fontSize: "0.7vw", color: "#CA922B" }}>⌕</span>
                <span className="font-body" style={{ fontSize: "0.68vw", color: "#7B5408" }}>soul food near me…</span>
              </div>
            </div>

            {/* Category chips */}
            <div className="px-[0.8vw] pb-[0.5vw]" style={{ display: "flex", gap: "0.4vw", flexShrink: 0, overflow: "hidden" }}>
              <div style={{ background: "#CA922B", borderRadius: "2vw", padding: "0.2vw 0.6vw" }}>
                <span className="font-body" style={{ fontSize: "0.6vw", color: "#1C0E06", fontWeight: 700 }}>Food</span>
              </div>
              <div style={{ background: "#FFFFFF", borderRadius: "2vw", padding: "0.2vw 0.6vw", border: "1px solid rgba(58,31,14,0.15)" }}>
                <span className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408" }}>Beauty</span>
              </div>
              <div style={{ background: "#FFFFFF", borderRadius: "2vw", padding: "0.2vw 0.6vw", border: "1px solid rgba(58,31,14,0.15)" }}>
                <span className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408" }}>Health</span>
              </div>
              <div style={{ background: "#FFFFFF", borderRadius: "2vw", padding: "0.2vw 0.6vw", border: "1px solid rgba(58,31,14,0.15)" }}>
                <span className="font-body" style={{ fontSize: "0.6vw", color: "#7B5408" }}>Legal</span>
              </div>
            </div>

            {/* Results label */}
            <div className="px-[0.8vw] pb-[0.4vw]" style={{ flexShrink: 0 }}>
              <span className="font-body" style={{ fontSize: "0.62vw", color: "#A6720F", fontWeight: 700, letterSpacing: "0.06em" }}>TRUSTED NEAR YOU — PHILADELPHIA</span>
            </div>

            {/* Business cards */}
            <div className="flex-1 overflow-hidden flex flex-col px-[0.8vw]" style={{ gap: "0.55vw" }}>
              {SEARCH_RESULTS.map((b) => (
                <div key={b.name} style={{ background: "#FFFFFF", borderRadius: "0.9vw", padding: "0.65vw 0.75vw", border: "1px solid rgba(58,31,14,0.08)", display: "flex", gap: "0.55vw", alignItems: "flex-start" }}>
                  <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "0.5vw", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span className="font-display" style={{ fontSize: "0.9vw", color: "#1C0E06", fontWeight: 700 }}>{b.initial}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.3vw" }}>
                      <span className="font-body" style={{ fontSize: "0.72vw", color: "#1C0E06", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                      <span className="font-body" style={{ fontSize: "0.65vw", color: "#A6720F", fontWeight: 700, flexShrink: 0 }}>★ {b.rating}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35vw", marginTop: "0.1vw" }}>
                      <span className="font-body" style={{ fontSize: "0.6vw", color: "#A6720F" }}>{b.category}</span>
                      {b.verified && <span style={{ fontSize: "0.55vw", color: "#CA922B", fontWeight: 700 }}>✓ Verified</span>}
                    </div>
                    <div className="font-body" style={{ fontSize: "0.58vw", color: "#7B5408", lineHeight: 1.35, marginTop: "0.3vw" }}>{b.trust}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom nav */}
            <div style={{ borderTop: "1px solid rgba(58,31,14,0.1)", padding: "0.45vw 0", display: "flex", justifyContent: "space-around", alignItems: "center", background: "#FFFFFF", flexShrink: 0 }}>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#7B5408" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
          </div>
        </div>

        {/* Right of phone — pull quote */}
        <div style={{ marginLeft: "2.8vw", width: "12.5vw", display: "flex", flexDirection: "column", gap: "1.6vw" }}>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.5)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>$1.7T</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>buying power in the melanated diaspora market</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.3)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>87%</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>prefer community recommendations over paid ads</div>
          </div>
          <div style={{ borderLeft: "2px solid rgba(202,146,43,0.2)", paddingLeft: "1vw" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>3×</div>
            <div className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.4, marginTop: "0.3vw" }}>more likely to return to a community-trusted business</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[8vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          They're not finding you on Google. They're asking us.
        </div>
      </div>
    </div>
  );
}
