export default function SlideInv48DayInLife() {
  const moments = [
    {
      time: "8:00 AM",
      msg: "Good morning. Profile views are already up 42% since yesterday.",
      action: null,
      icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    },
    {
      time: "10:15 AM",
      msg: "You're trending this morning. People nearby are searching for brunch.",
      action: "Post a special →",
      icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    },
    {
      time: "1:00 PM",
      msg: "Three people just saved your business. That's usually a good sign — demand is building.",
      action: null,
      icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></>,
    },
    {
      time: "4:00 PM",
      msg: "Weekend foot traffic in your neighborhood peaks Friday evening. Want me to draft a promotion?",
      action: "Draft one now →",
      icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    },
    {
      time: "6:30 PM",
      msg: "A new 5-star review just came in. A thoughtful response helps your Trust Score.",
      action: "Reply →",
      icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    },
    {
      time: "11:00 PM",
      msg: "Another good day. Your Trust Score increased again this week.",
      action: null,
      icon: <><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></>,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 15% 50%, rgba(202,146,43,0.1), transparent 45%)" }} />

      {/* Left column */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "6%", bottom: "8%", width: "28vw" }}>
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.7vw" }}>A DAY WITH KINFOLKAI™</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1.2vw" }}>
          This is what it feels like<br />
          <span style={{ color: "#CA922B" }}>to never work alone.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", lineHeight: 1.7 }}>
          KinfolkAI™ monitors your community, surfaces opportunities, and suggests next steps — all day, every day, without you asking.
        </div>
        <div style={{ marginTop: "2.5vw" }}>
          <div className="font-body" style={{ fontSize: "0.85vw", color: "#5C3A1A", lineHeight: 1.6, fontStyle: "italic" }}>
            Every notification is based on<br />real community behavior — not generic data.
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "37vw", top: "5%", bottom: "8%", width: "1px", background: "rgba(202,146,43,0.18)" }} />

      {/* Right column — notification feed */}
      <div className="absolute" style={{ left: "39vw", right: "5vw", top: "0", bottom: "0", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {moments.map((m, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1.1vw", padding: "1.05vw 0", borderBottom: i < moments.length - 1 ? "1px solid rgba(202,146,43,0.1)" : "none" }}>
            <div style={{ flexShrink: 0, width: "5vw", paddingTop: "0.1vw" }}>
              <div className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.06em" }}>{m.time}</div>
            </div>
            <div style={{ flexShrink: 0, marginTop: "0.05vw", width: "1.8vw", height: "1.8vw", borderRadius: "50%", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="0.85vw" height="0.85vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg>
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-body" style={{ fontSize: "1vw", color: "#D9C4A3", lineHeight: 1.5 }}>{m.msg}</div>
              {m.action && (
                <div style={{ marginTop: "0.35vw" }}>
                  <span className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, borderBottom: "1px solid rgba(202,146,43,0.4)", paddingBottom: "0.05vw" }}>{m.action}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          Stop wondering what's happening with your business. Start knowing.
        </div>
      </div>
    </div>
  );
}
