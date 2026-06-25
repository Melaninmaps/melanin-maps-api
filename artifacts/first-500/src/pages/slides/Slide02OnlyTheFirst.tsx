export default function Slide02OnlyTheFirst() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col justify-center pl-[8vw] pr-[10vw]">

      <div className="font-body text-primary text-[2.2vw] tracking-[0.4em] uppercase mb-[2.5vh]">
        The First 500
      </div>

      <div className="bg-primary w-full h-[0.15vh] mb-[5vh]" />

      <div className="font-display italic text-text text-[5.2vw] leading-tight mb-[5vh]" style={{ textWrap: "balance" as any }}>
        "Only the first 500 verified businesses will receive Founding Business status."
      </div>

      <div className="font-body text-muted text-[3.2vw] leading-relaxed">
        When this opportunity closes,
      </div>
      <div className="font-body font-medium text-primary text-[3.2vw] leading-relaxed">
        it closes.
      </div>

    </div>
  );
}
