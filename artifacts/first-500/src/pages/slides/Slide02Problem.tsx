export default function Slide02Problem() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      {/* Left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[0.6vw]" style={{ background: "linear-gradient(180deg, #C4622D, #CA922B)" }} />

      {/* Top label */}
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>The Problem</span>
      </div>

      <div className="relative z-10 flex flex-col gap-[5vh] pl-[8vw] pr-[12vw] w-full">
        <h1 className="text-[5.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Black-owned businesses are<br />
          <span style={{ color: "#C4622D" }}>hidden in plain sight.</span>
        </h1>

        <div className="flex flex-col gap-[3vh]">
          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.6vh] w-[1vw] h-[1vw] rounded-full flex-shrink-0" style={{ background: "#C4622D" }} />
            <p className="font-body text-[1.9vw] leading-snug" style={{ color: "rgba(250,246,239,0.85)" }}>
              Hard to discover. Even harder to trust without community validation.
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.6vh] w-[1vw] h-[1vw] rounded-full flex-shrink-0" style={{ background: "#CA922B" }} />
            <p className="font-body text-[1.9vw] leading-snug" style={{ color: "rgba(250,246,239,0.85)" }}>
              No centralized, community-powered platform dedicated to Black commerce.
            </p>
          </div>
          <div className="flex items-start gap-[2vw]">
            <div className="mt-[0.6vh] w-[1vw] h-[1vw] rounded-full flex-shrink-0" style={{ background: "#2D7A4F" }} />
            <p className="font-body text-[1.9vw] leading-snug" style={{ color: "rgba(250,246,239,0.85)" }}>
              Missing the tools to grow with, and be found by, the community that wants to support them.
            </p>
          </div>
        </div>

        <div className="mt-[2vh] inline-flex items-center gap-[1.5vw]">
          <div style={{ width: "3vw", height: "2px", background: "#C4622D" }} />
          <span className="font-body text-[1.6vw] font-semibold" style={{ color: "#FAF6EF" }}>We change that — starting with you.</span>
        </div>
      </div>

      {/* Right decorative element */}
      <div className="absolute right-[6vw] top-1/2 -translate-y-1/2 opacity-10">
        <div className="text-[20vw] leading-none" style={{ fontFamily: "'Playfair Display', serif", color: "#C4622D" }}>?</div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>01 / 18</span>
      </div>
    </div>
  );
}
