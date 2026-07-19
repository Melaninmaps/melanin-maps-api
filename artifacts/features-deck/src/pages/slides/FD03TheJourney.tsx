export default function FD03TheJourney() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 44%, rgba(202,146,43,0.10) 0%, transparent 68%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center"
        style={{ top: 0, bottom: 0, gap: 0 }}>
        <h2 className="font-display text-center"
          style={{ fontSize: "4.4vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "3vw",
            textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)" }}>
          Every journey begins with a question.
        </h2>

        {/* Dimensional gold divider */}
        <div style={{
          width: "4.5vw", height: "2px",
          background: "linear-gradient(90deg, transparent, #CA922B, transparent)",
          boxShadow: "0 1px 6px rgba(202,146,43,0.30)",
          marginBottom: "3vw"
        }} />

        <p className="font-quote text-center"
          style={{ fontSize: "2.2vw", color: "#A07840", fontStyle: "italic", lineHeight: 1.6, marginBottom: "3vw" }}>
          Ours was simple.
        </p>

        <div style={{
          width: "3.5vw", height: "1px",
          background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)",
          marginBottom: "3vw"
        }} />

        <h3 className="font-display text-center"
          style={{ fontSize: "3.2vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.2,
            marginBottom: "5vw", maxWidth: "64vw",
            textShadow: "0 2px 8px rgba(202,146,43,0.22), 0 1px 3px rgba(0,0,0,0.35)" }}>
          Why should belonging ever be left to chance?
        </h3>

        <div className="flex flex-col items-center" style={{ gap: "0.4vw" }}>
          <div className="font-body"
            style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 700 }}>
            MAPPING WITH MELANIN&trade;
          </div>
          <div className="font-body"
            style={{ fontSize: "0.75vw", color: "#5A3A18", letterSpacing: "0.2em" }}>
            MAP YOUR LIFE. CONNECT DEEPER.
          </div>
        </div>
      </div>
    </div>
  );
}
