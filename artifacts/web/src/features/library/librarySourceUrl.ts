import { safePublicExternalHref } from "../../lib/publicExternalUrl";

/** Only visible HTTPS links leave the app; unsafe schemes and credentials are rejected. */
export function safeLibrarySourceHref(value: string): string | null {
  return safePublicExternalHref(value);
}
