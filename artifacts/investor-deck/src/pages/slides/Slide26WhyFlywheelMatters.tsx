const LEFT_ITEMS = [
  "Review",
  "Recommendation",
  "Saved business",
  "Community interaction",
];

const RIGHT_ITEMS = [
  "Recommend better businesses",
  "Surface hidden gems",
  "Understand community preferences",
  "Improve every future search",
];

export default function Slide26WhyFlywheelMatters() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ top: "9vh" }}>
        <div className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.2 }}>
          Kinfolk AI powers the flywheel.
        </div>
      </div>

      <div className="absolute left-0 right-0 flex" style={{ top: "28vh", bottom: "20vh", paddingLeft: "10vw", paddingRight: "10vw", gap: "4vw" }}>

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[2.4vh]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            KINFOLK AI GETS SMARTER WITH EVERY
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

        <div style={{ width: "1px", background: "rgba(202,146,43,0.3)", flexShrink: 0, margin: "0 1vw" }} />

        <div className="flex-1 flex flex-col">
          <div className="font-body mb-[2.4vh]" style={{ fontSize: "1.15vw", color: "#CA922B", letterSpacing: "0.1em", fontWeight: 600 }}>
            WHICH HELPS IT
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
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          The community teaches Kinfolk AI. Kinfolk AI returns the favor.
        </div>
      </div>
    </div>
  );
}
