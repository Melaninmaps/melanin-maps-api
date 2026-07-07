const base = import.meta.env.BASE_URL;

export default function Slide01Welcome() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Full-bleed image right half */}
      <div className="absolute right-0 top-0 w-[52vw] h-full">
        <img
          src={`${base}hero-welcome.png`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          alt="Community gathering"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.4) 40%, transparent 100%)" }} />
      </div>

      {/* Left content */}
      <div className="absolute left-0 top-0 w-[56vw] h-full flex flex-col justify-center pl-[7vw] pr-[4vw]">
        {/* Slide number */}
        <div className="flex items-center gap-[1vw] mb-[4vh]">
          <div className="gold-dot" />
          <span className="font-body text-primary" style={{ fontSize: "2.2vw", letterSpacing: "0.2em", fontWeight: 300 }}>MAPPING WITH MELANIN™</span>
        </div>

        {/* Headline */}
        <h1 className="font-display text-accent leading-none tracking-tight mb-[2.5vh]" style={{ fontSize: "8.5vw", fontWeight: 900, textWrap: "balance" }}>
          Welcome
        </h1>
        <h1 className="font-display text-primary leading-none tracking-tight mb-[4vh]" style={{ fontSize: "8.5vw", fontWeight: 900, textWrap: "balance" }}>
          Home.
        </h1>

        {/* Gold rule */}
        <div className="gold-rule w-[18vw] mb-[3.5vh]" />

        <p className="font-body text-accent mb-[1.5vh]" style={{ fontSize: "3.2vw", fontWeight: 300, opacity: 0.9, textWrap: "pretty" }}>
          No matter where life takes you.
        </p>
      </div>

      {/* Bottom brand bar */}
      <div className="absolute bottom-[4vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <div className="gold-rule" style={{ width: "8vw" }} />
        <span className="font-body" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 300, letterSpacing: "0.15em" }}>COMMUNITY MEMBERSHIP</span>
        <div className="gold-rule" style={{ width: "8vw" }} />
      </div>
    </div>
  );
}
