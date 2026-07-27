const base = import.meta.env.BASE_URL;

export default function CB11Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      <div className="absolute inset-0">
        <img src={`${base}family-relocating.jpg`} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.13 }} />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0D0805 0%, rgba(13,8,5,0.7) 40%, rgba(13,8,5,0.7) 60%, #0D0805 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 52%, rgba(202,146,43,0.13) 0%, transparent 62%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center text-center" style={{ top: "10%", bottom: "10%", padding: "0 14vw" }}>

        {/* Top rule */}
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "4vw", opacity: 0.6 }} />

        {/* Lead-in */}
        <p className="font-body" style={{ fontSize: "1.35vw", color: "rgba(196,147,90,0.8)", letterSpacing: "0.04em", lineHeight: 1.6, marginBottom: "2.2vw" }}>
          Every community started with someone who cared enough to say&hellip;
        </p>

        {/* The quote — the whole point */}
        <div className="font-quote" style={{ fontSize: "4.8vw", fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.25, marginBottom: "3.2vw" }}>
          &ldquo;You should check this out.&rdquo;
        </div>

        {/* Bottom rule */}
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "3.2vw", opacity: 0.6 }} />

        {/* Call to action */}
        <p className="font-display" style={{ fontSize: "2vw", fontWeight: 800, color: "#CA922B", letterSpacing: "0.06em" }}>
          Become that person.
        </p>

        {/* Domain — quiet, not dominant */}
        <div className="font-body" style={{ fontSize: "0.85vw", color: "rgba(202,146,43,0.35)", letterSpacing: "0.22em", fontWeight: 600, marginTop: "5vw" }}>
          MAPPINGWITHMELANIN.COM
        </div>
      </div>
    </div>
  );
}
