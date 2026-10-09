type AbortEventSource = {
  aborted?: boolean;
  once(event: "aborted" | "close", listener: () => void): unknown;
  off?(event: "aborted" | "close", listener: () => void): unknown;
  removeListener?(event: "aborted" | "close", listener: () => void): unknown;
};

type TranscriptionResponse = AbortEventSource & {
  writableEnded?: boolean;
};

export type TranscriptionAbortScope = {
  signal: AbortSignal;
  wasClientCancelled(): boolean;
  dispose(): void;
};

/**
 * Couples provider transcription work to the originating HTTP connection. If
 * the member cancels a mobile recording after upload begins, the client aborts
 * fetch, the API response closes, and this scope aborts the provider request
 * instead of allowing raw audio to continue into transcription unattended.
 */
export function createTranscriptionAbortScope(
  request: AbortEventSource,
  response: TranscriptionResponse,
  timeoutMs: number,
): TranscriptionAbortScope {
  const controller = new AbortController();
  let clientCancelled = Boolean(request.aborted);
  const abortForRequest = () => {
    clientCancelled = true;
    controller.abort();
  };
  const abortForResponseClose = () => {
    if (!response.writableEnded) {
      clientCancelled = true;
      controller.abort();
    }
  };
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  if (clientCancelled) controller.abort();
  request.once("aborted", abortForRequest);
  response.once("close", abortForResponseClose);

  const remove = (source: AbortEventSource, event: "aborted" | "close", listener: () => void) => {
    if (source.off) source.off(event, listener);
    else source.removeListener?.(event, listener);
  };

  return {
    signal: controller.signal,
    wasClientCancelled: () => clientCancelled,
    dispose() {
      clearTimeout(timeout);
      remove(request, "aborted", abortForRequest);
      remove(response, "close", abortForResponseClose);
    },
  };
}
