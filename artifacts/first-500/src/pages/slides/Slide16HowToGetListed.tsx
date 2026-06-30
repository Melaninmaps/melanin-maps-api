export default function Slide16HowToGetListed() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex items-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>How to Get Listed</span>
      </div>

      <div className="flex flex-col gap-[5vh] px-[8vw] w-full">
        <h1 className="text-[4.5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Four steps. <span style={{ color: "#CA922B" }}>Your badge goes live immediately.</span>
        </h1>

        <div className="grid grid-cols-4 gap-[2vw]">
          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-full flex items-center justify-center text-white font-body text-[1.4vw] font-bold flex-shrink-0" style={{ background: "#C4622D" }}>1</div>
              <div style={{ flex: 1, height: "2px", background: "rgba(196,98,45,0.3)" }} />
            </div>
            <div className="text-[2.5vw]">🏢</div>
            <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Complete Your Profile</div>
            <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Business name, category, address, hours, and your story</div>
          </div>

          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-full flex items-center justify-center text-white font-body text-[1.4vw] font-bold flex-shrink-0" style={{ background: "#CA922B" }}>2</div>
              <div style={{ flex: 1, height: "2px", background: "rgba(202,146,43,0.3)" }} />
            </div>
            <div className="text-[2.5vw]">📸</div>
            <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Add Photos & Video</div>
            <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Cover photo, gallery images, and your owner intro video</div>
          </div>

          <div className="flex flex-col gap-[2vh]">
            <div className="flex items-center gap-[1vw]">
              <div className="w-[3.5vw] h-[3.5vw] rounded-full flex items-center justify-center text-white font-body text-[1.4vw] font-bold flex-shrink-0" style={{ background: "#C4622D" }}>3</div>
              <div style={{ flex: 1, height: "2px", background: "rgba(196,98,45,0.3)" }} />
            </div>
            <div className="text-[2.5vw]">📲</div>
            <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Invite Your Community</div>
            <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Share your listing link and ask your regulars to leave their first reviews</div>
          </div>

          <div className="flex flex-col gap-[2vh]">
            <div className="w-[3.5vw] h-[3.5vw] rounded-full flex items-center justify-center text-white font-body text-[1.4vw] font-bold" style={{ background: "#2D7A4F" }}>4</div>
            <div className="text-[2.5vw]">🔑</div>
            <div className="font-body text-[1.3vw] font-semibold" style={{ color: "#FAF6EF" }}>Badge Goes Live</div>
            <div className="font-body text-[1.1vw]" style={{ color: "rgba(250,246,239,0.6)" }}>Your 🔑 Founding Member badge is activated immediately — visible across the platform</div>
          </div>
        </div>

        <p className="font-body text-[1.4vw] italic" style={{ color: "rgba(250,246,239,0.5)" }}>
          We'll guide you through every step with in-app prompts and team support.
        </p>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>15 / 18</span>
      </div>
    </div>
  );
}
