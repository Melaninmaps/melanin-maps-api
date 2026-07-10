const STEPS = ["Community", "Discovery", "Recommendations", "Business Growth", "Community Grows"];
const NODE_RADIUS = 15;
const LABEL_RADIUS = 23;

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
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 42% 44%, rgba(202,146,43,0.2), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[5vh]">
        <div className="font-body" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE FLYWHEEL
        </div>
      </div>

      <div className="absolute" style={{ left: "50%", top: "48%", transform: "translate(-50%, -50%)", width: "56vw", height: "56vw" }}>
        <div className="absolute rounded-full" style={{ inset: "16%", border: "3px solid rgba(202,146,43,0.55)" }} />

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
                fontSize: "2vw",
                fontWeight: 700,
                color: i % 2 === 0 ? "#FAF6EF" : "#CA922B",
                width: "15vw",
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
                transform: `translate(-50%, -50%) rotate(${midAngle + 90}deg)`,
                width: 0,
                height: 0,
                borderLeft: "0.8vw solid transparent",
                borderRight: "0.8vw solid transparent",
                borderTop: "1.1vw solid #CA922B",
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>

      <div className="absolute" style={{ right: "5vw", top: "16vh", maxWidth: "17vw", borderLeft: "2px solid rgba(202,146,43,0.4)", paddingLeft: "1.2vw" }}>
        <div className="font-body mb-[0.8vh]" style={{ fontSize: "0.9vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
          KINFOLK AI
        </div>
        <div className="font-body" style={{ fontSize: "1vw", fontWeight: 500, color: "#D9C4A3", lineHeight: 1.45, fontStyle: "italic" }}>
          Every interaction makes Kinfolk AI smarter. Every recommendation becomes more valuable.
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "5vh" }}>
        <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.5 }}>
          Every new member strengthens the network. Every recommendation creates another opportunity for discovery.
        </div>
      </div>
    </div>
  );
}
