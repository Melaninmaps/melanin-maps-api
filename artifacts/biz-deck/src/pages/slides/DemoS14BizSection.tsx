export default function DemoS14BizSection() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#1C0E06" }}>
      {/* Radial glow */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.18), transparent 60%)" }} />

      {/* Decorative horizontal rule */}
      <div className="absolute" style={{ top: "50%", left: "6vw", right: "6vw", height: "1px", background: "rgba(202,146,43,0.15)", transform: "translateY(-8vw)" }} />
      <div className="absolute" style={{ top: "50%", left: "6vw", right: "6vw", height: "1px", background: "rgba(202,146,43,0.15)", transform: "translateY(8vw)" }} />

      {/* Content */}
      <div className="flex flex-col items-center" style={{ zIndex: 10, textAlign: "center", maxWidth: "70vw" }}>
        <div className="font-body" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.25em", fontWeight: 700, marginBottom: "1.5vw" }}>PART TWO</div>
        <div className="font-display" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2vw" }}>
          The Business Owner<br /><span style={{ color: "#CA922B" }}>Experience.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#A87A40", lineHeight: 1.7, maxWidth: "52vw" }}>
          Every business in this community deserves what corporate chains take for granted — visibility, data, intelligence, and a loyal customer base. We built those tools for the businesses that built the culture.
        </div>
        <div style={{ marginTop: "3vw", display: "flex", gap: "3vw", justifyContent: "center" }}>
          {[
            { label: "Dashboard", sub: "Real-time community metrics" },
            { label: "KinfolkAI™", sub: "Your AI business partner" },
            { label: "Growth Tools", sub: "5 placement types" },
            { label: "Trust Score", sub: "Earned, not purchased" },
            { label: "Plans", sub: "Built for small business" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3vw" }}>
              <div style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: "#CA922B" }} />
              <div className="font-display" style={{ fontSize: "0.85vw", fontWeight: 700, color: "#FAF6EF" }}>{item.label}</div>
              <div className="font-body" style={{ fontSize: "0.65vw", color: "#5C3A1A" }}>{item.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
