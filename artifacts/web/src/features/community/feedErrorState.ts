export type CommunityFeedErrorState =
  | { kind: "none" }
  | { kind: "auth"; title: string; message: string }
  | { kind: "server"; title: string; message: string };

export function communityFeedErrorState(status: number | null, requestId?: string | null): CommunityFeedErrorState {
  if (status === null) return { kind: "none" };
  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      title: "Sign in required",
      message: "Your session has ended. Sign in again to load the Community feed.",
    };
  }
  return {
    kind: "server",
    title: "Couldn't refresh the feed",
    message: requestId
      ? `The posts already on screen are still available. Try again, or contact support with request ID ${requestId}.`
      : "The posts already on screen are still available. Try again; if this keeps happening, contact support.",
  };
}
