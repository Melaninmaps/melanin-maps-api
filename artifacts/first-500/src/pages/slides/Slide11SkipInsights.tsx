export default function Slide11SkipInsights() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 05</span>
      </div>

      <div className="flex flex-col gap-[5vh] px-[8vw] w-full max-w-[65vw]">
        <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Know why people pass —<br /><span style={{ color: "#C4622D" }}>before it hurts.</span>
        </h1>

        <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(250,246,239,0.75)" }}>
          When community members skip your business, they can leave private feedback explaining why. Only you see it — no public shame, just honest intel to help you improve.
        </p>

        <div className="flex flex-col gap-[2.5vh]">
          <div className="rounded-xl p-[2vw]" style={{ background: "rgba(196,98,45,0.08)", border: "1px solid rgba(196,98,45,0.2)" }}>
            <div className="flex items-start gap-[1.5vw]">
              <span className="text-[2vw] flex-shrink-0">🔇</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Private — 100%</div>
                <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>Community skip reasons are never visible publicly. Only the business owner sees the aggregated insights.</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-[2vw]" style={{ background: "rgba(202,146,43,0.08)", border: "1px solid rgba(202,146,43,0.2)" }}>
            <div className="flex items-start gap-[1.5vw]">
              <span className="text-[2vw] flex-shrink-0">📈</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold mb-[0.8vh]" style={{ color: "#FAF6EF" }}>Actionable Intelligence</div>
                <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>Patterns surface in your KinfolkAI™ action plan — turning raw feedback into concrete next steps.</div>
              </div>
            </div>
          </div>
        </div>

        <p className="font-body text-[1.4vw] italic" style={{ color: "#CA922B" }}>
          Founding Members get this feature first — before it rolls out to the general platform.
        </p>
      </div>

      {/* Right decorative */}
      <div className="absolute right-[6vw] top-1/2 -translate-y-1/2 opacity-8">
        <div className="text-[18vw] leading-none">🔇</div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>10 / 18</span>
      </div>
    </div>
  );
}
