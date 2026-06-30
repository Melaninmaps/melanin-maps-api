export default function Slide03WhatIsMWM() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col justify-center" style={{ background: "#1C0E06" }}>
      <div className="absolute top-[7vh] left-[8vw]">
        <span className="font-body text-[1.2vw] tracking-[0.25em] uppercase" style={{ color: "#C4622D" }}>What We Built</span>
      </div>

      <div className="flex flex-col gap-[5vh] px-[8vw]">
        <h1 className="text-[5vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          A community discovery platform<br />
          <span style={{ color: "#CA922B" }}>built by and for the culture.</span>
        </h1>

        <div className="grid grid-cols-2 gap-[2.5vw] mt-[2vh]">
          <div className="rounded-xl p-[2.5vw]" style={{ background: "rgba(196,98,45,0.1)", border: "1px solid rgba(196,98,45,0.25)" }}>
            <div className="text-[2.5vw] mb-[1.5vh]">📍</div>
            <div className="font-body text-[1.5vw] font-semibold mb-[1vh]" style={{ color: "#FAF6EF" }}>Discover Black-Owned Businesses</div>
            <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>Search by category, vibe, price, and location — with community confidence scores</div>
          </div>
          <div className="rounded-xl p-[2.5vw]" style={{ background: "rgba(202,146,43,0.1)", border: "1px solid rgba(202,146,43,0.25)" }}>
            <div className="text-[2.5vw] mb-[1.5vh]">🤖</div>
            <div className="font-body text-[1.5vw] font-semibold mb-[1vh]" style={{ color: "#FAF6EF" }}>KinfolkAI™ Travel Planning</div>
            <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>AI-powered cultural travel — plans built around Black spaces, safety, and community</div>
          </div>
          <div className="rounded-xl p-[2.5vw]" style={{ background: "rgba(45,122,79,0.1)", border: "1px solid rgba(45,122,79,0.25)" }}>
            <div className="text-[2.5vw] mb-[1.5vh]">🛡️</div>
            <div className="font-body text-[1.5vw] font-semibold mb-[1vh]" style={{ color: "#FAF6EF" }}>Community Safety Intel</div>
            <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>Neighborhood safety reports, alerts, and real community signals — travel with confidence</div>
          </div>
          <div className="rounded-xl p-[2.5vw]" style={{ background: "rgba(196,98,45,0.08)", border: "1px solid rgba(250,246,239,0.1)" }}>
            <div className="text-[2.5vw] mb-[1.5vh]">⭐</div>
            <div className="font-body text-[1.5vw] font-semibold mb-[1vh]" style={{ color: "#FAF6EF" }}>Community-Powered Reviews</div>
            <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.65)" }}>Real reviews, verified check-ins, and video testimonials from people who actually went</div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>02 / 18</span>
      </div>
    </div>
  );
}
