export default function FD06SafetyMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#080402" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 60% 50%, rgba(202,146,43,0.08) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>06</div>

      {/* Left: cinematic stat + copy */}
      <div className="absolute flex flex-col justify-center" style={{ left: "7vw", top: "10%", bottom: "10%", width: "46vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "2vw" }}>SAFETY MAP</div>
        <h2 className="font-display" style={{ fontSize: "4.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.5vw" }}>
          She doesn&rsquo;t want a<br />crime statistic.<br />
          <span style={{ color: "#CA922B" }}>She wants her community&rsquo;s truth.</span>
        </h2>
        <div style={{ width: "4vw", height: "3px", background: "#CA922B", marginBottom: "2.5vw" }} />
        <p className="font-body" style={{ fontSize: "1.2vw", color: "#7B5408", lineHeight: 1.75, marginBottom: "2.5vw" }}>
          The Safety Map overlays real community reports — incident clusters, welcoming zones, neighbor alerts — on top of every neighborhood she&rsquo;s exploring.
        </p>
        <div style={{ padding: "1.4vw 2vw", borderRadius: "0.8vw", border: "1px solid rgba(202,146,43,0.25)", background: "rgba(202,146,43,0.06)" }}>
          <p className="font-quote" style={{ fontSize: "1.45vw", fontStyle: "italic", color: "#C4935A", lineHeight: 1.55 }}>
            &ldquo;Not based on what happened there ten years ago. Based on what happened last Tuesday.&rdquo;
          </p>
        </div>
      </div>

      {/* Right: visual map legend mock */}
      <div className="absolute flex flex-col justify-center gap-[1.4vw]" style={{ right: "7vw", top: "12%", bottom: "12%", width: "28vw" }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#5A3A18", letterSpacing: "0.22em", fontWeight: 600, marginBottom: "0.6vw" }}>MAP LEGEND</div>
        {[
          { color: "#22C55E", label: "Welcoming zone", desc: "High community confidence" },
          { color: "#EAB308", label: "Proceed with awareness", desc: "Mixed community reports" },
          { color: "#EF4444", label: "Recent incidents", desc: "Community-flagged activity" },
          { color: "#CA922B", label: "Business pin", desc: "Black-owned, community-verified" },
          { color: "#60A5FA", label: "Safety check-in point", desc: "Active neighbors nearby" },
        ].map((item) => (
          <div key={item.label} style={{ display: "flex", alignItems: "flex-start", gap: "1vw" }}>
            <div style={{ width: "0.9vw", height: "0.9vw", borderRadius: "50%", background: item.color, flexShrink: 0, marginTop: "0.25vw" }} />
            <div>
              <div className="font-body" style={{ fontSize: "1vw", color: "#A07840", fontWeight: 600 }}>{item.label}</div>
              <div className="font-body" style={{ fontSize: "0.88vw", color: "#4A2C0A" }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
