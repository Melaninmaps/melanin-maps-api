const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS04Search() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 50%, rgba(202,146,43,0.1), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>SEARCH & DISCOVERY</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Filter by what the<br /><span style={{ color: "#CA922B" }}>community actually trusts.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Google and Yelp optimize for ad revenue. Their results reflect who paid. Ours reflect who the community trusts. That's not a subtle difference — it's the entire point.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Trust Score is earned through behavior — never purchased", "High-Confidence filter shows only verified businesses", "Community data reflects lived experience, not algorithmic weight", "Search results shift as trust changes — always current", "Neighborhood filtering reflects how people actually plan"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Search results */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#E8D5B7", fontSize: "0.6vw", fontWeight: 700 }}>9:41</span>
            </div>
            {/* Search bar */}
            <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: "0.7vw", padding: "0.5vw 0.8vw", display: "flex", alignItems: "center", gap: "0.5vw", border: "1px solid rgba(202,146,43,0.3)" }}>
              <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
              <span style={{ color: "#D9C4A3", fontSize: "0.58vw" }}>brunch spots near me</span>
            </div>
            {/* Category chips */}
            <div style={{ display: "flex", gap: "0.35vw" }}>
              {["All", "Food", "Beauty", "Wellness", "Events"].map((c, i) => (
                <div key={i} style={{ padding: "0.25vw 0.5vw", borderRadius: "2vw", background: i === 1 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 1 ? "#CA922B" : "rgba(255,255,255,0.08)"}`, whiteSpace: "nowrap" }}>
                  <span style={{ color: i === 1 ? "#CA922B" : "#5C3A1A", fontSize: "0.44vw" }}>{c}</span>
                </div>
              ))}
            </div>
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>14 results in your area</div>
            {[
              { name: "Copper & Oak Bistro", score: 97, tag: "Verified", dist: "0.3 mi" },
              { name: "Soulful Sunday Kitchen", score: 93, tag: "Verified", dist: "0.7 mi" },
              { name: "Oya's Table", score: 89, tag: "", dist: "1.1 mi" },
              { name: "The Community Table", score: 86, tag: "", dist: "1.4 mi" },
            ].map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.7vw", padding: "0.55vw 0.7vw", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.2vw" }}>
                  <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>{b.name}</div>
                  <div style={{ background: "#CA922B", borderRadius: "0.3vw", padding: "0.1vw 0.35vw" }}>
                    <span style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 800 }}>{b.score}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5vw", alignItems: "center" }}>
                  {b.tag && <span style={{ fontSize: "0.4vw", color: "#CA922B", border: "1px solid rgba(202,146,43,0.4)", padding: "0.05vw 0.3vw", borderRadius: "0.3vw" }}>{b.tag}</span>}
                  <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{b.dist}</span>
                </div>
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — Filter panel */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.65vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.78vw", fontWeight: 800 }}>Filter Results</div>
              <span style={{ color: "#CA922B", fontSize: "0.52vw" }}>Reset</span>
            </div>
            {/* Trust Score filter */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3vw" }}>
                <span style={{ color: "#A87A40", fontSize: "0.52vw", fontWeight: 600 }}>Minimum Trust Score</span>
                <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>85+</span>
              </div>
              <div style={{ height: "0.35vw", background: "rgba(255,255,255,0.08)", borderRadius: "0.2vw", position: "relative" }}>
                <div style={{ position: "absolute", left: 0, width: "70%", height: "100%", background: "#CA922B", borderRadius: "0.2vw" }} />
                <div style={{ position: "absolute", left: "70%", top: "50%", transform: "translate(-50%,-50%)", width: "1vw", height: "1vw", borderRadius: "50%", background: "#CA922B", border: "2px solid #FAF6EF" }} />
              </div>
            </div>
            {/* High confidence toggle */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div>
                <div style={{ color: "#FAF6EF", fontSize: "0.58vw", fontWeight: 700 }}>High Confidence Only</div>
                <div style={{ color: "#5C3A1A", fontSize: "0.45vw" }}>Verified businesses only</div>
              </div>
              <div style={{ width: "2.2vw", height: "1.2vw", borderRadius: "1vw", background: "#CA922B", position: "relative" }}>
                <div style={{ position: "absolute", right: "0.1vw", top: "0.1vw", width: "1vw", height: "1vw", borderRadius: "50%", background: "#FAF6EF" }} />
              </div>
            </div>
            {/* Price range */}
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.52vw", fontWeight: 600, marginBottom: "0.35vw" }}>Price Range</div>
              <div style={{ display: "flex", gap: "0.4vw" }}>
                {["$", "$$", "$$$", "$$$$"].map((p, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.35vw", borderRadius: "0.5vw", background: i <= 1 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i <= 1 ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                    <span style={{ color: i <= 1 ? "#CA922B" : "#5C3A1A", fontSize: "0.5vw", fontWeight: 700 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Neighborhood */}
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.52vw", fontWeight: 600, marginBottom: "0.35vw" }}>Neighborhood</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35vw" }}>
                {["All", "Capitol Hill", "Columbia Heights", "Shaw", "U Street", "Petworth"].map((n, i) => (
                  <div key={i} style={{ padding: "0.25vw 0.5vw", borderRadius: "2vw", background: i === 0 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                    <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.45vw" }}>{n}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.55vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Show 11 Results</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
