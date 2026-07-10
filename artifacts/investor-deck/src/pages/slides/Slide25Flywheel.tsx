const STEPS = [
  { label: "Community", gold: true, fontSize: "2.6vw" },
  { label: "Discovery", gold: false, fontSize: "1.75vw" },
  { label: "Recommendations", gold: false, fontSize: "1.75vw" },
  { label: "Thriving Businesses", gold: true, fontSize: "2.1vw" },
  { label: "Community Grows", gold: false, fontSize: "1.75vw" },
];

const ARC_RADIUS = 27;
const LABEL_RADIUS = 30;
const GAP_DEG = 13;

// per-label fine-tuning: bring each word right to the circle edge
const LABEL_RADIUS_OVERRIDE: Record<string, number> = {
  Community: 28.5,
  Discovery: 25,
  Recommendations: 25,
  "Thriving Businesses": 26,
  "Community Grows": 25,
};

function pointOnCircle(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { x: cx + r * dx, y: cy + r * dy, dx, dy };
}

function anchorFor(dx: number) {
  if (dx > 0.25) return { justify: "flex-start", textAlign: "left" as const };
  if (dx < -0.25) return { justify: "flex-end", textAlign: "right" as const };
  return { justify: "center", textAlign: "center" as const };
}

function describeArc(startAngle: number, endAngle: number, r: number) {
  const s = pointOnCircle(startAngle, r);
  const e = pointOnCircle(endAngle, r);
  return `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`;
}

export default function Slide25Flywheel() {
  const n = STEPS.length;
  const step = 360 / n;

  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 42% 50%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[5vh]">
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE FLYWHEEL
        </div>
        <div className="font-body" style={{ fontSize: "1.1vw", fontStyle: "italic", fontWeight: 500, color: "#D9C4A3", marginTop: "1vh" }}>
          Every interaction makes Kinfolk AI smarter.
        </div>
      </div>

      {/* wheel container — centred on slide, pulled up to leave room for caption */}
      <div className="absolute" style={{ left: "53%", top: "43%", transform: "translate(-50%, -50%)", width: "56vw", height: "56vw" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto-start-reverse">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>

          {/* arcs: each arc runs from gap-end of current node to gap-start of next node */}
          {STEPS.map((_, i) => {
            const arcStart = i * step + GAP_DEG;
            const arcEnd   = (i + 1) * step - GAP_DEG;
            return (
              <path
                key={`arc-${i}`}
                d={describeArc(arcStart, arcEnd, ARC_RADIUS)}
                fill="none"
                stroke="#CA922B"
                strokeWidth="0.7"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {/* labels: each label sits at i * step — exactly the midpoint of its gap */}
        {STEPS.map((s, i) => {
          const angle = i * step;
          const r = LABEL_RADIUS_OVERRIDE[s.label] ?? LABEL_RADIUS;
          const { x, y, dx, dy } = pointOnCircle(angle, r);
          const { justify, textAlign } = anchorFor(dx);
          return (
            <div
              key={s.label}
              className="absolute font-display"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(${-50 + dx * 50}%, ${-50 + dy * 50}%)`,
                fontSize: s.fontSize,
                fontWeight: s.gold ? 700 : 600,
                color: s.gold ? "#CA922B" : "#F5EBD8",
                width: "16vw",
                textAlign,
                lineHeight: 1.25,
              }}
            >
              {s.label}
            </div>
          );
        })}
      </div>

      <div className="absolute left-0 right-0 text-center" style={{ bottom: "4vh" }}>
        <div className="font-display mx-auto" style={{ fontSize: "1.45vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4, maxWidth: "46vw" }}>
          Every recommendation strengthens the community.
          <br />
          Every stronger community creates new opportunities for discovery.
        </div>
      </div>
    </div>
  );
}
