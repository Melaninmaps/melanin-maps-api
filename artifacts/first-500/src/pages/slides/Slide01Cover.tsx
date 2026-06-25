export default function Slide01Cover() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col items-center justify-between pt-[5.5vh] pb-[6vh]">

      <div className="font-body text-muted text-[2.2vw] tracking-[0.5em] uppercase">
        Mapping With Melanin™
      </div>

      <div className="flex flex-col items-center">
        <div className="font-body font-medium text-text text-[3.8vw] tracking-[0.7em] uppercase mb-[1vh]">
          The First
        </div>
        <div className="font-display font-bold text-primary leading-none tracking-tighter text-[17vw]">
          500
        </div>
        <div className="bg-primary w-[17vw] h-[0.2vh] mt-[3vh] mb-[3vh]" />
        <div className="font-body text-text text-[2.5vw] tracking-[0.42em] uppercase">
          Founding Business Program
        </div>
      </div>

      <div className="font-display italic text-primary text-[3.2vw] text-center leading-snug" style={{ textWrap: "balance" as any }}>
        Will your business be one of The First 500?
      </div>

    </div>
  );
}
