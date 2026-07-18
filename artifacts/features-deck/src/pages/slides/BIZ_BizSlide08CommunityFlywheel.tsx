export default function BizSlide08CommunityFlywheel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 50%, rgba(202,146,43,0.18), transparent 60%)" }} />

      {/* Header */}
      <div className="absolute" style={{ left: "6vw", top: "2.8vw" }}>
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE COMMUNITY FLYWHEEL
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", fontStyle: "italic", fontWeight: 500, color: "#D9C4A3", marginTop: "0.56vw" }}>
          Every customer you earn strengthens the network that sends you the next one.
        </div>
      </div>

      {/*
        SVG arcs — same geometry as Slide25Flywheel.
        Position: left=26vw, top=3.125vw, size=50vw×50vw.
      */}
      <div className="absolute" style={{ left: "26vw", top: "3.125vw", width: "50vw", height: "50vw" }}>
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <marker id="ah-biz8" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>

          {/* Arc 0: Businesses → Community Discovery */}
          <path d="M 65.21 17.37 A 36 36 0 0 1 85.95 48.12"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah-biz8)" />

          {/* Arc 1: Community Discovery → Recommendations */}
          <path d="M 85.73 54.39 A 36 36 0 0 1 62.90 83.61"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah-biz8)" />

          {/* Arc 2: Recommendations → New Customers */}
          <path d="M 56.87 85.34 A 36 36 0 0 1 22.02 72.66"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah-biz8)" />

          {/* Arc 3: New Customers → Reviews */}
          <path d="M 18.51 67.45 A 36 36 0 0 1 19.81 30.39"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah-biz8)" />

          {/* Arc 4: Reviews → Trust → Businesses */}
          <path d="M 23.67 25.45 A 36 36 0 0 1 59.32 15.23"
            fill="none" stroke="#CA922B" strokeWidth="0.5" strokeLinecap="round" markerEnd="url(#ah-biz8)" />
        </svg>
      </div>

      {/* Labels — pre-computed vw positions matching arc endpoints */}

      {/* Businesses — top right */}
      <div className="absolute font-display" style={{ left: "56.74vw", top: "9.47vw", fontSize: "1.75vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25 }}>
        Businesses
      </div>

      {/* Community Discovery — right side */}
      <div className="absolute font-display" style={{ left: "67.2vw", top: "26.4vw", fontSize: "1.55vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.2 }}>
        Community<br />Discovery
      </div>

      {/* Recommendations — bottom right */}
      <div className="absolute font-display" style={{ left: "55.26vw", top: "44.95vw", fontSize: "1.6vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.25 }}>
        Recommendations
      </div>

      {/* New Customers — bottom left, right-aligned */}
      <div className="absolute font-display" style={{ left: "17vw", top: "36.91vw", width: "20vw", textAlign: "right", whiteSpace: "nowrap", fontSize: "1.55vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.25 }}>
        New Customers
      </div>

      {/* Reviews &amp; Trust — upper left, right-aligned */}
      <div className="absolute font-display" style={{ left: "20vw", top: "15.53vw", width: "18vw", textAlign: "right", fontSize: "1.55vw", fontWeight: 600, color: "#F5EBD8", lineHeight: 1.25 }}>
        Reviews<br />&amp; Trust
      </div>

      {/* Footer */}
      <div className="absolute left-0 right-0 text-center" style={{ bottom: "2vw" }}>
        <div className="font-display mx-auto" style={{ fontSize: "1.3vw", fontWeight: 600, color: "#D9C4A3", lineHeight: 1.4, maxWidth: "50vw" }}>
          The more businesses that show up, the stronger the community signal.
          The stronger the signal, the more customers find you.
        </div>
      </div>
    </div>
  );
}
