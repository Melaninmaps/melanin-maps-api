import { GoldFeatherMark } from "@/components/brand/GoldFeatherMark";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";

export default function KinfolkVoiceInput({ onTranscript }: { onTranscript: (transcript: string) => void }) {
  const { state, voiceDiagnostic, startRecording, stopRecording, clearDiagnostic } = useVoiceRecorder(onTranscript);
  const recording = state === "recording";
  const busy = state === "requesting_permission" || state === "uploading";

  return (
    <div className="relative">
      <button
        aria-label={recording ? "Stop recording" : "Start voice recording"}
        className={`inline-flex h-11 w-11 items-center justify-center rounded-full border ${
          recording
            ? "border-[#8D5C17] bg-[#CA922B]/20"
            : "border-[#CA922B]/60 bg-white"
        } disabled:opacity-60`}
        disabled={busy}
        onClick={() => (recording ? void stopRecording() : void startRecording())}
        type="button"
      >
        <GoldFeatherMark
          label={recording ? "Stop voice recording" : "Start voice recording"}
          size={20}
        />
      </button>

      <span aria-live="polite" className="sr-only">
        {state === "recording"
          ? "Recording voice message"
          : state === "uploading"
          ? "Transcribing voice message"
          : ""}
      </span>

      {recording ? (
        <p className="absolute bottom-full left-0 mb-2 whitespace-nowrap text-xs font-semibold text-[#8D5C17]">
          Recording — press again when you are finished.
        </p>
      ) : null}
      {state === "uploading" ? (
        <p className="absolute bottom-full left-0 mb-2 whitespace-nowrap text-xs font-semibold text-[#8D5C17]">
          Transcribing your recording…
        </p>
      ) : null}

      {voiceDiagnostic ? (
        <aside
          className="absolute bottom-full left-0 z-20 mb-3 w-80 rounded-xl border border-[#8D5C17]/30 bg-white p-4 shadow-lg"
          role="alert"
        >
          <div className="flex gap-2">
            <GoldFeatherMark label="Voice input issue" size={17} />
            <p className="font-semibold text-[#2B1507]">Voice input needs attention</p>
          </div>
          <p className="mt-2 text-sm leading-6 text-[#3A1F0E]/75">{voiceDiagnostic.message}</p>
          <button
            className="mt-3 text-sm font-semibold text-[#8D5C17] underline"
            onClick={clearDiagnostic}
            type="button"
          >
            Dismiss
          </button>
        </aside>
      ) : null}
    </div>
  );
}
