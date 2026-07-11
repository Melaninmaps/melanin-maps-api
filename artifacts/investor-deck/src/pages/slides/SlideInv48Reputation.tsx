export default function SlideInv48Reputation() {
  const chain = [
    { label: "Verified Badge", body: "Community-confirmed. Instantly signals legitimacy and trust.", icon: <><path d="M12 22s8-4 8-10V5l-8-2-8 2v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></> },
    { label: "Recommendations", body: "Your customers become your best marketing channel.", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></> },
    { label: "Trust Score", body: "A live, compounding metric that grows with every positive interaction.", icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></> },
    { label: "Search Ranking", body: "Higher trust means more visibility in every community search.", icon: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></> },
    { label: "Customer Loyalty", body: "Repeat visits, saves, and community advocacy build on each other.", icon: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></> },
    { label: "Word of Mouth", body: "The most powerful advertising channel — and it costs you nothing.", icon: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></> },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 10% 50%, rgba(202,146,43,0.06), transparent 50%)" }} />

      <div className="absolute left-[6vw] right-[45vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "0.5vw" }}>YOUR COMPETITIVE ADVANTAGE</div>
        <div className="font-display" style={{ fontSize: "2.9vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1 }}>
          Reputation becomes<br />
          <span style={{ color: "#CA922B" }}>your competitive advantage.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1vw", color: "#7B5408", lineHeight: 1.6, marginTop: "0.8vw" }}>
          On every other platform, you compete on price and proximity.<br />Here, you compete on trust. And trust compounds.
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "17vw", bottom: "5.5vw", display: "flex", flexDirection: "row", alignItems: "stretch", gap: "0" }}>
        {chain.map((step, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            {i < chain.length - 1 && (
              <div style={{ position: "absolute", right: "-1px", top: "2.8vw", zIndex: 2 }}>
                <svg width="1.4vw" height="1.4vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
              </div>
            )}
            <div style={{ width: "100%", background: i % 2 === 0 ? "#FFFFFF" : "#F5EBD8", borderRadius: "0.8vw", padding: "1.3vw 1.1vw", border: `1px solid ${i === 0 ? "#CA922B" : "rgba(58,31,14,0.08)"}`, borderLeft: i === 0 ? "3px solid #CA922B" : undefined, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "100%" }}>
              <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "50%", background: i === 0 ? "#CA922B" : "rgba(202,146,43,0.12)", border: `1px solid ${i === 0 ? "transparent" : "rgba(202,146,43,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "0.8vw", flexShrink: 0 }}>
                <svg width="1.2vw" height="1.2vw" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{step.icon}</svg>
              </div>
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.2, marginBottom: "0.6vw" }}>{step.label}</div>
              <div className="font-body" style={{ fontSize: "0.75vw", color: "#7B5408", lineHeight: 1.5 }}>{step.body}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute left-[6vw] right-[6vw] bottom-[1.8vw]">
        <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#CA922B", fontStyle: "italic" }}>
          Every business on every other platform rents attention. Here, you build it.
        </div>
      </div>
    </div>
  );
}
