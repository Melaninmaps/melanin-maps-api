const lines = [
  { text: "Community isn\u2019t built through followers.", gold: false },
  { text: "It\u2019s built through shared experiences.", gold: false },
  { text: "Through showing up. Through knowing someone will have your back.", gold: false },
  { text: "Through knowing someone in the room before you walk in.", gold: true },
];

export default function FD09Community() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.09) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>09</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3.2vw" }}>
          COMMUNITY
        </div>

        <div className="flex flex-col items-center" style={{ gap: "1.8vw", maxWidth: "68vw" }}>
          {lines.map(({ text, gold }, i) => (
            <p key={i} className="font-display text-center" style={{ fontSize: "2.4vw", fontWeight: gold ? 700 : 400, color: gold ? "#CA922B" : i === 0 ? "#5A3A18" : "#FAF6EF", lineHeight: 1.3, margin: 0 }}>
              {text}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
