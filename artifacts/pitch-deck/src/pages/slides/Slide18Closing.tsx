export default function Slide18Closing() {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif", position: "relative", color: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "2vh", left: "2vw", right: "2vw", bottom: "2vh", border: "1px solid rgba(212,175,55,0.5)" }} />
      <div style={{ position: "absolute", top: "3vh", left: "3vw", right: "3vw", bottom: "3vh", border: "1px solid rgba(212,175,55,0.15)" }} />
      <div style={{ position: "absolute", top: "2vh", left: "2vw", width: "4vw", height: "4vw", borderRight: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", top: "2vh", right: "2vw", width: "4vw", height: "4vw", borderLeft: "2px solid #D4AF37", borderBottom: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", left: "2vw", width: "4vw", height: "4vw", borderRight: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />
      <div style={{ position: "absolute", bottom: "2vh", right: "2vw", width: "4vw", height: "4vw", borderLeft: "2px solid #D4AF37", borderTop: "2px solid #D4AF37", background: "#0A0A0A" }} />

      <div style={{ position: "absolute", top: "50%", left: "4vw", width: "6vw", height: "1px", background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4))", transform: "translateY(-50%)" }} />
      <div style={{ position: "absolute", top: "50%", right: "4vw", width: "6vw", height: "1px", background: "linear-gradient(90deg, rgba(212,175,55,0.4), transparent)", transform: "translateY(-50%)" }} />

      <div style={{ textAlign: "center", position: "relative", padding: "0 8vw" }}>
        <div style={{ fontSize: "1.1vw", letterSpacing: "0.6em", textTransform: "uppercase", color: "rgba(212,175,55,0.55)", marginBottom: "4vh" }}>Mapping With Melanin™</div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "3vw", marginBottom: "4vh" }}>
          <div style={{ width: "10vw", height: "1px", background: "linear-gradient(90deg, transparent, #D4AF37)" }} />
          <div style={{ fontSize: "3vw" }}>&#9670;</div>
          <div style={{ width: "10vw", height: "1px", background: "linear-gradient(90deg, #D4AF37, transparent)" }} />
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "8vw", fontWeight: 700, margin: "0 0 2vh 0", lineHeight: 1, letterSpacing: "0.04em", color: "#FFFFFF", textTransform: "uppercase" }}>
          The Map<br />
          <span style={{ color: "#D4AF37" }}>is Us.</span>
        </h1>

        <div style={{ width: "12vw", height: "2px", background: "linear-gradient(90deg, transparent, #D4AF37, transparent)", margin: "4vh auto" }} />

        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: "3vw", color: "rgba(212,175,55,0.8)", lineHeight: 1.55, margin: "0 0 5vh 0", fontStyle: "italic" }}>
          Community. Culture. Commerce.<br />Mapped in Gold.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "6vw", marginBottom: "5vh" }}>
          <div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "0.8vh" }}>Website</div>
            <div style={{ fontSize: "2.2vw", color: "#FFFFFF" }}>www.melaninmap.com</div>
          </div>
          <div style={{ width: "1px", background: "rgba(212,175,55,0.3)" }} />
          <div>
            <div style={{ fontSize: "1vw", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(212,175,55,0.5)", marginBottom: "0.8vh" }}>Inquiries</div>
            <div style={{ fontSize: "2.2vw", color: "#FFFFFF" }}>hello@melaninmap.com</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "2vw" }}>
          <div style={{ width: "6vw", height: "1px", background: "rgba(212,175,55,0.4)" }} />
          <div style={{ fontSize: "1.2vw" }}>&#9670;</div>
          <div style={{ width: "6vw", height: "1px", background: "rgba(212,175,55,0.4)" }} />
        </div>
      </div>

      <div style={{ position: "absolute", bottom: "5vh", left: "8vw", right: "8vw", display: "flex", justifyContent: "space-between", fontSize: "1vw", letterSpacing: "0.2em", color: "rgba(212,175,55,0.4)" }}>
        <span style={{ textTransform: "uppercase" }}>Mapping With Melanin / Confidential</span>
        <span>18</span>
      </div>
    </div>
  );
}
