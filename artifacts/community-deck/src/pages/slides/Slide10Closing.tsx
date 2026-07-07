const base = import.meta.env.BASE_URL;

export default function Slide10Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#1C0E06" }}>
      {/* Background texture */}
      <img
        src={`${base}bg-texture.png`}
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: 0.25 }}
        alt=""
      />
      <div className="absolute inset-0" style={{ background: "rgba(28,14,6,0.65)" }} />

      {/* Decorative gold frame lines */}
      <div className="absolute top-[6vh] left-[6vw] right-[6vw] h-[1px]" style={{ background: "rgba(202,146,43,0.3)" }} />
      <div className="absolute bottom-[6vh] left-[6vw] right-[6vw] h-[1px]" style={{ background: "rgba(202,146,43,0.3)" }} />
      <div className="absolute left-[6vw] top-[6vh] bottom-[6vh] w-[1px]" style={{ background: "rgba(202,146,43,0.3)" }} />
      <div className="absolute right-[6vw] top-[6vh] bottom-[6vh] w-[1px]" style={{ background: "rgba(202,146,43,0.3)" }} />

      {/* Centered content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-[14vw]">
        <div className="flex items-center justify-center gap-[2vw] mb-[4vh]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>

        <h2 className="font-display text-accent leading-tight tracking-tight mb-[3vh]" style={{ fontSize: "5.5vw", fontWeight: 900, textWrap: "balance" }}>
          This isn't just another app.
        </h2>

        <div className="gold-rule w-[16vw] mb-[3.5vh]" style={{ margin: "0 auto" }} />

        <p className="font-body mb-[4.5vh]" style={{ fontSize: "3.2vw", fontWeight: 300, color: "#E8B86D", lineHeight: 1.6, textWrap: "pretty" }}>
          It's a community that grows stronger every time someone shares what they know.
        </p>

        <div className="px-[3vw] py-[2vh]" style={{ background: "rgba(202,146,43,0.15)", border: "1px solid rgba(202,146,43,0.5)" }}>
          <div className="font-display text-primary" style={{ fontSize: "4vw", fontWeight: 900, letterSpacing: "0.05em" }}>MAPPING WITH MELANIN™</div>
          <div className="font-body text-accent mt-[0.8vh]" style={{ fontSize: "2.6vw", fontWeight: 300, letterSpacing: "0.2em" }}>YOU DON'T HAVE TO NAVIGATE LIFE ALONE</div>
        </div>

        <div className="flex items-center justify-center gap-[2vw] mt-[4vh]">
          <div className="gold-rule" style={{ width: "5vw" }} />
          <div className="gold-dot" />
          <div className="gold-rule" style={{ width: "5vw" }} />
        </div>
      </div>
    </div>
  );
}
