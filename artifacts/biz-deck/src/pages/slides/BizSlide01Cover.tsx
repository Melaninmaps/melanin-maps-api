export default function BizSlide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 60% 40%, rgba(202,146,43,0.18), transparent 55%)" }} />

      {/* Left column */}
      <div className="relative flex flex-col justify-center" style={{ paddingLeft: "7vw", maxWidth: "55vw" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8vw", marginBottom: "2.2vw" }}>
          <div style={{ width: "2.8vw", height: "2.8vw", borderRadius: "0.6vw", background: "#CA922B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="1.5vw" height="1.5vw" viewBox="0 0 24 24" fill="none" stroke="#1C0E06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <span className="font-display" style={{ fontSize: "1.1vw", color: "#CA922B", fontWeight: 700, letterSpacing: "0.08em" }}>Mapping With Melanin™</span>
        </div>

        <div className="font-display" style={{ fontSize: "4.6vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2vw" }}>
          Grow with the community<br />
          that already wants<br />
          <span style={{ color: "#CA922B" }}>to support you.</span>
        </div>

        <div className="font-body" style={{ fontSize: "1.2vw", color: "#A87A40", lineHeight: 1.7, maxWidth: "44vw", marginBottom: "3vw" }}>
          Helping minority-owned businesses become easier to discover, trust, and support — through the platform their community is already using.
        </div>

        <div style={{ display: "flex", gap: "1vw" }}>
          <div style={{ background: "#CA922B", borderRadius: "0.6vw", padding: "0.9vw 2.2vw" }}>
            <span className="font-body" style={{ fontSize: "1vw", color: "#1C0E06", fontWeight: 800 }}>Become a Founding Business</span>
          </div>
          <div style={{ border: "1px solid rgba(202,146,43,0.4)", borderRadius: "0.6vw", padding: "0.9vw 2.2vw" }}>
            <span className="font-body" style={{ fontSize: "1vw", color: "#D9C4A3", fontWeight: 600 }}>Learn More</span>
          </div>
        </div>
      </div>

      {/* Right — decorative stat column */}
      <div className="absolute right-[6vw] flex flex-col gap-[2.5vw]" style={{ top: "50%", transform: "translateY(-50%)" }}>
        <div style={{ textAlign: "right" }}>
          <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#CA922B" }}>$1.7T</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.4 }}>community buying power</div>
        </div>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)" }} />
        <div style={{ textAlign: "right" }}>
          <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#CA922B" }}>87%</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.4 }}>prefer community recommendations<br />over paid ads</div>
        </div>
        <div style={{ height: "1px", background: "rgba(202,146,43,0.2)" }} />
        <div style={{ textAlign: "right" }}>
          <div className="font-display" style={{ fontSize: "3.2vw", fontWeight: 800, color: "#CA922B" }}>3×</div>
          <div className="font-body" style={{ fontSize: "0.88vw", color: "#7B5408", lineHeight: 1.4 }}>more likely to return to a<br />community-trusted business</div>
        </div>
      </div>
    </div>
  );
}
