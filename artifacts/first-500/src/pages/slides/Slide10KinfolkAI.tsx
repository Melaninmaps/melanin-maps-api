export default function Slide10KinfolkAI() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Founding Member Benefit 04</span>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-[38vw] flex items-center justify-center" style={{ background: "rgba(196,98,45,0.07)", borderLeft: "1px solid rgba(196,98,45,0.15)" }}>
        <div className="flex flex-col gap-[3vh] px-[4vw]">
          <div className="font-body text-[1.2vw] tracking-widest uppercase" style={{ color: "#CA922B" }}>Action Plan Covers</div>
          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ background: "#C4622D" }} />
              <span className="font-body text-[1.4vw]" style={{ color: "#FAF6EF" }}>Review sentiment analysis</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ background: "#CA922B" }} />
              <span className="font-body text-[1.4vw]" style={{ color: "#FAF6EF" }}>Why people skip — privately</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ background: "#2D7A4F" }} />
              <span className="font-body text-[1.4vw]" style={{ color: "#FAF6EF" }}>Ratings trends over time</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ background: "#C4622D" }} />
              <span className="font-body text-[1.4vw]" style={{ color: "#FAF6EF" }}>Personalized growth actions</span>
            </div>
            <div className="flex items-center gap-[1.5vw]">
              <div className="w-[0.8vw] h-[0.8vw] rounded-full" style={{ background: "#CA922B" }} />
              <span className="font-body text-[1.4vw]" style={{ color: "#FAF6EF" }}>Community perception score</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[5vh] pl-[8vw] pr-[44vw]">
        <div className="text-[5vw]">🤖</div>
        <h1 className="text-[4vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          KinfolkAI™<br /><span style={{ color: "#CA922B" }}>Business Action Plan.</span>
        </h1>
        <p className="font-body text-[1.6vw] leading-relaxed" style={{ color: "rgba(250,246,239,0.75)" }}>
          AI-powered growth insights built specifically for your business — analyzing your real community data.
        </p>
        <div className="inline-flex items-center gap-[1.2vw] rounded-xl px-[2vw] py-[1.5vh]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.35)" }}>
          <span className="text-[1.8vw]">💬</span>
          <span className="font-body text-[1.4vw] italic" style={{ color: "#CA922B" }}>
            "Your community is talking. Now you can hear them."
          </span>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>09 / 18</span>
      </div>
    </div>
  );
}
