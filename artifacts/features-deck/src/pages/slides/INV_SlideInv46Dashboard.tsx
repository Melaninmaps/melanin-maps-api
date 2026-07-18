export default function SlideInv46Dashboard() {
  const metrics = [
    { label: "Profile Views",        value: "2,847", delta: "+34% this week",        up: true,  icon: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></> },
    { label: "Saves & Favorites",    value: "218",   delta: "+18 this week",          up: true,  icon: <><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></> },
    { label: "Trending Searches",    value: "#1",    delta: "in Soul Food · Philly",  up: true,  icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></> },
    { label: "Trust Score",          value: "94",    delta: "+6 pts this month",      up: true,  icon: <><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></> },
    { label: "Community Reputation", value: "4.9",   delta: "214 verified reviews",   up: true,  icon: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></> },
    { label: "AI Suggestions",       value: "3",     delta: "actions ready for you",  up: false, icon: <><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></> },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 80% 20%, rgba(202,146,43,0.07), transparent 50%)" }} />

      <div className="absolute left-[6vw] right-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>YOUR BUSINESS DASHBOARD</div>
        <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.08 }}>
          Know what your community wants<br />
          <span style={{ color: "#CA922B" }}>before anyone else does.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#7B5408", lineHeight: 1.55, marginTop: "0.55vw" }}>
          See what your community loves, what they're searching for, and what to do next — all in one place.
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "16.5vw", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "18vw", bottom: "5.5vw", background: "#FFFFFF", borderRadius: "1vw", border: "1px solid rgba(58,31,14,0.1)", overflow: "hidden", boxShadow: "0 0.3vw 1.5vw rgba(58,31,14,0.08)" }}>
        <div style={{ background: "#F5EBD8", padding: "0.6vw 1vw", display: "flex", alignItems: "center", gap: "0.5vw", borderBottom: "1px solid rgba(58,31,14,0.08)" }}>
          <div style={{ display: "flex", gap: "0.3vw" }}>
            {[0,1,2].map(i => <div key={i} style={{ width: "0.55vw", height: "0.55vw", borderRadius: "50%", background: "rgba(58,31,14,0.2)" }} />)}
          </div>
          <div style={{ flex: 1, background: "#FFFFFF", borderRadius: "0.4vw", padding: "0.25vw 0.8vw" }}>
            <span className="font-body" style={{ fontSize: "0.65vw", color: "#7B5408" }}>mappingwithmelanin.com/dashboard</span>
          </div>
        </div>
        <div style={{ padding: "1.2vw 1.5vw" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1vw" }}>
            <div>
              <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 700, color: "#1C0E06" }}>SoulFire Kitchen</div>
              <div className="font-body" style={{ fontSize: "0.7vw", color: "#7B5408" }}>Soul Food · Philadelphia, PA · Last updated just now</div>
            </div>
            <div style={{ background: "#CA922B", borderRadius: "0.5vw", padding: "0.4vw 1vw" }}>
              <span className="font-body" style={{ fontSize: "0.7vw", color: "#1C0E06", fontWeight: 700 }}>View Public Profile</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.9vw" }}>
            {metrics.map((m, i) => (
              <div key={i} style={{ background: "#FAF6EF", borderRadius: "0.7vw", padding: "1vw 1.1vw", border: "1px solid rgba(58,31,14,0.07)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5vw" }}>
                  <span className="font-body" style={{ fontSize: "0.68vw", color: "#7B5408", fontWeight: 700, letterSpacing: "0.06em" }}>{m.label.toUpperCase()}</span>
                  <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{m.icon}</svg>
                </div>
                <div className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1, marginBottom: "0.3vw" }}>{m.value}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3vw" }}>
                  {m.up && <svg width="0.7vw" height="0.7vw" viewBox="0 0 24 24" fill="none" stroke="#5A9A6F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>}
                  <span className="font-body" style={{ fontSize: "0.68vw", color: m.up ? "#5A9A6F" : "#A87A40", fontWeight: 600 }}>{m.delta}</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "0.9vw", background: "linear-gradient(135deg, #3D2417, #1C0E06)", borderRadius: "0.7vw", padding: "0.8vw 1.2vw", display: "flex", alignItems: "center", gap: "1vw" }}>
            <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
            <span className="font-body" style={{ fontSize: "0.78vw", color: "#CA922B", fontWeight: 700 }}>KinfolkAI™:</span>
            <span className="font-body" style={{ fontSize: "0.78vw", color: "#D9C4A3" }}>218 people saved your business this month. Demand is growing. Want KinfolkAI™ to draft a promotion before the weekend?</span>
          </div>
        </div>
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[1.5vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          Your community leaves clues every day. We help you see them.
        </div>
      </div>
    </div>
  );
}
