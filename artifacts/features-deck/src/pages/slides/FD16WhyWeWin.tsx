export default function FD16WhyWeWin() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.11) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.18 }}>16</div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: 0, bottom: 0 }}>
        <div className="font-body" style={{ fontSize: "0.85vw", color: "#A07840", letterSpacing: "0.3em", fontWeight: 600, marginBottom: "3.6vw" }}>
          WHY WE WIN
        </div>

        <h2 className="font-display text-center" style={{ fontSize: "3.6vw", fontWeight: 400, color: "#5A3A18", lineHeight: 1.2, marginBottom: "1.6vw", maxWidth: "70vw" }}>
          We don&rsquo;t ask communities to trust technology.
        </h2>

        <h2 className="font-display text-center" style={{ fontSize: "3.6vw", fontWeight: 700, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "3.2vw", maxWidth: "70vw" }}>
          We ask technology to earn the trust<br />of communities.
        </h2>

        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "3.2vw" }} />

        <p className="font-display text-center" style={{ fontSize: "2.4vw", fontWeight: 700, color: "#CA922B", lineHeight: 1.2 }}>
          That&rsquo;s the difference.
        </p>
      </div>
    </div>
  );
}
