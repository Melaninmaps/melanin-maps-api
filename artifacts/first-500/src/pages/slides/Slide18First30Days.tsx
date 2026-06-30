export default function Slide18First30Days() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>Your First 30 Days</span>
      </div>

      <div className="flex flex-col gap-[4.5vh] px-[8vw] w-full">
        <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          We'll be with you<br /><span style={{ color: "#CA922B" }}>every step of the way.</span>
        </h1>

        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[2.2vw] top-[3.5vh] bottom-[3.5vh] w-[2px]" style={{ background: "linear-gradient(180deg, #C4622D, #CA922B, #2D7A4F, #CA922B)" }} />

          <div className="flex flex-col gap-[3.5vh]">
            <div className="flex items-start gap-[3.5vw]">
              <div className="w-[4.5vw] h-[4.5vw] rounded-full flex items-center justify-center flex-shrink-0 font-body text-[1.2vw] font-bold text-white z-10" style={{ background: "#C4622D" }}>Wk 1</div>
              <div className="flex flex-col gap-[0.8vh]">
                <div className="font-body text-[1.6vw] font-semibold" style={{ color: "#FAF6EF" }}>Profile live. Badge activated.</div>
                <div className="font-body text-[1.25vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Your listing goes live, 🔑 badge appears, and you're visible across search, map, and the discovery feed</div>
              </div>
            </div>

            <div className="flex items-start gap-[3.5vw]">
              <div className="w-[4.5vw] h-[4.5vw] rounded-full flex items-center justify-center flex-shrink-0 font-body text-[1.2vw] font-bold text-white z-10" style={{ background: "#CA922B" }}>Wk 2</div>
              <div className="flex flex-col gap-[0.8vh]">
                <div className="font-body text-[1.6vw] font-semibold" style={{ color: "#FAF6EF" }}>Share with your community.</div>
                <div className="font-body text-[1.25vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Post your listing link on socials, send it to regulars — invite your people to find you on the platform</div>
              </div>
            </div>

            <div className="flex items-start gap-[3.5vw]">
              <div className="w-[4.5vw] h-[4.5vw] rounded-full flex items-center justify-center flex-shrink-0 font-body text-[1.2vw] font-bold text-white z-10" style={{ background: "#2D7A4F" }}>Wk 3</div>
              <div className="flex flex-col gap-[0.8vh]">
                <div className="font-body text-[1.6vw] font-semibold" style={{ color: "#FAF6EF" }}>First reviews roll in.</div>
                <div className="font-body text-[1.25vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Community starts leaving reviews — respond publicly, build trust, and watch your confidence score grow</div>
              </div>
            </div>

            <div className="flex items-start gap-[3.5vw]">
              <div className="w-[4.5vw] h-[4.5vw] rounded-full flex items-center justify-center flex-shrink-0 font-body text-[1.2vw] font-bold text-white z-10" style={{ background: "#CA922B" }}>Wk 4</div>
              <div className="flex flex-col gap-[0.8vh]">
                <div className="font-body text-[1.6vw] font-semibold" style={{ color: "#FAF6EF" }}>Review your KinfolkAI™ action plan.</div>
                <div className="font-body text-[1.25vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Your first AI-powered growth plan is ready — based on real data from your first month on the platform</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>17 / 18</span>
      </div>
    </div>
  );
}
