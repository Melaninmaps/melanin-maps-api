export default function BizSlide02Problem() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 80%, rgba(202,146,43,0.07), transparent 50%)" }} />

      {/* Left column — main message */}
      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "6%", bottom: "6%", maxWidth: "45vw" }}>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 700, marginBottom: "1.2vw" }}>THE PROBLEM</div>

        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "0.8vw" }}>
          This isn't about Google.
        </div>
        <div className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.05, marginBottom: "2vw" }}>
          This is about attention.
        </div>

        <div className="font-body" style={{ fontSize: "1.15vw", color: "#5C3A1A", lineHeight: 1.75, marginBottom: "2.5vw" }}>
          Your community <em>wants</em> to support you. They actively seek out businesses like yours. The problem isn't demand — it's that traditional platforms were never designed to bridge that gap.
        </div>

        <div style={{ borderLeft: "3px solid #CA922B", paddingLeft: "1.5vw" }}>
          <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#1C0E06", lineHeight: 1.4, fontStyle: "italic" }}>
            "People aren't looking for more businesses.<br />They're looking for businesses they can trust."
          </div>
        </div>
      </div>

      {/* Right column — problem points */}
      <div className="absolute flex flex-col justify-center" style={{ right: "5vw", top: "6%", bottom: "6%", width: "43vw", gap: "0" }}>
        <div style={{ background: "#FFFFFF", borderRadius: "1vw", overflow: "hidden", border: "1px solid rgba(58,31,14,0.08)", boxShadow: "0 0.2vw 0.8vw rgba(0,0,0,0.04)" }}>
          {[
            { icon: "heart", text: "Your community wants to support you", sub: "The buying intent is already there — it's not a marketing problem" },
            { icon: "eye-off", text: "They just don't know you exist", sub: "Your business is invisible to people who are actively searching" },
            { icon: "trending-up", text: "Billions flow into the community every year", sub: "This market is not untapped — it's just underserved by tools" },
            { icon: "search", text: "People search every single day", sub: "Hundreds of community-intent searches happen in your city right now" },
            { icon: "dollar-sign", text: "Traditional platforms reward ad spend", sub: "Bigger budget = higher rank. Quality and trust don't factor in" },
            { icon: "layers", text: "Great businesses stay buried", sub: "You're competing with national chains who outspend you 100:1" },
          ].map((item, i) => (
            <div key={i} style={{ padding: "1.1vw 1.4vw", borderBottom: i < 5 ? "1px solid rgba(58,31,14,0.06)" : "none", display: "flex", gap: "1vw", alignItems: "flex-start" }}>
              <div style={{ width: "2vw", height: "2vw", borderRadius: "50%", background: i % 2 === 0 ? "#CA922B" : "#F5EBD8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "0.1vw" }}>
                {item.icon === "heart" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>}
                {item.icon === "eye-off" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>}
                {item.icon === "trending-up" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>}
                {item.icon === "search" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>}
                {item.icon === "dollar-sign" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                {item.icon === "layers" && <svg width="0.9vw" height="0.9vw" viewBox="0 0 24 24" fill="none" stroke={i % 2 === 0 ? "#1C0E06" : "#CA922B"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></svg>}
              </div>
              <div>
                <div className="font-body" style={{ fontSize: "0.92vw", color: "#1C0E06", fontWeight: 700, lineHeight: 1.3 }}>{item.text}</div>
                <div className="font-body" style={{ fontSize: "0.8vw", color: "#A87A40", lineHeight: 1.4, marginTop: "0.2vw" }}>{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
