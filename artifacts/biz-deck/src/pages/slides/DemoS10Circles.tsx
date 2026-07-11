const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS10Circles() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.07), transparent 50%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>KINFOLK CIRCLES™</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "1vw" }}>
          Save the best spots.<br />Plan the best trips.<br /><span style={{ color: "#CA922B" }}>Together.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#7B5408", lineHeight: 1.7 }}>
          Discovery is personal. Sharing is how community wealth moves. When you save a business to a circle and share it with four friends, that business gets discovered four new times — with pre-built social trust already attached. Circles are the community referral engine. They just don't look like one.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Shared circles multiply community trust organically — no algorithm needed", "Group trip planning creates economic accountability to travel Black-owned", "KinfolkAI curation removes 'where should we go?' decision paralysis", "Public circles let community curators build cultural authority", "Circle activity contributes to Trust Score for every saved business"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#3A2010" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — My circles list */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>My Circles</div>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.15vw 0.45vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.46vw", fontWeight: 700 }}>+ Create</span>
              </div>
            </div>
            {[
              { name: "Girls Trip ATL", members: 4, spots: 12, icon: "✈" },
              { name: "Date Night DC", members: 2, spots: 8, icon: "♥" },
              { name: "Family Friendly", members: 6, spots: 15, icon: "☀" },
              { name: "My Faves", members: 1, spots: 23, icon: "★" },
            ].map((circle, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.8vw", padding: "0.6vw 0.7vw", border: `1px solid ${i === 0 ? "rgba(202,146,43,0.35)" : "rgba(255,255,255,0.07)"}`, position: "relative" }}>
                {i === 0 && <div style={{ position: "absolute", top: "0.35vw", right: "0.5vw", background: "#CA922B", borderRadius: "0.3vw", padding: "0.08vw 0.3vw" }}><span style={{ color: "#1C0E06", fontSize: "0.36vw", fontWeight: 800 }}>ACTIVE</span></div>}
                <div style={{ display: "flex", gap: "0.5vw", alignItems: "center" }}>
                  <div style={{ width: "1.8vw", height: "1.8vw", borderRadius: "0.5vw", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.65vw" }}>{circle.icon}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>{circle.name}</div>
                    <div style={{ display: "flex", gap: "0.6vw" }}>
                      <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{circle.members} members</span>
                      <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>·</span>
                      <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{circle.spots} spots</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — Circle detail */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div>
              <div style={{ color: "#A87A40", fontSize: "0.48vw" }}>Kinfolk Circle</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.8vw", fontWeight: 800 }}>Girls Trip ATL</div>
            </div>
            {/* Members row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4vw" }}>
              {["Z", "M", "T", "D"].map((m, i) => (
                <div key={i} style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: `rgba(202,146,43,${0.2 + i * 0.1})`, border: "1px solid rgba(202,146,43,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>{m}</span>
                </div>
              ))}
              <span style={{ color: "#5C3A1A", fontSize: "0.46vw" }}>4 members</span>
            </div>
            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.4vw" }}>
              <div style={{ flex: 1, background: "#CA922B", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center" }}>
                <span style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 800 }}>Plan a Trip</span>
              </div>
              <div style={{ flex: 1, background: "rgba(202,146,43,0.1)", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.52vw", fontWeight: 700 }}>Invite</span>
              </div>
            </div>
            <div style={{ color: "#A87A40", fontSize: "0.48vw", fontWeight: 600 }}>SAVED SPOTS (12)</div>
            {[
              { name: "The Breakfast Club", score: 95, cat: "Brunch" },
              { name: "Slutty Vegan ATL", score: 92, cat: "Vegan" },
              { name: "Throne Salon", score: 94, cat: "Beauty" },
              { name: "Auburn Ave Market", score: 88, cat: "Shopping" },
            ].map((spot, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.6vw", padding: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#FAF6EF", fontSize: "0.56vw", fontWeight: 700 }}>{spot.name}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>{spot.cat}</div>
                </div>
                <div style={{ background: "#CA922B", borderRadius: "0.3vw", padding: "0.1vw 0.35vw" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.5vw", fontWeight: 800 }}>{spot.score}</span>
                </div>
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
