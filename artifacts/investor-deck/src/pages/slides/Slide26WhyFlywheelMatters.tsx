const ITEMS = ["Every review", "Every recommendation", "Every saved business", "Every community interaction"];

export default function Slide26WhyFlywheelMatters() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 35%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>26</div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ top: "16vh" }}>
        <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.25 }}>
          Why the flywheel matters
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center" style={{ top: "36vh" }}>
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#CA922B", marginBottom: "3vh" }}>
          Kinfolk AI learns from
        </div>
        <div className="flex flex-col items-center" style={{ gap: "2vh" }}>
          {ITEMS.map((item) => (
            <div key={item} className="font-body" style={{ fontSize: "1.5vw", fontWeight: 500, color: "#F5EBD8" }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center px-[12vw]" style={{ bottom: "10vh" }}>
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          Instead of competing with the flywheel, Kinfolk AI supports it.
        </div>
      </div>
    </div>
  );
}
