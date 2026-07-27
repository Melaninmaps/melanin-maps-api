const base = import.meta.env.BASE_URL;

export default function Slide01Welcome() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Right image panel */}
      <div className="absolute right-0 top-0 w-[50vw] h-full">
        <img
          src={`${base}hero-family.png`}
          className="w-full h-full object-cover"
          alt="Family from the melanated diaspora"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.5) 45%, transparent 100%)" }} />
      </div>

      {/* Left content */}
      <div className="absolute left-0 top-0 w-[58vw] h-full flex flex-col justify-center pl-[7vw] pr-[5vw]">
        <div className="flex items-center gap-[1vw] mb-[3vh]">
          <div className="gold-dot" />
          <span className="font-body" style={{ fontSize: "2vw", letterSpacing: "0.22em", fontWeight: 300, color: "#CA922B" }}>MAPPING WITH MELANIN™</span>
        </div>
        <h1 className="font-display leading-none tracking-tight" style={{ fontSize: "7vw", fontWeight: 900, color: "#FAF6EF" }}>
          Welcome
        </h1>
        <h1 className="font-display leading-none tracking-tight mb-[3.5vh]" style={{ fontSize: "7vw", fontWeight: 900, color: "#CA922B" }}>
          Home.
        </h1>
        <div className="gold-rule w-[16vw] mb-[3vh]" />
        <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.9 }}>
          No matter where life takes you.
        </p>
      </div>

      {/* Bottom brand bar */}
      <div className="absolute bottom-[4vh] left-[7vw] right-[7vw] flex items-center justify-between">
        <div className="gold-rule" style={{ width: "7vw" }} />
        <span className="font-body" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 300, letterSpacing: "0.15em" }}>COMMUNITY MEMBERSHIP</span>
        <div className="gold-rule" style={{ width: "7vw" }} />
      </div>
    </div>
  );
}
