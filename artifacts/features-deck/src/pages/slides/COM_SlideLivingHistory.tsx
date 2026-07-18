const base = import.meta.env.BASE_URL;

export default function SlideLivingHistory() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Full bleed background image */}
      <img
        src={`${base}hero-journey.png`}
        crossOrigin="anonymous"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.22 }}
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(28,14,6,0.95) 0%, rgba(28,14,6,0.6) 55%, rgba(28,14,6,0.85) 100%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>
        10
      </div>

      {/* Content — centered */}
      <div className="absolute left-[7vw] flex flex-col justify-center" style={{ top: "8%", bottom: "8%", width: "55vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700, marginBottom: "2vw" }}>
          CULTURAL HERITAGE
        </div>

        <h1 className="font-display" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.8vw" }}>
          Walk Through<br />
          <span style={{ color: "#CA922B" }}>Living History.</span>
        </h1>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "2.8vw" }} />

        <p className="font-body" style={{ fontSize: "1.4vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "2.8vw", maxWidth: "46vw" }}>
          Discover the places that shaped culture &mdash; not just landmarks,
          but stories, neighborhoods, movements, and moments that continue
          to inspire communities today.
        </p>

        {/* Feature callouts */}
        <div style={{ display: "flex", gap: "1.8vw" }}>
          {[
            { label: "On the map", desc: "Heritage pins integrated directly into community discovery" },
            { label: "Deep context", desc: "Historical narrative, photos, and community notes per site" },
            { label: "Living layer", desc: "Tap any site to understand the culture before you visit" },
          ].map(({ label, desc }) => (
            <div
              key={label}
              style={{ flex: 1, padding: "1.2vw 1.4vw", background: "rgba(202,146,43,0.07)", border: "1px solid rgba(202,146,43,0.25)" }}
            >
              <div style={{ width: "2.5vw", height: "1.5px", background: "#CA922B", marginBottom: "0.9vw", opacity: 0.7 }} />
              <div className="font-display" style={{ fontSize: "1.05vw", fontWeight: 700, color: "#FAF6EF", marginBottom: "0.5vw" }}>{label}</div>
              <div className="font-body" style={{ fontSize: "0.85vw", color: "#6B4420", lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
