const Phone = ({ children }: { children: React.ReactNode }) => (
  <div style={{ width: "22vw", height: "41.25vw", background: "linear-gradient(160deg,#2c2c2c,#1a1a1a)", borderRadius: "3.5vw", padding: "1.4vw 0.85vw", boxShadow: "0 3vw 10vw rgba(0,0,0,0.95), 0 0 0 0.15vw rgba(255,255,255,0.06)", position: "relative" }}>
    <div style={{ position: "absolute", top: "1.4vw", left: "50%", transform: "translateX(-50%)", width: "4.5vw", height: "0.55vw", background: "#111", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: "2.8vw", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  </div>
);

const results = [
  { name: "Copper & Oak Bistro", cat: "Restaurant", price: "$$", score: 97, verified: true, tags: ["Brunch", "Outdoor Seating"], dist: "0.4 mi" },
  { name: "The Jerk Shack DC", cat: "Caribbean", price: "$$", score: 93, verified: true, tags: ["Authentic", "Takeout"], dist: "0.6 mi" },
  { name: "Busboys & Poets", cat: "Restaurant / Books", price: "$$", score: 90, verified: true, tags: ["Community", "Events"], dist: "0.9 mi" },
  { name: "Wingo's", cat: "Wings · Fast Casual", price: "$", score: 86, verified: false, tags: ["Late Night", "Delivery"], dist: "1.1 mi" },
];

export default function DemoS08Discover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 25% 60%, rgba(202,146,43,0.09), transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "0.45vh", background: "#CA922B" }} />

      <div className="absolute flex flex-col justify-center" style={{ left: "5vw", width: "33vw", top: "10%", bottom: "10%", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.72vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.5vw" }}>COMMUNITY JOURNEY · SCREEN 7 OF 29</div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          Search &<br />filter.
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.4vw", opacity: 0.7 }} />
        <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.5vw" }}>
          The Discover screen is where intent meets intelligence. Active search with filters by category, price, Trust Score, and verification status. Every result is a real business with community-verified data — not scraped from Yelp.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {[
            "Trust Score filter raises the floor — no more guessing which reviews are real",
            "Category + price filters work together, not against each other",
            "Verification badge signals the business completed our review process",
            "Distance radius adjustable from 0.5 mi to 25 mi",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "0.8vw", alignItems: "flex-start" }}>
              <div style={{ width: "0.45vw", height: "0.45vw", borderRadius: "50%", background: "#CA922B", marginTop: "0.5vw", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3", lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "absolute", right: "8vw", top: "50%", transform: "translateY(-50%)" }}>
        <Phone>
          <div style={{ padding: "0.55vw 0.9vw 0.3vw", display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.52vw", fontWeight: 700 }}>9:41</span>
            <div style={{ width: "1vw", height: "0.5vw", border: "1px solid rgba(232,213,183,0.5)", borderRadius: "0.12vw", position: "relative" }}>
              <div style={{ position: "absolute", left: "0.1vw", top: "0.09vw", bottom: "0.09vw", width: "75%", background: "#E8D5B7", borderRadius: "0.05vw" }} />
            </div>
          </div>
          <div style={{ flex: 1, padding: "0.4vw 0.9vw 0", display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.85vw", fontWeight: 800 }}>Discover</div>

            {/* Active search bar */}
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.8vw", padding: "0.55vw 0.8vw", border: "1px solid rgba(202,146,43,0.45)", display: "flex", alignItems: "center", gap: "0.4vw" }}>
              <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 600 }}>brunch DC minority-owned</span>
            </div>

            {/* Filter row */}
            <div style={{ display: "flex", gap: "0.35vw" }}>
              {[
                { label: "Food", active: true },
                { label: "Score 90+", active: true },
                { label: "$$", active: true },
                { label: "Verified", active: false },
                { label: "Open Now", active: false },
              ].map((f, i) => (
                <div key={i} style={{ padding: "0.22vw 0.5vw", borderRadius: "2vw", background: f.active ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${f.active ? "#CA922B" : "rgba(255,255,255,0.1)"}`, flexShrink: 0 }}>
                  <span style={{ color: f.active ? "#CA922B" : "#5C3A1A", fontSize: "0.42vw", fontWeight: f.active ? 700 : 400 }}>{f.label}</span>
                </div>
              ))}
            </div>

            <div style={{ color: "#5C3A1A", fontSize: "0.45vw" }}>4 results · sorted by Trust Score</div>

            {/* Results */}
            {results.map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.75vw", padding: "0.65vw", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35vw" }}>
                      <span style={{ color: "#FAF6EF", fontSize: "0.62vw", fontWeight: 700 }}>{b.name}</span>
                      {b.verified && (
                        <div style={{ width: "0.75vw", height: "0.75vw", borderRadius: "50%", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <svg width="0.45vw" height="0.45vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="3.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg>
                        </div>
                      )}
                    </div>
                    <div style={{ color: "#A87A40", fontSize: "0.45vw", marginTop: "0.06vw" }}>{b.cat} · {b.price} · {b.dist}</div>
                  </div>
                  <div style={{ background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.15vw 0.45vw" }}>
                    <span style={{ color: i === 0 ? "#1C0E06" : "#CA922B", fontSize: "0.58vw", fontWeight: 800 }}>{b.score}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.35vw", marginTop: "0.35vw" }}>
                  {b.tags.map((t, j) => (
                    <div key={j} style={{ padding: "0.15vw 0.45vw", borderRadius: "2vw", background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.2)" }}>
                      <span style={{ color: "#A87A40", fontSize: "0.4vw" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(202,146,43,0.2)", padding: "0.4vw 0 0.5vw", display: "flex", justifyContent: "space-around" }}>
            {["Home", "Map", "Community", "Profile"].map((t, i) => (
              <span key={i} style={{ fontSize: "0.4vw", color: i === 0 ? "#CA922B" : "rgba(250,246,239,0.2)" }}>{t}</span>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
