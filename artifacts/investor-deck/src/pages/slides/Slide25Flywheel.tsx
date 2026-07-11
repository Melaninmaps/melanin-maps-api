export default function Slide25Flywheel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(202,146,43,0.18), transparent 60%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[2.8vw]">
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE COMMUNITY FLYWHEEL
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", fontStyle: "italic", fontWeight: 500, color: "#D9C4A3", marginTop: "0.56vw" }}>
          Every interaction makes Kinfolk AI smarter.
        </div>
      </div>

      {/* SVG arcs */}
      <div className="absolute" style={{ left: "51%", top: "50%", transform: "translate(-50%, -50%)", width: "50vw", height: "50vw" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead25" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>

          {/* Arc 0 — People */}
          <path d="M 65.21 17.37 A 36 36 0 0 1 85.95 48.12" fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#arrowhead25)" />
          {/* Arc 1 — Discovery */}
          <path d="M 85.73 54.39 A 36 36 0 0 1 62.90 83.61" fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#arrowhead25)" />
          {/* Arc 2 — Recommendations */}
          <path d="M 56.87 85.34 A 36 36 0 0 1 22.02 72.66" fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#arrowhead25)" />
          {/* Arc 3 — Thriving Businesses */}
          <path d="M 18.51 67.45 A 36 36 0 0 1 19.81 30.39" fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#arrowhead25)" />
          {/* Arc 4 — Community Grows */}
          <path d="M 23.67 25.45 A 36 36 0 0 1 59.32 15.23" fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#arrowhead25)" />
        </svg>

        {/* Label 0 — People */}
        <div
          className="absolute font-display"
          style={{
            left: "67.86%", top: "16.65%",
            transform: "translate(-19.91%, -89.93%)",
            fontSize: "1.75vw", fontWeight: 600, color: "#F5EBD8",
            width: "16vw", whiteSpace: "normal", textAlign: "left", lineHeight: 1.25,
          }}
        >
          People
        </div>

        {/* Label 1 — Discovery */}
        <div
          className="absolute font-display"
          style={{
            left: "83.98%", top: "51.19%",
            transform: "translate(-0.03%, -48.25%)",
            fontSize: "1.75vw", fontWeight: 700, color: "#CA922B",
            width: "16vw", whiteSpace: "normal", textAlign: "left", lineHeight: 1.25,
          }}
        >
          Discovery
        </div>

        {/* Label 2 — Recommendations */}
        <div
          className="absolute font-display"
          style={{
            left: "67.25%", top: "83.86%",
            transform: "translate(-27.30%, -5.45%)",
            fontSize: "1.6vw", fontWeight: 600, color: "#F5EBD8",
            width: "16vw", whiteSpace: "normal", textAlign: "left", lineHeight: 1.25,
          }}
        >
          Recommendations
        </div>

        {/* Label 3 — Thriving Businesses */}
        <div
          className="absolute font-display"
          style={{
            left: "19.14%", top: "68.54%",
            transform: "translate(-92.86%, -24.25%)",
            fontSize: "1.55vw", fontWeight: 600, color: "#F5EBD8",
            width: "20vw", whiteSpace: "nowrap", textAlign: "right", lineHeight: 1.25,
          }}
        >
          Thriving Businesses
        </div>

        {/* Label 4 — Community Grows */}
        <div
          className="absolute font-display"
          style={{
            left: "21.25%", top: "28.34%",
            transform: "translate(-89.93%, -80.09%)",
            fontSize: "1.75vw", fontWeight: 700, color: "#CA922B",
            width: "16vw", whiteSpace: "normal", textAlign: "right", lineHeight: 1.25,
          }}
        >
          Community Grows
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center" style={{ bottom: "2vw" }}>
        <div className="font-display mx-auto" style={{ fontSize: "1.3vw", fontWeight: 600, color: "#D9C4A3", lineHeight: 1.4, maxWidth: "50vw" }}>
          Every recommendation strengthens the community.
          Every stronger community creates new opportunities for discovery.
        </div>
      </div>
    </div>
  );
}
