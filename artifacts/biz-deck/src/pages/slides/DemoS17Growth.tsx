const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS17Growth() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 50%, rgba(202,146,43,0.06), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>GROWTH TOOLS</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          Turn community attention<br /><span style={{ color: "#CA922B" }}>into revenue.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          Traditional advertising bypasses the community — it puts money into platforms that don't share your values. Our growth tools put businesses in front of people who are already culturally aligned and actively looking — without requiring a budget small businesses don't have.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "5 placement types serve different goals and budgets",
            "Flash Deals drive urgency without devaluing the brand",
            "Featured placement is trust-enhanced, not just purchased",
            "Business Stories give owners a narrative voice beyond a listing",
            "All promotions reach people already in the community",
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
        {/* Phone 1 — Promotions list */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Promotions</div>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.15vw 0.45vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>+ Create</span>
              </div>
            </div>
            {/* Placement types explanation */}
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>5 PLACEMENT TYPES</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35vw" }}>
              {["Flash Deal", "Featured Listing", "Story Boost", "Search Pin", "Category Spotlight"].map((t, i) => (
                <div key={i} style={{ padding: "0.25vw 0.5vw", borderRadius: "2vw", background: i === 0 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                  <span style={{ color: i === 0 ? "#CA922B" : "#5C3A1A", fontSize: "0.44vw" }}>{t}</span>
                </div>
              ))}
            </div>
            <div style={{ height: "1px", background: "rgba(202,146,43,0.15)" }} />
            {/* Active promotions */}
            <div style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>ACTIVE PROMOTIONS</div>
            {[
              { type: "Flash Deal", name: "20% off Saturday walk-ins", status: "Active", expires: "2h left", views: 214 },
              { type: "Featured", name: "Barber Studio — top of category", status: "Active", expires: "6 days", views: 1840 },
            ].map((p, i) => (
              <div key={i} style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.7vw", padding: "0.55vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2vw" }}>
                  <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.3vw", padding: "0.06vw 0.3vw" }}>
                    <span style={{ color: "#CA922B", fontSize: "0.38vw", fontWeight: 700 }}>{p.type.toUpperCase()}</span>
                  </div>
                  <div style={{ background: "rgba(46,140,46,0.15)", borderRadius: "0.3vw", padding: "0.06vw 0.3vw", border: "1px solid rgba(46,140,46,0.3)" }}>
                    <span style={{ color: "#4CAF50", fontSize: "0.38vw" }}>{p.status}</span>
                  </div>
                </div>
                <div style={{ color: "#FAF6EF", fontSize: "0.56vw", fontWeight: 700 }}>{p.name}</div>
                <div style={{ display: "flex", gap: "0.7vw", marginTop: "0.2vw" }}>
                  <span style={{ color: "#A87A40", fontSize: "0.44vw" }}>Expires: {p.expires}</span>
                  <span style={{ color: "#A87A40", fontSize: "0.44vw" }}>{p.views} views</span>
                </div>
              </div>
            ))}
            {/* Past */}
            <div style={{ color: "#5C3A1A", fontSize: "0.46vw", fontWeight: 700 }}>RECENT RESULTS</div>
            <div style={{ display: "flex", gap: "0.8vw" }}>
              {[{ label: "Avg. Views", val: "1,240" }, { label: "Saves During", val: "+34" }, { label: "Check-ins", val: "+12" }].map((s, i) => (
                <div key={i} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "0.5vw", padding: "0.35vw", textAlign: "center" }}>
                  <div style={{ color: "#CA922B", fontSize: "0.6vw", fontWeight: 800 }}>{s.val}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.38vw" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Create promotion */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Create Promotion</div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Promotion type</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35vw" }}>
                {[
                  { type: "Flash Deal", desc: "Time-limited offer — drives urgency", active: true },
                  { type: "Featured Listing", desc: "Top of category search results", active: false },
                  { type: "Story Boost", desc: "Amplify a business story post", active: false },
                ].map((opt, i) => (
                  <div key={i} style={{ background: opt.active ? "rgba(202,146,43,0.15)" : "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.45vw 0.55vw", border: `1px solid ${opt.active ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                    <div style={{ color: opt.active ? "#CA922B" : "#FAF6EF", fontSize: "0.54vw", fontWeight: 700 }}>{opt.type}</div>
                    <div style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{opt.desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Headline</div>
              <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.5vw", padding: "0.45vw", border: "1px solid rgba(202,146,43,0.25)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.52vw" }}>20% off Saturday walk-ins — no appointment needed</span>
              </div>
            </div>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", marginBottom: "0.3vw" }}>Duration</div>
              <div style={{ display: "flex", gap: "0.4vw" }}>
                {["2 hrs", "6 hrs", "24 hrs", "48 hrs"].map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: "center", padding: "0.35vw", borderRadius: "0.5vw", background: i === 2 ? "rgba(202,146,43,0.2)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 2 ? "#CA922B" : "rgba(255,255,255,0.08)"}` }}>
                    <span style={{ color: i === 2 ? "#CA922B" : "#5C3A1A", fontSize: "0.44vw" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.45vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>KINFOLKAI™ ESTIMATE</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.5vw", marginTop: "0.1vw" }}>Based on your past promotions, expect 180–240 views and ~12 new saves.</div>
            </div>
            <div style={{ marginTop: "auto", background: "#CA922B", borderRadius: "0.6vw", padding: "0.5vw", textAlign: "center" }}>
              <span style={{ color: "#1C0E06", fontSize: "0.62vw", fontWeight: 800 }}>Launch Promotion</span>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
