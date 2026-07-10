const STEPS = ["Community", "Discovery", "Recommendations", "Business Growth", "Community Grows"];
const GOLD_STEPS = new Set(["Community", "Business Growth"]);
const FONT_SIZE: Record<string, string> = {
  Community: "2.6vw",
  "Business Growth": "2.2vw",
  Discovery: "1.75vw",
  Recommendations: "1.75vw",
  "Community Grows": "1.75vw",
};
const NUDGE: Record<string, { x: number; y: number }> = {
  Community: { x: 0, y: 0.5 },
  Discovery: { x: -2.5, y: 1 },
  Recommendations: { x: 0.5, y: 1.4 },
  "Business Growth": { x: -0.5, y: -2.8 },
  "Community Grows": { x: 1.5, y: 1.2 },
};
const LABEL_RADIUS_OVERRIDE: Record<string, number> = {
  Community: 31,
};
const ARC_RADIUS = 27;
const LABEL_RADIUS = 27;
const GAP_DEG = 16;
const ANGLE_OFFSET = 10;

function pointOnCircle(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { x: cx + r * dx, y: cy + r * dy, dx, dy };
}

function anchorFor(dx: number) {
  if (dx > 0.3) return { justify: "flex-start", textAlign: "left" as const };
  if (dx < -0.3) return { justify: "flex-end", textAlign: "right" as const };
  return { justify: "center", textAlign: "center" as const };
}

function describeArc(startAngle: number, endAngle: number, r: number) {
  const start = pointOnCircle(startAngle, r);
  const end = pointOnCircle(endAngle, r);
  const largeArc = 0;
  const sweep = 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`;
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

      <div className="absolute" style={{ left: "53%", top: "48%", transform: "translate(-50%, -50%)", width: "62vw", height: "62vw" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead" markerWidth="3.2" markerHeight="3.2" refX="1.6" refY="1.6" orient="auto-start-reverse">
              <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill="#CA922B" />
            </marker>
          </defs>
          {STEPS.map((_, i) => {
            const startAngle = i * step + GAP_DEG + ANGLE_OFFSET;
            const endAngle = (i + 1) * step - GAP_DEG + ANGLE_OFFSET;
            return (
              <path
                key={`arc-${i}`}
                d={describeArc(startAngle, endAngle, ARC_RADIUS)}
                fill="none"
                stroke="#CA922B"
                strokeWidth="0.8"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {STEPS.map((label, i) => {
          const angle = i * step + ANGLE_OFFSET;
          const r = LABEL_RADIUS_OVERRIDE[label] ?? LABEL_RADIUS;
          const { x, y, dx, dy } = pointOnCircle(angle, r);
          const { justify, textAlign } = anchorFor(dx);
          const gold = GOLD_STEPS.has(label);
          const nudge = NUDGE[label] ?? { x: 0, y: 0 };
          return (
            <div
              key={label}
              className="absolute font-display flex"
              style={{
                left: `calc(${x}% + ${nudge.x}vw)`,
                top: `calc(${y}% + ${nudge.y}vw)`,
                transform: `translate(${-50 + dx * 50}%, ${-50 + dy * 50}%)`,
                fontSize: FONT_SIZE[label] ?? "2vw",
                fontWeight: gold ? 700 : 600,
                color: gold ? "#CA922B" : "#F5EBD8",
                width: "15vw",
                justifyContent: justify,
                textAlign,
              }}
            >
              {label}
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
