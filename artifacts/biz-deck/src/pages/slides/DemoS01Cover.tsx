const Phone = ({ children, scale = 1, rotate = 0 }: { children: React.ReactNode; scale?: number; rotate?: number }) => (
  <div style={{ width: `${14 * scale}vw`, height: `${26 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0, transform: `rotate(${rotate}deg)` }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.5vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(202,146,43,0.13), transparent 58%)" }} />

      {/* Left */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "33vw", zIndex: 20 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "1.2vw" }}>MAPPING WITH MELANIN™</div>
        <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          The full<br /><span style={{ color: "#CA922B" }}>product experience.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", lineHeight: 1.7, marginBottom: "2.8vw" }}>
          Every screen. Every feature.<br />Two complete journeys — side by side.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8vw" }}>
          {["Community Member Journey", "Business Owner Journey"].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.8vw" }}>
              <div style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "#CA922B", flexShrink: 0 }} />
              <span className="font-body" style={{ fontSize: "1vw", color: "#D9C4A3" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Three phones */}
      <div className="absolute" style={{ right: "2vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "1vw" }}>
        {/* Left phone — map screen */}
        <div style={{ transform: "rotate(-7deg) translateY(1vw)", zIndex: 1 }}>
          <Phone scale={0.78}>
            <div style={{ flex: 1, background: "#1a2518", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(46,90,30,0.4), rgba(202,146,43,0.08))" }} />
              {[[18,30],[45,55],[62,22],[30,70],[75,40],[50,80]].map(([t, l], i) => (
                <div key={i} style={{ position: "absolute", top: `${t}%`, left: `${l}%`, width: "1.1vw", height: "1.1vw", borderRadius: "50% 50% 50% 0", transform: "rotate(-45deg)", background: i === 2 ? "#CA922B" : "rgba(202,146,43,0.45)", boxShadow: i === 2 ? "0 0 0.6vw rgba(202,146,43,0.6)" : "none" }} />
              ))}
              <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", background: "rgba(13,8,5,0.92)", padding: "0.5vw 1vw", borderRadius: "1vw", border: "1px solid rgba(202,146,43,0.4)", whiteSpace: "nowrap" }}>
                <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 700 }}>42 businesses nearby</span>
              </div>
            </div>
          </Phone>
        </div>

        {/* Center phone — home screen */}
        <div style={{ transform: "translateY(-1.5vw)", zIndex: 3 }}>
          <Phone scale={0.98}>
            <div style={{ padding: "1.2vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.7vw" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#E8D5B7", fontSize: "0.62vw", fontWeight: 700 }}>9:41</span>
                <div style={{ display: "flex", gap: "0.2vw", alignItems: "flex-end" }}>
                  {[1, 2, 3].map(h => <div key={h} style={{ width: "0.22vw", height: `${0.28 + h * 0.11}vw`, background: "#E8D5B7", borderRadius: "0.05vw" }} />)}
                </div>
              </div>
              <div>
                <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Good morning,</div>
                <div style={{ color: "#FAF6EF", fontSize: "0.88vw", fontWeight: 800 }}>Zara</div>
              </div>
              <div style={{ background: "rgba(202,146,43,0.15)", borderRadius: "0.7vw", padding: "0.55vw", border: "1px solid rgba(202,146,43,0.35)" }}>
                <div style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700 }}>TRENDING NEAR YOU</div>
                <div style={{ color: "#FAF6EF", fontSize: "0.62vw", marginTop: "0.15vw" }}>Black-owned brunch spots</div>
              </div>
              {[{ name: "Copper & Oak Bistro", score: 97, cat: "Restaurant" }, { name: "Melanin & More Salon", score: 94, cat: "Beauty" }, { name: "The Root Collective", score: 91, cat: "Wellness" }].map((b, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#FAF6EF", fontSize: "0.58vw", fontWeight: 700 }}>{b.name}</div>
                    <div style={{ color: "#A87A40", fontSize: "0.46vw" }}>{b.cat}</div>
                  </div>
                  <div style={{ background: "#CA922B", borderRadius: "0.4vw", padding: "0.15vw 0.45vw" }}>
                    <span style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 800 }}>{b.score}</span>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-around", paddingTop: "0.5vw", borderTop: "1px solid rgba(202,146,43,0.15)" }}>
                {["Home", "Map", "Comm.", "Profile"].map((t, i) => (
                  <span key={i} style={{ fontSize: "0.42vw", color: i === 0 ? "#CA922B" : "#5C3A1A", fontWeight: i === 0 ? 700 : 400 }}>{t}</span>
                ))}
              </div>
            </div>
          </Phone>
        </div>

        {/* Right phone — business dashboard */}
        <div style={{ transform: "rotate(7deg) translateY(1vw)", zIndex: 1 }}>
          <Phone scale={0.78}>
            <div style={{ padding: "0.9vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.55vw" }}>
              <div style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>DASHBOARD</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.7vw", fontWeight: 800 }}>Marcus's Barber Studio</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4vw" }}>
                {[{ label: "Views", val: "1,247" }, { label: "Trust Score", val: "94", gold: true }, { label: "Saves", val: "218" }, { label: "Reviews", val: "47" }].map((m, i) => (
                  <div key={i} style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.5vw", padding: "0.4vw", border: `1px solid ${(m as any).gold ? "rgba(202,146,43,0.5)" : "rgba(202,146,43,0.15)"}` }}>
                    <div style={{ color: "#A87A40", fontSize: "0.38vw" }}>{m.label}</div>
                    <div style={{ color: (m as any).gold ? "#CA922B" : "#FAF6EF", fontSize: "0.7vw", fontWeight: 800 }}>{m.val}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.5vw", padding: "0.45vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                <div style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>KINFOLKAI™</div>
                <div style={{ color: "#D9C4A3", fontSize: "0.48vw", marginTop: "0.1vw" }}>People nearby are searching for barbers. Post a special?</div>
              </div>
            </div>
          </Phone>
        </div>
      </div>
    </div>
  );
}
