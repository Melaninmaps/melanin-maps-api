const STEPS = ["Community", "Discovery", "Recommendations", "Business Growth", "More Community"];

export default function Slide25Flywheel() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 40% 45%, rgba(202,146,43,0.18), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>25</div>

      <div className="absolute left-[6vw] top-[7vh]">
        <div className="font-body mb-[1vh]" style={{ fontSize: "1.4vw", color: "#CA922B", letterSpacing: "0.16em", fontWeight: 500 }}>
          THE FLYWHEEL
        </div>
      </div>

      <div className="flex flex-col items-center" style={{ marginLeft: "12vw", flex: "0 0 auto" }}>
        {STEPS.map((step, i) => (
          <div key={step} className="flex flex-col items-center">
            <div className="font-display" style={{ fontSize: "2.7vw", fontWeight: 700, color: i % 2 === 0 ? "#FAF6EF" : "#CA922B" }}>{step}</div>
            <div style={{ color: "#CA922B", fontSize: "1.4vw", fontWeight: 400, lineHeight: 1, opacity: 0.6, margin: "0.5vh 0" }}>
              {i < STEPS.length - 1 ? "\u2193" : "\u21ba"}
            </div>
          </div>
        ))}
      </div>

      <div className="absolute" style={{ right: "6vw", top: "50%", transform: "translateY(-50%)", maxWidth: "22vw", borderLeft: "2px solid rgba(202,146,43,0.4)", paddingLeft: "1.6vw" }}>
        <div className="font-body mb-[1vh]" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
          KINFOLK AI
        </div>
        <div className="font-display" style={{ fontSize: "1.5vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          Kinfolk AI learns from every interaction &mdash; making each recommendation smarter than the last.
        </div>
      </div>
    </div>
  );
}
