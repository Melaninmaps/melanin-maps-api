export default function CB01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(202,146,43,0.2) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      <div className="absolute top-[4.5vw] left-[6vw] font-body" style={{ fontSize: "1.85vw", color: "#E4A93A", letterSpacing: "0.22em", fontWeight: 500 }}>
        MAPPING WITH MELANIN&trade;
      </div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "18%", bottom: "18%" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "2.2vw" }}>
          COMMUNITY BUILDER DECK
        </div>
        <h1 className="font-display text-center" style={{ fontSize: "7vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.8vw" }}>
          Become a<br /><span style={{ color: "#CA922B" }}>Community Builder.</span>
        </h1>
        <div style={{ width: "6vw", height: "3px", background: "#CA922B", marginBottom: "2.2vw", opacity: 0.8 }} />
        <div className="font-body text-center" style={{ fontSize: "1.8vw", color: "#A87A40", fontWeight: 300, lineHeight: 1.6, maxWidth: "52vw" }}>
          You&rsquo;re not just sharing an app.<br />You&rsquo;re helping someone find their community.
        </div>
      </div>
    </div>
  );
}
