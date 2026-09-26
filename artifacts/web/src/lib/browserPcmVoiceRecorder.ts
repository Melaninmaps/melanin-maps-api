export type BrowserPcmVoiceRecorder = Readonly<{
  stop: () => Blob;
  discard: () => void;
}>;

const TARGET_SAMPLE_RATE = 16_000;

type AudioContextConstructor = new () => AudioContext;
type AudioContextWindow = Window & typeof globalThis & {
  webkitAudioContext?: AudioContextConstructor;
};

function audioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;
  return window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext ?? null;
}

export function canRecordBrowserPcm(): boolean {
  const AudioContextClass = audioContextConstructor();
  return Boolean(AudioContextClass && AudioContextClass.prototype.createMediaStreamSource && AudioContextClass.prototype.createScriptProcessor);
}

/**
 * Creates a compact mono PCM WAV blob. Keeping this pure makes it possible to
 * verify the uploaded container without retaining or exposing member audio.
 */
export function encodePcm16Wav(chunks: readonly Float32Array[], sourceSampleRate: number): Blob {
  if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) {
    throw new Error("INVALID_AUDIO_SAMPLE_RATE");
  }
  const totalInputSamples = chunks.reduce((total, chunk) => total + chunk.length, 0);
  if (totalInputSamples === 0) return new Blob([], { type: "audio/wav" });

  const source = new Float32Array(totalInputSamples);
  let sourceOffset = 0;
  for (const chunk of chunks) {
    source.set(chunk, sourceOffset);
    sourceOffset += chunk.length;
  }

  const outputSampleRate = Math.min(TARGET_SAMPLE_RATE, Math.round(sourceSampleRate));
  const outputLength = Math.max(1, Math.floor(source.length * outputSampleRate / sourceSampleRate));
  const bytes = new ArrayBuffer(44 + outputLength * 2);
  const view = new DataView(bytes);
  const writeText = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index++) view.setUint8(offset + index, value.charCodeAt(index));
  };

  writeText(0, "RIFF");
  view.setUint32(4, 36 + outputLength * 2, true);
  writeText(8, "WAVE");
  writeText(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // linear PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, outputSampleRate, true);
  view.setUint32(28, outputSampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeText(36, "data");
  view.setUint32(40, outputLength * 2, true);

  for (let outputIndex = 0; outputIndex < outputLength; outputIndex++) {
    const sourceStart = Math.floor(outputIndex * sourceSampleRate / outputSampleRate);
    const sourceEnd = Math.max(sourceStart + 1, Math.floor((outputIndex + 1) * sourceSampleRate / outputSampleRate));
    let total = 0;
    let count = 0;
    for (let inputIndex = sourceStart; inputIndex < Math.min(sourceEnd, source.length); inputIndex++) {
      total += source[inputIndex]!;
      count++;
    }
    const sample = Math.max(-1, Math.min(1, count ? total / count : 0));
    view.setInt16(44 + outputIndex * 2, sample < 0 ? Math.round(sample * 0x8000) : Math.round(sample * 0x7fff), true);
  }

  return new Blob([bytes], { type: "audio/wav" });
}

/**
 * Safari's MediaRecorder emits fragmented M4A in several supported versions.
 * Capture PCM directly from the same microphone stream for that narrow path,
 * so Kinfolk uploads a standards-based WAV container instead of a fragmented
 * browser-specific MP4. Audio stays in memory only until the caller uploads or
 * discards it.
 */
export async function startBrowserPcmVoiceRecorder(stream: MediaStream): Promise<BrowserPcmVoiceRecorder> {
  const AudioContextClass = audioContextConstructor();
  if (!AudioContextClass) throw new Error("AUDIO_CONTEXT_UNSUPPORTED");
  const context = new AudioContextClass();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(4_096, 1, 1);
  const silentGain = context.createGain();
  silentGain.gain.value = 0;
  const chunks: Float32Array[] = [];
  let released = false;

  processor.onaudioprocess = (event) => {
    // Copy data immediately. AudioBuffer memory is reused by the browser after
    // this callback returns.
    chunks.push(new Float32Array(event.inputBuffer.getChannelData(0)));
  };
  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(context.destination);
  if (context.state === "suspended") await context.resume();

  const release = () => {
    if (released) return;
    released = true;
    processor.onaudioprocess = null;
    try { source.disconnect(); } catch { /* already released */ }
    try { processor.disconnect(); } catch { /* already released */ }
    try { silentGain.disconnect(); } catch { /* already released */ }
    stream.getTracks().forEach((track) => track.stop());
    void context.close();
  };

  return {
    stop: () => {
      release();
      const blob = encodePcm16Wav(chunks, context.sampleRate);
      chunks.length = 0;
      return blob;
    },
    discard: () => {
      release();
      chunks.length = 0;
    },
  };
}
