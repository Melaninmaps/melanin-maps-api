export default function SlideInv42BusinessSection() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 60%, rgba(202,146,43,0.15), transparent 60%)" }} />

      {/* Horizontal rule top */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "50%", transform: "translateY(-14vw)", height: "1px", background: "rgba(202,146,43,0.2)" }} />

      {/* Center content */}
      <div className="relative flex flex-col items-center text-center" style={{ maxWidth: "68vw" }}>
        <div className="font-body" style={{ fontSize: "1.2vw", color: "#CA922B", letterSpacing: "0.22em", fontWeight: 700, marginBottom: "2.2vw" }}>
          PART II
        </div>
        <div className="font-display" style={{ fontSize: "5.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "2.2vw" }}>
          Now let's talk about<br />
          <span style={{ color: "#CA922B" }}>the businesses</span><br />
          this community trusts.
        </div>
        <div className="font-body" style={{ fontSize: "1.35vw", color: "#A87A40", lineHeight: 1.65, maxWidth: "48vw" }}>
          People are already looking for trusted businesses. Here's how yours becomes one of them.
        </div>

        {/* Category strip */}
        <div style={{ marginTop: "3vw", display: "flex", gap: "1.2vw", flexWrap: "wrap", justifyContent: "center" }}>
          {["Restaurants", "Beauty", "Health", "Legal", "Finance", "Real Estate", "Fitness", "Events"].map((cat) => (
            <div key={cat} style={{ borderRadius: "2vw", padding: "0.4vw 1.1vw", border: "1px solid rgba(202,146,43,0.35)" }}>
              <span className="font-body" style={{ fontSize: "0.88vw", color: "#D9C4A3" }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal rule bottom */}
      <div className="absolute" style={{ left: "6vw", right: "6vw", top: "50%", transform: "translateY(12vw)", height: "1px", background: "rgba(202,146,43,0.2)" }} />
    </div>
  );
}
