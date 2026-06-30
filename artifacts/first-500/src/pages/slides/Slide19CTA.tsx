export default function Slide19CTA() {
  return (
    <div className="w-screen h-screen overflow-hidden relative flex flex-col items-center justify-center" style={{ background: "#1C0E06" }}>
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-0 w-[40vw] h-[40vw] opacity-20 pointer-events-none" style={{ background: "radial-gradient(circle, #C4622D, transparent 70%)" }} />
      <div className="absolute bottom-0 right-0 w-[35vw] h-[35vw] opacity-15 pointer-events-none" style={{ background: "radial-gradient(circle, #CA922B, transparent 70%)" }} />

      <div className="relative z-10 flex flex-col items-center text-center gap-[5vh] px-[12vw]">
        {/* Badge */}
        <div className="flex items-center gap-[1.5vw]">
          <div style={{ width: "5vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
          <span className="text-[2.5vw]">🔑</span>
          <div style={{ width: "5vw", height: "1px", background: "#CA922B", opacity: 0.5 }} />
        </div>

        <h1 className="text-[6vw] leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "#FAF6EF" }}>
          500 spots.<br />
          <span style={{ color: "#C4622D" }}>One chance</span> to be first.
        </h1>

        <div style={{ width: "8vw", height: "3px", background: "linear-gradient(90deg, #C4622D, #CA922B)", borderRadius: "2px" }} />

        <p className="font-body text-[1.8vw] leading-relaxed max-w-[55vw]" style={{ color: "rgba(250,246,239,0.8)" }}>
          Mapping With Melanin™ is where the culture discovers, supports, and celebrates Black-owned business. You built something worth finding. Let us help the community find you.
        </p>

        <div className="flex flex-col items-center gap-[2vh] mt-[2vh]">
          <div className="rounded-2xl px-[4vw] py-[2.5vh]" style={{ background: "linear-gradient(135deg, #C4622D, #CA922B)", boxShadow: "0 0 40px rgba(196,98,45,0.4)" }}>
            <span className="font-body text-[1.8vw] font-bold text-white tracking-wide">mappingwithmelanin.com</span>
          </div>
          <div className="font-body text-[1.2vw]" style={{ color: "rgba(250,246,239,0.4)" }}>Apply for your Founding Member spot today</div>
        </div>
      </div>

      {/* Bottom wordmark */}
      <div className="absolute bottom-[5vh] left-1/2 -translate-x-1/2">
        <span className="font-body text-[1vw] tracking-[0.3em] uppercase" style={{ color: "rgba(250,246,239,0.25)" }}>Mapping With Melanin™ — Founding Business Member Program</span>
      </div>
    </div>
  );
}
