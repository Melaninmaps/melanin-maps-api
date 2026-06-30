export default function Slide01Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center" style={{ background: "#1C0E06" }}>
      {/* Background texture rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="rounded-full border opacity-5" style={{ width: "90vw", height: "90vw", borderColor: "#C4622D" }} />
        <div className="absolute rounded-full border opacity-10" style={{ width: "65vw", height: "65vw", borderColor: "#C4622D" }} />
        <div className="absolute rounded-full border opacity-15" style={{ width: "42vw", height: "42vw", borderColor: "#CA922B" }} />
      </div>

      {/* Top badge */}
      <div className="absolute top-[6vh] left-1/2 -translate-x-1/2 flex items-center gap-[1vw]">
        <div style={{ width: "4vw", height: "1px", background: "#CA922B", opacity: 0.6 }} />
        <span className="font-body text-[1.4vw] tracking-[0.3em] uppercase" style={{ color: "#CA922B" }}>Founding Business Member Program</span>
        <div style={{ width: "4vw", height: "1px", background: "#CA922B", opacity: 0.6 }} />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center text-center gap-[3vh]">
        <div className="text-[7vw] leading-none" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          Welcome to the
        </div>
        <div className="text-[10vw] leading-none" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#C4622D" }}>
          Movement.
        </div>
        <div style={{ width: "8vw", height: "3px", background: "linear-gradient(90deg, #C4622D, #CA922B)", borderRadius: "2px" }} />
        <p className="font-body text-[1.8vw] max-w-[50vw] leading-relaxed" style={{ color: "rgba(250,246,239,0.75)" }}>
          You were chosen. Now let's build the culture's most trusted business platform — together.
        </p>
      </div>

      {/* Bottom wordmark */}
      <div className="absolute bottom-[6vh] left-1/2 -translate-x-1/2">
        <span className="font-body text-[1.3vw] tracking-widest uppercase" style={{ color: "rgba(250,246,239,0.4)" }}>Mapping With Melanin™</span>
      </div>

      {/* Corner accent */}
      <div className="absolute top-0 right-0 w-[15vw] h-[15vw] opacity-20" style={{ background: "radial-gradient(circle at top right, #C4622D, transparent 70%)" }} />
      <div className="absolute bottom-0 left-0 w-[15vw] h-[15vw] opacity-15" style={{ background: "radial-gradient(circle at bottom left, #CA922B, transparent 70%)" }} />
    </div>
  );
}
