const STEPS = [
  { label: "People",              gold: true,  fontSize: "2.5vw" },
  { label: "Discovery",           gold: false, fontSize: "1.75vw" },
  { label: "Recommendations",     gold: false, fontSize: "1.6vw" },
  { label: "Thriving Businesses", gold: true,  fontSize: "1.85vw" },
  { label: "Community Grows",     gold: false, fontSize: "1.75vw" },
];

const ARC_RADIUS = 30;
const GAP_DEG    = 5;
const OFFSET_DEG = 20;

const LABEL_RADIUS_OVERRIDE: Record<string, number> = {
  People:                26,
  Discovery:             27,
  Recommendations:       27,
  "Thriving Businesses": 27,
  "Community Grows":     27,
};

function pointOnCircle(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx  = Math.sin(rad);
  const dy  = -Math.cos(rad);
  return { x: cx + r * dx, y: cy + r * dy, dx, dy };
}

function anchorFor(dx: number) {
  if (dx >  0.25) return { textAlign: "left"   as const };
  if (dx < -0.25) return { textAlign: "right"  as const };
  return              { textAlign: "center" as const };
}

function describeArc(startAngle: number, endAngle: number, r: number) {
  const s    = pointOnCircle(startAngle, r);
  const e    = pointOnCircle(endAngle,   r);
  const span = ((endAngle - startAngle) + 360) % 360;
  const largeArc = span > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 1 ${e.x} ${e.y}`;
}

export default function Slide25Flywheel() {
  const n    = STEPS.length;
  const step = 360 / n;

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

      <div
        className="absolute"
        style={{
          left: "51%", top: "44%",
          transform: "translate(-50%, -50%)",
          width: "50vw", height: "50vw",
          overflow: "visible",
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead25" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>

          {STEPS.map((_, i) => {
            const arcStart = OFFSET_DEG + i * step + GAP_DEG;
            const arcEnd   = OFFSET_DEG + (i + 1) * step - GAP_DEG;
            return (
              <path
                key={`arc-${i}`}
                d={describeArc(arcStart, arcEnd, ARC_RADIUS)}
                fill="none"
                stroke="#CA922B"
                strokeWidth="0.7"
                strokeLinecap="round"
                markerEnd="url(#arrowhead25)"
              />
            );
          })}
        </svg>

        {STEPS.map((s, i) => {
          const angle = OFFSET_DEG + i * step;
          const r     = LABEL_RADIUS_OVERRIDE[s.label] ?? 27;
          const { x, y, dx, dy } = pointOnCircle(angle, r);
          const { textAlign }    = anchorFor(dx);
          return (
            <div
              key={s.label}
              className="absolute font-display"
              style={{
                left:       `${x}%`,
                top:        `${y}%`,
                transform:  `translate(${-50 + dx * 50}%, ${-50 + dy * 50}%)`,
                fontSize:   s.fontSize,
                fontWeight: s.gold ? 700 : 600,
                color:      s.gold ? "#CA922B" : "#F5EBD8",
                width:      "16vw",
                textAlign,
                lineHeight: 1.25,
              }}
            >
              {s.label}
            </div>
          );
        })}
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
