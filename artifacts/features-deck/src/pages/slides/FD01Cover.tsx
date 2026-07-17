export default function FD01Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0A0603" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(202,146,43,0.18) 0%, transparent 60%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.35),transparent)" }} />

      <div className="absolute top-[4.5vw] left-[6vw] font-body" style={{ fontSize: "1.1vw", color: "#CA922B", letterSpacing: "0.28em", fontWeight: 600 }}>
        MAPPING WITH MELANIN&trade;
      </div>
      <div className="absolute top-[4.5vw] right-[6vw] font-body" style={{ fontSize: "1vw", color: "#5A3A18", letterSpacing: "0.2em", fontWeight: 500 }}>
        PLATFORM FEATURES
      </div>

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center" style={{ top: "15%", bottom: "15%" }}>
        <h1 className="font-display text-center" style={{ fontSize: "6.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.08, marginBottom: "3vw", maxWidth: "72vw" }}>
          Never wonder if you&rsquo;ll feel<br />
          <span style={{ color: "#CA922B" }}>welcome</span> again.
        </h1>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "3vw", opacity: 0.8 }} />
        <div className="font-body text-center" style={{ fontSize: "1.7vw", color: "#7B5408", fontWeight: 300, lineHeight: 1.7, maxWidth: "44vw" }}>
          Every feature in Mapping With Melanin exists<br />to answer one question before you have to ask it.
        </div>
      </div>

      <div className="absolute bottom-[4.5vw] left-0 right-0 flex justify-center">
        <div className="font-body" style={{ fontSize: "0.95vw", color: "#3D2008", letterSpacing: "0.18em" }}>
          mappingwithmelanin.com
        </div>
      </div>
    </div>
  );
}
