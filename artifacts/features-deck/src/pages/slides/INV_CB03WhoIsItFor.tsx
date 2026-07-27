const base = import.meta.env.BASE_URL;

const situations = [
  "Moving to a new city",
  "Exploring your hometown",
  "Traveling somewhere unfamiliar",
  "Looking for community",
  "Supporting minority-owned businesses",
  "Finding trusted recommendations",
  "Knowing before you go",
];

export default function CB03WhoIsItFor() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#FAF6EF" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>03</div>

      {/* Left */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "8%", bottom: "8%", width: "42vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.6vw" }}>WHO IS IT FOR?</div>
        <h1 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#1C0E06", lineHeight: 1.1, marginBottom: "2.4vw" }}>
          Wherever life takes you,<br />
          <span style={{ color: "#CA922B" }}>find your community first.</span>
        </h1>

        <div className="flex flex-col" style={{ gap: "0.9vw", marginBottom: "2.8vw" }}>
          {situations.map((s) => (
            <div key={s} className="flex items-center" style={{ gap: "1vw" }}>
              <div style={{ flexShrink: 0, width: "1.5vw", height: "1.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.35)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="0.8vw" height="0.8vw" viewBox="0 0 12 10" fill="none">
                  <path d="M1 5l3.5 3.5L11 1" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-body" style={{ fontSize: "1.2vw", color: "#3A1F0E", fontWeight: 500 }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1.4vw" }} />
        <p className="font-body" style={{ fontSize: "1.15vw", fontWeight: 400, color: "#3A1F0E", lineHeight: 1.6 }}>
          Whether you&rsquo;re staying close to home or starting somewhere new,<br />
          <strong style={{ color: "#1C0E06" }}>Mapping With Melanin&trade;</strong> helps you discover businesses,<br />
          communities, and experiences that make every place feel more like home.
        </p>
      </div>

      {/* Phone */}
      <div className="absolute flex items-center" style={{ right: "6vw", top: "5%", bottom: "5%" }}>
        <div className="relative flex-shrink-0" style={{ width: "19vw", height: "min(40.85vw, 70vh)", borderRadius: "2.09vw", border: "0.475vw solid #3A1F0E", background: "#1C0E06", boxShadow: "0 1.4vw 2.8vw rgba(28,14,6,0.22)", overflow: "hidden" }}>
          <img src={`${base}mockups/app-map-safety.png`} crossOrigin="anonymous" alt="App map with safety overlay" className="absolute inset-0 w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}
