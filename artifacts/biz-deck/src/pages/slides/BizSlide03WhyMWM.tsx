export default function BizSlide03WhyMWM() {
  const PILLARS = [
    { label: "Business Discovery", desc: "Your profile surfaces in searches by category, neighborhood, and trust score", icon: "search" },
    { label: "Community Reviews", desc: "Authentic reviews from verified members build lasting credibility", icon: "star" },
    { label: "Safety Intelligence", desc: "Neighborhood safety data helps your customers choose your area with confidence", icon: "shield" },
    { label: "Events & Moments", desc: "Host and promote events to your community directly on the platform", icon: "calendar" },
    { label: "KinfolkAI™", desc: "AI trained on your community crafts marketing, responds to reviews, surfaces insights", icon: "sparkle" },
    { label: "Community Feed", desc: "Your business is part of the conversation — not an ad interrupting it", icon: "message" },
    { label: "Business Dashboard", desc: "Analytics, promotions, and customer insights built for growth", icon: "bar-chart" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 110%, rgba(202,146,43,0.1), transparent 55%)" }} />

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.6vw" }}>WHY WE EXIST</div>
        <div className="font-display" style={{ fontSize: "3.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.08 }}>
          Not another directory.<br />
          <span style={{ color: "#CA922B" }}>A community intelligence platform.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#A87A40", lineHeight: 1.6, marginTop: "0.7vw", maxWidth: "50vw" }}>
          Seven integrated systems working together — all built around one goal: connecting your business to the community that is already looking for you.
        </div>
      </div>

      {/* Horizontal rule */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Pillar grid */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17.5vw", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1vw" }}>
        {PILLARS.slice(0, 4).map((p) => (
          <div key={p.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(202,146,43,0.18)", borderRadius: "0.8vw", padding: "1.3vw" }}>
            <div style={{ marginBottom: "0.7vw" }}>
              {p.icon === "search" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
              {p.icon === "star" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
              {p.icon === "shield" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" /></svg>}
              {p.icon === "calendar" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
            </div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "0.35vw" }}>{p.label.toUpperCase()}</div>
            <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.4vw" }}>{p.label}</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#A87A40", lineHeight: 1.5 }}>{p.desc}</div>
          </div>
        ))}
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "33.5vw", display: "grid", gridTemplateColumns: "repeat(3, 1fr) 1.04fr", gap: "1vw" }}>
        {PILLARS.slice(4).map((p, i) => (
          <div key={p.label} style={{ background: i === 2 ? "rgba(202,146,43,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid rgba(202,146,43,${i === 2 ? "0.35" : "0.18"})`, borderRadius: "0.8vw", padding: "1.3vw" }}>
            <div style={{ marginBottom: "0.7vw" }}>
              {p.icon === "sparkle" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
              {p.icon === "message" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>}
              {p.icon === "bar-chart" && <svg width="1.6vw" height="1.6vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
            </div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.08em", marginBottom: "0.35vw" }}>{p.label.toUpperCase()}</div>
            <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0.4vw" }}>{p.label}</div>
            <div className="font-body" style={{ fontSize: "0.8vw", color: "#A87A40", lineHeight: 1.5 }}>{p.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
