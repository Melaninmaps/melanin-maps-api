const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Left gold bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[1vw]" style={{ background: "#CA922B" }} />

      {/* Right image panel */}
      <div className="absolute right-0 top-0 w-[52vw] h-full">
        <img
          src={`${base}hero-growth.png`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          alt="Business growth"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.35) 45%, transparent 100%)" }} />
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>01</div>

      {/* Left content — flex col centered */}
      <div className="absolute left-0 top-0 w-[54vw] h-full flex flex-col justify-center pl-[7vw] pr-[4vw]">
        <div className="font-body mb-[2.5vh]" style={{ fontSize: "2.4vw", fontWeight: 300, color: "#CA922B", letterSpacing: "0.18em" }}>
          FOR BUSINESS OWNERS
        </div>
        <h1 className="font-display leading-none tracking-tight mb-[0.5vh]" style={{ fontSize: "6vw", fontWeight: 800, color: "#FAF6EF" }}>
          Grow Your
        </h1>
        <h1 className="font-display leading-none tracking-tight mb-[0.5vh]" style={{ fontSize: "6vw", fontWeight: 800, color: "#CA922B" }}>
          Business
        </h1>
        <h1 className="font-display leading-none tracking-tight mb-[4vh]" style={{ fontSize: "6vw", fontWeight: 800, color: "#FAF6EF" }}>
          Through Community.
        </h1>
        <div className="biz-bar w-[18vw] mb-[3.5vh]" />
        <p className="font-body" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#FAF6EF", opacity: 0.8 }}>
          Mapping With Melanin™
        </p>
      </div>
    </div>
  );
}
