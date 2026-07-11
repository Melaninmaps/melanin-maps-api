export default function Slide25Flywheel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>

      {/* Background radial glow */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(202,146,43,0.18), transparent 60%)" }} />

      {/* Page number */}
      <div className="absolute font-display" style={{ bottom: "1.7vw", right: "5vw", fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      {/* Header */}
      <div className="absolute" style={{ left: "6vw", top: "2.8vw" }}>
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE COMMUNITY FLYWHEEL
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", fontStyle: "italic", fontWeight: 500, color: "#D9C4A3", marginTop: "0.56vw" }}>
          Every interaction makes Kinfolk AI smarter.
        </div>
      </div>

      {/*
        SVG arcs only.
        Position: left=26vw, top=3.125vw, size=50vw×50vw.
        Derived: circle center = 51vw from left, 50vh from top.
        For any 16:9 viewport: top = 50vh − 25vw = 3.125vw. No CSS transform needed — avoids pre-transform clipping in PDF.
      */}
      <div className="absolute" style={{ left: "26vw", top: "3.125vw", width: "50vw", height: "50vw" }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <marker id="ah25" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>

          {/* Arc 0: People → Discovery */}
          <path d="M 65.21 17.37 A 36 36 0 0 1 85.95 48.12"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah25)" />

          {/* Arc 1: Discovery → Recommendations */}
          <path d="M 85.73 54.39 A 36 36 0 0 1 62.90 83.61"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah25)" />

          {/* Arc 2: Recommendations → Thriving Businesses */}
          <path d="M 56.87 85.34 A 36 36 0 0 1 22.02 72.66"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah25)" />

          {/* Arc 3: Thriving Businesses → Community Grows */}
          <path d="M 18.51 67.45 A 36 36 0 0 1 19.81 30.39"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah25)" />

          {/* Arc 4: Community Grows → People */}
          <path d="M 23.67 25.45 A 36 36 0 0 1 59.32 15.23"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah25)" />
        </svg>
      </div>

      {/*
        Labels — absolutely positioned on the ROOT div in pre-computed vw units.
        All transforms are absorbed into the left/top values so no CSS transform is needed.
        All positions verified to stay within the 0–100vw × 0–56.25vw slide bounds.
      */}

      {/* People — top right, flows right from circle */}
      <div className="absolute font-display" style={{ left: "56.74vw", top: "9.47vw", fontSize: "1.75vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.25 }}>
        People
      </div>

      {/* Discovery — right side, gold */}
      <div className="absolute font-display" style={{ left: "67.99vw", top: "27.66vw", fontSize: "1.75vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25 }}>
        Discovery
      </div>

      {/* Recommendations — bottom right */}
      <div className="absolute font-display" style={{ left: "55.26vw", top: "44.95vw", fontSize: "1.6vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.25 }}>
        Recommendations
      </div>

      {/* Thriving Businesses — bottom left, right-aligned so text flows left from circle */}
      <div className="absolute font-display" style={{ left: "17vw", top: "36.91vw", width: "20vw", textAlign: "right", whiteSpace: "nowrap", fontSize: "1.55vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.25 }}>
        Thriving Businesses
      </div>

      {/* Community Grows — upper left, gold, right-aligned */}
      <div className="absolute font-display" style={{ left: "22.235vw", top: "15.53vw", width: "16vw", textAlign: "right", fontSize: "1.75vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25 }}>
        Community Grows
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 text-center" style={{ bottom: "2vw" }}>
        <div className="font-display mx-auto" style={{ fontSize: "1.3vw", fontWeight: 600, color: "#D9C4A3", lineHeight: 1.4, maxWidth: "50vw" }}>
          Every recommendation strengthens the community.
          Every stronger community creates new opportunities for discovery.
        </div>
      </div>

    </div>
  );
}
