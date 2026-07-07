const base = import.meta.env.BASE_URL;

export default function Slide03Intro() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: "#1C0E06" }}>
      {/* Background image */}
      <img
        src={`${base}hero-journey.png`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25 }}
        alt=""
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,14,6,0.75) 0%, rgba(28,14,6,0.45) 50%, rgba(28,14,6,0.85) 100%)" }} />

      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>03</div>

      <div className="relative flex flex-col items-center px-[12vw]">
        <div className="flex items-center justify-center gap-[2vw] mb-[4vh]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>

        <h2 className="font-display leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "5.5vw", fontWeight: 700, color: "#FAF6EF" }}>
          What if community came with you?
        </h2>

        <div className="flex items-center justify-center gap-[2vw] mb-[4vh]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>

        <div className="flex items-center gap-[1.5vw] px-[3vw] py-[2vh] mb-[3vh]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.08)" }}>
          <span className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#FAF6EF" }}>Introducing</span>
          <span className="font-display" style={{ fontSize: "3vw", fontWeight: 700, color: "#CA922B" }}>Mapping With Melanin™</span>
        </div>

        <p className="font-body" style={{ fontSize: "2.7vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.5, maxWidth: "58vw" }}>
          The community platform built to travel with you — wherever life leads.
        </p>
      </div>
    </div>
  );
}
