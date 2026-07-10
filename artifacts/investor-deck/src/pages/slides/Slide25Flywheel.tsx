const STEPS = ["Community", "Discovery", "Recommendations", "Business Growth", "More Community"];
const NODE_RADIUS = 15;
const LABEL_RADIUS = 24;

function pointOnCircle(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = -Math.cos(rad);
  return { x: 50 + r * dx, y: 50 + r * dy, dx, dy };
}

function anchorFor(dx: number) {
  if (dx > 0.3) return { justify: "flex-start", textAlign: "left" as const };
  if (dx < -0.3) return { justify: "flex-end", textAlign: "right" as const };
  return { justify: "center", textAlign: "center" as const };
}

export default function Slide25Flywheel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 38% 50%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[7vh]">
        <div className="font-body mb-[1vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE FLYWHEEL
        </div>
      </div>

      <div className="relative" style={{ width: "44vw", height: "44vw", marginLeft: "3vw", flexShrink: 0 }}>
        <div className="absolute rounded-full" style={{ inset: "18%", border: "1px dashed rgba(202,146,43,0.4)" }} />

        {STEPS.map((step, i) => {
          const angle = (i / STEPS.length) * 360;
          const { x, y, dx, dy } = pointOnCircle(angle, LABEL_RADIUS);
          const { justify, textAlign } = anchorFor(dx);
          return (
            <div
              key={step}
              className="absolute font-display flex"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(${-50 + dx * 50}%, ${-50 + dy * 50}%)`,
                fontSize: "1.5vw",
                fontWeight: 700,
                color: i % 2 === 0 ? "#FAF6EF" : "#CA922B",
                width: "13vw",
                justifyContent: justify,
                textAlign,
              }}
            >
              {step}
            </div>
          );
        })}

        {STEPS.map((_, i) => {
          const midAngle = (i / STEPS.length) * 360 + 360 / STEPS.length / 2;
          const { x, y } = pointOnCircle(midAngle, NODE_RADIUS);
          return (
            <div
              key={`arrow-${i}`}
              className="absolute"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${midAngle}deg)`,
                color: "#CA922B",
                fontSize: "1.3vw",
                opacity: 0.6,
                lineHeight: 1,
              }}
            >
              &#8595;
            </div>
          );
        })}
      </div>

      <div className="absolute" style={{ right: "6vw", top: "50%", transform: "translateY(-50%)", maxWidth: "20vw", borderLeft: "2px solid rgba(202,146,43,0.4)", paddingLeft: "1.6vw" }}>
        <div className="font-body mb-[1vh]" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
          KINFOLK AI
        </div>
        <div className="font-display" style={{ fontSize: "1.4vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          Kinfolk AI learns from every interaction &mdash; making each recommendation smarter than the last.
        </div>
      </div>
    </div>
  );
}
