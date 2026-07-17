const imaginings = [
  "every neighborhood is easier to navigate.",
  "every business has a chance to be discovered.",
  "every newcomer can find community.",
  "every traveler feels like they belong.",
];

export default function FD18Movement() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 46%, rgba(202,146,43,0.10) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>18</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          THE MOVEMENT
        </div>

        <p className="font-quote text-center" style={{ fontSize: "1.9vw", color: "#5A3A18", fontStyle: "italic", marginBottom: "2vw" }}>
          Imagine a world where...
        </p>

        <div className="flex flex-col items-center" style={{ gap: "0.9vw", marginBottom: "2.8vw" }}>
          {imaginings.map((line, i) => (
            <p key={i} className="font-display text-center" style={{ fontSize: "2.1vw", color: "#FAF6EF", fontWeight: 400, lineHeight: 1.3, margin: 0 }}>
              {line}
            </p>
          ))}
        </div>

        <div style={{ width: "4vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.8vw" }} />

        <h2 className="font-display text-center" style={{ fontSize: "2.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.2, maxWidth: "68vw" }}>
          Because belonging should <span style={{ fontStyle: "italic" }}>never</span> depend on luck.
        </h2>
      </div>
    </div>
  );
}
