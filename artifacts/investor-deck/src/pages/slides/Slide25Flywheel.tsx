const STEPS = ["Community", "Discovery", "Recommendations", "Business Growth", "Stronger Community"];
const GOLD_STEPS = new Set(["Community", "Stronger Community"]);
const FONT_SIZE: Record<string, string> = {
  Community: "2.5vw",
  "Business Growth": "2.15vw",
  Discovery: "1.8vw",
  Recommendations: "1.8vw",
  "Stronger Community": "1.8vw",
};
const LABEL_RADIUS_OVERRIDE: Record<string, number> = {
  "Business Growth": 30,
  "Stronger Community": 23,
};
const ARC_RADIUS = 26;
const LABEL_RADIUS = 26;
const GAP_DEG = 16;

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
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 42% 44%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[5vh]">
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE FLYWHEEL
        </div>
      </div>

      <div className="absolute" style={{ left: "53%", top: "38%", transform: "translate(-50%, -50%)", width: "60vw", height: "60vw" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead" markerWidth="3.2" markerHeight="3.2" refX="1.6" refY="1.6" orient="auto-start-reverse">
              <path d="M0,0 L3.2,1.6 L0,3.2 Z" fill="#CA922B" />
            </marker>
          </defs>
          {STEPS.map((_, i) => {
            const startAngle = i * step + GAP_DEG;
            const endAngle = (i + 1) * step - GAP_DEG;
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
          const angle = i * step;
          const r = LABEL_RADIUS_OVERRIDE[label] ?? LABEL_RADIUS;
          const { x, y, dx, dy } = pointOnCircle(angle, r);
          const { justify, textAlign } = anchorFor(dx);
          const gold = GOLD_STEPS.has(label);
          return (
            <div
              key={label}
              className="absolute font-display flex"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(${-50 + dx * 50}%, ${-50 + dy * 50}%)`,
                fontSize: FONT_SIZE[label] ?? "2vw",
                fontWeight: 700,
                color: gold ? "#CA922B" : "#FAF6EF",
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

      <div className="absolute" style={{ right: "3vw", top: "16vh", maxWidth: "17vw", borderLeft: "2px solid rgba(202,146,43,0.4)", paddingLeft: "1.2vw" }}>
        <div className="font-body mb-[0.8vh]" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
          KINFOLK AI
        </div>
        <div className="font-body" style={{ fontSize: "1vw", fontWeight: 500, color: "#D9C4A3", lineHeight: 1.45, fontStyle: "italic" }}>
          Every interaction makes Kinfolk AI smarter. Every recommendation becomes more valuable.
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center" style={{ bottom: "6vh" }}>
        <div className="font-display mx-auto" style={{ fontSize: "1.7vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.6, maxWidth: "44vw" }}>
          Every recommendation strengthens the community.
          <br />
          Every stronger community creates new opportunities for discovery.
        </div>
      </div>
    </div>
  );
}
