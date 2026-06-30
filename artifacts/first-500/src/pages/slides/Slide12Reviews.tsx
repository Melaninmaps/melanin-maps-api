export default function Slide12Reviews() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 06</span>
      </div>

      <div className="flex items-center w-full px-[8vw] gap-[8vw]">
        <div className="flex flex-col gap-[4vh] flex-1">
          <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
            Reviews that<br /><span style={{ color: "#CA922B" }}>build real trust.</span>
          </h1>
          <p className="font-body text-[1.6vw] leading-relaxed" style={{ color: "rgba(250,246,239,0.7)" }}>
            Community-powered reviews with depth and authenticity — not just stars.
          </p>
          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1.5vw]">
              <span className="text-[1.8vw]">⭐</span>
              <span className="font-body text-[1.5vw]" style={{ color: "#FAF6EF" }}>Star ratings + would-return score</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <span className="text-[1.8vw]">✅</span>
              <span className="font-body text-[1.5vw]" style={{ color: "#FAF6EF" }}>Verified purchase & check-in badges</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <span className="text-[1.8vw]">🎥</span>
              <span className="font-body text-[1.5vw]" style={{ color: "#FAF6EF" }}>Video reviews with community approval</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <span className="text-[1.8vw]">💬</span>
              <span className="font-body text-[1.5vw]" style={{ color: "#FAF6EF" }}>Public owner responses — your voice</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <span className="text-[1.8vw]">🏆</span>
              <span className="font-body text-[1.5vw]" style={{ color: "#FAF6EF" }}>Auto-highlighted perfect 5★ reviews</span>
            </div>
          </div>
        </div>

        {/* Mock review card */}
        <div className="flex-shrink-0 w-[30vw] rounded-2xl p-[3vw] flex flex-col gap-[2vh]" style={{ background: "rgba(250,246,239,0.05)", border: "1px solid rgba(250,246,239,0.12)" }}>
          <div className="flex items-center gap-[1.5vw]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-full" style={{ background: "linear-gradient(135deg, #C4622D, #CA922B)" }} />
            <div>
              <div className="font-body text-[1.2vw] font-semibold" style={{ color: "#FAF6EF" }}>Jazmine W.</div>
              <div className="font-body text-[0.9vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Verified Check-In · Chicago, IL</div>
            </div>
          </div>
          <div className="flex gap-[0.4vw]">
            <span style={{ color: "#CA922B", fontSize: "1.4vw" }}>★</span>
            <span style={{ color: "#CA922B", fontSize: "1.4vw" }}>★</span>
            <span style={{ color: "#CA922B", fontSize: "1.4vw" }}>★</span>
            <span style={{ color: "#CA922B", fontSize: "1.4vw" }}>★</span>
            <span style={{ color: "#CA922B", fontSize: "1.4vw" }}>★</span>
          </div>
          <p className="font-body text-[1.2vw] leading-relaxed italic" style={{ color: "rgba(250,246,239,0.8)" }}>
            "This place is everything. The energy, the food, the staff — I'm bringing everyone I know here."
          </p>
          <div className="rounded-lg p-[1.2vw]" style={{ background: "rgba(196,98,45,0.15)", border: "1px solid rgba(196,98,45,0.25)" }}>
            <div className="font-body text-[0.9vw] font-semibold mb-[0.5vh]" style={{ color: "#C4622D" }}>Owner Response</div>
            <p className="font-body text-[1vw]" style={{ color: "rgba(250,246,239,0.7)" }}>Thank you Jazmine! We can't wait to see you again. 🙏🏾</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>11 / 18</span>
      </div>
    </div>
  );
}
