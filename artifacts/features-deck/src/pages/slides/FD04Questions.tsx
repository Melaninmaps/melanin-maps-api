const questions = [
  { q: "\u201cWill I feel comfortable here?\u201d" },
  { q: "\u201cCan I trust what I\u2019m reading?\u201d" },
  { q: "\u201cWhere are my people?\u201d" },
];

function LocationPin() {
  return (
    /* Location pin icon — increased from 1.6vw to 2.2vw */
    <svg viewBox="0 0 32 32" fill="none" stroke="#CA922B" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ width: "2.2vw", height: "2.2vw", flexShrink: 0 }}>
      <path d="M16 2C11.029 2 7 6.029 7 11c0 7 9 19 9 19s9-12 9-19c0-4.971-4.029-9-9-9z" />
      <circle cx="16" cy="11" r="3" />
    </svg>
  );
}

export default function FD04Questions() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2E1609 0%, #1C0E06 48%, #120A04 100%)" }}>
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.09) 0%, transparent 68%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px",
        background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        {/* Chapter heading — increased from 0.85vw to 0.95vw */}
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "4.5vw" }}>
          THE QUESTIONS WE ALL ASK
        </div>

        <div className="flex flex-col" style={{ gap: "2.8vw", maxWidth: "66vw", width: "100%" }}>
          {questions.map(({ q }, i) => (
            <div key={i} className="flex items-center" style={{ gap: "2vw" }}>
              <LocationPin />
              <p className="font-quote"
                style={{
                  fontSize: "2.7vw",
                  color: i === 2 ? "#CA922B" : "#FAF6EF",
                  fontStyle: "italic", fontWeight: 500, lineHeight: 1.3, margin: 0
                }}>
                {q}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
