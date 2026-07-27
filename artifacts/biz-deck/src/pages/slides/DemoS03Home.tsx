const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

const NavBar = ({ active }: { active: number }) => (
  <div style={{ display: "flex", justifyContent: "space-around", padding: "0.6vw 0 0.8vw", background: "#0D0805", borderTop: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
    {[
      { label: "Home", path: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></> },
      { label: "Map", path: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></> },
      { label: "Community", path: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></> },
      { label: "Profile", path: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
    ].map((tab, i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vw" }}>
        <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke={i === active ? "#CA922B" : "#3A1E0A"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{tab.path}</svg>
        <span style={{ fontSize: "0.4vw", color: i === active ? "#CA922B" : "#3A1E0A", fontWeight: i === active ? 700 : 400 }}>{tab.label}</span>
      </div>
    ))}
  </div>
);

export default function DemoS03Home() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.07), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>DISCOVER</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          Everything worth finding.<br /><span style={{ color: "#CA922B" }}>Right where you are.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          Visibility on this platform is earned by trust, not ad spend. When a minority-owned business surfaces first, community dollars stay in the community. We designed discovery to be intentional.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Flash deals reward loyalty — not algorithmic reach",
            "Vibe chips connect mood and intention to real options",
            "Business stories give owners a voice, not just a listing",
            "Trending intel shows where community momentum is building",
            "Trust Score on every card — so nothing is a gamble",
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
        {/* Phone 1 — Home with vibe chips */}
        <Phone>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7vw 0.9vw 0.3vw" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.6vw", fontWeight: 700 }}>9:41</span>
            <div style={{ display: "flex", gap: "0.2vw", alignItems: "flex-end" }}>
              {[1, 2, 3].map(h => <div key={h} style={{ width: "0.22vw", height: `${0.28 + h * 0.1}vw`, background: "#E8D5B7", borderRadius: "0.04vw" }} />)}
            </div>
          </div>
          <div style={{ padding: "0 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw", overflowY: "hidden" }}>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Good morning,</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.85vw", fontWeight: 800 }}>Zara</div>
            </div>
            {/* Flash deal banner */}
            <div style={{ background: "linear-gradient(90deg,rgba(202,146,43,0.25),rgba(202,146,43,0.1))", borderRadius: "0.7vw", padding: "0.55vw 0.7vw", border: "1px solid rgba(202,146,43,0.4)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>FLASH DEAL — 2 HRS LEFT</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.62vw", fontWeight: 700 }}>20% off at Copper & Oak Bistro</div>
            </div>
            {/* Vibe chips */}
            <div>
              <div style={{ color: "#5C3A1A", fontSize: "0.46vw", marginBottom: "0.35vw" }}>MATCH YOUR VIBE</div>
              <div style={{ display: "flex", gap: "0.35vw", flexWrap: "wrap" }}>
                {["Cozy", "Lively", "Upscale", "Family", "Late Night"].map((v, i) => (
                  <div key={i} style={{ padding: "0.25vw 0.5vw", borderRadius: "2vw", background: i === 0 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.1)"}` }}>
                    <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.44vw" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Business cards */}
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>TRENDING NEAR YOU</div>
            {[{ name: "Copper & Oak Bistro", cat: "Restaurant", score: 97 }, { name: "Melanin & More", cat: "Beauty", score: 94 }, { name: "The Root Collective", cat: "Wellness", score: 91 }].map((b, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.58vw", fontWeight: 700 }}>{b.name}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.45vw" }}>{b.cat}</div>
                </div>
                <div style={{ background: "#CA922B", borderRadius: "0.4vw", padding: "0.12vw 0.4vw" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 800 }}>{b.score}</span>
                </div>
              </div>
            ))}
          </div>
          <NavBar active={0} />
        </Phone>

        {/* Phone 2 — Business Stories */}
        <Phone>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "0.7vw 0.9vw 0.3vw" }}>
            <span style={{ color: "#E8D5B7", fontSize: "0.6vw", fontWeight: 700 }}>9:41</span>
          </div>
          <div style={{ padding: "0 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.78vw", fontWeight: 800 }}>Community Stories</div>
            {/* Story circles */}
            <div style={{ display: "flex", gap: "0.7vw", overflowX: "hidden" }}>
              {["Copper", "Root", "Marcus", "Zuri's", "Flow"].map((s, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2vw", flexShrink: 0 }}>
                  <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: `rgba(202,146,43,${0.15 + i * 0.1})`, border: `1.5px solid ${i === 0 ? "#CA922B" : "rgba(202,146,43,0.3)"}` }} />
                  <span style={{ color: "#A87A40", fontSize: "0.4vw" }}>{s}</span>
                </div>
              ))}
            </div>
            {/* Featured story card */}
            <div style={{ background: "linear-gradient(160deg, rgba(202,146,43,0.15), rgba(202,146,43,0.05))", borderRadius: "0.8vw", padding: "0.8vw", border: "1px solid rgba(202,146,43,0.3)", flex: 1 }}>
              <div style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700, marginBottom: "0.3vw" }}>COPPER & OAK BISTRO</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.7vw", fontWeight: 800, lineHeight: 1.2, marginBottom: "0.4vw" }}>Sunday Brunch Is Back — And Better Than Ever</div>
              <div style={{ color: "#A87A40", fontSize: "0.5vw", lineHeight: 1.5 }}>Live jazz, bottomless mimosas, and the playlist you didn't know you needed. Reserve your table.</div>
              <div style={{ marginTop: "0.6vw", display: "flex", gap: "0.5vw", alignItems: "center" }}>
                <div style={{ padding: "0.3vw 0.6vw", background: "#CA922B", borderRadius: "0.4vw" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 800 }}>Reserve</span>
                </div>
                <div style={{ display: "flex", gap: "0.3vw", alignItems: "center" }}>
                  <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#A87A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  <span style={{ color: "#A87A40", fontSize: "0.44vw" }}>247 saves</span>
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ color: "#FAF6EF", fontSize: "0.58vw", fontWeight: 700 }}>Marcus's Barber Studio</div>
                <div style={{ color: "#5C3A1A", fontSize: "0.45vw" }}>New appointment slots open</div>
              </div>
              <div style={{ background: "#CA922B", borderRadius: "0.4vw", padding: "0.12vw 0.4vw" }}>
                <span style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 800 }}>94</span>
              </div>
            </div>
          </div>
          <NavBar active={0} />
        </Phone>
      </div>
    </div>
  );
}
