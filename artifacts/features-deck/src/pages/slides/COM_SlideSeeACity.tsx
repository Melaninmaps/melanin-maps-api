const base = import.meta.env.BASE_URL;

export default function SlideSeeACity() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 25% 50%, rgba(202,146,43,0.1) 0%, transparent 58%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        09
      </div>

      {/* Phone mockup — left */}
      <div className="absolute flex items-center justify-center" style={{ left: "7vw", top: "6%", bottom: "6%" }}>
        <div
          style={{ width: "19vw", height: "min(40.85vw,70vh)", borderRadius: "2.1vw", border: "0.5vw solid #2A1508", background: "#0D0805", boxShadow: "0 1.5vw 3vw rgba(0,0,0,0.5), 0 0 0 0.1vw rgba(202,146,43,0.2)", overflow: "hidden", flexShrink: 0 }}
        >
          <img
            src={`${base}app-map.jpg`}
            crossOrigin="anonymous"
            alt="Map with community overlay"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center center" }}
          />
        </div>
      </div>

      {/* Right content */}
      <div className="absolute flex flex-col justify-center" style={{ right: "6vw", top: "8%", bottom: "8%", width: "46vw" }}>
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "1.8vw" }}>
          THE MAP
        </div>

        <h1 className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.5vw" }}>
          See a City Through<br />
          <span style={{ color: "#CA922B" }}>Your Community.</span>
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.5vw" }} />

        <p className="font-body" style={{ fontSize: "1.1vw", color: "#8B6030", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw" }}>
          Not just Google Maps. Three layers of community intelligence rendered simultaneously &mdash;
          so every neighborhood tells you its full story before you arrive.
        </p>

        {/* Layers */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.1vw" }}>
          {[
            {
              num: "01",
              label: "Community Business Pins",
              desc: "11 category-specific icons surfacing minority-owned businesses by type",
            },
            {
              num: "02",
              label: "The Confidence Layer",
              desc: "Safety heatmap built from community surveys \u2014 not government crime data",
            },
            {
              num: "03",
              label: "Cultural Heritage Sites",
              desc: "Landmarks, movements, and neighborhoods that shaped the culture",
            },
          ].map(({ num, label, desc }) => (
            <div
              key={num}
              style={{ display: "flex", alignItems: "flex-start", gap: "1.4vw", padding: "0.9vw 1.2vw", background: "rgba(202,146,43,0.06)", border: "1px solid rgba(202,146,43,0.2)" }}
            >
              <div className="font-display" style={{ fontSize: "0.9vw", fontWeight: 800, color: "rgba(202,146,43,0.5)", width: "2.5vw", flexShrink: 0, paddingTop: "0.1vw" }}>{num}</div>
              <div>
                <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.25vw" }}>{label}</div>
                <div className="font-body" style={{ fontSize: "0.85vw", color: "#6B4420", lineHeight: 1.45 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
