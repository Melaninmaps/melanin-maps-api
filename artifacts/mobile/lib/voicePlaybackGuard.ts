export interface VoicePlaybackRequest {
  generation: number;
  signal: AbortSignal;
}

export interface VoicePlaybackGuard {
  begin: () => VoicePlaybackRequest;
  invalidate: (reason?: string) => void;
  isCurrent: (request: VoicePlaybackRequest) => boolean;
  canPlay: (request: VoicePlaybackRequest) => boolean;
  finish: (request: VoicePlaybackRequest) => void;
}

export function createVoicePlaybackGuard(isPlaybackAllowed: () => boolean): VoicePlaybackGuard {
  let generation = 0;
  let controller: AbortController | null = null;

  const isCurrent = (request: VoicePlaybackRequest) =>
    request.generation === generation && !request.signal.aborted;

  return {
    begin() {
      controller?.abort("superseded");
      generation += 1;
      controller = new AbortController();
      return { generation, signal: controller.signal };
    },
    invalidate(reason = "invalidated") {
      generation += 1;
      controller?.abort(reason);
      controller = null;
    },
    isCurrent,
    canPlay(request) {
      return isCurrent(request) && isPlaybackAllowed();
    },
    finish(request) {
      if (isCurrent(request)) controller = null;
    },
  };
}
