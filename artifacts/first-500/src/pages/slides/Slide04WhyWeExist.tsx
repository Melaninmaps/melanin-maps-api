export default function Slide04WhyWeExist() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col items-center justify-center px-[10vw] text-center">

      <div className="font-body text-primary text-[2.2vw] tracking-[0.4em] uppercase mb-[3vh]">
        Why We Exist
      </div>

      <div className="bg-primary w-[12vw] h-[0.15vh] mb-[5vh]" />

      <div className="font-display italic text-text text-[4.8vw] leading-snug mb-[5vh]" style={{ textWrap: "balance" as any }}>
        We believe discovering and supporting minority-owned businesses should be easier.
      </div>

      <div className="font-body text-muted text-[3.2vw] leading-relaxed" style={{ textWrap: "balance" as any }}>
        That's why we're building something bigger than a directory.
      </div>

    </div>
  );
}
