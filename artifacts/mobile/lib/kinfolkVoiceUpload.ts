import * as FileSystem from "expo-file-system";
import {
  createAndroidVoiceUploadPlan,
  inferKinfolkVoiceMimeType,
  type KinfolkVoiceMimeType,
} from "@/lib/kinfolkVoiceUploadPolicy";

export { createAndroidVoiceUploadPlan, inferKinfolkVoiceMimeType, type KinfolkVoiceMimeType } from "@/lib/kinfolkVoiceUploadPolicy";

export type PreparedKinfolkVoiceUpload = Readonly<{
  body: Blob;
  filename?: string;
  mimeType: KinfolkVoiceMimeType;
  cleanup: () => void;
}>;

function readM4aHeader(file: FileSystem.File): Uint8Array {
  const handle = file.open(FileSystem.FileMode.ReadOnly);
  try {
    return handle.readBytes(12);
  } finally {
    handle.close();
  }
}

function safeDelete(file: FileSystem.File): void {
  try {
    file.delete();
  } catch {
    // Recording files are transient. Cleanup is best effort after every path.
  }
}

/**
 * Prepares one transient native recording for the authenticated multipart
 * route. It intentionally uses no telemetry and never reads the recording
 * beyond Android's twelve-byte container preflight.
 */
export async function prepareKinfolkVoiceUpload(
  uri: string,
  platform: string,
): Promise<PreparedKinfolkVoiceUpload> {
  const recordingFile = new FileSystem.File(uri);
  try {
    const mimeType = inferKinfolkVoiceMimeType(uri);
    if (!mimeType) {
      throw new Error("This recording format is not supported. Please try again or type your question.");
    }

    if (platform === "android") {
      const plan = createAndroidVoiceUploadPlan(uri, recordingFile.type, readM4aHeader(recordingFile));
      // A Blob carries the explicitly canonical type through the Android
      // multipart bridge; the optional filename prevents a generic "blob"
      // filename from becoming a second metadata source.
      const body = new Blob([recordingFile], { type: plan.mimeType });
      return {
        body,
        filename: plan.filename,
        mimeType: plan.mimeType,
        cleanup: () => safeDelete(recordingFile),
      };
    }

    return {
      body: recordingFile,
      mimeType,
      cleanup: () => safeDelete(recordingFile),
    };
  } catch (error) {
    safeDelete(recordingFile);
    throw error;
  }
}
