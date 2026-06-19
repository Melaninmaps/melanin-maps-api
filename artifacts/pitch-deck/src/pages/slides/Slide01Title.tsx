export default function Slide01Title() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", bottom: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", right: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

      <div style={{ padding: "7vh 8vw", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", position: "relative", textAlign: "center" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw" }}>
            <div style={{ width: "8vw", height: "1px", background: "#D4AF37" }} />
            <div style={{ fontSize: "1vw", letterSpacing: "0.5em", textTransform: "uppercase" }}>Community Discovery Platform</div>
            <div style={{ width: "8vw", height: "1px", background: "#D4AF37" }} />
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1vw", marginBottom: "2vh" }}>
            <div style={{ fontSize: "2.5vw" }}>&#9670;</div>
            <div style={{ fontSize: "2.5vw" }}>&#9670;</div>
            <div style={{ fontSize: "2.5vw" }}>&#9670;</div>
          </div>
          <div style={{ fontSize: "1.4vw", letterSpacing: "0.8em", textTransform: "uppercase", marginBottom: "1.5vh", color: "rgba(212,175,55,0.8)" }}>
            Introducing
          </div>
          <h1 style={{ fontSize: "8vw", fontWeight: 700, margin: 0, lineHeight: 0.9, color: "#FFFFFF", letterSpacing: "0.08em", textTransform: "uppercase", textWrap: "balance" }}>
            Mapping With
          </h1>
          <h1 style={{ fontSize: "8vw", fontWeight: 700, margin: 0, lineHeight: 0.9, color: "#D4AF37", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Melanin
          </h1>
          <div style={{ width: "15vw", height: "2px", background: "#D4AF37", margin: "3vh auto" }} />
          <p style={{ fontSize: "1.6vw", color: "rgba(212,175,55,0.75)", letterSpacing: "0.12em", maxWidth: "50vw", margin: "0 auto", lineHeight: 1.6, textTransform: "uppercase" }}>
            Celebrate · Discover · Support
          </p>
        </div>

        <div style={{ fontSize: "1vw", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(212,175,55,0.45)" }}>
          www.melinanmap.com / MMXXVI
        </div>
      </div>
    </div>
  );
}
