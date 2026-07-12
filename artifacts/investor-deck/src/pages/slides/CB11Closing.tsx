const base = import.meta.env.BASE_URL;

export default function CB11Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0D0805" }}>
      {/* Photo overlay */}
      <div className="absolute inset-0">
        <img src={`${base}family-relocating.jpg`} crossOrigin="anonymous" alt="" className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.18 }} />
      </div>
      <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, #0D0805 0%, rgba(13,8,5,0.75) 40%, rgba(13,8,5,0.75) 60%, #0D0805 100%)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.12) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,rgba(202,146,43,0.4),transparent)" }} />

      <div className="absolute left-0 right-0 flex flex-col items-center justify-center text-center" style={{ top: "12%", bottom: "12%", padding: "0 12vw" }}>
        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "3.5vw", opacity: 0.7 }} />

        <div className="font-quote" style={{ fontSize: "3.6vw", fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.35, fontWeight: 400, marginBottom: "1.4vw" }}>
          Communities don&rsquo;t happen by accident.
        </div>
        <div className="font-quote" style={{ fontSize: "3.6vw", fontStyle: "italic", color: "#FAF6EF", lineHeight: 1.35, fontWeight: 400, marginBottom: "3.8vw" }}>
          They happen because people choose to build them.
        </div>

        <div style={{ width: "5vw", height: "3px", background: "#CA922B", marginBottom: "3.5vw", opacity: 0.7 }} />

        <div className="font-display" style={{ fontSize: "2.2vw", fontWeight: 800, color: "#CA922B", letterSpacing: "0.04em" }}>
          Welcome to Mapping with Melanin&trade;.
        </div>

        <div className="font-body" style={{ fontSize: "1vw", color: "rgba(202,146,43,0.45)", letterSpacing: "0.22em", fontWeight: 600, marginTop: "3vw" }}>
          MAPPINGWITHMELANIN.COM
        </div>
      </div>
    </div>
  );
}
