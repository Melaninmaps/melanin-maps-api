export default function Slide15OnboardingIntro() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center" style={{ background: "#2B1507" }}>
      {/* Background pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="rounded-full border-2" style={{ width: "80vw", height: "80vw", borderColor: "#CA922B" }} />
        <div className="absolute rounded-full border-2" style={{ width: "55vw", height: "55vw", borderColor: "#CA922B" }} />
        <div className="absolute rounded-full border-2" style={{ width: "30vw", height: "30vw", borderColor: "#CA922B" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-[5vh] px-[15vw]">
        <div className="font-body text-[1.4vw] tracking-[0.3em] uppercase" style={{ color: "#CA922B" }}>Part Two — Onboarding</div>

        <h1 className="text-[6vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Let's get you<br /><span style={{ color: "#CA922B" }}>on the map.</span>
        </h1>

        <div style={{ width: "6vw", height: "3px", background: "linear-gradient(90deg, #C4622D, #CA922B)", borderRadius: "2px" }} />

        <p className="font-body text-[1.8vw] leading-relaxed" style={{ color: "rgba(250,246,239,0.75)" }}>
          Getting set up is simple. We'll walk you through every step — from your first photo to your first review.
        </p>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.3)" }}>14 / 18</span>
      </div>
    </div>
  );
}
