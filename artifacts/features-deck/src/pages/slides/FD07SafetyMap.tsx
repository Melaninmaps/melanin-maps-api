export default function FD07SafetyMap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.10) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>07</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div style={{ marginBottom: "2.4vw" }}>
          <svg viewBox="0 0 64 64" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "4.5vw", height: "4.5vw" }}>
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

        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2.8vw" }}>
          SAFETY MAP
        </div>

        <h2 className="font-display text-center" style={{ fontSize: "4.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, maxWidth: "72vw", marginBottom: "2.8vw" }}>
          Peace of mind begins<br />
          <span style={{ color: "#CA922B" }}>before</span> you leave home.
        </h2>

        <div style={{ width: "4vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      </div>
    </div>
  );
}
