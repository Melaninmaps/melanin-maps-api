export default function SlideInv40Ask() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 50%, rgba(202,146,43,0.18), transparent 60%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>40</div>

      {/* Header */}
      <div className="absolute left-[6vw] top-[3.5vw]">
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 600 }}>THE ASK</div>
        <div className="font-display" style={{ fontSize: "4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1, marginTop: "0.5vw" }}>
          Seeking <span style={{ color: "#CA922B" }}>$750K</span><br />Seed Investment.
        </div>
      </div>

      {/* Divider */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "18vw", height: "1px", background: "rgba(202,146,43,0.3)" }} />

      {/* Left — Use of funds */}
      <div className="absolute" style={{ left: "6vw", top: "20vw", width: "40vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.4vw" }}>USE OF FUNDS</div>

        <div style={{ marginBottom: "1.1vw", display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#CA922B" }}>35%</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>Product Development</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40" }}>Complete core features, mobile polish, web platform</div>
          </div>
        </div>

        <div style={{ marginBottom: "1.1vw", display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#CA922B" }}>25%</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>Engineering Team</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40" }}>Expand core engineering capacity and AI development</div>
          </div>
        </div>

        <div style={{ marginBottom: "1.1vw", display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#CA922B" }}>20%</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>City Launch Operations</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40" }}>Philadelphia full launch + Baltimore / DC preparation</div>
          </div>
        </div>

        <div style={{ marginBottom: "1.1vw", display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#CA922B" }}>15%</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>User Acquisition</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40" }}>Community growth, ambassador program, founding members</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.2vw" }}>
          <div style={{ width: "3.5vw", height: "3.5vw", borderRadius: "50%", background: "rgba(202,146,43,0.2)", border: "2px solid #CA922B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <div className="font-display" style={{ fontSize: "1.1vw", fontWeight: 800, color: "#CA922B" }}>5%</div>
          </div>
          <div>
            <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#FAF6EF" }}>Partnerships &amp; BD</div>
            <div className="font-body" style={{ fontSize: "1vw", color: "#A87A40" }}>Tourism boards, employers, city relationships</div>
          </div>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="absolute" style={{ left: "50vw", top: "20vw", bottom: "5.5vw", width: "1px", background: "rgba(202,146,43,0.25)" }} />

      {/* Right — Milestones */}
      <div className="absolute" style={{ left: "53vw", top: "20vw", right: "6vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.14em", fontWeight: 600, marginBottom: "1.4vw" }}>18-MONTH MILESTONES</div>

        <div style={{ marginBottom: "1.6vw", paddingLeft: "1.2vw", borderLeft: "3px solid #CA922B" }}>
          <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.08em" }}>Q3 2026</div>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginTop: "0.2vw" }}>Philadelphia Full Launch</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40" }}>App live, founding community active, first revenue</div>
        </div>

        <div style={{ marginBottom: "1.6vw", paddingLeft: "1.2vw", borderLeft: "3px solid rgba(202,146,43,0.6)" }}>
          <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.08em" }}>Q4 2026</div>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginTop: "0.2vw" }}>10,000 Active Users</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40" }}>Subscription revenue established, B2B pipeline open</div>
        </div>

        <div style={{ marginBottom: "1.6vw", paddingLeft: "1.2vw", borderLeft: "3px solid rgba(202,146,43,0.4)" }}>
          <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.08em" }}>Q1 2027</div>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginTop: "0.2vw" }}>Baltimore &amp; DC Launch</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40" }}>Regional expansion — flywheel compounds across cities</div>
        </div>

        <div style={{ marginBottom: "1.6vw", paddingLeft: "1.2vw", borderLeft: "3px solid rgba(202,146,43,0.25)" }}>
          <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.08em" }}>Q2 2027</div>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginTop: "0.2vw" }}>25,000 Users Across 3 Cities</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40" }}>Network effects measurable, partner revenue live</div>
        </div>

        <div style={{ paddingLeft: "1.2vw", borderLeft: "3px solid rgba(202,146,43,0.15)" }}>
          <div className="font-body" style={{ fontSize: "1vw", color: "#CA922B", fontWeight: 600, letterSpacing: "0.08em" }}>Q3 2027</div>
          <div className="font-display" style={{ fontSize: "1.35vw", fontWeight: 700, color: "#FAF6EF", marginTop: "0.2vw" }}>Series A Readiness</div>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#A87A40" }}>Proven model, clear unit economics, national expansion plan</div>
        </div>
      </div>
    </div>
  );
}
