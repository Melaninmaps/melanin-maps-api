export default function Slide07FoundingBadge() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex items-center pl-[7vw] pr-[7vw] gap-[5vw]">

      <div className="flex flex-col items-start w-[28vw] shrink-0">
        <div className="font-display font-bold text-primary leading-none text-[14vw] tracking-tighter">
          02
        </div>
        <div className="bg-primary w-[22vw] h-[0.15vh] mt-[2.5vh] mb-[2vh]" />
        <div className="font-body text-muted text-[2.2vw] tracking-[0.3em] uppercase">
          Founding Benefit
        </div>
      </div>

      <div className="flex flex-col flex-1">
        <div className="font-display font-bold text-text text-[4.8vw] leading-tight mb-[3vh]" style={{ textWrap: "balance" as any }}>
          Founding Business Badge
        </div>
        <div className="bg-primary w-[30vw] h-[0.15vh] mb-[3.5vh]" />
        <div className="font-body text-muted text-[3.2vw] leading-relaxed mb-[3vh]">
          Permanently displayed on your profile and listing.
        </div>
        <div className="font-display italic text-text text-[3.8vw] leading-snug" style={{ textWrap: "balance" as any }}>
          Your customers will know you helped build this community.
        </div>
      </div>

    </div>
  );
}
