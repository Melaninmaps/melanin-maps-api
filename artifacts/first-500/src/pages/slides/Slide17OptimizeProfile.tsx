export default function Slide17OptimizeProfile() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Optimizing Your Profile</span>
      </div>

      <div className="flex items-center w-full px-[8vw] gap-[8vw]">
        <div className="flex flex-col gap-[4vh] flex-1">
          <h1 className="text-[4vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
            Make your listing<br /><span style={{ color: "#CA922B" }}>work hard for you.</span>
          </h1>
          <p className="font-body text-[1.5vw]" style={{ color: "rgba(250,246,239,0.65)" }}>
            Complete profiles get significantly more saves. Here's what matters most:
          </p>
          <div className="flex flex-col gap-[2.2vh]">
            <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[1.5vh]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.2)" }}>
              <span className="text-[2vw]">🖼️</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>High-quality cover photo</div>
                <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Shows on every search card and map pin — first impression matters</div>
              </div>
            </div>
            <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[1.5vh]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.2)" }}>
              <span className="text-[2vw]">🎬</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Owner intro video</div>
                <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Builds instant trust — let the community see the person behind the business</div>
              </div>
            </div>
            <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[1.5vh]" style={{ background: "rgba(45,122,79,0.1)", border: "1px solid rgba(45,122,79,0.2)" }}>
              <span className="text-[2vw]">📖</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Your story & complete description</div>
                <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Why you started, what makes you different, and who you serve</div>
              </div>
            </div>
            <div className="flex items-center gap-[1.5vw] rounded-xl px-[2vw] py-[1.5vh]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.2)" }}>
              <span className="text-[2vw]">🕐</span>
              <div>
                <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Accurate hours & contact info</div>
                <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.55)" }}>Nothing hurts trust like wrong hours — keep yours current</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stat callout */}
        <div className="flex-shrink-0 w-[25vw] flex flex-col items-center gap-[2vh] text-center">
          <div className="rounded-full w-[18vw] h-[18vw] flex flex-col items-center justify-center" style={{ background: "rgba(196,98,45,0.15)", border: "2px solid rgba(196,98,45,0.4)" }}>
            <div className="font-body font-bold" style={{ fontSize: "6vw", lineHeight: 1, color: "#CA922B" }}>3x</div>
            <div className="font-body text-[1.2vw] mt-[1vh]" style={{ color: "rgba(250,246,239,0.7)" }}>more saves</div>
          </div>
          <p className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.5)" }}>Complete profiles earn 3x more saves than incomplete ones</p>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>16 / 18</span>
      </div>
    </div>
  );
}
