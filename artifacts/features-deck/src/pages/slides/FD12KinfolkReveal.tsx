export default function FD12KinfolkReveal() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.12) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>12</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div style={{ marginBottom: "2.4vw" }}>
          <svg viewBox="0 0 64 64" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "4vw", height: "4vw" }}>
            <path d="M32 8c-6 0-14 4-14 14 0 6 4 10 8 13l-2 8h16l-2-8c4-3 8-7 8-13 0-10-8-14-14-14z" />
            <line x1="26" y1="43" x2="38" y2="43" />
          </svg>
        </div>

        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2.6vw" }}>
          KINFOLK AI&trade;
        </div>

        <h2 className="font-display text-center" style={{ fontSize: "5vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.1, marginBottom: "1.4vw" }}>
          Not an assistant.
        </h2>
        <h2 className="font-display text-center" style={{ fontSize: "5vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.1 }}>
          A cultural guide.
        </h2>
      </div>
    </div>
  );
}
