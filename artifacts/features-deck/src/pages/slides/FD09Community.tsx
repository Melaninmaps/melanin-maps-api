/* ─── Act II opens here — first cream page ───────────────────────────────────
   The audience has been in dark brown for 8 pages. Cream now appears quietly.
   No announcement. Just a shift. Something has changed.
   Emotional arc: Isolation → Connection
──────────────────────────────────────────────────────────────────────────── */
const lines = [
  { text: "Community isn\u2019t built through followers.", muted: true },
  { text: "It\u2019s built through shared experiences.", muted: false },
  { text: "Through showing up. Through knowing someone will have your back.", muted: false },
  { text: "Through knowing someone in the room before you walk in.", gold: true },
];

export default function FD09Community() {
  return (
    <div className="relative w-screen h-screen overflow-hidden"
      style={{ background: "#E4D0AD" }}>
      {/* Subtle warm glow — keeps cream from feeling flat */}
      <div className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.10) 0%, transparent 68%)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        {/* Chapter label — dark on cream */}
        <div className="font-body"
          style={{ fontSize: "0.95vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "3.8vw" }}>
          COMMUNITY
        </div>

        <div className="flex flex-col items-center" style={{ gap: "2.2vw", maxWidth: "68vw" }}>
          {lines.map(({ text, muted, gold }, i) => (
            <p key={i} className="font-display text-center"
              style={{
                fontSize: "2.5vw",
                fontWeight: gold ? 700 : 400,
                color: gold ? "#CA922B" : muted ? "#B5906A" : "#2C1510",
                lineHeight: 1.3, margin: 0
              }}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
