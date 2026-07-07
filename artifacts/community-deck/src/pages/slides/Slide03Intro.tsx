const base = import.meta.env.BASE_URL;

export default function Slide03Intro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Background image — full bleed with heavy overlay */}
      <img
        src={`${base}hero-journey.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.3 }}
        alt="Journey"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(28,14,6,0.7) 0%, rgba(28,14,6,0.5) 50%, rgba(28,14,6,0.85) 100%)" }} />

      {/* Slide number */}
      <div className="absolute top-[5vh] right-[6vw] font-display text-primary" style={{ fontSize: "2.2vw", fontWeight: 700, opacity: 0.4 }}>03</div>

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[12vw]">
        <div className="flex items-center justify-center gap-[2vw] mb-[5vh]">
          <div className="gold-rule" style={{ width: "6vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "6vw" }} />
        </div>

        <h2 className="font-display text-accent leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "6.2vw", fontWeight: 700, textWrap: "balance" }}>
          What if community came with you?
        </h2>

        <div className="flex items-center justify-center gap-[2vw] mb-[5vh]">
          <div className="gold-rule" style={{ width: "6vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "6vw" }} />
        </div>

        <div className="px-[3vw] py-[2.5vh] mb-[3vh]" style={{ border: "1px solid rgba(202,146,43,0.4)", background: "rgba(202,146,43,0.08)" }}>
          <span className="font-body text-accent" style={{ fontSize: "3.4vw", fontWeight: 300, letterSpacing: "0.05em" }}>Introducing</span>
          <span className="font-display text-primary ml-[1.5vw]" style={{ fontSize: "3.6vw", fontWeight: 700 }}>Mapping With Melanin™</span>
        </div>

        <p className="font-body" style={{ fontSize: "3vw", fontWeight: 300, color: "#E8B86D", textWrap: "pretty", maxWidth: "60vw" }}>
          The community platform built to travel with you — wherever life leads.
        </p>
      </div>
    </div>
  );
}
