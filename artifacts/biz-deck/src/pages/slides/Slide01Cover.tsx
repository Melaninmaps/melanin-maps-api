const base = import.meta.env.BASE_URL;

export default function Slide01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Left gold bar */}
      <div className="absolute left-0 top-0 bottom-0 w-[1.2vw]" style={{ background: "#CA922B" }} />

      {/* Right image panel */}
      <div className="absolute right-0 top-0 w-[50vw] h-full">
        <img
          src={`${base}hero-growth.png`}
          crossOrigin="anonymous"
          className="w-full h-full object-cover"
          alt="Business growth"
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #1C0E06 0%, rgba(28,14,6,0.3) 40%, transparent 100%)" }} />
      </div>

      {/* Left content */}
      <div className="absolute left-[6vw] top-0 bottom-0 w-[52vw] flex flex-col justify-center pl-[3vw]">
        <div className="font-body mb-[3vh]" style={{ fontSize: "2.6vw", fontWeight: 300, color: "#CA922B", letterSpacing: "0.18em" }}>
          FOR BUSINESS OWNERS
        </div>

        <h1 className="font-display text-accent leading-none tracking-tight mb-[1.5vh]" style={{ fontSize: "7.2vw", fontWeight: 800 }}>
          Grow Your
        </h1>
        <h1 className="font-display leading-none tracking-tight mb-[1.5vh]" style={{ fontSize: "7.2vw", fontWeight: 800, color: "#CA922B" }}>
          Business
        </h1>
        <h1 className="font-display text-accent leading-none tracking-tight mb-[5vh]" style={{ fontSize: "7.2vw", fontWeight: 800 }}>
          Through Community.
        </h1>

        <div className="biz-bar w-[20vw] mb-[4vh]" />

        <p className="font-body text-accent" style={{ fontSize: "3vw", fontWeight: 300, opacity: 0.8 }}>
          Mapping With Melanin™
        </p>
      </div>

      {/* Slide number */}
      <div className="absolute bottom-[4vh] right-[6vw] font-display" style={{ fontSize: "2.2vw", color: "#CA922B", fontWeight: 800, opacity: 0.4 }}>01</div>
    </div>
  );
}
