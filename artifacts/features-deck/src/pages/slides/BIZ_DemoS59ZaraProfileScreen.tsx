export default function DemoS59ZaraProfileScreen() {
  const saved = [
    { name: "Copper & Oak Bistro", cat: "Restaurant", score: 97, tag: "2h ago" },
    { name: "Nubian Heritage Spa", cat: "Wellness", score: 94, tag: "Last week" },
    { name: "Silk & Thread Boutique", cat: "Fashion", score: 91, tag: "Last week" },
    { name: "Harlem Proper", cat: "Restaurant", score: 88, tag: "3 weeks ago" },
  ];
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left panel */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "32vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>ZARA'S PROFILE</div>
        <div className="font-display" style={{ fontSize: "5.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Her identity<br />in the<br /><span style={{ color: "#CA922B" }}>community.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.05vw", color: "#5C3A1A", lineHeight: 1.75, marginBottom: "1.5vw" }}>
          Zara's profile is her community passport — her saved places, reviews, circles, points, and life journeys all in one view. Visitors can see her activity. She controls what's public.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.9vw" }}>
          {[
            ["47 saved places", "across 8 cities"],
            ["12 reviews written", "trusted community voice"],
            ["450 pts", "Navigator membership"],
          ].map(([a, b], i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "0.6vw" }}>
              <span style={{ color: "#CA922B", fontSize: "0.78vw", fontWeight: 800 }}>{a}</span>
              <span style={{ color: "#8C6A3A", fontSize: "0.72vw" }}>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "44vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Status bar */}
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        {/* Header */}
        <div style={{ background: "#1C0E06", padding: "0.5vw 1vw 1.2vw", display: "flex", alignItems: "center", gap: "0.8vw", flexShrink: 0 }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "linear-gradient(135deg,#CA922B,#8C5E1A)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "0.12vw solid rgba(202,146,43,0.4)" }}>
            <span style={{ color: "#FAF6EF", fontSize: "0.9vw", fontWeight: 800 }}>ZM</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 700 }}>Zara M.</div>
            <div style={{ color: "#A87A40", fontSize: "0.52vw" }}>Shaw / U Street, DC</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25vw", background: "rgba(202,146,43,0.18)", borderRadius: "0.5vw", padding: "0.1vw 0.4vw", marginTop: "0.2vw" }}>
              <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>✦ NAVIGATOR</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#CA922B", fontSize: "0.6vw", fontWeight: 800 }}>450</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.42vw" }}>pts</div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ background: "#F5EEE4", display: "flex", justifyContent: "space-around", padding: "0.7vw 0.5vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          {[["47","Saved"],["12","Reviews"],["3","Circles"],["2","Journeys"]].map(([n,l],i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: "#1C0E06", fontSize: "0.72vw", fontWeight: 800 }}>{n}</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Bio */}
        <div style={{ padding: "0.6vw 0.8vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          <div style={{ color: "#3A2210", fontSize: "0.5vw", lineHeight: 1.6 }}>Community explorer, brunch enthusiast & safety advocate. Always looking for the next great experience.</div>
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          {["Saved","Reviews","Posts","Journey"].map((t,i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.5vw 0", fontSize: "0.45vw", fontWeight: i === 0 ? 800 : 500, color: i === 0 ? "#CA922B" : "#8C6A3A", borderBottom: i === 0 ? "0.12vw solid #CA922B" : "none" }}>{t}</div>
          ))}
        </div>
        {/* Saved places */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5vw 0.7vw", display: "flex", flexDirection: "column", gap: "0.5vw" }}>
          {saved.map((b, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.6vw", padding: "0.55vw 0.7vw", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 0.05vw 0.2vw rgba(28,14,6,0.06)" }}>
              <div>
                <div style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700 }}>{b.name}</div>
                <div style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>{b.cat} · {b.tag}</div>
              </div>
              <div style={{ background: "#1C0E06", borderRadius: "0.4vw", padding: "0.15vw 0.35vw" }}>
                <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 800 }}>{b.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "66vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "18vw" }}>
        {[
          ["Public profile", "Visitors see her saved places, reviews, and posts based on her privacy settings."],
          ["Navigator badge", "Membership tier visible to everyone — signals commitment to the community."],
          ["Points visible", "450 pts signals an active, trusted member — not just a lurker."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>59</div>
    </div>
  );
}
