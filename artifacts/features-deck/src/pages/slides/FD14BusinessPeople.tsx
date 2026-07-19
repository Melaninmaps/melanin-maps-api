export default function FD14BusinessPeople() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      {/* Warmer center glow */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.12) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        {/* Business icon — increased from 3.6vw to 4.3vw */}
        <div style={{ marginBottom: "2.6vw" }}>
          <svg viewBox="0 0 64 64" fill="none" stroke="#CA922B" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ width: "4.3vw", height: "4.3vw",
              filter: "drop-shadow(0 2px 8px rgba(202,146,43,0.22))" }}>
            <rect x="8" y="28" width="48" height="28" rx="3" />
            <path d="M22 28V20a10 10 0 0 1 20 0v8" />
            <circle cx="32" cy="42" r="4" />
          </svg>
        </div>

        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          FOR BUSINESS OWNERS
        </div>

        <h2 className="font-display text-center"
          style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15,
            marginBottom: "2.6vw", maxWidth: "72vw",
            textShadow: "0 2px 8px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)" }}>
          People connect with{" "}
          <span style={{ color: "#CA922B", textShadow: "0 2px 8px rgba(202,146,43,0.22), 0 1px 3px rgba(0,0,0,0.35)" }}>
            people
          </span><br />
          before they connect with products.
        </h2>

        <div style={{ width: "4vw", height: "2px",
          background: "linear-gradient(90deg,transparent,#CA922B,transparent)",
          boxShadow: "0 1px 6px rgba(202,146,43,0.20)", marginBottom: "2.6vw" }} />

        <p className="font-quote text-center"
          style={{ fontSize: "1.9vw", color: "#A07840", fontStyle: "italic", lineHeight: 1.65 }}>
          For the first time, your story is as discoverable<br />as your business.
        </p>
      </div>
    </div>
  );
}
