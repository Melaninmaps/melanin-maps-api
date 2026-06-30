export default function Slide06WhatItMeans() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center" style={{ background: "#C4622D" }}>
      {/* Background pattern */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
        <div className="rounded-full border-2 border-white" style={{ width: "80vw", height: "80vw" }} />
        <div className="absolute rounded-full border-2 border-white" style={{ width: "55vw", height: "55vw" }} />
        <div className="absolute rounded-full border-2 border-white" style={{ width: "30vw", height: "30vw" }} />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center gap-[5vh] px-[15vw]">
        <div className="font-body text-[1.4vw] tracking-[0.3em] uppercase text-white opacity-75">Part One — What It Means</div>

        <h1 className="text-[6.5vw] leading-tight text-white" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900 }}>
          This isn't just a listing.
        </h1>

        <div style={{ width: "6vw", height: "3px", background: "rgba(255,255,255,0.5)", borderRadius: "2px" }} />

        <p className="font-body text-[2.2vw] leading-relaxed text-white" style={{ opacity: 0.9 }}>
          It's a legacy.
        </p>

        <p className="font-body text-[1.7vw] leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
          Founding Members are the bedrock of the platform — the businesses the community discovers first, trusts first, and returns to. Your founding status is permanent and prominently displayed.
        </p>
      </div>

      {/* Bottom label */}
      <div className="absolute bottom-[5vh] right-[6vw]">
        <span className="font-body text-[1vw] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>05 / 18</span>
      </div>
    </div>
  );
}
