const LEFT_ITEMS = [
  "Every review",
  "Every recommendation",
  "Every saved business",
  "Every community interaction",
];

const RIGHT_ITEMS = [
  "Recommend businesses people will love",
  "Surface hidden local gems",
  "Understand community preferences",
  "Make every future recommendation smarter",
];

export default function Slide26WhyFlywheelMatters() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ top: "5.1vw" }}>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.2 }}>
          Kinfolk AI powers the Community Flywheel.
        </div>
      </div>

      <div className="absolute left-0 right-0 flex" style={{ top: "12.4vw", bottom: "12.4vw", paddingLeft: "10vw", paddingRight: "10vw", gap: "4vw" }}>

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[1.4vw]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            KINFOLK AI LEARNS FROM
          </div>
          <div className="flex flex-col" style={{ gap: "0.9vw" }}>
            {LEFT_ITEMS.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ fontSize: "1.3vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.4vw", fontWeight: 500, color: "#F5EBD8" }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* divider — ends ~at last bullet */}
        <div className="self-start" style={{ width: "1px", height: "38%", background: "rgba(202,146,43,0.3)", flexShrink: 0, margin: "3.2vh 1vw 0" }} />

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[1.4vw]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            KINFOLK AI USES THAT KNOWLEDGE TO
          </div>
          <div className="flex flex-col" style={{ gap: "0.9vw" }}>
            {RIGHT_ITEMS.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ fontSize: "1.3vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.4vw", fontWeight: 500, color: "#F5EBD8" }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "3.9vw" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "1.7vw" }} />
        <div className="font-display" style={{ fontSize: "1.76vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.7 }}>
          The <span style={{ color: "#CA922B" }}>community</span> teaches <span style={{ color: "#CA922B" }}>Kinfolk AI</span>.<br />
          <span style={{ color: "#CA922B" }}>Kinfolk AI</span> returns the favor.
        </div>
      </div>
    </div>
  );
}
