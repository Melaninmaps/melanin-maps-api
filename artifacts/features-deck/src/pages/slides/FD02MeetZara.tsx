export default function FD02MeetZara() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.10) 0%, transparent 70%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>02</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div style={{ marginBottom: "1.2vw" }}>
          <svg width="3.2vw" height="3.2vw" viewBox="0 0 48 48" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: "3.2vw", height: "3.2vw" }}>
            <circle cx="24" cy="18" r="8" />
            <path d="M8 42c0-8.837 7.163-16 16-16s16 7.163 16 16" />
          </svg>
        </div>
        <h2 className="font-display text-center" style={{ fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.4vw" }}>
          This could be anyone.
        </h2>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "2.4vw", opacity: 0.7 }} />
        <p className="font-quote text-center" style={{ fontSize: "2.1vw", color: "#A07840", fontStyle: "italic", fontWeight: 400, lineHeight: 1.65 }}>
          Maybe it&rsquo;s Zara. Maybe it&rsquo;s you.
        </p>
      </div>
    </div>
  );
}
