export default function DemoS60ZaraReviewsTab() {
  const reviews = [
    { biz: "Copper & Oak Bistro", date: "Today", rating: 5, chips: ["Welcoming Vibe","Great Food","Safe Space"], text: "Absolutely loved the atmosphere. Marcus and his team make you feel like family. The salmon was perfectly seasoned — community-approved for real.", trust: 97 },
    { biz: "Nubian Heritage Spa", date: "2 weeks ago", rating: 5, chips: ["Welcoming Vibe","Authentic"], text: "First time visiting and I felt completely at ease. Staff was knowledgeable and affirming. Booked my next three appointments already.", trust: 94 },
    { biz: "The Reading Room", date: "Last month", rating: 4, chips: ["Community Hub","Authentic"], text: "Great space for diaspora writers. Wish the hours were longer on weekends but the programming is consistently excellent.", trust: 88 },
  ];
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "10%", bottom: "10%", maxWidth: "30vw", zIndex: 10 }}>
        <div style={{ fontSize: "0.68vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>ZARA'S REVIEWS TAB</div>
        <div className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "1.6vw" }}>
          Her voice<br /><span style={{ color: "#CA922B" }}>on the record.</span>
        </div>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "1.8vw", opacity: 0.7 }} />
        <div style={{ fontSize: "1.0vw", color: "#5C3A1A", lineHeight: 1.75 }}>
          Every review Zara writes is tied to her profile and her Trust Score contribution. Businesses see her as a known, verified community voice — not an anonymous stranger.
        </div>
      </div>

      {/* Phone */}
      <div style={{ position: "absolute", left: "40vw", top: "50%", transform: "translateY(-50%)", width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#FAF6EF", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ background: "#1C0E06", padding: "0.6vw 1vw 0.4vw", display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#FAF6EF", fontSize: "0.45vw", fontWeight: 700 }}>9:41 AM</span>
          <span style={{ color: "#FAF6EF", fontSize: "0.4vw" }}>●●●</span>
        </div>
        <div style={{ background: "#1C0E06", padding: "0.4vw 0.9vw 0.7vw", display: "flex", alignItems: "center", gap: "0.6vw", flexShrink: 0 }}>
          <div style={{ width: "2.2vw", height: "2.2vw", borderRadius: "50%", background: "linear-gradient(135deg,#CA922B,#8C5E1A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#FAF6EF", fontSize: "0.55vw", fontWeight: 800 }}>ZM</span>
          </div>
          <div>
            <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>Zara M.</div>
            <div style={{ color: "#A87A40", fontSize: "0.42vw" }}>Navigator · 450 pts</div>
          </div>
        </div>
        <div style={{ display: "flex", borderBottom: "0.05vw solid #E8DDD0", flexShrink: 0, background: "#fff" }}>
          {["Saved","Reviews","Posts","Journey"].map((t,i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.5vw 0", fontSize: "0.44vw", fontWeight: i === 1 ? 800 : 500, color: i === 1 ? "#CA922B" : "#8C6A3A", borderBottom: i === 1 ? "0.12vw solid #CA922B" : "none" }}>{t}</div>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "0.5vw 0.6vw", display: "flex", flexDirection: "column", gap: "0.6vw" }}>
          {reviews.map((r, i) => (
            <div key={i} style={{ background: "#fff", borderRadius: "0.7vw", padding: "0.65vw 0.7vw", boxShadow: "0 0.05vw 0.2vw rgba(28,14,6,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25vw" }}>
                <div style={{ color: "#1C0E06", fontSize: "0.55vw", fontWeight: 700 }}>{r.biz}</div>
                <div style={{ background: "#1C0E06", borderRadius: "0.35vw", padding: "0.1vw 0.28vw" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>{r.trust}</span>
                </div>
              </div>
              <div style={{ color: "#CA922B", fontSize: "0.48vw", marginBottom: "0.3vw" }}>{"★".repeat(r.rating)} · {r.date}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2vw", marginBottom: "0.3vw" }}>
                {r.chips.map((c, j) => (
                  <span key={j} style={{ background: "#FFF3E0", color: "#8C5E1A", fontSize: "0.38vw", padding: "0.1vw 0.3vw", borderRadius: "0.4vw", fontWeight: 600 }}>{c}</span>
                ))}
              </div>
              <div style={{ color: "#5C3A1A", fontSize: "0.44vw", lineHeight: 1.55 }}>{r.text}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right callouts */}
      <div style={{ position: "absolute", left: "63vw", top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: "1.4vw", maxWidth: "20vw" }}>
        {[
          ["Named + chipped reviews", "Every review shows the chips she selected — structured community signal, not just stars."],
          ["Trust Score impact shown", "Her review displayed the business's Trust Score at the time — accountability in context."],
          ["Contribution history", "Businesses and members can see she's a consistent, trusted reviewer — not a bot account."],
        ].map(([h, b], i) => (
          <div key={i}>
            <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800, marginBottom: "0.3vw" }}>{h}</div>
            <div style={{ color: "#6B4A2A", fontSize: "0.65vw", lineHeight: 1.55 }}>{b}</div>
          </div>
        ))}
      </div>

      <div style={{ position: "absolute", bottom: "2vw", right: "2vw", color: "#CA922B", fontSize: "2vw", fontWeight: 800, opacity: 0.35 }}>60</div>
    </div>
  );
}
