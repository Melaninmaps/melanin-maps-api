export default function FD03TheJourney() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 44%, rgba(202,146,43,0.11) 0%, transparent 68%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>03</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0, gap: 0 }}>
        <h2 className="font-display text-center" style={{ fontSize: "4.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "2.4vw" }}>
          Every journey begins with a question.
        </h2>

        <div style={{ width: "3.5vw", height: "1px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.4vw" }} />

        <p className="font-quote text-center" style={{ fontSize: "2.2vw", color: "#A07840", fontStyle: "italic", lineHeight: 1.6, marginBottom: "2.4vw" }}>
          Ours was simple.
        </p>

        <div style={{ width: "3.5vw", height: "1px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)", marginBottom: "2.4vw" }} />

        <h3 className="font-display text-center" style={{ fontSize: "3.2vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.2, marginBottom: "4.5vw", maxWidth: "64vw" }}>
          Why should belonging ever be left to chance?
        </h3>

        <div className="flex flex-col items-center" style={{ gap: "0.4vw" }}>
          <div className="font-body" style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700 }}>
            MAPPING WITH MELANIN&trade;
          </div>
          <div className="font-body" style={{ fontSize: "0.75vw", color: "#5A3A18", letterSpacing: "0.2em" }}>
            MAP YOUR LIFE. CONNECT DEEPER.
          </div>
        </div>
      </div>
    </div>
  );
}
