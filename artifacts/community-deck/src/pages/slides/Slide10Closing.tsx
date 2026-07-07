const base = import.meta.env.BASE_URL;

export default function Slide10Closing() {
  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center" style={{ background: "#1C0E06" }}>
      <img
        src={`${base}bg-texture.png`}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.2 }}
        alt=""
      />
      <div className="absolute inset-0" style={{ background: "rgba(28,14,6,0.7)" }} />

      {/* Decorative frame */}
      <div className="absolute inset-[4vh_4vw]" style={{ border: "1px solid rgba(202,146,43,0.25)" }} />
      <div className="absolute bottom-[3vh] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.4 }}>10</div>

      <div className="relative flex flex-col items-center px-[14vw]">
        <div className="flex items-center justify-center gap-[2vw] mb-[3.5vh]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>

        <h2 className="font-display leading-tight tracking-tight mb-[3vh]" style={{ fontSize: "5vw", fontWeight: 900, color: "#FAF6EF" }}>
          This isn't just another app.
        </h2>

        <div className="gold-rule w-[14vw] mb-[3vh]" style={{ margin: "0 auto 3vh" }} />

        <p className="font-body mb-[4vh]" style={{ fontSize: "2.8vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.6 }}>
          It's a community that grows stronger every time someone shares what they know.
        </p>

        <div className="px-[3vw] py-[2vh] mb-[3.5vh]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.5)" }}>
          <div className="font-display" style={{ fontSize: "3.5vw", fontWeight: 900, color: "#CA922B", letterSpacing: "0.05em" }}>MAPPING WITH MELANIN™</div>
          <div className="font-body mt-[0.8vh]" style={{ fontSize: "2.3vw", fontWeight: 300, color: "#FAF6EF", letterSpacing: "0.18em" }}>YOU DON'T HAVE TO NAVIGATE LIFE ALONE</div>
        </div>

        <div className="flex items-center justify-center gap-[2vw]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>
      </div>
    </div>
  );
}
