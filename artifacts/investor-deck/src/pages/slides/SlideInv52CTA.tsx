export default function SlideInv52CTA() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 55%, rgba(202,146,43,0.2), transparent 60%)" }} />
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "50%", transform: "translateY(-14vw)", height: "1px", background: "rgba(202,146,43,0.25)" }} />

      <div className="relative flex flex-col items-center text-center" style={{ maxWidth: "65vw" }}>
        <div className="font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "1.8vw" }}>
          500 SPOTS. 1 COMMUNITY.
        </div>
        <div className="font-display" style={{ fontSize: "5.4vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "1.8vw" }}>
          Become a<br />
          <span style={{ color: "#CA922B" }}>Founding Business.</span>
        </div>
        <div className="font-body" style={{ fontSize: "1.3vw", color: "#A87A40", lineHeight: 1.7, maxWidth: "46vw", marginBottom: "3.5vw" }}>
          Your community is already on the platform. They're searching for businesses they can trust. This is your moment to be the one they find.
        </div>
        <div style={{ background: "#CA922B", borderRadius: "0.7vw", padding: "1.1vw 3.2vw", display: "inline-block", marginBottom: "3vw" }}>
          <span className="font-display" style={{ fontSize: "1.3vw", color: "#1C0E06", fontWeight: 800, letterSpacing: "0.04em" }}>mappingwithmelanin.com/business</span>
        </div>
        <div style={{ display: "flex", gap: "4vw", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>$29</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.4, marginTop: "0.3vw" }}>per month, locked forever</div>
          </div>
          <div style={{ width: "1px", background: "rgba(202,146,43,0.25)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>500</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.4, marginTop: "0.3vw" }}>founding spots total</div>
          </div>
          <div style={{ width: "1px", background: "rgba(202,146,43,0.25)", alignSelf: "stretch" }} />
          <div style={{ textAlign: "center" }}>
            <div className="font-display" style={{ fontSize: "2.4vw", fontWeight: 800, color: "#CA922B", lineHeight: 1 }}>Day 1</div>
            <div className="font-body" style={{ fontSize: "0.82vw", color: "#7B5408", lineHeight: 1.4, marginTop: "0.3vw" }}>access to all future tools</div>
          </div>
        </div>
      </div>

      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "50%", transform: "translateY(12.5vw)", height: "1px", background: "rgba(202,146,43,0.25)" }} />
      <div className="absolute bottom-[2.5vw] flex items-center gap-[0.7vw]" style={{ left: "50%", transform: "translateX(-50%)" }}>
        <svg width="1.1vw" height="1.1vw" viewBox="0 0 24 24" fill="none" stroke="#CA922B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
        </svg>
        <span className="font-body" style={{ fontSize: "0.9vw", color: "#7B5408", letterSpacing: "0.08em" }}>Mapping with Melanin™</span>
      </div>
    </div>
  );
}
