const Phone = ({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) => (
  <div style={{ width: `${15 * scale}vw`, height: `${28 * scale}vw`, background: "linear-gradient(160deg,#282828,#1e1e1e)", borderRadius: `${3 * scale}vw`, padding: `${1 * scale}vw ${0.7 * scale}vw`, boxShadow: `0 ${2 * scale}vw ${6 * scale}vw rgba(0,0,0,0.85)`, position: "relative", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
    <div style={{ position: "absolute", top: `${1.1 * scale}vw`, left: "50%", transform: "translateX(-50%)", width: `${3.5 * scale}vw`, height: `${0.45 * scale}vw`, background: "#2a2a2a", borderRadius: "0.4vw", zIndex: 10 }} />
    <div style={{ width: "100%", height: "100%", background: "#0D0805", borderRadius: `${2.4 * scale}vw`, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
  </div>
);

export default function DemoS16KinfolkBiz() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 50%, rgba(202,146,43,0.12), transparent 55%)" }} />

      {/* Left */}
      <div className="absolute left-[5vw] flex flex-col justify-center" style={{ top: "10%", bottom: "10%", width: "28vw", zIndex: 10 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.18em", fontWeight: 700, marginBottom: "1vw" }}>KINFOLKAI™ FOR BUSINESS</div>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1vw" }}>
          Always working.<br /><span style={{ color: "#CA922B" }}>So you don't have to.</span>
        </div>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40", lineHeight: 1.7 }}>
          A small business owner shouldn't need a marketing team to compete. KinfolkAI fills that gap — working proactively throughout the day so owners can focus on the actual business, not on maintaining visibility in a community they already serve.
        </div>
        <div style={{ marginTop: "2vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
          {[
            "Proactive alerts surface opportunities before owners see them",
            "Drafts content in the owner's voice — ready to post in one tap",
            "AI-assisted review responses protect reputation without requiring expertise",
            "Trend intelligence finds patterns humans would miss in real-time",
            "Depth scales with membership tier — grows with the business",
          ].map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.7vw" }}>
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              <span className="font-body" style={{ fontSize: "0.85vw", color: "#D9C4A3" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Two phones */}
      <div className="absolute" style={{ right: "3vw", top: "0", bottom: "0", display: "flex", alignItems: "center", gap: "2vw" }}>
        {/* Phone 1 — AI notification feed */}
        <Phone>
          <div style={{ padding: "0.7vw 0.8vw", display: "flex", alignItems: "center", gap: "0.4vw", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
            <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>KinfolkAI™ Today</div>
          </div>
          <div style={{ flex: 1, padding: "0.6vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.5vw" }}>
            {[
              { time: "8:14 AM", msg: "17 people searched 'barber near me' in your neighborhood last night. Peak window opens in 2 hours — post now?", action: "Draft Post" },
              { time: "11:32 AM", msg: "Your Trust Score rose to 94 after 3 new reviews this week. You're now in the top 8% of barbershops in DC.", action: "See Reviews" },
              { time: "2:45 PM", msg: "Community event this Saturday nearby — 400+ attendees expected. Want to offer a walk-in special for event-goers?", action: "Create Deal" },
              { time: "5:10 PM", msg: "Marcus Williams left a 5-star review mentioning wait times. Want me to draft a thank-you response?", action: "Draft Reply" },
            ].map((alert, i) => (
              <div key={i} style={{ background: "rgba(202,146,43,0.08)", borderRadius: "0.6vw", padding: "0.5vw", border: "1px solid rgba(202,146,43,0.2)" }}>
                <div style={{ color: "#5C3A1A", fontSize: "0.4vw", marginBottom: "0.15vw" }}>{alert.time}</div>
                <div style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.4, marginBottom: "0.3vw" }}>{alert.msg}</div>
                <div style={{ display: "inline-block", background: "rgba(202,146,43,0.2)", borderRadius: "0.4vw", padding: "0.1vw 0.45vw", border: "1px solid rgba(202,146,43,0.4)" }}>
                  <span style={{ color: "#CA922B", fontSize: "0.44vw", fontWeight: 700 }}>{alert.action} →</span>
                </div>
              </div>
            ))}
          </div>
        </Phone>

        {/* Phone 2 — AI draft post */}
        <Phone>
          <div style={{ padding: "0.7vw 0.8vw", display: "flex", alignItems: "center", gap: "0.4vw", borderBottom: "1px solid rgba(202,146,43,0.15)", flexShrink: 0 }}>
            <div style={{ width: "1.4vw", height: "1.4vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "1px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#CA922B", fontSize: "0.55vw", fontWeight: 800 }}>K</span>
            </div>
            <div style={{ color: "#FAF6EF", fontSize: "0.6vw", fontWeight: 700 }}>KinfolkAI™ — Content Draft</div>
          </div>
          <div style={{ flex: 1, padding: "0.7vw 0.8vw", display: "flex", flexDirection: "column", gap: "0.55vw" }}>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ background: "rgba(202,146,43,0.2)", borderRadius: "0.8vw 0.8vw 0.1vw 0.8vw", padding: "0.45vw 0.6vw", border: "1px solid rgba(202,146,43,0.3)" }}>
                <span style={{ color: "#FAF6EF", fontSize: "0.52vw" }}>Draft a Saturday flash deal for walk-ins. Keep it authentic to how I talk.</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.35vw", alignItems: "flex-start" }}>
              <div style={{ width: "1.2vw", height: "1.2vw", borderRadius: "50%", background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.4)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#CA922B", fontSize: "0.45vw", fontWeight: 800 }}>K</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.8vw 0.8vw 0.8vw 0.1vw", padding: "0.5vw 0.6vw", border: "1px solid rgba(255,255,255,0.08)" }}>
                <span style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.5 }}>Based on your voice and past posts, here's a draft:</span>
              </div>
            </div>
            {/* Draft content card */}
            <div style={{ background: "rgba(202,146,43,0.1)", borderRadius: "0.7vw", padding: "0.6vw", border: "1px solid rgba(202,146,43,0.3)" }}>
              <div style={{ color: "#CA922B", fontSize: "0.42vw", fontWeight: 700, marginBottom: "0.3vw" }}>DRAFT — Community Story</div>
              <div style={{ color: "#FAF6EF", fontSize: "0.56vw", fontWeight: 700, marginBottom: "0.25vw" }}>Walk-ins welcome this Saturday — no appointment needed</div>
              <div style={{ color: "#D9C4A3", fontSize: "0.5vw", lineHeight: 1.5, marginBottom: "0.4vw" }}>Saturdays are for the community. Come through, no stress — chairs are open 10 AM to 4 PM. Fresh cuts, real conversation, and the same vibe you always get at Marcus's.</div>
              <div style={{ display: "flex", gap: "0.4vw" }}>
                <div style={{ flex: 1, background: "#CA922B", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center" }}>
                  <span style={{ color: "#1C0E06", fontSize: "0.52vw", fontWeight: 800 }}>Post Now</span>
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.05)", borderRadius: "0.5vw", padding: "0.4vw", textAlign: "center", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <span style={{ color: "#A87A40", fontSize: "0.52vw" }}>Edit Draft</span>
                </div>
              </div>
            </div>
          </div>
        </Phone>
      </div>
    </div>
  );
}
