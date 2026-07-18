export default function BizSlide08KinfolkAI() {
  const capabilities = [
    {
      title: "Creates posts",
      body: "Drafts ready-to-share marketing content based on your business, neighborhood, and community events.",
      icon: <><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></>,
    },
    {
      title: "Responds to reviews",
      body: "Writes thoughtful, on-brand replies to community feedback — so every customer feels heard.",
      icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
    },
    {
      title: "Finds customer trends",
      body: "Spots patterns in what your customers are saving, searching, and saying before you'd notice them yourself.",
      icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></>,
    },
    {
      title: "Suggests promotions",
      body: "Recommends the right offers at the right time — timed to community activity, not guesswork.",
      icon: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    },
    {
      title: "Identifies growth opportunities",
      body: "Surfaces untapped moments — new neighborhoods, event timing, rising search categories near you.",
      icon: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    },
    {
      title: "Alerts you when something needs attention",
      body: "Notifies you instantly when a review needs a response, a trend shifts, or a promotion window opens.",
      icon: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 20% 50%, rgba(202,146,43,0.14), transparent 50%)" }} />

      {/* Left column — headline */}
      <div className="absolute left-[6vw] flex flex-col justify-center" style={{ top: "6%", bottom: "8%", width: "30vw" }}>
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.8vw" }}>MEET KINFOLKAI™</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1.5vw" }}>
          Not an AI assistant.<br />
          <span style={{ color: "#CA922B" }}>Your business partner.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#A87A40", lineHeight: 1.7 }}>
          KinfolkAI™ works in the background — understanding your community, protecting your reputation, and finding growth you'd otherwise miss.
        </div>

        {/* Glowing orb decoration */}
        <div style={{ marginTop: "2.5vw", width: "8vw", height: "8vw", borderRadius: "50%", background: "radial-gradient(circle, rgba(202,146,43,0.3) 0%, rgba(202,146,43,0.05) 60%, transparent 100%)", border: "1px solid rgba(202,146,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="3vw" height="3vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="absolute" style={{ left: "39vw", top: "6%", bottom: "8%", width: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Right — 6 capabilities in 2 columns */}
      <div className="absolute" style={{ left: "41vw", right: "5vw", top: "6%", bottom: "8%", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.8vw 2.5vw", alignContent: "center" }}>
        {capabilities.map((cap, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: "0.4vw" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6vw" }}>
              <div style={{ flexShrink: 0, width: "1.8vw", height: "1.8vw", borderRadius: "0.4vw", background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {cap.icon}
                </svg>
              </div>
              <div className="font-body" style={{ fontSize: "0.95vw", color: "#FAF6EF", fontWeight: 700 }}>{cap.title}</div>
            </div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.55, paddingLeft: "2.4vw" }}>{cap.body}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute left-[6vw] right-[6vw] bottom-[2vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          While you run your business, KinfolkAI™ is working on growing it.
        </div>
      </div>
    </div>
  );
}
