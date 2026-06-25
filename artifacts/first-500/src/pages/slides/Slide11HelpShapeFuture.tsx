export default function Slide11HelpShapeFuture() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex items-center pl-[7vw] pr-[7vw] gap-[5vw]">

      <div className="flex flex-col items-start w-[28vw] shrink-0">
        <div className="font-display font-bold text-primary leading-none text-[14vw] tracking-tighter">
          06
        </div>
        <div className="bg-primary w-[22vw] h-[0.15vh] mt-[2.5vh] mb-[2vh]" />
        <div className="font-body text-muted text-[2.2vw] tracking-[0.3em] uppercase">
          Founding Benefit
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-display font-bold text-text text-[4.8vw] leading-tight mb-[3vh]">
          Help Shape the Future
        </div>
        <div className="bg-primary w-[30vw] h-[0.15vh] mb-[3.5vh]" />
        <div className="font-body text-muted text-[3.2vw] leading-relaxed mb-[3vh]">
          Every platform has early believers.
        </div>
        <div className="font-display italic text-text text-[3.8vw] leading-snug mb-[3vh]">
          Our Founding Businesses are ours.
        </div>
        <div className="font-body text-muted text-[2.8vw] leading-relaxed" style={{ textWrap: "balance" as any }}>
          Your feedback, your experience, your voice shapes what this becomes.
        </div>
      </div>

    </div>
  );
}
