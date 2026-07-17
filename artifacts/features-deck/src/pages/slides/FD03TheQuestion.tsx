export default function FD03TheQuestion() {
  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center" style={{ background: "#08040200" }}>
      <div className="absolute inset-0" style={{ background: "#080402" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.1) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />
      <div className="absolute bottom-[1.7vw] right-[5vw] font-display" style={{ fontSize: "2vw", color: "#CA922B", fontWeight: 700, opacity: 0.28 }}>03</div>

      <div className="flex flex-col items-center text-center" style={{ maxWidth: "68vw" }}>
        <div className="font-quote" style={{ fontSize: "1.4vw", color: "#5A3A18", fontStyle: "italic", letterSpacing: "0.08em", marginBottom: "3.5vw" }}>
          The question every melanated traveler carries.
        </div>
        <h1 className="font-display" style={{ fontSize: "5.8vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.05, marginBottom: "3.5vw" }}>
          &ldquo;Will I be<br /><span style={{ color: "#CA922B" }}>safe here?</span>&rdquo;
        </h1>
        <div style={{ width: "5vw", height: "2px", background: "rgba(202,146,43,0.5)", marginBottom: "3.5vw" }} />
        <p className="font-body" style={{ fontSize: "1.5vw", color: "#6B4420", lineHeight: 1.8 }}>
          Not just physically safe.<br />
          <em style={{ color: "#8A6030" }}>Welcomed. Respected. At home.</em>
        </p>
        <div style={{ marginTop: "4vw", padding: "1.4vw 2.4vw", borderRadius: "0.6vw", border: "1px solid rgba(202,146,43,0.2)", background: "rgba(202,146,43,0.05)" }}>
          <p className="font-body" style={{ fontSize: "1.2vw", color: "#7B5408", lineHeight: 1.65 }}>
            Mapping With Melanin is the answer to that question &mdash; before you have to ask it.
          </p>
        </div>
      </div>
    </div>
  );
}
