export default function Slide09PriorityOnboarding() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex items-center pl-[7vw] pr-[7vw] gap-[5vw]">

      <div className="flex flex-col items-start w-[28vw] shrink-0">
        <div className="font-display font-bold text-primary leading-none text-[14vw] tracking-tighter">
          04
        </div>
        <div className="bg-primary w-[22vw] h-[0.15vh] mt-[2.5vh] mb-[2vh]" />
        <div className="font-body text-muted text-[2.2vw] tracking-[0.3em] uppercase">
          Founding Benefit
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-display font-bold text-text text-[4.8vw] leading-tight mb-[3vh]">
          Priority Onboarding
        </div>
        <div className="bg-primary w-[30vw] h-[0.15vh] mb-[3.5vh]" />
        <div className="font-body text-muted text-[3.2vw] leading-relaxed mb-[4vh]" style={{ textWrap: "balance" as any }}>
          Our team works with you directly to get your listing live, verified, and performing.
        </div>
        <div className="font-display italic text-primary text-[3.8vw] leading-snug">
          No waiting in line.
        </div>
      </div>

    </div>
  );
}
