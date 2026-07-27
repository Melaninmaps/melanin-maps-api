const base = import.meta.env.BASE_URL;

export default function CB11Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0">
        <img
          src={`${base}hero-welcome.png`}
          crossOrigin="anonymous"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.15, objectPosition: "center center" }}
        />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0D0805 0%, rgba(13,8,5,0.65) 40%, rgba(13,8,5,0.65) 60%, #0D0805 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 52%, rgba(202,146,43,0.14) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      <div
        className="absolute left-0 right-0 flex flex-col items-center justify-center text-center"
        style={{ top: "8%", bottom: "8%", padding: "0 14vw" }}
      >
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "4.5vw", opacity: 0.65 }} />

        <h1
          className="font-display"
          style={{ fontSize: "8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.0, marginBottom: "0" }}
        >
          Welcome
        </h1>
        <h1
          className="font-display"
          style={{ fontSize: "8vw", fontWeight: 800, color: "#CA922B", lineHeight: 1.0, marginBottom: "3.5vw" }}
        >
          Home.
        </h1>

        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "3.5vw", opacity: 0.65 }} />

        <p
          className="font-body"
          style={{ fontSize: "1.9vw", color: "#C4935A", fontWeight: 300, lineHeight: 1.7, marginBottom: "4.5vw", maxWidth: "54vw" }}
        >
          Home isn&rsquo;t always where you were born.<br />
          Sometimes it&rsquo;s where you finally feel understood.<br />
          <span style={{ color: "#FAF6EF" }}>That&rsquo;s what we&rsquo;re building.</span>
        </p>

        <div
          style={{ padding: "1.4vw 3vw", background: "rgba(202,146,43,0.12)", border: "1px solid rgba(202,146,43,0.45)", marginBottom: "4vw" }}
        >
          <div className="font-display" style={{ fontSize: "2.8vw", fontWeight: 900, color: "#CA922B", letterSpacing: "0.05em" }}>
            MAPPING WITH MELANIN&trade;
          </div>
          <div className="font-body" style={{ fontSize: "1.1vw", fontWeight: 300, color: "#FAF6EF", letterSpacing: "0.18em", marginTop: "0.5vw" }}>
            A BELONGING PLATFORM &mdash; WHEREVER LIFE TAKES YOU
          </div>
        </div>

        <div className="font-body" style={{ fontSize: "0.85vw", color: "rgba(202,146,43,0.38)", letterSpacing: "0.22em", fontWeight: 600 }}>
          MAPPINGWITHMELANIN.COM
        </div>
      </div>
    </div>
  );
}
