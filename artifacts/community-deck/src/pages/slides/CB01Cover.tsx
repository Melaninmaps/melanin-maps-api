const base = import.meta.env.BASE_URL;

export default function CB01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute right-0 top-0 w-[52vw] h-full">
        <img
          src={`${base}hero-family.png`}
          crossOrigin="anonymous"
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: "center center" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, #0D0805 0%, rgba(13,8,5,0.65) 42%, transparent 100%)" }} />
      </div>

      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 28% 60%, rgba(202,146,43,0.16) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.35),transparent)" }} />

      <div className="absolute top-[4.5vw] left-[6vw] font-body" style={{ fontSize: "1.85vw", color: "#E4A93A", letterSpacing: "0.22em", fontWeight: 500 }}>
        MAPPING WITH MELANIN&trade;
      </div>

      <div className="absolute flex flex-col justify-center" style={{ left: "6vw", top: "12%", bottom: "12%", width: "54vw" }}>
        <div className="font-body" style={{ fontSize: "1.05vw", color: "#CA922B", letterSpacing: "0.32em", fontWeight: 600, marginBottom: "2.8vw" }}>
          A BELONGING PLATFORM
        </div>
        <h1 className="font-display" style={{ fontSize: "7.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0" }}>
          Welcome
        </h1>
        <h1 className="font-display" style={{ fontSize: "7.8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.0, marginBottom: "3vw" }}>
          Home.
        </h1>
        <div style={{ width: "6vw", height: "3px", background: "#CA922B", marginBottom: "2.8vw", opacity: 0.8 }} />
        <p className="font-body" style={{ fontSize: "1.9vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.65, maxWidth: "44vw" }}>
          Home isn&rsquo;t always where you were born.<br />
          Sometimes it&rsquo;s where you finally feel understood.
        </p>
      </div>

      <div className="absolute bottom-[3.5vw] left-[6vw] font-body" style={{ fontSize: "0.85vw", color: "rgba(202,146,43,0.38)", letterSpacing: "0.22em", fontWeight: 600 }}>
        MAPPINGWITHMELANIN.COM
      </div>
    </div>
  );
}
