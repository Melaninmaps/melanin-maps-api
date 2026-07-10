const ROWS = [
  { input: "One new resident", output: "New recommendations" },
  { input: "One new business", output: "More discovery" },
  { input: "One new review", output: "Smarter AI" },
  { input: "One new city", output: "A stronger network" },
];

export default function Slide26NetworkEffect() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#3D2417" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(202,146,43,0.16), transparent 55%)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.35 }}>27</div>

      <div className="absolute left-0 right-0 text-center px-[8vw]" style={{ top: "8vh" }}>
        <div className="font-display" style={{ fontSize: "2.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.25 }}>
          The bigger our community becomes,
          <br />
          the smarter the platform gets.
        </div>
      </div>

      <div className="absolute left-0 right-0 flex justify-center" style={{ top: "26vh" }}>
        <div className="grid grid-cols-4 gap-[2.4vw]" style={{ width: "80vw" }}>
          {ROWS.map((row) => (
            <div key={row.input} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: "3vw", height: "3vw", border: "2px solid rgba(202,146,43,0.7)", marginBottom: "1.6vh" }}
              >
                <div className="font-display" style={{ fontSize: "1.6vw", color: "#CA922B", fontWeight: 700 }}>+</div>
              </div>
              <div className="font-display mb-[1.6vh]" style={{ fontSize: "1.25vw", fontWeight: 700, color: "#F5EBD8" }}>
                {row.input}
              </div>
              <div className="font-display mb-[1.6vh]" style={{ fontSize: "1.4vw", color: "#CA922B", opacity: 0.75 }}>
                ↓
              </div>
              <div className="font-body" style={{ fontSize: "1.15vw", fontWeight: 500, color: "#D9C4A3" }}>
                {row.output}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-0 right-0 text-center px-[10vw]" style={{ bottom: "8vh" }}>
        <div className="font-display" style={{ fontSize: "1.6vw", fontWeight: 700, color: "#F5EBD8", lineHeight: 1.4 }}>
          Every person who joins makes the platform better for the next person.
        </div>
      </div>
    </div>
  );
}
