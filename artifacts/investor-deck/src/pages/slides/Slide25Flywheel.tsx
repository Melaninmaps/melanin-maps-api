type Step = {
  label: string;
  angle: number;
  gold: boolean;
  fontSize: string;
  align: "center" | "left" | "right";
};

const STEPS: Step[] = [
  { label: "Community", angle: 0, gold: true, fontSize: "2.6vw", align: "center" },
  { label: "Discovery", angle: 90, gold: false, fontSize: "1.75vw", align: "left" },
  { label: "Recommendations", angle: 150, gold: false, fontSize: "1.75vw", align: "left" },
  { label: "Thriving Businesses", angle: 210, gold: true, fontSize: "2.1vw", align: "right" },
  { label: "Community Grows", angle: 300, gold: false, fontSize: "1.75vw", align: "right" },
];

const ARC_RADIUS = 27;
const LABEL_RADIUS = 36;
const GAP_DEG = 14;

function pointOnCircle(angleDeg: number, r: number, cx = 50, cy = 50) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { x: cx + r * dx, y: cy + r * dy, dx, dy };
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

      <div className="absolute" style={{ left: "53%", top: "44%", transform: "translate(-50%, -50%)", width: "52vw", height: "52vw" }}>
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          <defs>
            <marker id="arrowhead" markerWidth="3" markerHeight="3" refX="1.5" refY="1.5" orient="auto-start-reverse">
              <path d="M0,0 L3,1.5 L0,3 Z" fill="#CA922B" />
            </marker>
          </defs>
          {STEPS.map((s, i) => {
            const startAngle = i * step + GAP_DEG;
            const endAngle = (i + 1) * step - GAP_DEG;
            return (
              <path
                key={`arc-${i}`}
                d={describeArc(startAngle, endAngle, ARC_RADIUS)}
                fill="none"
                stroke="#CA922B"
                strokeWidth="0.7"
                strokeLinecap="round"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
        </svg>

        {STEPS.map((s) => {
          const { x, y } = pointOnCircle(s.angle, LABEL_RADIUS);
          const justify = s.align === "left" ? "flex-start" : s.align === "right" ? "flex-end" : "center";
          return (
            <div
              key={s.label}
              className="absolute font-display flex"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: "translate(-50%, -50%)",
                fontSize: s.fontSize,
                fontWeight: s.gold ? 700 : 600,
                color: s.gold ? "#CA922B" : "#F5EBD8",
                width: "16vw",
                justifyContent: justify,
                textAlign: s.align,
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
