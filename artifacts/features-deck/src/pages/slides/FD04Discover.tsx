const features = [
  { label: "Confidence Score", desc: "Community-verified, not ad-ranked" },
  { label: "Category Filters", desc: "Hair, food, wellness, services — curated" },
  { label: "Safety Overlay", desc: "Real intel from real neighbors" },
  { label: "Business Profiles", desc: "Photos, hours, reviews, and the owner's story" },
];

export default function FD04Discover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 75% 45%, rgba(202,146,43,0.13) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>04</div>

      {/* Left column */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "42vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "1.4vw" }}>DISCOVER</div>
        <div className="font-quote" style={{ fontSize: "1.5vw", fontStyle: "italic", color: "#7B5408", lineHeight: 1.5, marginBottom: "2vw" }}>
          Zara opens the app and types &ldquo;Chicago.&rdquo;
        </div>
        <h2 className="font-display" style={{ fontSize: "3.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.2vw" }}>
          She sees every<br />Black-owned business<br /><span style={{ color: "#CA922B" }}>her community trusts.</span>
        </h2>
        <div style={{ width: "4vw", height: "3px", background: "#CA922B", marginBottom: "2.2vw" }} />
        <p className="font-body" style={{ fontSize: "1.15vw", color: "#6B4420", lineHeight: 1.7 }}>
          Not a generic search result. Not a paid placement.<br />
          A living map built by people who live there.
        </p>
      </div>

      {/* Right: feature cards */}
      <div className="absolute flex flex-col justify-center gap-[1vw]" style={{ right: "6vw", top: "10%", bottom: "10%", width: "34vw" }}>
        {features.map((f) => (
          <div key={f.label} style={{ padding: "1.3vw 1.8vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.2)", background: "rgba(202,146,43,0.04)", display: "flex", flexDirection: "column", gap: "0.4vw" }}>
            <div className="font-display" style={{ fontSize: "1.2vw", fontWeight: 700, color: "#E8B86D" }}>{f.label}</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#6B4420", lineHeight: 1.5 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
