export default function Slide08SixMonthsPremium() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex items-center pl-[7vw] pr-[7vw] gap-[5vw]">

      <div className="flex flex-col items-start w-[28vw] shrink-0">
        <div className="font-display font-bold text-primary leading-none text-[14vw] tracking-tighter">
          03
        </div>
        <div className="bg-primary w-[22vw] h-[0.15vh] mt-[2.5vh] mb-[2vh]" />
        <div className="font-body text-muted text-[2.2vw] tracking-[0.3em] uppercase">
          Founding Benefit
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-display font-bold text-text text-[4.8vw] leading-tight mb-[3vh]">
          Six Months of Premium
        </div>
        <div className="bg-primary w-[30vw] h-[0.15vh] mb-[3.5vh]" />
        <div className="font-body text-muted text-[2.8vw] leading-relaxed mb-[3vh]">
          Full Premium Business access from day one.
        </div>
        <div className="flex flex-col gap-[2vh]">
          <div className="flex items-center gap-[2.5vw]">
            <div className="bg-primary w-[0.8vw] h-[0.8vw] shrink-0" style={{ borderRadius: '50%' }} />
            <span className="font-body text-text text-[3vw]">AI business tools</span>
          </div>
          <div className="flex items-center gap-[2.5vw]">
            <div className="bg-primary w-[0.8vw] h-[0.8vw] shrink-0" style={{ borderRadius: '50%' }} />
            <span className="font-body text-text text-[3vw]">Enhanced analytics</span>
          </div>
          <div className="flex items-center gap-[2.5vw]">
            <div className="bg-primary w-[0.8vw] h-[0.8vw] shrink-0" style={{ borderRadius: '50%' }} />
            <span className="font-body text-text text-[3vw]">Priority search placement</span>
          </div>
          <div className="flex items-center gap-[2.5vw]">
            <div className="bg-primary w-[0.8vw] h-[0.8vw] shrink-0" style={{ borderRadius: '50%' }} />
            <span className="font-body text-text text-[3vw]">Dedicated onboarding support</span>
          </div>
        </div>
      </div>

    </div>
  );
}
