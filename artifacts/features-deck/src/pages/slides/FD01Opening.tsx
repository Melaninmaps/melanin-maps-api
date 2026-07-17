export default function FD01Opening() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 48% 52%, rgba(202,146,43,0.14) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute top-[4.5vw] left-[6vw] font-body" style={{ fontSize: "1vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 600 }}>
        MAPPING WITH MELANIN&trade;
      </div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "14%", bottom: "12%" }}>
        <div className="font-body" style={{ fontSize: "0.9vw", color: "#A07840", letterSpacing: "0.28em", fontWeight: 600, marginBottom: "3.5vw" }}>
          THE EXPERIENCE DECK
        </div>

        <h1 className="font-display text-center" style={{ fontSize: "5.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.8vw", maxWidth: "76vw" }}>
          Never wonder if you&rsquo;ll feel<br />
          <span style={{ color: "#CA922B" }}>welcome</span> again.
        </h1>

        <div style={{ width: "5vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.8vw" }} />

        <p className="font-body text-center" style={{ fontSize: "1.65vw", color: "#7B5B30", fontWeight: 300, lineHeight: 1.75, maxWidth: "46vw" }}>
          Finding the right place shouldn&rsquo;t require<br />taking unnecessary risks.
        </p>
      </div>

      <div className="absolute bottom-[4vw] left-0 right-0 flex justify-center">
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#3D2008", letterSpacing: "0.2em" }}>
          mappingwithmelanin.com
        </div>
      </div>
    </div>
  );
}
