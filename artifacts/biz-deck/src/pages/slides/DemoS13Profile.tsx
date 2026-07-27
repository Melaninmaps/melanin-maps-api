const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS13Profile() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.12), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>YOUR PROFILE</div>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          A membership that<br /><span style={{ color: "#CA922B" }}>grows with you.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          Traditional loyalty programs reward spending. We reward contribution. Every review you write, every check-in you complete, every person you refer — you're making the community stronger. That deserves recognition. A Trailblazer isn't just a paying member. They're a community builder.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {["Points earned through contribution, not just consumption", "Milestones mark genuine cultural engagement — not arbitrary spending", "Tier upgrades unlock community access, not just app features", "Referrals grow the network and reward the person who opened the door", "Membership is priced to be accessible — this isn't luxury infrastructure"].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — Profile */}
        <Phone>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Profile header */}
            <div style={{ background: "linear-gradient(180deg,rgba(202,146,43,0.15),transparent)", padding: "1.2vw 0.9vw 0.7vw", textAlign: "center" }}>
              <div style={{ width: "3vw", height: "3vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", margin: "0 auto 0.4vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#CA922B", fontSize: "1.1vw", fontWeight: 800 }}>Z</span>
              </div>
              <div style={{ color: "#FAF6EF", fontSize: "0.72vw", fontWeight: 800 }}>Zara Okafor</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.25vw", marginTop: "0.2vw", background: "rgba(202,146,43,0.15)", borderRadius: "2vw", padding: "0.15vw 0.5vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>NAVIGATOR</span>
              </div>
            </div>
            {/* Stats */}
            <div style={{ display: "flex", justifyContent: "space-around", padding: "0.5vw 0.8vw", borderBottom: "1px solid rgba(202,146,43,0.12)" }}>
              {[{ val: "47", label: "Saves" }, { val: "1,240", label: "Points" }, { val: "12", label: "Reviews" }].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <div style={{ color: "#CA922B", fontSize: "0.72vw", fontWeight: 800 }}>{s.val}</div>
                  <div style={{ color: "#5C3A1A", fontSize: "0.42vw" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Content */}
            <div style={{ padding: "0.5vw 0.8vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.5vw" }}>
              <div style={{ color: "#A87A40", fontSize: "0.48vw", fontWeight: 600 }}>RECENT SAVES</div>
              {["Copper & Oak Bistro", "The Crown Salon", "Root Collective"].map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.04)", borderRadius: "0.5vw", padding: "0.4vw 0.55vw" }}>
                  <span style={{ color: "#D9C4A3", fontSize: "0.52vw" }}>{b}</span>
                  <svg width="0.6vw" height="0.6vw" viewBox="0 0 24 24" fill="#CA922B" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                </div>
              ))}
              <div style={{ color: "#A87A40", fontSize: "0.48vw", fontWeight: 600, marginTop: "0.3vw" }}>REFERRAL</div>
              <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.5vw", padding: "0.4vw 0.55vw", border: "1px solid rgba(202,146,43,0.25)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>ZARA-ATL-2024</span>
                <span style={{ color: "#5C3A1A", fontSize: "0.44vw" }}>14 friends joined</span>
              </div>
            </div>
          </div>
        </Phone>

        {/* Phone 2 — Points & milestones */}
        <Phone>
          <div style={{ padding: "0.8vw 0.9vw", flex: 1, display: "flex", flexDirection: "column", gap: "0.6vw" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#FAF6EF", fontSize: "0.75vw", fontWeight: 800 }}>Points & Milestones</div>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.5vw", padding: "0.15vw 0.5vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 800 }}>1,240 pts</span>
              </div>
            </div>
            {/* Progress to next tier */}
            <div style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.55vw", border: "1px solid rgba(202,146,43,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3vw" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw" }}>Navigator → Trailblazer</span>
                <span style={{ color: "#CA922B", fontSize: "0.5vw", fontWeight: 700 }}>760 pts to go</span>
              </div>
              <div style={{ height: "0.4vw", background: "rgba(255,255,255,0.08)", borderRadius: "0.2vw" }}>
                <div style={{ width: "62%", height: "100%", background: "linear-gradient(90deg,#CA922B,rgba(202,146,43,0.6))", borderRadius: "0.2vw" }} />
              </div>
            </div>
            <div style={{ color: "#A87A40", fontSize: "0.5vw", fontWeight: 600 }}>MILESTONES</div>
            {[
              { title: "First Review Written", pts: "+100", done: true },
              { title: "5 Business Check-Ins", pts: "+250", done: true },
              { title: "Invited 10 Friends", pts: "+500", done: false, progress: "7/10" },
              { title: "Safety Survey Submitted", pts: "+150", done: true },
              { title: "Kinfolk Circle Created", pts: "+200", done: false, progress: "0/1" },
            ].map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: (m as any).done ? "rgba(46,140,46,0.07)" : "rgba(255,255,255,0.03)", borderRadius: "0.5vw", padding: "0.4vw 0.55vw", border: `1px solid ${(m as any).done ? "rgba(46,140,46,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                <div>
                  <div style={{ color: (m as any).done ? "#D9C4A3" : "#5C3A1A", fontSize: "0.5vw", textDecoration: (m as any).done ? "none" : "none" }}>{m.title}</div>
                  {(m as any).progress && <div style={{ color: "#CA922B", fontSize: "0.42vw" }}>{(m as any).progress}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3vw" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.48vw", fontWeight: 700 }}>{m.pts}</span>
                  {(m as any).done && <svg width="0.65vw" height="0.65vw" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                </div>
              </div>
            ))}
          </div>
        </Phone>
      </div>
    </div>
  );
}
