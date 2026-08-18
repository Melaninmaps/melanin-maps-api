import { type Express, type Request, type Response } from "express";
import multer from "multer";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set(["audio/webm", "audio/webm;codecs=opus", "audio/mp4", "audio/m4a", "audio/wav"]);

type AuthenticatedRequest = Request & { user?: { id: string } };
type UploadedAudioRequest = AuthenticatedRequest & { file?: Express.Multer.File };

type VoiceTranscriptionProvider = {
  transcribe(input: { audio: Buffer; filename: string; mimeType: string }): Promise<string>;
};

type VoiceDiagnostics = {
  record(input: {
    memberId: string;
    stage: "received" | "rejected" | "transcribed" | "failed";
    code: string;
    mimeType: string | null;
    byteCount: number | null;
    detail: string | null;
  }): Promise<void>;
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
});

function recordSafely(diagnostics: VoiceDiagnostics, input: Parameters<VoiceDiagnostics["record"]>[0]): void {
  void diagnostics.record(input).catch((error) => console.error("Voice diagnostic event was not recorded", error));
}

export function registerVoiceTranscriptionRoute(
  app: Express,
  dependencies: { transcriptionProvider: VoiceTranscriptionProvider; diagnostics: VoiceDiagnostics },
): void {
  app.post("/api/kinfolk/transcribe", upload.single("audio"), async (request: UploadedAudioRequest, response: Response) => {
    const memberId = request.user?.id;
    if (!memberId) return response.status(401).json({ error: "Sign in is required to use voice input.", code: "AUTH_REQUIRED" });

    const audio = request.file;
    if (!audio) {
      recordSafely(dependencies.diagnostics, {
        memberId,
        stage: "rejected",
        code: "AUDIO_MISSING",
        mimeType: null,
        byteCount: null,
        detail: "Multipart audio field was absent.",
      });
      return response.status(400).json({
        error: "Kinfolk did not receive an audio recording. Please record again and press stop before sending.",
        code: "AUDIO_MISSING",
      });
    }

    const mimeType = request.body?.mimeType || audio.mimetype;
    if (!ACCEPTED_MIME_TYPES.has(mimeType)) {
      recordSafely(dependencies.diagnostics, {
        memberId,
        stage: "rejected",
        code: "TRANSCRIPTION_UNSUPPORTED",
        mimeType,
        byteCount: audio.size,
        detail: "Unsupported browser recording MIME type.",
      });
      return response.status(415).json({
        error: "This browser recorded an audio format Kinfolk cannot transcribe yet. Try the latest Chrome, Edge, Safari, or Firefox.",
        code: "TRANSCRIPTION_UNSUPPORTED",
        detail: `Received MIME type: ${mimeType}`,
      });
    }

    recordSafely(dependencies.diagnostics, {
      memberId,
      stage: "received",
      code: "AUDIO_RECEIVED",
      mimeType,
      byteCount: audio.size,
      detail: null,
    });

    try {
      const transcript = await dependencies.transcriptionProvider.transcribe({
        audio: audio.buffer,
        filename: audio.originalname || "kinfolk-recording.webm",
        mimeType,
      });
      recordSafely(dependencies.diagnostics, {
        memberId,
        stage: "transcribed",
        code: "TRANSCRIPTION_COMPLETE",
        mimeType,
        byteCount: audio.size,
        detail: `Transcript length: ${transcript.length}`,
      });
      return response.status(200).json({ transcript: transcript.trim() });
    } catch (caught: unknown) {
      const detail = (caught as Error).message || "Unknown transcription provider error.";
      recordSafely(dependencies.diagnostics, {
        memberId,
        stage: "failed",
        code: "TRANSCRIPTION_PROVIDER_FAILED",
        mimeType,
        byteCount: audio.size,
        detail,
      });
      return response.status(502).json({
        error: "Kinfolk received your recording but could not transcribe it. Please try again or type your message.",
        code: "TRANSCRIPTION_PROVIDER_FAILED",
        detail,
      });
    }
  });
}
