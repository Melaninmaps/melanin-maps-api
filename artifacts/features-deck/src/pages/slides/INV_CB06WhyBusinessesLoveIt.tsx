const base = import.meta.env.BASE_URL;

const points = [
  { strong: "Their website.", rest: "We drive customers directly there." },
  { strong: "Their booking page.", rest: "We make reservations their revenue." },
  { strong: "Their social media.", rest: "We grow their audience." },
];

export default function CB06WhyBusinessesLoveIt() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>06</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", maxWidth: "38vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.6vw" }}>WHY BUSINESSES LOVE IT</div>
        <h1 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.05, marginBottom: "2vw" }}>
          Businesses own<br />the relationship.
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2vw" }} />
        <p className="font-body" style={{ fontSize: "1.2vw", color: "#7B5408", lineHeight: 1.6, marginBottom: "2.2vw", fontWeight: 400 }}>
          We don&rsquo;t trap customers behind a paywall or own their data. We send them directly to:
        </p>
        <div className="flex flex-col" style={{ gap: "1.2vw", marginBottom: "2.8vw" }}>
          {points.map((p, i) => (
            <div key={i} className="flex items-start" style={{ gap: "1.1vw" }}>
              <div style={{ width: "1.5vw", height: "1.5vw", borderRadius: "50%", border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.08)", flexShrink: 0, marginTop: "0.1vw", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.65vw" height="0.55vw" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.8 2.8L9 1" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="font-body" style={{ fontSize: "1.15vw", color: "#3A1F0E", lineHeight: 1.5 }}>
                <strong style={{ color: "#1C0E06", fontWeight: 700 }}>{p.strong}</strong>{" "}{p.rest}
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "1.2vw 1.6vw", borderRadius: "0.6vw", border: "1px solid rgba(202,146,43,0.3)", background: "rgba(202,146,43,0.06)" }}>
          <p className="font-display" style={{ fontSize: "1.15vw", fontStyle: "italic", color: "#7B5408", fontWeight: 600, lineHeight: 1.4 }}>
            &ldquo;The community recommends. The business benefits. Every time.&rdquo;
          </p>
        </div>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <img src={`${base}app-businesses.jpg`} crossOrigin="anonymous" alt="Business profile screen" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
