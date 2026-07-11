export default function DemoS61MarcusProfileScreen() {
  const posts = [
    { time: "2h ago", text: "🙏 Zara left us the most beautiful review today. Community like this is exactly why we do what we do. See you Sunday for Community Brunch!", likes: 34, comments: 8 },
    { time: "3d ago", text: "Our Natural Hair Sunday collab with Silk & Thread is CONFIRMED. Brunch + style = your vibe? RSVP in the link.", likes: 61, comments: 14 },
  ];
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>MARCUS'S PROFILE</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Owner<br />presence.<br /><span style={{ color: "#CA922B" }}>Community trust.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Marcus's profile isn't separate from his business — it's connected to it. Community members can see the person behind the Trust Score 97 and follow his business updates.
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ left: "40vw", top: "5%", bottom: "5%", zIndex: 5 }}>
      <div style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        {/* Header */}
        <div style={{ background: "#1C0E06", padding: "0.5vw 1vw 1.2vw", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "0.6vw" }}>
            <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "linear-gradient(135deg,#5C3A1A,#2A1206)", display: "flex", alignItems: "center", justifyContent: "center", border: "0.12vw solid rgba(202,146,43,0.5)", flexShrink: 0 }}>
              <span style={{ color: "#CA922B", fontSize: "0.9vw", fontWeight: 800 }}>MT</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 700 }}>Marcus T.</div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw" }}>Shaw / U Street, DC</div>
              <div style={{ display: "flex", gap: "0.3vw", marginTop: "0.2vw" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.2vw", background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.1vw 0.35vw" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 800 }}>★ BUSINESS OWNER</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.2vw", background: "rgba(202,146,43,0.1)", borderRadius: "0.4vw", padding: "0.1vw 0.35vw" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700 }}>TRAILBLAZER</span>
                </div>
              </div>
            </div>
          </div>
          {/* Business link */}
          <div style={{ background: "rgba(202,146,43,0.12)", borderRadius: "0.6vw", padding: "0.5vw 0.7vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#FAF6EF", fontSize: "0.55vw", fontWeight: 700 }}>Copper & Oak Bistro</div>
              <div style={{ color: "#A87A40", fontSize: "0.42vw" }}>Trust Score 97 · 53 reviews · 4.9 ★</div>
            </div>
            <svg width="0.7vw" height="0.7vw" viewBox="0 0 16 16" fill="none" stroke="#CA922B" strokeWidth="2"><path d="M6 3l5 5-5 5"/></svg>
          </div>
        </div>
        {/* Stats */}
        <div style={{ background: "#F5EEE4", display: "flex", justifyContent: "space-around", padding: "0.6vw 0.5vw", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0 }}>
          {[["97","Trust Score"],["53","Reviews"],["4.9","Rating"],["218","Followers"]].map(([n,l],i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: i === 0 ? "#CA922B" : "#1C0E06", fontSize: "0.7vw", fontWeight: 800 }}>{n}</div>
              <div style={{ color: "#8C6A3A", fontSize: "0.4vw" }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0, background: "#fff" }}>
          {["Posts","Reviews","Business","Events"].map((t,i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.45vw 0", fontSize: "0.42vw", fontWeight: i === 0 ? 800 : 500, color: i === 0 ? "#CA922B" : "#8C6A3A", borderBottom: i === 0 ? "0.12vw solid #CA922B" : "none" }}>{t}</div>
          ))}
        </div>
        {/* Posts */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5vw 0.6vw", display: "flex", flexDirection: "column", gap: "0.5vw" }}>
          {posts.map((p, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.7vw", padding: "0.6vw 0.7vw", boxShadow: "0 0.05vw 0.2vw rgba(28,14,6,0.06)" }}>
              <div style={{ color: "#8C6A3A", fontSize: "0.4vw", marginBottom: "0.3vw" }}>{p.time}</div>
              <div style={{ color: "#1C0E06", fontSize: "0.5vw", lineHeight: 1.55, marginBottom: "0.35vw" }}>{p.text}</div>
              <div style={{ display: "flex", gap: "0.8vw" }}>
                <span style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>♥ {p.likes}</span>
                <span style={{ color: "#8C6A3A", fontSize: "0.42vw" }}>💬 {p.comments}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Business badge", "His Business Owner badge and Trailblazer tier are visible to every community member who visits his profile."],
          ["Business card linked", "One tap takes any visitor from Marcus's profile to Copper & Oak Bistro's full listing."],
          ["Owner posts to community", "Marcus uses his profile to announce events, collaborations, and community moments — not ads."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>61</div>
    </div>
  );
}
