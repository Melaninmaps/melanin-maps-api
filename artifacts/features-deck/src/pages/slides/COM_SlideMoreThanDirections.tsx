export default function SlideMoreThanDirections() {
  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center"
      style={{ background: "#1C0E06" }}
    >
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(202,146,43,0.13) 0%, transparent 65%)" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "linear-gradient(90deg,transparent,#CA922B,transparent)" }} />

      <div className="relative flex flex-col items-center" style={{ padding: "0 15vw" }}>
        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "4.5vw", opacity: 0.65 }} />

        <h1
          className="font-display"
          style={{ fontSize: "5.2vw", fontWeight: 800, color: "rgba(250,246,239,0.55)", lineHeight: 1.2, marginBottom: "3.5vw" }}
        >
          Most maps tell you how to get somewhere.
        </h1>

        <div style={{ width: "4vw", height: "2px", background: "#CA922B", marginBottom: "3.5vw", opacity: 0.65 }} />

        <h2
          className="font-display"
          style={{ fontSize: "5.2vw", fontWeight: 800, color: "#FAF6EF", lineHeight: 1.2, marginBottom: "0" }}
        >
          We help you understand what it{" "}
          <span style={{ color: "#CA922B" }}>feels like</span> when you get there.
        </h2>
      </div>
    </div>
  );
}
