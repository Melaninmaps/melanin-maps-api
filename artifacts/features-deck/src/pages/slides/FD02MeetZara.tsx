export default function FD02MeetZara() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.10) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div style={{ marginBottom: "1.8vw" }}>
          {/* Person icon — increased ~20% from 3.2vw */}
          <svg viewBox="0 0 48 48" fill="none" stroke="#CA922B" strokeWidth="1.8"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: "3.8vw", height: "3.8vw" }}>
            <circle cx="24" cy="18" r="8" />
            <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" />
          </svg>
        </div>

        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.28em", fontWeight: 600, marginBottom: "1.4vw" }}>
          THIS COULD BE ANYONE
        </div>

        <h2 className="font-display text-center"
          style={{
            fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.4vw",
            textShadow: "0 2px 10px rgba(0,0,0,0.45), 0 1px 3px rgba(0,0,0,0.3)"
          }}>
          This could be anyone.
        </h2>

        <div style={{ width: "4vw", height: "2px",
          background: "#CA922B", marginBottom: "2.4vw", opacity: 0.7 }} />

        <p className="font-quote text-center"
          style={{ fontSize: "2.1vw", color: "#A07840", fontStyle: "italic", fontWeight: 400, lineHeight: 1.65 }}>
          Maybe it&rsquo;s Zara. Maybe it&rsquo;s you.
        </p>
      </div>
    </div>
  );
}
