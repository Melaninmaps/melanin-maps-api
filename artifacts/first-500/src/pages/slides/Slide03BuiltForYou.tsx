export default function Slide03BuiltForYou() {
  return (
    <div className="w-screen h-screen overflow-hidden relative bg-bg flex flex-col justify-center pl-[8vw] pr-[12vw]">

      <div className="font-body text-primary text-[2.2vw] tracking-[0.4em] uppercase mb-[2.5vh]">
        Built for You
      </div>

      <div className="bg-primary w-[75vw] h-[0.15vh] mb-[5.5vh]" />

      <div className="font-display font-bold text-text text-[5vw] leading-tight mb-[5vh]" style={{ textWrap: "balance" as any }}>
        We didn't build this platform to compete with small businesses.
      </div>

      <div className="font-display italic text-primary text-[4.2vw] leading-tight" style={{ textWrap: "balance" as any }}>
        We built it to help them grow.
      </div>

    </div>
  );
}
