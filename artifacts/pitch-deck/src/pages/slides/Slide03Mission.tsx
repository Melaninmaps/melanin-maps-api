export default function Slide03Mission() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0C0C0C", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37" }}>
      <div style={{ position: "absolute", top: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", bottom: 0, left: "5vw", right: "5vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", bottom: "3vh", left: "5vw", right: "5vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />
      <div style={{ position: "absolute", top: "3vh", right: "5vw", width: "1px", bottom: "3vh", background: "linear-gradient(180deg, transparent, rgba(212,175,55,0.3), transparent)" }} />

      <div style={{ padding: "7vh 10vw", display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", position: "relative", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw", marginBottom: "5vh" }}>
          <div style={{ width: "6vw", height: "1px", background: "#D4AF37" }} />
          <div style={{ fontSize: "1.5vw" }}>&#9670;</div>
          <div style={{ fontSize: "1vw", letterSpacing: "0.5em", textTransform: "uppercase", color: "rgba(212,175,55,0.7)" }}>Our Mission</div>
          <div style={{ fontSize: "1.5vw" }}>&#9670;</div>
          <div style={{ width: "6vw", height: "1px", background: "#D4AF37" }} />
        </div>

        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "5.5vw", fontWeight: 700, margin: "0 0 4vh 0", color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "0.02em", textWrap: "balance" }}>
          Discover, support, and celebrate minority-owned businesses wherever you go
        </h2>

        <div style={{ width: "12vw", height: "2px", background: "#D4AF37", margin: "0 auto 4vh" }} />

        <p style={{ fontSize: "2.8vw", color: "rgba(212,175,55,0.8)", lineHeight: 1.55, maxWidth: "62vw", margin: "0 auto", letterSpacing: "0.02em" }}>
          We are building the infrastructure of Black economic discovery — one neighborhood at a time
        </p>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5vw", marginTop: "6vh" }}>
          <div style={{ fontSize: "1.2vw" }}>&#9670;</div>
          <div style={{ fontSize: "1.2vw" }}>&#9670;</div>
          <div style={{ fontSize: "1.2vw" }}>&#9670;</div>
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", left: "8vw", right: "8vw", display: "flex", justifyContent: "space-between", fontSize: "1vw", letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)" }}>
        <span style={{ textTransform: "uppercase" }}>Mapping With Melanin / Confidential</span>
        <span>03</span>
      </div>
    </div>
  );
}
