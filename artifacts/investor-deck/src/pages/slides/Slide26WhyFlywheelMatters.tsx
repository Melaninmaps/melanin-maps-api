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
  "Improve every future recommendation",
];

export default function Slide26WhyFlywheelMatters() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ top: "9vh" }}>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.2 }}>
          Kinfolk AI powers the Community Flywheel.
        </div>
      </div>

      <div className="absolute left-0 right-0 flex" style={{ top: "28vh", bottom: "22vh", paddingLeft: "10vw", paddingRight: "10vw", gap: "4vw" }}>

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[2.4vh]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            KINFOLK AI LEARNS FROM
          </div>
          <div className="flex flex-col" style={{ gap: "1.6vh" }}>
            {LEFT_ITEMS.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ fontSize: "1.3vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.4vw", fontWeight: 500, color: "#F5EBD8" }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

        {/* divider — 50% height, vertically centred */}
        <div className="self-center" style={{ width: "1px", height: "50%", background: "rgba(202,146,43,0.3)", flexShrink: 0, margin: "0 1vw" }} />

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[2.4vh]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            IT USES THAT KNOWLEDGE TO
          </div>
          <div className="flex flex-col" style={{ gap: "1.6vh" }}>
            {RIGHT_ITEMS.map((item) => (
              <div key={item} className="flex items-center" style={{ gap: "1vw" }}>
                <div style={{ fontSize: "1.3vw", color: "#CA922B", fontWeight: 700, flexShrink: 0 }}>✓</div>
                <div className="font-body" style={{ fontSize: "1.4vw", fontWeight: 500, color: "#F5EBD8" }}>{item}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "7vh" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.3)", marginBottom: "3vh" }} />
        <div className="font-display" style={{ fontSize: "1.76vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.7 }}>
          The <span style={{ color: "#CA922B" }}>community</span> teaches <span style={{ color: "#CA922B" }}>Kinfolk AI</span>.<br />
          <span style={{ color: "#CA922B" }}>Kinfolk AI</span> returns the favor.
        </div>
      </div>
    </div>
  );
}
