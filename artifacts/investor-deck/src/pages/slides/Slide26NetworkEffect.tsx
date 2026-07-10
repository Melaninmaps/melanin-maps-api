const COLS = [
  { input: "Every review", outputPre: "Builds ", gold: "trust", outputPost: "" },
  { input: "Every recommendation", outputPre: "Improves ", gold: "discovery", outputPost: "" },
  { input: "Every saved place", outputPre: "Personalizes future ", gold: "recommendations", outputPost: "" },
  { input: "Every new community", outputPre: "Expands ", gold: "opportunity", outputPost: "" },
];

export default function Slide26NetworkEffect() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>27</div>

      <div className="absolute left-0 right-0 text-center px-[8vw]" style={{ top: "8vh" }}>
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.25 }}>
          Every interaction improves the platform.
        </div>
      </div>

      <div className="absolute left-0 right-0 flex justify-center" style={{ top: "30vh" }}>
        <div className="grid grid-cols-4 gap-[2.4vw]" style={{ width: "80vw" }}>
          {COLS.map((col) => (
            <div key={col.input} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: "3vw", height: "3vw", border: "2px solid rgba(202,146,43,0.7)", marginBottom: "1.6vh" }}
              >
                <div className="font-display" style={{ fontSize: "1.6vw", color: "#CA922B", fontWeight: 700 }}>+</div>
              </div>
              <div className="font-display mb-[1.6vh]" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F5EBD8" }}>
                {col.input}
              </div>
              <div className="font-display mb-[1.6vh]" style={{ fontSize: "1.4vw", color: "#CA922B", opacity: 0.75 }}>
                ↓
              </div>
              <div className="font-body" style={{ fontSize: "1.15vw", fontWeight: 500, color: "#D9C4A3" }}>
                {col.outputPre}<span style={{ color: "#CA922B", fontWeight: 700 }}>{col.gold}</span>{col.outputPost}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "8vh" }}>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.25)", marginBottom: "3vh" }} />
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          Every contribution strengthens the <span style={{ color: "#CA922B" }}>community</span>. Every stronger community makes the platform <span style={{ color: "#CA922B" }}>smarter</span>.
        </div>
      </div>
    </div>
  );
}
