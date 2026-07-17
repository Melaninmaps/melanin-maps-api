export default function FD09KinfolkBlack() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#030201" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.07) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.5),transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.2),transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>09</div>

      <div className="flex flex-col items-center text-center">
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#4A2C0A", letterSpacing: "0.35em", fontWeight: 600, marginBottom: "3vw" }}>MEET</div>
        <h1 className="font-display" style={{ fontSize: "9vw", fontWeight: 900, color: "#FAF6EF", lineHeight: 0.95, marginBottom: "3vw", letterSpacing: "-0.02em" }}>
          KinfolkAI<span style={{ color: "#CA922B" }}>&trade;</span>
        </h1>
        <div style={{ width: "8vw", height: "3px", background: "#CA922B", marginBottom: "3vw" }} />
        <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#7B5408", letterSpacing: "0.06em" }}>
          Not an assistant.
        </div>
        <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#CA922B", letterSpacing: "0.06em" }}>
          A cultural guide.
        </div>
      </div>
    </div>
  );
}
