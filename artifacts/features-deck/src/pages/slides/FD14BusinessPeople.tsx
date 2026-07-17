export default function FD14BusinessPeople() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 48%, rgba(202,146,43,0.10) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>14</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div style={{ marginBottom: "2.4vw" }}>
          <svg viewBox="0 0 64 64" fill="none" stroke="#CA922B" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ width: "3.6vw", height: "3.6vw" }}>
            <rect x="8" y="28" width="48" height="28" rx="3" />
            <path d="M22 28V20a10 10 0 0 1 20 0v8" />
            <circle cx="32" cy="42" r="4" />
          </svg>
        </div>

        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3vw" }}>
          FOR BUSINESS OWNERS
        </div>

        <h2 className="font-display text-center" style={{ fontSize: "4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.15, marginBottom: "2.4vw", maxWidth: "72vw" }}>
          People connect with <span style={{ color: "#CA922B" }}>people</span><br />
          before they connect with products.
        </h2>

        <div style={{ width: "4vw", height: "2px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)", marginBottom: "2.4vw" }} />

        <p className="font-quote text-center" style={{ fontSize: "1.9vw", color: "#A07840", fontStyle: "italic", lineHeight: 1.65 }}>
          For the first time, your story is as discoverable<br />as your business.
        </p>
      </div>
    </div>
  );
}
