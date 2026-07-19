const base = import.meta.env.BASE_URL;

export default function SlideConfidenceLayer() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 60%, rgba(202,146,43,0.12) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        08
      </div>

      {/* Phone mockup — left */}
      <div className="absolute flex items-center justify-center" style={{ left: "7vw", top: "6%", bottom: "6%" }}>
        <div
          style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.1vw", border: "0.5vw solid #2A1508", background: "#0D0805", boxShadow: "0 1.5vw 3vw rgba(0,0,0,0.5), 0 0 0 0.1vw rgba(202,146,43,0.2)", overflow: "hidden", flexShrink: 0 }}
        >
          <img
            src={`${base}app-map-safety.png`}
            crossOrigin="anonymous"
            alt="Safety confidence layer on map"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center center" }}
          />
        </div>
      </div>

      {/* Right content */}
      <div className="absolute flex flex-col justify-center" style={{ right: "6vw", top: "8%", bottom: "8%", width: "46vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          COMMUNITY SAFETY INTELLIGENCE
        </div>

        <h1 className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "0.3vw" }}>
          Know Before
        </h1>
        <h1 className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.05, marginBottom: "2.5vw" }}>
          You Go.
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.5vw" }} />

        <p className="font-body" style={{ fontSize: "1.3vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw" }}>
          Safety isn&rsquo;t just crime statistics.<br />
          It&rsquo;s lived experience.
        </p>

        <p className="font-body" style={{ fontSize: "1.1vw", color: "#8B6030", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw" }}>
          Mapping With Melanin&trade; overlays community insights directly onto the map
          so every decision is informed by people who have actually been there.
          We don&rsquo;t replace your judgment. We strengthen it.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.9vw" }}>
          {[
            { label: "The Confidence Layer", desc: "Real-time safety scores from community members who live there" },
            { label: "Officer Watch", desc: "Community reports on law enforcement encounters" },
            { label: "Move Alerts", desc: "Neighborhood change notifications from your network" },
            { label: "Buzz Alerts", desc: "Positive community activity signals for local areas" },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start" style={{ gap: "1vw" }}>
              <div style={{ flexShrink: 0, marginTop: "0.3vw", width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B" }} />
              <div>
                <span className="font-display" style={{ fontSize: "1vw", fontWeight: 700, color: "#FAF6EF" }}>{label}</span>
                <span className="font-body" style={{ fontSize: "0.9vw", color: "#6B4420", marginLeft: "0.5vw" }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
