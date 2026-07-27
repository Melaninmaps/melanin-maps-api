export default function FD07SafetyMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      {/* Warmer center glow */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.13) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        {/* Compass icon — increased from 4.5vw to 5.5vw */}
        <div style={{ marginBottom: "2.8vw" }}>
          <svg viewBox="0 0 64 64" fill="none" stroke="#CA922B" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: "5.5vw", height: "5.5vw",
              filter: "drop-shadow(0 2px 8px rgba(202,146,43,0.22))" }}>
            <circle cx="32" cy="32" r="22" />
            <line x1="32" y1="10" x2="32" y2="32" />
            <line x1="32" y1="32" x2="46" y2="22" />
            <circle cx="32" cy="32" r="2.5" fill="#CA922B" stroke="none" />
            <line x1="32" y1="4" x2="32" y2="10" />
            <line x1="32" y1="54" x2="32" y2="60" />
            <line x1="4" y1="32" x2="10" y2="32" />
            <line x1="54" y1="32" x2="60" y2="32" />
          </svg>
        </div>

        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2.8vw" }}>
          SAFETY MAP
        </div>

        <h2 className="font-display text-center"
          style={{ fontSize: "4.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1,
            maxWidth: "72vw", marginBottom: "2.8vw",
            textShadow: "0 2px 10px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)" }}>
          Peace of mind begins<br />
          <span style={{ color: "#CA922B", textShadow: "0 2px 8px rgba(202,146,43,0.22), 0 1px 3px rgba(0,0,0,0.35)" }}>
            before
          </span> you leave home.
        </h2>

        <div style={{ width: "4vw", height: "2px",
          background: "linear-gradient(90deg,transparent,#CA922B,transparent)",
          boxShadow: "0 1px 6px rgba(202,146,43,0.20)" }} />
      </div>
    </div>
  );
}
