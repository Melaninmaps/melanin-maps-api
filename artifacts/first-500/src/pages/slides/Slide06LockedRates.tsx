export default function Slide06LockedRates() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex items-center pl-[7vw] pr-[7vw] gap-[5vw]">

      <div className="flex flex-col items-start w-[28vw] shrink-0">
        <div className="font-display font-bold text-primary leading-none text-[14vw] tracking-tighter">
          01
        </div>
        <div className="bg-primary w-[22vw] h-[0.15vh] mt-[2.5vh] mb-[2vh]" />
        <div className="font-body text-muted text-[2.2vw] tracking-[0.3em] uppercase">
          Founding Benefit
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-display font-bold text-text text-[4.8vw] leading-tight mb-[3vh]" style={{ textWrap: "balance" as any }}>
          Locked Marketplace Rates
        </div>
        <div className="bg-primary w-[30vw] h-[0.15vh] mb-[3vh]" />
        <div className="font-body text-muted text-[2.8vw] leading-relaxed mb-[3.5vh]">
          Your fees are locked for 3 years — a thank you for joining at the beginning.
        </div>
        <div className="flex justify-between items-center border-b border-surface pb-[1.8vh] mb-[1.8vh]" style={{ borderBottomColor: 'rgba(201,168,76,0.25)' }}>
          <span className="font-body text-muted text-[2.8vw]">Community Business</span>
          <span className="font-display font-bold text-primary text-[3.8vw]">9%</span>
        </div>
        <div className="flex justify-between items-center border-b pb-[1.8vh] mb-[1.8vh]" style={{ borderBottomColor: 'rgba(201,168,76,0.25)' }}>
          <span className="font-body text-muted text-[2.8vw]">Growth Business</span>
          <span className="font-display font-bold text-primary text-[3.8vw]">7%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-body text-muted text-[2.8vw]">Premium Business</span>
          <span className="font-display font-bold text-primary text-[3.8vw]">5%</span>
        </div>
      </div>

    </div>
  );
}
